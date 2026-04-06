from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth.models import User

from .models import OpponentRequest, MatchmakingMatch
from .serializers import (
    OpponentRequestSerializer,
    OpponentRequestCreateSerializer,
    MatchmakingMatchSerializer,
    MatchmakingMatchCreateSerializer,
    MatchmakingMatchConfirmSerializer,
    UserBasicSerializer,
)


class OpponentRequestViewSet(viewsets.ModelViewSet):
    queryset = OpponentRequest.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['user__username', 'notes']
    ordering_fields = ['created_at', 'expires_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return OpponentRequestCreateSerializer
        return OpponentRequestSerializer

    def get_queryset(self):
        user = self.request.user
        
        # Admin thấy tất cả
        if user.is_staff:
            return OpponentRequest.objects.filter(status='active')
        
        # User thấy các yêu cầu từ người khác + yêu cầu của chính họ
        return OpponentRequest.objects.filter(
            Q(status='active') | Q(user=user)
        ).exclude(user=user)  # Không thấy yêu cầu của chính mình

    @action(
        detail=False,
        methods=['GET'],
        permission_classes=[permissions.IsAuthenticated]
    )
    def my_requests(self, request):
        """Lấy danh sách yêu cầu tìm đối thủ của người dùng hiện tại"""
        requests = OpponentRequest.objects.filter(user=request.user)
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=['GET'],
        permission_classes=[permissions.IsAuthenticated]
    )
    def suggestions(self, request):
        """Gợi ý các đối thủ phù hợp dựa trên yêu cầu của người dùng"""
        # Lấy yêu cầu gần nhất của user
        user_request = OpponentRequest.objects.filter(
            user=request.user,
            status='active'
        ).first()

        if not user_request:
            return Response(
                {'error': 'Ban chua co yeu cau tim doi thu nao'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Tìm các user phù hợp với tiêu chí
        candidates = User.objects.exclude(id=request.user.id)

        # Filter theo skill level
        if user_request.preferred_skill_level != 'any':
            candidates = candidates.filter(
                profile__skill_level=user_request.preferred_skill_level
            )

        # Filter theo rating tối thiểu
        if user_request.min_rating > 0:
            candidates = candidates.filter(
                profile__rating__gte=user_request.min_rating
            )

        # Sắp xếp theo rating
        candidates = candidates.order_by('-profile__rating')[:10]

        serializer = UserBasicSerializer(candidates, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=['GET', 'PUT'],
        permission_classes=[permissions.IsAuthenticated]
    )
    def my_current(self, request):
        """
        GET: Lấy yêu cầu hiện tại (active) của người dùng
        PUT: Cập nhật yêu cầu hiện tại
        """
        try:
            opponent_request = OpponentRequest.objects.filter(
                user=request.user,
                status='active'
            ).first()

            if request.method == 'GET':
                if not opponent_request:
                    return Response(
                        {'message': 'Ban chua co yeu cau tim doi thu nao', 'data': None},
                        status=status.HTTP_200_OK
                    )
                serializer = self.get_serializer(opponent_request)
                return Response(serializer.data, status=status.HTTP_200_OK)

            elif request.method == 'PUT':
                if not opponent_request:
                    return Response(
                        {'error': 'Ban chua co yeu cau tim doi thu nao'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                serializer = OpponentRequestCreateSerializer(
                    opponent_request,
                    data=request.data,
                    partial=True,
                    context={'request': request}
                )
                serializer.is_valid(raise_exception=True)
                serializer.save()
                
                return Response(
                    {
                        'message': 'Yeu cau da duoc cap nhat',
                        'data': self.get_serializer(serializer.instance).data
                    },
                    status=status.HTTP_200_OK
                )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(
        detail=False,
        methods=['POST'],
        permission_classes=[permissions.IsAuthenticated]
    )
    def quick_create(self, request):
        """
        Tạo nhanh yêu cầu tìm đối thủ với các giá trị tối thiểu
        Nếu đã có yêu cầu active, sẽ update nó
        """
        try:
            # Kiểm tra xem đã có yêu cầu active chưa
            existing_request = OpponentRequest.objects.filter(
                user=request.user,
                status='active'
            ).first()

            if existing_request:
                # Update yêu cầu hiện tại
                serializer = OpponentRequestCreateSerializer(
                    existing_request,
                    data=request.data,
                    partial=True,
                    context={'request': request}
                )
            else:
                # Tạo yêu cầu mới
                serializer = OpponentRequestCreateSerializer(
                    data=request.data,
                    context={'request': request}
                )

            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response(
                {
                    'message': 'Yeu cau tim doi thu da duoc tao/cap nhat thanh cong',
                    'request': self.get_serializer(serializer.instance).data
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(
        detail=False,
        methods=['DELETE'],
        permission_classes=[permissions.IsAuthenticated]
    )
    def cancel_my_request(self, request):
        """Hủy yêu cầu tìm đối thủ của người dùng"""
        try:
            opponent_request = OpponentRequest.objects.filter(
                user=request.user,
                status='active'
            ).first()
            
            if not opponent_request:
                return Response(
                    {'error': 'Khong tim thay yeu cau'},
                    status=status.HTTP_404_NOT_FOUND
                )

            opponent_request.status = 'cancelled'
            opponent_request.save()
            
            return Response(
                {'message': 'Yeu cau tim doi thu da duoc huy'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class MatchmakingMatchViewSet(viewsets.ModelViewSet):
    queryset = MatchmakingMatch.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [OrderingFilter]
    ordering_fields = ['scheduled_date', 'created_at']
    ordering = ['-scheduled_date']

    def get_serializer_class(self):
        if self.action == 'create':
            return MatchmakingMatchCreateSerializer
        elif self.action == 'confirm':
            return MatchmakingMatchConfirmSerializer
        return MatchmakingMatchSerializer

    def get_queryset(self):
        user = self.request.user
        
        # Admin thấy tất cả
        if user.is_staff:
            return MatchmakingMatch.objects.all()
        
        # User chỉ thấy matches của mình
        return MatchmakingMatch.objects.filter(
            Q(requester=user) | Q(opponent=user)
        )

    def create(self, request, *args, **kwargs):
        """Tạo match với một đối thủ cụ thể"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        return Response(
            {
                'message': 'Da tao match, dang cho doi thu xac nhan',
                'match': MatchmakingMatchSerializer(serializer.instance).data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    @action(detail=False, methods=['GET'], permission_classes=[permissions.IsAuthenticated])
    def my_matches(self, request):
        """Lấy danh sách matches của người dùng"""
        matches = self.get_queryset()
        serializer = self.get_serializer(matches, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['GET'], permission_classes=[permissions.IsAuthenticated])
    def pending(self, request):
        """
        Lấy danh sách matches chờ xác nhận của người dùng:
        - Nếu user là opponent: chờ opponent xác nhận
        - Nếu user là requester: chờ requester xác nhận hoặc opponent xác nhận
        """
        user = request.user
        
        # Matches mà user là opponent và chưa xác nhận
        opponent_pending = MatchmakingMatch.objects.filter(
            opponent=user,
            status='pending_confirmation',
            opponent_confirmed=False
        ).select_related('requester', 'field')
        
        # Matches mà user là requester và chưa đầu đủ xác nhận
        requester_pending = MatchmakingMatch.objects.filter(
            requester=user,
            status='pending_confirmation'
        ).exclude(
            requester_confirmed=True,
            opponent_confirmed=True
        ).select_related('opponent', 'field')
        
        all_pending = opponent_pending | requester_pending
        serializer = self.get_serializer(all_pending, many=True)
        
        return Response({
            'count': len(all_pending),
            'message': 'Nhung match chua duoc xac nhan day du',
            'pending_matches': serializer.data
        })

    @action(detail=True, methods=['PUT'], permission_classes=[permissions.IsAuthenticated])
    def confirm(self, request, pk=None):
        """Xác nhận match"""
        match = self.get_object()
        serializer = self.get_serializer(match, data={}, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(
            {
                'message': 'Ban da xac nhan match',
                'match': MatchmakingMatchSerializer(serializer.instance).data
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['PUT'], permission_classes=[permissions.IsAuthenticated])
    def record_result(self, request, pk=None):
        """Ghi lại kết quả trận đấu"""
        match = self.get_object()
        result = request.data.get('match_result')

        if result not in ['requester_win', 'opponent_win', 'draw']:
            return Response(
                {'error': 'Ket qua khong hop le'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if match.status != 'confirmed':
            return Response(
                {'error': 'Chi co the ghi ket qua match da xac nhan'},
                status=status.HTTP_400_BAD_REQUEST
            )

        match.match_result = result
        match.status = 'completed'
        match.completed_at = timezone.now()
        match.save()

        # Update user statistics
        from apps.accounts.models import UserProfile
        
        requester_profile = match.requester.profile
        opponent_profile = match.opponent.profile

        # Update total matches
        requester_profile.total_matches += 1
        opponent_profile.total_matches += 1

        # Update wins/draws
        if result == 'requester_win':
            requester_profile.total_wins += 1
        elif result == 'opponent_win':
            opponent_profile.total_wins += 1
        else:  # draw
            requester_profile.total_draws += 1
            opponent_profile.total_draws += 1

        requester_profile.save()
        opponent_profile.save()

        return Response(
            {
                'message': 'Ket qua trận dấu da duoc ghi nhan',
                'match': MatchmakingMatchSerializer(match).data
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['DELETE'], permission_classes=[permissions.IsAuthenticated])
    def cancel(self, request, pk=None):
        """Hủy match"""
        match = self.get_object()
        
        if match.status == 'completed':
            return Response(
                {'error': 'Khong the huy match da hoan thanh'},
                status=status.HTTP_400_BAD_REQUEST
            )

        match.status = 'cancelled'
        match.save()

        return Response(
            {'message': 'Match da duoc huy'},
            status=status.HTTP_200_OK
        )

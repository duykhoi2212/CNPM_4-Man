from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Review, ReviewImage
from .serializers import (
    ReviewListSerializer,
    ReviewDetailSerializer,
    ReviewCreateSerializer,
    ReviewUpdateSerializer,
)


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user or request.user.is_staff


class ReviewListView(generics.ListAPIView):
    serializer_class = ReviewListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Review.objects.select_related('user', 'field').prefetch_related('images').order_by('-created_at')

        field_id = self.request.query_params.get('field')
        if field_id:
            queryset = queryset.filter(field_id=field_id)

        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        rating_min = self.request.query_params.get('rating_min')
        if rating_min:
            queryset = queryset.filter(rating__gte=rating_min)

        return queryset


class ReviewDetailView(generics.RetrieveAPIView):
    queryset = Review.objects.select_related('user', 'field', 'booking').prefetch_related('images')
    serializer_class = ReviewDetailSerializer
    permission_classes = [permissions.AllowAny]


class ReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()

        detail_serializer = ReviewDetailSerializer(review, context={'request': request})
        return Response(
            {
                'message': 'Da gui danh gia thanh cong',
                'review': detail_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class ReviewUpdateView(generics.UpdateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()

        detail_serializer = ReviewDetailSerializer(review, context={'request': request})
        return Response(
            {
                'message': 'Da cap nhat danh gia thanh cong',
                'review': detail_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ReviewDeleteView(generics.DestroyAPIView):
    queryset = Review.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'message': 'Da xoa danh gia thanh cong'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def review_add_image_view(request, pk):
    try:
        review = Review.objects.get(pk=pk)
    except Review.DoesNotExist:
        return Response({'error': 'Khong tim thay danh gia'}, status=status.HTTP_404_NOT_FOUND)

    if review.user != request.user:
        return Response({'error': 'Ban chi co the them anh vao danh gia cua chinh minh'}, status=status.HTTP_403_FORBIDDEN)

    if review.images.count() >= 5:
        return Response({'error': 'Moi danh gia chi duoc toi da 5 anh'}, status=status.HTTP_400_BAD_REQUEST)

    image_file = request.FILES.get('image')
    if not image_file:
        return Response({'error': 'Vui long chon anh can tai len'}, status=status.HTTP_400_BAD_REQUEST)

    review_image = ReviewImage.objects.create(review=review, image_url=image_file)
    serializer = ReviewDetailSerializer(review, context={'request': request})

    return Response(
        {
            'message': 'Da them anh danh gia thanh cong',
            'image': {
                'id': review_image.id,
                'image_url': request.build_absolute_uri(review_image.image_url.url),
                'uploaded_at': review_image.uploaded_at,
            },
            'review': serializer.data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def review_delete_image_view(request, pk, image_id):
    try:
        review = Review.objects.get(pk=pk)
        review_image = ReviewImage.objects.get(pk=image_id, review=review)
    except (Review.DoesNotExist, ReviewImage.DoesNotExist):
        return Response({'error': 'Khong tim thay danh gia hoac anh'}, status=status.HTTP_404_NOT_FOUND)

    if review.user != request.user and not request.user.is_staff:
        return Response({'error': 'Ban khong co quyen xoa anh cua danh gia nay'}, status=status.HTTP_403_FORBIDDEN)

    review_image.delete()
    serializer = ReviewDetailSerializer(review, context={'request': request})
    return Response({'message': 'Da xoa anh thanh cong', 'review': serializer.data}, status=status.HTTP_200_OK)

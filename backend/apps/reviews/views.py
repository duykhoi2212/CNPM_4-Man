from django.shortcuts import render

# Create your views here.
# apps/reviews/views.py
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q

from .models import Review, ReviewImage
from .serializers import (
    ReviewListSerializer,
    ReviewDetailSerializer,
    ReviewCreateSerializer,
    ReviewUpdateSerializer
)


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission: Owner hoặc Admin
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user or request.user.is_staff


class ReviewListView(generics.ListAPIView):
    """
    GET /api/reviews/
    
    List reviews (Public)
    
    Query params:
    - field: field_id (filter by field)
    - user: user_id (filter by user)
    - rating_min: minimum rating (1-5)
    
    Example: /api/reviews/?field=1&rating_min=4
    """
    serializer_class = ReviewListSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Review.objects.select_related('user', 'field').prefetch_related('images').order_by('-created_at')
        
        # Filter by field
        field_id = self.request.query_params.get('field')
        if field_id:
            queryset = queryset.filter(field_id=field_id)
        
        # Filter by user
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by rating
        rating_min = self.request.query_params.get('rating_min')
        if rating_min:
            queryset = queryset.filter(rating__gte=rating_min)
        
        return queryset


class ReviewDetailView(generics.RetrieveAPIView):
    """
    GET /api/reviews/:id/
    
    Xem chi tiết review (Public)
    """
    queryset = Review.objects.select_related('user', 'field', 'booking').prefetch_related('images')
    serializer_class = ReviewDetailSerializer
    permission_classes = [permissions.AllowAny]


class ReviewCreateView(generics.CreateAPIView):
    """
    POST /api/reviews/
    
    Tạo review mới
    
    Body: {
        "field": 1,
        "booking_id": 5,        (optional - nhưng nên có để validate)
        "rating": 5,
        "comment": "Sân đẹp, dịch vụ tốt, sẽ quay lại!"
    }
    
    Rules:
    - Phải đăng nhập
    - Booking phải là completed (nếu có booking_id)
    - 1 booking chỉ review 1 lần
    - Comment tối thiểu 10 ký tự
    """
    serializer_class = ReviewCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        
        # Return detailed review
        detail_serializer = ReviewDetailSerializer(review, context={'request': request})
        
        return Response({
            'message': 'Review created successfully',
            'review': detail_serializer.data
        }, status=status.HTTP_201_CREATED)


class ReviewUpdateView(generics.UpdateAPIView):
    """
    PUT/PATCH /api/reviews/:id/
    
    Cập nhật review (chỉ owner)
    
    Body: {
        "rating": 4,
        "comment": "Updated comment..."
    }
    """
    queryset = Review.objects.all()
    serializer_class = ReviewUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        
        # Return detailed review
        detail_serializer = ReviewDetailSerializer(review, context={'request': request})
        
        return Response({
            'message': 'Review updated successfully',
            'review': detail_serializer.data
        }, status=status.HTTP_200_OK)


class ReviewDeleteView(generics.DestroyAPIView):
    """
    DELETE /api/reviews/:id/
    
    Xóa review (Admin only)
    """
    queryset = Review.objects.all()
    permission_classes = [permissions.IsAdminUser]
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'message': 'Review deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def review_add_image_view(request, pk):
    """
    POST /api/reviews/:id/add-image/
    
    Thêm ảnh cho review (max 5 ảnh)
    
    Body (multipart/form-data):
    - image: file
    """
    try:
        review = Review.objects.get(pk=pk)
    except Review.DoesNotExist:
        return Response(
            {'error': 'Review not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check ownership
    if review.user != request.user:
        return Response(
            {'error': 'You can only add images to your own review'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check max images
    if review.images.count() >= 5:
        return Response(
            {'error': 'Maximum 5 images per review'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get image from request
    image_file = request.FILES.get('image')
    if not image_file:
        return Response(
            {'error': 'Image file is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create image
    review_image = ReviewImage.objects.create(
        review=review,
        image_url=image_file
    )
    
    return Response({
        'message': 'Image added successfully',
        'image': {
            'id': review_image.id,
            'image_url': request.build_absolute_uri(review_image.image_url.url),
            'uploaded_at': review_image.uploaded_at
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def review_delete_image_view(request, pk, image_id):
    """
    DELETE /api/reviews/:id/images/:image_id/
    
    Xóa ảnh review
    """
    try:
        review = Review.objects.get(pk=pk)
        review_image = ReviewImage.objects.get(pk=image_id, review=review)
    except (Review.DoesNotExist, ReviewImage.DoesNotExist):
        return Response(
            {'error': 'Review or image not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check ownership
    if review.user != request.user and not request.user.is_staff:
        return Response(
            {'error': 'You can only delete images from your own review'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    review_image.delete()
    
    return Response(
        {'message': 'Image deleted successfully'},
        status=status.HTTP_204_NO_CONTENT
    )
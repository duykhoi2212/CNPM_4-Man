# apps/payments/views.py
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Payment
from .serializers import (
    PaymentSerializer,
    PaymentCreateSerializer,
    PaymentConfirmSerializer
)


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission: Owner hoặc Admin
    """
    def has_object_permission(self, request, view, obj):
        return obj.booking.user == request.user or request.user.is_staff


class PaymentCreateView(generics.CreateAPIView):
    """
    POST /api/payments/
    
    Tạo payment cho booking
    
    Body: {
        "booking_id": 1,
        "payment_method": "momo"  // atm/momo/zalopay/bank_transfer/cash
    }
    
    Response: {
        "id": 1,
        "booking": {...},
        "payment_method": "momo",
        "amount": "180000.00",
        "status": "pending",
        "created_at": "..."
    }
    """
    serializer_class = PaymentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        
        # Return payment info
        response_serializer = PaymentSerializer(payment, context={'request': request})
        
        return Response({
            'message': 'Payment created successfully. Please proceed to payment.',
            'payment': response_serializer.data
        }, status=status.HTTP_201_CREATED)


class PaymentDetailView(generics.RetrieveAPIView):
    """
    GET /api/payments/:id/
    
    Xem chi tiết payment
    """
    queryset = Payment.objects.select_related('booking', 'booking__field', 'booking__user')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsOwnerOrAdmin])
def payment_confirm_view(request, pk):
    """
    POST /api/payments/:id/confirm/
    
    FAKE PAYMENT CONFIRMATION
    Trong thực tế sẽ là callback từ payment gateway
    
    Response: {
        "message": "Payment confirmed successfully",
        "payment": {
            "status": "completed",
            "transaction_id": "FAKE-ABC123DEF456",
            "paid_at": "2026-02-26T10:30:00Z"
        },
        "booking": {
            "status": "confirmed"
        }
    }
    """
    try:
        payment = Payment.objects.select_related('booking').get(pk=pk)
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Payment not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permission
    if payment.booking.user != request.user and not request.user.is_staff:
        return Response(
            {'error': 'You do not have permission to confirm this payment'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = PaymentConfirmSerializer(instance=payment, data=request.data)
    serializer.is_valid(raise_exception=True)
    payment = serializer.save()
    
    response_serializer = PaymentSerializer(payment, context={'request': request})
    
    return Response({
        'message': 'Payment confirmed successfully',
        'payment': response_serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_by_booking_view(request, booking_id):
    """
    GET /api/payments/booking/:booking_id/
    
    Lấy payment của một booking
    """
    try:
        payment = Payment.objects.select_related('booking', 'booking__field').get(booking_id=booking_id)
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Payment not found for this booking'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permission
    if payment.booking.user != request.user and not request.user.is_staff:
        return Response(
            {'error': 'You do not have permission to view this payment'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = PaymentSerializer(payment, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)
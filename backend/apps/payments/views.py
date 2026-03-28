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
    def has_object_permission(self, request, view, obj):
        return obj.booking.user == request.user or request.user.is_staff


class PaymentCreateView(generics.CreateAPIView):
    serializer_class = PaymentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()

        response_serializer = PaymentSerializer(payment, context={'request': request})

        return Response({
            'message': 'Tao thanh toan tien coc thanh cong. Vui long tiep tuc thanh toan.',
            'payment': response_serializer.data
        }, status=status.HTTP_201_CREATED)


class PaymentDetailView(generics.RetrieveAPIView):
    queryset = Payment.objects.select_related('booking', 'booking__field', 'booking__user')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def payment_confirm_view(request, pk):
    try:
        payment = Payment.objects.select_related('booking').get(pk=pk)
    except Payment.DoesNotExist:
        return Response({'error': 'Khong tim thay thanh toan'}, status=status.HTTP_404_NOT_FOUND)

    if payment.booking.user != request.user and not request.user.is_staff:
        return Response({'error': 'Ban khong co quyen xac nhan thanh toan nay'}, status=status.HTTP_403_FORBIDDEN)

    serializer = PaymentConfirmSerializer(instance=payment, data=request.data)
    serializer.is_valid(raise_exception=True)
    payment = serializer.save()

    response_serializer = PaymentSerializer(payment, context={'request': request})

    return Response({
        'message': 'Thanh toan coc thanh cong, booking da duoc xac nhan',
        'payment': response_serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_by_booking_view(request, booking_id):
    try:
        payment = Payment.objects.select_related('booking', 'booking__field').get(booking_id=booking_id)
    except Payment.DoesNotExist:
        return Response({'error': 'Khong tim thay thanh toan cho booking nay'}, status=status.HTTP_404_NOT_FOUND)

    if payment.booking.user != request.user and not request.user.is_staff:
        return Response({'error': 'Ban khong co quyen xem thanh toan nay'}, status=status.HTTP_403_FORBIDDEN)

    serializer = PaymentSerializer(payment, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)

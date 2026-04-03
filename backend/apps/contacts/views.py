from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import ContactMessage
from .serializers import (
    ContactMessageCreateSerializer,
    ContactMessageListSerializer,
    ContactMessageUpdateSerializer,
)


class ContactMessageCreateView(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageCreateSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.save()
        detail_serializer = ContactMessageListSerializer(message)
        return Response(
            {
                'message': 'Da gui lien he thanh cong. Chung toi se phan hoi som nhat co the.',
                'contact': detail_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminContactMessageListView(generics.ListAPIView):
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageListSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()

        status_filter = self.request.query_params.get('status')
        keyword = self.request.query_params.get('q')

        if status_filter == 'resolved':
            queryset = queryset.filter(is_resolved=True)
        elif status_filter == 'pending':
            queryset = queryset.filter(is_resolved=False)

        if keyword:
            queryset = queryset.filter(
                Q(subject__icontains=keyword) |
                Q(name__icontains=keyword) |
                Q(email__icontains=keyword)
            )

        return queryset.distinct()


class AdminContactMessageUpdateView(generics.UpdateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageUpdateSerializer
    permission_classes = [permissions.IsAdminUser]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        contact = serializer.save()
        detail_serializer = ContactMessageListSerializer(contact)
        return Response(
            {
                'message': 'Da cap nhat trang thai lien he thanh cong',
                'contact': detail_serializer.data,
            },
            status=status.HTTP_200_OK,
        )

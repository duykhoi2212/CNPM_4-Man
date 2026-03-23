# apps/payments/urls.py
from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Create & Detail
    path('', views.PaymentCreateView.as_view(), name='payment-create'),
    path('<int:pk>/', views.PaymentDetailView.as_view(), name='payment-detail'),
    
    # Actions
    path('<int:pk>/confirm/', views.payment_confirm_view, name='payment-confirm'),
    
    # Get payment by booking
    path('booking/<int:booking_id>/', views.payment_by_booking_view, name='payment-by-booking'),
]
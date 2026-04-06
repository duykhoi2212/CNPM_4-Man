# apps/payments/urls.py
from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Create & Detail
    path('', views.PaymentCreateView.as_view(), name='payment-create'),
    path('<int:pk>/', views.PaymentDetailView.as_view(), name='payment-detail'),
    
    # Actions
    path('<int:pk>/user-confirm/', views.payment_user_confirm_view, name='payment-user-confirm'),
    path('<int:pk>/confirm/', views.payment_confirm_view, name='payment-confirm'),
    path('<int:pk>/admin-confirm/', views.payment_admin_confirm_view, name='payment-admin-confirm'),
]
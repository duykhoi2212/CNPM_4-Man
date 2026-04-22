# apps/bookings/urls.py
from django.urls import path
from . import views

app_name = 'bookings'

urlpatterns = [
    # List & Create
    path('', views.BookingListView.as_view(), name='booking-list'),
    path('create/', views.BookingCreateView.as_view(), name='booking-create'),
    path('services/products/', views.ServiceProductListView.as_view(), name='service-product-list'),
    path('services/products/admin/', views.ServiceProductAdminListCreateView.as_view(), name='service-product-admin-list-create'),
    path('services/products/admin/<int:pk>/', views.ServiceProductAdminDetailView.as_view(), name='service-product-admin-detail'),
    
    # Detail
    path('<int:pk>/', views.BookingDetailView.as_view(), name='booking-detail'),
    
    # Actions
    path('<int:pk>/cancel/', views.booking_cancel_view, name='booking-cancel'),
    path('<int:pk>/confirm/', views.booking_confirm_view, name='booking-confirm'),
    path('<int:pk>/complete/', views.booking_complete_view, name='booking-complete'),
]
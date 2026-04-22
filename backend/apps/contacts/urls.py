from django.urls import path
from . import views

app_name = 'contacts'

urlpatterns = [
    path('', views.ContactMessageCreateView.as_view(), name='contact-create'),
    path('admin/', views.AdminContactMessageListView.as_view(), name='contact-admin-list'),
    path('admin/<int:pk>/update/', views.AdminContactMessageUpdateView.as_view(), name='contact-admin-update'),
]

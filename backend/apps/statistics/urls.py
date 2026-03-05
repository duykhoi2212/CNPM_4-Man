from django.urls import path
from . import views

app_name = 'statistics'

urlpatterns = [
    path('admin/overview/', views.admin_overview_view, name='admin-overview'),
    path('admin/revenue/', views.admin_revenue_view, name='admin-revenue'),
    path('admin/top-fields/', views.admin_top_fields_view, name='admin-top-fields'),
    path('me/overview/', views.my_overview_view, name='my-overview'),
]

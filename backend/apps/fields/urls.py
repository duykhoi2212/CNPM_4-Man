# apps/fields/urls.py
from django.urls import path
from . import views

app_name = 'fields'

urlpatterns = [
    # Field Types
    path('types/', views.FieldTypeListView.as_view(), name='field-types'),
    path('timeslots/', views.TimeSlotAdminListCreateView.as_view(), name='timeslot-admin-list-create'),
    path('timeslots/<int:pk>/', views.TimeSlotAdminUpdateDeleteView.as_view(), name='timeslot-admin-update-delete'),
    
    # Fields - Public
    path('', views.FieldListView.as_view(), name='field-list'),
    path('<int:pk>/', views.FieldDetailView.as_view(), name='field-detail'),
    path('<int:pk>/availability/', views.field_availability_view, name='field-availability'),
    
    # Fields - Admin only
    path('create/', views.FieldCreateView.as_view(), name='field-create'),
    path('<int:pk>/update/', views.FieldUpdateView.as_view(), name='field-update'),
    path('<int:pk>/delete/', views.FieldDeleteView.as_view(), name='field-delete'),
    path('<int:pk>/images/upload/', views.field_image_upload_view, name='field-image-upload'),
    path('<int:pk>/images/<int:image_id>/set-primary/', views.field_image_set_primary_view, name='field-image-set-primary'),
    path('<int:pk>/images/<int:image_id>/delete/', views.field_image_delete_view, name='field-image-delete'),
]

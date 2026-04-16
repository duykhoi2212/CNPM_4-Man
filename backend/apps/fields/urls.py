# apps/fields/urls.py
from django.urls import path
from . import views

app_name = 'fields'

urlpatterns = [
    # Field Types
    path('types/', views.FieldTypeListView.as_view(), name='field-types'),
    path('timeslots/', views.TimeSlotAdminListCreateView.as_view(), name='timeslot-admin-list-create'),
    path('timeslots/<int:pk>/', views.TimeSlotAdminUpdateDeleteView.as_view(), name='timeslot-admin-update-delete'),

    path('recommendations/', views.recommended_fields_view, name='field-recommendations'),
    path('nearby/', views.nearby_fields_view, name='field-nearby'),

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

    # Field Schedules - Admin
    path('schedules/', views.FieldScheduleListCreateView.as_view(), name='schedule-list-create'),
    path('schedules/<int:pk>/', views.FieldScheduleUpdateDeleteView.as_view(), name='schedule-update-delete'),
    path('<int:field_id>/schedules/generate-slots/', views.generate_time_slots_from_schedule, name='generate-slots'),

    # Field Closures - Admin
    path('closures/', views.FieldClosureListCreateView.as_view(), name='closure-list-create'),
    path('closures/<int:pk>/', views.FieldClosureUpdateDeleteView.as_view(), name='closure-update-delete'),

    # Incident Reports
    path('incidents/', views.IncidentReportListCreateView.as_view(), name='incident-list-create'),
    path('incidents/<int:pk>/', views.IncidentReportDetailView.as_view(), name='incident-detail'),

    # Field Swaps
    path('swaps/', views.FieldSwapListCreateView.as_view(), name='swap-list-create'),
    path('swaps/<int:pk>/', views.FieldSwapDetailView.as_view(), name='swap-detail'),
    path('swaps/find-alternative/', views.find_alternative_fields, name='find-alternative'),
    path('swaps/find-alternative/<int:incident_id>/', views.find_alternative_fields, name='find-alternative-by-incident'),
    path('swaps/<int:swap_id>/confirm/', views.confirm_field_swap, name='confirm-swap'),
]

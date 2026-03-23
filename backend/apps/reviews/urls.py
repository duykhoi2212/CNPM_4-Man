# apps/reviews/urls.py
from django.urls import path
from . import views

app_name = 'reviews'

urlpatterns = [
    # List & Create
    path('', views.ReviewListView.as_view(), name='review-list'),
    path('create/', views.ReviewCreateView.as_view(), name='review-create'),
    
    # Detail, Update, Delete
    path('<int:pk>/', views.ReviewDetailView.as_view(), name='review-detail'),
    path('<int:pk>/update/', views.ReviewUpdateView.as_view(), name='review-update'),
    path('<int:pk>/delete/', views.ReviewDeleteView.as_view(), name='review-delete'),
    
    # Images
    path('<int:pk>/add-image/', views.review_add_image_view, name='review-add-image'),
    path('<int:pk>/images/<int:image_id>/', views.review_delete_image_view, name='review-delete-image'),
]
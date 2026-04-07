from django.urls import path

from . import views

app_name = 'matches'

urlpatterns = [
    path('requests/', views.MatchRequestListCreateView.as_view(), name='match-request-list-create'),
    path('requests/<int:pk>/', views.MatchRequestDetailView.as_view(), name='match-request-detail'),
    path('requests/<int:pk>/accept/', views.match_request_accept_view, name='match-request-accept'),
    path('requests/<int:pk>/pay/', views.match_request_pay_deposit_view, name='match-request-pay'),
    path('requests/<int:pk>/complete/', views.match_request_complete_deposit_view, name='match-request-complete'),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OpponentRequestViewSet, MatchmakingMatchViewSet

router = DefaultRouter()
router.register(r'requests', OpponentRequestViewSet, basename='opponent-request')
router.register(r'matches', MatchmakingMatchViewSet, basename='matchmaking-match')

app_name = 'matchmaking'

urlpatterns = [
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TutoringMessageViewSet, PedagogicalAdviceViewSet, TutoringReportViewSet

router = DefaultRouter()
router.register(r'messages', TutoringMessageViewSet, basename='tutoring-message')
router.register(r'pedagogical-advice', PedagogicalAdviceViewSet, basename='pedagogical-advice')
router.register(r'reports', TutoringReportViewSet, basename='tutoring-report')

urlpatterns = [
    path('', include(router.urls)),
]

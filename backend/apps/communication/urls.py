from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationViewSet, MessageViewSet, SMSLogViewSet,
    WhatsAppLogViewSet, AnnouncementViewSet, ParentMeetingViewSet
)

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'sms', SMSLogViewSet, basename='sms')
router.register(r'whatsapp', WhatsAppLogViewSet, basename='whatsapp')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'parent-meetings', ParentMeetingViewSet, basename='parent-meeting')

urlpatterns = [
    path('', include(router.urls)),
]

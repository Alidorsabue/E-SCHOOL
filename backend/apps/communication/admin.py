from django.contrib import admin
from .models import Notification, Message, SMSLog, WhatsAppLog, Announcement, ParentMeeting
from apps.schools.admin_base import SchoolScopedAdminMixin


@admin.register(Notification)
class NotificationAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['title', 'user', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'school', 'created_at']
    search_fields = ['title', 'message', 'user__username']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(user__school=request.user.school)
        return qs


@admin.register(Message)
class MessageAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['subject', 'sender', 'recipient', 'is_read', 'created_at']
    list_filter = ['is_read', 'school', 'created_at']
    search_fields = ['subject', 'message', 'sender__username', 'recipient__username']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(sender__school=request.user.school) | qs.filter(recipient__school=request.user.school)
        return qs


@admin.register(SMSLog)
class SMSLogAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['recipient_phone', 'status', 'provider', 'sent_at', 'created_at']
    list_filter = ['status', 'provider', 'school', 'created_at']
    search_fields = ['recipient_phone', 'message']


@admin.register(WhatsAppLog)
class WhatsAppLogAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['recipient_phone', 'status', 'provider', 'sent_at', 'created_at']
    list_filter = ['status', 'provider', 'school', 'created_at']
    search_fields = ['recipient_phone', 'message']


@admin.register(Announcement)
class AnnouncementAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['title', 'school', 'target_audience', 'is_published', 'published_at', 'created_at']
    list_filter = ['is_published', 'target_audience', 'school', 'created_at']
    search_fields = ['title', 'message']


@admin.register(ParentMeeting)
class ParentMeetingAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['title', 'teacher', 'parent', 'student', 'meeting_date', 'status']
    list_filter = ['status', 'school', 'meeting_date']
    search_fields = ['title', 'description']

from django.contrib import admin
from .models import Meeting, MeetingParticipant
from apps.schools.admin_base import SchoolScopedAdminMixin


@admin.register(Meeting)
class MeetingAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['title', 'meeting_type', 'teacher', 'parent', 'student', 'meeting_date', 'status', 'location']
    list_filter = ['status', 'meeting_type', 'school', 'meeting_date', 'video_platform']
    search_fields = ['title', 'description', 'teacher__user__first_name', 'parent__user__first_name']
    readonly_fields = ['created_at', 'updated_at', 'reminder_sent_at']


@admin.register(MeetingParticipant)
class MeetingParticipantAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['meeting', 'user', 'role', 'is_required', 'attended']
    list_filter = ['is_required', 'attended', 'role']
    search_fields = ['user__username', 'meeting__title']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(meeting__school=request.user.school)
        return qs

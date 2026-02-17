from django.contrib import admin
from .models import TutoringMessage, PedagogicalAdvice, TutoringReport
from apps.schools.admin_base import SchoolScopedAdminMixin


@admin.register(TutoringMessage)
class TutoringMessageAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['subject', 'sender', 'recipient', 'student', 'message_type', 'is_read', 'created_at']
    list_filter = ['message_type', 'is_read', 'is_important', 'school', 'created_at']
    search_fields = ['subject', 'message', 'sender__username', 'recipient__username']


@admin.register(PedagogicalAdvice)
class PedagogicalAdviceAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['title', 'teacher', 'student', 'category', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'school', 'created_at']
    search_fields = ['title', 'advice', 'student__user__first_name']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(student__user__school=request.user.school)
        return qs


@admin.register(TutoringReport)
class TutoringReportAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['title', 'teacher', 'student', 'report_period_start', 'report_period_end', 'is_draft', 'is_shared_with_parent']
    list_filter = ['is_draft', 'is_shared_with_parent', 'school', 'created_at']
    search_fields = ['title', 'academic_progress', 'student__user__first_name']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(student__user__school=request.user.school)
        return qs

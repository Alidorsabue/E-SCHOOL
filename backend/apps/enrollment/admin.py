from django.contrib import admin
from .models import EnrollmentApplication, ReEnrollment
from apps.schools.admin_base import SchoolScopedAdminMixin


@admin.register(EnrollmentApplication)
class EnrollmentApplicationAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'school', 'requested_class', 'status', 'academic_year', 'created_at']
    list_filter = ['status', 'school', 'academic_year', 'gender']
    search_fields = ['first_name', 'last_name', 'parent_name', 'parent_phone', 'phone']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ReEnrollment)
class ReEnrollmentAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['student', 'academic_year', 'school_class', 'status', 'is_paid', 'enrollment_date']
    list_filter = ['status', 'is_paid', 'academic_year', 'school_class']
    search_fields = ['student__user__first_name', 'student__user__last_name', 'student__student_id']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(student__user__school=request.user.school)
        return qs

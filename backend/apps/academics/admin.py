from django.contrib import admin
from .models import AcademicYear, Grade, GradeBulletin, Attendance, DisciplineRecord, DisciplineRequest, ReportCard
from apps.schools.admin_base import SchoolScopedAdminMixin


@admin.register(AcademicYear)
class AcademicYearAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['name', 'school', 'start_date', 'end_date', 'is_current']
    list_filter = ['is_current']
    
    def get_list_filter(self, request):
        """Retirer le filtre 'school' pour les admins d'école"""
        list_filter = ['is_current']
        if request.user.is_superuser:
            list_filter = ['school', 'is_current']
        return list_filter
    
    def get_form(self, request, obj=None, **kwargs):
        """Pré-remplir le champ school avec l'école de l'admin"""
        form = super().get_form(request, obj, **kwargs)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            if 'school' in form.base_fields and obj is None:
                form.base_fields['school'].initial = request.user.school.id
        return form


@admin.register(Grade)
class GradeAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['student', 'subject', 'term', 'continuous_assessment', 'exam_score', 'total_score', 'academic_year']
    list_filter = ['academic_year', 'term', 'subject', 'student__school_class']
    search_fields = ['student__user__first_name', 'student__user__last_name', 'student__student_id']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(student__user__school=request.user.school)
        return qs


@admin.register(GradeBulletin)
class GradeBulletinAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['student', 'subject', 'school_class', 'academic_year', 'total_s1', 'total_s2', 'total_general']
    list_filter = ['academic_year', 'subject', 'school_class', 'student__school_class']
    search_fields = ['student__user__first_name', 'student__user__last_name', 'student__student_id']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(student__user__school=request.user.school)
        return qs


@admin.register(Attendance)
class AttendanceAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['student', 'date', 'status', 'school_class', 'subject']
    list_filter = ['status', 'date', 'school_class']
    search_fields = ['student__user__first_name', 'student__user__last_name']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(student__user__school=request.user.school)
        return qs


@admin.register(DisciplineRecord)
class DisciplineRecordAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['student', 'type', 'severity', 'date', 'recorded_by']
    list_filter = ['type', 'severity', 'date', 'school_class']
    search_fields = ['student__user__first_name', 'student__user__last_name']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(student__user__school=request.user.school)
        return qs


@admin.register(DisciplineRequest)
class DisciplineRequestAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['parent', 'discipline_record', 'request_type', 'status', 'created_at']
    list_filter = ['status', 'request_type', 'created_at']
    search_fields = ['parent__user__first_name', 'parent__user__last_name', 'message']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(discipline_record__student__user__school=request.user.school)
        return qs


@admin.register(ReportCard)
class ReportCardAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['student', 'academic_year', 'term', 'average_score', 'rank', 'is_published']
    list_filter = ['academic_year', 'term', 'is_published']
    search_fields = ['student__user__first_name', 'student__user__last_name']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(student__user__school=request.user.school)
        return qs

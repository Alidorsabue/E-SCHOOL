from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Teacher, Parent, Student
from apps.schools.admin_base import SchoolScopedAdminMixin


@admin.register(User)
class UserAdmin(SchoolScopedAdminMixin, BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'school', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'is_verified']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    
    def get_list_filter(self, request):
        if request.user.is_superuser:
            return ['role', 'is_active', 'is_verified', 'school']
        return ['role', 'is_active', 'is_verified']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('phone', 'school', 'role', 'profile_picture', 'address', 'date_of_birth', 'is_verified')
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('email', 'phone', 'school', 'role', 'first_name', 'last_name')
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(school=request.user.school)
        return qs
    
    def save_model(self, request, obj, form, change):
        # Assigner automatiquement l'école lors de la création pour les admins d'école
        if not change and not obj.school:
            if request.user.is_authenticated and request.user.is_admin and request.user.school:
                obj.school = request.user.school
        
        # S'assurer que les admins d'école ont is_staff=True pour accéder à Django admin
        if obj.is_admin and not obj.is_staff:
            obj.is_staff = True
        
        super().save_model(request, obj, form, change)


@admin.register(Teacher)
class TeacherAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['user', 'employee_id', 'specialization', 'hire_date', 'school']
    list_filter = ['hire_date']
    search_fields = ['user__username', 'employee_id', 'user__first_name', 'user__last_name']
    
    def school(self, obj):
        return obj.user.school
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(user__school=request.user.school)
        return qs


@admin.register(Parent)
class ParentAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['user', 'profession', 'emergency_contact']
    search_fields = ['user__username', 'user__first_name', 'user__last_name']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(user__school=request.user.school)
        return qs


@admin.register(Student)
class StudentAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['user', 'student_id', 'school_class', 'is_former_student', 'graduation_year', 'parent', 'academic_year', 'enrollment_date', 'get_school']
    list_filter = ['academic_year', 'school_class', 'is_former_student', 'enrollment_date']
    search_fields = ['user__username', 'student_id', 'user__first_name', 'user__last_name']
    
    def get_list_filter(self, request):
        if request.user.is_superuser:
            return ['academic_year', 'school_class', 'is_former_student', 'enrollment_date', 'user__school']
        return ['academic_year', 'school_class', 'is_former_student', 'enrollment_date']
    
    def get_school(self, obj):
        return obj.user.school.name if obj.user.school else '-'
    get_school.short_description = 'École'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(user__school=request.user.school)
        return qs

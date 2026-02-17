from django.contrib import admin
from .models import Course, Assignment, AssignmentQuestion, AssignmentSubmission, Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from apps.schools.admin_base import SchoolScopedAdminMixin


@admin.register(Course)
class CourseAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['title', 'subject', 'school_class', 'teacher', 'is_published', 'created_at']
    list_filter = ['is_published', 'subject', 'academic_year']
    search_fields = ['title', 'description']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(school_class__school=request.user.school)
        return qs


class AssignmentQuestionInline(admin.TabularInline):
    model = AssignmentQuestion
    extra = 0
    ordering = ['order']


@admin.register(Assignment)
class AssignmentAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['title', 'subject', 'school_class', 'teacher', 'due_date', 'is_published']
    list_filter = ['is_published', 'subject', 'academic_year']
    search_fields = ['title', 'description']
    inlines = [AssignmentQuestionInline]
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(school_class__school=request.user.school)
        return qs


@admin.register(AssignmentQuestion)
class AssignmentQuestionAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['assignment', 'order', 'question_text', 'question_type', 'points']
    list_filter = ['question_type', 'assignment']
    ordering = ['assignment', 'order']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(assignment__school_class__school=request.user.school)
        return qs


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['assignment', 'student', 'status', 'score', 'submitted_at']
    list_filter = ['status', 'assignment__subject']
    search_fields = ['student__user__first_name', 'student__user__last_name']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(student__user__school=request.user.school)
        return qs


@admin.register(Quiz)
class QuizAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['title', 'subject', 'school_class', 'teacher', 'start_date', 'end_date', 'is_published']
    list_filter = ['is_published', 'subject', 'academic_year']
    search_fields = ['title', 'description']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(school_class__school=request.user.school)
        return qs


@admin.register(QuizQuestion)
class QuizQuestionAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['quiz', 'question_text', 'question_type', 'points', 'order']
    list_filter = ['question_type', 'quiz']
    ordering = ['quiz', 'order']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(quiz__school_class__school=request.user.school)
        return qs


@admin.register(QuizAttempt)
class QuizAttemptAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['quiz', 'student', 'score', 'is_passed', 'started_at', 'submitted_at']
    list_filter = ['is_passed', 'quiz']
    search_fields = ['student__user__first_name', 'student__user__last_name']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(student__user__school=request.user.school)
        return qs


@admin.register(QuizAnswer)
class QuizAnswerAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['attempt', 'question', 'is_correct', 'points_earned']
    list_filter = ['is_correct']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(attempt__student__user__school=request.user.school)
        return qs

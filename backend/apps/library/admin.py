from django.contrib import admin
from .models import BookCategory, Book, BookPurchase, ReadingProgress
from apps.schools.admin_base import SchoolScopedAdminMixin


@admin.register(BookCategory)
class BookCategoryAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']
    # Les catégories sont partagées entre toutes les écoles


@admin.register(Book)
class BookAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'is_free', 'price', 'is_published', 'download_count']
    list_filter = ['is_free', 'is_published', 'category', 'language', 'school']
    search_fields = ['title', 'author', 'isbn']
    readonly_fields = ['download_count', 'view_count', 'created_at', 'updated_at']


@admin.register(BookPurchase)
class BookPurchaseAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['book', 'user', 'amount_paid', 'payment_status', 'purchase_date']
    list_filter = ['payment_status', 'purchase_date']
    search_fields = ['book__title', 'user__username']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(user__school=request.user.school)
        return qs


@admin.register(ReadingProgress)
class ReadingProgressAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['book', 'user', 'current_page', 'total_pages', 'progress_percentage', 'last_read_at']
    list_filter = ['book', 'user']
    search_fields = ['book__title', 'user__username']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(user__school=request.user.school)
        return qs

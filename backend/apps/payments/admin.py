from django.contrib import admin
from .models import FeeType, Payment, FeePayment, PaymentPlan, PaymentReceipt
from apps.schools.admin_base import SchoolScopedAdminMixin


@admin.register(FeeType)
class FeeTypeAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['name', 'school', 'amount', 'currency', 'is_active']
    list_filter = ['school', 'is_active']
    search_fields = ['name', 'description']


@admin.register(Payment)
class PaymentAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['payment_id', 'user', 'student', 'amount', 'currency', 'payment_method', 'status', 'created_at']
    list_filter = ['status', 'payment_method', 'school', 'created_at']
    search_fields = ['payment_id', 'user__username', 'reference_number', 'transaction_id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(FeePayment)
class FeePaymentAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['payment', 'fee_type', 'amount', 'academic_year', 'term']
    list_filter = ['academic_year', 'term', 'fee_type']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(payment__school=request.user.school)
        return qs


@admin.register(PaymentPlan)
class PaymentPlanAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['payment', 'installment_number', 'amount', 'due_date', 'is_paid']
    list_filter = ['is_paid', 'due_date']
    ordering = ['payment', 'installment_number']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(payment__school=request.user.school)
        return qs


@admin.register(PaymentReceipt)
class PaymentReceiptAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ['receipt_number', 'payment', 'generated_at']
    search_fields = ['receipt_number', 'payment__payment_id']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_authenticated and request.user.is_admin and request.user.school and not request.user.is_superuser:
            return qs.filter(payment__school=request.user.school)
        return qs

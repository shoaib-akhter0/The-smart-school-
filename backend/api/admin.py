from django.contrib import admin

from .models import (
    AuditLog, Notification, Payment, SchoolSettings, Student, StudentFeeRecord, UserProfile, Vendor,
    VendorInvoice,
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'role', 'department', 'needs_password_change')
    list_filter = ('role',)
    search_fields = ('full_name', 'user__email')


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'full_name', 'grade_class', 'academic_session')
    search_fields = ('student_id', 'full_name')


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ('vendor_id', 'company_name', 'category', 'is_active')
    search_fields = ('vendor_id', 'company_name')


class ReadOnlyFinancialAdmin(admin.ModelAdmin):
    """Financial records change only through the API so every change is audited."""

    readonly_fields = ('balance', 'payment_status', 'created_at', 'updated_at')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(StudentFeeRecord)
class StudentFeeRecordAdmin(ReadOnlyFinancialAdmin):
    list_display = ('invoice_number', 'student_name', 'category', 'total_amount', 'paid_amount', 'balance',
                    'payment_status', 'due_date')
    list_filter = ('payment_status', 'month', 'year', 'category')
    search_fields = ('invoice_number', 'student_name', 'student__student_id')


@admin.register(VendorInvoice)
class VendorInvoiceAdmin(ReadOnlyFinancialAdmin):
    list_display = ('invoice_number', 'vendor_name', 'category', 'total_amount', 'paid_amount', 'balance',
                    'payment_status', 'due_date')
    list_filter = ('payment_status', 'month', 'year', 'category')
    search_fields = ('invoice_number', 'vendor_name', 'vendor__vendor_id')


@admin.register(Payment)
class PaymentAdmin(ReadOnlyFinancialAdmin):
    readonly_fields = ()
    list_display = ('payment_number', 'invoice_number', 'record_type', 'amount', 'payment_date', 'payment_method',
                    'recorded_by_name')
    list_filter = ('record_type', 'payment_method')
    search_fields = ('payment_number', 'invoice_number', 'reference_number')


@admin.register(AuditLog)
class AuditLogAdmin(ReadOnlyFinancialAdmin):
    readonly_fields = ()
    list_display = ('timestamp', 'action', 'model_name', 'record_identifier', 'performed_by_name', 'performed_by_role')
    list_filter = ('action', 'performed_by_role', 'model_name')
    search_fields = ('record_identifier', 'performed_by_name', 'reason')


@admin.register(SchoolSettings)
class SchoolSettingsAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not SchoolSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'notification_type', 'recipient_roles', 'created_at')
    list_filter = ('notification_type',)

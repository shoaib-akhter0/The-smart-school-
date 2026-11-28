from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone

ZERO = Decimal('0.00')

MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]


class UserRole(models.TextChoices):
    GM = 'GM', 'GM / Super Admin'
    ACCOUNTANT = 'ACCOUNTANT', 'Accountant'
    HOD = 'HOD', 'Head of Department'


class PaymentStatus(models.TextChoices):
    PAID = 'Paid', 'Paid'
    PARTIALLY_PAID = 'Partially Paid', 'Partially Paid'
    UNPAID = 'Unpaid', 'Unpaid'
    OVERDUE = 'Overdue', 'Overdue'


class PaymentMethod(models.TextChoices):
    CASH = 'CASH', 'Cash'
    BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer / IBFT'
    CHEQUE = 'CHEQUE', 'Cheque'
    ONLINE = 'ONLINE', 'Online Portal'


def calculate_balance(total, paid):
    balance = (total or ZERO) - (paid or ZERO)
    return balance if balance > ZERO else ZERO


def calculate_payment_status(total, paid, due_date, today=None):
    """Mirrors frontend/src/utils/financeRules.ts::calculatePaymentStatus."""
    today = today or timezone.localdate()
    balance = calculate_balance(total, paid)
    if total > ZERO and balance <= ZERO:
        return PaymentStatus.PAID
    if balance > ZERO and due_date and today > due_date:
        return PaymentStatus.OVERDUE
    if paid > ZERO and balance > ZERO:
        return PaymentStatus.PARTIALLY_PAID
    return PaymentStatus.UNPAID


class Vendor(models.Model):
    vendor_id = models.CharField(max_length=50, unique=True)
    company_name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    goods_services = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['company_name']

    def __str__(self):
        return f'{self.company_name} ({self.vendor_id})'


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=UserRole.choices)
    department = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    avatar = models.TextField(blank=True, help_text='Image URL or base64 data URL')
    needs_password_change = models.BooleanField(default=False)
    is_primary_admin = models.BooleanField(default=False, help_text='The primary Super Admin cannot be deleted.')

    def __str__(self):
        return f'{self.full_name} ({self.role})'


class Student(models.Model):
    student_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=150)
    grade_class = models.CharField(max_length=50)
    academic_session = models.CharField(max_length=50, blank=True)
    parent_name = models.CharField(max_length=150, blank=True)
    parent_phone = models.CharField(max_length=50, blank=True)
    parent_email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['full_name']

    def __str__(self):
        return f'{self.student_id} - {self.full_name}'


class FinancialRecord(models.Model):
    """Fields and behaviour shared by student fee records and vendor invoices."""

    invoice_number = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=14, decimal_places=2, default=ZERO)
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=ZERO)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    due_date = models.DateField()
    last_payment_date = models.DateField(null=True, blank=True)
    month = models.CharField(max_length=20)
    year = models.PositiveIntegerField()
    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='+')
    created_by_name = models.CharField(max_length=200)
    created_by_role = models.CharField(max_length=20, choices=UserRole.choices)
    last_updated_by = models.CharField(max_length=200, blank=True)

    is_flagged_for_review = models.BooleanField(default=False)
    flag_reason = models.TextField(blank=True)
    flagged_by = models.CharField(max_length=200, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    def recalculate(self):
        self.balance = calculate_balance(self.total_amount, self.paid_amount)
        self.payment_status = calculate_payment_status(self.total_amount, self.paid_amount, self.due_date)

    def save(self, *args, **kwargs):
        self.recalculate()
        super().save(*args, **kwargs)

    @classmethod
    def refresh_overdue_statuses(cls):
        """Statuses are stored for filtering, so records that passed their due date must be bumped."""
        cls.objects.filter(
            balance__gt=ZERO,
            due_date__lt=timezone.localdate(),
        ).exclude(payment_status=PaymentStatus.OVERDUE).update(payment_status=PaymentStatus.OVERDUE)


class StudentFeeRecord(FinancialRecord):
    student = models.ForeignKey(Student, on_delete=models.PROTECT, related_name='fee_records')
    # Snapshots of the student's details at billing time.
    student_name = models.CharField(max_length=150)
    grade_class = models.CharField(max_length=50)
    bill_issue_date = models.DateField(default=timezone.localdate)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.invoice_number} - {self.student_name}'


class VendorInvoice(FinancialRecord):
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT, related_name='invoices')
    vendor_name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    issue_date = models.DateField(default=timezone.localdate)
    attachment_name = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.invoice_number} - {self.vendor_name}'


class Payment(models.Model):
    RECORD_TYPES = [('student', 'Student Fee'), ('vendor', 'Vendor Invoice')]

    record_type = models.CharField(max_length=10, choices=RECORD_TYPES)
    student_fee = models.ForeignKey(StudentFeeRecord, on_delete=models.CASCADE, null=True, blank=True, related_name='payments')
    vendor_invoice = models.ForeignKey(VendorInvoice, on_delete=models.CASCADE, null=True, blank=True, related_name='payments')
    invoice_number = models.CharField(max_length=100)
    payment_number = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.BANK_TRANSFER)
    reference_number = models.CharField(max_length=100, blank=True)
    receipt_notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='+')
    recorded_by_name = models.CharField(max_length=150)
    recorded_by_role = models.CharField(max_length=20, choices=UserRole.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def record(self):
        return self.student_fee if self.record_type == 'student' else self.vendor_invoice

    @property
    def record_id(self):
        return self.student_fee_id if self.record_type == 'student' else self.vendor_invoice_id

    def __str__(self):
        return f'{self.payment_number} - {self.amount}'


class AuditLog(models.Model):
    """Append-only: rows can be created but never edited."""

    ACTIONS = [
        ('RECORD_CREATED', 'Record created'),
        ('RECORD_EDITED', 'Record edited'),
        ('HOD_REVISION', 'Authorized revision'),
        ('PAYMENT_RECORDED', 'Payment recorded'),
        ('RECORD_FLAGGED', 'Record flagged / unflagged'),
        ('IMPORT_COMPLETED', 'Bulk import completed'),
        ('FILE_UPLOADED', 'Excel file uploaded'),
        ('FILE_DELETED', 'Excel file deleted'),
        ('SETTINGS_UPDATED', 'Settings updated'),
        ('USER_UPDATED', 'User updated'),
    ]

    action = models.CharField(max_length=30, choices=ACTIONS)
    category = models.CharField(max_length=50, default='GENERAL')
    details = models.TextField(blank=True)
    model_name = models.CharField(max_length=50)
    record_id = models.CharField(max_length=50)
    record_identifier = models.CharField(max_length=200)
    previous_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    reason = models.TextField(blank=True)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='+')
    performed_by_name = models.CharField(max_length=150)
    performed_by_role = models.CharField(max_length=20, choices=UserRole.choices)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ['-timestamp', '-id']

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise ValueError('Audit log entries are immutable.')
        super().save(*args, **kwargs)

    def __str__(self):
        return f'[{self.timestamp:%Y-%m-%d %H:%M}] {self.performed_by_role} {self.action} {self.record_identifier}'


def default_fee_categories():
    return [
        'Tuition Fee', 'Admission Fee', 'Annual Examination Fee',
        'Laboratory & IT Fee', 'Transport Charges', 'Activity & Co-Curricular Fund',
    ]


def default_vendor_categories():
    return [
        'Stationery & Books Printing', 'Electricity & Utilities', 'IT & Software Infrastructure',
        'Campus Maintenance & Sanitation', 'Cafeteria & Food Supplies', 'Transport Fleet & Fuel',
    ]


class SchoolSettings(models.Model):
    """Singleton row (pk=1)."""

    school_name = models.CharField(max_length=200, default='The Smart School')
    currency_code = models.CharField(max_length=10, default='PKR')
    academic_session = models.CharField(max_length=50, default='2025-2026')
    financial_year = models.CharField(max_length=50, default='FY 2025-2026')
    contact_email = models.EmailField(default='info@thesmartschool.edu.pk')
    contact_phone = models.CharField(max_length=50, default='+92 21 111-762-787')
    address = models.TextField(default='The Smart School Campus & Head Office, Karachi, Pakistan')
    tax_registration_number = models.CharField(max_length=100, blank=True, default='NTN-7392810-4')
    fee_categories = models.JSONField(default=default_fee_categories)
    vendor_categories = models.JSONField(default=default_vendor_categories)

    class Meta:
        verbose_name_plural = 'School settings'

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.school_name


class Notification(models.Model):
    TYPES = [('ALERT', 'Alert'), ('OVERDUE', 'Overdue'), ('FLAG', 'Flag'), ('PAYMENT', 'Payment'), ('INFO', 'Info')]

    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPES, default='INFO')
    target_tab = models.CharField(max_length=50, blank=True)
    recipient_roles = models.JSONField(default=list, blank=True, help_text='Empty list means every role.')
    read_by = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='read_notifications')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        return self.title


class ExcelWorkbook(models.Model):
    """An Excel/CSV file the Accountant uploaded, shown as a "folder" in the Excel Folders page.

    `sheets` holds the parsed data: [{"name": str, "headers": [str], "rows": [[value, ...]]}].
    The original file is kept too so it can be downloaded again unchanged.
    """

    name = models.CharField(max_length=200)
    original_filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100, blank=True)
    file_data = models.BinaryField()
    file_size = models.PositiveIntegerField(default=0)
    sheets = models.JSONField(default=list)
    sheet_names = models.JSONField(default=list)
    sheet_count = models.PositiveIntegerField(default=0)
    row_count = models.PositiveIntegerField(default=0)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='+')
    uploaded_by_name = models.CharField(max_length=150)
    uploaded_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ['-uploaded_at', '-id']

    def __str__(self):
        return self.name

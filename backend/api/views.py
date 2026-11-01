import base64

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q, Sum
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .exceptions import ApiError
from .models import (
    MONTH_NAMES, AuditLog, Notification, Payment, SchoolSettings, Student,
    StudentFeeRecord, UserProfile, UserRole, Vendor, VendorInvoice,
)
from .permissions import require_original_editor, require_role, role_of
from .serializers import (
    RECORD_ID_PREFIX, money, serialize_audit_log, serialize_notification, serialize_payment, serialize_settings,
    serialize_student, serialize_user, serialize_vendor,
)
from .services import STUDENT, VENDOR, clean_str, log_audit

User = get_user_model()

MIN_PASSWORD_LENGTH = 6
MAX_AVATAR_BYTES = 2 * 1024 * 1024


def linked_vendor(user):
    return user.profile.vendor


def find_user(user_id):
    try:
        return User.objects.select_related('profile', 'profile__vendor').get(pk=int(user_id), profile__isnull=False)
    except (ValueError, TypeError, User.DoesNotExist):
        raise ApiError('User not found.', status.HTTP_404_NOT_FOUND)


def validate_new_password(password):
    password = clean_str(password)
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ApiError(f'Password must be at least {MIN_PASSWORD_LENGTH} characters long.')
    return password


# =============================================================================
# Authentication & profile
# =============================================================================


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = clean_str(request.data.get('email') or request.data.get('username')).lower()
        password = clean_str(request.data.get('password'))
        if not identifier or not password:
            raise ApiError('Please enter both your email/username and password.')

        user = (
            User.objects.select_related('profile', 'profile__vendor')
            .filter(profile__isnull=False)
            .filter(Q(email__iexact=identifier) | Q(username__iexact=identifier)
                    | Q(profile__full_name__iexact=identifier))
            .first()
        )
        if user is None:
            raise ApiError('Invalid email or username. Please check your credentials.', status.HTTP_401_UNAUTHORIZED)
        if not user.check_password(password):
            raise ApiError('Incorrect password. Please verify and try again.', status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            raise ApiError('This user account is currently deactivated. Please contact the Super Admin.',
                           status.HTTP_403_FORBIDDEN)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'success': True, 'token': token.key, 'user': serialize_user(user)})


class LogoutView(APIView):
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({'success': True, 'message': 'Logged out successfully'})


class CurrentUserView(APIView):
    def get(self, request):
        return Response(serialize_user(request.user))


class UserListView(APIView):
    def get(self, request):
        require_role(request.user, [UserRole.GM], 'Only GM / Super Admin can view user accounts.')
        users = User.objects.select_related('profile', 'profile__vendor').filter(profile__isnull=False).order_by('pk')
        return Response([serialize_user(u) for u in users])


class SwitchRoleView(APIView):
    def post(self, request):
        if clean_str(request.data.get('role')) == role_of(request.user):
            return Response({'success': True, 'user': serialize_user(request.user)})
        raise ApiError('Role switching is disabled. Please sign in with an account that has the required role.',
                       status.HTTP_403_FORBIDDEN)


class ChangePasswordView(APIView):
    def post(self, request):
        user = request.user
        new_password = validate_new_password(request.data.get('newPassword'))
        if not user.check_password(clean_str(request.data.get('currentPassword'))):
            raise ApiError('Current password does not match.')
        if user.check_password(new_password):
            raise ApiError('New password must be different from the current password.')

        user.set_password(new_password)
        user.save(update_fields=['password'])
        user.profile.needs_password_change = False
        user.profile.save(update_fields=['needs_password_change'])
        log_audit(user, 'USER_UPDATED', 'User', user.pk, user.email, category='USER_SECURITY',
                  details='Password changed', reason='User password changed successfully')
        return Response({'success': True, 'message': 'Password updated successfully.', 'user': serialize_user(user)})


class ProfileView(APIView):
    def get(self, request):
        return Response(serialize_user(request.user))

    def post(self, request):
        user = request.user
        profile = user.profile
        data = request.data
        changed = []

        if not services.is_blank(data.get('name')):
            profile.full_name = clean_str(data['name'])
            changed.append('name')
        for key in ('phone', 'department'):
            if key in data and data[key] is not None:
                setattr(profile, key, clean_str(data[key]))
                changed.append(key)

        upload = request.FILES.get('avatar')
        if upload is not None:
            if upload.size > MAX_AVATAR_BYTES:
                raise ApiError('Profile picture must be 2 MB or smaller.')
            if not (upload.content_type or '').startswith('image/'):
                raise ApiError('Profile picture must be an image file.')
            encoded = base64.b64encode(upload.read()).decode('ascii')
            profile.avatar = f'data:{upload.content_type};base64,{encoded}'
            changed.append('avatar')
        else:
            avatar = data.get('avatar') or data.get('avatar_url')
            if avatar:
                avatar = clean_str(avatar)
                if not (avatar.startswith('data:image/') or avatar.startswith(('http://', 'https://'))):
                    raise ApiError('Profile picture must be an image URL or image data URL.')
                if len(avatar) > MAX_AVATAR_BYTES * 4 // 3 + 100:
                    raise ApiError('Profile picture must be 2 MB or smaller.')
                profile.avatar = avatar
                changed.append('avatar')

        if changed:
            profile.save()
            log_audit(user, 'USER_UPDATED', 'User', user.pk, profile.full_name, category='USER_PROFILE',
                      details=f'Profile updated: {", ".join(changed)}', reason='User profile customization')
        return Response({'success': True, 'user': serialize_user(user)})


class UserManageView(APIView):
    """Single endpoint the frontend uses for create / toggle_active / delete / reset_password."""

    def post(self, request):
        actor = request.user
        require_role(actor, [UserRole.GM], 'Only GM / Super Admin can manage user accounts')
        action = clean_str(request.data.get('action'))
        user_data = request.data.get('userData') or {}
        if not isinstance(user_data, dict):
            raise ApiError('userData must be an object.')

        if action == 'create':
            return self.create(actor, user_data)

        target = find_user(request.data.get('userId'))
        if action == 'toggle_active':
            return self.toggle_active(actor, target)
        if action == 'delete':
            return self.delete(actor, target)
        if action == 'reset_password':
            return self.reset_password(actor, target, user_data)
        raise ApiError('Invalid user management action')

    def create(self, actor, data):
        name = clean_str(data.get('name'))
        email = clean_str(data.get('email')).lower()
        role = clean_str(data.get('role')).upper()
        if not name or not email:
            raise ApiError('Full Name and Official Email are required.')
        if '@' not in email:
            raise ApiError('Please provide a valid email address.')
        if role not in UserRole.values:
            raise ApiError(f'Invalid role. Use one of: {", ".join(UserRole.values)}.')
        if User.objects.filter(Q(email__iexact=email) | Q(username__iexact=email)).exists():
            raise ApiError(f'A user with email {email} already exists.')
        password = validate_new_password(data.get('password') or 'school@123')

        with transaction.atomic():
            vendor = None
            if role == UserRole.VENDOR:
                vendor_code = clean_str(data.get('vendorId'))
                if vendor_code:
                    vendor = services.upsert_vendor(vendor_code, name)
                else:
                    vendor = Vendor.objects.create(vendor_id=services.next_vendor_code(), company_name=name,
                                                   email=email, phone=clean_str(data.get('phone')))

            user = User.objects.create_user(username=email, email=email, password=password)
            UserProfile.objects.create(
                user=user, full_name=name, role=role,
                department=clean_str(data.get('department')) or 'School Staff',
                phone=clean_str(data.get('phone')),
                needs_password_change=True,
                vendor=vendor,
            )
            log_audit(actor, 'USER_UPDATED', 'User', user.pk, email, category='USER_GOVERNANCE',
                      details='User account created', new={'role': role, 'email': email},
                      reason=f'New {role} user created by Super Admin ({actor.profile.full_name}) with default password')
        return Response({'success': True, 'user': serialize_user(user)}, status=status.HTTP_201_CREATED)

    def toggle_active(self, actor, target):
        if target.pk == actor.pk or target.profile.is_primary_admin:
            raise ApiError('You cannot deactivate your own account or the primary Super Admin.')
        target.is_active = not target.is_active
        target.save(update_fields=['is_active'])
        if not target.is_active:
            Token.objects.filter(user=target).delete()
        state = 'Active' if target.is_active else 'Inactive'
        log_audit(actor, 'USER_UPDATED', 'User', target.pk, target.email, category='USER_GOVERNANCE',
                  details=f'Account set to {state}', previous={'isActive': not target.is_active},
                  new={'isActive': target.is_active}, reason=f'Status toggled to {state} by Super Admin')
        return Response({'success': True, 'user': serialize_user(target)})

    def delete(self, actor, target):
        if target.pk == actor.pk or target.profile.is_primary_admin:
            raise ApiError('The primary Super Admin account cannot be removed.')
        name, pk, email = target.profile.full_name, target.pk, target.email
        target.delete()
        log_audit(actor, 'USER_UPDATED', 'User', pk, email, category='USER_GOVERNANCE',
                  details='User account deleted',
                  reason=f'User account deleted by Super Admin ({actor.profile.full_name})')
        return Response({'success': True, 'message': f'User {name} removed successfully.'})

    def reset_password(self, actor, target, data):
        password = validate_new_password(data.get('newPassword'))
        target.set_password(password)
        target.save(update_fields=['password'])
        target.profile.needs_password_change = True
        target.profile.save(update_fields=['needs_password_change'])
        Token.objects.filter(user=target).delete()
        log_audit(actor, 'USER_UPDATED', 'User', target.pk, target.email, category='USER_SECURITY',
                  details='Password reset', reason=f'Password reset by Super Admin ({actor.profile.full_name})')
        return Response({'success': True, 'message': f'Password reset successfully for {target.profile.full_name}.'})


# =============================================================================
# Dashboard
# =============================================================================


def _totals(queryset):
    agg = queryset.aggregate(billed=Sum('total_amount'), paid=Sum('paid_amount'), balance=Sum('balance'))
    return money(agg['billed']), money(agg['paid']), money(agg['balance'])


class DashboardSummaryView(APIView):
    def get(self, request):
        StudentFeeRecord.refresh_overdue_statuses()
        VendorInvoice.refresh_overdue_statuses()
        month = clean_str(request.query_params.get('month'))
        year = clean_str(request.query_params.get('year'))
        month = '' if month == 'all' else month
        year = year if year.isdigit() else ''

        if role_of(request.user) == UserRole.VENDOR:
            return Response(self.vendor_summary(request.user))

        fees = StudentFeeRecord.objects.all()
        invoices = VendorInvoice.objects.all()
        if month:
            fees, invoices = fees.filter(month__iexact=month), invoices.filter(month__iexact=month)
        if year:
            fees, invoices = fees.filter(year=int(year)), invoices.filter(year=int(year))

        s_billed, s_paid, s_balance = _totals(fees)
        v_billed, v_paid, v_balance = _totals(invoices)

        trend_fees = StudentFeeRecord.objects.filter(year=int(year)) if year else StudentFeeRecord.objects.all()
        trend_invs = VendorInvoice.objects.filter(year=int(year)) if year else VendorInvoice.objects.all()
        fee_by_month = {row['month']: row for row in
                        trend_fees.values('month').annotate(paid=Sum('paid_amount'), balance=Sum('balance'))}
        inv_by_month = {row['month']: row for row in trend_invs.values('month').annotate(paid=Sum('paid_amount'))}
        monthly_trends = [
            {
                'month': name[:3],
                'feesCollected': money(fee_by_month.get(name, {}).get('paid')),
                'vendorPayments': money(inv_by_month.get(name, {}).get('paid')),
                'outstandingDues': money(fee_by_month.get(name, {}).get('balance')),
            }
            for name in MONTH_NAMES
        ]

        recent = visible_audit_logs(request.user)[:8]
        return Response({
            'role': role_of(request.user),
            'studentMetrics': {
                'totalBilled': s_billed,
                'totalCollected': s_paid,
                'outstandingDues': s_balance,
                'overdueCount': fees.filter(payment_status='Overdue').count(),
                'unpaidCount': fees.filter(payment_status__in=['Unpaid', 'Partially Paid']).count(),
                'activeStudents': Student.objects.count(),
            },
            'vendorMetrics': {
                'totalBilled': v_billed,
                'totalPaid': v_paid,
                'outstandingPayable': v_balance,
                'overdueCount': invoices.filter(payment_status='Overdue').count(),
                'activeVendors': Vendor.objects.filter(is_active=True).count(),
            },
            'monthlyTrends': monthly_trends,
            'flaggedCount': (StudentFeeRecord.objects.filter(is_flagged_for_review=True).count()
                             + VendorInvoice.objects.filter(is_flagged_for_review=True).count()),
            'recentAudit': [serialize_audit_log(entry) for entry in recent],
        })

    def vendor_summary(self, user):
        vendor = linked_vendor(user)
        invoices = VendorInvoice.objects.filter(vendor=vendor) if vendor else VendorInvoice.objects.none()
        billed, paid, balance = _totals(invoices)
        return {
            'role': UserRole.VENDOR,
            'vendorName': vendor.company_name if vendor else user.profile.full_name,
            'totalBilled': billed,
            'totalPaid': paid,
            'totalBalance': balance,
            'unpaidCount': invoices.exclude(payment_status='Paid').count(),
            'invoices': [VENDOR.serialize(inv) for inv in invoices.select_related('vendor')],
        }


# =============================================================================
# Financial records (student fees & vendor invoices share these views)
# =============================================================================


class FinancialRecordListView(APIView):
    kind = None

    def scoped_queryset(self, user):
        kind = self.kind
        role = role_of(user)
        qs = kind.model.objects.select_related('student' if kind.key == 'student' else 'vendor')
        if role == UserRole.VENDOR:
            if kind.key == 'student':
                raise ApiError('Vendors do not have access to student financial records', status.HTTP_403_FORBIDDEN)
            vendor = linked_vendor(user)
            return qs.filter(vendor=vendor) if vendor else qs.none()
        return qs

    def get(self, request):
        self.kind.model.refresh_overdue_statuses()
        qs = self.scoped_queryset(request.user)
        vendor_safe = role_of(request.user) == UserRole.VENDOR
        qs = services.filter_financial_records(self.kind, qs, request.query_params, vendor_safe=vendor_safe)
        qs = services.apply_ordering(qs, request.query_params.get('ordering'),
                                     services.financial_ordering(self.kind), '-created_at')
        return Response(services.paginate(qs, request.query_params, self.kind.serialize))

    def post(self, request):
        message = ('Only the Accountant is authorized to create original student financial records.'
                   if self.kind.key == 'student' else 'Only the Accountant is authorized to enter vendor bills.')
        require_role(request.user, [UserRole.ACCOUNTANT], message)
        record = services.create_record(self.kind, request.user, request.data)
        return Response(self.kind.serialize(record), status=status.HTTP_201_CREATED)


class FinancialRecordDetailView(FinancialRecordListView):
    def get(self, request, pk):
        qs = self.scoped_queryset(request.user)
        record = services.get_record(self.kind, pk)
        if not qs.filter(pk=record.pk).exists():
            raise ApiError('Record not found.', status.HTTP_404_NOT_FOUND)
        return Response(self.kind.serialize(record))

    def put(self, request, pk):
        services.get_record(self.kind, pk)  # 404 before 403, matching the mock server
        require_original_editor(request.user)
        record = services.update_record(self.kind, request.user, pk, request.data)
        return Response(self.kind.serialize(record))

    patch = put

    def delete(self, request, pk):
        services.get_record(self.kind, pk)
        require_original_editor(request.user, deleting=True)
        services.delete_record(self.kind, request.user, pk)
        return Response({'success': True, 'message': 'Record removed successfully'})


class FinancialRecordFlagView(APIView):
    kind = None

    def post(self, request, pk):
        require_role(request.user, [UserRole.GM, UserRole.HOD], 'Only GM or HOD can flag records for review.')
        record = services.flag_record(self.kind, request.user, pk, request.data.get('reason'),
                                      services.parse_bool(request.data.get('unflag')))
        return Response(self.kind.serialize(record))


class FinancialRecordRevisionView(APIView):
    kind = None

    def post(self, request, pk):
        require_role(request.user, [UserRole.HOD, UserRole.ACCOUNTANT],
                     'Only HOD or Accountant can submit authorized revisions.')
        record = services.submit_revision(self.kind, request.user, pk, clean_str(request.data.get('field')),
                                          request.data.get('newValue'), request.data.get('reason'))
        return Response(self.kind.serialize(record))


class FinancialRecordPaymentView(APIView):
    kind = None

    def get(self, request, pk):
        record = services.get_record(self.kind, pk)
        if role_of(request.user) == UserRole.VENDOR and (
                self.kind.key == 'student' or record.vendor != linked_vendor(request.user)):
            raise ApiError('Record not found.', status.HTTP_404_NOT_FOUND)
        return Response([serialize_payment(p) for p in record.payments.all()])

    def post(self, request, pk):
        require_role(request.user, [UserRole.ACCOUNTANT, UserRole.HOD], 'Only Accountant or HOD can record payments.')
        record, payment = services.record_payment(self.kind, request.user, pk, request.data)
        return Response({'record': self.kind.serialize(record), 'payment': serialize_payment(payment)},
                        status=status.HTTP_201_CREATED)


class StudentListView(APIView):
    def get(self, request):
        if role_of(request.user) == UserRole.VENDOR:
            raise ApiError('Vendors do not have access to student records', status.HTTP_403_FORBIDDEN)
        return Response([serialize_student(s) for s in Student.objects.all()])


class VendorListView(APIView):
    def get(self, request):
        vendors = Vendor.objects.all()
        if role_of(request.user) == UserRole.VENDOR:
            vendor = linked_vendor(request.user)
            vendors = vendors.filter(pk=vendor.pk) if vendor else vendors.none()
        return Response([serialize_vendor(v) for v in vendors])


# =============================================================================
# Payments ledger
# =============================================================================


class PaymentListView(APIView):
    ORDERING = {'created_at': 'created_at', 'date': 'payment_date', 'paymentDate': 'payment_date', 'amount': 'amount'}

    def get(self, request):
        params = request.query_params
        qs = Payment.objects.select_related('student_fee', 'vendor_invoice')
        if role_of(request.user) == UserRole.VENDOR:
            vendor = linked_vendor(request.user)
            qs = qs.filter(record_type='vendor', vendor_invoice__vendor=vendor) if vendor else qs.none()

        def value(name):
            raw = clean_str(params.get(name))
            return '' if raw == 'all' else raw

        if value('recordId'):
            record_id = value('recordId')
            kind = VENDOR if record_id.startswith(RECORD_ID_PREFIX['vendor']) else STUDENT
            try:
                pk = services.parse_record_pk(kind, record_id)
            except ValueError:
                pk = None
            if pk is None:
                qs = qs.none()
            elif kind is VENDOR:
                qs = qs.filter(vendor_invoice_id=pk)
            else:
                qs = qs.filter(student_fee_id=pk)
        if value('invoiceNumber'):
            qs = qs.filter(invoice_number=value('invoiceNumber'))
        if value('recordType'):
            qs = qs.filter(record_type=value('recordType'))
        if value('paymentMethod'):
            qs = qs.filter(payment_method=value('paymentMethod'))
        if value('search'):
            s = value('search')
            qs = qs.filter(Q(payment_number__icontains=s) | Q(invoice_number__icontains=s)
                           | Q(reference_number__icontains=s) | Q(receipt_notes__icontains=s)
                           | Q(recorded_by_name__icontains=s))
        if value('start_date'):
            qs = qs.filter(payment_date__gte=services.parse_date(value('start_date'), 'start date'))
        if value('end_date'):
            qs = qs.filter(payment_date__lte=services.parse_date(value('end_date'), 'end date'))
        if value('min_amount'):
            qs = qs.filter(amount__gte=services.parse_decimal(value('min_amount'), 'Minimum amount'))
        if value('max_amount'):
            qs = qs.filter(amount__lte=services.parse_decimal(value('max_amount'), 'Maximum amount'))
        if value('month'):
            month = services.parse_month(value('month'))
            qs = qs.filter(payment_date__month=MONTH_NAMES.index(month) + 1)
        if value('year').isdigit():
            qs = qs.filter(payment_date__year=int(value('year')))

        qs = services.apply_ordering(qs, params.get('ordering'), self.ORDERING, '-created_at')
        return Response(services.paginate(qs, params, serialize_payment))


# =============================================================================
# Audit logs
# =============================================================================


def visible_audit_logs(user):
    """
    Visibility matrix documented in the frontend's AuditLogsModule:
      - Accountant: only entries they personally made
      - HOD: only entries made by Accountants
      - GM: their own role's entries plus all Accountant entries
    """
    role = role_of(user)
    qs = AuditLog.objects.all()
    if role == UserRole.ACCOUNTANT:
        return qs.filter(performed_by=user)
    if role == UserRole.HOD:
        return qs.filter(performed_by_role=UserRole.ACCOUNTANT)
    if role == UserRole.GM:
        return qs.filter(performed_by_role__in=[UserRole.GM, UserRole.ACCOUNTANT])
    return qs.none()


class AuditLogListView(APIView):
    ORDERING = {'timestamp': 'timestamp', 'created_at': 'timestamp'}

    def get(self, request):
        require_role(request.user, [UserRole.GM, UserRole.ACCOUNTANT, UserRole.HOD],
                     'Vendors do not have access to audit logs')
        params = request.query_params
        qs = visible_audit_logs(request.user)

        def value(name):
            raw = clean_str(params.get(name))
            return '' if raw == 'all' else raw

        if value('action'):
            qs = qs.filter(action=value('action'))
        if value('modelName'):
            qs = qs.filter(model_name=value('modelName'))
        if value('performedByRole'):
            qs = qs.filter(performed_by_role=value('performedByRole'))
        if value('search'):
            s = value('search')
            qs = qs.filter(Q(record_identifier__icontains=s) | Q(performed_by_name__icontains=s)
                           | Q(reason__icontains=s) | Q(details__icontains=s))
        if value('start_date'):
            qs = qs.filter(timestamp__date__gte=services.parse_date(value('start_date'), 'start date'))
        if value('end_date'):
            qs = qs.filter(timestamp__date__lte=services.parse_date(value('end_date'), 'end date'))

        qs = services.apply_ordering(qs, params.get('ordering'), self.ORDERING, '-timestamp')
        return Response(services.paginate(qs, params, serialize_audit_log, default_page_size=20))


# =============================================================================
# Settings
# =============================================================================


class SettingsView(APIView):
    TEXT_FIELDS = {
        'schoolName': 'school_name',
        'currencyCode': 'currency_code',
        'academicSession': 'academic_session',
        'financialYear': 'financial_year',
        'contactEmail': 'contact_email',
        'contactPhone': 'contact_phone',
        'address': 'address',
        'taxRegistrationNumber': 'tax_registration_number',
    }
    LIST_FIELDS = {'feeCategories': 'fee_categories', 'vendorCategories': 'vendor_categories'}

    def get_permissions(self):
        # School name/contact details are public; the login screen and footer may show them.
        return [AllowAny()] if self.request.method == 'GET' else super().get_permissions()

    def get(self, request):
        return Response(serialize_settings(SchoolSettings.load()))

    def post(self, request):
        require_role(request.user, [UserRole.GM], 'Only the GM can modify school settings')
        obj = SchoolSettings.load()
        before = serialize_settings(obj)

        for key, field in self.TEXT_FIELDS.items():
            if key in request.data:
                value = clean_str(request.data[key])
                if not value and key not in ('taxRegistrationNumber',):
                    raise ApiError(f'{key} cannot be empty.')
                setattr(obj, field, value)
        for key, field in self.LIST_FIELDS.items():
            if key in request.data:
                items = request.data[key]
                if not isinstance(items, list):
                    raise ApiError(f'{key} must be a list.')
                cleaned = list(dict.fromkeys(clean_str(i) for i in items if clean_str(i)))
                if not cleaned:
                    raise ApiError(f'{key} must contain at least one category.')
                setattr(obj, field, cleaned)

        obj.full_clean()
        obj.save()
        after = serialize_settings(obj)
        changed = {k for k in after if after[k] != before[k]}
        if changed:
            log_audit(request.user, 'SETTINGS_UPDATED', 'SchoolSettings', 'settings-1', 'School Configuration',
                      category='SYSTEM_SETTINGS', details=f'Updated: {", ".join(sorted(changed))}',
                      previous={k: before[k] for k in changed}, new={k: after[k] for k in changed},
                      reason='School settings updated by GM')
        return Response(after)


# =============================================================================
# Notifications
# =============================================================================


def visible_notifications(user):
    role = role_of(user)
    # recipient_roles is a JSON list; filtered in Python so it works on SQLite and PostgreSQL alike.
    return [n for n in Notification.objects.prefetch_related('read_by')[:200]
            if not n.recipient_roles or role in n.recipient_roles]


class NotificationListView(APIView):
    def get(self, request):
        return Response([serialize_notification(n, request.user) for n in visible_notifications(request.user)])


class NotificationReadView(APIView):
    def post(self, request, pk):
        notification = next((n for n in visible_notifications(request.user) if str(n.pk) == str(pk)), None)
        if notification is None:
            raise ApiError('Notification not found.', status.HTTP_404_NOT_FOUND)
        notification.read_by.add(request.user)
        return Response({'success': True})


# =============================================================================
# Bulk import
# =============================================================================


class ImportCommitView(APIView):
    KINDS = {'student_fees': STUDENT, 'vendor_invoices': VENDOR, 'vendor_payables': VENDOR}

    def post(self, request):
        require_role(request.user, [UserRole.ACCOUNTANT], 'Only the Accountant can perform bulk data imports')
        kind = self.KINDS.get(clean_str(request.data.get('category')))
        if kind is None:
            raise ApiError('Invalid import category. Use "student_fees" or "vendor_invoices".')
        rows = request.data.get('rows')
        if not isinstance(rows, list) or not rows:
            raise ApiError('No rows provided for import')
        if len(rows) > 5000:
            raise ApiError('A single import is limited to 5000 rows.')

        imported, errors = services.import_rows(kind, request.user, rows)
        return Response({'success': True, 'importedCount': imported, 'rejectedCount': len(errors), 'errors': errors})


class HealthView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'status': 'ok'})

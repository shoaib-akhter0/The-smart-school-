"""
Business rules shared by the student-fee and vendor-invoice endpoints: input parsing,
record creation/editing, payments, flags, authorized revisions, audit logging and notifications.
"""
import datetime
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from .exceptions import ApiError
from .models import (
    MONTH_NAMES, ZERO, AuditLog, Notification, Payment, PaymentMethod, SchoolSettings, Student,
    StudentFeeRecord, Vendor, VendorInvoice,
)
from .serializers import RECORD_ID_PREFIX, serialize_student_fee, serialize_vendor_invoice

# ---------------------------------------------------------------------------
# Input parsing
# ---------------------------------------------------------------------------


def clean_str(value):
    return str(value).strip() if value is not None else ''


def is_blank(value):
    return value is None or clean_str(value) == ''


def parse_decimal(value, label, *, required=True, default=None):
    if is_blank(value):
        if required:
            raise ApiError(f'{label} is required.')
        return default
    try:
        number = Decimal(clean_str(value).replace(',', ''))
    except InvalidOperation:
        raise ApiError(f'{label} must be a valid number.')
    if not number.is_finite():
        raise ApiError(f'{label} must be a valid number.')
    return number.quantize(Decimal('0.01'))


def parse_date(value, label, *, required=True, default=None):
    if is_blank(value):
        if required:
            raise ApiError(f'Valid {label} (YYYY-MM-DD) is required.')
        return default
    try:
        return datetime.date.fromisoformat(clean_str(value)[:10])
    except ValueError:
        raise ApiError(f'Valid {label} (YYYY-MM-DD) is required.')


def parse_month(value, *, default=None):
    text = clean_str(value)
    if not text:
        if default:
            return default
        raise ApiError('Billing month is required.')
    for name in MONTH_NAMES:
        if text.lower() in (name.lower(), name[:3].lower()):
            return name
    raise ApiError(f'"{text}" is not a valid billing month.')


def parse_year(value, *, default=None):
    if is_blank(value):
        if default:
            return default
        raise ApiError('Valid 4-digit billing year is required.')
    try:
        year = int(clean_str(value))
    except ValueError:
        raise ApiError('Valid 4-digit billing year is required.')
    if not 2000 <= year <= 2100:
        raise ApiError('Valid 4-digit billing year is required.')
    return year


def parse_payment_method(value):
    method = clean_str(value).upper() or PaymentMethod.BANK_TRANSFER
    if method not in PaymentMethod.values:
        raise ApiError(f'Invalid payment method "{value}". Use one of: {", ".join(PaymentMethod.values)}.')
    return method


def parse_bool(value):
    if isinstance(value, bool):
        return value
    return clean_str(value).lower() in ('1', 'true', 'yes', 'on')


def jsonable(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value.isoformat()
    return value


# ---------------------------------------------------------------------------
# Actor helpers, audit log and notifications
# ---------------------------------------------------------------------------


def actor_name(user):
    return user.profile.full_name


def actor_label(user, suffix=None):
    return f'{user.profile.full_name} ({suffix or user.profile.role})'


def log_audit(actor, action, model_name, record_id, identifier, *, category='GENERAL', details='',
              previous=None, new=None, reason=''):
    return AuditLog.objects.create(
        action=action,
        category=category,
        details=details,
        model_name=model_name,
        record_id=str(record_id),
        record_identifier=str(identifier)[:200],
        previous_values={k: jsonable(v) for k, v in previous.items()} if previous else None,
        new_values={k: jsonable(v) for k, v in new.items()} if new else None,
        reason=reason or '',
        performed_by=actor,
        performed_by_name=actor_name(actor),
        performed_by_role=actor.profile.role,
    )


def notify(title, message, *, notification_type='INFO', target_tab='', roles=None):
    return Notification.objects.create(
        title=title[:200],
        message=message,
        notification_type=notification_type,
        target_tab=target_tab,
        recipient_roles=list(roles or []),
    )


# ---------------------------------------------------------------------------
# Record kinds
# ---------------------------------------------------------------------------

COMMON_REVISABLE = {
    'totalAmount': 'total_amount',
    'category': 'category',
    'dueDate': 'due_date',
    'month': 'month',
    'year': 'year',
    'notes': 'notes',
}


@dataclass(frozen=True)
class RecordKind:
    key: str                 # 'student' | 'vendor'
    model: type
    model_name: str          # used in audit logs
    audit_category: str
    payment_prefix: str
    tab: str                 # frontend tab to open from notifications
    issue_date_field: str    # model field
    issue_date_key: str      # JSON key
    party_label: str
    revisable: dict
    serialize: object

    def party_name(self, record):
        return record.student_name if self.key == 'student' else record.vendor_name


STUDENT = RecordKind(
    key='student', model=StudentFeeRecord, model_name='StudentFeeRecord', audit_category='STUDENT_FEES',
    payment_prefix='STD', tab='students', issue_date_field='bill_issue_date', issue_date_key='billIssueDate',
    party_label='student', revisable=COMMON_REVISABLE, serialize=serialize_student_fee,
)
VENDOR = RecordKind(
    key='vendor', model=VendorInvoice, model_name='VendorInvoice', audit_category='VENDOR_PAYABLES',
    payment_prefix='VND', tab='vendors', issue_date_field='issue_date', issue_date_key='issueDate',
    party_label='vendor', revisable={**COMMON_REVISABLE, 'description': 'description'},
    serialize=serialize_vendor_invoice,
)


def parse_record_pk(kind, public_id):
    """Accept `fee-12` / `vinv-12` (as serialized) or a bare `12`."""
    text = clean_str(public_id)
    prefix = RECORD_ID_PREFIX[kind.key]
    if text.startswith(prefix):
        text = text[len(prefix):]
    return int(text)


def get_record(kind, pk, *, for_update=False):
    qs = kind.model.objects.select_related('student' if kind.key == 'student' else 'vendor')
    if for_update:
        qs = qs.select_for_update()
    try:
        return qs.get(pk=parse_record_pk(kind, pk))
    except (ValueError, TypeError, kind.model.DoesNotExist):
        raise ApiError('Record not found.' if kind.key == 'student' else 'Invoice not found.', 404)


def invoice_number_taken(kind, invoice_number):
    return kind.model.objects.filter(invoice_number__iexact=invoice_number).exists()


# ---------------------------------------------------------------------------
# Parties (students / vendors)
# ---------------------------------------------------------------------------


def upsert_student(student_id, full_name, grade_class, academic_session=''):
    student, created = Student.objects.get_or_create(
        student_id=student_id,
        defaults={'full_name': full_name, 'grade_class': grade_class, 'academic_session': academic_session},
    )
    if not created and (student.full_name != full_name or student.grade_class != grade_class):
        student.full_name = full_name
        student.grade_class = grade_class
        student.save(update_fields=['full_name', 'grade_class', 'updated_at'])
    return student


def next_vendor_code():
    number = Vendor.objects.count() + 101
    while Vendor.objects.filter(vendor_id=f'VND-{number}').exists():
        number += 1
    return f'VND-{number}'


def upsert_vendor(vendor_id, company_name, category=''):
    vendor, _ = Vendor.objects.get_or_create(
        vendor_id=vendor_id,
        defaults={'company_name': company_name, 'category': category},
    )
    return vendor


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


def _validated_common(kind, data):
    invoice_number = clean_str(data.get('invoiceNumber'))
    if not invoice_number:
        raise ApiError('Invoice / Bill number is required.')
    if invoice_number_taken(kind, invoice_number):
        raise ApiError(f'Invoice number {invoice_number} already exists.')

    category = clean_str(data.get('category'))
    if not category:
        raise ApiError('Category is required.')

    total = parse_decimal(data.get('totalAmount'), 'Total amount')
    if total <= ZERO:
        raise ApiError('Total amount must be greater than zero.')
    paid = parse_decimal(data.get('paidAmount'), 'Paid amount', required=False, default=ZERO)
    if paid < ZERO:
        raise ApiError('Paid amount cannot be negative.')
    if paid > total:
        raise ApiError('Paid amount cannot exceed total amount.')

    issue_date = parse_date(data.get(kind.issue_date_key), 'issue date', required=False,
                            default=timezone.localdate())
    due_date = parse_date(data.get('dueDate'), 'due date')

    return {
        'invoice_number': invoice_number,
        'category': category,
        'total_amount': total,
        'paid_amount': paid,
        kind.issue_date_field: issue_date,
        'due_date': due_date,
        'month': parse_month(data.get('month'), default=MONTH_NAMES[issue_date.month - 1]),
        'year': parse_year(data.get('year'), default=issue_date.year),
        'notes': clean_str(data.get('notes')),
    }


def _validated_party(kind, data):
    if kind.key == 'student':
        student_id = clean_str(data.get('studentId'))
        student_name = clean_str(data.get('studentName'))
        grade_class = clean_str(data.get('gradeClass'))
        if not student_id:
            raise ApiError('Student ID / Registration number is required.')
        if not student_name:
            raise ApiError('Student full name is required.')
        if not grade_class:
            raise ApiError('Grade / Class is required.')
        return {'student_id': student_id, 'student_name': student_name, 'grade_class': grade_class}

    vendor_id = clean_str(data.get('vendorId'))
    vendor_name = clean_str(data.get('vendorName'))
    if not vendor_id:
        raise ApiError('Vendor ID is required.')
    if not vendor_name:
        raise ApiError('Supplier / Company name is required.')
    return {
        'vendor_id': vendor_id,
        'vendor_name': vendor_name,
        'description': clean_str(data.get('description')),
        'attachment_name': clean_str(data.get('attachmentName')),
    }


def create_record(kind, actor, data, *, created_by_suffix=None, default_notes=''):
    """Create an original record (Accountant only — enforced by the caller)."""
    fields = _validated_common(kind, data)
    party = _validated_party(kind, data)
    if default_notes and not fields['notes']:
        fields['notes'] = default_notes

    with transaction.atomic():
        if kind.key == 'student':
            student = upsert_student(party['student_id'], party['student_name'], party['grade_class'],
                                     SchoolSettings.load().academic_session)
            extra = {'student': student, 'student_name': party['student_name'], 'grade_class': party['grade_class']}
        else:
            vendor = upsert_vendor(party['vendor_id'], party['vendor_name'], fields['category'])
            extra = {'vendor': vendor, 'vendor_name': party['vendor_name'],
                     'description': party['description'], 'attachment_name': party['attachment_name']}

        paid = fields['paid_amount']
        issue_date = fields[kind.issue_date_field]
        record = kind.model.objects.create(
            **fields, **extra,
            last_payment_date=issue_date if paid > ZERO else None,
            created_by=actor,
            created_by_name=actor_label(actor, created_by_suffix),
            created_by_role=actor.profile.role,
        )

        if paid > ZERO:
            _create_payment(
                kind, record, actor, amount=paid, payment_date=issue_date,
                method=parse_payment_method(data.get('paymentMethod')),
                reference=clean_str(data.get('paymentRef')) or (
                    'INITIAL-RECEIPT' if kind.key == 'student' else 'INITIAL-DISBURSEMENT'),
                notes=('Initial payment recorded during fee creation' if kind.key == 'student'
                       else 'Initial vendor disbursement'),
            )

        log_audit(
            actor, 'RECORD_CREATED', kind.model_name, record.pk, record.invoice_number,
            category=kind.audit_category,
            details=f'{kind.party_label.title()} record created for {kind.party_name(record)}',
            new={kind.party_label: kind.party_name(record), 'total': record.total_amount,
                 'paid': record.paid_amount, 'month': record.month, 'year': record.year},
        )
    return record


# ---------------------------------------------------------------------------
# Edit / delete (Accountant)
# ---------------------------------------------------------------------------


def update_record(kind, actor, pk, data):
    with transaction.atomic():
        record = get_record(kind, pk, for_update=True)
        tracked = ['total_amount', 'due_date', 'month', 'year', 'category', 'notes', kind.issue_date_field]
        if kind.key == 'student':
            tracked += ['student_name', 'grade_class']
        else:
            tracked += ['description', 'vendor_name']
        before = {f: getattr(record, f) for f in tracked}

        if 'totalAmount' in data and not is_blank(data['totalAmount']):
            total = parse_decimal(data['totalAmount'], 'Total amount')
            if total <= ZERO:
                raise ApiError('Total amount must be greater than zero.')
            if total < record.paid_amount:
                raise ApiError(f'Total amount cannot be less than the amount already paid ({record.paid_amount}).')
            record.total_amount = total
        if not is_blank(data.get('dueDate')):
            record.due_date = parse_date(data['dueDate'], 'due date')
        if not is_blank(data.get(kind.issue_date_key)):
            setattr(record, kind.issue_date_field, parse_date(data[kind.issue_date_key], 'issue date'))
        if not is_blank(data.get('month')):
            record.month = parse_month(data['month'])
        if not is_blank(data.get('year')):
            record.year = parse_year(data['year'])
        if not is_blank(data.get('category')):
            record.category = clean_str(data['category'])
        if 'notes' in data and data['notes'] is not None:
            record.notes = clean_str(data['notes'])

        if kind.key == 'student':
            if not is_blank(data.get('studentName')):
                record.student_name = clean_str(data['studentName'])
            if not is_blank(data.get('gradeClass')):
                record.grade_class = clean_str(data['gradeClass'])
        else:
            if not is_blank(data.get('description')):
                record.description = clean_str(data['description'])
            if not is_blank(data.get('vendorName')):
                record.vendor_name = clean_str(data['vendorName'])

        changed = {f for f in tracked if getattr(record, f) != before[f]}
        record.last_updated_by = actor_label(actor)
        record.save()

        if changed:
            log_audit(
                actor, 'RECORD_EDITED', kind.model_name, record.pk, record.invoice_number,
                category=kind.audit_category,
                details=f'Original record edited: {", ".join(sorted(changed))}',
                previous={f: before[f] for f in changed},
                new={f: getattr(record, f) for f in changed},
            )
    return record


def delete_record(kind, actor, pk):
    with transaction.atomic():
        record = get_record(kind, pk, for_update=True)
        if record.payments.exists():
            raise ApiError(
                'This record already has payments recorded against it and cannot be deleted. '
                'Use an authorized revision to correct it instead.'
            )
        snapshot = kind.serialize(record)
        record_id, identifier = record.pk, record.invoice_number
        record.delete()
        log_audit(
            actor, 'RECORD_EDITED', kind.model_name, record_id, identifier,
            category=kind.audit_category, details='Record deleted',
            previous=snapshot, reason='Record deleted / archived by Accountant',
        )


# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------


def _create_payment(kind, record, actor, *, amount, payment_date, method, reference, notes):
    sequence = record.payments.count() + 1
    return Payment.objects.create(
        record_type=kind.key,
        student_fee=record if kind.key == 'student' else None,
        vendor_invoice=record if kind.key == 'vendor' else None,
        invoice_number=record.invoice_number,
        payment_number=f'PAY-{kind.payment_prefix}-{record.pk:05d}-{sequence:02d}',
        amount=amount,
        payment_date=payment_date,
        payment_method=method,
        reference_number=reference,
        receipt_notes=notes,
        recorded_by=actor,
        recorded_by_name=actor_name(actor),
        recorded_by_role=actor.profile.role,
    )


def record_payment(kind, actor, pk, data):
    amount = parse_decimal(data.get('amount'), 'Payment amount')
    if amount <= ZERO:
        raise ApiError('Payment amount must be greater than zero.')
    payment_date = parse_date(data.get('paymentDate'), 'payment date', required=False,
                              default=timezone.localdate())
    method = parse_payment_method(data.get('paymentMethod'))

    with transaction.atomic():
        record = get_record(kind, pk, for_update=True)
        if amount > record.balance:
            raise ApiError(f'Payment amount ({amount}) exceeds remaining balance ({record.balance}).')

        record.paid_amount += amount
        if not record.last_payment_date or payment_date >= record.last_payment_date:
            record.last_payment_date = payment_date
        record.last_updated_by = actor_label(actor)
        record.save()

        stamp = timezone.now().strftime('%Y%m%d%H%M%S')
        payment = _create_payment(
            kind, record, actor, amount=amount, payment_date=payment_date, method=method,
            reference=clean_str(data.get('referenceNumber')) or (
                f'REF-{stamp}' if kind.key == 'student' else f'VND-REF-{stamp}'),
            notes=clean_str(data.get('receiptNotes')) or (
                'Student fee payment settlement' if kind.key == 'student' else 'Vendor installment settlement'),
        )
        log_audit(
            actor, 'PAYMENT_RECORDED', kind.model_name, record.pk, record.invoice_number,
            category='PAYMENTS',
            details=f'{payment.payment_number} recorded via {method}',
            new={'amountPaid': amount, 'paymentNumber': payment.payment_number,
                 'newBalance': record.balance, 'status': record.payment_status},
        )
    return record, payment


# ---------------------------------------------------------------------------
# Flags and authorized revisions
# ---------------------------------------------------------------------------


def flag_record(kind, actor, pk, reason, unflag):
    with transaction.atomic():
        record = get_record(kind, pk, for_update=True)
        if unflag:
            record.is_flagged_for_review = False
            record.flag_reason = ''
            record.flagged_by = ''
            record.save()
            log_audit(actor, 'RECORD_FLAGGED', kind.model_name, record.pk, record.invoice_number,
                      category=kind.audit_category, details='Review flag cleared',
                      reason='Flag resolved by reviewer')
            return record

        reason = clean_str(reason) or 'Flagged for review'
        record.is_flagged_for_review = True
        record.flag_reason = reason
        record.flagged_by = actor_label(actor)
        record.save()
        log_audit(actor, 'RECORD_FLAGGED', kind.model_name, record.pk, record.invoice_number,
                  category=kind.audit_category, details='Record flagged for review', reason=reason)
        notify(
            f'Review Requested: {kind.party_name(record)}',
            f'{actor_label(actor)} flagged bill {record.invoice_number}: "{reason}"',
            notification_type='FLAG', target_tab=kind.tab, roles=['GM', 'ACCOUNTANT', 'HOD'],
        )
    return record


def submit_revision(kind, actor, pk, field, new_value, reason):
    if is_blank(reason):
        raise ApiError('A valid reason is required for every authorized revision.')
    if field not in kind.revisable:
        raise ApiError(f'Field "{field}" cannot be revised. Allowed: {", ".join(kind.revisable)}.')
    model_field = kind.revisable[field]

    with transaction.atomic():
        record = get_record(kind, pk, for_update=True)
        if field == 'totalAmount':
            value = parse_decimal(new_value, 'Total amount')
            if value <= ZERO:
                raise ApiError('Total amount must be a positive number.')
            if value < record.paid_amount:
                raise ApiError(
                    f'New total amount cannot be less than already collected amount ({record.paid_amount}).')
        elif field == 'dueDate':
            value = parse_date(new_value, 'due date')
        elif field == 'month':
            value = parse_month(new_value)
        elif field == 'year':
            value = parse_year(new_value)
        elif field == 'category':
            value = clean_str(new_value)
            if not value:
                raise ApiError('Category cannot be empty.')
        else:
            value = clean_str(new_value)

        old_value = getattr(record, model_field)
        setattr(record, model_field, value)
        record.last_updated_by = actor_label(actor, f'{actor.profile.role} Revision')
        record.is_flagged_for_review = False
        record.flag_reason = ''
        record.flagged_by = ''
        record.save()

        log_audit(
            actor, 'HOD_REVISION', kind.model_name, record.pk, record.invoice_number,
            category=kind.audit_category, details=f'Authorized revision of {field}',
            previous={field: old_value}, new={field: value}, reason=clean_str(reason),
        )
        notify(
            f'Authorized Revision: {record.invoice_number}',
            f'{actor_label(actor)} revised {field} from "{jsonable(old_value)}" to "{jsonable(value)}". '
            f'Reason: {clean_str(reason)}',
            notification_type='ALERT', target_tab=kind.tab, roles=['GM', 'ACCOUNTANT'],
        )
    return record


# ---------------------------------------------------------------------------
# Bulk import
# ---------------------------------------------------------------------------


def import_rows(kind, actor, rows):
    imported, errors = 0, []
    for index, row in enumerate(rows, start=1):
        if not isinstance(row, dict):
            errors.append({'rowNumber': index, 'errors': ['Row must be an object.']})
            continue
        try:
            with transaction.atomic():
                create_record(kind, actor, row, created_by_suffix='Accountant Import',
                              default_notes='Bulk imported via spreadsheet')
            imported += 1
        except ApiError as exc:
            errors.append({'rowNumber': index, 'errors': [str(exc.detail)]})

    log_audit(
        actor, 'IMPORT_COMPLETED', kind.model_name, f'batch-{timezone.now():%Y%m%d%H%M%S}',
        f'{imported} rows', category='BULK_IMPORT',
        details=f'{kind.party_label.title()} bulk import',
        new={'importedRows': imported, 'rejectedRows': len(errors)},
        reason=f'Bulk import completed by {actor_name(actor)}',
    )
    return imported, errors


# ---------------------------------------------------------------------------
# List filtering / pagination
# ---------------------------------------------------------------------------


def paginate(queryset, params, serialize, default_page_size=15):
    try:
        page = max(1, int(params.get('page') or 1))
    except ValueError:
        page = 1
    try:
        page_size = min(100, max(1, int(params.get('page_size') or default_page_size)))
    except ValueError:
        page_size = default_page_size

    total = queryset.count()
    total_pages = max(1, -(-total // page_size))
    start = (page - 1) * page_size
    return {
        'results': [serialize(obj) for obj in queryset[start:start + page_size]],
        'totalCount': total,
        'page': page,
        'pageSize': page_size,
        'totalPages': total_pages,
    }


def apply_ordering(queryset, ordering, mapping, default):
    ordering = clean_str(ordering) or default
    if ordering.lstrip('-') not in mapping:
        ordering = default
    descending = ordering.startswith('-')
    field = mapping[ordering.lstrip('-')]
    return queryset.order_by(f'-{field}' if descending else field, '-id' if descending else 'id')


def filter_financial_records(kind, queryset, params):
    def value(name):
        raw = clean_str(params.get(name))
        return '' if raw == 'all' else raw

    if value('month'):
        queryset = queryset.filter(month__iexact=value('month'))
    if value('year').isdigit():
        queryset = queryset.filter(year=int(value('year')))
    if value('status'):
        queryset = queryset.filter(payment_status=value('status'))
    if value('start_date'):
        queryset = queryset.filter(**{f'{kind.issue_date_field}__gte': parse_date(value('start_date'), 'start date')})
    if value('end_date'):
        queryset = queryset.filter(**{f'{kind.issue_date_field}__lte': parse_date(value('end_date'), 'end date')})

    search = value('search')
    if kind.key == 'student':
        if search:
            queryset = queryset.filter(
                Q(student_name__icontains=search) | Q(student__student_id__icontains=search)
                | Q(invoice_number__icontains=search) | Q(notes__icontains=search))
        if value('gradeClass'):
            queryset = queryset.filter(grade_class=value('gradeClass'))
    elif search:
        queryset = queryset.filter(
            Q(invoice_number__icontains=search) | Q(description__icontains=search) | Q(vendor_name__icontains=search)
        )

    if kind.key == 'vendor' and value('vendorId'):
        queryset = queryset.filter(vendor__vendor_id=value('vendorId'))
    if value('category'):
        queryset = queryset.filter(category=value('category'))
    if value('min_amount'):
        queryset = queryset.filter(total_amount__gte=parse_decimal(value('min_amount'), 'Minimum amount'))
    if value('max_amount'):
        queryset = queryset.filter(total_amount__lte=parse_decimal(value('max_amount'), 'Maximum amount'))
    if value('created_by'):
        queryset = queryset.filter(created_by_name__icontains=value('created_by'))
    if parse_bool(params.get('flagged_only')):
        queryset = queryset.filter(is_flagged_for_review=True)
    return queryset


def financial_ordering(kind):
    name_field = 'student_name' if kind.key == 'student' else 'vendor_name'
    return {
        'created_at': 'created_at', 'createdAt': 'created_at',
        'name': name_field, 'studentName': name_field, 'vendorName': name_field,
        'amount': 'total_amount', 'totalAmount': 'total_amount',
        'balance': 'balance',
        'date': kind.issue_date_field, kind.issue_date_key: kind.issue_date_field,
        'dueDate': 'due_date',
        'status': 'payment_status',
    }

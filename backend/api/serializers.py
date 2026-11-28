"""
Model -> JSON converters producing the exact camelCase shapes declared in
frontend/src/types/index.ts. Money is emitted as numbers because the UI does arithmetic on it.
"""


# Student fees and vendor invoices live in separate tables, so their public ids carry a prefix
# to stay unique (the UI matches payments to records by id).
RECORD_ID_PREFIX = {'student': 'fee-', 'vendor': 'vinv-'}


def record_public_id(record_type, pk):
    return f'{RECORD_ID_PREFIX[record_type]}{pk}'


def money(value):
    return float(value) if value is not None else 0.0


def iso_date(value):
    return value.isoformat() if value else None


def serialize_user(user):
    profile = user.profile
    return {
        'id': str(user.pk),
        'name': profile.full_name,
        'email': user.email,
        'role': profile.role,
        'department': profile.department,
        'phone': profile.phone,
        'isActive': user.is_active,
        'avatar': profile.avatar or None,
        'needsPasswordChange': profile.needs_password_change,
        'isPrimaryAdmin': profile.is_primary_admin,
    }


def _financial_common(record, record_type):
    return {
        'id': record_public_id(record_type, record.pk),
        'invoiceNumber': record.invoice_number,
        'category': record.category,
        'totalAmount': money(record.total_amount),
        'paidAmount': money(record.paid_amount),
        'balance': money(record.balance),
        'paymentStatus': record.payment_status,
        'dueDate': iso_date(record.due_date),
        'lastPaymentDate': iso_date(record.last_payment_date),
        'month': record.month,
        'year': record.year,
        'notes': record.notes,
        'createdBy': record.created_by_name,
        'createdByRole': record.created_by_role,
        'lastUpdatedBy': record.last_updated_by or None,
        'isFlaggedForReview': record.is_flagged_for_review,
        'flagReason': record.flag_reason or None,
        'flaggedBy': record.flagged_by or None,
        'createdAt': iso_date(record.created_at),
        'updatedAt': iso_date(record.updated_at),
    }


def serialize_student_fee(record):
    data = _financial_common(record, 'student')
    data.update({
        'studentId': record.student.student_id,
        'studentName': record.student_name,
        'gradeClass': record.grade_class,
        'billIssueDate': iso_date(record.bill_issue_date),
    })
    return data


def serialize_vendor_invoice(record):
    data = _financial_common(record, 'vendor')
    data.update({
        'vendorId': record.vendor.vendor_id,
        'vendorName': record.vendor_name,
        'description': record.description,
        'issueDate': iso_date(record.issue_date),
        'attachmentName': record.attachment_name,
    })
    return data


def serialize_payment(payment):
    return {
        'id': str(payment.pk),
        'recordId': record_public_id(payment.record_type, payment.record_id),
        'recordType': payment.record_type,
        'invoiceNumber': payment.invoice_number,
        'paymentNumber': payment.payment_number,
        'amount': money(payment.amount),
        'paymentDate': iso_date(payment.payment_date),
        'paymentMethod': payment.payment_method,
        'referenceNumber': payment.reference_number,
        'receiptNotes': payment.receipt_notes,
        'recordedBy': payment.recorded_by_name,
        'recordedByRole': payment.recorded_by_role,
        'createdAt': iso_date(payment.created_at),
    }


def serialize_audit_log(entry):
    return {
        'id': str(entry.pk),
        'action': entry.action,
        'category': entry.category,
        'details': entry.details,
        'modelName': entry.model_name,
        'recordId': entry.record_id,
        'recordIdentifier': entry.record_identifier,
        'previousValues': entry.previous_values,
        'newValues': entry.new_values,
        'reason': entry.reason,
        'user': entry.performed_by_name,
        'performedBy': entry.performed_by_name,
        'performedByRole': entry.performed_by_role,
        'timestamp': iso_date(entry.timestamp),
    }


def serialize_settings(settings_obj):
    return {
        'schoolName': settings_obj.school_name,
        'currencyCode': settings_obj.currency_code,
        'academicSession': settings_obj.academic_session,
        'financialYear': settings_obj.financial_year,
        'contactEmail': settings_obj.contact_email,
        'contactPhone': settings_obj.contact_phone,
        'address': settings_obj.address,
        'taxRegistrationNumber': settings_obj.tax_registration_number,
        'feeCategories': settings_obj.fee_categories,
        'vendorCategories': settings_obj.vendor_categories,
    }


def serialize_notification(notification, user):
    return {
        'id': str(notification.pk),
        'title': notification.title,
        'message': notification.message,
        'type': notification.notification_type,
        'timestamp': iso_date(notification.created_at),
        'isRead': notification.read_by.filter(pk=user.pk).exists(),
        'targetTab': notification.target_tab or None,
        'recipientRoles': notification.recipient_roles or None,
    }


def serialize_student(student):
    return {
        'id': str(student.pk),
        'studentId': student.student_id,
        'fullName': student.full_name,
        'gradeClass': student.grade_class,
        'academicSession': student.academic_session,
        'parentName': student.parent_name,
        'parentPhone': student.parent_phone,
        'parentEmail': student.parent_email,
    }


def serialize_vendor(vendor):
    return {
        'id': str(vendor.pk),
        'vendorId': vendor.vendor_id,
        'companyName': vendor.company_name,
        'contactPerson': vendor.contact_person,
        'phone': vendor.phone,
        'email': vendor.email,
        'address': vendor.address,
        'category': vendor.category,
        'goodsServices': vendor.goods_services,
        'isActive': vendor.is_active,
    }

import datetime
import io

from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import AuditLog, Payment, StudentFeeRecord, VendorInvoice

TODAY = timezone.localdate()
FUTURE = (TODAY + datetime.timedelta(days=30)).isoformat()
PAST = (TODAY - datetime.timedelta(days=5)).isoformat()

CREDENTIALS = {
    'GM': ('faisalabbas@gmail.com', 'faisal@123'),
    'ACCOUNTANT': ('accountant@thesmartschool.edu.pk', 'accountant@123'),
    'HOD': ('hod@thesmartschool.edu.pk', 'hod@123'),
}


def pk(record):
    """Database pk from a serialized record id such as `fee-3` / `vinv-3`."""
    return int(record['id'].split('-')[-1])


def fee_payload(**overrides):
    data = {
        'studentId': 'STD-001', 'studentName': 'Farhan Ali', 'gradeClass': 'Grade 10-A',
        'category': 'Tuition Fee', 'totalAmount': '24000', 'paidAmount': '0',
        'billIssueDate': TODAY.isoformat(), 'dueDate': FUTURE, 'month': 'October', 'year': '2026',
        'invoiceNumber': 'INV-STD-001', 'paymentMethod': 'BANK_TRANSFER', 'paymentRef': '', 'notes': '',
    }
    data.update(overrides)
    return data


def invoice_payload(**overrides):
    data = {
        'vendorId': 'VND-101', 'vendorName': 'Apex Stationery & Tech Supplies',
        'category': 'Stationery & Books Printing', 'description': 'Exam papers', 'totalAmount': '45000',
        'paidAmount': '0', 'issueDate': TODAY.isoformat(), 'dueDate': FUTURE, 'month': 'October',
        'year': '2026', 'invoiceNumber': 'INV-VND-001',
    }
    data.update(overrides)
    return data


class ApiTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_users', stdout=io.StringIO())

    def setUp(self):
        self.tokens = {}

    def login(self, role):
        if role not in self.tokens:
            email, password = CREDENTIALS[role]
            res = self.client.post('/api/auth/login', {'email': email, 'password': password}, format='json')
            self.assertEqual(res.status_code, 200, res.content)
            self.tokens[role] = res.json()['token']
        return self.tokens[role]

    def call(self, role, method, url, data=None):
        headers = {'HTTP_AUTHORIZATION': f'Bearer {self.login(role)}'} if role else {}
        return getattr(self.client, method)(url, data, format='json', **headers)

    def create_fee(self, **overrides):
        res = self.call('ACCOUNTANT', 'post', '/api/students/fees', fee_payload(**overrides))
        self.assertEqual(res.status_code, 201, res.content)
        return res.json()

    def create_invoice(self, **overrides):
        res = self.call('ACCOUNTANT', 'post', '/api/vendors/invoices', invoice_payload(**overrides))
        self.assertEqual(res.status_code, 201, res.content)
        return res.json()


class AuthTests(ApiTestCase):
    def test_login_returns_token_and_user_shape(self):
        res = self.client.post('/api/auth/login', {'email': 'ACCOUNTANT@thesmartschool.edu.pk',
                                                   'password': 'accountant@123'}, format='json')
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body['success'])
        self.assertTrue(body['token'])
        self.assertEqual(body['user']['role'], 'ACCOUNTANT')
        self.assertEqual(body['user']['name'], 'Fatima Noor')
        self.assertNotIn('password', body['user'])

    def test_login_by_display_name(self):
        res = self.client.post('/api/auth/login', {'username': 'fatima noor', 'password': 'accountant@123'},
                               format='json')
        self.assertEqual(res.status_code, 200)

    def test_login_errors(self):
        res = self.client.post('/api/auth/login', {'email': '', 'password': ''}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('error', res.json())
        res = self.client.post('/api/auth/login', {'email': 'nobody@x.com', 'password': 'abcdef'}, format='json')
        self.assertEqual(res.status_code, 401)
        res = self.client.post('/api/auth/login', {'email': CREDENTIALS['GM'][0], 'password': 'wrong'}, format='json')
        self.assertEqual(res.status_code, 401)
        self.assertIn('Incorrect password', res.json()['error'])

    def test_unauthenticated_requests_rejected_with_error_shape(self):
        res = self.client.get('/api/students/fees')
        self.assertEqual(res.status_code, 401)
        self.assertIn('error', res.json())

    def test_role_header_alone_grants_nothing(self):
        res = self.client.get('/api/students/fees', HTTP_X_USER_ROLE='GM')
        self.assertEqual(res.status_code, 401)

    def test_trailing_slash_optional(self):
        self.assertEqual(self.call('GM', 'get', '/api/auth/current-user').status_code, 200)
        self.assertEqual(self.call('GM', 'get', '/api/auth/current-user/').status_code, 200)

    def test_logout_invalidates_token(self):
        self.assertEqual(self.call('GM', 'post', '/api/auth/logout').status_code, 200)
        res = self.client.get('/api/auth/current-user', HTTP_AUTHORIZATION=f'Bearer {self.tokens["GM"]}')
        self.assertEqual(res.status_code, 401)

    def test_change_password(self):
        res = self.call('HOD', 'post', '/api/auth/change-password',
                        {'currentPassword': 'wrong', 'newPassword': 'newpass1'})
        self.assertEqual(res.status_code, 400)
        res = self.call('HOD', 'post', '/api/auth/change-password', {'currentPassword': 'hod@123', 'newPassword': '123'})
        self.assertEqual(res.status_code, 400)
        res = self.call('HOD', 'post', '/api/auth/change-password',
                        {'currentPassword': 'hod@123', 'newPassword': 'newpass1'})
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.json()['user']['needsPasswordChange'])
        res = self.client.post('/api/auth/login', {'email': CREDENTIALS['HOD'][0], 'password': 'newpass1'},
                               format='json')
        self.assertEqual(res.status_code, 200)

    def test_profile_update_and_avatar(self):
        res = self.call('HOD', 'post', '/api/auth/profile',
                        {'name': 'Prof. A. Raza', 'phone': '123', 'avatar': 'data:image/png;base64,AAAA'})
        self.assertEqual(res.status_code, 200)
        user = res.json()['user']
        self.assertEqual(user['name'], 'Prof. A. Raza')
        self.assertEqual(user['avatar'], 'data:image/png;base64,AAAA')
        res = self.call('HOD', 'post', '/api/auth/profile', {'avatar': 'javascript:alert(1)'})
        self.assertEqual(res.status_code, 400)

    def test_switch_role_is_disabled(self):
        self.assertEqual(self.call('HOD', 'post', '/api/auth/switch-role', {'role': 'GM'}).status_code, 403)


class UserManagementTests(ApiTestCase):
    def test_only_gm_can_list_and_manage(self):
        self.assertEqual(self.call('ACCOUNTANT', 'get', '/api/auth/users').status_code, 403)
        self.assertEqual(self.call('ACCOUNTANT', 'post', '/api/users/manage', {'action': 'create'}).status_code, 403)
        res = self.call('GM', 'get', '/api/auth/users')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 3)

    def test_create_user_requires_password_change(self):
        res = self.call('GM', 'post', '/api/users/manage', {'action': 'create', 'userData': {
            'name': 'New Clerk', 'email': 'clerk@school.pk', 'password': 'school@123', 'role': 'ACCOUNTANT'}})
        self.assertEqual(res.status_code, 201, res.content)
        res = self.client.post('/api/auth/login', {'email': 'clerk@school.pk', 'password': 'school@123'}, format='json')
        self.assertTrue(res.json()['user']['needsPasswordChange'])
        dup = self.call('GM', 'post', '/api/users/manage', {'action': 'create', 'userData': {
            'name': 'Dup', 'email': 'CLERK@school.pk', 'password': 'school@123', 'role': 'HOD'}})
        self.assertEqual(dup.status_code, 400)

    def test_vendor_role_can_no_longer_be_created(self):
        res = self.call('GM', 'post', '/api/users/manage', {'action': 'create', 'userData': {
            'name': 'Fuel Co', 'email': 'fuel@co.pk', 'password': 'school@123', 'role': 'VENDOR'}})
        self.assertEqual(res.status_code, 400)
        self.assertIn('Invalid role', res.json()['error'])

    def test_toggle_active_blocks_login_and_existing_token(self):
        hod_id = next(u['id'] for u in self.call('GM', 'get', '/api/auth/users').json() if u['role'] == 'HOD')
        self.login('HOD')
        res = self.call('GM', 'post', '/api/users/manage', {'action': 'toggle_active', 'userId': hod_id})
        self.assertFalse(res.json()['user']['isActive'])
        res = self.client.get('/api/auth/current-user', HTTP_AUTHORIZATION=f'Bearer {self.tokens["HOD"]}')
        self.assertEqual(res.status_code, 401)
        res = self.client.post('/api/auth/login', {'email': CREDENTIALS['HOD'][0], 'password': 'hod@123'},
                               format='json')
        self.assertEqual(res.status_code, 403)

    def test_primary_admin_cannot_be_deleted(self):
        gm_id = next(u['id'] for u in self.call('GM', 'get', '/api/auth/users').json() if u['role'] == 'GM')
        res = self.call('GM', 'post', '/api/users/manage', {'action': 'delete', 'userId': gm_id})
        self.assertEqual(res.status_code, 400)

    def test_delete_and_reset_password(self):
        users = self.call('GM', 'get', '/api/auth/users').json()
        hod_id = next(u['id'] for u in users if u['role'] == 'HOD')
        res = self.call('GM', 'post', '/api/users/manage',
                        {'action': 'reset_password', 'userId': hod_id, 'userData': {'newPassword': 'temp1234'}})
        self.assertEqual(res.status_code, 200)
        res = self.client.post('/api/auth/login', {'email': CREDENTIALS['HOD'][0], 'password': 'temp1234'},
                               format='json')
        self.assertTrue(res.json()['user']['needsPasswordChange'])
        res = self.call('GM', 'post', '/api/users/manage', {'action': 'delete', 'userId': hod_id})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(self.call('GM', 'get', '/api/auth/users').json()), 2)


class StudentFeeTests(ApiTestCase):
    def test_accountant_creates_record_with_calculated_fields(self):
        fee = self.create_fee(paidAmount='10000', paymentMethod='CASH')
        self.assertEqual(fee['balance'], 14000.0)
        self.assertEqual(fee['paymentStatus'], 'Partially Paid')
        self.assertEqual(fee['createdByRole'], 'ACCOUNTANT')
        self.assertEqual(fee['studentId'], 'STD-001')
        payment = Payment.objects.get()
        self.assertEqual(payment.amount, 10000)
        self.assertEqual(payment.payment_method, 'CASH')

    def test_status_rules(self):
        self.assertEqual(self.create_fee(invoiceNumber='A1')['paymentStatus'], 'Unpaid')
        self.assertEqual(self.create_fee(invoiceNumber='A2', paidAmount='24000')['paymentStatus'], 'Paid')
        self.assertEqual(self.create_fee(invoiceNumber='A3', dueDate=PAST)['paymentStatus'], 'Overdue')
        self.assertEqual(self.create_fee(invoiceNumber='A4', dueDate=PAST, paidAmount='1')['paymentStatus'], 'Overdue')

    def test_overdue_refreshed_on_list(self):
        fee = self.create_fee()
        StudentFeeRecord.objects.filter(pk=pk(fee)).update(due_date=TODAY - datetime.timedelta(days=1))
        res = self.call('GM', 'get', '/api/students/fees')
        self.assertEqual(res.json()['results'][0]['paymentStatus'], 'Overdue')

    def test_only_accountant_can_create(self):
        for role in ('GM', 'HOD'):
            res = self.call(role, 'post', '/api/students/fees', fee_payload())
            self.assertEqual(res.status_code, 403, role)

    def test_validation(self):
        cases = [
            {'invoiceNumber': ''}, {'studentId': ''}, {'studentName': ''}, {'totalAmount': '0'},
            {'totalAmount': 'abc'}, {'paidAmount': '-1'}, {'paidAmount': '99999'}, {'dueDate': ''},
            {'dueDate': 'not-a-date'}, {'month': 'Smarch'}, {'year': '1800'},
        ]
        for case in cases:
            res = self.call('ACCOUNTANT', 'post', '/api/students/fees', fee_payload(**case))
            self.assertEqual(res.status_code, 400, case)
            self.assertIn('error', res.json())

    def test_duplicate_invoice_rejected_case_insensitively(self):
        self.create_fee()
        res = self.call('ACCOUNTANT', 'post', '/api/students/fees', fee_payload(invoiceNumber='inv-std-001'))
        self.assertEqual(res.status_code, 400)
        self.assertIn('already exists', res.json()['error'])

    def test_gm_cannot_edit_or_delete(self):
        fee = self.create_fee()
        res = self.call('GM', 'put', f'/api/students/fees/{fee["id"]}', {'totalAmount': 1})
        self.assertEqual(res.status_code, 403)
        self.assertIn('CRITICAL SECURITY VIOLATION', res.json()['error'])
        res = self.call('GM', 'delete', f'/api/students/fees/{fee["id"]}')
        self.assertEqual(res.status_code, 403)
        self.assertIn('CRITICAL SECURITY VIOLATION', res.json()['error'])
        self.assertEqual(self.call('HOD', 'put', f'/api/students/fees/{fee["id"]}', {}).status_code, 403)

    def test_accountant_edit(self):
        fee = self.create_fee(paidAmount='5000')
        res = self.call('ACCOUNTANT', 'put', f'/api/students/fees/{fee["id"]}',
                        {**fee_payload(), 'totalAmount': '30000', 'category': 'Transport Charges'})
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.json()['balance'], 25000.0)
        self.assertEqual(res.json()['category'], 'Transport Charges')
        res = self.call('ACCOUNTANT', 'put', f'/api/students/fees/{fee["id"]}', {'totalAmount': '100'})
        self.assertEqual(res.status_code, 400)
        self.assertTrue(AuditLog.objects.filter(action='RECORD_EDITED').exists())

    def test_delete(self):
        fee = self.create_fee()
        self.assertEqual(self.call('ACCOUNTANT', 'delete', f'/api/students/fees/{fee["id"]}').status_code, 200)
        self.assertEqual(self.call('ACCOUNTANT', 'delete', f'/api/students/fees/{fee["id"]}').status_code, 404)
        paid = self.create_fee(invoiceNumber='B1', paidAmount='100')
        self.assertEqual(self.call('ACCOUNTANT', 'delete', f'/api/students/fees/{paid["id"]}').status_code, 400)

    def test_payments(self):
        fee = self.create_fee()
        url = f'/api/students/fees/{fee["id"]}/payments'
        self.assertEqual(self.call('GM', 'post', url, {'amount': 100}).status_code, 403)
        self.assertEqual(self.call('ACCOUNTANT', 'post', url, {'amount': 0}).status_code, 400)
        self.assertEqual(self.call('ACCOUNTANT', 'post', url, {'amount': 30000}).status_code, 400)

        res = self.call('ACCOUNTANT', 'post', url, {'amount': 4000, 'paymentDate': TODAY.isoformat(),
                                                    'paymentMethod': 'CHEQUE', 'referenceNumber': 'CHQ-1'})
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(res.json()['record']['paymentStatus'], 'Partially Paid')
        self.assertEqual(res.json()['payment']['paymentNumber'], f'PAY-STD-{pk(fee):05d}-01')

        res = self.call('HOD', 'post', url, {'amount': 20000})
        self.assertEqual(res.json()['record']['paymentStatus'], 'Paid')
        self.assertEqual(res.json()['record']['balance'], 0.0)
        self.assertEqual(res.json()['payment']['paymentNumber'], f'PAY-STD-{pk(fee):05d}-02')
        self.assertEqual(len(self.call('GM', 'get', url).json()), 2)

    def test_flag_and_notifications(self):
        fee = self.create_fee()
        url = f'/api/students/fees/{fee["id"]}/flag'
        self.assertEqual(self.call('ACCOUNTANT', 'post', url, {'reason': 'x'}).status_code, 403)
        res = self.call('GM', 'post', url, {'reason': 'Amount looks wrong'})
        self.assertTrue(res.json()['isFlaggedForReview'])
        self.assertEqual(res.json()['flagReason'], 'Amount looks wrong')

        notes = self.call('ACCOUNTANT', 'get', '/api/notifications').json()
        self.assertEqual(len(notes), 1)
        self.assertFalse(notes[0]['isRead'])
        self.call('ACCOUNTANT', 'post', f'/api/notifications/{notes[0]["id"]}/read')
        self.assertTrue(self.call('ACCOUNTANT', 'get', '/api/notifications').json()[0]['isRead'])
        self.assertFalse(self.call('HOD', 'get', '/api/notifications').json()[0]['isRead'])

        res = self.call('HOD', 'post', url, {'unflag': True})
        self.assertFalse(res.json()['isFlaggedForReview'])

    def test_revision(self):
        fee = self.create_fee(paidAmount='4000')
        url = f'/api/students/fees/{fee["id"]}/revision'
        self.call('GM', 'post', f'/api/students/fees/{fee["id"]}/flag', {'reason': 'check'})
        self.assertEqual(self.call('GM', 'post', url, {'field': 'totalAmount', 'newValue': 1, 'reason': 'r'}).status_code, 403)
        self.assertEqual(self.call('HOD', 'post', url, {'field': 'totalAmount', 'newValue': 30000, 'reason': ''}).status_code, 400)
        self.assertEqual(self.call('HOD', 'post', url, {'field': 'paidAmount', 'newValue': 1, 'reason': 'r'}).status_code, 400)
        self.assertEqual(self.call('HOD', 'post', url, {'field': 'totalAmount', 'newValue': 100, 'reason': 'r'}).status_code, 400)

        res = self.call('HOD', 'post', url, {'field': 'totalAmount', 'newValue': '30000', 'reason': 'Board approved'})
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.json()['balance'], 26000.0)
        self.assertFalse(res.json()['isFlaggedForReview'])
        log = AuditLog.objects.get(action='HOD_REVISION')
        self.assertEqual(log.previous_values, {'totalAmount': 24000.0})
        self.assertEqual(log.new_values, {'totalAmount': 30000.0})

        res = self.call('HOD', 'post', url, {'field': 'dueDate', 'newValue': PAST, 'reason': 'Policy'})
        self.assertEqual(res.json()['paymentStatus'], 'Overdue')

    def test_filters_ordering_pagination(self):
        self.create_fee(invoiceNumber='F1', totalAmount='1000', month='January', studentName='Zara')
        self.create_fee(invoiceNumber='F2', totalAmount='5000', month='February', studentId='STD-2', studentName='Ali')
        self.create_fee(invoiceNumber='F3', totalAmount='9000', month='February', studentId='STD-3',
                        studentName='Bilal', gradeClass='Grade 9-B', paidAmount='9000')

        def get(query):
            return self.call('HOD', 'get', f'/api/students/fees?{query}').json()

        self.assertEqual(get('month=February')['totalCount'], 2)
        self.assertEqual(get('status=Paid')['results'][0]['invoiceNumber'], 'F3')
        self.assertEqual(get('search=bil')['totalCount'], 1)
        self.assertEqual(get('gradeClass=Grade 9-B')['totalCount'], 1)
        self.assertEqual(get('min_amount=2000&max_amount=6000')['totalCount'], 1)
        self.assertEqual([r['studentName'] for r in get('ordering=name')['results']], ['Ali', 'Bilal', 'Zara'])
        self.assertEqual([r['totalAmount'] for r in get('ordering=-amount')['results']], [9000.0, 5000.0, 1000.0])
        page = get('page_size=2&page=2')
        self.assertEqual((page['totalCount'], page['totalPages'], page['page'], len(page['results'])), (3, 2, 2, 1))
        self.assertEqual(get('month=all&year=all')['totalCount'], 3)

        self.call('GM', 'post', f'/api/students/fees/{get("search=F1")["results"][0]["id"]}/flag', {'reason': 'x'})
        self.assertEqual(get('flagged_only=true')['totalCount'], 1)


class VendorInvoiceTests(ApiTestCase):
    def test_create_edit_flag_revise_pay(self):
        inv = self.create_invoice(paidAmount='5000')
        self.assertEqual(inv['balance'], 40000.0)
        self.assertEqual(inv['vendorId'], 'VND-101')
        self.assertEqual(self.call('GM', 'put', f'/api/vendors/invoices/{inv["id"]}', {}).status_code, 403)

        res = self.call('ACCOUNTANT', 'put', f'/api/vendors/invoices/{inv["id"]}', {'description': 'Updated'})
        self.assertEqual(res.json()['description'], 'Updated')

        res = self.call('HOD', 'post', f'/api/vendors/invoices/{inv["id"]}/flag', {'reason': 'Check qty'})
        self.assertTrue(res.json()['isFlaggedForReview'])

        res = self.call('HOD', 'post', f'/api/vendors/invoices/{inv["id"]}/revision',
                        {'field': 'description', 'newValue': 'Exam papers x2', 'reason': 'Corrected'})
        self.assertEqual(res.json()['description'], 'Exam papers x2')

        res = self.call('ACCOUNTANT', 'post', f'/api/vendors/invoices/{inv["id"]}/payments', {'amount': 40000})
        self.assertEqual(res.json()['record']['paymentStatus'], 'Paid')
        self.assertTrue(res.json()['payment']['paymentNumber'].startswith('PAY-VND-'))

    def test_ids_do_not_collide_with_student_records(self):
        fee = self.create_fee(paidAmount='100')
        inv = self.create_invoice(paidAmount='200')
        self.assertEqual((fee['id'], inv['id']), ('fee-1', 'vinv-1'))
        payments = self.call('GM', 'get', f'/api/payments?recordId={inv["id"]}').json()['results']
        self.assertEqual([p['amount'] for p in payments], [200.0])
        self.assertEqual(self.call('GM', 'get', f'/api/students/fees/{inv["id"]}').status_code, 404)
        self.assertEqual(self.call('GM', 'get', '/api/students/fees/1').status_code, 200)

    def test_new_vendor_created_from_invoice(self):
        self.create_invoice(vendorId='VND-900', vendorName='Power Co', invoiceNumber='E1')
        vendors = self.call('GM', 'get', '/api/vendors/list').json()
        self.assertIn('VND-900', [v['vendorId'] for v in vendors])

    def test_old_vendor_accounts_are_disabled_by_migration(self):
        import importlib

        from django.apps import apps
        from django.contrib.auth.models import User
        from rest_framework.authtoken.models import Token

        from .models import UserProfile

        user = User.objects.create_user('old-vendor@co.pk', 'old-vendor@co.pk', 'vendor@123')
        UserProfile.objects.create(user=user, full_name='Old Vendor', role='VENDOR')
        Token.objects.create(user=user)

        migration = importlib.import_module('api.migrations.0003_disable_vendor_accounts')
        migration.disable_vendor_accounts(apps, None)

        user.refresh_from_db()
        self.assertFalse(user.is_active)
        self.assertFalse(Token.objects.filter(user=user).exists())
        res = self.client.post('/api/auth/login', {'email': 'old-vendor@co.pk', 'password': 'vendor@123'},
                               format='json')
        self.assertNotEqual(res.status_code, 200)


class PaymentsLedgerTests(ApiTestCase):
    def test_filters(self):
        fee = self.create_fee(paidAmount='1000', paymentMethod='CASH')
        self.create_invoice(paidAmount='2000', paymentMethod='CHEQUE')
        self.assertEqual(self.call('GM', 'get', '/api/payments').json()['totalCount'], 2)
        self.assertEqual(self.call('GM', 'get', '/api/payments?recordType=student').json()['totalCount'], 1)
        self.assertEqual(self.call('GM', 'get', '/api/payments?paymentMethod=CHEQUE').json()['totalCount'], 1)
        self.assertEqual(self.call('GM', 'get', f'/api/payments?recordId={fee["id"]}').json()['totalCount'], 1)
        self.assertEqual(self.call('GM', 'get', '/api/payments?min_amount=1500').json()['totalCount'], 1)
        month = TODAY.strftime('%B')
        self.assertEqual(self.call('GM', 'get', f'/api/payments?month={month}&year={TODAY.year}').json()['totalCount'], 2)


class AuditVisibilityTests(ApiTestCase):
    def test_matrix(self):
        fee = self.create_fee()                                                   # ACCOUNTANT entry
        self.call('GM', 'post', '/api/settings', {'schoolName': 'Smart School'})   # GM entry
        self.call('HOD', 'post', f'/api/students/fees/{fee["id"]}/revision',
                  {'field': 'notes', 'newValue': 'n', 'reason': 'r'})              # HOD entry

        def roles(role):
            return {e['performedByRole'] for e in self.call(role, 'get', '/api/audit-logs').json()['results']}

        self.assertEqual(roles('ACCOUNTANT'), {'ACCOUNTANT'})
        self.assertEqual(roles('HOD'), {'ACCOUNTANT'})
        self.assertEqual(roles('GM'), {'GM', 'ACCOUNTANT'})
        res = self.call('GM', 'get', '/api/audit-logs?action=SETTINGS_UPDATED').json()
        self.assertEqual(res['totalCount'], 1)
        self.assertEqual(res['results'][0]['newValues'], {'schoolName': 'Smart School'})

    def test_audit_entries_are_immutable(self):
        self.create_fee()
        entry = AuditLog.objects.first()
        entry.reason = 'tampered'
        with self.assertRaises(ValueError):
            entry.save()


class SettingsTests(ApiTestCase):
    def test_get_is_public_post_is_gm_only(self):
        res = self.client.get('/api/settings')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['currencyCode'], 'PKR')
        self.assertEqual(len(res.json()['feeCategories']), 6)
        self.assertEqual(self.call('ACCOUNTANT', 'post', '/api/settings', {'schoolName': 'X'}).status_code, 403)
        res = self.call('GM', 'post', '/api/settings', {'feeCategories': ['Tuition Fee', ' ', 'Tuition Fee', 'Bus']})
        self.assertEqual(res.json()['feeCategories'], ['Tuition Fee', 'Bus'])
        self.assertEqual(self.call('GM', 'post', '/api/settings', {'contactEmail': 'bad'}).status_code, 400)
        self.assertEqual(self.call('GM', 'post', '/api/settings', {'feeCategories': []}).status_code, 400)


class ImportTests(ApiTestCase):
    def test_student_import(self):
        self.create_fee(invoiceNumber='EXISTING')
        rows = [
            {'studentId': 'S1', 'studentName': 'A', 'gradeClass': 'G1', 'category': 'Tuition Fee',
             'totalAmount': '1000', 'paidAmount': '200', 'dueDate': FUTURE, 'month': 'October', 'year': '2026',
             'invoiceNumber': 'IMP-1'},
            {'studentId': 'S2', 'studentName': 'B', 'gradeClass': 'G1', 'category': 'Tuition Fee',
             'totalAmount': '1000', 'dueDate': FUTURE, 'month': 'October', 'year': '2026', 'invoiceNumber': 'existing'},
            {'studentId': 'S3', 'studentName': 'C', 'gradeClass': 'G1', 'category': 'Tuition Fee',
             'totalAmount': '-5', 'dueDate': FUTURE, 'month': 'October', 'year': '2026', 'invoiceNumber': 'IMP-3'},
        ]
        self.assertEqual(self.call('GM', 'post', '/api/import/commit',
                                   {'category': 'student_fees', 'rows': rows}).status_code, 403)
        res = self.call('ACCOUNTANT', 'post', '/api/import/commit', {'category': 'student_fees', 'rows': rows})
        body = res.json()
        self.assertEqual((body['importedCount'], body['rejectedCount']), (1, 2))
        self.assertEqual([e['rowNumber'] for e in body['errors']], [2, 3])
        imported = StudentFeeRecord.objects.get(invoice_number='IMP-1')
        self.assertEqual(imported.created_by_name, 'Fatima Noor (Accountant Import)')
        self.assertEqual(imported.payments.count(), 1)

    def test_vendor_import(self):
        rows = [{'vendorId': 'VND-101', 'vendorName': 'Apex', 'category': 'Stationery', 'description': 'x',
                 'totalAmount': '45000', 'paidAmount': '20000', 'dueDate': FUTURE, 'month': 'November',
                 'year': '2026', 'invoiceNumber': 'INV-VND-IMP-001'}]
        res = self.call('ACCOUNTANT', 'post', '/api/import/commit', {'category': 'vendor_invoices', 'rows': rows})
        self.assertEqual(res.json()['importedCount'], 1)
        self.assertEqual(VendorInvoice.objects.get().balance, 25000)

    def test_bad_requests(self):
        self.assertEqual(self.call('ACCOUNTANT', 'post', '/api/import/commit',
                                   {'category': 'student_fees', 'rows': []}).status_code, 400)
        self.assertEqual(self.call('ACCOUNTANT', 'post', '/api/import/commit',
                                   {'category': 'nope', 'rows': [{}]}).status_code, 400)


class DashboardTests(ApiTestCase):
    def test_summary(self):
        self.create_fee(invoiceNumber='D1', paidAmount='4000')
        self.create_fee(invoiceNumber='D2', month='November', dueDate=PAST)
        self.create_invoice(paidAmount='5000')
        body = self.call('GM', 'get', '/api/dashboard/summary').json()
        self.assertEqual(body['studentMetrics']['totalBilled'], 48000.0)
        self.assertEqual(body['studentMetrics']['totalCollected'], 4000.0)
        self.assertEqual(body['studentMetrics']['overdueCount'], 1)
        self.assertEqual(body['studentMetrics']['unpaidCount'], 1)
        self.assertEqual(body['studentMetrics']['activeStudents'], 1)
        self.assertEqual(body['vendorMetrics']['outstandingPayable'], 40000.0)
        self.assertEqual(len(body['monthlyTrends']), 12)
        october = next(m for m in body['monthlyTrends'] if m['month'] == 'Oct')
        self.assertEqual(october['feesCollected'], 4000.0)
        self.assertTrue(body['recentAudit'])

        filtered = self.call('GM', 'get', '/api/dashboard/summary?month=November&year=2026').json()
        self.assertEqual(filtered['studentMetrics']['totalBilled'], 24000.0)


class AdminPagesTests(ApiTestCase):
    def test_every_admin_page_renders(self):
        from django.contrib import admin
        from django.contrib.auth.models import User
        from django.urls import reverse

        self.create_fee(paidAmount='100')
        self.create_invoice()
        User.objects.create_superuser('admin', 'admin@example.com', 'admin-pass-123')
        self.client.login(username='admin', password='admin-pass-123')

        for model, model_admin in admin.site._registry.items():
            info = (model._meta.app_label, model._meta.model_name)
            urls = [reverse('admin:%s_%s_changelist' % info)]
            obj = model.objects.first()
            if obj is not None:
                urls.append(reverse('admin:%s_%s_change' % info, args=[obj.pk]))
            for url in urls:
                res = self.client.get(url)
                self.assertEqual(res.status_code, 200, f'{url} -> {res.status_code}')
        self.assertEqual(self.client.get(reverse('admin:index')).status_code, 200)


class ExcelFolderTests(ApiTestCase):
    def make_xlsx(self):
        from openpyxl import Workbook

        workbook = Workbook()
        fees = workbook.active
        fees.title = 'Fees'
        fees.append(['Student', 'Amount', 'Due Date', None])
        fees.append(['Farhan Ali', 24000, datetime.datetime(2026, 10, 30), None])
        fees.append([None, None, None, None])  # blank rows are dropped
        fees.append(['Sara Tariq', 1500.5, datetime.datetime(2026, 11, 5), None])
        staff = workbook.create_sheet('Staff')
        staff.append(['Name', '', 'Name'])
        staff.append(['Ali', 'x', 'Khan'])
        buffer = io.BytesIO()
        workbook.save(buffer)
        buffer.seek(0)
        buffer.name = 'October Fees.xlsx'
        return buffer

    def upload(self, file_obj, role='ACCOUNTANT', **extra):
        headers = {'HTTP_AUTHORIZATION': f'Bearer {self.login(role)}'}
        return self.client.post('/api/excel-folders', {'file': file_obj, **extra}, format='multipart', **headers)

    def test_upload_parses_every_sheet(self):
        res = self.upload(self.make_xlsx())
        self.assertEqual(res.status_code, 201, res.content)
        body = res.json()
        self.assertEqual(body['name'], 'October Fees')
        self.assertEqual(body['sheetNames'], ['Fees', 'Staff'])
        self.assertEqual(body['rowCount'], 3)
        fees, staff = body['sheets']
        self.assertEqual(fees['headers'], ['Student', 'Amount', 'Due Date'])
        self.assertEqual(fees['rows'], [['Farhan Ali', 24000, '2026-10-30'], ['Sara Tariq', 1500.5, '2026-11-05']])
        self.assertEqual(staff['headers'], ['Name', 'Column 2', 'Name (2)'])
        self.assertTrue(AuditLog.objects.filter(action='FILE_UPLOADED').exists())

    def test_list_open_download_delete(self):
        folder_id = self.upload(self.make_xlsx(), name='My Folder').json()['id']

        listing = self.call('ACCOUNTANT', 'get', '/api/excel-folders').json()
        self.assertEqual([f['name'] for f in listing], ['My Folder'])
        self.assertNotIn('sheets', listing[0])

        detail = self.call('ACCOUNTANT', 'get', f'/api/excel-folders/{folder_id}').json()
        self.assertEqual(len(detail['sheets']), 2)

        download = self.call('ACCOUNTANT', 'get', f'/api/excel-folders/{folder_id}/download')
        self.assertEqual(download.status_code, 200)
        self.assertIn('October Fees.xlsx', download['Content-Disposition'])
        self.assertTrue(download.content.startswith(b'PK'))

        self.assertEqual(self.call('ACCOUNTANT', 'delete', f'/api/excel-folders/{folder_id}').status_code, 200)
        self.assertEqual(self.call('ACCOUNTANT', 'get', f'/api/excel-folders/{folder_id}').status_code, 404)

    def test_csv_upload(self):
        csv_file = io.BytesIO('Name;Fee\nFarhan;100\n'.encode('utf-8'))
        csv_file.name = 'fees.csv'
        body = self.upload(csv_file).json()
        self.assertEqual(body['sheets'][0]['headers'], ['Name', 'Fee'])
        self.assertEqual(body['sheets'][0]['rows'], [['Farhan', '100']])

    def test_rejects_bad_files(self):
        for name, content in [('old.xls', b'x'), ('notes.txt', b'x'), ('broken.xlsx', b'not a zip'),
                              ('empty.csv', b'')]:
            bad = io.BytesIO(content)
            bad.name = name
            res = self.upload(bad)
            self.assertEqual(res.status_code, 400, name)
            self.assertIn('error', res.json())

    def test_only_accountant_has_access(self):
        for role in ('GM', 'HOD'):
            self.assertEqual(self.call(role, 'get', '/api/excel-folders').status_code, 403)
            self.assertEqual(self.upload(self.make_xlsx(), role=role).status_code, 403)

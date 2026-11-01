import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBalance,
  calculatePaymentStatus,
  formatCurrency,
  canUserModifyRecord,
  validateStudentImportRow,
} from './financeRules.ts';

test('calculateBalance handles exact calculation without negative balances', () => {
  assert.equal(calculateBalance(20000, 12000), 8000);
  assert.equal(calculateBalance(100000, 65000), 35000);
  assert.equal(calculateBalance(5000, 5000), 0);
  // Never negative
  assert.equal(calculateBalance(5000, 6000), 0);
});

test('calculatePaymentStatus handles Paid, Partially Paid, Unpaid, and Overdue', () => {
  const currentDate = '2026-10-15';

  // Paid
  assert.equal(calculatePaymentStatus(20000, 20000, '2026-10-20', currentDate), 'Paid');

  // Partially Paid before due date
  assert.equal(calculatePaymentStatus(20000, 12000, '2026-10-20', currentDate), 'Partially Paid');

  // Unpaid before due date
  assert.equal(calculatePaymentStatus(20000, 0, '2026-10-20', currentDate), 'Unpaid');

  // Overdue when balance > 0 and past due date
  assert.equal(calculatePaymentStatus(20000, 12000, '2026-10-10', currentDate), 'Overdue');
  assert.equal(calculatePaymentStatus(20000, 0, '2026-10-10', currentDate), 'Overdue');

  // If paid in full, never overdue even if due date has passed
  assert.equal(calculatePaymentStatus(20000, 20000, '2026-10-01', currentDate), 'Paid');
});

test('formatCurrency formats PKR correctly', () => {
  assert.equal(formatCurrency(25000, 'PKR'), 'PKR 25,000.00');
  assert.equal(formatCurrency(8000.5, 'PKR'), 'PKR 8,000.50');
  assert.equal(formatCurrency(0, 'PKR'), 'PKR 0.00');
});

test('canUserModifyRecord strictly enforces GM restriction on original accountant records', () => {
  // GM CANNOT edit or delete original Accountant records
  const gmEditCheck = canUserModifyRecord('GM', 'ACCOUNTANT', 'edit');
  assert.equal(gmEditCheck.allowed, false);
  assert.match(gmEditCheck.reason || '', /CRITICAL SECURITY RULE/);

  const gmDeleteCheck = canUserModifyRecord('GM', 'ACCOUNTANT', 'delete');
  assert.equal(gmDeleteCheck.allowed, false);
  assert.match(gmDeleteCheck.reason || '', /CRITICAL SECURITY RULE/);

  // GM can flag for review
  const gmFlagCheck = canUserModifyRecord('GM', 'ACCOUNTANT', 'flag');
  assert.equal(gmFlagCheck.allowed, true);

  // Accountant CAN edit
  const accountantEditCheck = canUserModifyRecord('ACCOUNTANT', 'ACCOUNTANT', 'edit');
  assert.equal(accountantEditCheck.allowed, true);

  // HOD must use revisions
  const hodEditCheck = canUserModifyRecord('HOD', 'ACCOUNTANT', 'edit');
  assert.equal(hodEditCheck.allowed, false);
  const hodRevisionCheck = canUserModifyRecord('HOD', 'ACCOUNTANT', 'add_revision');
  assert.equal(hodRevisionCheck.allowed, true);

  // Vendor cannot edit
  const vendorEditCheck = canUserModifyRecord('VENDOR', 'ACCOUNTANT', 'edit');
  assert.equal(vendorEditCheck.allowed, false);
});

test('validateStudentImportRow detects invalid amounts, dates, and duplicates', () => {
  const existingInvoices = new Set(['INV-2026-001', 'INV-2026-002']);

  // Valid row
  const validRow = {
    studentId: 'STD-1001',
    studentName: 'Zainab Ahmed',
    gradeClass: 'Grade 10-A',
    category: 'Tuition Fee',
    totalAmount: 25000,
    paidAmount: 15000,
    dueDate: '2026-10-25',
    month: 'October',
    year: 2026,
    invoiceNumber: 'INV-2026-099',
  };
  const validResult = validateStudentImportRow(validRow, existingInvoices);
  assert.equal(validResult.isValid, true);
  assert.equal(validResult.errors.length, 0);

  // Duplicate invoice
  const dupRow = { ...validRow, invoiceNumber: 'INV-2026-001' };
  const dupResult = validateStudentImportRow(dupRow, existingInvoices);
  assert.equal(dupResult.isValid, false);
  assert.match(dupResult.errors[0], /Duplicate Invoice Number/);

  // Paid greater than total
  const invalidAmountRow = { ...validRow, invoiceNumber: 'INV-NEW-01', totalAmount: 1000, paidAmount: 2000 };
  const invalidResult = validateStudentImportRow(invalidAmountRow, existingInvoices);
  assert.equal(invalidResult.isValid, false);
  assert.ok(invalidResult.errors.some(e => e.includes('cannot exceed Total Amount')));
});

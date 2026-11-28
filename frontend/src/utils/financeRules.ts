/**
 * Pure financial calculations and business rules for School Financial Management System.
 * Decoupled from React UI for deterministic testing and rock-solid precision.
 */

export type UserRole = 'GM' | 'ACCOUNTANT' | 'HOD';

export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue';

export interface FeeOrBillRecord {
  id: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate: string; // ISO date string YYYY-MM-DD
  paymentStatus: PaymentStatus;
  createdByRole?: UserRole;
  isFlaggedForReview?: boolean;
}

/**
 * Calculates remaining balance: Total - Paid.
 * Never allows negative balances or floating point inaccuracies.
 */
export function calculateBalance(totalAmount: number, paidAmount: number): number {
  const total = Number(totalAmount) || 0;
  const paid = Number(paidAmount) || 0;
  const balance = Math.round((total - paid) * 100) / 100;
  return balance < 0 ? 0 : balance;
}

/**
 * Calculates payment status with strict prioritization:
 * - Paid: remaining balance <= 0
 * - Overdue: balance > 0 AND currentDate > dueDate
 * - Partially Paid: balance > 0 AND paid > 0 AND currentDate <= dueDate
 * - Unpaid: balance === total AND paid === 0 AND currentDate <= dueDate
 */
export function calculatePaymentStatus(
  totalAmount: number,
  paidAmount: number,
  dueDateStr: string,
  referenceDateStr?: string
): PaymentStatus {
  const total = Number(totalAmount) || 0;
  const paid = Number(paidAmount) || 0;
  const balance = calculateBalance(total, paid);

  if (total > 0 && balance <= 0) {
    return 'Paid';
  }

  // Parse dates ignoring time
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const dueDate = new Date(dueDateStr);

  // Normalize to start of day for accurate comparison
  const refTime = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()).getTime();
  const dueTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();

  if (balance > 0 && refTime > dueTime) {
    return 'Overdue';
  }

  if (paid > 0 && balance > 0) {
    return 'Partially Paid';
  }

  return 'Unpaid';
}

/**
 * Formats a currency amount into Pakistani Rupees (or configured currency)
 * e.g., PKR 25,000.00
 */
export function formatCurrency(amount: number, currencyCode: string = 'PKR'): string {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencyCode} ${formatted}`;
}

/**
 * Enforces role-based action permissions on financial records.
 * 
 * CRITICAL RULE:
 * - GM can view, monitor, flag, and manage the system, but CANNOT edit or delete original records uploaded by Accountant.
 * - Accountant can enter, edit, and update records they maintain.
 * - HOD can submit authorized revisions with audit logging.
 */
export function canUserModifyRecord(
  actorRole: UserRole,
  recordCreatorRole: UserRole | undefined,
  action: 'edit' | 'delete' | 'flag' | 'add_payment' | 'add_revision'
): { allowed: boolean; reason?: string } {
  if (action === 'flag') {
    if (actorRole === 'GM' || actorRole === 'HOD') {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Only GM and HOD can flag records for review.' };
  }

  if (action === 'delete') {
    if (actorRole === 'GM') {
      return {
        allowed: false,
        reason: 'CRITICAL SECURITY RULE: The GM cannot delete original financial records uploaded by the Accountant.',
      };
    }
    if (actorRole === 'ACCOUNTANT') {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Only the Accountant can archive or remove pending records.' };
  }

  if (action === 'edit') {
    if (actorRole === 'GM') {
      return {
        allowed: false,
        reason: 'CRITICAL SECURITY RULE: The GM cannot edit or overwrite original financial records uploaded by the Accountant. Request a correction instead.',
      };
    }
    if (actorRole === 'ACCOUNTANT') {
      return { allowed: true };
    }
    if (actorRole === 'HOD') {
      // HOD modifications must be stored as revisions, not in-place destructive overwrites
      return { allowed: false, reason: 'HOD must use the revision workflow to preserve audit trails.' };
    }
  }

  if (action === 'add_revision') {
    if (actorRole === 'HOD') {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Only HOD creates authorized revisions.' };
  }

  if (action === 'add_payment') {
    if (actorRole === 'ACCOUNTANT' || actorRole === 'HOD') {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Only Accountant or HOD can record incoming/outgoing payments.' };
  }

  return { allowed: false, reason: 'Unauthorized action.' };
}

/**
 * Validates a CSV or manual import row for Student Fees.
 */
export interface StudentImportRow {
  studentId: string;
  studentName: string;
  gradeClass: string;
  category: string;
  totalAmount: number | string;
  paidAmount?: number | string;
  dueDate: string;
  month: string;
  year: number | string;
  invoiceNumber: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateStudentImportRow(
  row: Partial<StudentImportRow>,
  existingInvoiceNumbers: Set<string>
): ValidationResult {
  const errors: string[] = [];

  if (!row.studentId || String(row.studentId).trim() === '') {
    errors.push('Student ID / Registration number is required.');
  }

  if (!row.studentName || String(row.studentName).trim() === '') {
    errors.push('Student full name is required.');
  }

  if (!row.gradeClass || String(row.gradeClass).trim() === '') {
    errors.push('Grade / Class is required.');
  }

  if (!row.category || String(row.category).trim() === '') {
    errors.push('Fee category is required.');
  }

  const total = Number(row.totalAmount);
  if (isNaN(total) || total <= 0) {
    errors.push('Total Amount Payable must be a positive number.');
  }

  const paid = Number(row.paidAmount || 0);
  if (isNaN(paid) || paid < 0) {
    errors.push('Paid Amount cannot be negative.');
  }

  if (paid > total) {
    errors.push('Paid Amount cannot exceed Total Amount Payable.');
  }

  if (!row.dueDate || isNaN(new Date(row.dueDate).getTime())) {
    errors.push('Valid Due Date (YYYY-MM-DD) is required.');
  }

  if (!row.month || String(row.month).trim() === '') {
    errors.push('Billing month is required.');
  }

  const year = Number(row.year);
  if (isNaN(year) || year < 2000 || year > 2100) {
    errors.push('Valid 4-digit billing year is required.');
  }

  if (!row.invoiceNumber || String(row.invoiceNumber).trim() === '') {
    errors.push('Invoice / Bill number is required.');
  } else if (existingInvoiceNumbers.has(String(row.invoiceNumber).trim().toUpperCase())) {
    errors.push(`Duplicate Invoice Number "${row.invoiceNumber}" detected.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Formats date into readable string: "15 Oct 2026"
 */
export function formatDisplayDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

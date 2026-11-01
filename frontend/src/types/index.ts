export type UserRole = 'GM' | 'ACCOUNTANT' | 'HOD' | 'VENDOR';

export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department?: string;
  vendorId?: string;
  phone?: string;
  isActive: boolean;
  avatar?: string;
  needsPasswordChange?: boolean;
  isPrimaryAdmin?: boolean;
}

export interface Student {
  id: string;
  studentId: string;
  fullName: string;
  gradeClass: string;
  academicSession: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
}

export interface StudentFeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  gradeClass: string;
  invoiceNumber: string;
  category: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  paymentStatus: PaymentStatus;
  billIssueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  lastPaymentDate?: string;
  month: string; // e.g. "October"
  year: number; // e.g. 2026
  notes?: string;
  createdBy: string;
  createdByRole: UserRole;
  lastUpdatedBy?: string;
  isFlaggedForReview?: boolean;
  flagReason?: string;
  flaggedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  vendorId: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  category: string;
  goodsServices: string;
  isActive: boolean;
}

export interface VendorInvoice {
  id: string;
  vendorId: string;
  vendorName: string;
  invoiceNumber: string;
  category: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  paymentStatus: PaymentStatus;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  lastPaymentDate?: string;
  month: string;
  year: number;
  notes?: string;
  attachmentName?: string;
  createdBy: string;
  createdByRole: UserRole;
  lastUpdatedBy?: string;
  isFlaggedForReview?: boolean;
  flagReason?: string;
  flaggedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE';

export interface Payment {
  id: string;
  recordId: string;
  recordType: 'student' | 'vendor';
  invoiceNumber: string;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  receiptNotes?: string;
  recordedBy: string;
  recordedByRole: UserRole;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: 'RECORD_CREATED' | 'RECORD_EDITED' | 'HOD_REVISION' | 'PAYMENT_RECORDED' | 'RECORD_FLAGGED' | 'IMPORT_COMPLETED' | 'SETTINGS_UPDATED' | 'USER_UPDATED';
  category?: string;
  details?: string;
  modelName: 'StudentFeeRecord' | 'VendorInvoice' | 'Payment' | 'SchoolSettings' | 'User';
  recordId: string;
  recordIdentifier: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  reason?: string;
  user?: string;
  performedBy: string;
  performedByRole: UserRole;
  timestamp: string;
}

export interface SchoolSettings {
  schoolName: string;
  currencyCode: string;
  academicSession: string;
  financialYear: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  taxRegistrationNumber: string;
  feeCategories: string[];
  vendorCategories: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'ALERT' | 'OVERDUE' | 'FLAG' | 'PAYMENT' | 'INFO';
  timestamp: string;
  isRead: boolean;
  targetTab?: string;
  recipientRoles?: UserRole[];
}

export interface DashboardMetrics {
  studentBilled: number;
  studentCollected: number;
  studentOutstanding: number;
  studentOverdueCount: number;
  studentUnpaidCount: number;
  activeStudents: number;
  vendorBilled: number;
  vendorPaid: number;
  vendorPayable: number;
  vendorOverdueCount: number;
  activeVendors: number;
  monthlyTrends: Array<{
    month: string;
    feesCollected: number;
    vendorPayments: number;
    outstandingDues: number;
  }>;
  flaggedCount: number;
}

// ============ FILTER SYSTEM TYPES ============

export interface FilterState {
  search: string;
  month: string;       // 'all' | month name
  year: string;        // 'all' | year number string
  startDate: string;   // YYYY-MM-DD or ''
  endDate: string;     // YYYY-MM-DD or ''
  status: string;      // 'all' | PaymentStatus value
  category: string;    // 'all' | category name
  minAmount: string;   // '' or number string
  maxAmount: string;   // '' or number string
  createdBy: string;   // 'all' | username
  ordering: string;    // field name, prefix with '-' for desc
  page: number;
  pageSize: number;
  // Optional extra filters for specific modules
  recordType?: string;       // 'all' | 'student' | 'vendor'
  paymentMethod?: string;    // 'all' | payment method
  action?: string;           // 'all' | audit action
  performedByRole?: string;  // 'all' | role
  gradeClass?: string;       // 'all' | grade/class
  vendorId?: string;         // 'all' | vendor id
  flaggedOnly?: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  month: 'all',
  year: 'all',
  startDate: '',
  endDate: '',
  status: 'all',
  category: 'all',
  minAmount: '',
  maxAmount: '',
  createdBy: 'all',
  ordering: '-created_at',
  page: 1,
  pageSize: 15,
  recordType: 'all',
  paymentMethod: 'all',
  action: 'all',
  performedByRole: 'all',
  gradeClass: 'all',
  vendorId: 'all',
  flaggedOnly: false,
};

export interface PaginatedResponse<T> {
  results: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const YEARS = ['2027', '2026', '2025', '2024'];

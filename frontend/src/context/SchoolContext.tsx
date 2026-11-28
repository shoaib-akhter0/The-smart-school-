import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  StudentFeeRecord, VendorInvoice, Payment, AuditLog,
  SchoolSettings, NotificationItem, DashboardMetrics, User,
  FilterState, PaginatedResponse, DEFAULT_FILTERS
} from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';
import { useAuth } from './AuthContext';

interface SchoolContextType {
  // Global data (loaded once)
  settings: SchoolSettings;
  metrics: DashboardMetrics | null;
  notifications: NotificationItem[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;

  // Parameterized fetch methods (backend-connected filtering)
  fetchStudentFees: (filters: FilterState) => Promise<PaginatedResponse<StudentFeeRecord>>;
  fetchVendorInvoices: (filters: FilterState) => Promise<PaginatedResponse<VendorInvoice>>;
  fetchPayments: (filters: FilterState) => Promise<PaginatedResponse<Payment>>;
  fetchAuditLogs: (filters: FilterState) => Promise<PaginatedResponse<AuditLog>>;
  fetchDashboardSummary: (month?: string, year?: string) => Promise<any>;

  // Legacy accessors (for dashboards that compute on all data)
  studentFees: StudentFeeRecord[];
  vendorInvoices: VendorInvoice[];
  payments: Payment[];
  auditLogs: AuditLog[];

  // Mutations
  addStudentFee: (feeData: any) => Promise<{ success: boolean; error?: string }>;
  updateStudentFee: (id: string, feeData: any) => Promise<{ success: boolean; error?: string }>;
  deleteStudentFee: (id: string) => Promise<{ success: boolean; error?: string }>;
  flagRecord: (recordType: 'student' | 'vendor', id: string, reason: string, unflag?: boolean) => Promise<{ success: boolean; error?: string }>;
  submitRevision: (recordType: 'student' | 'vendor', id: string, field: string, newValue: any, reason: string) => Promise<{ success: boolean; error?: string }>;
  recordPayment: (recordType: 'student' | 'vendor', id: string, paymentData: any) => Promise<{ success: boolean; error?: string }>;
  addVendorInvoice: (invoiceData: any) => Promise<{ success: boolean; error?: string }>;
  updateVendorInvoice: (id: string, invoiceData: any) => Promise<{ success: boolean; error?: string }>;
  updateSettings: (newSettings: Partial<SchoolSettings>) => Promise<{ success: boolean; error?: string }>;
  commitBulkImport: (category: 'student_fees' | 'vendor_invoices', rows: any[]) => Promise<any>;
  markNotificationAsRead: (id: string) => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

/**
 * Converts a FilterState into URL query parameters.
 * Only includes non-default values to keep URLs clean.
 */
function buildQueryString(filters: Partial<FilterState>): string {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.month && filters.month !== 'all') params.set('month', filters.month);
  if (filters.year && filters.year !== 'all') params.set('year', filters.year);
  if (filters.startDate) params.set('start_date', filters.startDate);
  if (filters.endDate) params.set('end_date', filters.endDate);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters.minAmount) params.set('min_amount', filters.minAmount);
  if (filters.maxAmount) params.set('max_amount', filters.maxAmount);
  if (filters.createdBy && filters.createdBy !== 'all') params.set('created_by', filters.createdBy);
  if (filters.ordering) params.set('ordering', filters.ordering);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  if (filters.pageSize && filters.pageSize !== 15) params.set('page_size', String(filters.pageSize));
  if (filters.gradeClass && filters.gradeClass !== 'all') params.set('gradeClass', filters.gradeClass);
  if (filters.vendorId && filters.vendorId !== 'all') params.set('vendorId', filters.vendorId);
  if (filters.recordType && filters.recordType !== 'all') params.set('recordType', filters.recordType);
  if (filters.paymentMethod && filters.paymentMethod !== 'all') params.set('paymentMethod', filters.paymentMethod);
  if (filters.action && filters.action !== 'all') params.set('action', filters.action);
  if (filters.performedByRole && filters.performedByRole !== 'all') params.set('performedByRole', filters.performedByRole);
  if (filters.flaggedOnly) params.set('flagged_only', 'true');

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Headers for every backend call: the Bearer token identifies the user; the role header is informational. */
function getAuthHeaders(role: string, json = false): Record<string, string> {
  const headers: Record<string, string> = { 'x-user-role': role };
  const token = localStorage.getItem('smart_school_token');
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [studentFees, setStudentFees] = useState<StudentFeeRecord[]>([]);
  const [vendorInvoices, setVendorInvoices] = useState<VendorInvoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<SchoolSettings>(INITIAL_SETTINGS);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


  // Parameterized fetch: Student Fees
  const fetchStudentFees = useCallback(async (filters: FilterState): Promise<PaginatedResponse<StudentFeeRecord>> => {
    try {
      const headers = getAuthHeaders(currentUser.role);
      const res = await fetch(`/api/students/fees${buildQueryString(filters)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
      return { results: [], totalCount: 0, page: 1, pageSize: filters.pageSize, totalPages: 1 };
    } catch (err) {
      console.error('Error fetching student fees:', err);
      return { results: [], totalCount: 0, page: 1, pageSize: filters.pageSize, totalPages: 1 };
    }
  }, [currentUser.role]);

  // Parameterized fetch: Vendor Invoices
  const fetchVendorInvoices = useCallback(async (filters: FilterState): Promise<PaginatedResponse<VendorInvoice>> => {
    try {
      const headers = getAuthHeaders(currentUser.role);
      const res = await fetch(`/api/vendors/invoices${buildQueryString(filters)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
      return { results: [], totalCount: 0, page: 1, pageSize: filters.pageSize, totalPages: 1 };
    } catch (err) {
      console.error('Error fetching vendor invoices:', err);
      return { results: [], totalCount: 0, page: 1, pageSize: filters.pageSize, totalPages: 1 };
    }
  }, [currentUser.role]);

  // Parameterized fetch: Payments
  const fetchPayments = useCallback(async (filters: FilterState): Promise<PaginatedResponse<Payment>> => {
    try {
      const headers = getAuthHeaders(currentUser.role);
      const res = await fetch(`/api/payments${buildQueryString(filters)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
      return { results: [], totalCount: 0, page: 1, pageSize: filters.pageSize, totalPages: 1 };
    } catch (err) {
      console.error('Error fetching payments:', err);
      return { results: [], totalCount: 0, page: 1, pageSize: filters.pageSize, totalPages: 1 };
    }
  }, [currentUser.role]);

  // Parameterized fetch: Audit Logs
  const fetchAuditLogs = useCallback(async (filters: FilterState): Promise<PaginatedResponse<AuditLog>> => {
    try {
      const headers = getAuthHeaders(currentUser.role);
      const res = await fetch(`/api/audit-logs${buildQueryString(filters)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
      return { results: [], totalCount: 0, page: 1, pageSize: filters.pageSize || 20, totalPages: 1 };
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      return { results: [], totalCount: 0, page: 1, pageSize: filters.pageSize || 20, totalPages: 1 };
    }
  }, [currentUser.role]);

  // Dashboard summary with optional month/year
  const fetchDashboardSummary = useCallback(async (month?: string, year?: string) => {
    try {
      const headers = getAuthHeaders(currentUser.role);
      const params = new URLSearchParams();
      if (month && month !== 'all') params.set('month', month);
      if (year && year !== 'all') params.set('year', year);
      const qs = params.toString();
      const res = await fetch(`/api/dashboard/summary${qs ? `?${qs}` : ''}`, { headers });
      if (res.ok) return await res.json();
      return null;
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
      return null;
    }
  }, [currentUser.role]);

  // Full data refresh for legacy accessors and global state
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) {
      setStudentFees([]);
      setVendorInvoices([]);
      setPayments([]);
      setAuditLogs([]);
      setNotifications([]);
      setMetrics(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders(currentUser.role);

      const [feesRes, invoicesRes, paymentsRes, auditRes, settingsRes, notifRes, metricsRes] = await Promise.all([
        fetch('/api/students/fees?page_size=100', { headers }),
        fetch('/api/vendors/invoices?page_size=100', { headers }),
        fetch('/api/payments?page_size=100', { headers }),
        fetch('/api/audit-logs?page_size=100', { headers }),
        fetch('/api/settings', { headers }),
        fetch('/api/notifications', { headers }),
        fetch('/api/dashboard/summary', { headers }),
      ]);

      if (feesRes && feesRes.ok) {
        const data = await feesRes.json();
        setStudentFees(data.results || data);
      }
      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setVendorInvoices(data.results || data);
      }
      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data.results || data);
      }
      if (auditRes && auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.results || data);
      }
      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (metricsRes.ok) setMetrics(await metricsRes.json());
    } catch (err: any) {
      console.error('Error fetching school data:', err);
      setError(err.message || 'Failed to connect to school finance backend');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.role, currentUser.id, isAuthenticated]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Mutations
  const addStudentFee = async (feeData: any) => {
    try {
      const res = await fetch('/api/students/fees', {
        method: 'POST',
        headers: getAuthHeaders(currentUser.role, true),
        body: JSON.stringify(feeData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to add student fee' };
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateStudentFee = async (id: string, feeData: any) => {
    try {
      const res = await fetch(`/api/students/fees/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(currentUser.role, true),
        body: JSON.stringify(feeData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to update record' };
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteStudentFee = async (id: string) => {
    try {
      const res = await fetch(`/api/students/fees/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(currentUser.role, true),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to delete record' };
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const flagRecord = async (recordType: 'student' | 'vendor', id: string, reason: string, unflag?: boolean) => {
    try {
      const endpoint = recordType === 'student' ? `/api/students/fees/${id}/flag` : `/api/vendors/invoices/${id}/flag`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(currentUser.role, true),
        body: JSON.stringify({ reason, unflag }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to flag record' };
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const submitRevision = async (recordType: 'student' | 'vendor', id: string, field: string, newValue: any, reason: string) => {
    try {
      const endpoint = recordType === 'student' ? `/api/students/fees/${id}/revision` : `/api/vendors/invoices/${id}/revision`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(currentUser.role, true),
        body: JSON.stringify({ field, newValue, reason }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to submit revision' };
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const recordPayment = async (recordType: 'student' | 'vendor', id: string, paymentData: any) => {
    try {
      const endpoint = recordType === 'student' ? `/api/students/fees/${id}/payments` : `/api/vendors/invoices/${id}/payments`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(currentUser.role, true),
        body: JSON.stringify(paymentData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to record payment' };
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const addVendorInvoice = async (invoiceData: any) => {
    try {
      const res = await fetch('/api/vendors/invoices', {
        method: 'POST',
        headers: getAuthHeaders(currentUser.role, true),
        body: JSON.stringify(invoiceData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to add vendor invoice' };
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateVendorInvoice = async (id: string, invoiceData: any) => {
    try {
      const res = await fetch(`/api/vendors/invoices/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(currentUser.role, true),
        body: JSON.stringify(invoiceData),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to update vendor invoice' };
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateSettings = async (newSettings: Partial<SchoolSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: getAuthHeaders(currentUser.role, true),
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to update settings' };
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const commitBulkImport = async (category: 'student_fees' | 'vendor_invoices', rows: any[]) => {
    const res = await fetch('/api/import/commit', {
      method: 'POST',
      headers: getAuthHeaders(currentUser.role, true),
      body: JSON.stringify({ category, rows }),
    });
    const data = await res.json();
    if (res.ok) await refreshData();
    return data;
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: getAuthHeaders(currentUser.role, true),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  return (
    <SchoolContext.Provider
      value={{
        studentFees,
        vendorInvoices,
        payments,
        auditLogs,
        notifications,
        settings,
        metrics,
        isLoading,
        error,
        refreshData,
        fetchStudentFees,
        fetchVendorInvoices,
        fetchPayments,
        fetchAuditLogs,
        fetchDashboardSummary,
        addStudentFee,
        updateStudentFee,
        deleteStudentFee,
        flagRecord,
        submitRevision,
        recordPayment,
        addVendorInvoice,
        updateVendorInvoice,
        updateSettings,
        commitBulkImport,
        markNotificationAsRead,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};

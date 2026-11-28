import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { User, UserRole, StudentFeeRecord, VendorInvoice, Payment, AuditLog, SchoolSettings, NotificationItem, ExcelFolder } from '../types';

// Create configured Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach active user role and token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('smart_school_token');
  const role = localStorage.getItem('smart_school_role');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (role && config.headers) {
    config.headers['x-user-role'] = role;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const api = {
  // Authentication
  auth: {
    login: async (credentials: { username?: string; email?: string; password?: string; role?: UserRole }) => {
      const res = await apiClient.post<{ success: boolean; token: string; user: User }>('/auth/login', credentials);
      if (res.data.token) {
        localStorage.setItem('smart_school_token', res.data.token);
        localStorage.setItem('smart_school_role', res.data.user.role);
      }
      return res.data;
    },
    logout: async () => {
      try {
        await apiClient.post('/auth/logout');
      } finally {
        localStorage.removeItem('smart_school_token');
        localStorage.removeItem('smart_school_role');
      }
    },
    getCurrentUser: async () => {
      const res = await apiClient.get<User>('/auth/current-user');
      return res.data;
    },
    getUsers: async () => {
      const res = await apiClient.get<User[]>('/auth/users');
      return res.data;
    },
    switchRole: async (role: UserRole) => {
      const res = await apiClient.post<{ success: boolean; user: User }>('/auth/switch-role', { role });
      localStorage.setItem('smart_school_role', role);
      return res.data;
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
      const res = await apiClient.post<{ success: boolean; message: string; user: User }>('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return res.data;
    },
    getProfile: async () => {
      const res = await apiClient.get<User>('/auth/profile');
      return res.data;
    },
    updateProfile: async (data: Partial<User>) => {
      const res = await apiClient.post<{ success: boolean; user: User }>('/auth/profile', data);
      return res.data;
    },
    uploadAvatar: async (fileOrBase64: File | string) => {
      if (typeof fileOrBase64 === 'string') {
        const res = await apiClient.post<{ success: boolean; user: User }>('/auth/profile', { avatar: fileOrBase64, avatar_url: fileOrBase64 });
        return res.data;
      }
      const formData = new FormData();
      formData.append('avatar', fileOrBase64);
      const res = await apiClient.post<{ success: boolean; user: User }>('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
  },

  // Dashboard Summary & Analytics
  dashboard: {
    getSummary: async (month?: string, year?: string) => {
      const params = new URLSearchParams();
      if (month && month !== 'all') params.append('month', month);
      if (year && year !== 'all') params.append('year', year);
      const res = await apiClient.get(`/dashboard/summary?${params.toString()}`);
      return res.data;
    },
  },

  // Student Fees (Category 1)
  students: {
    getFees: async (filters: Record<string, any> = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params.append(key, String(val));
        }
      });
      const res = await apiClient.get<{ results: StudentFeeRecord[]; totalCount: number; page: number; totalPages: number }>(`/students/fees?${params.toString()}`);
      return res.data;
    },
    createFee: async (recordData: Partial<StudentFeeRecord> & { paymentMethod?: string; paymentRef?: string }) => {
      const res = await apiClient.post<StudentFeeRecord>('/students/fees', recordData);
      return res.data;
    },
    updateFee: async (id: string, recordData: Partial<StudentFeeRecord>) => {
      const res = await apiClient.put<StudentFeeRecord>(`/students/fees/${id}`, recordData);
      return res.data;
    },
    deleteFee: async (id: string) => {
      const res = await apiClient.delete<{ success: boolean }>(`/students/fees/${id}`);
      return res.data;
    },
    flagFee: async (id: string, reason: string, unflag: boolean = false) => {
      const res = await apiClient.post<StudentFeeRecord>(`/students/fees/${id}/flag`, { reason, unflag });
      return res.data;
    },
    submitRevision: async (id: string, field: string, newValue: any, reason: string) => {
      const res = await apiClient.post<StudentFeeRecord>(`/students/fees/${id}/revision`, { field, newValue, reason });
      return res.data;
    },
    recordPayment: async (id: string, paymentData: { amount: number; paymentDate: string; paymentMethod: string; referenceNumber?: string; receiptNotes?: string }) => {
      const res = await apiClient.post<{ record: StudentFeeRecord; payment: Payment }>(`/students/fees/${id}/payments`, paymentData);
      return res.data;
    },
  },

  // Vendor Payables (Category 2)
  vendors: {
    getInvoices: async (filters: Record<string, any> = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params.append(key, String(val));
        }
      });
      const res = await apiClient.get<{ results: VendorInvoice[]; totalCount: number; page: number; totalPages: number }>(`/vendors/invoices?${params.toString()}`);
      return res.data;
    },
    createInvoice: async (invoiceData: Partial<VendorInvoice> & { paymentMethod?: string; paymentRef?: string }) => {
      const res = await apiClient.post<VendorInvoice>('/vendors/invoices', invoiceData);
      return res.data;
    },
    updateInvoice: async (id: string, invoiceData: Partial<VendorInvoice>) => {
      const res = await apiClient.put<VendorInvoice>(`/vendors/invoices/${id}`, invoiceData);
      return res.data;
    },
    recordPayment: async (id: string, paymentData: { amount: number; paymentDate: string; paymentMethod: string; referenceNumber?: string; receiptNotes?: string }) => {
      const res = await apiClient.post<{ record: VendorInvoice; payment: Payment }>(`/vendors/invoices/${id}/payments`, paymentData);
      return res.data;
    },
  },

  // Payments History
  payments: {
    list: async (filters: Record<string, any> = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params.append(key, String(val));
        }
      });
      const res = await apiClient.get<{ results: Payment[]; totalCount: number; page: number; totalPages: number }>(`/payments?${params.toString()}`);
      return res.data;
    },
  },

  // Audit Logs
  audit: {
    list: async (filters: Record<string, any> = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params.append(key, String(val));
        }
      });
      const res = await apiClient.get<{ results: AuditLog[]; totalCount: number; page: number; totalPages: number }>(`/audit-logs?${params.toString()}`);
      return res.data;
    },
  },

  // School Settings
  settings: {
    get: async () => {
      const res = await apiClient.get<SchoolSettings>('/settings');
      return res.data;
    },
    update: async (data: Partial<SchoolSettings>) => {
      const res = await apiClient.post<SchoolSettings>('/settings', data);
      return res.data;
    },
  },

  // User Management
  users: {
    manage: async (payload: { action: 'create' | 'toggle_active' | 'delete' | 'reset_password'; userId?: string; userData?: any }) => {
      const res = await apiClient.post('/users/manage', payload);
      return res.data;
    },
  },

  // Bulk Import
  import: {
    commit: async (category: 'student_fees' | 'vendor_payables', rows: any[]) => {
      const res = await apiClient.post('/import/commit', { category, rows });
      return res.data;
    },
  },

  // Excel Folders (Accountant only)
  excelFolders: {
    list: async () => {
      const res = await apiClient.get<ExcelFolder[]>('/excel-folders');
      return res.data;
    },
    get: async (id: string) => {
      const res = await apiClient.get<ExcelFolder>(`/excel-folders/${id}`);
      return res.data;
    },
    upload: async (file: File, name?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (name) formData.append('name', name);
      const res = await apiClient.post<ExcelFolder>('/excel-folders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      return res.data;
    },
    remove: async (id: string) => {
      const res = await apiClient.delete<{ success: boolean }>(`/excel-folders/${id}`);
      return res.data;
    },
    download: async (id: string) => {
      const res = await apiClient.get<Blob>(`/excel-folders/${id}/download`, { responseType: 'blob' });
      return res.data;
    },
  },

  // Notifications
  notifications: {
    list: async () => {
      const res = await apiClient.get<NotificationItem[]>('/notifications');
      return res.data;
    },
    markRead: async (id: string) => {
      const res = await apiClient.post(`/notifications/${id}/read`);
      return res.data;
    },
  },
};

/** Pull the backend's `{"error": "..."}` message out of an axios error. */
export function apiErrorMessage(err: any, fallback = 'Something went wrong. Please try again.'): string {
  return err?.response?.data?.error || err?.message || fallback;
}

export default apiClient;

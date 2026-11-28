import { SchoolSettings, User } from '../types';

/** Placeholder until /api/auth/login or /api/auth/current-user returns the real user. */
export const GUEST_USER: User = {
  id: '',
  name: '',
  email: '',
  role: '',
  isActive: false,
};

/**
 * The Smart School - Official Configuration
 */
export const INITIAL_SETTINGS: SchoolSettings = {
  schoolName: 'The Smart School',
  currencyCode: 'PKR',
  academicSession: '2025-2026',
  financialYear: 'FY 2025-2026',
  contactEmail: 'info@thesmartschool.edu.pk',
  contactPhone: '+92 21 111-762-787',
  address: 'The Smart School Campus & Head Office, Karachi, Pakistan',
  taxRegistrationNumber: 'NTN-7392810-4',
  feeCategories: [
    'Tuition Fee',
    'Admission Fee',
    'Annual Examination Fee',
    'Laboratory & IT Fee',
    'Transport Charges',
    'Activity & Co-Curricular Fund',
  ],
  vendorCategories: [
    'Stationery & Books Printing',
    'Electricity & Utilities',
    'IT & Software Infrastructure',
    'Campus Maintenance & Sanitation',
    'Cafeteria & Food Supplies',
    'Transport Fleet & Fuel',
  ],
};

/**
 * The Smart School - Centralized Branding & Theme Configuration
 * Extracted directly from official school logo ("The Smart School - Tomorrow is our Destiny")
 */

export const THE_SMART_SCHOOL_THEME = {
  name: 'The Smart School',
  motto: 'Tomorrow is our Destiny',
  ntn: 'NTN-7392810-4',
  colors: {
    // Primary Crimson / Red Brand Palette from Official The Smart School reference
    primary: '#C62828',
    primaryHover: '#B71C1C',
    primaryDark: '#8F0D17',
    primaryDeep: '#59080E',
    primaryLight: '#FFF5F5',
    primarySurface: '#FAF9F6',
    primaryBorder: '#FCA5A5',

    // Neutrals
    background: '#FAF9F6',
    cardBackground: '#FFFFFF',
    sidebarBg: '#120406', // Deep corporate crimson-black
    sidebarText: '#F1F5F9',
    sidebarMuted: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',

    // Status Badges (Accurate & Distinguishable)
    status: {
      paid: { text: '#065F46', bg: '#D1FAE5', border: '#A7F3D0' },
      partiallyPaid: { text: '#1E40AF', bg: '#DBEAFE', border: '#BFDBFE' },
      overdue: { text: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' },
      unpaid: { text: '#334155', bg: '#F1F5F9', border: '#CBD5E1' },
    },

    // Financial Visualization Palette
    charts: {
      collections: '#D81A28', // Brand Crimson
      disbursements: '#1E293B', // Slate Charcoal
      outstanding: '#E11D48', // Rose Red
      cashflow: '#059669', // Emerald
    },
  },
} as const;

export default THE_SMART_SCHOOL_THEME;

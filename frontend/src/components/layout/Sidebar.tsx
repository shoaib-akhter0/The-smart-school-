import React from 'react';
import {
  LayoutDashboard, GraduationCap, Truck, Receipt,
  BarChart3, UploadCloud, History, Users, Settings,
  ShieldCheck, X, ChevronRight, FolderOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { useTheme } from '../../context/ThemeContext';
import { SmartSchoolLogo } from '../common/SmartSchoolLogo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
}) => {
  const { currentUser, isAccountant } = useAuth();
  const { studentFees, vendorInvoices } = useSchool();
  const { isDarkMode } = useTheme();

  const overdueStudentCount = studentFees.filter((f) => f.paymentStatus === 'Overdue').length;
  const overdueVendorCount = vendorInvoices.filter((i) => i.paymentStatus === 'Overdue').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['GM', 'ACCOUNTANT', 'HOD'],
    },
    {
      id: 'students',
      label: 'Student Fees (Cat 1)',
      icon: GraduationCap,
      roles: ['GM', 'ACCOUNTANT', 'HOD'],
      badge: overdueStudentCount > 0 ? `${overdueStudentCount} Due` : undefined,
      badgeColor: 'bg-red-100 text-red-700',
    },
    {
      id: 'vendors',
      label: 'Vendor Payables (Cat 2)',
      icon: Truck,
      roles: ['GM', 'ACCOUNTANT', 'HOD'],
      badge: overdueVendorCount > 0 ? `${overdueVendorCount} Overdue` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'payments',
      label: 'Payment History',
      icon: Receipt,
      roles: ['GM', 'HOD'],
    },
    {
      id: 'reports',
      label: 'Reports & Export',
      icon: BarChart3,
      roles: ['GM', 'ACCOUNTANT', 'HOD'],
    },
    {
      id: 'import',
      label: 'Bulk Import',
      icon: UploadCloud,
      roles: ['ACCOUNTANT', 'GM'],
      tag: isAccountant ? 'Active' : 'Preview',
    },
    {
      id: 'excel-folders',
      label: 'Excel Folders',
      icon: FolderOpen,
      roles: ['ACCOUNTANT'],
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: History,
      roles: ['GM', 'HOD'],
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      roles: ['GM'],
      superAdminOnly: true,
    },
    {
      id: 'settings',
      label: 'School Settings',
      icon: Settings,
      roles: ['GM'],
      superAdminOnly: true,
    },
  ];

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen max-h-screen w-64 flex-col border-r transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shrink-0 ${
          isDarkMode
            ? 'border-slate-800 bg-[#140608] text-slate-100'
            : 'border-slate-200 bg-white text-slate-700'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Official Logo */}
        <div className={`flex h-22 w-64 items-center justify-between border-b px-4 shrink-0 ${
          isDarkMode ? 'border-red-950/60 bg-[#1C090C]' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center gap-2">
            <SmartSchoolLogo height={64} variant="full" inverted={isDarkMode} />
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-1.5 transition lg:hidden ${
              isDarkMode
                ? 'text-slate-400 hover:bg-red-950 hover:text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current user role card */}
        <div className={`px-4 py-3 border-b ${
          isDarkMode
            ? 'border-red-950/40 bg-[#0E0304]'
            : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase tracking-wider font-bold ${
              isDarkMode ? 'text-red-300' : 'text-red-700'
            }`}>
              The Smart School
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-semibold ${
              isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Verified
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-red-500 shrink-0" />
            <span className={`text-xs font-semibold truncate ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {currentUser.role === 'GM'
                ? 'GM / Super Admin'
                : currentUser.role === 'ACCOUNTANT'
                ? 'Senior Accountant'
                : 'Department Head'}
            </span>
          </div>
        </div>

        {/* Navigation links - Scrollable inside 100vh */}
        <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main Navigation">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                  isActive
                    ? 'bg-[#C62828] text-white shadow-xs font-semibold'
                    : isDarkMode
                    ? 'text-slate-300 hover:bg-red-950/40 hover:text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition ${
                      isActive
                        ? 'text-white'
                        : isDarkMode
                        ? 'text-slate-400 group-hover:text-red-400'
                        : 'text-slate-500 group-hover:text-red-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.tag && (
                    <span className={`rounded px-1.5 py-0.5 text-[9px] ${
                      isDarkMode
                        ? 'bg-red-950/80 text-red-200'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.tag}
                    </span>
                  )}
                  <ChevronRight
                    className={`h-3 w-3 opacity-0 transition group-hover:opacity-100 ${
                      isActive
                        ? 'opacity-100 text-white'
                        : isDarkMode
                        ? 'text-slate-500'
                        : 'text-slate-400'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer - Fixed inside 100vh height */}
        <div className={`shrink-0 mt-auto border-t p-3 text-[10px] text-center font-medium ${
          isDarkMode
            ? 'border-red-950/60 bg-[#0C0203] text-slate-500'
            : 'border-slate-200 bg-white text-slate-500'
        }`}>
          The Smart School • Session 2025-2026
        </div>
      </aside>
    </>
  );
};

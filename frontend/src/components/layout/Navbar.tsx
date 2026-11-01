import React, { useState } from 'react';
import {
  Bell, ChevronDown, Check,
  Menu, Wallet, LogOut, KeyRound,
  Camera, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';
import { SmartSchoolLogo } from '../common/SmartSchoolLogo';

interface NavbarProps {
  isSidebarOpen?: boolean;
  onToggleSidebar: () => void;
  onOpenNotifications: () => void;
  activeTab: string;
  onNavigateTab?: (tab: string) => void;
  onOpenChangePassword?: () => void;
  onOpenProfile?: (tab?: 'profile' | 'security') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  onOpenNotifications,
  activeTab,
  onNavigateTab,
  onOpenChangePassword,
  onOpenProfile,
}) => {
  const { currentUser, logout } = useAuth();
  const { settings, notifications } = useSchool();
  const { isDarkMode, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const roleLabels: Record<UserRole, { title: string; badgeClass: string; desc: string }> = {
    GM: {
      title: 'GM / Super Admin',
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      desc: 'Overall Institutional Supervision & User Management (Read-Only on Financial Logs)',
    },
    ACCOUNTANT: {
      title: 'Senior Accountant',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      desc: 'Primary Financial Ledger Authority: Student Fees & Vendor Payables',
    },
    HOD: {
      title: 'Head of Department',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      desc: 'Departmental Oversight, Ledgers Inspection & Authorized Revisions',
    },
    VENDOR: {
      title: 'Vendor Portal',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      desc: 'Isolated Portal for Authorized Supplier Invoices & Balances',
    },
  };

  const currentRoleInfo = roleLabels[currentUser.role];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Brand Logo & Stacked Portal Subtitles */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex items-center gap-3 cursor-pointer select-none min-w-0"
          onClick={() => onNavigateTab && onNavigateTab('dashboard')}
          title="The Smart School - Finance & Accounts Portal"
        >
          {/* Logo on small screens (strictly hidden on desktop where sidebar has the master logo) */}
          <div className="lg:hidden shrink-0">
            <SmartSchoolLogo height={50} variant="full" />
          </div>

          {/* Vertical divider visible next to logo on mobile/tablet */}
          <div className="hidden sm:block lg:hidden h-9 w-[1px] bg-slate-200 shrink-0" />

          {/* Stacked Subtitles */}
          <div className="flex flex-col justify-center min-w-0">
            <span className="block text-xs sm:text-sm font-extrabold tracking-wide uppercase text-[#C62828] leading-tight truncate">
              FINANCE &amp; ACCOUNTS PORTAL
            </span>
            <span className="hidden sm:block text-[11px] font-medium text-[#64748B] leading-tight tracking-normal truncate">
              The Smart School System • Academic Session 2025–2026
            </span>
          </div>
        </div>
      </div>

      {/* Right: Currency Indicator, Notifications, Profile, Exit & Hamburger Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#C62828]/40 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={isDarkMode}
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Currency badge */}
        <div className="hidden items-center gap-1.5 rounded-full border border-red-200 bg-red-50/50 px-2.5 py-1 text-xs font-semibold text-red-800 xl:flex">
          <Wallet className="h-3.5 w-3.5 text-[#C62828]" />
          <span>Currency: {settings.currencyCode}</span>
        </div>



        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#C62828]"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadNotifs > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C62828] text-[10px] font-bold text-white shadow-xs">
              {unreadNotifs}
            </span>
          )}
        </button>

        {/* User profile avatar badge & dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3 text-left focus:outline-none group"
            aria-label="User profile menu"
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-xs ring-1 ring-slate-200 group-hover:ring-[#C62828] transition"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C62828] text-xs font-bold text-white shadow-xs group-hover:scale-105 transition">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
            )}
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-500 truncate max-w-[130px]">
                {currentUser.department || currentUser.role}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl ring-1 ring-black/5 z-50 animate-in fade-in duration-150">
              {/* Profile Card Header */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 mb-2">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-11 w-11 rounded-full object-cover border-2 border-white shadow-xs ring-1 ring-slate-200 shrink-0"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#C62828] text-xs font-bold text-white shadow-xs">
                    {currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {currentUser.email}
                  </p>
                  <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.2 rounded-full border ${currentRoleInfo.badgeClass}`}>
                    {currentRoleInfo.title}
                  </span>
                </div>
              </div>

              {/* Embedded Auth Controls & Action Items */}
              <div className="py-1 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onOpenProfile) onOpenProfile('profile');
                  }}
                  className="w-full text-left rounded-lg p-2 text-xs text-slate-700 hover:bg-red-50/60 hover:text-[#C62828] flex items-center gap-2.5 transition font-medium"
                >
                  <Camera className="h-4 w-4 text-[#C62828]" />
                  <span>Customize Profile Picture</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onOpenProfile) onOpenProfile('security');
                    else if (onOpenChangePassword) onOpenChangePassword();
                  }}
                  className="w-full text-left rounded-lg p-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition"
                >
                  <KeyRound className="h-4 w-4 text-slate-500" />
                  <span>Credential Management</span>
                </button>



                <div className="pt-1 mt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left rounded-lg p-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition font-semibold"
                  >
                    <LogOut className="h-4 w-4 text-red-600" />
                    <span>Sign Out of Portal</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>



        {/* Mobile/Small-screen Hamburger Toggle - Strictly hidden on large desktop screens where sidebar is always visible */}
        <button
          onClick={onToggleSidebar}
          className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-red-50 hover:text-[#C62828] hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 transition shadow-xs lg:hidden"
          aria-label="Toggle navigation menu"
          title="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

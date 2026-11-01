import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { GMDashboard } from './components/dashboard/GMDashboard';
import { AccountantDashboard } from './components/dashboard/AccountantDashboard';
import { HODDashboard } from './components/dashboard/HODDashboard';
import { VendorDashboard } from './components/dashboard/VendorDashboard';
import { StudentRecordsModule } from './components/students/StudentRecordsModule';
import { StudentFeeModal } from './components/students/StudentFeeModal';
import { StudentInvoiceModal } from './components/students/StudentInvoiceModal';
import { VendorRecordsModule } from './components/vendors/VendorRecordsModule';
import { AddVendorInvoiceModal } from './components/vendors/AddVendorInvoiceModal';
import { VendorInvoiceModal } from './components/vendors/VendorInvoiceModal';
import { RecordPaymentModal } from './components/payments/RecordPaymentModal';
import { PaymentsModule } from './components/payments/PaymentsModule';
import { HODRevisionModal } from './components/revisions/HODRevisionModal';
import { FlagRecordModal } from './components/revisions/FlagRecordModal';
import { BulkImportModule } from './components/import/BulkImportModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { AuditLogsModule } from './components/audit/AuditLogsModule';
import { UserManagementModule } from './components/admin/UserManagementModule';
import { SchoolSettingsModule } from './components/admin/SchoolSettingsModule';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { LoginPage } from './components/auth/Login';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { StudentFeeRecord, VendorInvoice } from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const MainApplication: React.FC = () => {
  const { currentUser, isGM, isAccountant, isHOD, isVendor, isAuthenticated, mustChangePassword } = useAuth();
  const { isLoading, error, refreshData } = useSchool();
  const { isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [userProfileInitialTab, setUserProfileInitialTab] = useState<'profile' | 'security'>('profile');

  // Modals state
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentFeeRecord | null>(null);
  const [studentGradeClass, setStudentGradeClass] = useState('Grade 10-A');

  const [studentInvoiceOpen, setStudentInvoiceOpen] = useState(false);
  const [studentInvoiceRecord, setStudentInvoiceRecord] = useState<StudentFeeRecord | null>(null);

  const [vendorAddModalOpen, setVendorAddModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<VendorInvoice | null>(null);

  const [vendorInvoiceOpen, setVendorInvoiceOpen] = useState(false);
  const [vendorInvoiceRecord, setVendorInvoiceRecord] = useState<VendorInvoice | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTargetRecord, setPaymentTargetRecord] = useState<any | null>(null);
  const [paymentRecordType, setPaymentRecordType] = useState<'student' | 'vendor'>('student');

  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionRecord, setRevisionRecord] = useState<any | null>(null);
  const [revisionRecordType, setRevisionRecordType] = useState<'student' | 'vendor'>('student');

  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagRecord, setFlagRecord] = useState<any | null>(null);
  const [flagRecordType, setFlagRecordType] = useState<'student' | 'vendor'>('student');

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className={`flex h-screen max-h-screen w-full overflow-hidden bg-slate-100/70 font-sans text-slate-800 antialiased ${isDarkMode ? 'dark' : ''}`}>
      {/* Mandatory first-time password change modal */}
      {mustChangePassword && (
        <ChangePasswordModal
          isOpen={true}
          isMandatory={true}
        />
      )}

      {/* User-initiated password change modal */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        isMandatory={false}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenNotifications={() => setIsNotifDrawerOpen(true)}
          activeTab={activeTab}
          onNavigateTab={setActiveTab}
          onOpenChangePassword={() => setChangePasswordOpen(true)}
          onOpenProfile={(tab) => {
            setUserProfileInitialTab(tab || 'profile');
            setUserProfileModalOpen(true);
          }}
        />

        <main className="flex-1 overflow-y-auto bg-[#FAF9F6]">
          <div className="flex min-h-full flex-col justify-between">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-6">
                  {/* Dashboard Routing by Role */}
                  {activeTab === 'dashboard' && (
                    <>
                      {isGM && <GMDashboard onNavigateTab={setActiveTab} />}
                      {isAccountant && (
                        <AccountantDashboard
                          onNavigateTab={setActiveTab}
                          onOpenAddStudent={() => {
                            setStudentToEdit(null);
                            setStudentGradeClass('Grade 10-A');
                            setStudentModalOpen(true);
                          }}
                          onOpenAddVendor={() => {
                            setVendorToEdit(null);
                            setVendorAddModalOpen(true);
                          }}
                          onOpenRecordPayment={() => setActiveTab('students')}
                        />
                      )}
                      {isHOD && (
                        <HODDashboard
                          onNavigateTab={setActiveTab}
                          onOpenRevisionModal={(rec, type) => {
                            setRevisionRecord(rec);
                            setRevisionRecordType(type);
                            setRevisionModalOpen(true);
                          }}
                        />
                      )}
                      {isVendor && (
                        <VendorDashboard
                          onOpenInvoiceDetails={(inv) => {
                            setVendorInvoiceRecord(inv);
                            setVendorInvoiceOpen(true);
                          }}
                        />
                      )}
                    </>
                  )}

                  {/* Category 1: Student Financial Records */}
                  {activeTab === 'students' && (
                    <StudentRecordsModule
                      onOpenAddModal={(gradeClass) => {
                        setStudentToEdit(null);
                        setStudentGradeClass(gradeClass ?? 'Grade 10-A');
                        setStudentModalOpen(true);
                      }}
                      onOpenEditModal={(rec) => {
                        setStudentToEdit(rec);
                        setStudentModalOpen(true);
                      }}
                      onOpenInvoiceModal={(rec) => {
                        setStudentInvoiceRecord(rec);
                        setStudentInvoiceOpen(true);
                      }}
                      onOpenPaymentModal={(rec) => {
                        setPaymentTargetRecord(rec);
                        setPaymentRecordType('student');
                        setPaymentModalOpen(true);
                      }}
                      onOpenRevisionModal={(rec) => {
                        setRevisionRecord(rec);
                        setRevisionRecordType('student');
                        setRevisionModalOpen(true);
                      }}
                      onOpenFlagModal={(rec) => {
                        setFlagRecord(rec);
                        setFlagRecordType('student');
                        setFlagModalOpen(true);
                      }}
                    />
                  )}

                  {/* Category 2: Vendor Payables Records */}
                  {activeTab === 'vendors' && (
                    <VendorRecordsModule
                      onOpenAddModal={() => {
                        setVendorToEdit(null);
                        setVendorAddModalOpen(true);
                      }}
                      onOpenEditModal={(inv) => {
                        setVendorToEdit(inv);
                        setVendorAddModalOpen(true);
                      }}
                      onOpenInvoiceModal={(inv) => {
                        setVendorInvoiceRecord(inv);
                        setVendorInvoiceOpen(true);
                      }}
                      onOpenPaymentModal={(inv) => {
                        setPaymentTargetRecord(inv);
                        setPaymentRecordType('vendor');
                        setPaymentModalOpen(true);
                      }}
                      onOpenRevisionModal={(inv) => {
                        setRevisionRecord(inv);
                        setRevisionRecordType('vendor');
                        setRevisionModalOpen(true);
                      }}
                      onOpenFlagModal={(inv) => {
                        setFlagRecord(inv);
                        setFlagRecordType('vendor');
                        setFlagModalOpen(true);
                      }}
                    />
                  )}

                  {/* Payments List */}
                  {activeTab === 'payments' && <PaymentsModule />}

                  {/* Reports & Exports */}
                  {activeTab === 'reports' && <ReportsModule />}

                  {/* Bulk CSV / Excel Import */}
                  {activeTab === 'import' && <BulkImportModule />}

                  {/* Audit Logs */}
                  {activeTab === 'audit' && <AuditLogsModule />}

                  {/* User Management (GM Only) */}
                  {activeTab === 'users' && isGM && <UserManagementModule />}

                  {/* School Settings (GM Only) */}
                  {activeTab === 'settings' && isGM && <SchoolSettingsModule />}
                </div>
              </div>
            </div>
        </main>
      </div>

      {/* Global Modals */}
      <StudentFeeModal
        isOpen={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        recordToEdit={studentToEdit}
        initialGradeClass={studentGradeClass}
      />

      <StudentInvoiceModal
        isOpen={studentInvoiceOpen}
        onClose={() => setStudentInvoiceOpen(false)}
        record={studentInvoiceRecord}
      />

      <AddVendorInvoiceModal
        isOpen={vendorAddModalOpen}
        onClose={() => setVendorAddModalOpen(false)}
        invoiceToEdit={vendorToEdit}
      />

      <VendorInvoiceModal
        isOpen={vendorInvoiceOpen}
        onClose={() => setVendorInvoiceOpen(false)}
        invoice={vendorInvoiceRecord}
        onOpenRecordPayment={(inv) => {
          setPaymentTargetRecord(inv);
          setPaymentRecordType('vendor');
          setPaymentModalOpen(true);
        }}
      />

      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        record={paymentTargetRecord}
        recordType={paymentRecordType}
      />

      <HODRevisionModal
        isOpen={revisionModalOpen}
        onClose={() => setRevisionModalOpen(false)}
        record={revisionRecord}
        recordType={revisionRecordType}
      />

      <FlagRecordModal
        isOpen={flagModalOpen}
        onClose={() => setFlagModalOpen(false)}
        record={flagRecord}
        recordType={flagRecordType}
      />

      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsNotifDrawerOpen(false);
        }}
      />

      <UserProfileModal
        isOpen={userProfileModalOpen}
        onClose={() => setUserProfileModalOpen(false)}
        initialTab={userProfileInitialTab}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SchoolProvider>
          <MainApplication />
        </SchoolProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

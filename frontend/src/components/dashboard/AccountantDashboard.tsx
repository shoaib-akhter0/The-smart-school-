import React from 'react';
import {
  GraduationCap, Truck, PlusCircle, UploadCloud,
  Receipt, ArrowUpRight, Clock, AlertCircle, CheckCircle,
  FileSpreadsheet, ShieldCheck, Inbox
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { formatCurrency, formatDisplayDate } from '../../utils/financeRules';

interface AccountantDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenAddStudent: () => void;
  onOpenAddVendor: () => void;
  onOpenRecordPayment: () => void;
}

export const AccountantDashboard: React.FC<AccountantDashboardProps> = ({
  onNavigateTab,
  onOpenAddStudent,
  onOpenAddVendor,
  onOpenRecordPayment,
}) => {
  const { studentFees, vendorInvoices, settings } = useSchool();

  // Category 1 Calculations directly from real data
  const studentTotalBilled = studentFees.reduce((sum, f) => sum + f.totalAmount, 0);
  const studentTotalCollected = studentFees.reduce((sum, f) => sum + f.paidAmount, 0);
  const studentTotalOutstanding = studentFees.reduce((sum, f) => sum + f.balance, 0);
  const studentPendingCount = studentFees.filter(f => f.paymentStatus !== 'Paid').length;

  // Category 2 Calculations directly from real data
  const vendorTotalBilled = vendorInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const vendorTotalPaid = vendorInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const vendorTotalPayable = vendorInvoices.reduce((sum, i) => sum + i.balance, 0);
  const vendorPendingCount = vendorInvoices.filter(i => i.paymentStatus !== 'Paid').length;

  return (
    <div className="space-y-6">
      {/* Accountant Workspace Header & Quick Actions */}
      <div className="flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50/40 p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#D81A28] px-2.5 py-0.5 text-xs font-bold text-white">
              Senior Accountant Desk
            </span>
            <span className="text-xs text-slate-500 font-medium">
              The Smart School • Primary Financial Data Authority
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Financial Ledger &amp; Transactions Entry Station
          </h2>
          <p className="text-xs text-slate-600">
            Submit, reconcile, and disburse student fees and supplier payables with full audit compliance.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddStudent}
            className="flex items-center gap-1.5 rounded-lg bg-[#D81A28] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#B91220] transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Student Fee</span>
          </button>

          <button
            onClick={onOpenAddVendor}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
          >
            <Truck className="h-4 w-4" />
            <span>+ Vendor Bill</span>
          </button>

          <button
            onClick={() => onNavigateTab('import')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <UploadCloud className="h-4 w-4 text-emerald-600" />
            <span>Bulk CSV Import</span>
          </button>
        </div>
      </div>

      {/* TWO PRIMARY MODULE CATEGORIES (PROMINENTLY SEPARATED) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ================= CATEGORY 1: STUDENT FINANCIAL DATA ================= */}
        <div className="rounded-xl border border-red-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-red-100">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-red-50 p-2 text-red-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                    Category 1
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Student Financial Data
                  </h3>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('students')}
                className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
              >
                <span>View Full Table</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Metrics cards */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500">Total Billed</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {formatCurrency(studentTotalBilled, settings.currencyCode)}
                </p>
              </div>

              <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-100">
                <span className="text-[11px] font-medium text-emerald-700">Collected</span>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">
                  {formatCurrency(studentTotalCollected, settings.currencyCode)}
                </p>
              </div>

              <div className="rounded-lg bg-red-50 p-3 border border-red-100">
                <span className="text-[11px] font-medium text-red-700">Remaining</span>
                <p className="text-sm font-bold text-red-700 mt-0.5">
                  {formatCurrency(studentTotalOutstanding, settings.currencyCode)}
                </p>
              </div>
            </div>

            {/* Recent student fee items or Empty State */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Recent Student Records ({studentFees.length} total)
              </h4>

              {studentFees.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-slate-400">
                  <Inbox className="h-7 w-7 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No student financial records yet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click "+ Student Fee" to enter the first fee challan or import multiple records via CSV.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {studentFees.slice(0, 4).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 hover:bg-slate-50 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{f.studentName}</p>
                        <p className="text-[11px] text-slate-500">
                          {f.invoiceNumber} • {f.gradeClass} • {f.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          {formatCurrency(f.totalAmount, settings.currencyCode)}
                        </p>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            f.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : f.paymentStatus === 'Partially Paid'
                              ? 'bg-blue-100 text-blue-800'
                              : f.paymentStatus === 'Overdue'
                              ? 'bg-red-100 text-red-800 font-bold'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {f.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{studentPendingCount} students with dues pending</span>
            <button
              onClick={onOpenAddStudent}
              className="text-xs font-semibold text-red-700 hover:underline"
            >
              + Add Student Entry
            </button>
          </div>
        </div>

        {/* ================= CATEGORY 2: VENDOR FINANCIAL DATA ================= */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Category 2
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Vendor Financial Data
                  </h3>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('vendors')}
                className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:underline"
              >
                <span>View Full Table</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Metrics cards */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500">Total Billed</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {formatCurrency(vendorTotalBilled, settings.currencyCode)}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
                <span className="text-[11px] font-medium text-blue-700">Paid by School</span>
                <p className="text-sm font-bold text-blue-700 mt-0.5">
                  {formatCurrency(vendorTotalPaid, settings.currencyCode)}
                </p>
              </div>

              <div className="rounded-lg bg-red-50 p-3 border border-red-100">
                <span className="text-[11px] font-medium text-red-700">Payable Due</span>
                <p className="text-sm font-bold text-red-700 mt-0.5">
                  {formatCurrency(vendorTotalPayable, settings.currencyCode)}
                </p>
              </div>
            </div>

            {/* Recent vendor bills or Empty State */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Recent Supplier Invoices ({vendorInvoices.length} total)
              </h4>

              {vendorInvoices.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-slate-400">
                  <Inbox className="h-7 w-7 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No vendor bills found</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click "+ Vendor Bill" to log incoming supplier liabilities and contract expenses.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vendorInvoices.slice(0, 4).map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 hover:bg-slate-50 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{i.vendorName}</p>
                        <p className="text-[11px] text-slate-500">
                          {i.invoiceNumber} • {i.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          {formatCurrency(i.totalAmount, settings.currencyCode)}
                        </p>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            i.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : i.paymentStatus === 'Partially Paid'
                              ? 'bg-blue-100 text-blue-800'
                              : i.paymentStatus === 'Overdue'
                              ? 'bg-red-100 text-red-800 font-bold'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {i.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{vendorPendingCount} supplier bills with balance due</span>
            <button
              onClick={onOpenAddVendor}
              className="text-xs font-semibold text-red-700 hover:underline"
            >
              + Add Vendor Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

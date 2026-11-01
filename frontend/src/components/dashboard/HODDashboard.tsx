import React from 'react';
import {
  GraduationCap, Truck, Clock, AlertTriangle,
  CheckCircle2, FileEdit, ArrowUpRight, ShieldCheck, Flag, Inbox
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { formatCurrency, formatDisplayDate } from '../../utils/financeRules';

interface HODDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenRevisionModal: (record: any, type: 'student' | 'vendor') => void;
}

export const HODDashboard: React.FC<HODDashboardProps> = ({
  onNavigateTab,
  onOpenRevisionModal,
}) => {
  const { studentFees, vendorInvoices, settings } = useSchool();

  const totalStudentDues = studentFees.reduce((sum, f) => sum + f.balance, 0);
  const totalVendorPayables = vendorInvoices.reduce((sum, i) => sum + i.balance, 0);
  const overdueStudentCount = studentFees.filter(f => f.paymentStatus === 'Overdue').length;
  const overdueVendorCount = vendorInvoices.filter(i => i.paymentStatus === 'Overdue').length;

  const flaggedFees = studentFees.filter(f => f.isFlaggedForReview);
  const flaggedInvoices = vendorInvoices.filter(i => i.isFlaggedForReview);

  return (
    <div className="space-y-6">
      {/* HOD Banner */}
      <div className="flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50/40 p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#D81A28] px-2.5 py-0.5 text-xs font-bold text-white">
              HOD Oversight Desk
            </span>
            <span className="text-xs text-slate-500 font-medium">
              The Smart School • Departmental Audit &amp; Revisions
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Departmental Balances &amp; Authorized Revision Desk
          </h2>
          <p className="text-xs text-slate-600">
            Audit student fee dues, inspect vendor billing, and submit authorized revisions with preserved audit history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('students')}
            className="flex items-center gap-1.5 rounded-lg bg-[#D81A28] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#B91220] transition"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Review Student Fees</span>
          </button>
        </div>
      </div>

      {/* Oversight Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Student Dues
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalStudentDues, settings.currencyCode)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {overdueStudentCount} bills past scheduled due date
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Vendor Payables Due
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalVendorPayables, settings.currencyCode)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {overdueVendorCount} supplier invoices overdue
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Flagged for Review
          </span>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {flaggedFees.length + flaggedInvoices.length} Items
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Require HOD / Accountant verification
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Revision Protocol
          </span>
          <div className="text-xs font-semibold text-emerald-700 mt-2 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            <span>Audit-Preserved Revisions</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            All HOD changes preserve original Accountant baseline.
          </p>
        </div>
      </div>

      {/* Review Queue: Flagged Records */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-red-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Discrepancies &amp; Flagged Records Pending Action
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            HOD authorized to submit corrections with mandatory reason
          </span>
        </div>

        {flaggedFees.length === 0 && flaggedInvoices.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No Pending Flagged Items</p>
            <p className="text-[11px] text-slate-400">All student and vendor records are validated.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flaggedFees.map((fee) => (
              <div
                key={fee.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{fee.studentName}</span>
                    <span className="text-slate-500">({fee.invoiceNumber})</span>
                    <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800">
                      {fee.gradeClass}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-600">
                    <strong>Flagged Note:</strong> {fee.flagReason}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Flagged by {fee.flaggedBy} • Total: {formatCurrency(fee.totalAmount, settings.currencyCode)} (Balance: {formatCurrency(fee.balance, settings.currencyCode)})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenRevisionModal(fee, 'student')}
                    className="flex items-center gap-1.5 rounded-lg bg-[#D81A28] px-3 py-1.5 font-semibold text-white hover:bg-[#B91220] transition"
                  >
                    <FileEdit className="h-3.5 w-3.5" />
                    <span>Authorized Revision</span>
                  </button>
                </div>
              </div>
            ))}

            {flaggedInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{inv.vendorName}</span>
                    <span className="text-slate-500">({inv.invoiceNumber})</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-800">
                      {inv.category}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-600">
                    <strong>Flagged Note:</strong> {inv.flagReason}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Flagged by {inv.flaggedBy} • Total: {formatCurrency(inv.totalAmount, settings.currencyCode)} (Payable: {formatCurrency(inv.balance, settings.currencyCode)})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenRevisionModal(inv, 'vendor')}
                    className="flex items-center gap-1.5 rounded-lg bg-[#D81A28] px-3 py-1.5 font-semibold text-white hover:bg-[#B91220] transition"
                  >
                    <FileEdit className="h-3.5 w-3.5" />
                    <span>Authorized Revision</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

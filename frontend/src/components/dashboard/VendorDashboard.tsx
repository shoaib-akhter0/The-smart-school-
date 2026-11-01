import React from 'react';
import {
  Truck, CheckCircle2, Clock, AlertTriangle,
  Receipt, Download, FileText, Building2
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { formatCurrency, formatDisplayDate } from '../../utils/financeRules';

interface VendorDashboardProps {
  onOpenInvoiceDetails: (invoice: any) => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({ onOpenInvoiceDetails }) => {
  const { vendorInvoices, payments, settings } = useSchool();

  // Real supplier invoices from database
  const totalBilled = vendorInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = vendorInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalBalance = vendorInvoices.reduce((sum, i) => sum + i.balance, 0);

  return (
    <div className="space-y-6">
      {/* Vendor Header */}
      <div className="rounded-xl border border-red-200 bg-red-50/40 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#D81A28] px-2.5 py-0.5 text-xs font-bold text-white">
                Authorized Supplier Portal
              </span>
              <span className="text-xs text-slate-500 font-medium">
                The Smart School • Vendor Accounts
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
              Supplier Accounts &amp; Settlements Station
            </h2>
            <p className="text-xs text-slate-600">
              Official school disbursement status, verified payments, and payable statements.
            </p>
          </div>

          <div className="rounded-lg bg-white border border-red-200 p-3 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Current Outstanding Balance
            </span>
            <p className="text-xl font-bold text-[#D81A28]">
              {formatCurrency(totalBalance, settings.currencyCode)}
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Billed to School
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalBilled, settings.currencyCode)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Cumulative invoices submitted</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Disbursements Received
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalPaid, settings.currencyCode)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Cleared school payments</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Payable Balance
          </span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {formatCurrency(totalBalance, settings.currencyCode)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Awaiting school clearance</p>
        </div>
      </div>

      {/* Vendor Invoices Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            My Submitted Invoices &amp; Payment History
          </h3>
          <span className="text-xs text-slate-500">{vendorInvoices.length} invoices on file</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Bill Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {vendorInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Truck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No vendor bills found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      No invoices have been billed or assigned to this supplier account yet.
                    </p>
                  </td>
                </tr>
              ) : (
                vendorInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate" title={inv.description}>
                      {inv.description}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {inv.month} {inv.year}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDisplayDate(inv.issueDate)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDisplayDate(inv.dueDate)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(inv.totalAmount, settings.currencyCode)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      {formatCurrency(inv.paidAmount, settings.currencyCode)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-700">
                      {formatCurrency(inv.balance, settings.currencyCode)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          inv.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.paymentStatus === 'Partially Paid'
                            ? 'bg-blue-100 text-blue-800'
                            : inv.paymentStatus === 'Overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onOpenInvoiceDetails(inv)}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#D81A28] hover:bg-red-50 shadow-xs"
                      >
                        Details &amp; Receipts
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Truck, Search, Filter, Plus, FileDown,
  Eye, Receipt, Edit3, Flag, Building2,
  AlertCircle, ChevronLeft, ChevronRight, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { VendorInvoice, PaymentStatus } from '../../types';
import { formatCurrency, formatDisplayDate } from '../../utils/financeRules';

interface VendorRecordsModuleProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (invoice: VendorInvoice) => void;
  onOpenInvoiceModal: (invoice: VendorInvoice) => void;
  onOpenPaymentModal: (invoice: VendorInvoice) => void;
  onOpenRevisionModal: (invoice: VendorInvoice) => void;
  onOpenFlagModal: (invoice: VendorInvoice) => void;
}

export const VendorRecordsModule: React.FC<VendorRecordsModuleProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onOpenInvoiceModal,
  onOpenPaymentModal,
  onOpenRevisionModal,
  onOpenFlagModal,
}) => {
  const { currentUser, isGM, isAccountant, isHOD } = useAuth();
  const { vendorInvoices, settings } = useSchool();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filtered & sorted records
  const filteredRecords = useMemo(() => {
    return vendorInvoices
      .filter((inv) => {
        // If vendor user, only their own records are returned (enforced by backend, extra check)
        if (selectedMonth !== 'all' && inv.month.toLowerCase() !== selectedMonth.toLowerCase()) return false;
        if (selectedYear !== 'all' && inv.year !== Number(selectedYear)) return false;
        if (selectedStatus !== 'all' && inv.paymentStatus !== selectedStatus) return false;
        if (selectedCategory !== 'all' && inv.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            inv.vendorName.toLowerCase().includes(q) ||
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.description.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [vendorInvoices, searchQuery, selectedMonth, selectedYear, selectedStatus, selectedCategory]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalBilled = filteredRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalPaid = filteredRecords.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalPayable = filteredRecords.reduce((sum, r) => sum + r.balance, 0);

  const handleExportCSV = () => {
    const headers = ['Vendor ID', 'Supplier Name', 'Invoice Number', 'Category', 'Description', 'Total Bill', 'Amount Paid', 'Remaining Payable', 'Status', 'Issue Date', 'Due Date', 'Month', 'Year', 'Notes'];
    const rows = filteredRecords.map((r) => [
      r.vendorId,
      `"${r.vendorName}"`,
      r.invoiceNumber,
      `"${r.category}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      r.totalAmount,
      r.paidAmount,
      r.balance,
      r.paymentStatus,
      r.issueDate,
      r.dueDate,
      r.month,
      r.year,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vendor_Payables_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGMEditAttempt = () => {
    alert('CRITICAL SECURITY RULE: The GM cannot edit or overwrite original financial records uploaded by the Accountant. You can flag this record for review or request a correction.');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
              Category Two
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Stationery, Power, Janitorial, IT &amp; Facility Liabilities
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Vendor Bills &amp; Payables Management
          </h2>
          <p className="text-xs text-slate-500">
            Multi-payment tracking against single vendor bills with verified disbursements in {settings.currencyCode}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAccountant && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Vendor Bill</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <FileDown className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Incurred Bills
          </span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalBilled, settings.currencyCode)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Disbursed by School
          </span>
          <p className="text-xl font-bold text-blue-600 mt-1">
            {formatCurrency(totalPaid, settings.currencyCode)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Remaining Payable Balance
          </span>
          <p className="text-xl font-bold text-rose-600 mt-1">
            {formatCurrency(totalPayable, settings.currencyCode)}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor, invoice, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              aria-label="Filter by month"
            >
              <option value="all">All Months</option>
              <option value="August">August</option>
              <option value="September">September</option>
              <option value="October">October</option>
              <option value="November">November</option>
              <option value="December">December</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              aria-label="Filter by payment status"
            >
              <option value="all">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue (Warning)</option>
            </select>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              aria-label="Filter by vendor category"
            >
              <option value="all">All Vendor Categories</option>
              {settings.vendorCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice # &amp; Vendor</th>
                <th className="py-3 px-4">Category &amp; Goods</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Issue / Due Date</th>
                <th className="py-3 px-4 text-right">Total Bill</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Payable</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Truck className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No vendor bills found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {searchQuery || selectedMonth !== 'all' || selectedYear !== 'all' || selectedStatus !== 'all' || selectedCategory !== 'all'
                        ? 'No vendor bills match your active filter selections. Try clearing your filters or search query.'
                        : 'No vendor liabilities or purchase bills have been entered into the system yet.'}
                    </p>
                    {isAccountant && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <button
                          onClick={onOpenAddModal}
                          className="rounded-lg bg-[#D81A28] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#B91220] transition"
                        >
                          + Add Vendor Bill
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50/80 transition ${
                      inv.isFlaggedForReview ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{inv.vendorName}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {inv.invoiceNumber} • {inv.vendorId}
                      </div>
                      {inv.isFlaggedForReview && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 mt-0.5">
                          <Flag className="h-3 w-3" /> Flagged for Review
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-medium text-slate-800">{inv.category}</span>
                      <p className="text-[11px] text-slate-500 truncate" title={inv.description}>
                        {inv.description}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {inv.month} {inv.year}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div>Issue: {formatDisplayDate(inv.issueDate)}</div>
                      <div className={inv.paymentStatus === 'Overdue' ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                        Due: {formatDisplayDate(inv.dueDate)}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(inv.totalAmount, settings.currencyCode)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-blue-600">
                      {formatCurrency(inv.paidAmount, settings.currencyCode)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-rose-600">
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
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenInvoiceModal(inv)}
                          title="View Bill Details &amp; Multi-Payment History"
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {(isAccountant || isHOD) && inv.balance > 0 && (
                          <button
                            onClick={() => onOpenPaymentModal(inv)}
                            title="Disburse / Record Partial Payment"
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                          >
                            <Receipt className="h-4 w-4" />
                          </button>
                        )}

                        {isAccountant && (
                          <button
                            onClick={() => onOpenEditModal(inv)}
                            title="Edit Bill Details"
                            className="rounded p-1 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}

                        {isGM && (
                          <button
                            onClick={handleGMEditAttempt}
                            title="GM Restricted: Cannot edit original Accountant record"
                            className="rounded p-1 text-slate-300 hover:text-rose-500"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}

                        {isHOD && (
                          <button
                            onClick={() => onOpenRevisionModal(inv)}
                            title="Submit Authorized Revision"
                            className="rounded p-1 text-indigo-600 hover:bg-indigo-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}

                        {(isGM || isHOD) && (
                          <button
                            onClick={() => onOpenFlagModal(inv)}
                            title={inv.isFlaggedForReview ? 'Clear Flag' : 'Flag for Review'}
                            className={`rounded p-1 ${inv.isFlaggedForReview ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-amber-600'}`}
                          >
                            <Flag className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          <div>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded border border-slate-200 px-2 py-1 font-medium disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded border border-slate-200 px-2 py-1 font-medium disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

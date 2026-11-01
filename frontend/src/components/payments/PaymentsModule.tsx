import React, { useState } from 'react';
import { Receipt, Search, Filter, FileDown, Calendar, CheckCircle2 } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDisplayDate } from '../../utils/financeRules';

export const PaymentsModule: React.FC = () => {
  const { payments, settings } = useSchool();
  const { isVendor, currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');

  const filteredPayments = payments.filter((p) => {
    if (selectedType !== 'all' && p.recordType !== selectedType) return false;
    if (selectedMethod !== 'all' && p.paymentMethod !== selectedMethod) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.paymentNumber.toLowerCase().includes(q) ||
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.referenceNumber.toLowerCase().includes(q) ||
        (p.receiptNotes && p.receiptNotes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleExportCSV = () => {
    const headers = ['Payment #', 'Type', 'Invoice #', 'Amount', 'Date', 'Method', 'Reference #', 'Recorded By', 'Notes'];
    const rows = filteredPayments.map((p) => [
      p.paymentNumber,
      p.recordType,
      p.invoiceNumber,
      p.amount,
      p.paymentDate,
      p.paymentMethod,
      `"${p.referenceNumber}"`,
      `"${p.recordedBy}"`,
      `"${(p.receiptNotes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Payments_Settlement_Ledger.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-red-100 px-2.5 py-0.5 text-xs font-bold text-[#D81A28]">
              Payment Transactions
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Receipts &amp; Disbursals
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Payment History &amp; Settlement Vouchers
          </h2>
          <p className="text-xs text-slate-500">
            Chronological ledger of cash receipts, bank transfers, cheques, and online settlements.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <FileDown className="h-4 w-4 text-slate-500" />
          <span>Export Payments CSV</span>
        </button>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Payments Count
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {filteredPayments.length} Transactions
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Cumulative Amount Settled
          </span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalAmount, settings.currencyCode)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by payment #, invoice, reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {!isVendor && (
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">All Record Types</option>
                <option value="student">Student Fee Collections</option>
                <option value="vendor">Vendor Payables Disbursals</option>
              </select>
            </div>
          )}

          <div>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All Payment Modes</option>
              <option value="BANK_TRANSFER">Bank Transfer / IBFT</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque / Pay Order</option>
              <option value="ONLINE">Online Portal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Payment Receipt #</th>
                <th className="py-3 px-4">Type &amp; Invoice</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method &amp; Ref #</th>
                <th className="py-3 px-4 text-right">Settled Amount</th>
                <th className="py-3 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Receipt className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No payment transactions recorded yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Use the &ldquo;Record Payment&rdquo; option in Student Fees or Vendor Payables to record verified collections and supplier disbursals.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.paymentNumber}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        p.recordType === 'student' ? 'bg-red-100 text-[#D81A28]' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {p.recordType === 'student' ? 'Student Fee' : 'Vendor Bill'}
                      </span>
                      <span className="font-mono text-slate-600 ml-1.5">{p.invoiceNumber}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {formatDisplayDate(p.paymentDate)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.paymentMethod.replace('_', ' ')}</div>
                      <div className="font-mono text-[11px] text-slate-500">{p.referenceNumber}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {formatCurrency(p.amount, settings.currencyCode)}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {p.recordedBy}
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

import React from 'react';
import { X, Printer, Truck, Receipt, PlusCircle, CheckCircle2 } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { useAuth } from '../../context/AuthContext';
import { VendorInvoice } from '../../types';
import { formatCurrency, formatDisplayDate } from '../../utils/financeRules';
import { SmartSchoolLogo } from '../common/SmartSchoolLogo';

interface VendorInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: VendorInvoice | null;
  onOpenRecordPayment: (invoice: VendorInvoice) => void;
}

export const VendorInvoiceModal: React.FC<VendorInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onOpenRecordPayment,
}) => {
  const { settings, payments } = useSchool();
  const { isAccountant, isHOD } = useAuth();

  if (!isOpen || !invoice) return null;

  const invoicePayments = payments.filter((p) => p.recordId === invoice.id);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs print:p-0 print:bg-white">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Actions bar (hidden in print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <span className="rounded bg-red-100 px-2.5 py-0.5 text-xs font-bold text-[#D81A28]">
              Vendor Payable Voucher &amp; Disbursement History
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(isAccountant || isHOD) && invoice.balance > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRecordPayment(invoice);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-[#D81A28] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#B91220] transition"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Record Disbursal</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Voucher</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Voucher Content */}
        <div className="mt-4 print:mt-0 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
            <div className="flex items-start gap-3">
              <SmartSchoolLogo height={52} variant="full" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  {settings.schoolName}
                </h2>
                <p className="text-xs text-slate-500">Accounts Payable Department</p>
                <p className="text-xs text-slate-500">NTN: {settings.taxRegistrationNumber}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block rounded-md bg-[#D81A28] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                PAYABLE VOUCHER
              </span>
              <p className="mt-1 font-mono text-sm font-bold text-[#D81A28]">
                {invoice.invoiceNumber}
              </p>
              <p className="text-xs text-slate-500">
                Period: <strong>{invoice.month} {invoice.year}</strong>
              </p>
            </div>
          </div>

          {/* Vendor Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Vendor / Supplier Information
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{invoice.vendorName}</p>
              <p className="text-slate-600">Vendor ID: <strong className="font-mono">{invoice.vendorId}</strong></p>
              <p className="text-slate-600">Category: <strong>{invoice.category}</strong></p>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Payment Dates
              </span>
              <p className="mt-0.5 text-slate-700">
                Bill Issue Date: <strong>{formatDisplayDate(invoice.issueDate)}</strong>
              </p>
              <p className={invoice.paymentStatus === 'Overdue' ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                Due Date: <strong>{formatDisplayDate(invoice.dueDate)}</strong>
              </p>
              <p className="text-slate-700">
                Status:{' '}
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    invoice.paymentStatus === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : invoice.paymentStatus === 'Partially Paid'
                      ? 'bg-blue-100 text-blue-800'
                      : invoice.paymentStatus === 'Overdue'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {invoice.paymentStatus}
                </span>
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-lg border border-slate-200 p-3 bg-white text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">Goods / Services Description</span>
            <p className="font-medium text-slate-900 mt-1">{invoice.description}</p>
          </div>

          {/* Multiple Payments History */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
              Disbursement Transactions History ({invoicePayments.length} payments recorded)
            </h4>
            {invoicePayments.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded border border-slate-100">
                No disbursements have been recorded for this supplier invoice yet.
              </p>
            ) : (
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">Disbursement #</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Payment Method</th>
                    <th className="py-2 px-3">Cheque / Ref #</th>
                    <th className="py-2 px-3 text-right">Amount Disbursed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoicePayments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                      <td className="py-2 px-3 text-slate-600">{formatDisplayDate(p.paymentDate)}</td>
                      <td className="py-2 px-3 text-slate-700">{p.paymentMethod.replace('_', ' ')}</td>
                      <td className="py-2 px-3 text-slate-600 font-mono">{p.referenceNumber}</td>
                      <td className="py-2 px-3 text-right font-bold text-blue-700">
                        {formatCurrency(p.amount, settings.currencyCode)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Balance summary */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Bill Amount:</span>
                <span className="font-bold text-slate-900">{formatCurrency(invoice.totalAmount, settings.currencyCode)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Total Amount Disbursed:</span>
                <span className="font-bold">{formatCurrency(invoice.paidAmount, settings.currencyCode)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                <span>Remaining Payable:</span>
                <span className="text-amber-700">{formatCurrency(invoice.balance, settings.currencyCode)}</span>
              </div>
            </div>
          </div>

          {/* Footer Signatures & Official Seal */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-500 border-t border-slate-200">
            <div>
              <div className="h-10 border-b border-dashed border-slate-300 w-44 mx-auto mb-1"></div>
              <p className="font-semibold text-slate-700">Finance &amp; Disbursements Officer</p>
              <p className="text-[10px] text-slate-400">Created by {invoice.createdBy}</p>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-300 w-44 mx-auto mb-1"></div>
              <p className="font-semibold text-slate-700">Authorised School Seal</p>
              <p className="text-[10px] text-slate-400">The Smart School Financial Ledger</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Printer, Download, School, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { StudentFeeRecord } from '../../types';
import { formatCurrency, formatDisplayDate } from '../../utils/financeRules';
import { SmartSchoolLogo } from '../common/SmartSchoolLogo';

interface StudentInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: StudentFeeRecord | null;
}

export const StudentInvoiceModal: React.FC<StudentInvoiceModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const { settings, payments } = useSchool();

  if (!isOpen || !record) return null;

  // Filter payments belonging to this student record
  const recordPayments = payments.filter((p) => p.recordId === record.id);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs print:p-0 print:bg-white">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Top Actions (hidden during print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <span className="rounded bg-red-100 px-2.5 py-0.5 text-xs font-bold text-[#D81A28]">
              Official Student Fee Challan
            </span>
            <span className="text-xs text-slate-500">
              Tax Registration: {settings.taxRegistrationNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Statement</span>
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

        {/* Printable Challan / Invoice Content */}
        <div className="mt-4 print:mt-0 space-y-6">
          {/* School Header with Official Uploaded Logo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
            <div className="flex items-start gap-3">
              <SmartSchoolLogo height={52} variant="full" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  {settings.schoolName}
                </h2>
                <p className="text-xs text-slate-500">{settings.address}</p>
                <p className="text-xs text-slate-500">
                  Phone: {settings.contactPhone} • Email: {settings.contactEmail}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block rounded-md bg-[#D81A28] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                FEE CHALLAN / INVOICE
              </span>
              <p className="mt-1 font-mono text-sm font-bold text-[#D81A28]">
                {record.invoiceNumber}
              </p>
              <p className="text-xs text-slate-500">
                Period: <strong>{record.month} {record.year}</strong>
              </p>
            </div>
          </div>

          {/* Student & Bill Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Student Details
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{record.studentName}</p>
              <p className="text-slate-600">Student ID: <strong className="font-mono">{record.studentId}</strong></p>
              <p className="text-slate-600">Class / Section: <strong>{record.gradeClass}</strong></p>
              <p className="text-slate-600">Academic Session: <strong>{settings.academicSession}</strong></p>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Bill Schedule
              </span>
              <p className="mt-0.5 text-slate-700">
                Issue Date: <strong>{formatDisplayDate(record.billIssueDate)}</strong>
              </p>
              <p className={record.paymentStatus === 'Overdue' ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                Due Date: <strong>{formatDisplayDate(record.dueDate)}</strong>
              </p>
              <p className="text-slate-700">
                Status:{' '}
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    record.paymentStatus === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : record.paymentStatus === 'Partially Paid'
                      ? 'bg-blue-100 text-blue-800'
                      : record.paymentStatus === 'Overdue'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {record.paymentStatus}
                </span>
              </p>
            </div>
          </div>

          {/* Fee Itemization Table */}
          <div>
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 border-b border-slate-200">Fee Particulars</th>
                  <th className="py-2.5 px-3 border-b border-slate-200">Billing Period</th>
                  <th className="py-2.5 px-3 border-b border-slate-200 text-right">Amount ({settings.currencyCode})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{record.category}</p>
                    <p className="text-[11px] text-slate-500">Official academic assessment for {record.month} {record.year}</p>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {record.month} {record.year}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {formatCurrency(record.totalAmount, settings.currencyCode)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Receipts History */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
              Payment Settlement History ({recordPayments.length} recorded)
            </h4>
            {recordPayments.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded border border-slate-100">
                No payment transactions have been credited towards this challan yet.
              </p>
            ) : (
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">Receipt / Payment #</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Ref / Txn ID</th>
                    <th className="py-2 px-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recordPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                      <td className="py-2 px-3 text-slate-600">{formatDisplayDate(p.paymentDate)}</td>
                      <td className="py-2 px-3 text-slate-700">{p.paymentMethod.replace('_', ' ')}</td>
                      <td className="py-2 px-3 text-slate-600 font-mono">{p.referenceNumber}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">
                        {formatCurrency(p.amount, settings.currencyCode)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Financial Summary Box */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Amount Payable:</span>
                <span className="font-bold text-slate-900">{formatCurrency(record.totalAmount, settings.currencyCode)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Total Amount Paid:</span>
                <span className="font-bold">{formatCurrency(record.paidAmount, settings.currencyCode)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                <span>Remaining Balance:</span>
                <span className="text-amber-700">{formatCurrency(record.balance, settings.currencyCode)}</span>
              </div>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-500 border-t border-slate-200">
            <div>
              <div className="h-10 border-b border-dashed border-slate-300 w-44 mx-auto mb-1"></div>
              <p className="font-semibold text-slate-700">Accounts &amp; Finance Officer</p>
              <p className="text-[10px] text-slate-400">Created by {record.createdBy}</p>
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

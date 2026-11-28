import React, { useState } from 'react';
import {
  BarChart3, FileDown, Printer, Calendar, Filter,
  GraduationCap, Truck, Receipt, CheckCircle2, Clock, AlertTriangle
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { formatCurrency, formatDisplayDate } from '../../utils/financeRules';
import { ClassWiseReport, summarizeByClass } from './ClassWiseReport';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const ReportsModule: React.FC = () => {
  const { studentFees, vendorInvoices, payments, settings } = useSchool();

  const [reportType, setReportType] = useState<
    | 'class_wise_fees'
    | 'outstanding_dues'
    | 'vendor_payables'
    | 'payment_history'
    | 'overdue_audit'
  >('class_wise_fees');

  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  // Years that actually appear in the data, newest first.
  const yearOptions = Array.from(
    new Set([...studentFees.map((f) => f.year), ...vendorInvoices.map((i) => i.year)])
  ).sort((a, b) => b - a);

  const filteredStudentFees = studentFees.filter((f) => {
    if (selectedMonth !== 'all' && f.month.toLowerCase() !== selectedMonth.toLowerCase()) return false;
    if (selectedYear !== 'all' && f.year !== Number(selectedYear)) return false;
    return true;
  });

  const filteredVendorInvoices = vendorInvoices.filter((i) => {
    if (selectedMonth !== 'all' && i.month.toLowerCase() !== selectedMonth.toLowerCase()) return false;
    if (selectedYear !== 'all' && i.year !== Number(selectedYear)) return false;
    return true;
  });

  const overdueStudentBills = studentFees.filter((f) => f.paymentStatus === 'Overdue');
  const overdueVendorBills = vendorInvoices.filter((i) => i.paymentStatus === 'Overdue');

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `Report_${reportType}_${selectedMonth}_${selectedYear}.csv`;

    if (reportType === 'class_wise_fees') {
      headers = ['Class', 'Students', 'Fee Records', 'Billed', 'Collected', 'Dues', 'Collection %'];
      rows = summarizeByClass(filteredStudentFees)
        .filter((c) => c.records > 0)
        .map((c) => [`"${c.className}"`, c.students, c.records, c.billed, c.collected, c.dues, c.rate]);
      filename = `Class_Wise_Fee_Report_${selectedMonth}_${selectedYear}.csv`;
    } else if (reportType === 'outstanding_dues') {
      headers = ['Student ID', 'Student Name', 'Class', 'Invoice #', 'Total Fee', 'Remaining Dues', 'Status', 'Due Date'];
      rows = studentFees.filter(f => f.balance > 0).map((f) => [
        f.studentId, `"${f.studentName}"`, `"${f.gradeClass}"`, f.invoiceNumber, f.totalAmount, f.balance, f.paymentStatus, f.dueDate
      ]);
      filename = 'Outstanding_Student_Dues.csv';
    } else if (reportType === 'vendor_payables') {
      headers = ['Vendor ID', 'Supplier Name', 'Invoice #', 'Category', 'Total Bill', 'Disbursed', 'Remaining Payable', 'Status', 'Due Date'];
      rows = filteredVendorInvoices.map((i) => [
        i.vendorId, `"${i.vendorName}"`, i.invoiceNumber, `"${i.category}"`, i.totalAmount, i.paidAmount, i.balance, i.paymentStatus, i.dueDate
      ]);
    } else if (reportType === 'payment_history') {
      headers = ['Payment #', 'Record Type', 'Invoice #', 'Amount', 'Date', 'Method', 'Reference #', 'Recorded By'];
      rows = payments.map((p) => [
        p.paymentNumber, p.recordType, p.invoiceNumber, p.amount, p.paymentDate, p.paymentMethod, `"${p.referenceNumber}"`, `"${p.recordedBy}"`
      ]);
      filename = 'All_Payment_Transactions.csv';
    } else {
      headers = ['Type', 'Identifier', 'Party', 'Invoice #', 'Total', 'Outstanding Balance', 'Due Date', 'Status'];
      rows = [
        ...overdueStudentBills.map(f => ['Student Fee', f.studentId, `"${f.studentName}"`, f.invoiceNumber, f.totalAmount, f.balance, f.dueDate, f.paymentStatus]),
        ...overdueVendorBills.map(i => ['Vendor Bill', i.vendorId, `"${i.vendorName}"`, i.invoiceNumber, i.totalAmount, i.balance, i.dueDate, i.paymentStatus]),
      ];
      filename = 'Overdue_Bills_Audit.csv';
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-red-100 px-2.5 py-0.5 text-xs font-bold text-[#D81A28]">
              Reporting &amp; Statements Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Multi-format CSV / PDF Output
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Financial Reports, Reconciliation &amp; Statements
          </h2>
          <p className="text-xs text-slate-500">
            Generate monthly fee collection summaries, outstanding student dues, and vendor payable vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg bg-[#D81A28] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#B91220] transition"
          >
            <FileDown className="h-4 w-4" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs and Period Selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'class_wise_fees', label: 'Class-wise Fee Report', icon: GraduationCap },
            { id: 'outstanding_dues', label: 'Outstanding Student Dues', icon: Clock },
            { id: 'vendor_payables', label: 'Vendor Payables Statement', icon: Truck },
            { id: 'payment_history', label: 'Complete Payments Ledger', icon: Receipt },
            { id: 'overdue_audit', label: 'Overdue Warning Audit', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = reportType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id as any)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-[#D81A28] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Month & Year Selectors for applicable reports */}
        {(reportType === 'class_wise_fees' || reportType === 'vendor_payables') && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-600">Select Billing Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-800 font-medium focus:outline-none"
            >
              <option value="all">All Months</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-800 font-medium focus:outline-none"
            >
              <option value="all">All Years</option>
              {yearOptions.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Report content */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs print:border-none print:shadow-none space-y-6">
        {/* Report Content Table */}
        {reportType === 'class_wise_fees' && (
          <ClassWiseReport records={filteredStudentFees} currency={settings.currencyCode} />
        )}

        {reportType === 'outstanding_dues' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-amber-50 text-amber-900 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Total Fee</th>
                  <th className="py-2.5 px-3 text-right">Outstanding Due</th>
                  <th className="py-2.5 px-3 text-center">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentFees.filter(f => f.balance > 0).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No outstanding student dues. All student accounts are completely settled.
                    </td>
                  </tr>
                ) : (
                  studentFees.filter(f => f.balance > 0).map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{f.studentName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{f.studentId}</td>
                      <td className="py-2.5 px-3">{f.gradeClass}</td>
                      <td className="py-2.5 px-3 font-mono">{f.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">{formatDisplayDate(f.dueDate)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatCurrency(f.totalAmount, settings.currencyCode)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-700">{formatCurrency(f.balance, settings.currencyCode)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${f.paymentStatus === 'Overdue' ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-amber-100 text-amber-800'}`}>
                          {f.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'vendor_payables' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Supplier Name</th>
                  <th className="py-2.5 px-3">Vendor ID</th>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Total Bill</th>
                  <th className="py-2.5 px-3 text-right">Disbursed</th>
                  <th className="py-2.5 px-3 text-right">Payable Balance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendorInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No vendor payables found for the selected billing period.
                    </td>
                  </tr>
                ) : (
                  filteredVendorInvoices.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{i.vendorName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{i.vendorId}</td>
                      <td className="py-2.5 px-3 font-mono">{i.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">{i.category}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{formatCurrency(i.totalAmount, settings.currencyCode)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-blue-700">{formatCurrency(i.paidAmount, settings.currencyCode)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-700">{formatCurrency(i.balance, settings.currencyCode)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-800">
                          {i.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'payment_history' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Payment #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Reference / Txn #</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No payment transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">{formatDisplayDate(p.paymentDate)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${p.recordType === 'student' ? 'bg-red-100 text-[#D81A28]' : 'bg-slate-100 text-slate-800'}`}>
                          {p.recordType.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{p.invoiceNumber}</td>
                      <td className="py-2.5 px-3">{p.paymentMethod.replace('_', ' ')}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{p.referenceNumber}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatCurrency(p.amount, settings.currencyCode)}</td>
                      <td className="py-2.5 px-3 text-slate-500">{p.recordedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'overdue_audit' && (
          <div className="overflow-x-auto space-y-4">
            <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Overdue Student Bills ({overdueStudentBills.length})
            </h4>
            <table className="w-full text-left text-xs border border-rose-200">
              <thead className="bg-rose-50 text-rose-900 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Student Name</th>
                  <th className="py-2 px-3">Invoice #</th>
                  <th className="py-2 px-3">Class</th>
                  <th className="py-2 px-3">Due Date</th>
                  <th className="py-2 px-3 text-right">Total</th>
                  <th className="py-2 px-3 text-right">Overdue Dues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100">
                {overdueStudentBills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No overdue student bills detected. All active student accounts are current.
                    </td>
                  </tr>
                ) : (
                  overdueStudentBills.map((f) => (
                    <tr key={f.id}>
                      <td className="py-2 px-3 font-bold text-slate-900">{f.studentName}</td>
                      <td className="py-2 px-3 font-mono">{f.invoiceNumber}</td>
                      <td className="py-2 px-3">{f.gradeClass}</td>
                      <td className="py-2 px-3 text-rose-600 font-bold">{formatDisplayDate(f.dueDate)}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(f.totalAmount, settings.currencyCode)}</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700">{formatCurrency(f.balance, settings.currencyCode)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mt-4">
              Overdue Vendor Liabilities ({overdueVendorBills.length})
            </h4>
            <table className="w-full text-left text-xs border border-rose-200">
              <thead className="bg-rose-50 text-rose-900 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Supplier</th>
                  <th className="py-2 px-3">Invoice #</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Due Date</th>
                  <th className="py-2 px-3 text-right">Total Bill</th>
                  <th className="py-2 px-3 text-right">Overdue Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100">
                {overdueVendorBills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No overdue vendor liabilities detected. All vendor accounts are current.
                    </td>
                  </tr>
                ) : (
                  overdueVendorBills.map((i) => (
                    <tr key={i.id}>
                      <td className="py-2 px-3 font-bold text-slate-900">{i.vendorName}</td>
                      <td className="py-2 px-3 font-mono">{i.invoiceNumber}</td>
                      <td className="py-2 px-3">{i.category}</td>
                      <td className="py-2 px-3 text-rose-600 font-bold">{formatDisplayDate(i.dueDate)}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(i.totalAmount, settings.currencyCode)}</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700">{formatCurrency(i.balance, settings.currencyCode)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

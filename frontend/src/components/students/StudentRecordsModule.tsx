import React, { useState, useMemo } from 'react';
import {
  GraduationCap, Search, Filter, Plus, FileDown,
  Eye, Receipt, Edit3, Flag, Trash2, ArrowUpDown, ArrowRight,
  AlertCircle, CheckCircle, ShieldAlert, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { StudentFeeRecord, PaymentStatus } from '../../types';
import { formatCurrency, formatDisplayDate } from '../../utils/financeRules';
import { SCHOOL_CLASSES, normalizeClassName } from '../../utils/schoolClasses';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Three-month periods; `months` are indexes into MONTHS.
const QUARTERS = [
  { id: 'q1', label: 'Jan – Mar', months: [0, 1, 2] },
  { id: 'q2', label: 'Apr – Jun', months: [3, 4, 5] },
  { id: 'q3', label: 'Jul – Sep', months: [6, 7, 8] },
  { id: 'q4', label: 'Oct – Dec', months: [9, 10, 11] },
];

const monthIndex = (month: string) => MONTHS.findIndex((m) => m.toLowerCase() === month.trim().toLowerCase());

// Ranges for a student's total outstanding dues (sum of balances across their records).
const DUES_RANGES = [
  { id: 'upto5k', label: 'Up to 5k', min: 1, max: 5000 },
  { id: '5k-10k', label: '5k – 10k', min: 5001, max: 10000 },
  { id: '10k-15k', label: '10k – 15k', min: 10001, max: 15000 },
  { id: '15k-20k', label: '15k – 20k', min: 15001, max: 20000 },
  { id: 'above20k', label: 'Above 20k', min: 20001, max: Infinity },
];

const duesRangeOf = (amount: number) => DUES_RANGES.find((r) => amount >= r.min && amount <= r.max)?.id ?? null;

interface StudentRecordsModuleProps {
  onOpenAddModal: (gradeClass?: string) => void;
  onOpenEditModal: (record: StudentFeeRecord) => void;
  onOpenInvoiceModal: (record: StudentFeeRecord) => void;
  onOpenPaymentModal: (record: StudentFeeRecord) => void;
  onOpenRevisionModal: (record: StudentFeeRecord) => void;
  onOpenFlagModal: (record: StudentFeeRecord) => void;
}

export const StudentRecordsModule: React.FC<StudentRecordsModuleProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onOpenInvoiceModal,
  onOpenPaymentModal,
  onOpenRevisionModal,
  onOpenFlagModal,
}) => {
  const { currentUser, isGM, isAccountant, isHOD } = useAuth();
  const { studentFees, deleteStudentFee, settings } = useSchool();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState('all');
  const [selectedDuesRange, setSelectedDuesRange] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'balance' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const quarter = QUARTERS.find((q) => q.id === selectedQuarter);
  const monthOptions = quarter ? quarter.months.map((i) => MONTHS[i]) : MONTHS;

  // Records matching every filter except the dues range.
  const baseRecords = useMemo(() => {
    return studentFees
      .filter((r) => {
        if (quarter && !quarter.months.includes(monthIndex(r.month))) return false;
        if (selectedMonth !== 'all' && r.month.toLowerCase() !== selectedMonth.toLowerCase()) return false;
        if (selectedYear !== 'all' && r.year !== Number(selectedYear)) return false;
        if (selectedStatus !== 'all' && r.paymentStatus !== selectedStatus) return false;
        if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
        if (selectedGrade !== null && normalizeClassName(r.gradeClass) !== selectedGrade) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            r.studentName.toLowerCase().includes(q) ||
            r.studentId.toLowerCase().includes(q) ||
            r.invoiceNumber.toLowerCase().includes(q) ||
            (r.notes && r.notes.toLowerCase().includes(q))
          );
        }
        return true;
      });
  }, [studentFees, searchQuery, quarter, selectedMonth, selectedYear, selectedStatus, selectedCategory, selectedGrade]);

  // Each student's total outstanding dues within the current filters (class, quarter, month, ...).
  const duesByStudent = useMemo(() => {
    const totals = new Map<string, number>();
    baseRecords.forEach((r) => totals.set(r.studentId, (totals.get(r.studentId) ?? 0) + r.balance));
    return totals;
  }, [baseRecords]);

  // How many students fall into each dues range, shown on the range buttons.
  const duesRangeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    duesByStudent.forEach((amount) => {
      const range = duesRangeOf(amount);
      if (range) counts[range] = (counts[range] ?? 0) + 1;
    });
    return counts;
  }, [duesByStudent]);

  // Filtered & sorted records
  const filteredRecords = useMemo(() => {
    return baseRecords
      .filter((r) => selectedDuesRange === 'all' || duesRangeOf(duesByStudent.get(r.studentId) ?? 0) === selectedDuesRange)
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'name') cmp = a.studentName.localeCompare(b.studentName);
        else if (sortBy === 'amount') cmp = a.totalAmount - b.totalAmount;
        else if (sortBy === 'balance') cmp = a.balance - b.balance;
        else if (sortBy === 'date') cmp = new Date(a.billIssueDate).getTime() - new Date(b.billIssueDate).getTime();
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [baseRecords, duesByStudent, selectedDuesRange, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Summary figures for filtered slice
  const totalBilled = filteredRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalCollected = filteredRecords.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalBalance = filteredRecords.reduce((sum, r) => sum + r.balance, 0);

  const handleExportCSV = () => {
    const headers = ['Student ID', 'Full Name', 'Class/Grade', 'Invoice Number', 'Category', 'Total Amount', 'Paid Amount', 'Remaining Balance', 'Status', 'Issue Date', 'Due Date', 'Month', 'Year', 'Notes'];
    const rows = filteredRecords.map((r) => [
      r.studentId,
      `"${r.studentName}"`,
      `"${r.gradeClass}"`,
      r.invoiceNumber,
      `"${r.category}"`,
      r.totalAmount,
      r.paidAmount,
      r.balance,
      r.paymentStatus,
      r.billIssueDate,
      r.dueDate,
      r.month,
      r.year,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Fees_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGMEditAttempt = () => {
    alert('CRITICAL SECURITY RULE: The GM cannot edit or overwrite original financial records uploaded by the Accountant. You can flag this record for review or request a correction.');
  };

  const handleDeleteRecord = async (record: StudentFeeRecord) => {
    const confirmed = window.confirm(`Delete the fee record for ${record.studentName} (${record.invoiceNumber})? This cannot be undone.`);
    if (!confirmed) return;

    const result = await deleteStudentFee(record.id);
    if (!result.success) {
      window.alert(result.error || 'Failed to delete the student fee record.');
      return;
    }

    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
              {selectedGrade ?? 'Category One'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Tuition, Admission, Exam &amp; Transport Charges
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            {selectedGrade ? `${selectedGrade} Fee Ledger` : 'Student Financial Records & Fee Ledgers'}
          </h2>
          {selectedGrade && (
            <p className="text-xs text-slate-500">Fee records for {selectedGrade}.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedGrade !== null && (
            <button
              onClick={() => {
                setSelectedGrade(null);
                setCurrentPage(1);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>All Classes</span>
            </button>
          )}
          {isAccountant && (
            <button
              onClick={() => onOpenAddModal(selectedGrade ?? undefined)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Student Fee</span>
            </button>
          )}

          {selectedGrade !== null && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              <FileDown className="h-4 w-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {selectedGrade === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCHOOL_CLASSES.map((className) => (
            <button
              key={className}
              type="button"
              onClick={() => {
                setSelectedGrade(className);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:border-indigo-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-base font-bold text-slate-900">{className}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <>
      {/* Summary Metrics Bar for Filtered Selection */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Billed ({filteredRecords.length} records)
          </span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalBilled, settings.currencyCode)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Collected
          </span>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalCollected, settings.currencyCode)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Outstanding Student Dues
          </span>
          <p className="text-xl font-bold text-amber-600 mt-1">
            {formatCurrency(totalBalance, settings.currencyCode)}
          </p>
        </div>
      </div>

      {/* Search, Filters, and Sorting Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, ID, invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* 3-Month (Quarter) Filter */}
          <div>
            <select
              value={selectedQuarter}
              onChange={(e) => {
                const next = QUARTERS.find((q) => q.id === e.target.value);
                setSelectedQuarter(e.target.value);
                // Drop a month that is outside the new 3-month period.
                if (next && selectedMonth !== 'all' && !next.months.includes(monthIndex(selectedMonth))) {
                  setSelectedMonth('all');
                }
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              aria-label="Filter by three-month period"
            >
              <option value="all">All 3-Month Periods</option>
              {QUARTERS.map((q) => (
                <option key={q.id} value={q.id}>{q.label}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              aria-label="Filter by billing month"
            >
              <option value="all">{quarter ? `All of ${quarter.label}` : 'All Months'}</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              aria-label="Filter by billing year"
            >
              <option value="all">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Status Filter */}
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

          {/* Student Dues Filter (each student's total unpaid amount in this class) */}
          <div>
            <select
              value={selectedDuesRange}
              onChange={(e) => { setSelectedDuesRange(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              aria-label="Filter by student's total unpaid dues"
              title={`Each student's total unpaid amount (${settings.currencyCode})`}
            >
              <option value="all">All Student Dues</option>
              {DUES_RANGES.map((range) => {
                const count = duesRangeCounts[range.id] ?? 0;
                return (
                  <option key={range.id} value={range.id}>
                    Dues {range.label} ({count} {count === 1 ? 'student' : 'students'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Fee Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              aria-label="Filter by fee category"
            >
              <option value="all">All Categories</option>
              {settings.feeCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Sort By:</span>
            <button
              onClick={() => {
                if (sortBy === 'date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('date'); setSortOrder('desc'); }
              }}
              className={`px-2 py-1 rounded font-medium ${sortBy === 'date' ? 'bg-red-50 text-[#D81A28] font-bold border border-red-200' : 'hover:bg-slate-100'}`}
            >
              Issue Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'amount') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('amount'); setSortOrder('desc'); }
              }}
              className={`px-2 py-1 rounded font-medium ${sortBy === 'amount' ? 'bg-red-50 text-[#D81A28] font-bold border border-red-200' : 'hover:bg-slate-100'}`}
            >
              Total Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'balance') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('balance'); setSortOrder('desc'); }
              }}
              className={`px-2 py-1 rounded font-medium ${sortBy === 'balance' ? 'bg-red-50 text-[#D81A28] font-bold border border-red-200' : 'hover:bg-slate-100'}`}
            >
              Remaining Dues {sortBy === 'balance' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <div>
            Showing <strong>{paginatedRecords.length}</strong> of <strong>{filteredRecords.length}</strong> records
          </div>
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice # &amp; Student</th>
                <th className="py-3 px-4">Class &amp; Category</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Dates (Issue / Due)</th>
                <th className="py-3 px-4 text-right">Payable</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <GraduationCap className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No student records available yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {searchQuery || selectedQuarter !== 'all' || selectedMonth !== 'all' || selectedYear !== 'all' || selectedStatus !== 'all' || selectedCategory !== 'all' || selectedDuesRange !== 'all'
                        ? 'No student financial records match your current filter selections. Try clearing your search or filters.'
                        : 'No student fee bills have been entered. The Senior Accountant can add a new student fee or use Bulk CSV Import to load institutional records.'}
                    </p>
                    {isAccountant && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <button
                          onClick={() => onOpenAddModal(selectedGrade ?? undefined)}
                          className="rounded-lg bg-[#D81A28] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#B91220] transition"
                        >
                          + Add First Student Fee
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50/80 transition ${
                      r.isFlaggedForReview ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    {/* Invoice & Student */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{r.studentName}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {r.invoiceNumber} • {r.studentId}
                      </div>
                      {r.isFlaggedForReview && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 mt-0.5">
                          <Flag className="h-3 w-3" /> Flagged for Review
                        </span>
                      )}
                    </td>

                    {/* Class & Category */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{r.gradeClass}</span>
                      <div className="text-[11px] text-slate-500">{r.category}</div>
                    </td>

                    {/* Billing Period (Month & Year Prominent) */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {r.month} {r.year}
                      </span>
                    </td>

                    {/* Issue & Due Dates */}
                    <td className="py-3 px-4">
                      <div>Issue: {formatDisplayDate(r.billIssueDate)}</div>
                      <div className={r.paymentStatus === 'Overdue' ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                        Due: {formatDisplayDate(r.dueDate)}
                      </div>
                    </td>

                    {/* Payable */}
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(r.totalAmount, settings.currencyCode)}
                    </td>

                    {/* Paid */}
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      {formatCurrency(r.paidAmount, settings.currencyCode)}
                    </td>

                    {/* Balance */}
                    <td className="py-3 px-4 text-right font-bold text-amber-700">
                      {formatCurrency(r.balance, settings.currencyCode)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          r.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.paymentStatus === 'Partially Paid'
                            ? 'bg-blue-100 text-blue-800'
                            : r.paymentStatus === 'Overdue'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r.paymentStatus}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Printable Invoice view */}
                        <button
                          onClick={() => onOpenInvoiceModal(r)}
                          title="View Bill Details &amp; Print Statement"
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Record Payment */}
                        {(isAccountant || isHOD) && r.balance > 0 && (
                          <button
                            onClick={() => onOpenPaymentModal(r)}
                            title="Record Payment"
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                          >
                            <Receipt className="h-4 w-4" />
                          </button>
                        )}

                        {/* Edit Record - Accountant Only (GM CANNOT EDIT ORIGINAL RECORDS) */}
                        {isAccountant && (
                          <button
                            onClick={() => onOpenEditModal(r)}
                            title="Edit Record"
                            className="rounded p-1 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}

                        {isAccountant && (
                          <button
                            onClick={() => handleDeleteRecord(r)}
                            title="Delete Record"
                            className="rounded p-1 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* If GM tries to edit: Show restriction */}
                        {isGM && (
                          <button
                            onClick={handleGMEditAttempt}
                            title="GM Restricted: Cannot edit original Accountant record"
                            className="rounded p-1 text-slate-300 hover:text-rose-500"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}

                        {/* HOD Authorized Revision */}
                        {isHOD && (
                          <button
                            onClick={() => onOpenRevisionModal(r)}
                            title="Submit Authorized Revision"
                            className="rounded p-1 text-indigo-600 hover:bg-indigo-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Flag for Review (GM / HOD) */}
                        {(isGM || isHOD) && (
                          <button
                            onClick={() => onOpenFlagModal(r)}
                            title={r.isFlaggedForReview ? 'View / Clear Flag' : 'Flag for Accountant Review'}
                            className={`rounded p-1 ${r.isFlaggedForReview ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-amber-600'}`}
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
        </>
      )}
    </div>
  );
};

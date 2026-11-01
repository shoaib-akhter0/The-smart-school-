import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Search, Filter, X, ChevronDown, ChevronUp, Calendar,
  Loader2, RotateCcw, SlidersHorizontal, Tag
} from 'lucide-react';
import { FilterState, DEFAULT_FILTERS, MONTHS, YEARS } from '../../types';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  totalCount?: number;
  isLoading?: boolean;

  // Control which filters are visible
  showSearch?: boolean;
  searchPlaceholder?: string;
  showMonth?: boolean;
  showYear?: boolean;
  showDateRange?: boolean;
  dateRangeLabel?: string;
  showStatus?: boolean;
  showCategory?: boolean;
  categoryOptions?: string[];
  categoryLabel?: string;
  showAmountRange?: boolean;
  amountLabel?: string;
  showCreatedBy?: boolean;
  createdByOptions?: { value: string; label: string }[];
  showGrade?: boolean;
  gradeOptions?: string[];
  showVendor?: boolean;
  vendorOptions?: { value: string; label: string }[];
  showRecordType?: boolean;
  showPaymentMethod?: boolean;
  showAuditAction?: boolean;
  showAuditRole?: boolean;
  showFlaggedOnly?: boolean;
  showOrdering?: boolean;
  orderingOptions?: { value: string; label: string }[];
}

const PAYMENT_STATUSES = ['Paid', 'Partially Paid', 'Unpaid', 'Overdue'];
const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer / IBFT' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque / Pay Order' },
  { value: 'ONLINE', label: 'Online Portal' },
];
const AUDIT_ACTIONS = [
  { value: 'RECORD_CREATED', label: 'Record Created' },
  { value: 'RECORD_EDITED', label: 'Record Edited' },
  { value: 'HOD_REVISION', label: 'HOD Revision' },
  { value: 'PAYMENT_RECORDED', label: 'Payment Recorded' },
  { value: 'RECORD_FLAGGED', label: 'Record Flagged' },
  { value: 'IMPORT_COMPLETED', label: 'Import Completed' },
  { value: 'SETTINGS_UPDATED', label: 'Settings Updated' },
  { value: 'USER_UPDATED', label: 'User Updated' },
];
const AUDIT_ROLES = [
  { value: 'GM', label: 'GM / Super Admin' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'HOD', label: 'Head of Department' },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  totalCount,
  isLoading = false,
  showSearch = true,
  searchPlaceholder = 'Search by name, ID, invoice number...',
  showMonth = false,
  showYear = false,
  showDateRange = false,
  dateRangeLabel = 'Date Range',
  showStatus = false,
  showCategory = false,
  categoryOptions = [],
  categoryLabel = 'Category',
  showAmountRange = false,
  amountLabel = 'Amount Range',
  showCreatedBy = false,
  createdByOptions = [],
  showGrade = false,
  gradeOptions = [],
  showVendor = false,
  vendorOptions = [],
  showRecordType = false,
  showPaymentMethod = false,
  showAuditAction = false,
  showAuditRole = false,
  showFlaggedOnly = false,
  showOrdering = false,
  orderingOptions = [],
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Sync local search with external filter changes
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  // Count active filters (excluding defaults)
  const activeFilterCount = (() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.month !== 'all') count++;
    if (filters.year !== 'all') count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.status !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.minAmount) count++;
    if (filters.maxAmount) count++;
    if (filters.createdBy !== 'all') count++;
    if (filters.recordType !== 'all') count++;
    if (filters.paymentMethod !== 'all') count++;
    if (filters.action !== 'all') count++;
    if (filters.performedByRole !== 'all') count++;
    if (filters.gradeClass !== 'all') count++;
    if (filters.vendorId !== 'all') count++;
    if (filters.flaggedOnly) count++;
    return count;
  })();

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    onFilterChange({ ...filters, [key]: value, page: 1 });
  }, [filters, onFilterChange]);

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onFilterChange({ ...filters, search: value, page: 1 });
    }, 350);
  }, [filters, onFilterChange]);

  const clearAllFilters = useCallback(() => {
    setLocalSearch('');
    onFilterChange({
      ...DEFAULT_FILTERS,
      pageSize: filters.pageSize,
      ordering: filters.ordering,
    });
  }, [filters.pageSize, filters.ordering, onFilterChange]);

  // Determine if advanced section has any visible filters
  const hasAdvancedFilters = showDateRange || showAmountRange || showCreatedBy || showGrade || showVendor || showFlaggedOnly;

  // Active filter pills
  const activeFilterPills: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.search) activeFilterPills.push({ key: 'search', label: `Search: "${filters.search}"`, onRemove: () => { setLocalSearch(''); updateFilter('search', ''); } });
  if (filters.month !== 'all') activeFilterPills.push({ key: 'month', label: `Month: ${filters.month}`, onRemove: () => updateFilter('month', 'all') });
  if (filters.year !== 'all') activeFilterPills.push({ key: 'year', label: `Year: ${filters.year}`, onRemove: () => updateFilter('year', 'all') });
  if (filters.status !== 'all') activeFilterPills.push({ key: 'status', label: `Status: ${filters.status}`, onRemove: () => updateFilter('status', 'all') });
  if (filters.category !== 'all') activeFilterPills.push({ key: 'category', label: `${categoryLabel}: ${filters.category}`, onRemove: () => updateFilter('category', 'all') });
  if (filters.startDate) activeFilterPills.push({ key: 'startDate', label: `From: ${filters.startDate}`, onRemove: () => updateFilter('startDate', '') });
  if (filters.endDate) activeFilterPills.push({ key: 'endDate', label: `To: ${filters.endDate}`, onRemove: () => updateFilter('endDate', '') });
  if (filters.minAmount) activeFilterPills.push({ key: 'minAmount', label: `Min: ${filters.minAmount}`, onRemove: () => updateFilter('minAmount', '') });
  if (filters.maxAmount) activeFilterPills.push({ key: 'maxAmount', label: `Max: ${filters.maxAmount}`, onRemove: () => updateFilter('maxAmount', '') });
  if (filters.createdBy !== 'all') activeFilterPills.push({ key: 'createdBy', label: `By: ${filters.createdBy}`, onRemove: () => updateFilter('createdBy', 'all') });
  if (filters.gradeClass !== 'all') activeFilterPills.push({ key: 'gradeClass', label: `Grade: ${filters.gradeClass}`, onRemove: () => updateFilter('gradeClass', 'all') });
  if (filters.vendorId !== 'all') activeFilterPills.push({ key: 'vendorId', label: `Vendor: ${vendorOptions.find(v => v.value === filters.vendorId)?.label || filters.vendorId}`, onRemove: () => updateFilter('vendorId', 'all') });
  if (filters.recordType !== 'all') activeFilterPills.push({ key: 'recordType', label: `Type: ${filters.recordType === 'student' ? 'Student Fee' : 'Vendor Bill'}`, onRemove: () => updateFilter('recordType', 'all') });
  if (filters.paymentMethod !== 'all') activeFilterPills.push({ key: 'paymentMethod', label: `Method: ${PAYMENT_METHODS.find(m => m.value === filters.paymentMethod)?.label || filters.paymentMethod}`, onRemove: () => updateFilter('paymentMethod', 'all') });
  if (filters.action !== 'all') activeFilterPills.push({ key: 'action', label: `Action: ${AUDIT_ACTIONS.find(a => a.value === filters.action)?.label || filters.action}`, onRemove: () => updateFilter('action', 'all') });
  if (filters.performedByRole !== 'all') activeFilterPills.push({ key: 'performedByRole', label: `Role: ${AUDIT_ROLES.find(r => r.value === filters.performedByRole)?.label || filters.performedByRole}`, onRemove: () => updateFilter('performedByRole', 'all') });
  if (filters.flaggedOnly) activeFilterPills.push({ key: 'flaggedOnly', label: 'Flagged Only', onRemove: () => updateFilter('flaggedOnly', false) });

  const selectClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors";
  const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Primary Filter Row */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
          {/* Search */}
          {showSearch && (
            <div className="lg:col-span-2 relative">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Search</label>
              <Search className="absolute left-3 bottom-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className={`${inputClass} pl-9`}
              />
              {isLoading && (
                <Loader2 className="absolute right-3 bottom-2.5 h-4 w-4 text-indigo-500 animate-spin" />
              )}
            </div>
          )}

          {/* Billing Month */}
          {showMonth && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Billing Month</label>
              <select value={filters.month} onChange={(e) => updateFilter('month', e.target.value)} className={selectClass} aria-label="Filter by billing month">
                <option value="all">All Months</option>
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

          {/* Billing Year */}
          {showYear && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Billing Year</label>
              <select value={filters.year} onChange={(e) => updateFilter('year', e.target.value)} className={selectClass} aria-label="Filter by billing year">
                <option value="all">All Years</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          {/* Payment Status */}
          {showStatus && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment Status</label>
              <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className={selectClass} aria-label="Filter by payment status">
                <option value="all">All Statuses</option>
                {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}{s === 'Overdue' ? ' ⚠' : ''}</option>)}
              </select>
            </div>
          )}

          {/* Category */}
          {showCategory && categoryOptions.length > 0 && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{categoryLabel}</label>
              <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} className={selectClass} aria-label={`Filter by ${categoryLabel}`}>
                <option value="all">All {categoryLabel}s</option>
                {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* Record Type */}
          {showRecordType && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Record Type</label>
              <select value={filters.recordType} onChange={(e) => updateFilter('recordType', e.target.value)} className={selectClass}>
                <option value="all">All Types</option>
                <option value="student">Student Fee Collections</option>
                <option value="vendor">Vendor Payable Disbursals</option>
              </select>
            </div>
          )}

          {/* Payment Method */}
          {showPaymentMethod && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
              <select value={filters.paymentMethod} onChange={(e) => updateFilter('paymentMethod', e.target.value)} className={selectClass}>
                <option value="all">All Methods</option>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          )}

          {/* Audit Action */}
          {showAuditAction && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Action Type</label>
              <select value={filters.action} onChange={(e) => updateFilter('action', e.target.value)} className={selectClass}>
                <option value="all">All Actions</option>
                {AUDIT_ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          )}

          {/* Audit Role */}
          {showAuditRole && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Acting Role</label>
              <select value={filters.performedByRole} onChange={(e) => updateFilter('performedByRole', e.target.value)} className={selectClass}>
                <option value="all">All Roles</option>
                {AUDIT_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Advanced Filters Toggle */}
        {hasAdvancedFilters && (
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{isAdvancedOpen ? 'Hide' : 'Show'} Advanced Filters</span>
              {isAdvancedOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {!isAdvancedOpen && activeFilterCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 px-1.5 py-0.5 text-[10px] font-bold min-w-[18px]">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Advanced Filters Section */}
        {hasAdvancedFilters && isAdvancedOpen && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
            {/* Date Range */}
            {showDateRange && (
              <>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    <Calendar className="inline h-3 w-3 mr-0.5 -mt-0.5" />{dateRangeLabel} — From
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => updateFilter('startDate', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    <Calendar className="inline h-3 w-3 mr-0.5 -mt-0.5" />{dateRangeLabel} — To
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => updateFilter('endDate', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {/* Amount Range */}
            {showAmountRange && (
              <>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{amountLabel} — Min (PKR)</label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={filters.minAmount}
                    onChange={(e) => updateFilter('minAmount', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{amountLabel} — Max (PKR)</label>
                  <input
                    type="number"
                    placeholder="No limit"
                    min="0"
                    value={filters.maxAmount}
                    onChange={(e) => updateFilter('maxAmount', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {/* Created By */}
            {showCreatedBy && createdByOptions.length > 0 && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Record Creator</label>
                <select value={filters.createdBy} onChange={(e) => updateFilter('createdBy', e.target.value)} className={selectClass}>
                  <option value="all">All Users</option>
                  {createdByOptions.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            )}

            {/* Grade / Class */}
            {showGrade && gradeOptions.length > 0 && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Grade / Class</label>
                <select value={filters.gradeClass} onChange={(e) => updateFilter('gradeClass', e.target.value)} className={selectClass}>
                  <option value="all">All Grades</option>
                  {gradeOptions.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            )}

            {/* Vendor Selector */}
            {showVendor && vendorOptions.length > 0 && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Vendor / Supplier</label>
                <select value={filters.vendorId} onChange={(e) => updateFilter('vendorId', e.target.value)} className={selectClass}>
                  <option value="all">All Vendors</option>
                  {vendorOptions.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </div>
            )}

            {/* Flagged Only */}
            {showFlaggedOnly && (
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.flaggedOnly || false}
                    onChange={(e) => updateFilter('flaggedOnly', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">
                    Flagged for Review Only
                  </span>
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: Sort, Active Filters, Count, Clear */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sort Selector */}
          {showOrdering && orderingOptions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Sort:</span>
              <select
                value={filters.ordering}
                onChange={(e) => updateFilter('ordering', e.target.value)}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-400"
              >
                {orderingOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Active filter pills */}
          {activeFilterPills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="h-3 w-3 text-indigo-500 shrink-0" />
              {activeFilterPills.slice(0, 5).map((pill) => (
                <span key={pill.key} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 pl-2 pr-1 py-0.5 text-[10px] font-semibold text-indigo-700">
                  {pill.label}
                  <button onClick={pill.onRemove} className="rounded-full hover:bg-indigo-200 p-0.5 transition-colors" title="Remove filter">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              {activeFilterPills.length > 5 && (
                <span className="text-[10px] font-medium text-slate-400">+{activeFilterPills.length - 5} more</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Record count */}
          {totalCount !== undefined && (
            <span className="font-medium">
              {isLoading ? (
                <span className="flex items-center gap-1 text-indigo-600">
                  <Loader2 className="h-3 w-3 animate-spin" /> Filtering...
                </span>
              ) : (
                <>
                  <strong className="text-slate-900">{totalCount.toLocaleString()}</strong> record{totalCount !== 1 ? 's' : ''} found
                </>
              )}
            </span>
          )}

          {/* Clear All */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors shadow-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Clear Filters
              <span className="rounded-full bg-slate-100 px-1.5 py-0 text-[10px] font-bold text-slate-600">
                {activeFilterCount}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Pagination component to pair with FilterPanel
 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage, totalPages, totalCount, pageSize, onPageChange, isLoading
}) => {
  const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
      <div>
        Showing <strong className="text-slate-900">{startRecord}</strong>–<strong className="text-slate-900">{endRecord}</strong> of{' '}
        <strong className="text-slate-900">{totalCount.toLocaleString()}</strong> records
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="rounded border border-slate-200 px-2.5 py-1.5 font-semibold disabled:opacity-40 hover:bg-slate-50 transition-colors"
        >
          ← Prev
        </button>

        {getPageNumbers().map((p, idx) =>
          typeof p === 'string' ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              disabled={isLoading}
              className={`rounded border px-2.5 py-1.5 font-semibold transition-colors ${p === currentPage
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50'
                }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="rounded border border-slate-200 px-2.5 py-1.5 font-semibold disabled:opacity-40 hover:bg-slate-50 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

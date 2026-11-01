import React, { useState } from 'react';
import {
  GraduationCap, Truck, AlertTriangle, CheckCircle2,
  DollarSign, Clock, Users, ArrowUpRight, ArrowDownRight,
  TrendingUp, Calendar, Filter, Flag, ShieldAlert, FileText, Inbox
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import { useSchool } from '../../context/SchoolContext';
import { formatCurrency, formatDisplayDate } from '../../utils/financeRules';

interface GMDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const GMDashboard: React.FC<GMDashboardProps> = ({ onNavigateTab }) => {
  const { settings, studentFees, vendorInvoices, auditLogs } = useSchool();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // Filtered from real database only
  const filteredFees = studentFees.filter(f => {
    if (selectedMonth !== 'all' && f.month.toLowerCase() !== selectedMonth.toLowerCase()) return false;
    if (selectedYear !== 'all' && f.year !== Number(selectedYear)) return false;
    return true;
  });

  const filteredInvoices = vendorInvoices.filter(i => {
    if (selectedMonth !== 'all' && i.month.toLowerCase() !== selectedMonth.toLowerCase()) return false;
    if (selectedYear !== 'all' && i.year !== Number(selectedYear)) return false;
    return true;
  });

  // Calculate live values directly from real records
  const studentBilled = filteredFees.reduce((sum, f) => sum + f.totalAmount, 0);
  const studentCollected = filteredFees.reduce((sum, f) => sum + f.paidAmount, 0);
  const studentOutstanding = filteredFees.reduce((sum, f) => sum + f.balance, 0);
  const studentOverdue = filteredFees.filter(f => f.paymentStatus === 'Overdue').length;

  const vendorBilled = filteredInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const vendorPaid = filteredInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const vendorPayable = filteredInvoices.reduce((sum, i) => sum + i.balance, 0);
  const vendorOverdue = filteredInvoices.filter(i => i.paymentStatus === 'Overdue').length;

  const netOperatingSurplus = studentCollected - vendorPaid;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendData = months.map(m => {
    const monthFees = studentFees.filter(f => f.month.toLowerCase().startsWith(m.toLowerCase()));
    const monthInvs = vendorInvoices.filter(i => i.month.toLowerCase().startsWith(m.toLowerCase()));
    return {
      month: m,
      feesCollected: monthFees.reduce((sum, f) => sum + f.paidAmount, 0),
      vendorPayments: monthInvs.reduce((sum, i) => sum + i.paidAmount, 0),
      outstandingDues: monthFees.reduce((sum, f) => sum + f.balance, 0),
    };
  });

  const hasFinancialData = studentBilled > 0 || vendorBilled > 0;

  const statusPieData = [
    { name: 'Collected Fees', value: studentCollected, color: '#059669' },
    { name: 'Student Dues', value: studentOutstanding, color: '#D81A28' },
    { name: 'Vendor Paid', value: vendorPaid, color: '#2563EB' },
    { name: 'Vendor Payables', value: vendorPayable, color: '#DC2626' },
  ].filter(d => d.value > 0);

  const flaggedItems = [
    ...studentFees.filter(f => f.isFlaggedForReview).map(f => ({
      id: f.id,
      title: `${f.studentName} (${f.invoiceNumber})`,
      category: f.category,
      amount: f.totalAmount,
      reason: f.flagReason,
      type: 'student' as const,
    })),
    ...vendorInvoices.filter(i => i.isFlaggedForReview).map(i => ({
      id: i.id,
      title: `${i.vendorName} (${i.invoiceNumber})`,
      category: i.category,
      amount: i.totalAmount,
      reason: i.flagReason,
      type: 'vendor' as const,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Filter Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-red-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
              Executive GM Dashboard
            </span>
            <span className="text-xs text-slate-500 font-medium">
              The Smart School • Session {settings.academicSession}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            School Financial Health &amp; Institutional Oversight
          </h2>
          <p className="text-xs text-slate-500">
            Real-time balance sheets, collection velocity, and vendor liability metrics.
          </p>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
            <Calendar className="h-4 w-4 text-slate-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
              aria-label="Filter by month"
            >
              <option value="all">All Months</option>
              <option value="January">January</option>
              <option value="February">February</option>
              <option value="March">March</option>
              <option value="April">April</option>
              <option value="May">May</option>
              <option value="June">June</option>
              <option value="July">July</option>
              <option value="August">August</option>
              <option value="September">September</option>
              <option value="October">October</option>
              <option value="November">November</option>
              <option value="December">December</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
              aria-label="Filter by year"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <button
            onClick={() => onNavigateTab('reports')}
            className="flex items-center gap-1.5 rounded-lg bg-[#D81A28] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#B91220] transition"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Generate Reports</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Student Collections vs Vendor Payables */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Student Fees Billed */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Fees Billed
            </span>
            <div className="rounded-lg bg-red-50 p-2 text-red-600">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(studentBilled, settings.currencyCode)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Collected: <strong className="text-emerald-600">{formatCurrency(studentCollected, settings.currencyCode)}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 2: Outstanding Student Dues */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Outstanding Dues
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-700">
              {formatCurrency(studentOutstanding, settings.currencyCode)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>{studentOverdue} Overdue Invoices</span>
              <button
                onClick={() => onNavigateTab('students')}
                className="font-medium text-red-600 hover:underline"
              >
                Inspect
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Vendor Bills Incurred */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Vendor Bills
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(vendorBilled, settings.currencyCode)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Disbursed: <strong className="text-slate-800">{formatCurrency(vendorPaid, settings.currencyCode)}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 4: Outstanding Vendor Payables */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Vendor Payables
            </span>
            <div className="rounded-lg bg-red-50 p-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(vendorPayable, settings.currencyCode)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>{vendorOverdue} Overdue Bills</span>
              <button
                onClick={() => onNavigateTab('vendors')}
                className="font-medium text-red-600 hover:underline"
              >
                Payables
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Inflow vs Outflow Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monthly Inflow (Fee Collections) vs Outflow (Vendor Payments)
              </h3>
              <p className="text-xs text-slate-500">
                Aggregated cashflow in {settings.currencyCode} across the academic cycle
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              Net Surplus: {formatCurrency(netOperatingSurplus, settings.currencyCode)}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val), settings.currencyCode), '']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="feesCollected" name="Fee Collections (Inflow)" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vendorPayments" name="Vendor Disbursements (Outflow)" fill="#D81A28" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Distribution Pie Chart / Empty State */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Financial Capital Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Fee Collections, Dues, and Outstanding Liabilities
            </p>

            <div className="h-52 w-full flex items-center justify-center">
              {statusPieData.length === 0 ? (
                <div className="text-center text-slate-400 py-6">
                  <Inbox className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No Distribution Data Yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Entries will appear once bills or fees are added.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val), settings.currencyCode)}
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-100">
            {statusPieData.length > 0 ? (
              statusPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 truncate">{item.name}</span>
                </div>
              ))
            ) : (
              <span className="text-[11px] text-slate-400 col-span-2">Awaiting initial financial records</span>
            )}
          </div>
        </div>
      </div>

      {/* Flagged Records Needing Attention & Recent Audit Trail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Flagged Records Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-red-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Flagged for Review &amp; Corrections ({flaggedItems.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500">Requires Accountant follow-up</span>
          </div>

          {flaggedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No Flagged Discrepancies</p>
              <p className="text-[11px] text-slate-500">All student and vendor records are validated and clear.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {flaggedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{item.title}</span>
                    <span className="font-semibold text-red-900">
                      {formatCurrency(item.amount, settings.currencyCode)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-red-800">
                    <strong>Reason:</strong> {item.reason}
                  </p>
                  <div className="mt-2 flex items-center justify-between pt-1 border-t border-red-200">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">
                      {item.category}
                    </span>
                    <button
                      onClick={() => onNavigateTab(item.type === 'student' ? 'students' : 'vendors')}
                      className="text-xs font-semibold text-red-700 hover:underline"
                    >
                      View in {item.type === 'student' ? 'Student Fees' : 'Vendor Payables'} &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Audit Trail Snippet */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Recent System Audit Activity
            </h3>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-xs font-medium text-red-700 hover:underline"
            >
              Full Audit Trail &rarr;
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
              <ShieldAlert className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No Recent Audit Activity</p>
              <p className="text-[11px] text-slate-400">Every record creation, edit, revision, and payment will be logged here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 p-2.5 hover:bg-slate-50 transition"
                >
                  <div className="mt-0.5 rounded-md bg-red-50 p-1.5 text-red-700 shrink-0">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate">
                        {log.action.replace('_', ' ')}: {log.recordIdentifier}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      By <strong>{log.performedBy}</strong> ({log.performedByRole})
                      {log.reason ? ` — "${log.reason}"` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

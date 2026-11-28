import React from 'react';
import { GraduationCap, Truck, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { useSchool } from '../../context/SchoolContext';
import { formatCurrency } from '../../utils/financeRules';

interface AccountantDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AccountantDashboard: React.FC<AccountantDashboardProps> = ({ onNavigateTab }) => {
  const { studentFees, vendorInvoices, settings } = useSchool();

  // Category 1 Calculations directly from real data
  const studentTotalBilled = studentFees.reduce((sum, f) => sum + f.totalAmount, 0);
  const studentTotalCollected = studentFees.reduce((sum, f) => sum + f.paidAmount, 0);
  const studentTotalOutstanding = studentFees.reduce((sum, f) => sum + f.balance, 0);

  // Category 2 Calculations directly from real data
  const vendorTotalBilled = vendorInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const vendorTotalPaid = vendorInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const vendorTotalPayable = vendorInvoices.reduce((sum, i) => sum + i.balance, 0);

  const studentChartData = [
    { name: 'Billed', amount: studentTotalBilled, color: '#64748B' },
    { name: 'Collected', amount: studentTotalCollected, color: '#059669' },
    { name: 'Remaining', amount: studentTotalOutstanding, color: '#D81A28' },
  ];
  const vendorChartData = [
    { name: 'Billed', amount: vendorTotalBilled, color: '#64748B' },
    { name: 'Paid', amount: vendorTotalPaid, color: '#2563EB' },
    { name: 'Payable Due', amount: vendorTotalPayable, color: '#D81A28' },
  ];

  return (
    <div className="space-y-6">
      {/* Accountant Workspace Header */}
      <div className="rounded-xl border border-red-200 bg-red-50/40 px-5 py-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[#D81A28] px-2.5 py-0.5 text-xs font-bold text-white">
            Senior Accountant Desk
          </span>
          <span className="text-xs text-slate-500 font-medium">
            The Smart School • Primary Financial Data Authority
          </span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
          Financial Ledger &amp; Transactions Entry Station
        </h2>
      </div>

      {/* TWO PRIMARY MODULE CATEGORIES (PROMINENTLY SEPARATED) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ================= CATEGORY 1: STUDENT FINANCIAL DATA ================= */}
        <div className="rounded-xl border border-red-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-red-100">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-red-50 p-2 text-red-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                    Category 1
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Student Financial Data
                  </h3>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('students')}
                className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
              >
                <span>View Full Table</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Metrics cards */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500">Total Billed</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {formatCurrency(studentTotalBilled, settings.currencyCode)}
                </p>
              </div>

              <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-100">
                <span className="text-[11px] font-medium text-emerald-700">Collected</span>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">
                  {formatCurrency(studentTotalCollected, settings.currencyCode)}
                </p>
              </div>

              <div className="rounded-lg bg-red-50 p-3 border border-red-100">
                <span className="text-[11px] font-medium text-red-700">Remaining</span>
                <p className="text-sm font-bold text-red-700 mt-0.5">
                  {formatCurrency(studentTotalOutstanding, settings.currencyCode)}
                </p>
              </div>
            </div>

            <div className="mt-5 h-44" aria-label="Student billed, collected, and remaining totals">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentChartData} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    width={78}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                  />
                  <Tooltip
                    formatter={(value: unknown) => [formatCurrency(Number(value), settings.currencyCode), '']}
                    cursor={{ fill: '#F8FAFC' }}
                  />
                  <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]} barSize={18}>
                    {studentChartData.map((item) => <Cell key={item.name} fill={item.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>

        {/* ================= CATEGORY 2: VENDOR FINANCIAL DATA ================= */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Category 2
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Vendor Financial Data
                  </h3>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('vendors')}
                className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:underline"
              >
                <span>View Full Table</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Metrics cards */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500">Total Billed</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {formatCurrency(vendorTotalBilled, settings.currencyCode)}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
                <span className="text-[11px] font-medium text-blue-700">Paid by School</span>
                <p className="text-sm font-bold text-blue-700 mt-0.5">
                  {formatCurrency(vendorTotalPaid, settings.currencyCode)}
                </p>
              </div>

              <div className="rounded-lg bg-red-50 p-3 border border-red-100">
                <span className="text-[11px] font-medium text-red-700">Payable Due</span>
                <p className="text-sm font-bold text-red-700 mt-0.5">
                  {formatCurrency(vendorTotalPayable, settings.currencyCode)}
                </p>
              </div>
            </div>

            <div className="mt-5 h-44" aria-label="Vendor billed, paid, and payable totals">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorChartData} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    width={78}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                  />
                  <Tooltip
                    formatter={(value: unknown) => [formatCurrency(Number(value), settings.currencyCode), '']}
                    cursor={{ fill: '#F8FAFC' }}
                  />
                  <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]} barSize={18}>
                    {vendorChartData.map((item) => <Cell key={item.name} fill={item.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

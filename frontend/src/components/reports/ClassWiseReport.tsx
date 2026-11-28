import React, { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { StudentFeeRecord } from '../../types';
import { formatCurrency } from '../../utils/financeRules';
import { SCHOOL_CLASSES, normalizeClassName } from '../../utils/schoolClasses';
import { useTheme } from '../../context/ThemeContext';

// Collected vs Dues. Validated (light on #ffffff, dark on #111827): all checks pass;
// the CVD gap is in the "needs secondary encoding" band, so every chart also has a legend + text labels.
const PALETTE = {
  light: { collected: '#059669', dues: '#d97706', surface: '#ffffff', grid: '#e2e8f0', axis: '#64748b' },
  dark: { collected: '#10b981', dues: '#d4880a', surface: '#111827', grid: '#1f2937', axis: '#94a3b8' },
};

const OTHER_CLASS = 'Other / Unassigned';

export interface ClassSummary {
  className: string;
  shortName: string;
  students: number;
  records: number;
  billed: number;
  collected: number;
  dues: number;
  rate: number; // 0–100
}

const shortLabel = (className: string) =>
  className === OTHER_CLASS ? 'Other' : className.replace(/^Class\s+/, '');

const compact = (value: number) =>
  value >= 1_000_000 ? `${+(value / 1_000_000).toFixed(1)}M`
    : value >= 1_000 ? `${+(value / 1_000).toFixed(1)}k`
    : String(value);

/** Group fee records by class (in school order). Classes with no records are included with zeros. */
export function summarizeByClass(records: StudentFeeRecord[]): ClassSummary[] {
  const groups = new Map<string, StudentFeeRecord[]>();
  SCHOOL_CLASSES.forEach((c) => groups.set(c, []));
  records.forEach((r) => {
    const key = normalizeClassName(r.gradeClass) ?? OTHER_CLASS;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  });

  return Array.from(groups.entries()).map(([className, rows]) => {
    const billed = rows.reduce((sum, r) => sum + r.totalAmount, 0);
    const collected = rows.reduce((sum, r) => sum + r.paidAmount, 0);
    return {
      className,
      shortName: shortLabel(className),
      students: new Set(rows.map((r) => r.studentId)).size,
      records: rows.length,
      billed,
      collected,
      dues: rows.reduce((sum, r) => sum + r.balance, 0),
      rate: billed > 0 ? Math.round((collected / billed) * 100) : 0,
    };
  });
}

interface ClassWiseReportProps {
  records: StudentFeeRecord[];
  currency: string;
}

export const ClassWiseReport: React.FC<ClassWiseReportProps> = ({ records, currency }) => {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? PALETTE.dark : PALETTE.light;

  const summaries = useMemo(() => summarizeByClass(records), [records]);
  // "Other" only appears when some records have a class name we can't match.
  const visible = summaries.filter((s) => s.className !== OTHER_CLASS || s.records > 0);

  const totals = useMemo(() => {
    const billed = summaries.reduce((sum, s) => sum + s.billed, 0);
    const collected = summaries.reduce((sum, s) => sum + s.collected, 0);
    return {
      billed,
      collected,
      dues: summaries.reduce((sum, s) => sum + s.dues, 0),
      students: new Set(records.map((r) => r.studentId)).size,
      rate: billed > 0 ? Math.round((collected / billed) * 100) : 0,
    };
  }, [summaries, records]);

  const money = (n: number) => formatCurrency(n, currency);

  if (records.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        No student fee records found for the selected period.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall figures */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Billed', value: money(totals.billed), sub: `${totals.students} students` },
          { label: 'Collected', value: money(totals.collected), sub: `${totals.rate}% of billed`, swatch: colors.collected },
          { label: 'Outstanding Dues', value: money(totals.dues), sub: `${100 - totals.rate}% of billed`, swatch: colors.dues },
          { label: 'Collection Rate', value: `${totals.rate}%`, sub: `${records.length} fee records` },
        ].map((tile) => (
          <div key={tile.label} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {tile.swatch && <span className="h-2.5 w-2.5 rounded-sm" style={{ background: tile.swatch }} />}
              {tile.label}
            </p>
            <p className="mt-1 text-base font-bold text-slate-900 sm:text-lg">{tile.value}</p>
            <p className="text-[11px] text-slate-500">{tile.sub}</p>
          </div>
        ))}
      </div>

      {/* Overall chart: one stacked bar per class */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">Overall: Collected vs Dues by Class</h3>
          <Legend colors={colors} />
        </div>
        <div className="h-72 w-full min-w-0" role="img" aria-label="Stacked bar chart of collected and outstanding fees for each class. The same figures are in the table below.">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={visible} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={colors.grid} />
              <XAxis
                dataKey="shortName"
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
                tick={{ fill: colors.axis, fontSize: 11 }}
              />
              <YAxis
                tickFormatter={compact}
                tickLine={false}
                axisLine={false}
                width={44}
                tick={{ fill: colors.axis, fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: isDarkMode ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.08)' }}
                content={<ClassTooltip currency={currency} colors={colors} />}
              />
              {/* 2px surface-colored stroke separates the stacked segments */}
              <Bar dataKey="collected" name="Collected" stackId="fees" fill={colors.collected}
                   stroke={colors.surface} strokeWidth={2} maxBarSize={44} isAnimationActive={false} />
              <Bar dataKey="dues" name="Dues" stackId="fees" fill={colors.dues}
                   stroke={colors.surface} strokeWidth={2} radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class-wise cards, each with its own small chart */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">Class-wise Report</h3>
          <Legend colors={colors} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
          {visible.map((s) => (
            <ClassCard key={s.className} summary={s} colors={colors} money={money} />
          ))}
        </div>
      </div>

      {/* Table view of the same numbers (also what prints cleanly) */}
      <div className="overflow-x-auto">
        <table className="w-full border border-slate-200 text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-700">
            <tr>
              <th className="px-3 py-2.5">Class</th>
              <th className="px-3 py-2.5 text-right">Students</th>
              <th className="px-3 py-2.5 text-right">Billed</th>
              <th className="px-3 py-2.5 text-right">Collected</th>
              <th className="px-3 py-2.5 text-right">Dues</th>
              <th className="px-3 py-2.5 text-right">Collection %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {visible.filter((s) => s.records > 0).map((s) => (
              <tr key={s.className} className="hover:bg-slate-50">
                <td className="px-3 py-2.5 font-bold text-slate-900">{s.className}</td>
                <td className="px-3 py-2.5 text-right">{s.students}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{money(s.billed)}</td>
                <td className="px-3 py-2.5 text-right text-slate-700">{money(s.collected)}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{money(s.dues)}</td>
                <td className="px-3 py-2.5 text-right">{s.rate}%</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold text-slate-900">
              <td className="px-3 py-2.5">All Classes</td>
              <td className="px-3 py-2.5 text-right">{totals.students}</td>
              <td className="px-3 py-2.5 text-right">{money(totals.billed)}</td>
              <td className="px-3 py-2.5 text-right">{money(totals.collected)}</td>
              <td className="px-3 py-2.5 text-right">{money(totals.dues)}</td>
              <td className="px-3 py-2.5 text-right">{totals.rate}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

type Colors = typeof PALETTE.light;

const Legend: React.FC<{ colors: Colors }> = ({ colors }) => (
  <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.collected }} /> Collected
    </span>
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.dues }} /> Dues
    </span>
  </div>
);

const ClassTooltip: React.FC<any> = ({ active, payload, currency, colors }) => {
  if (!active || !payload?.length) return null;
  const s: ClassSummary = payload[0].payload;
  const money = (n: number) => formatCurrency(n, currency);
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-bold text-slate-900">{s.className}</p>
      <p className="text-[11px] text-slate-500">{s.students} students · {s.records} records</p>
      <div className="mt-1.5 space-y-0.5 text-slate-700">
        <p className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ background: colors.collected }} />
          Collected <strong className="ml-auto pl-3 text-slate-900">{money(s.collected)}</strong>
        </p>
        <p className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ background: colors.dues }} />
          Dues <strong className="ml-auto pl-3 text-slate-900">{money(s.dues)}</strong>
        </p>
        <p className="flex border-t border-slate-100 pt-0.5">
          Billed <strong className="ml-auto pl-3 text-slate-900">{money(s.billed)}</strong>
        </p>
      </div>
    </div>
  );
};

interface ClassCardProps {
  summary: ClassSummary;
  colors: Colors;
  money: (n: number) => string;
}

const ClassCard: React.FC<ClassCardProps> = ({ summary: s, colors, money }) => {
  const empty = s.records === 0;
  const collectedPct = s.billed > 0 ? (s.collected / s.billed) * 100 : 0;
  const duesPct = s.billed > 0 ? (s.dues / s.billed) * 100 : 0;

  return (
    <div className={`break-inside-avoid rounded-xl border border-slate-200 bg-white p-4 ${empty ? 'opacity-60' : ''}`}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">{s.className}</p>
        {!empty && <p className="text-lg font-bold text-slate-900">{s.rate}%</p>}
      </div>
      <p className="text-[11px] text-slate-500">
        {empty ? 'No fee records for this period' : `${s.students} students · billed ${money(s.billed)}`}
      </p>

      {!empty && (
        <>
        {/* Small graph: one bar split into collected / dues */}
        <div
          className="mt-3 flex h-3 w-full gap-[2px] overflow-hidden rounded bg-slate-100"
          title={`Collected ${money(s.collected)} · Dues ${money(s.dues)}`}
          role="img"
          aria-label={`${s.className}: ${s.rate}% collected`}
        >
          {collectedPct > 0 && (
            <div className="h-full first:rounded-l last:rounded-r" style={{ width: `${collectedPct}%`, background: colors.collected }} />
          )}
          {duesPct > 0 && (
            <div className="h-full first:rounded-l last:rounded-r" style={{ width: `${duesPct}%`, background: colors.dues }} />
          )}
        </div>

        <div className="mt-2 space-y-1 text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: colors.collected }} />
            Collected <strong className="text-slate-900">{money(s.collected)}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: colors.dues }} />
            Dues <strong className="text-slate-900">{money(s.dues)}</strong>
          </span>
        </div>
        </>
      )}
    </div>
  );
};

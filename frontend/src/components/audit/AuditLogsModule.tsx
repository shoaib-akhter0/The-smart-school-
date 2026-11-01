import React, { useState } from 'react';
import {
  History, Search, Filter, ShieldAlert, ArrowRight, Clock, UserCheck,
  Shield, CheckCircle2, Lock, RefreshCw, FileText, Tag, User, Layers
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { useAuth } from '../../context/AuthContext';
import { AuditLog, UserRole } from '../../types';

export const AuditLogsModule: React.FC = () => {
  const { auditLogs, refreshData, isLoading } = useSchool();
  const { currentUser, isGM, isAccountant, isHOD } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    if (selectedAction !== 'all' && log.action !== selectedAction) return false;
    if (selectedCategory !== 'all' && (log.category || 'GENERAL') !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.recordIdentifier.toLowerCase().includes(q) ||
        log.performedBy.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q)) ||
        (log.category && log.category.toLowerCase().includes(q)) ||
        (log.reason && log.reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'RECORD_CREATED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'RECORD_EDITED':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'HOD_REVISION':
        return 'bg-purple-50 text-purple-800 border-purple-200 font-bold';
      case 'RECORD_FLAGGED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'PAYMENT_RECORDED':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'IMPORT_COMPLETED':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'SETTINGS_UPDATED':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'USER_UPDATED':
        return 'bg-red-50 text-[#C62828] border-red-200 font-semibold';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'GM':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'ACCOUNTANT':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'HOD':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Role-Specific Visibility Clearance Banner */}
      <div className="rounded-2xl border bg-white p-5 shadow-xs transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C62828] text-white shadow-md shadow-red-900/20">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C62828]">
                  Compliance &amp; Governance
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                  Role Clearance: {currentUser.role}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Role-Based Audit Trail &amp; Activity Ledger
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                {isAccountant && (
                  <span>
                    <strong>Accountant's Isolated Audit View:</strong> You have access <em>exclusively to changes and log entries you personally recorded</em> ({currentUser.name}). Modifications or logs created by the Super Admin or other staff are restricted.
                  </span>
                )}
                {isHOD && (
                  <span>
                    <strong>HOD Oversight View:</strong> You are viewing activity logs generated <em>exclusively by the Senior Accountant</em>. Super Admin administrative logs remain restricted.
                  </span>
                )}
                {isGM && (
                  <span>
                    <strong>Super Admin Executive View:</strong> Comprehensive institutional oversight. You can view <em>both your own executive actions and all financial entries recorded by the Senior Accountant</em>.
                  </span>
                )}
                {!isAccountant && !isHOD && !isGM && (
                  <span>Authorized role audit trail monitor.</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              onClick={() => refreshData()}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition disabled:opacity-50"
              title="Refresh audit entries from server"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Visible Logs
              </span>
              <strong className="text-base font-bold text-slate-900 leading-tight">
                {auditLogs.length}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice #, actor name, reason, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-[#C62828] focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#C62828] focus:outline-none"
            >
              <option value="all">All Audit Actions</option>
              <option value="RECORD_CREATED">RECORD CREATED</option>
              <option value="RECORD_EDITED">RECORD EDITED</option>
              <option value="PAYMENT_RECORDED">PAYMENT RECORDED</option>
              <option value="HOD_REVISION">HOD REVISION</option>
              <option value="RECORD_FLAGGED">RECORD FLAGGED</option>
              <option value="SETTINGS_UPDATED">SETTINGS UPDATED</option>
              <option value="USER_UPDATED">USER / PROFILE UPDATED</option>
              <option value="IMPORT_COMPLETED">IMPORT COMPLETED</option>
            </select>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#C62828] focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="STUDENT_FEES">Student Fees Ledger</option>
              <option value="VENDOR_PAYABLES">Vendor Payables</option>
              <option value="PAYMENTS">Payments &amp; Receipts</option>
              <option value="SYSTEM_SETTINGS">System Configuration</option>
              <option value="USER_PROFILE">User Profile &amp; Picture</option>
              <option value="USER_GOVERNANCE">User Governance</option>
              <option value="GENERAL">General Operational</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Entries List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Lock className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">
              No audit log entries matching visibility clearance or filter criteria.
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              If you are signed in as an Accountant, only entries you personally generated are visible. As HOD, only Accountant logs are displayed.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div key={log.id} className="p-4.5 hover:bg-slate-50/70 transition text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>

                    {log.category && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600 border border-slate-200">
                        {log.category}
                      </span>
                    )}

                    <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {log.recordIdentifier}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      ({log.modelName})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-[#C62828]" />
                      <span>
                        <strong>{log.performedBy}</strong>{' '}
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${getRoleBadge(log.performedByRole)}`}>
                          {log.performedByRole}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Details note */}
                {log.details && (
                  <p className="mt-2 text-xs text-slate-700 font-medium">
                    {log.details}
                  </p>
                )}

                {/* Reason Banner */}
                {log.reason && (
                  <div className="mt-2 rounded-lg bg-amber-50/70 p-2.5 border border-amber-200 text-amber-900 text-[11px]">
                    <strong>Authorized Reason / Justification:</strong> {log.reason}
                  </div>
                )}

                {/* Before / After Values toggle */}
                {(log.previousValues || log.newValues) && (
                  <div className="mt-2.5">
                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="text-[11px] font-semibold text-[#C62828] hover:underline flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide Before & After State ▲' : 'Inspect Audit Snapshot Values ▼'}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                        {log.previousValues && (
                          <div className="rounded-xl bg-rose-50/60 p-3 border border-rose-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block mb-1">
                              Previous Value (Original)
                            </span>
                            <pre className="font-mono text-[11px] text-rose-900 whitespace-pre-wrap overflow-x-auto">
                              {JSON.stringify(log.previousValues, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.newValues && (
                          <div className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                              New Value (Updated)
                            </span>
                            <pre className="font-mono text-[11px] text-emerald-900 whitespace-pre-wrap overflow-x-auto">
                              {JSON.stringify(log.newValues, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

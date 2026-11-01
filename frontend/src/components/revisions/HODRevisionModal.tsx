import React, { useState } from 'react';
import { X, FileEdit, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { useAuth } from '../../context/AuthContext';

interface HODRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  recordType: 'student' | 'vendor';
}

export const HODRevisionModal: React.FC<HODRevisionModalProps> = ({
  isOpen,
  onClose,
  record,
  recordType,
}) => {
  const { submitRevision, settings } = useSchool();
  const { currentUser } = useAuth();

  const [field, setField] = useState('totalAmount');
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !record) return null;

  const currentVal = record[field];

  const fieldOptions = recordType === 'student'
    ? [
        { key: 'totalAmount', label: `Total Payable Amount (${settings.currencyCode})` },
        { key: 'category', label: 'Fee Category' },
        { key: 'dueDate', label: 'Payment Due Date' },
        { key: 'month', label: 'Billing Month' },
        { key: 'year', label: 'Billing Year' },
        { key: 'notes', label: 'Notes & Remarks' },
      ]
    : [
        { key: 'totalAmount', label: `Total Bill Amount (${settings.currencyCode})` },
        { key: 'category', label: 'Vendor Category' },
        { key: 'dueDate', label: 'Payment Due Date' },
        { key: 'description', label: 'Goods / Services Description' },
        { key: 'month', label: 'Billing Month' },
        { key: 'year', label: 'Billing Year' },
        { key: 'notes', label: 'Notes & Remarks' },
      ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('A formal justification / board approval reason is mandatory for authorized revisions.');
      return;
    }

    if (field === 'totalAmount') {
      const num = Number(newValue);
      if (isNaN(num) || num <= 0) {
        setError('Total amount must be a positive number.');
        return;
      }
      if (num < record.paidAmount) {
        setError(`New total amount cannot be less than already collected amount (${record.paidAmount}).`);
        return;
      }
    }

    setIsSubmitting(true);
    const res = await submitRevision(recordType, record.id, field, newValue, reason);
    setIsSubmitting(false);

    if (res.success) {
      setReason('');
      setNewValue('');
      onClose();
    } else {
      setError(res.error || 'Failed to submit revision');
    }
  };

  const entityTitle = recordType === 'student' ? record.studentName : record.vendorName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Authorized HOD Revision
              </h3>
              <p className="text-xs text-slate-500">{entityTitle} • {record.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Audit policy banner */}
        <div className="mt-4 rounded-xl bg-blue-50 p-3 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong>Audit Integrity Enforced:</strong> Original Accountant baseline values remain logged in the permanent audit trail. Your modification will be stamped with your name ({currentUser.name}) and date.
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Field to Revise *
            </label>
            <select
              value={field}
              onChange={(e) => {
                setField(e.target.value);
                setNewValue('');
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
            >
              {fieldOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-slate-600">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Saved Value:</span>
            <div className="font-mono font-bold text-slate-900 mt-0.5">
              {String(currentVal || '—')}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              New Revised Value *
            </label>
            <input
              type={field === 'totalAmount' ? 'number' : field === 'dueDate' ? 'date' : 'text'}
              required
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter approved new value"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mandatory Revision Reason / Board Approval Note *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State why this value was corrected (e.g. Sibling discount approved by Board of Governors in meeting #42)..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Recording Revision...' : 'Commit Revision to Audit Log'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

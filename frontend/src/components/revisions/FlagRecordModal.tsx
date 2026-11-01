import React, { useState } from 'react';
import { X, Flag, CheckCircle2 } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { useAuth } from '../../context/AuthContext';

interface FlagRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  recordType: 'student' | 'vendor';
}

export const FlagRecordModal: React.FC<FlagRecordModalProps> = ({
  isOpen,
  onClose,
  record,
  recordType,
}) => {
  const { flagRecord } = useSchool();
  const { currentUser } = useAuth();

  const [reason, setReason] = useState(record?.flagReason || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !record) return null;

  const isAlreadyFlagged = Boolean(record.isFlaggedForReview);

  const handleFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for flagging this record.');
      return;
    }
    setIsSubmitting(true);
    const res = await flagRecord(recordType, record.id, reason, false);
    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to flag record');
    }
  };

  const handleUnflag = async () => {
    setIsSubmitting(true);
    const res = await flagRecord(recordType, record.id, 'Flag resolved', true);
    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to clear flag');
    }
  };

  const entityTitle = recordType === 'student' ? record.studentName : record.vendorName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`rounded-lg p-2 ${isAlreadyFlagged ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isAlreadyFlagged ? 'Review Active Flag' : 'Flag Record for Review'}
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

        {error && (
          <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleFlag} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {isAlreadyFlagged ? 'Flag Reason Note:' : 'Reason for Discrepancy / Review Request:'}
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Total fee does not reflect concession granted by Board, please reconcile..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {isAlreadyFlagged ? (
              <button
                type="button"
                onClick={handleUnflag}
                disabled={isSubmitting}
                className="rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-700 transition"
              >
                Mark Resolved &amp; Clear Flag
              </button>
            ) : <span />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700 transition"
              >
                {isSubmitting ? 'Updating...' : isAlreadyFlagged ? 'Update Flag Note' : 'Flag Record'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

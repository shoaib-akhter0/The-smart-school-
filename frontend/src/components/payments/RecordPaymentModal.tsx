import React, { useState } from 'react';
import { X, Receipt, CheckCircle2, DollarSign } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { formatCurrency } from '../../utils/financeRules';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  recordType: 'student' | 'vendor';
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  record,
  recordType,
}) => {
  const { recordPayment, settings } = useSchool();

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE'>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !record) return null;

  const currentBalance = record.balance || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    if (numAmount > currentBalance) {
      setError(`Payment amount (${formatCurrency(numAmount, settings.currencyCode)}) cannot exceed remaining balance (${formatCurrency(currentBalance, settings.currencyCode)}).`);
      return;
    }

    setIsSubmitting(true);
    const res = await recordPayment(recordType, record.id, {
      amount: numAmount,
      paymentDate,
      paymentMethod,
      referenceNumber: referenceNumber || (paymentMethod === 'CASH' ? 'CASH-COUNTER' : `REF-${Date.now()}`),
      receiptNotes,
    });
    setIsSubmitting(false);

    if (res.success) {
      setAmount('');
      setReferenceNumber('');
      setReceiptNotes('');
      onClose();
    } else {
      setError(res.error || 'Failed to record payment transaction.');
    }
  };

  const title = recordType === 'student' ? 'Record Student Fee Payment' : 'Disburse Vendor Installment';
  const entityName = recordType === 'student' ? record.studentName : record.vendorName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">{entityName} • {record.invoiceNumber}</p>
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
          <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Balance status banner */}
        <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Total Billed:</span>{' '}
            <strong className="text-slate-900">{formatCurrency(record.totalAmount, settings.currencyCode)}</strong>
          </div>
          <div>
            <span className="text-slate-500">Remaining Balance:</span>{' '}
            <strong className="text-amber-700">{formatCurrency(currentBalance, settings.currencyCode)}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Payment Amount ({settings.currencyCode}) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                required
                max={currentBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Max: ${currentBalance}`}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setAmount(String(currentBalance))}
                className="absolute right-2 top-2 text-[10px] font-bold text-[#D81A28] bg-red-50 px-2 py-0.5 rounded hover:bg-red-100 transition"
              >
                Pay Full Balance
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="BANK_TRANSFER">Bank Transfer / Online IBFT</option>
                <option value="CASH">Cash Counter Receipt</option>
                <option value="CHEQUE">Bank Cheque / Pay Order</option>
                <option value="ONLINE">Online Portal Gateway</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Transaction Reference / Cheque Number
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. UBL-CHQ-104928 or IBFT-TXN-998231"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Receipt Remarks &amp; Clearance Notes
            </label>
            <textarea
              rows={2}
              value={receiptNotes}
              onChange={(e) => setReceiptNotes(e.target.value)}
              placeholder="e.g. Partial installment cleared by accounts..."
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
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Recording...' : 'Confirm & Commit Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

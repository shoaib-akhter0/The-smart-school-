import React, { useState } from 'react';
import { X, Truck, CheckCircle2, DollarSign } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { VendorInvoice } from '../../types';

interface AddVendorInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToEdit?: VendorInvoice | null;
}

export const AddVendorInvoiceModal: React.FC<AddVendorInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceToEdit,
}) => {
  const { addVendorInvoice, updateVendorInvoice, settings } = useSchool();

  const isEdit = Boolean(invoiceToEdit);

  const [formData, setFormData] = useState({
    vendorId: 'VND-101',
    vendorName: 'Apex Stationery & Tech Supplies',
    category: 'Stationery & Printing',
    description: '',
    totalAmount: '',
    paidAmount: '0',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
    month: 'October',
    year: '2026',
    invoiceNumber: `INV-VND-${Date.now().toString().slice(-6)}`,
    paymentMethod: 'CHEQUE',
    paymentRef: '',
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const total = Number(formData.totalAmount);
    const paid = Number(formData.paidAmount || 0);

    if (!formData.vendorName.trim()) {
      setError('Supplier / Company name is required.');
      return;
    }
    if (isNaN(total) || total <= 0) {
      setError('Total bill amount must be greater than zero.');
      return;
    }
    if (paid < 0) {
      setError('Paid amount cannot be negative.');
      return;
    }
    if (paid > total) {
      setError('Paid amount cannot exceed total bill amount.');
      return;
    }

    setIsSubmitting(true);
    let res;
    if (isEdit && invoiceToEdit) {
      res = await updateVendorInvoice(invoiceToEdit.id, formData);
    } else {
      res = await addVendorInvoice(formData);
    }
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to save vendor invoice');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEdit ? 'Edit Vendor Bill' : 'Add New Vendor Bill / Payable'}
              </h3>
              <p className="text-xs text-slate-500">
                Category Two • Supplier liabilities, utilities, and contractual billing
              </p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vendor / Supplier Name *
              </label>
              <input
                type="text"
                required
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                placeholder="e.g. Apex Stationery"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vendor ID *
              </label>
              <input
                type="text"
                required
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                placeholder="e.g. VND-101"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vendor Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                {settings.vendorCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Invoice / Bill Number *
              </label>
              <input
                type="text"
                required
                disabled={isEdit}
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* Dates & Period */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block mb-2">
              Billing Period &amp; Schedule
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Billing Month *
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Billing Year *
                </label>
                <input
                  type="number"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bill Issue Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Total Bill Amount ({settings.currencyCode}) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                placeholder="100000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>

            {!isEdit && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Initial Disbursed Amount ({settings.currencyCode})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-blue-700 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Goods / Services Description *
            </label>
            <textarea
              rows={2}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Bulk supply of 500 Reams A4 paper & 10,000 midterm exam sheets..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none"
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
              className="flex items-center gap-1.5 rounded-lg bg-[#D81A28] px-5 py-2 font-semibold text-white shadow-xs hover:bg-[#B91220] transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : isEdit ? 'Update Bill' : 'Save Vendor Bill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

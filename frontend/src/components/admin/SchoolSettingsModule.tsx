import React, { useEffect, useState } from 'react';
import { Settings, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';

export const SchoolSettingsModule: React.FC = () => {
  const { settings, updateSettings } = useSchool();

  const [formData, setFormData] = useState({ ...settings });
  // Show the saved settings once they arrive from the server (and after each save).
  useEffect(() => setFormData({ ...settings }), [settings]);
  const [newFeeCategory, setNewFeeCategory] = useState('');
  const [newVendorCategory, setNewVendorCategory] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateSettings(formData);
    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const addFeeCategory = () => {
    if (newFeeCategory.trim() && !formData.feeCategories.includes(newFeeCategory.trim())) {
      setFormData({
        ...formData,
        feeCategories: [...formData.feeCategories, newFeeCategory.trim()],
      });
      setNewFeeCategory('');
    }
  };

  const removeFeeCategory = (cat: string) => {
    setFormData({
      ...formData,
      feeCategories: formData.feeCategories.filter((c) => c !== cat),
    });
  };

  const addVendorCategory = () => {
    if (newVendorCategory.trim() && !formData.vendorCategories.includes(newVendorCategory.trim())) {
      setFormData({
        ...formData,
        vendorCategories: [...formData.vendorCategories, newVendorCategory.trim()],
      });
      setNewVendorCategory('');
    }
  };

  const removeVendorCategory = (cat: string) => {
    setFormData({
      ...formData,
      vendorCategories: formData.vendorCategories.filter((c) => c !== cat),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-red-100 px-2.5 py-0.5 text-xs font-bold text-[#D81A28]">
              Institutional Settings
            </span>
            <span className="text-xs text-slate-500 font-medium">
              School Profile &amp; Financial Categories
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            School Configuration &amp; Financial Parameters
          </h2>
          <p className="text-xs text-slate-500">
            Customize school identity, operating currency, tax identifiers, and dynamic fee categories.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Core School Details */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Institutional Identity &amp; Financial Period
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Official School Name *
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Operating Currency Code *
              </label>
              <input
                type="text"
                required
                value={formData.currencyCode}
                onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Current Academic Session *
              </label>
              <input
                type="text"
                required
                value={formData.academicSession}
                onChange={(e) => setFormData({ ...formData, academicSession: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Active Financial Year *
              </label>
              <input
                type="text"
                required
                value={formData.financialYear}
                onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NTN / Tax Registration Number
              </label>
              <input
                type="text"
                value={formData.taxRegistrationNumber}
                onChange={(e) => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Accounts Office Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Campus Physical Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Category Managers */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Student Fee Categories */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Student Fee Categories
            </h3>
            <p className="text-[11px] text-slate-500">
              Configure institution-defined charge types instead of hardcoded labels.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New fee category (e.g. Sports Kit)..."
                value={newFeeCategory}
                onChange={(e) => setNewFeeCategory(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={addFeeCategory}
                className="rounded-lg bg-[#D81A28] px-3 py-1.5 font-semibold text-white hover:bg-[#B91220] shadow-xs"
              >
                Add
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pt-2">
              {formData.feeCategories.map((cat) => (
                <div key={cat} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 border border-slate-200">
                  <span className="font-semibold text-slate-800">{cat}</span>
                  <button
                    type="button"
                    onClick={() => removeFeeCategory(cat)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Payables Categories */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Vendor Expense Categories
            </h3>
            <p className="text-[11px] text-slate-500">
              Classify school operating overheads and supplier lines.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New vendor category (e.g. Security)..."
                value={newVendorCategory}
                onChange={(e) => setNewVendorCategory(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={addVendorCategory}
                className="rounded-lg bg-[#D81A28] px-3 py-1.5 font-semibold text-white hover:bg-[#B91220] shadow-xs"
              >
                Add
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pt-2">
              {formData.vendorCategories.map((cat) => (
                <div key={cat} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 border border-slate-200">
                  <span className="font-semibold text-slate-800">{cat}</span>
                  <button
                    type="button"
                    onClick={() => removeVendorCategory(cat)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-[#D81A28] px-6 py-2.5 font-semibold text-white shadow-xs hover:bg-[#B91220] transition"
          >
            <Save className="h-4 w-4" />
            <span>Save School Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

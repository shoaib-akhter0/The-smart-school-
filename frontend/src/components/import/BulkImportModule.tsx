import React, { useState } from 'react';
import {
  UploadCloud, FileSpreadsheet, Download, CheckCircle2,
  AlertTriangle, XCircle, FileText, ArrowRight, RefreshCw, AlertCircle
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { useAuth } from '../../context/AuthContext';
import { validateStudentImportRow } from '../../utils/financeRules';

export const BulkImportModule: React.FC = () => {
  const { commitBulkImport, studentFees, vendorInvoices, settings } = useSchool();
  const { isAccountant } = useAuth();

  const [category, setCategory] = useState<'student_fees' | 'vendor_invoices'>('student_fees');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<Array<{ rowIdx: number; row: any; isValid: boolean; errors: string[] }>>([]);
  const [importSummary, setImportSummary] = useState<{ imported: number; rejected: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Template Download Handler
  const handleDownloadTemplate = (type: 'student' | 'vendor') => {
    if (type === 'student') {
      const headers = ['studentId', 'studentName', 'gradeClass', 'category', 'totalAmount', 'paidAmount', 'dueDate', 'month', 'year', 'invoiceNumber', 'notes'];
      const sampleRows = [
        ['STD-2026-201', 'Farhan Ali', 'Grade 10-A', 'Tuition Fee', '24000', '12000', '2026-10-30', 'October', '2026', 'INV-STD-IMP-001', 'Sample import record 1'],
        ['STD-2026-202', 'Sara Tariq', 'Grade 9-B', 'Annual Examination Fee', '15000', '0', '2026-11-05', 'November', '2026', 'INV-STD-IMP-002', 'Sample import record 2'],
      ];
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'Template_Student_Fees.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['vendorId', 'vendorName', 'category', 'description', 'totalAmount', 'paidAmount', 'dueDate', 'month', 'year', 'invoiceNumber', 'notes'];
      const sampleRows = [
        ['VND-101', 'Apex Stationery & Tech Supplies', 'Stationery & Printing', 'Answer scripts reams', '45000', '20000', '2026-11-15', 'November', '2026', 'INV-VND-IMP-001', 'Sample vendor bill'],
      ];
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'Template_Vendor_Bills.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // CSV File Upload & Parsing Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        alert('The uploaded CSV file does not contain any data rows.');
        return;
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const existingInvoices = new Set(
        category === 'student_fees'
          ? studentFees.map(f => f.invoiceNumber.toUpperCase())
          : vendorInvoices.map(i => i.invoiceNumber.toUpperCase())
      );

      const rows: any[] = [];
      const validations: Array<{ rowIdx: number; row: any; isValid: boolean; errors: string[] }> = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        rows.push(rowObj);

        // Live row-by-row validation
        const val = validateStudentImportRow(rowObj, existingInvoices);
        if (val.isValid) {
          existingInvoices.add(String(rowObj.invoiceNumber).toUpperCase());
        }
        validations.push({
          rowIdx: i,
          row: rowObj,
          isValid: val.isValid,
          errors: val.errors,
        });
      }

      setParsedRows(rows);
      setValidationResults(validations);
    };

    reader.readAsText(file);
  };

  // Commit valid rows to server
  const handleCommit = async () => {
    const validRows = validationResults.filter(v => v.isValid).map(v => v.row);
    if (validRows.length === 0) {
      alert('No valid rows available to import.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await commitBulkImport(category, validRows);
      setImportSummary({
        imported: res.importedCount || validRows.length,
        rejected: validationResults.length - validRows.length,
      });
      setParsedRows([]);
      setValidationResults([]);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = validationResults.filter(v => v.isValid).length;
  const invalidCount = validationResults.filter(v => !v.isValid).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              Bulk Data Import Station
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Excel &amp; CSV Template Engine
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Data Upload, Spreadsheet Validation &amp; Batch Ingestion
          </h2>
          <p className="text-xs text-slate-500">
            Preview, validate row-by-row, catch duplicate invoice numbers, and safely commit records with full audit logging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadTemplate('student')}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>Student CSV Template</span>
          </button>
          <button
            onClick={() => handleDownloadTemplate('vendor')}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>Vendor CSV Template</span>
          </button>
        </div>
      </div>

      {/* Step 1: Select Category & Upload File */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Step 1: Choose Financial Category
          </h3>

          <div className="space-y-2">
            <button
              onClick={() => {
                setCategory('student_fees');
                setParsedRows([]);
                setValidationResults([]);
                setImportSummary(null);
              }}
              className={`w-full rounded-xl p-3 text-left border transition flex items-center justify-between text-xs ${
                category === 'student_fees'
                  ? 'border-indigo-600 bg-indigo-50/70 font-bold text-indigo-950'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <p className="font-bold">Category 1: Student Fee Records</p>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Tuition, Exams, Lab, Transport
                </p>
              </div>
              {category === 'student_fees' && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
            </button>

            <button
              onClick={() => {
                setCategory('vendor_invoices');
                setParsedRows([]);
                setValidationResults([]);
                setImportSummary(null);
              }}
              className={`w-full rounded-xl p-3 text-left border transition flex items-center justify-between text-xs ${
                category === 'vendor_invoices'
                  ? 'border-blue-600 bg-blue-50/70 font-bold text-blue-950'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <p className="font-bold">Category 2: Vendor Payables</p>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Stationery, Power, Janitorial
                </p>
              </div>
              {category === 'vendor_invoices' && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Import Guardrails:</h4>
            <ul className="text-[11px] text-slate-500 space-y-1.5 list-disc pl-4">
              <li>Duplicate invoice numbers are rejected automatically.</li>
              <li>Invalid amounts or dates prevent row submission.</li>
              <li>Paid amount cannot exceed total payable.</li>
              <li>Every batch is timestamped in the permanent Audit Trail.</li>
            </ul>
          </div>
        </div>

        {/* Upload Box */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Step 2: Upload CSV Spreadsheet File
            </h3>

            <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-indigo-500 transition bg-slate-50/50">
              <UploadCloud className="h-10 w-10 text-indigo-500 mb-3" />
              <p className="text-xs font-bold text-slate-800">
                Click to browse or drop your prepared CSV file here
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports standard comma-separated Excel exports (.csv)
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="Upload CSV spreadsheet"
              />
            </div>

            {fileName && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-indigo-50 p-3 text-xs text-indigo-900 border border-indigo-200">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                  <span className="font-semibold">{fileName}</span>
                  <span className="text-[11px] text-slate-500">({parsedRows.length} rows detected)</span>
                </div>
                <span className="rounded bg-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                  Ready to Validate
                </span>
              </div>
            )}
          </div>

          {importSummary && (
            <div className="mt-4 rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Batch Import Successfully Committed!</span>
              </div>
              <p className="text-emerald-700 mt-1">
                <strong>{importSummary.imported}</strong> records written to database. <strong>{importSummary.rejected}</strong> invalid rows were filtered out.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Row-by-Row Live Validation Preview */}
      {validationResults.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Step 3: Row-by-Row Pre-Commit Validation Preview
              </h3>
              <p className="text-xs text-slate-500">
                Review verified rows before committing to the school database.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                  {validCount} Valid
                </span>
                {invalidCount > 0 && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 font-bold text-rose-800">
                    {invalidCount} Errors
                  </span>
                )}
              </div>

              {isAccountant && (
                <button
                  onClick={handleCommit}
                  disabled={validCount === 0 || isProcessing}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isProcessing ? 'Importing...' : `Commit ${validCount} Valid Records`}</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 sticky top-0 text-slate-600 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Row #</th>
                  <th className="py-2.5 px-3">Validation Status</th>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Validation Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {validationResults.map((v) => (
                  <tr
                    key={v.rowIdx}
                    className={`hover:bg-slate-50/80 transition ${
                      !v.isValid ? 'bg-rose-50/50' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-500">{v.rowIdx}</td>
                    <td className="py-2.5 px-3">
                      {v.isValid ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                          <AlertTriangle className="h-3 w-3" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">{v.row.invoiceNumber || '—'}</td>
                    <td className="py-2.5 px-3 font-semibold">{v.row.studentName || v.row.vendorName || '—'}</td>
                    <td className="py-2.5 px-3">{v.row.category || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{v.row.totalAmount || '—'}</td>
                    <td className="py-2.5 px-3 font-medium">{v.row.month} {v.row.year}</td>
                    <td className="py-2.5 px-3">
                      {v.isValid ? (
                        <span className="text-emerald-700 text-[11px]">All required columns verified.</span>
                      ) : (
                        <div className="text-rose-700 text-[11px] font-medium space-y-0.5">
                          {v.errors.map((err, eIdx) => (
                            <div key={eIdx}>• {err}</div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

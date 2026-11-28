import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Folder, FolderOpen, UploadCloud, Search, ChevronRight, ChevronLeft, ArrowLeft,
  FileSpreadsheet, Download, Trash2, RefreshCw, AlertCircle, CheckCircle2, X, Loader2,
} from 'lucide-react';
import { api, apiErrorMessage } from '../../services/api';
import { ExcelCell, ExcelFolder } from '../../types';

const ACCEPTED = '.xlsx,.xlsm,.csv';
const PAGE_SIZES = [50, 100, 500];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

type Notice = { type: 'success' | 'error'; text: string } | null;

export const ExcelFoldersModule: React.FC = () => {
  const [folders, setFolders] = useState<ExcelFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [folderSearch, setFolderSearch] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Opened folder
  const [openFolder, setOpenFolder] = useState<ExcelFolder | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  const loadFolders = useCallback(async () => {
    setIsLoading(true);
    try {
      setFolders(await api.excelFolders.list());
    } catch (err) {
      setNotice({ type: 'error', text: apiErrorMessage(err, 'Could not load your Excel folders.') });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setNotice(null);

    let lastUploaded: ExcelFolder | null = null;
    const failures: string[] = [];
    for (const file of files) {
      setUploadingName(file.name);
      try {
        lastUploaded = await api.excelFolders.upload(file);
      } catch (err) {
        failures.push(`${file.name}: ${apiErrorMessage(err)}`);
      }
    }
    setUploadingName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    await loadFolders();
    if (failures.length) {
      setNotice({ type: 'error', text: failures.join('\n') });
    } else if (files.length === 1 && lastUploaded) {
      setOpenFolder(lastUploaded); // jump straight into the new folder
    } else {
      setNotice({ type: 'success', text: `${files.length} files uploaded.` });
    }
  };

  const handleOpen = async (folder: ExcelFolder) => {
    setIsOpening(true);
    setNotice(null);
    try {
      setOpenFolder(await api.excelFolders.get(folder.id));
    } catch (err) {
      setNotice({ type: 'error', text: apiErrorMessage(err, 'Could not open this folder.') });
    } finally {
      setIsOpening(false);
    }
  };

  const handleDownload = async (folder: ExcelFolder) => {
    try {
      saveBlob(await api.excelFolders.download(folder.id), folder.fileName);
    } catch {
      setNotice({ type: 'error', text: 'Could not download the original file.' });
    }
  };

  const handleDelete = async (folder: ExcelFolder) => {
    if (!window.confirm(`Delete the folder "${folder.name}" and all its data? This cannot be undone.`)) return;
    try {
      await api.excelFolders.remove(folder.id);
      if (openFolder?.id === folder.id) setOpenFolder(null);
      setNotice({ type: 'success', text: `Deleted "${folder.name}".` });
      await loadFolders();
    } catch (err) {
      setNotice({ type: 'error', text: apiErrorMessage(err, 'Could not delete this folder.') });
    }
  };

  const visibleFolders = useMemo(() => {
    const q = folderSearch.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((f) =>
      [f.name, f.fileName, ...f.sheetNames].some((text) => text.toLowerCase().includes(q))
    );
  }, [folders, folderSearch]);

  const noticeBanner = notice && (
    <div
      className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-xs ${
        notice.type === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      }`}
      role={notice.type === 'error' ? 'alert' : 'status'}
    >
      <div className="flex items-start gap-2">
        {notice.type === 'error'
          ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
        <span className="whitespace-pre-line font-medium">{notice.text}</span>
      </div>
      <button onClick={() => setNotice(null)} aria-label="Dismiss message" className="shrink-0 opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  if (openFolder) {
    return (
      <div className="space-y-4">
        {noticeBanner}
        <FolderView
          key={openFolder.id}
          folder={openFolder}
          onBack={() => setOpenFolder(null)}
          onDownload={() => handleDownload(openFolder)}
          onDelete={() => handleDelete(openFolder)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">Excel Folders</span>
            <span className="text-xs font-medium text-slate-500">
              {folders.length} {folders.length === 1 ? 'folder' : 'folders'}
            </span>
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Your Excel Sheets</h2>
          <p className="text-xs text-slate-500">
            Upload any Excel or CSV file. Each file is kept as a folder — open it to see all its data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadFolders}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!!uploadingName}
            className="flex items-center gap-1.5 rounded-lg bg-[#C62828] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#A61F1F] disabled:opacity-60"
          >
            {uploadingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            <span>{uploadingName ? 'Uploading…' : 'Import Excel Sheet'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            aria-label="Choose Excel files to import"
          />
        </div>
      </div>

      {noticeBanner}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!uploadingName) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !uploadingName && fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
          isDragging ? 'border-[#C62828] bg-red-50/60' : 'border-slate-300 bg-slate-50/50 hover:border-[#C62828]'
        }`}
      >
        {uploadingName ? (
          <>
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-[#C62828]" />
            <p className="text-xs font-bold text-slate-800">Reading “{uploadingName}”…</p>
          </>
        ) : (
          <>
            <UploadCloud className="mb-2 h-8 w-8 text-[#C62828]" />
            <p className="text-xs font-bold text-slate-800">Drop Excel files here, or click to browse</p>
            <p className="mt-1 text-[11px] text-slate-500">.xlsx, .xlsm or .csv — up to 10 MB each</p>
          </>
        )}
      </div>

      {/* Folder search */}
      {folders.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={folderSearch}
            onChange={(e) => setFolderSearch(e.target.value)}
            placeholder="Search folders or sheet names…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-[#C62828]"
          />
        </div>
      )}

      {/* Folders grid */}
      {isLoading && folders.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading folders…
        </div>
      ) : folders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <Folder className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">No folders yet</p>
          <p className="text-xs text-slate-500">Import your first Excel sheet to create a folder.</p>
        </div>
      ) : visibleFolders.length === 0 ? (
        <p className="py-10 text-center text-xs text-slate-500">No folders match “{folderSearch}”.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleFolders.map((folder) => (
            <div
              key={folder.id}
              role="button"
              tabIndex={0}
              onClick={() => !isOpening && handleOpen(folder)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(folder); } }}
              className="group relative flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300"
              title={`Open ${folder.name}`}
            >
              <div className="flex items-start justify-between">
                <div className="relative">
                  <Folder className="h-12 w-12 fill-amber-300 text-amber-500 transition group-hover:hidden" />
                  <FolderOpen className="hidden h-12 w-12 fill-amber-200 text-amber-500 group-hover:block" />
                </div>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(folder); }}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    title="Download original file"
                    aria-label={`Download ${folder.fileName}`}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(folder); }}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    title="Delete folder"
                    aria-label={`Delete ${folder.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 truncate text-sm font-bold text-slate-900" title={folder.name}>{folder.name}</p>
              <p className="truncate text-[11px] text-slate-500" title={folder.fileName}>{folder.fileName}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                  {folder.sheetCount} {folder.sheetCount === 1 ? 'sheet' : 'sheets'}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                  {folder.rowCount.toLocaleString()} rows
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{formatBytes(folder.fileSize)}</span>
              </div>
              <p className="mt-3 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                {formatDate(folder.uploadedAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Inside a folder: one tab per sheet, full data table with search + paging
// -----------------------------------------------------------------------------

interface FolderViewProps {
  folder: ExcelFolder;
  onBack: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

const FolderView: React.FC<FolderViewProps> = ({ folder, onBack, onDownload, onDelete }) => {
  const sheets = folder.sheets || [];
  const [sheetIdx, setSheetIdx] = useState(0);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const sheet = sheets[sheetIdx];

  useEffect(() => {
    setPage(1);
  }, [sheetIdx, query, pageSize]);

  const filteredRows = useMemo(() => {
    if (!sheet) return [] as Array<{ row: ExcelCell[]; n: number }>;
    const all = sheet.rows.map((row, i) => ({ row, n: i + 1 }));
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(({ row }) => row.some((cell) => String(cell).toLowerCase().includes(q)));
  }, [sheet, query]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-4">
      {/* Breadcrumb + actions */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <nav className="flex items-center gap-1 text-xs text-slate-500" aria-label="Breadcrumb">
            <button onClick={onBack} className="flex items-center gap-1 font-semibold hover:text-[#C62828]">
              <ArrowLeft className="h-3.5 w-3.5" /> Excel Folders
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate font-semibold text-slate-800">{folder.name}</span>
          </nav>
          <div className="mt-2 flex items-center gap-3">
            <FolderOpen className="h-9 w-9 shrink-0 fill-amber-200 text-amber-500" />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-900">{folder.name}</h2>
              <p className="truncate text-[11px] text-slate-500">
                {folder.fileName} · {formatBytes(folder.fileSize)} · {folder.rowCount.toLocaleString()} rows ·
                uploaded {formatDate(folder.uploadedAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Download
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-xs hover:bg-rose-100"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {/* Sheets inside the folder */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Sheets">
        {sheets.map((s, i) => (
          <button
            key={`${s.name}-${i}`}
            role="tab"
            aria-selected={i === sheetIdx}
            onClick={() => setSheetIdx(i)}
            className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              i === sheetIdx
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className={`h-4 w-4 ${i === sheetIdx ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>{s.name}</span>
            <span className="rounded bg-slate-100 px-1.5 text-[10px] font-bold text-slate-600">{s.rows.length}</span>
          </button>
        ))}
      </div>

      {/* Data table */}
      {!sheet || sheet.headers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-14 text-center text-xs text-slate-500">
          This sheet is empty.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search in ${sheet.name}…`}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-emerald-600"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {query
                ? `${filteredRows.length.toLocaleString()} of ${sheet.rows.length.toLocaleString()} rows match`
                : `${sheet.rows.length.toLocaleString()} rows · ${sheet.headers.length} columns`}
            </p>
          </div>

          <div className="max-h-[65vh] overflow-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] font-semibold uppercase text-slate-600">
                <tr>
                  <th className="w-12 border-b border-slate-200 px-3 py-2.5 text-right">#</th>
                  {sheet.headers.map((h, i) => (
                    <th key={i} className="whitespace-nowrap border-b border-slate-200 px-3 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={sheet.headers.length + 1} className="py-10 text-center text-slate-500">
                      No rows match “{query}”.
                    </td>
                  </tr>
                ) : (
                  pageRows.map(({ row, n }) => (
                    <tr key={n} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2 text-right font-mono text-[10px] text-slate-400">{n}</td>
                      {sheet.headers.map((_, c) => {
                        const cell = row[c] ?? '';
                        return (
                          <td
                            key={c}
                            className={`max-w-xs truncate whitespace-nowrap px-3 py-2 ${
                              typeof cell === 'number' ? 'text-right font-mono' : ''
                            }`}
                            title={String(cell)}
                          >
                            {String(cell)}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paging */}
          <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-100 p-3 text-[11px] text-slate-600 sm:flex-row">
            <label className="flex items-center gap-2">
              Rows per page
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
              >
                {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(safePage - 1)}
                disabled={safePage <= 1}
                className="rounded-md border border-slate-200 bg-white p-1.5 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>Page {safePage} of {totalPages}</span>
              <button
                onClick={() => setPage(safePage + 1)}
                disabled={safePage >= totalPages}
                className="rounded-md border border-slate-200 bg-white p-1.5 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

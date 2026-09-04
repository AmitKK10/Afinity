import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  RotateCcw,
  Info,
  ChevronRight,
  Search,
  Check,
  Download,
  Database,
  ArrowRight,
  Clock,
  Sparkles,
  Building2,
  CreditCard,
  TrendingUp,
  Banknote,
  Smartphone,
  BookOpen,
  History,
  X,
  FileCheck2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useFinancialData } from '../../context/FinancialDataContext';
import {
  parseAndValidateImportFile,
  executeImport,
  ParsedImportData,
  ImportStrategy,
  ImportCategory,
  RecordDiffItem,
  CATEGORY_META,
  ImportExecutionResult,
} from '../../services/importService';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast: (msg: string) => void;
  onOpenCsvModal?: () => void;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const navigate = useNavigate();
  const { refreshAllData, exportBackup } = useFinancialData();

  // Step flow: 1 = upload, 2 = preview & strategy, 3 = confirmation (for replace), 4 = success summary
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<ImportStrategy>('merge');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'update' | 'unchanged'>('all');
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const [executionResult, setExecutionResult] = useState<ImportExecutionResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModal = () => {
    setStep(1);
    setIsParsing(false);
    setIsImporting(false);
    setParsedData(null);
    setSelectedStrategy('merge');
    setSelectedCategoryTab('all');
    setSearchQuery('');
    setFilterStatus('all');
    setReplaceConfirmed(false);
    setExecutionResult(null);
    setIsDragOver(false);
    setValidationError(null);
  };

  const handleFileProcess = async (file: File) => {
    setValidationError(null);
    setIsParsing(true);

    try {
      const text = await file.text();
      const result = await parseAndValidateImportFile(text, file.name, file.size);

      if (!result.isValid) {
        setValidationError(
          result.validationErrors.length > 0
            ? result.validationErrors.join('. ')
            : 'Unrecognized file schema or empty dataset.'
        );
        setParsedData(null);
      } else {
        setParsedData(result);
        setStep(2);
      }
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to read or parse the selected file.');
      setParsedData(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDownloadSafetyBackup = async () => {
    try {
      const data = await exportBackup();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `afinity_safety_backup_before_import_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      onSuccessToast('✓ Safety backup exported successfully');
    } catch {
      onSuccessToast('Failed to generate safety backup');
    }
  };

  const handleProceedToImport = async () => {
    if (!parsedData) return;

    if (selectedStrategy === 'replace' && step === 2) {
      // Need confirmation step first
      setStep(3);
      return;
    }

    setIsImporting(true);
    try {
      const res = await executeImport(parsedData, selectedStrategy);
      if (res.success) {
        await refreshAllData();
        setExecutionResult(res);
        setStep(4);
        onSuccessToast(`✓ Successfully imported ${res.addedCount + res.updatedCount} records`);
      } else {
        setValidationError(res.errors.join('. ') || 'Import failed during database transaction.');
      }
    } catch (err: any) {
      setValidationError(err?.message || 'An unexpected error occurred during import.');
    } finally {
      setIsImporting(false);
    }
  };

  // Filter preview diff items
  const filteredDiffItems = (parsedData?.diffItems || []).filter((item) => {
    if (selectedCategoryTab !== 'all' && item.category !== selectedCategoryTab) {
      return false;
    }
    if (filterStatus !== 'all' && item.status !== filterStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchSub = item.subtitle?.toLowerCase().includes(q);
      const matchCat = item.categoryLabel?.toLowerCase().includes(q);
      if (!matchName && !matchSub && !matchCat) return false;
    }
    return true;
  });

  const getCategoryIcon = (cat: ImportCategory) => {
    switch (cat) {
      case 'bankAccounts': return <Building2 className="w-3.5 h-3.5 text-blue-400" />;
      case 'fixedDeposits': return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
      case 'cashHoldings': return <Banknote className="w-3.5 h-3.5 text-amber-400" />;
      case 'wallets': return <Smartphone className="w-3.5 h-3.5 text-cyan-400" />;
      case 'creditCards': return <CreditCard className="w-3.5 h-3.5 text-rose-400" />;
      case 'creditLimitGroups': return <Layers className="w-3.5 h-3.5 text-purple-400" />;
      case 'investmentHoldings': return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
      case 'ipoApplications': return <Sparkles className="w-3.5 h-3.5 text-teal-400" />;
      case 'khatabookEntries': return <BookOpen className="w-3.5 h-3.5 text-orange-400" />;
      case 'snapshots': return <History className="w-3.5 h-3.5 text-sky-400" />;
      default: return <Database className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetModal();
        onClose();
      }}
      title="Import Financial Data"
      subtitle="Safely import previously exported Afinity JSON backups or CSV ledgers"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4 py-1 text-slate-200">
        {/* ========================================================================= */}
        {/* STEP 1: FILE SELECTION / DROPZONE */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Validation Error Banner if any */}
            {validationError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">File Validation Failed</span>
                  <p className="text-[11px] text-rose-300/90 leading-relaxed">{validationError}</p>
                </div>
              </div>
            )}

            {/* Drag & Drop Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 relative group',
                isDragOver
                  ? 'bg-cyan-950/40 border-cyan-400 shadow-xl shadow-cyan-950/50 scale-[1.01]'
                  : 'bg-slate-900/70 hover:bg-slate-900 border-slate-700/80 hover:border-cyan-500/60 shadow-lg'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,text/csv,application/json"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-950 to-blue-900 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner group-hover:scale-105 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-100 font-heading">
                  {isDragOver ? 'Drop file here to validate' : 'Select or drop your Afinity data file'}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Supports full vault JSON backups (<code className="text-cyan-400">.json</code>) or Master & Table CSVs (<code className="text-emerald-400">.csv</code>).
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 flex items-center gap-1.5">
                  <FileJson className="w-3.5 h-3.5" />
                  JSON Vault Backup
                </span>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Master / Table CSV
                </span>
              </div>
            </div>

            {/* Supported Categories & Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 font-heading">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Duplicate & Overwrite Safety</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Afinity analyzes every record before importing. You can choose to merge updates or add only new records without deleting existing entries.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 font-heading">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Supported Ledgers</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Banks, FDs, Cash Lockers, Digital Wallets, Credit Cards, Stocks/MFs, IPOs, Khatabook, and Snapshots.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PREVIEW, DIFFERENTIAL ANALYSIS & STRATEGY SELECTION */}
        {/* ========================================================================= */}
        {step === 2 && parsedData && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top File Summary Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  {parsedData.format === 'json' ? <FileJson className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-heading truncate max-w-xs sm:max-w-md">
                      {parsedData.fileName}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.2 rounded uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {parsedData.format === 'json' ? 'JSON Backup' : parsedData.format === 'master_csv' ? 'Master CSV' : 'Table CSV'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {(parsedData.fileSize / 1024).toFixed(1)} KB • {parsedData.totalRecordsCount} records found
                    {parsedData.exportedAt && ` • Exported ${formatFinancialDate(parsedData.exportedAt)}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 self-start sm:self-auto cursor-pointer"
              >
                Change File
              </button>
            </div>

            {/* Differential Action Counters */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setFilterStatus(filterStatus === 'new' ? 'all' : 'new')}
                className={cn(
                  'p-3 rounded-2xl border text-left transition-all cursor-pointer',
                  filterStatus === 'new'
                    ? 'bg-emerald-950/70 border-emerald-500 ring-1 ring-emerald-500/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-emerald-800/60'
                )}
              >
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  New Records
                </span>
                <span className="text-lg font-bold text-emerald-300 font-heading">
                  +{parsedData.counts.newCount}
                </span>
                <span className="text-[10px] text-slate-400 block">Will be added</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus(filterStatus === 'update' ? 'all' : 'update')}
                className={cn(
                  'p-3 rounded-2xl border text-left transition-all cursor-pointer',
                  filterStatus === 'update'
                    ? 'bg-amber-950/70 border-amber-500 ring-1 ring-amber-500/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-amber-800/60'
                )}
              >
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Updates Found
                </span>
                <span className="text-lg font-bold text-amber-300 font-heading">
                  ↻ {parsedData.counts.updateCount}
                </span>
                <span className="text-[10px] text-slate-400 block">Modified values</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus(filterStatus === 'unchanged' ? 'all' : 'unchanged')}
                className={cn(
                  'p-3 rounded-2xl border text-left transition-all cursor-pointer',
                  filterStatus === 'unchanged'
                    ? 'bg-slate-800 border-slate-600 ring-1 ring-slate-500/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                )}
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Identical
                </span>
                <span className="text-lg font-bold text-slate-300 font-heading">
                  ⊘ {parsedData.counts.unchangedCount}
                </span>
                <span className="text-[10px] text-slate-400 block">No change needed</span>
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedCategoryTab('all')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border',
                  selectedCategoryTab === 'all'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-inner'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                )}
              >
                All Categories ({parsedData.totalRecordsCount})
              </button>

              {parsedData.categoriesPresent.map((cat) => {
                const isSelected = selectedCategoryTab === cat;
                const count = parsedData.counts.byCategory[cat]?.total || 0;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryTab(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5',
                      isSelected
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-inner'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    )}
                  >
                    {getCategoryIcon(cat)}
                    <span>{CATEGORY_META[cat]?.label || cat}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search & Filter Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search preview records by name, institution, or category..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Itemized Record List Preview */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 rounded-2xl bg-slate-950/70 border border-slate-800/80 p-2">
              {filteredDiffItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No records match the current category or search filter.
                </div>
              ) : (
                filteredDiffItems.map((item) => (
                  <div
                    key={`${item.category}_${item.id}`}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/90 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-slate-800 flex-shrink-0">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate font-heading">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.categoryLabel}
                          </span>
                        </div>
                        {item.subtitle && (
                          <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                        )}
                        {item.diffSummary && item.diffSummary.length > 0 && (
                          <p className="text-[10px] text-amber-300/90 truncate font-mono">
                            {item.diffSummary.join(' • ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.amountOrValue !== undefined && (
                        <span className="font-mono font-semibold text-slate-200 text-xs">
                          {formatRupee(item.amountOrValue)}
                        </span>
                      )}

                      {item.status === 'new' && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                          NEW
                        </span>
                      )}
                      {item.status === 'update' && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                          UPDATE
                        </span>
                      )}
                      {item.status === 'unchanged' && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          UNCHANGED
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Import Strategy Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-heading block">
                Choose Import Strategy
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Option 1: Merge & Update (Recommended) */}
                <button
                  type="button"
                  onClick={() => setSelectedStrategy('merge')}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1',
                    selectedStrategy === 'merge'
                      ? 'bg-cyan-950/70 border-cyan-500 text-cyan-100 ring-1 ring-cyan-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-heading text-white">Merge &amp; Update</span>
                    {selectedStrategy === 'merge' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Safe default. Updates matching records and adds new ones. Never deletes untouched data.
                  </p>
                </button>

                {/* Option 2: Add New Only */}
                <button
                  type="button"
                  onClick={() => setSelectedStrategy('add_only')}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1',
                    selectedStrategy === 'add_only'
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-100 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-heading text-white">Add New Only</span>
                    {selectedStrategy === 'add_only' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Only inserts items not already present. Leaves all existing records 100% untouched.
                  </p>
                </button>

                {/* Option 3: Replace Entire Vault */}
                <button
                  type="button"
                  onClick={() => setSelectedStrategy('replace')}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1',
                    selectedStrategy === 'replace'
                      ? 'bg-rose-950/70 border-rose-500 text-rose-100 ring-1 ring-rose-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-heading text-rose-300">Replace Vault</span>
                    {selectedStrategy === 'replace' && <Check className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Replaces current vault completely with this backup file (requires confirmation).
                  </p>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleProceedToImport}
                disabled={isImporting}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all active:scale-[0.98] disabled:opacity-50',
                  selectedStrategy === 'replace'
                    ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white'
                    : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white'
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isImporting
                    ? 'Importing...'
                    : selectedStrategy === 'replace'
                    ? 'Review & Confirm Overwrite'
                    : selectedStrategy === 'add_only'
                    ? `Import +${parsedData.counts.newCount} New Records`
                    : `Execute Merge (+${parsedData.counts.newCount} new, ↻${parsedData.counts.updateCount} updates)`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: STRICT OVERWRITE CONFIRMATION (REPLACE STRATEGY) */}
        {/* ========================================================================= */}
        {step === 3 && parsedData && (
          <div className="space-y-4 py-2 text-slate-200 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-rose-200 block text-sm">
                  Confirm Full Vault Overwrite
                </span>
                <p className="text-slate-300 leading-relaxed">
                  You have selected to replace your current database records with <span className="font-semibold text-white">{parsedData.fileName}</span> ({parsedData.totalRecordsCount} records).
                </p>
                <p className="text-rose-300 font-medium pt-1">
                  Existing bank accounts, credit cards, investments, and Khatabook records will be replaced. We strongly recommend saving a safety backup first.
                </p>
              </div>
            </div>

            {/* Safety Backup Button */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-white block">Download Safety Backup</span>
                <span className="text-[11px] text-slate-400">Save a snapshot of your current data before replacing</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadSafetyBackup}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Backup</span>
              </button>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={replaceConfirmed}
                onChange={(e) => setReplaceConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-xs text-slate-300">
                I understand that this action will overwrite my current financial vault with the imported file.
              </span>
            </label>

            {/* Confirmation Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel &amp; Choose Merge
              </button>

              <button
                type="button"
                onClick={handleProceedToImport}
                disabled={!replaceConfirmed || isImporting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isImporting ? 'Replacing Vault...' : 'Yes, Overwrite Vault'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: SUCCESS SUMMARY VIEW */}
        {/* ========================================================================= */}
        {step === 4 && executionResult && (
          <div className="space-y-4 py-2 text-slate-200 animate-in zoom-in-95 duration-200">
            {/* Completion Hero Banner */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900 border border-emerald-500/50 text-center space-y-2 shadow-xl shadow-emerald-950/30">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white font-heading">
                Import Successfully Completed!
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Processed <span className="font-semibold text-emerald-300">{executionResult.totalProcessed} records</span> in {executionResult.durationMs}ms using{' '}
                <span className="font-semibold text-white">
                  {executionResult.strategy === 'merge'
                    ? 'Merge & Update'
                    : executionResult.strategy === 'add_only'
                    ? 'Add New Only'
                    : 'Full Replace'}
                </span>.
              </p>
            </div>

            {/* Results Grid Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 font-heading">
                <span>Summary Breakdown by Ledger</span>
                <span className="text-[11px] text-cyan-400 font-mono">
                  +{executionResult.addedCount} added • ↻{executionResult.updatedCount} updated
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {executionResult.categoryBreakdown.map((cat) => (
                  <div
                    key={cat.category}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between"
                  >
                    <span className="text-slate-300 font-medium truncate">{cat.category}</span>
                    <span className="font-mono font-bold text-emerald-400 text-[11px]">
                      {cat.added + cat.updated}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Navigation Shortcuts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/accounts');
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>View Accounts</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/investments');
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>View Investments</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/');
                }}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>Go to Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

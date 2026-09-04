import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Share2,
  Calendar,
  Layers,
  Building2,
  CreditCard as CreditCardIcon,
  Banknote,
  Smartphone,
  TrendingUp,
  BookOpen,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  Eye,
  X,
  FileSpreadsheet,
  Check,
  ChevronRight,
  Shield,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useFinancialData } from '../../context/FinancialDataContext';
import {
  PdfReportCategory,
  PdfDateRangePreset,
  PdfExportOptions,
  buildFinancialPdfDoc,
  downloadFinancialPdf,
  generateFinancialPdfBlob,
  formatPdfCurrency,
} from '../../utils/pdfExporter';
import { formatRupee, formatPercentage, formatFinancialDate } from '../../utils/formatters';
import { ExportedBackupData } from '../../types';

export type { PdfReportCategory, PdfDateRangePreset, PdfExportOptions };

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast: (msg: string) => void;
  onOpenCsvModal?: () => void;
  initialCategory?: PdfReportCategory;
}

interface CategoryOption {
  key: PdfReportCategory;
  title: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
  badgeColor: string;
  description: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    key: 'all',
    title: 'Full Financial Report',
    shortLabel: 'Full Vault',
    icon: Sparkles,
    color: 'from-blue-600 via-indigo-600 to-cyan-600',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description: 'Comprehensive report covering Banks, FDs, Cards, Cash, Wallets, Investments, Khatabook & Net Worth summary.',
  },
  {
    key: 'banks',
    title: 'Banks & Fixed Deposits',
    shortLabel: 'Banks & FDs',
    icon: Building2,
    color: 'from-blue-600 to-cyan-600',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    description: 'Savings & Current accounts, FD term certificates, maturity dates, and accrued interest valuations.',
  },
  {
    key: 'credit_cards',
    title: 'Credit Cards & Liabilities',
    shortLabel: 'Credit Cards',
    icon: CreditCardIcon,
    color: 'from-rose-600 to-amber-600',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    description: 'Outstanding dues, total credit limits, available balances, payment due dates, and utilization metrics.',
  },
  {
    key: 'cash',
    title: 'Physical Cash & Lockers',
    shortLabel: 'Cash in Hand',
    icon: Banknote,
    color: 'from-amber-600 to-emerald-600',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Locker vaults, wallet holdings, and exact note denomination breakdown (₹500, ₹200, ₹100 notes).',
  },
  {
    key: 'wallets',
    title: 'Digital Wallets & Cashback',
    shortLabel: 'Wallets',
    icon: Smartphone,
    color: 'from-purple-600 to-indigo-600',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Paytm, Amazon Pay, PhonePe stored balances, cashback rewards, and merchant wallets.',
  },
  {
    key: 'investments',
    title: 'Investments & Portfolio',
    shortLabel: 'Investments',
    icon: TrendingUp,
    color: 'from-emerald-600 to-teal-600',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Equities, Mutual Funds, ETFs, SGB/Gold, IPO applications with units, buy price, NAV, and profit/loss.',
  },
  {
    key: 'khatabook',
    title: 'Dues & Receivables (Khatabook)',
    shortLabel: 'Khatabook',
    icon: BookOpen,
    color: 'from-indigo-600 to-purple-600',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    description: 'Detailed debt ledger tracking You’ll Get (Receivables) vs You’ll Give (Payables), due dates, and settlements.',
  },
];

const DATE_PRESETS: { key: PdfDateRangePreset; label: string; desc: string }[] = [
  { key: 'all_time', label: 'All Time', desc: 'Complete Vault' },
  { key: 'last_30_days', label: 'Last 30 Days', desc: 'Recent Month' },
  { key: 'this_month', label: 'This Month', desc: 'Month to Date' },
  { key: 'last_3_months', label: 'Last 3 Months', desc: 'Quarterly' },
  { key: 'current_fy', label: 'Current FY', desc: 'FY 2026-27' },
  { key: 'custom', label: 'Custom Range', desc: 'Select Dates' },
];

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
  onOpenCsvModal,
  initialCategory = 'all',
}) => {
  const { exportBackup, netWorth, totalAssets, totalLiabilities, portfolioSummary } = useFinancialData();

  const [selectedCategory, setSelectedCategory] = useState<PdfReportCategory>(initialCategory);
  const [datePreset, setDatePreset] = useState<PdfDateRangePreset>('all_time');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [currencyPrefix, setCurrencyPrefix] = useState<'INR' | 'Rs.' | '₹'>('INR');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Customization Toggles
  const [includeSummaryCards, setIncludeSummaryCards] = useState<boolean>(true);
  const [includePnL, setIncludePnL] = useState<boolean>(true);
  const [includeDenominations, setIncludeDenominations] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState<boolean>(false);

  // Status states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [backupCache, setBackupCache] = useState<ExportedBackupData | null>(null);

  // Sync category on initial open
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(initialCategory);
      // Pre-load data cache
      exportBackup().then((d) => setBackupCache(d)).catch(console.error);
    } else {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }
      setIsPreviewOpen(false);
    }
  }, [isOpen, initialCategory]);

  // Compute live item counts based on loaded data
  const counts = useMemo(() => {
    if (!backupCache) {
      return {
        banks: 0,
        cards: 0,
        cash: 0,
        wallets: 0,
        investments: 0,
        khatabook: 0,
        total: 0,
      };
    }
    const b = (backupCache.bankAccounts || []).length + (backupCache.fixedDeposits || []).length;
    const c = (backupCache.creditCards || []).length;
    const ch = (backupCache.cashHoldings || []).length;
    const w = (backupCache.wallets || []).length;
    const inv = (backupCache.investmentHoldings || []).length + (backupCache.ipoApplications || []).length;
    const k = (backupCache.khatabookEntries || []).length;
    return {
      banks: b,
      cards: c,
      cash: ch,
      wallets: w,
      investments: inv,
      khatabook: k,
      total: b + c + ch + w + inv + k,
    };
  }, [backupCache]);

  const currentOption = useMemo(
    () => CATEGORY_OPTIONS.find((c) => c.key === selectedCategory) || CATEGORY_OPTIONS[0],
    [selectedCategory]
  );

  const getExportPayload = async (): Promise<PdfExportOptions> => {
    const data = backupCache || (await exportBackup());
    return {
      data,
      category: selectedCategory,
      dateRangePreset: datePreset,
      customStartDate,
      customEndDate,
      currencyPrefix,
      includeSummaryCards,
      includePnL,
      includeDenominations,
      includeNotes,
      orientation,
    };
  };

  // 1. Direct PDF Download
  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const payload = await getExportPayload();
      const filename = await downloadFinancialPdf(payload);
      onSuccessToast(`✓ PDF statement saved: ${filename}`);
      onClose();
    } catch (err) {
      console.error('PDF export failed:', err);
      onSuccessToast('Failed to generate PDF document');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Open Live Document Preview Frame
  const handlePreviewPdf = async () => {
    setIsGenerating(true);
    try {
      const payload = await getExportPayload();
      const { url } = await generateFinancialPdfBlob(payload);
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
      setPreviewBlobUrl(url);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Preview generation failed:', err);
      onSuccessToast('Could not load preview');
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Print / Save Document
  const handlePrintDocument = async () => {
    setIsGenerating(true);
    try {
      const payload = await getExportPayload();
      const { url } = await generateFinancialPdfBlob(payload);
      
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = url;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          iframe.focus();
          iframe.contentWindow?.print();
          // Clean up after print dialog opens
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 3000);
        }, 300);
      };
      onSuccessToast('Opening print dialog...');
    } catch (err) {
      console.error('Print error:', err);
      onSuccessToast('Failed to trigger print dialog');
    } finally {
      setIsGenerating(false);
    }
  };

  // 4. Web Share API (Mobile WhatsApp, Drive, Mail)
  const handleSharePdf = async () => {
    if (!navigator.share) {
      handleDownloadPdf();
      return;
    }

    setIsGenerating(true);
    try {
      const payload = await getExportPayload();
      const { blob, filename } = await generateFinancialPdfBlob(payload);
      const file = new File([blob], filename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Afinity Financial Statement',
          text: `Afinity ${currentOption.title} (Generated on ${new Date().toLocaleDateString('en-IN')})`,
        });
        onSuccessToast('✓ Report shared successfully');
      } else {
        await downloadFinancialPdf(payload);
        onSuccessToast('Direct download initiated');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Share failed:', err);
        handleDownloadPdf();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !isPreviewOpen}
        onClose={onClose}
        title="Export Financial Statement (PDF)"
        subtitle="Generate encrypted, print-ready PDF statements with Afinity branding & tables"
      >
        <div className="space-y-4 py-1 text-slate-200">
          {/* Top Hero Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/70 via-[#0c192e] to-slate-900 border border-blue-800/50 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-heading">
                      {currentOption.title}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${currentOption.badgeColor}`}>
                      Vector PDF
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    {currentOption.description}
                  </p>
                </div>
              </div>

              {/* Quick Net Worth stats */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                  Vault Net Worth
                </span>
                <span className="text-sm font-bold text-cyan-300 font-mono">
                  {formatRupee(netWorth)}
                </span>
              </div>
            </div>
          </div>

          {/* 1. Category Selection Tabs / Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-heading flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Select Report Category</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {counts.total} total vault items
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                const IconComponent = cat.icon;
                const itemCount =
                  cat.key === 'all'
                    ? counts.total
                    : cat.key === 'banks'
                    ? counts.banks
                    : cat.key === 'credit_cards'
                    ? counts.cards
                    : cat.key === 'cash'
                    ? counts.cash
                    : cat.key === 'wallets'
                    ? counts.wallets
                    : cat.key === 'investments'
                    ? counts.investments
                    : counts.khatabook;

                return (
                  <button
                    key={cat.key}
                    type="button"
                    id={`pdf-cat-${cat.key}`}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-b from-blue-950/80 to-slate-900 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded">
                        {itemCount}
                      </span>
                    </div>
                    <div>
                      <div className={`text-xs font-bold font-heading truncate ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {cat.shortLabel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Date Range Scope Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-heading flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Statement Period & Date Range</span>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {DATE_PRESETS.map((preset) => {
                const isSelected = datePreset === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setDatePreset(preset.key)}
                    className={`py-2 px-2 rounded-xl text-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 font-bold shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 font-medium'
                    }`}
                  >
                    <div className="text-[11px] truncate">{preset.label}</div>
                    <div className="text-[9px] text-slate-500 truncate">{preset.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Custom Date Pickers */}
            {datePreset === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 animate-in fade-in">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1">
                    START DATE (FROM)
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1">
                    END DATE (TO)
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Report Customization & Advanced Options (Collapsible) */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <button
              type="button"
              onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-heading">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Report Customization & Layout</span>
              </div>
              <span className="text-[11px] text-cyan-400 font-normal">
                {showAdvancedConfig ? 'Hide Settings' : 'Configure Options'}
              </span>
            </button>

            {showAdvancedConfig && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-in fade-in">
                {/* Toggles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800">
                    <span className="text-slate-300">Executive KPI Summary Cards</span>
                    <input
                      type="checkbox"
                      checked={includeSummaryCards}
                      onChange={(e) => setIncludeSummaryCards(e.target.checked)}
                      className="accent-cyan-500 w-4 h-4 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800">
                    <span className="text-slate-300">Investment Profit & Loss (P&L)</span>
                    <input
                      type="checkbox"
                      checked={includePnL}
                      onChange={(e) => setIncludePnL(e.target.checked)}
                      className="accent-cyan-500 w-4 h-4 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800">
                    <span className="text-slate-300">Cash Note Denominations Breakdown</span>
                    <input
                      type="checkbox"
                      checked={includeDenominations}
                      onChange={(e) => setIncludeDenominations(e.target.checked)}
                      className="accent-cyan-500 w-4 h-4 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800">
                    <span className="text-slate-300">Account Notes & Purpose Tags</span>
                    <input
                      type="checkbox"
                      checked={includeNotes}
                      onChange={(e) => setIncludeNotes(e.target.checked)}
                      className="accent-cyan-500 w-4 h-4 rounded"
                    />
                  </label>
                </div>

                {/* Currency & Orientation Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1">
                      CURRENCY SYMBOL / FORMAT
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['INR', 'Rs.', '₹'] as const).map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => setCurrencyPrefix(curr)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                            currencyPrefix === curr
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1">
                      PAGE ORIENTATION
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['portrait', 'landscape'] as const).map((orient) => (
                        <button
                          key={orient}
                          type="button"
                          onClick={() => setOrientation(orient)}
                          className={`py-1.5 px-2 rounded-lg text-xs capitalize font-heading font-semibold border transition-all cursor-pointer ${
                            orientation === orient
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {orient}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Bar */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Primary: Download PDF */}
              <button
                type="button"
                id="generate-pdf-download-btn"
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="sm:col-span-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-950/40 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${isGenerating ? 'animate-bounce' : ''}`} />
                <span>{isGenerating ? 'Generating PDF...' : 'Download Statement (PDF)'}</span>
              </button>

              {/* Secondary: Preview PDF */}
              <button
                type="button"
                id="preview-pdf-btn"
                onClick={handlePreviewPdf}
                disabled={isGenerating}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
            </div>

            {/* Sub-actions: Print & Share & CSV Link */}
            <div className="flex items-center justify-between gap-2 pt-1 px-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  disabled={isGenerating}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={handleSharePdf}
                  disabled={isGenerating}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Share</span>
                </button>
              </div>

              {onOpenCsvModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCsvModal();
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export CSV Instead</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Full-Screen In-App Document Preview Modal */}
      {isPreviewOpen && previewBlobUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-in fade-in duration-200">
          {/* Top Preview Bar */}
          <div className="p-3 sm:px-6 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-heading text-white truncate">
                  {currentOption.title} (Statement Preview)
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • Afinity Vector PDF
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>

              <button
                type="button"
                onClick={handlePrintDocument}
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Print</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Embedded PDF Viewer Frame */}
          <div className="flex-1 bg-slate-900/60 p-2 sm:p-4 overflow-hidden flex items-center justify-center">
            <iframe
              src={previewBlobUrl}
              title="Afinity PDF Preview"
              className="w-full h-full rounded-xl border border-slate-800 shadow-2xl bg-white"
            />
          </div>
        </div>
      )}
    </>
  );
};

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Table,
  Layers,
  ArrowDownToLine,
  FileText,
  Sparkles,
  Database,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useFinancialData } from '../../context/FinancialDataContext';
import { generateRepositoryCsvs, downloadCsvFile, CsvDataset } from '../../utils/csvExporter';

interface CsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast: (msg: string) => void;
  onOpenPdfModal?: () => void;
}

export const CsvExportModal: React.FC<CsvExportModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
  onOpenPdfModal,
}) => {
  const { exportBackup } = useFinancialData();
  const [isExportingMaster, setIsExportingMaster] = useState<boolean>(false);
  const [exportingCategory, setExportingCategory] = useState<string | null>(null);
  const [generatedDatasets, setGeneratedDatasets] = useState<CsvDataset[] | null>(null);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [isPreparing, setIsPreparing] = useState<boolean>(false);

  // Load and prepare dataset summary when opening modal
  React.useEffect(() => {
    if (!isOpen) {
      setGeneratedDatasets(null);
      return;
    }

    let isMounted = true;
    setIsPreparing(true);

    exportBackup()
      .then((data) => {
        if (!isMounted) return;
        const { datasets } = generateRepositoryCsvs(data);
        setGeneratedDatasets(datasets);
        const rows = datasets.reduce((sum, ds) => sum + ds.rowCount, 0);
        setTotalRows(rows);
      })
      .catch((err) => {
        console.error('Failed to prepare CSV data:', err);
      })
      .finally(() => {
        if (isMounted) setIsPreparing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Export Master Combined CSV
  const handleExportMasterCsv = async () => {
    setIsExportingMaster(true);
    try {
      const data = await exportBackup();
      const { masterCsv } = generateRepositoryCsvs(data);
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `afinity_complete_financial_vault_${timestamp}.csv`;
      downloadCsvFile(masterCsv, filename);
      onSuccessToast('✓ Master CSV repository exported successfully');
    } catch (err) {
      console.error('Master CSV export error:', err);
      onSuccessToast('Failed to export Master CSV');
    } finally {
      setIsExportingMaster(false);
    }
  };

  // Export Individual Category CSV
  const handleExportDataset = async (dataset: CsvDataset) => {
    setExportingCategory(dataset.category);
    try {
      // Re-fetch fresh state
      const data = await exportBackup();
      const { datasets } = generateRepositoryCsvs(data);
      const target = datasets.find((d) => d.category === dataset.category) || dataset;
      downloadCsvFile(target.csvContent, target.filename);
      onSuccessToast(`✓ ${dataset.category} CSV exported successfully`);
    } catch (err) {
      console.error(`Export error for ${dataset.category}:`, err);
      onSuccessToast(`Failed to export ${dataset.category}`);
    } finally {
      setExportingCategory(null);
    }
  };

  // Export All CSV Files at once
  const handleExportAllIndividual = async () => {
    setIsExportingMaster(true);
    try {
      const data = await exportBackup();
      const { datasets } = generateRepositoryCsvs(data);
      let count = 0;
      for (const ds of datasets) {
        if (ds.rowCount > 0) {
          downloadCsvFile(ds.csvContent, ds.filename);
          count++;
          // Tiny delay between browser downloads
          await new Promise((r) => setTimeout(r, 150));
        }
      }
      onSuccessToast(`✓ Exported ${count} individual CSV tables`);
    } catch (err) {
      console.error('Batch CSV export error:', err);
      onSuccessToast('Failed during batch export');
    } finally {
      setIsExportingMaster(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Financial Data (CSV)"
      subtitle="Universal spreadsheet export for Excel, Google Sheets, Python & BI tools"
    >
      <div className="space-y-4 py-1 text-slate-200">
        {/* Top Hero Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900 border border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-heading">
                  Comprehensive Vault CSV
                </span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded-full border border-emerald-700/60 font-mono">
                  UTF-8 BOM
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Export all {totalRows > 0 ? `${totalRows} ledger entries & records` : 'financial records'} across banks, investments, cards, Khatabook, and audit logs.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="export-master-csv-btn"
            onClick={handleExportMasterCsv}
            disabled={isExportingMaster || isPreparing}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98] disabled:opacity-50 flex-shrink-0"
          >
            <Download className={`w-4 h-4 ${isExportingMaster ? 'animate-bounce' : ''}`} />
            <span>{isExportingMaster ? 'Generating CSV...' : 'Download Master CSV'}</span>
          </button>
        </div>

        {/* Switch to PDF Statement Action */}
        {onOpenPdfModal && (
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="text-xs text-slate-300">
                Looking for printable statements with branding & summary cards?
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPdfModal();
              }}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer flex-shrink-0"
            >
              <span>Export PDF Statement</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Quick Batch Actions & Information */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Table className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-300">Individual Table Datasets</span>
            <span className="text-[11px] text-slate-500">({generatedDatasets?.length || 0} tables)</span>
          </div>

          <button
            type="button"
            onClick={handleExportAllIndividual}
            disabled={isExportingMaster || isPreparing}
            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <ArrowDownToLine className="w-3 h-3" />
            <span>Export All Tables ({generatedDatasets?.filter((d) => d.rowCount > 0).length || 0})</span>
          </button>
        </div>

        {/* Individual Tables List */}
        <div className="max-h-[290px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {isPreparing ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <span>Scanning IndexedDB tables & compiling schemas...</span>
            </div>
          ) : (
            (generatedDatasets || []).map((ds) => {
              const isDownloading = exportingCategory === ds.category;
              const hasData = ds.rowCount > 0;

              return (
                <div
                  key={ds.category}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    hasData
                      ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        hasData
                          ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200 truncate font-heading">
                          {ds.category}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            hasData
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {ds.rowCount} {ds.rowCount === 1 ? 'row' : 'rows'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {ds.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExportDataset(ds)}
                    disabled={isDownloading || !hasData}
                    className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${
                      hasData
                        ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 active:scale-95'
                        : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-spin' : ''}`} />
                    <span>{isDownloading ? 'Exporting...' : 'Export'}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Compatibility Info Note */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Format & Analysis Compatibility</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
            Exported CSV files are encoded with UTF-8 BOM, ensuring proper Indian Rupee symbols (₹) and text formatting in <strong>Microsoft Excel</strong>, <strong>Google Sheets</strong>, <strong>Apple Numbers</strong>, <strong>Python / Pandas</strong>, and <strong>Power BI / Tableau</strong>.
          </p>
        </div>
      </div>
    </Modal>
  );
};

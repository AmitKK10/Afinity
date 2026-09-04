import React, { useState } from 'react';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  FileText,
  Layers,
  ShieldCheck,
  RotateCcw,
  HardDrive,
  Info,
  UploadCloud,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useFinancialData } from '../../context/FinancialDataContext';
import { ExportedBackupData } from '../../types';
import { formatFinancialDate } from '../../utils/formatters';
import { generateRepositoryCsvs, downloadCsvFile } from '../../utils/csvExporter';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast: (msg: string) => void;
  onOpenCsvModal?: () => void;
  onOpenImportModal?: () => void;
  onOpenPdfModal?: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
  onOpenCsvModal,
  onOpenImportModal,
  onOpenPdfModal,
}) => {
  const {
    bankAccounts,
    cashHoldings,
    wallets,
    creditCards,
    investments,
    khatabookEntries,
    snapshots,
    balanceHistory,
    auditEvents,
    settings,
    exportBackup,
    importBackup,
    resetToDemoData,
  } = useFinancialData();

  const [isExporting, setIsExporting] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<ExportedBackupData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportBackup();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `afinity_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      onSuccessToast('✓ JSON backup exported successfully');
      onClose();
    } catch {
      onSuccessToast('Export failed. Please check local storage permissions.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMasterCsv = async () => {
    setIsExportingCsv(true);
    try {
      const data = await exportBackup();
      const { masterCsv } = generateRepositoryCsvs(data);
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadCsvFile(masterCsv, `afinity_complete_financial_vault_${timestamp}.csv`);
      onSuccessToast('✓ Complete CSV repository exported successfully');
      onClose();
    } catch {
      onSuccessToast('CSV Export failed');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validate basic schema
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON format');
        }

        if (!parsed.dataVersion && !parsed.version) {
          throw new Error('Incompatible backup version: Missing schema headers');
        }

        setPendingBackup(parsed as ExportedBackupData);
      } catch (err: any) {
        setValidationError(err?.message || 'Corrupted or unreadable JSON backup file');
        setPendingBackup(null);
      }
    };
    reader.readAsText(file);
    // Reset file input value so user can select same file again if needed
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingBackup) return;
    setIsRestoring(true);
    try {
      await importBackup(pendingBackup);
      setPendingBackup(null);
      onSuccessToast('✓ Backup restored into IndexedDB vault successfully');
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Restore failed. Existing database was left untouched.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setPendingBackup(null);
        setValidationError(null);
        onClose();
      }}
      title="Data Vault Backup & Restore"
      subtitle="Full local persistence export and atomic schema restoration"
    >
      <div className="space-y-4 py-1 text-slate-200">
        {/* If pending backup confirmation is active */}
        {pendingBackup ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-cyan-950/50 border border-cyan-800/80 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs font-heading">
                <FileJson className="w-4 h-4 text-cyan-400" />
                <span>Backup Schema Validated</span>
              </div>
              <p className="text-xs text-slate-300">
                Exported on: <span className="font-semibold text-white">{pendingBackup.exportedAt ? formatFinancialDate(pendingBackup.exportedAt) : 'Recent'}</span>
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300 font-mono">
                <div>• Bank Accounts: {pendingBackup.bankAccounts?.length || 0}</div>
                <div>• Cash Holdings: {pendingBackup.cashHoldings?.length || 0}</div>
                <div>• Wallets: {pendingBackup.wallets?.length || 0}</div>
                <div>• Credit Cards: {pendingBackup.creditCards?.length || 0}</div>
                <div>• Investments: {pendingBackup.investmentHoldings?.length || 0}</div>
                <div>• Khatabook: {pendingBackup.khatabookEntries?.length || 0}</div>
                <div>• Snapshots: {pendingBackup.snapshots?.length || 0}</div>
                <div>• Audit Logs: {pendingBackup.auditEvents?.length || 0}</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>Restoring will atomically replace current local database records with this backup file.</span>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingBackup(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRestoring ? 'Restoring...' : 'Confirm Restore'}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Validation Error Message */}
            {validationError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-xs text-rose-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Backup Validation Error</span>
                  <span className="text-[11px] text-rose-300/90">{validationError}</span>
                </div>
              </div>
            )}

            {/* Current Vault Ledger Contents */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 font-heading">Vault Contents</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                  Ready to Export
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 font-mono pt-1">
                <div>• Banks & FDs: {bankAccounts.length}</div>
                <div>• Cash Vaults: {cashHoldings.length}</div>
                <div>• Wallets: {wallets.length}</div>
                <div>• Credit Cards: {creditCards.length}</div>
                <div>• Investments: {investments.length}</div>
                <div>• Khatabook: {khatabookEntries.length}</div>
                <div>• Snapshots: {snapshots.length}</div>
                <div>• History Logs: {balanceHistory.length}</div>
                <div>• Audit Logs: {auditEvents.length}</div>
              </div>
            </div>

            {/* Export & Import Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                id="export-pdf-backup-btn"
                onClick={() => {
                  onClose();
                  onOpenPdfModal?.();
                }}
                className="py-3 px-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-950/40 transition-all active:scale-[0.98]"
              >
                <FileText className="w-4 h-4" />
                <span>Export PDF Statement</span>
              </button>

              <button
                type="button"
                id="export-csv-direct-btn"
                onClick={handleExportMasterCsv}
                disabled={isExportingCsv || isExporting}
                className="py-3 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isExportingCsv ? 'Exporting CSV...' : 'Export All CSV'}</span>
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting || isExportingCsv}
                className="py-3 px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>{isExporting ? 'Exporting...' : 'Export JSON'}</span>
              </button>
            </div>

            {/* Additional Actions: Advanced Import, CSV Table Explorer & JSON Restore */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {onOpenImportModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenImportModal();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Import Data (JSON/CSV)</span>
                </button>
              )}

              {onOpenCsvModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCsvModal();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-emerald-400 border border-emerald-800/40 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Customize CSV</span>
                </button>
              )}

              <label className="py-2.5 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all text-center">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Quick JSON Restore</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Unencrypted File Security Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200/90 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Security Notice: Unencrypted JSON Export</span>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed font-normal">
                The exported backup is an unencrypted plain-text JSON file containing your complete balances, accounts, cards, and Khatabook records. Store this file securely in a password-protected folder, encrypted drive, or secure offline storage.
              </p>
            </div>

            {/* Atomic Protection Guarantee */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>Atomic Restore Protection: If validation or restoration fails, existing data is left completely intact.</span>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

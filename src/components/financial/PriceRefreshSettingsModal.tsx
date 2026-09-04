import React, { useState } from 'react';
import {
  X,
  Clock,
  Zap,
  ShieldCheck,
  RefreshCw,
  Info,
  Check,
  Radio,
  Sliders,
  Database,
  Wifi,
} from 'lucide-react';
import { InvestmentPriceRefreshFrequency } from '../../types';
import { useFinancialData } from '../../context/FinancialDataContext';
import { formatRelativeTime } from '../../utils/formatters';

interface PriceRefreshSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForceRefresh: () => void;
}

export const PriceRefreshSettingsModal: React.FC<PriceRefreshSettingsModalProps> = ({
  isOpen,
  onClose,
  onForceRefresh,
}) => {
  const { settings, updatePriceRefreshFrequency, isPriceRefreshing, isOffline } = useFinancialData();
  const currentFrequency = settings.priceRefreshFrequency || 'twice_daily';
  const [selectedFreq, setSelectedFreq] = useState<InvestmentPriceRefreshFrequency>(currentFrequency);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePriceRefreshFrequency(selectedFreq);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const frequencies: Array<{
    id: InvestmentPriceRefreshFrequency;
    title: string;
    description: string;
    badge: string;
    icon: any;
  }> = [
    {
      id: 'twice_daily',
      title: 'Twice Daily (Every 12 Hours)',
      description: 'Automatically refreshes market prices once in the morning and once after market close.',
      badge: 'Recommended',
      icon: Zap,
    },
    {
      id: 'once_daily',
      title: 'Once Daily (Every 24 Hours)',
      description: 'Refreshes daily mutual fund NAVs and stock closing prices once per day.',
      badge: 'Balanced',
      icon: Clock,
    },
    {
      id: 'manual_only',
      title: 'Manual Refresh Only',
      description: 'Prices are only updated when you click the "Refresh Prices" button or edit holdings manually.',
      badge: 'On Demand',
      icon: Sliders,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0b1329] border border-slate-700/80 shadow-2xl p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                Market Price Settings
              </h3>
              <p className="text-xs text-slate-400">
                Configure periodic, non-intrusive market updates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Security & Zero-Cost banner */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-start gap-2 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100 font-semibold">100% Free &amp; Offline-Safe</strong>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Afinity connects to public AMFI open endpoints and official exchange quotes. No broker credentials, no paid APIs, and no real-time battery drain. Last known prices are always stored locally.
              </p>
            </div>
          </div>
        </div>

        {/* Frequency Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Update Frequency
          </label>

          <div className="space-y-2.5">
            {frequencies.map((freq) => {
              const isSelected = selectedFreq === freq.id;
              const Icon = freq.icon;

              return (
                <button
                  key={freq.id}
                  type="button"
                  onClick={() => setSelectedFreq(freq.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/80 shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl border mt-0.5 shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {freq.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {freq.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {freq.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 mt-1">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                          : 'border-slate-700 bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Last Sync Timestamp & Force Refresh Trigger */}
        <div className="p-3.5 rounded-2xl bg-[#080e1c] border border-slate-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] text-slate-400 block">Last Market Sync</span>
            <span className="text-xs font-semibold text-slate-200 font-mono">
              {settings.lastMarketPriceRefreshAt
                ? formatRelativeTime(settings.lastMarketPriceRefreshAt)
                : 'Never synced (Using initial prices)'}
            </span>
          </div>

          <button
            type="button"
            disabled={isPriceRefreshing || isOffline}
            onClick={() => {
              onClose();
              onForceRefresh();
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPriceRefreshing ? 'animate-spin' : ''}`} />
            <span>Force Refresh</span>
          </button>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

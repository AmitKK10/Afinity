import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  DollarSign,
  Clock,
  Palette,
  Shield,
  ShieldCheck,
  RefreshCw,
  Database,
  RotateCcw,
  Sparkles,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lock,
  KeyRound,
  Fingerprint,
  Sun,
  Moon,
  Check,
  SlidersHorizontal,
  LayoutGrid,
  FileSpreadsheet,
  UploadCloud,
  Smartphone,
  Download,
  Share,
  FileText,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useFinancialData } from '../../context/FinancialDataContext';
import { useSecurity } from '../../context/SecurityContext';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { PasscodeSetupModal } from '../security/PasscodeSetupModal';
import { DashboardCustomizationModal } from '../dashboard/DashboardCustomizationModal';
import { InvestmentPriceRefreshFrequency, DashboardPresetKey } from '../../types';
import { formatPriceUpdatedTime } from '../../utils/formatters';
import { DASHBOARD_PRESETS } from '../../services/dashboardConfig';
import { THEME_STORAGE_KEY, THEME_CHANGE_EVENT, applyThemeToDocument } from '../../hooks/useSystemThemeSync';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBackupModal: () => void;
  onOpenCsvModal?: () => void;
  onOpenImportModal?: () => void;
  onOpenPdfModal?: () => void;
  onOpenOnboarding: () => void;
  onSuccessToast: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenBackupModal,
  onOpenCsvModal,
  onOpenImportModal,
  onOpenPdfModal,
  onOpenOnboarding,
  onSuccessToast,
}) => {
  const navigate = useNavigate();
  const {
    settings,
    updateUserSettings,
    updatePriceRefreshFrequency,
    refreshInvestmentPrices,
    isPriceRefreshing,
    investments,
    clearAllData,
    resetToDemoData,
  } = useFinancialData();

  const {
    isPasscodeConfigured,
    passcodeLength,
    lockTimeoutSeconds,
    lockOnBackground,
    biometricEnabled,
    biometricAvailable,
    hasBiometricCredential,
    enableBiometrics,
    disableBiometrics,
    lockVault,
  } = useSecurity();

  const {
    isInstalled,
    canInstall,
    isIOS,
    promptInstall,
    resetDismissal,
  } = usePwaInstall();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Passcode modal management
  const [passcodeModalMode, setPasscodeModalMode] = useState<'setup' | 'change' | 'disable' | null>(null);
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);

  const handleFrequencyChange = async (freq: InvestmentPriceRefreshFrequency) => {
    try {
      await updatePriceRefreshFrequency(freq);
      onSuccessToast(`✓ Price sync set to ${freq.replace('_', ' ')}`);
    } catch {
      onSuccessToast('Failed to update price refresh frequency');
    }
  };

  const handleManualPriceRefresh = async () => {
    try {
      const summary = await refreshInvestmentPrices({ force: true });
      onSuccessToast(`✓ Refreshed ${summary.updatedCount} investment prices`);
    } catch {
      onSuccessToast('Price update failed or offline');
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await resetToDemoData();
      setIsResetConfirmOpen(false);
      onClose();
      onSuccessToast('✓ Sample demo dataset loaded');
    } catch {
      onSuccessToast('Reset failed');
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
      setIsClearConfirmOpen(false);
      onClose();
      onSuccessToast('✓ All sample data cleared. Ready for your real data!');
    } catch {
      onSuccessToast('Clear failed');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !isResetConfirmOpen}
        onClose={onClose}
        title="Preferences & Vault Settings"
        subtitle="Configure local storage, price syncing, and application parameters"
      >
        <div className="space-y-5 py-1 text-slate-200">
          {/* 1. Core Currency & Numbering */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-heading flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
              <span>Currency & Numbering</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Default Currency</span>
                  <span className="text-[11px] text-slate-400 font-normal">Indian Rupee (INR)</span>
                </div>
                <span className="font-mono text-xs text-cyan-400 font-bold bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/50">
                  ₹ INR
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Numbering System</span>
                  <span className="text-[11px] text-slate-400 font-normal">Lakhs (L) & Crores (Cr)</span>
                </div>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/50">
                  Indian (2,2,3)
                </span>
              </div>
            </div>
          </div>

          {/* 2. Market Price Sync Frequency (Step 7C) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-heading flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Investment Price Refresh</span>
              </h4>
              <button
                type="button"
                onClick={handleManualPriceRefresh}
                disabled={isPriceRefreshing}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isPriceRefreshing ? 'animate-spin' : ''}`} />
                <span>{isPriceRefreshing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'auto', label: 'Auto (Smart)' },
                { key: 'once_daily', label: 'Once Daily' },
                { key: 'twice_daily', label: 'Twice Daily' },
                { key: 'manual_only', label: 'Manual Only' },
              ].map((opt) => {
                const isSelected = (settings.priceRefreshFrequency || 'twice_daily') === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleFrequencyChange(opt.key as InvestmentPriceRefreshFrequency)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 text-cyan-300 border-cyan-500/50 shadow-inner'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {settings.lastMarketPriceRefreshAt && (
              <p className="text-[11px] text-slate-400 pt-0.5">
                Last market update: <span className="text-slate-300 font-medium">{formatPriceUpdatedTime(settings.lastMarketPriceRefreshAt)}</span>
              </p>
            )}
          </div>

          {/* 3. Theme & Aesthetics */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-heading flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                <span>Visual Theme &amp; Appearance</span>
              </h4>
              <span className="text-[11px] font-bold text-slate-400">
                {((settings.theme || 'dark') === 'light' || settings.theme === 'light_contrast') ? 'Light Mode' : 'Dark Mode'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Dark Titanium */}
              {(() => {
                const isSelected = (settings.theme || 'dark') !== 'light' && settings.theme !== 'light_contrast';
                return (
                  <button
                    type="button"
                    id="settings-theme-dark-btn"
                    onClick={async () => {
                      try {
                        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
                        applyThemeToDocument('dark');
                        window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme: 'dark' } }));
                        await updateUserSettings({ theme: 'dark' });
                        onSuccessToast('✓ Dark Titanium theme activated');
                      } catch {
                        onSuccessToast('Failed to switch theme');
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/80 shadow-md shadow-cyan-950/30 ring-1 ring-cyan-500/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#080c16] border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner flex-shrink-0">
                          <Moon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-100 block font-heading">
                            Dark Titanium
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Afinity OLED Default
                          </span>
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 hover:text-slate-300">
                          Select
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Deep contrast palette optimized for low-light trading and battery efficiency.
                    </p>
                  </button>
                );
              })()}

              {/* Option 2: High-Contrast Light */}
              {(() => {
                const isSelected = (settings.theme || 'dark') === 'light' || settings.theme === 'light_contrast';
                return (
                  <button
                    type="button"
                    id="settings-theme-light-btn"
                    onClick={async () => {
                      try {
                        localStorage.setItem(THEME_STORAGE_KEY, 'light');
                        applyThemeToDocument('light');
                        window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme: 'light' } }));
                        await updateUserSettings({ theme: 'light' });
                        onSuccessToast('✓ High-Contrast Light theme activated');
                      } catch {
                        onSuccessToast('Failed to switch theme');
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-slate-900 border-sky-400 shadow-md shadow-sky-950/30 ring-1 ring-sky-400/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 border border-sky-400 flex items-center justify-center text-sky-600 shadow-sm flex-shrink-0">
                          <Sun className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-100 block font-heading">
                            High-Contrast Light
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Crisp Daylight Surfaces
                          </span>
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-950/70 border border-sky-800/60 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 hover:text-slate-300">
                          Select
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      High legibility paper-white surfaces with deep typography for daylight visibility.
                    </p>
                  </button>
                );
              })()}
            </div>
          </div>

          {/* 3b. Dashboard Layout & Card Arrangement */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-heading flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dashboard Cards &amp; Layout Preset</span>
              </h4>
              <button
                type="button"
                id="settings-open-dashboard-customizer-btn"
                onClick={() => setIsDashboardModalOpen(true)}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Customize Order</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DASHBOARD_PRESETS.map((preset) => {
                const isSelected = (settings.dashboardPreset || 'balanced') === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={async () => {
                      try {
                        await updateUserSettings({
                          dashboardPreset: preset.key,
                          dashboardCardOrder: [...preset.cardOrder],
                          hiddenDashboardCards: [...preset.hiddenCards],
                        });
                        onSuccessToast(`✓ Dashboard layout updated to "${preset.label}" preset`);
                      } catch {
                        onSuccessToast('Failed to update dashboard layout preset');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200 ring-1 ring-cyan-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-heading">{preset.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      {preset.cardOrder.length - preset.hiddenCards.length} cards visible
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Vault Security & Passcode Lock */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-heading flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vault Security &amp; Passcode Lock</span>
              </h4>
              {isPasscodeConfigured && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    lockVault();
                  }}
                  className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>Lock Vault Now</span>
                </button>
              )}
            </div>

            {/* Passcode Status Card */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border flex items-center justify-center ${
                    isPasscodeConfigured
                      ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {isPasscodeConfigured ? <Lock className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-heading">
                        {isPasscodeConfigured ? `${passcodeLength}-Digit Passcode Protected` : 'Passcode Lock Inactive'}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        isPasscodeConfigured
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {isPasscodeConfigured ? 'ARMED' : 'OPTIONAL'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {isPasscodeConfigured
                        ? 'App auto-locks when switched or backgrounded'
                        : 'Secure your financial command center from unauthorized access'}
                    </p>
                  </div>
                </div>

                {/* Primary Action Button */}
                {!isPasscodeConfigured ? (
                  <button
                    type="button"
                    onClick={() => setPasscodeModalMode('setup')}
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-md flex-shrink-0"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Set PIN</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        lockVault();
                        onClose();
                      }}
                      title="Lock Vault immediately"
                      className="py-1.5 px-2.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 font-semibold text-[11px] border border-amber-800/60 cursor-pointer flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Lock Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasscodeModalMode('change')}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-[11px] border border-slate-700 cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasscodeModalMode('disable')}
                      className="py-1.5 px-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-semibold text-[11px] border border-rose-800/60 cursor-pointer"
                    >
                      Turn Off
                    </button>
                  </div>
                )}
              </div>

              {/* Background Auto-Lock & Biometrics Trigger Options if PIN is active */}
              {isPasscodeConfigured && (
                <div className="pt-2.5 border-t border-slate-800/80 space-y-3">
                  {/* Biometric Fast Unlock & Passkey Management */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
                          <Fingerprint className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-heading">
                              Biometric Fast Unlock
                            </span>
                            {biometricAvailable ? (
                              hasBiometricCredential && biometricEnabled ? (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  PASSKEY ACTIVE
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                                  SUPPORTED
                                </span>
                              )
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-900 text-slate-400 border border-slate-700">
                                NOT SUPPORTED
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Touch ID, Face ID, Windows Hello or device passkey
                          </p>
                        </div>
                      </div>

                      {biometricAvailable && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (biometricEnabled) {
                              await disableBiometrics();
                              onSuccessToast('✓ Biometric unlock disabled');
                            } else {
                              const res = await enableBiometrics();
                              if (res.success) {
                                onSuccessToast('✓ Biometric passkey registered and enabled');
                              } else {
                                onSuccessToast(`Notice: ${res.error || 'Biometrics setup cancelled'}`);
                              }
                            }
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer border ${
                            biometricEnabled
                              ? 'bg-cyan-600 border-cyan-500'
                              : 'bg-slate-800 border-slate-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              biometricEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {biometricAvailable && !hasBiometricCredential && (
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-amber-300/90">
                          Passkey not registered on this device yet.
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await enableBiometrics();
                            if (res.success) {
                              onSuccessToast('✓ Biometric passkey created successfully');
                            } else {
                              onSuccessToast(`Notice: ${res.error || 'Passkey setup cancelled'}`);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-[10px] font-bold cursor-pointer transition-all"
                        >
                          Set up Biometric / Passkey
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Auto-Lock Timeout */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>Auto-Lock Timeout (on App Switch)</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">
                        {lockTimeoutSeconds === 0 ? 'Immediately' : `${lockTimeoutSeconds}s`}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { seconds: 0, label: 'Instant' },
                        { seconds: 30, label: '30s' },
                        { seconds: 60, label: '1 min' },
                        { seconds: 300, label: '5 min' },
                      ].map((opt) => {
                        const isSelected = (lockTimeoutSeconds ?? 0) === opt.seconds;
                        return (
                          <button
                            key={opt.seconds}
                            type="button"
                            onClick={async () => {
                              await updateUserSettings({ lockTimeoutSeconds: opt.seconds });
                              onSuccessToast(`✓ Auto-lock set to ${opt.label}`);
                            }}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-inner'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. Data Vault & Backups */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-heading flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Data Vault, CSV Export & Backups</span>
            </h4>

            {/* Import Data (JSON / CSV) Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100 font-heading">Import Financial Data</span>
                  <span className="text-[10px] font-bold text-cyan-400 px-2 py-0.2 rounded-md bg-cyan-950/60 border border-cyan-800/40 font-mono">
                    JSON &amp; CSV
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Import Afinity JSON backups or CSV ledgers with differential preview, duplicate safety, and merge controls.
                </p>
              </div>

              <button
                type="button"
                id="open-import-modal-btn"
                onClick={() => {
                  onClose();
                  if (onOpenImportModal) {
                    onOpenImportModal();
                  } else {
                    onOpenBackupModal();
                  }
                }}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md flex-shrink-0"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Import Data</span>
              </button>
            </div>

            {/* PDF Statement Export Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/50 via-[#0c192e] to-slate-900 border border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100 font-heading">Export Financial Statement (PDF)</span>
                  <span className="text-[10px] font-bold text-cyan-300 px-2 py-0.2 rounded-md bg-cyan-950/70 border border-cyan-700/50 font-mono">
                    Print & Vector PDF
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Generate beautiful, print-ready PDF statements with Afinity branding, summary totals, tables & profit/loss.
                </p>
              </div>

              <button
                type="button"
                id="open-pdf-export-modal-btn"
                onClick={() => {
                  onClose();
                  if (onOpenPdfModal) {
                    onOpenPdfModal();
                  } else {
                    onOpenBackupModal();
                  }
                }}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md flex-shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>

            {/* CSV Spreadsheet Export Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100 font-heading">Export Repository as CSV</span>
                  <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.2 rounded-md bg-emerald-950/60 border border-emerald-800/40 font-mono">
                    Excel & Sheets
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Export your full IndexedDB financial repository to CSV for spreadsheet analytics, budgeting & formulas.
                </p>
              </div>

              <button
                type="button"
                id="open-csv-export-modal-btn"
                onClick={() => {
                  onClose();
                  if (onOpenCsvModal) {
                    onOpenCsvModal();
                  } else {
                    onOpenBackupModal();
                  }
                }}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md flex-shrink-0"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* JSON Vault Card */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100 font-heading">Local JSON Vault</span>
                  <span className="text-[10px] font-bold text-cyan-400 px-2 py-0.2 rounded-md bg-cyan-950/60 border border-cyan-800/40">
                    IndexedDB v2
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Export complete encrypted schema or restore previous snapshots safely.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBackupModal();
                }}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md flex-shrink-0"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Backup & Restore</span>
              </button>
            </div>
          </div>

          {/* 6. Progressive Web App (PWA) & Offline Shell */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-heading flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Mobile & Desktop App (PWA)</span>
            </h4>

            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#101726] to-[#0c1322] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100 font-heading">
                    {isInstalled ? 'Afinity App Installed' : 'Install Standalone App'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-md border font-mono ${
                    isInstalled
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                      : 'bg-amber-950/70 text-amber-300 border-amber-800/60'
                  }`}>
                    {isInstalled ? 'STANDALONE' : 'INSTALLABLE'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isInstalled
                    ? 'Running as a standalone native app with instant offline cache and zero browser URL bar.'
                    : 'Add Afinity to your home screen or desktop for full-screen immersive access and instant offline loading.'}
                </p>
              </div>

              {!isInstalled ? (
                <button
                  type="button"
                  id="settings-install-pwa-btn"
                  onClick={async () => {
                    resetDismissal();
                    if (canInstall) {
                      const res = await promptInstall();
                      if (res === 'accepted') {
                        onSuccessToast('✓ Afinity installed successfully!');
                      }
                    } else if (isIOS) {
                      onSuccessToast('On iOS: Tap Safari Share → Add to Home Screen');
                    } else {
                      onSuccessToast('Open browser menu (⋮) → "Install Afinity" or "Add to Home screen"');
                    }
                  }}
                  className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10 flex-shrink-0 font-heading"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Install App</span>
                </button>
              ) : (
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-800/40 flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Installed</span>
                </div>
              )}
            </div>

            {/* Android Home Screen Widgets Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100 font-heading">Android Home Screen Widgets</span>
                  <span className="text-[10px] font-bold text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800/50 font-mono">
                    Small • Medium • Large
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Live Net Worth, available bank balance, investments & upcoming payments companion with Android deep-linking.
                </p>
              </div>

              <button
                type="button"
                id="settings-open-widgets-btn"
                onClick={() => {
                  onClose();
                  navigate('/widgets');
                }}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md flex-shrink-0 font-heading"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Widget Studio</span>
              </button>
            </div>
          </div>

          {/* 5. Privacy & Architecture Note */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Client-Side Privacy Enclave</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
              Afinity stores all accounts, cards, investments, and Khatabook ledgers locally on your device. Afinity never requires or stores bank passwords, OTPs, UPI PINs, Credit Card PINs, or broker login credentials. Public market price checks query open ticker endpoints without sharing your portfolio values.
            </p>
          </div>

          {/* 6. Onboarding & Vault Management Actions */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOnboarding();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>How Afinity Works (Tour)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Clear All Data (Start Empty)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load Demo Data</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for Clearing All Data to Start Clean Empty Vault */}
      <Modal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        title="Start Fresh With Empty Vault"
        subtitle="Remove all sample data to begin entering your real financial records"
      >
        <div className="space-y-4 py-2 text-slate-200">
          <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-800/80 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-amber-200 block">Clear All Sample Records</span>
              <p className="text-slate-300 leading-relaxed">
                This will delete all demo bank accounts, cards, investments, and Khatabook records so you can start with a 100% empty vault. You will be able to add your real accounts from scratch.
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(false)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmClear}
              disabled={isClearing}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isClearing ? 'Clearing...' : 'Yes, Clear All to Start Fresh'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for Loading Demo Data */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Load Sample Demo Data"
        subtitle="This will replace current balances and records with sample demo data"
      >
        <div className="space-y-4 py-2 text-slate-200">
          <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800/80 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-rose-200 block">Overwrite Notice</span>
              <p className="text-slate-300 leading-relaxed">
                Loading sample data will replace current accounts, cards, investments, and Khatabook records with default sample figures. We recommend exporting a JSON backup first if you have real data.
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(false)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmReset}
              disabled={isResetting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isResetting ? 'Loading...' : 'Yes, Load Demo Data'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Passcode Setup / Change / Disable Modal */}
      {passcodeModalMode && (
        <PasscodeSetupModal
          isOpen={Boolean(passcodeModalMode)}
          mode={passcodeModalMode}
          onClose={() => setPasscodeModalMode(null)}
          onSuccess={(msg) => {
            onSuccessToast(msg);
            setPasscodeModalMode(null);
          }}
        />
      )}

      {/* Dashboard Card Customization Modal */}
      {isDashboardModalOpen && (
        <DashboardCustomizationModal
          isOpen={isDashboardModalOpen}
          onClose={() => setIsDashboardModalOpen(false)}
          onSuccessToast={(msg) => onSuccessToast(msg)}
        />
      )}
    </>
  );
};

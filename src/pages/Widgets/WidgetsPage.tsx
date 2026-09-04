import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Code,
  Copy,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Database,
  ArrowRight,
} from 'lucide-react';
import { useWidgetSync } from '../../hooks/useWidgetSync';
import { WidgetSize } from '../../types/widget';
import { AndroidWidgetSimulator } from '../../components/widgets/AndroidWidgetSimulator';
import { SmallWidgetView } from '../../components/widgets/SmallWidgetView';
import { MediumWidgetView } from '../../components/widgets/MediumWidgetView';
import { LargeWidgetView } from '../../components/widgets/LargeWidgetView';

export const WidgetsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    snapshot,
    liveSnapshot,
    demoSnapshot,
    previewDataSource,
    setPreviewDataSource,
    isSyncing,
    lastSyncedTime,
    isNative,
    settings,
    updateSettings,
    syncNow,
  } = useWidgetSync();

  const [selectedSize, setSelectedSize] = useState<WidgetSize>('large');
  const [viewMode, setViewMode] = useState<'simulator' | 'gallery' | 'developer'>('simulator');
  const [maskValues, setMaskValues] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleWidgetNavigate = (route: string) => {
    showToast(`Widget tapped! Deep linking to: ${route}`);
    setTimeout(() => {
      navigate(route);
    }, 600);
  };

  const handleManualSync = async () => {
    const res = await syncNow();
    if (res.success) {
      showToast('Snapshot updated & synchronized with Android widgets!');
    }
  };

  const handleCopySnapshot = () => {
    navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast('Widget JSON snapshot copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Toast banner */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Page Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
                Android Home Screen Widgets
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                COMPANION
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Live executive financial widgets designed for Android home screens. Reuses Afinity&apos;s
              underlying calculations with zero plain card numbers or CVVs exposed.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Real vs Demo Data toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setPreviewDataSource('live')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  previewDataSource === 'live'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Live Vault Data
              </button>
              <button
                onClick={() => setPreviewDataSource('demo')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  previewDataSource === 'demo'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sample Demo
              </button>
            </div>

            {/* Privacy Mask Toggle */}
            <button
              onClick={() => setMaskValues(!maskValues)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title={maskValues ? 'Reveal figures' : 'Mask figures'}
            >
              {maskValues ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{maskValues ? 'Masked' : 'Mask'}</span>
            </button>

            {/* Sync Now Button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Widgets'}</span>
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className="my-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">
              Widget Engine Status:{' '}
              <strong className="text-emerald-400">
                {isNative ? 'Native Android Bridge Connected' : 'Web & PWA Local Bridge Active'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            {lastSyncedTime && <span>Last synced: {lastSyncedTime}</span>}
            <span className="text-slate-600">•</span>
            <span>Update interval: {settings.syncIntervalMinutes}m</span>
          </div>
        </div>

        {/* Navigation View Mode Tabs */}
        <div className="flex items-center gap-2 my-6 border-b border-slate-800 pb-3">
          <button
            onClick={() => setViewMode('simulator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'simulator'
                ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Interactive Android Simulator</span>
          </button>

          <button
            onClick={() => setViewMode('gallery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'gallery'
                ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Widget Sizes (Gallery)</span>
          </button>

          <button
            onClick={() => setViewMode('developer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'developer'
                ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Native Code &amp; API Integration</span>
          </button>
        </div>

        {/* VIEW 1: INTERACTIVE SIMULATOR */}
        {viewMode === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Interactive Phone Canvas */}
            <div className="lg:col-span-6 flex flex-col items-center">
              {/* Widget Size Toggle */}
              <div className="flex items-center gap-1 p-1 mb-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setSelectedSize('small')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedSize === 'small'
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Small (2×2)
                </button>
                <button
                  onClick={() => setSelectedSize('medium')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedSize === 'medium'
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Medium (4×2)
                </button>
                <button
                  onClick={() => setSelectedSize('large')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedSize === 'large'
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Large (4×3)
                </button>
              </div>

              {/* The Phone Device */}
              <AndroidWidgetSimulator
                snapshot={snapshot}
                widgetSize={selectedSize}
                maskValues={maskValues}
                onNavigate={handleWidgetNavigate}
              />
              <p className="text-[11px] text-slate-500 mt-3 text-center">
                💡 Tap on any section of the widget inside the phone to test native deep-linking!
              </p>
            </div>

            {/* Right: Live Data Inspection & Deep Link Tester */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-heading flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Live Synced Widget Metrics</span>
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Net Worth
                    </span>
                    <span className="text-sm font-black text-white font-mono">
                      {snapshot.formattedNetWorth}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Bank Balance
                    </span>
                    <span className="text-sm font-black text-cyan-300 font-mono">
                      {snapshot.formattedBankBalance}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Investments
                    </span>
                    <span className="text-sm font-black text-emerald-300 font-mono">
                      {snapshot.formattedInvestmentValue}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Credit Dues
                    </span>
                    <span className="text-sm font-black text-rose-300 font-mono">
                      {snapshot.formattedCreditOutstanding}
                    </span>
                  </div>
                </div>

                {/* Upcoming Commitment detail */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">
                    Next Upcoming Commitment
                  </span>
                  {snapshot.nextCommitment ? (
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-200">
                          {snapshot.nextCommitment.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {snapshot.nextCommitment.badgeText} ({snapshot.nextCommitment.dueDate})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-white font-mono">
                          {snapshot.nextCommitment.formattedAmount}
                        </div>
                        <span className="text-[9px] font-bold text-cyan-400 uppercase">
                          {snapshot.nextCommitment.type === 'sip' ? 'SIP' : 'Credit Card'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">No pending dues scheduled</span>
                  )}
                </div>

                {/* Payment Safety status detail */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Payment Safety Status
                    </span>
                    <span className="text-xs text-slate-300">
                      {snapshot.paymentSafety.description}
                    </span>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-black border uppercase"
                    style={{
                      borderColor: snapshot.paymentSafety.colorHex + '80',
                      color: snapshot.paymentSafety.colorHex,
                      backgroundColor: snapshot.paymentSafety.colorHex + '15',
                    }}
                  >
                    {snapshot.paymentSafety.label}
                  </span>
                </div>
              </div>

              {/* Direct Deep Link Launcher */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-heading flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  <span>Test Widget Deep-Link Targets</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Tapping an Android widget sends an intent with a route. Click below to verify deep-link
                  destinations:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleWidgetNavigate('/')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors text-xs font-bold text-slate-200 flex items-center justify-between"
                  >
                    <span>Dashboard (Home)</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleWidgetNavigate('/investments')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors text-xs font-bold text-emerald-300 flex items-center justify-between"
                  >
                    <span>Investments &amp; SIPs</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleWidgetNavigate('/accounts')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors text-xs font-bold text-cyan-300 flex items-center justify-between"
                  >
                    <span>Bank Accounts</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleWidgetNavigate('/credit')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors text-xs font-bold text-rose-300 flex items-center justify-between"
                  >
                    <span>Credit &amp; Dues</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: ALL SIZES GALLERY */}
        {viewMode === 'gallery' && (
          <div className="space-y-8">
            {/* Small 2x2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white font-heading">
                    1. Small Widget (2×2)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Net Worth hero figure + Available Bank balance pill. Ideal for compact home screen slots.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono">
                  140dp × 140dp
                </span>
              </div>
              <div className="pt-3 flex justify-center sm:justify-start">
                <SmallWidgetView
                  snapshot={snapshot}
                  maskValues={maskValues}
                  onNavigate={handleWidgetNavigate}
                />
              </div>
            </div>

            {/* Medium 4x2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white font-heading">
                    2. Medium Widget (4×2)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Net Worth, Investments, Bank Balance, Credit Dues, and live Payment Safety badge.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono">
                  280dp × 140dp
                </span>
              </div>
              <div className="pt-3 flex justify-center sm:justify-start">
                <MediumWidgetView
                  snapshot={snapshot}
                  maskValues={maskValues}
                  onNavigate={handleWidgetNavigate}
                />
              </div>
            </div>

            {/* Large 4x3 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white font-heading">
                    3. Large Widget (4×3)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Complete executive summary: Net Worth, Assets, Liabilities, 3 Portfolios, and Next Upcoming Commitment with safety status.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono">
                  280dp × 240dp
                </span>
              </div>
              <div className="pt-3 flex justify-center sm:justify-start">
                <LargeWidgetView
                  snapshot={snapshot}
                  maskValues={maskValues}
                  onNavigate={handleWidgetNavigate}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: DEVELOPER & NATIVE INTEGRATION */}
        {viewMode === 'developer' && (
          <div className="space-y-6">
            {/* Native Architecture Details */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-base font-extrabold text-white font-heading flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Native Android Architecture &amp; Security Principles</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <strong className="text-cyan-400 block mb-1">Zero Plain Card Numbers</strong>
                  <p className="text-slate-400">
                    The widget snapshot deliberately strips any 16-digit/4-digit card sequences and account numbers, exposing only safe aggregated metrics.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <strong className="text-emerald-400 block mb-1">Capacitor Native Bridge</strong>
                  <p className="text-slate-400">
                    Native Kotlin class <code>AfinityWidgetBridgePlugin</code> writes snapshots into private Android <code>SharedPreferences</code> and triggers <code>AppWidgetManager</code> updates.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <strong className="text-amber-400 block mb-1">WorkManager Periodic Sync</strong>
                  <p className="text-slate-400">
                    Android WorkManager automatically updates widgets in the background every 30 minutes respecting battery conservation policies.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="text-cyan-400 font-bold mb-1">// Android Project Structure Created</div>
                <div>📁 android/app/src/main/java/com/afinity/finance/</div>
                <div className="pl-4">├── MainActivity.kt (Capacitor Activity &amp; Deep Link Handler)</div>
                <div className="pl-4">└── widget/</div>
                <div className="pl-8">├── AfinityWidgetData.kt (Model &amp; SharedPreferences persistence)</div>
                <div className="pl-8">├── AfinitySmallWidgetProvider.kt (2×2 AppWidgetProvider)</div>
                <div className="pl-8">├── AfinityMediumWidgetProvider.kt (4×2 AppWidgetProvider)</div>
                <div className="pl-8">├── AfinityLargeWidgetProvider.kt (4×3 AppWidgetProvider)</div>
                <div className="pl-8">├── AfinityWidgetBridgePlugin.kt (Capacitor Plugin)</div>
                <div className="pl-8">└── AfinityWidgetUpdateWorker.kt (AndroidX WorkManager)</div>
              </div>
            </div>

            {/* JSON Snapshot Inspector */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white font-heading flex items-center gap-2">
                  <Code className="w-4 h-4 text-cyan-400" />
                  <span>Live Widget Snapshot Payload (JSON)</span>
                </h3>

                <button
                  onClick={handleCopySnapshot}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[340px]">
                {JSON.stringify(snapshot, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default WidgetsPage;

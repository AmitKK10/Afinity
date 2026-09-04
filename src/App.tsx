/**
 * Afinity — Premium Personal Financial Command Center & Net-Worth PWA
 * Step 2: Financial Data Engine & Local Persistence
 */

import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { DesktopSidebar } from './components/navigation/DesktopSidebar';
import { BottomNav } from './components/navigation/BottomNav';
import { TopHeader } from './components/navigation/TopHeader';
import { SecondaryMenuSheet } from './components/navigation/SecondaryMenuSheet';
import { QuickUpdateSheet } from './components/financial/QuickUpdateSheet';
import { SplashScreen } from './components/splash/SplashScreen';
import { SettingsModal } from './components/settings/SettingsModal';
import { DataBackupModal } from './components/settings/DataBackupModal';
import { CsvExportModal } from './components/settings/CsvExportModal';
import { ImportDataModal } from './components/settings/ImportDataModal';
import { PdfExportModal, PdfReportCategory } from './components/settings/PdfExportModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { HomePage } from './pages/Home/HomePage';
import { AccountsPage } from './pages/Accounts/AccountsPage';
import { InvestmentsPage } from './pages/Investments/InvestmentsPage';
import { CreditPage } from './pages/Credit/CreditPage';
import { AnalysisPage } from './pages/Analysis/AnalysisPage';
import { WidgetsPage } from './pages/Widgets/WidgetsPage';
import { AndroidWidgetModal } from './components/widgets/AndroidWidgetModal';
import { FinancialDataProvider, useFinancialData } from './context/FinancialDataContext';
import { SecurityProvider } from './context/SecurityContext';
import { PasscodeLockScreen } from './components/security/PasscodeLockScreen';
import { PwaInstallBanner } from './components/pwa/PwaInstallBanner';
import { useSystemThemeSync } from './hooks/useSystemThemeSync';
import {
  CheckCircle2,
  WifiOff,
} from 'lucide-react';

function LayoutWrapper() {
  useSystemThemeSync();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isQuickUpdateOpen, setIsQuickUpdateOpen] = useState<boolean>(false);
  const [isSecondaryMenuOpen, setIsSecondaryMenuOpen] = useState<boolean>(false);
  const [activeModalKey, setActiveModalKey] = useState<string | null>(null);
  const [pdfCategory, setPdfCategory] = useState<PdfReportCategory>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { isOffline } = useFinancialData();

  // Listen for external open PDF events across views
  useEffect(() => {
    const handleOpenPdf = (e: any) => {
      const cat = e?.detail?.category || 'all';
      setPdfCategory(cat);
      setActiveModalKey('pdf_export');
    };
    window.addEventListener('afinity-open-pdf-export', handleOpenPdf);
    return () => window.removeEventListener('afinity-open-pdf-export', handleOpenPdf);
  }, []);

  // Onboarding auto-check
  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
    const hasCompletedOnboarding = localStorage.getItem('afinity_onboarding_completed');
    if (!hasCompletedOnboarding) {
      setActiveModalKey('onboarding');
    }
  }, []);

  const getPageMeta = (pathname: string) => {
    switch (pathname) {
      case '/':
      case '/dashboard':
      case '/home':
        return { title: 'Executive Command Center', subtitle: 'Overview of assets, liabilities & net-worth' };
      case '/accounts':
        return { title: 'Accounts & Liquid Cash', subtitle: 'Bank accounts, FDs, lockers & Dues & Receivables' };
      case '/cash':
      case '/cash-denominations':
        return { title: 'Physical Cash Vault', subtitle: 'Cash denominations, currency breakdown & locker notes' };
      case '/dues-receivables':
      case '/khatabook':
        return { title: 'Dues & Receivables Ledger', subtitle: 'Lending, borrowing & peer-to-peer receivables' };
      case '/banks':
        return { title: 'Bank Accounts & FDs', subtitle: 'Savings, salary, current accounts & fixed deposits' };
      case '/wallets':
        return { title: 'Digital Wallets & Balances', subtitle: 'Prepaid wallets, gift cards & cashback rewards' };
      case '/investments':
      case '/portfolio':
        return { title: 'Investment Portfolio', subtitle: 'Mutual funds, direct equities, gold & IPOs' };
      case '/ipo':
      case '/ipo-tracker':
        return { title: 'IPO Applications Tracker', subtitle: 'Active bids, blocked funds & allotment status' };
      case '/credit':
      case '/credit-cards':
      case '/creditcards':
        return { title: 'Credit Cards & Limits', subtitle: 'Outstanding dues, billing cycles & shared limit pools' };
      case '/analysis':
      case '/analytics':
      case '/snapshots':
        return { title: 'Portfolio Analytics', subtitle: 'Historical snapshots, trajectory & solvency' };
      case '/widgets':
      case '/android-widgets':
        return { title: 'Android Home Screen Widgets', subtitle: 'Live native widget companion & deep-link hub' };
      default:
        return { title: 'Afinity Command Center', subtitle: 'Personal financial vault' };
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const pageMeta = getPageMeta(location.pathname);

  return (
    <>
      {/* 0. Passcode Lock Screen Overlay (Active when vault is locked) */}
      <PasscodeLockScreen />

      {/* 1. Initial Branded Splash Screen */}
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-600 text-slate-950 font-bold text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode Active — All financial data is being read and saved to local IndexedDB storage.</span>
        </div>
      )}

      {/* 2. Main Application App Shell */}
      <div className="min-h-screen bg-[#080c16] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Desktop Sidebar / Navigation Rail */}
        <DesktopSidebar
          onQuickUpdateClick={() => setIsQuickUpdateOpen(true)}
          onOpenSecondaryModal={(key) => setActiveModalKey(key)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-12">
          {/* Top Sticky Header */}
          <TopHeader
            title={pageMeta.title}
            subtitle={pageMeta.subtitle}
            onOpenMenu={() => setIsSecondaryMenuOpen(true)}
            onQuickUpdateClick={() => setIsQuickUpdateOpen(true)}
          />

          {/* Page View Container */}
          <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
            <Routes>
              {/* Home & Executive Dashboard */}
              <Route
                path="/"
                element={<HomePage onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />
              <Route
                path="/dashboard"
                element={<HomePage onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />
              <Route
                path="/home"
                element={<HomePage onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />

              {/* Accounts, Cash & Dues */}
              <Route
                path="/accounts"
                element={<AccountsPage onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />
              <Route
                path="/cash"
                element={<AccountsPage initialTab="cash" onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />
              <Route
                path="/cash-denominations"
                element={<AccountsPage initialTab="cash" onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />
              <Route
                path="/dues-receivables"
                element={<AccountsPage initialTab="khatabook" onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />
              <Route
                path="/khatabook"
                element={<AccountsPage initialTab="khatabook" onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />
              <Route
                path="/banks"
                element={<AccountsPage initialTab="banks" onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />
              <Route
                path="/wallets"
                element={<AccountsPage initialTab="wallets" onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />

              {/* Investments & Portfolio */}
              <Route
                path="/investments"
                element={<InvestmentsPage onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />
              <Route
                path="/portfolio"
                element={<InvestmentsPage onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />
              <Route
                path="/ipo"
                element={<InvestmentsPage initialTab="ipo" onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />
              <Route
                path="/ipo-tracker"
                element={<InvestmentsPage initialTab="ipo" onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />

              {/* Credit Cards & Limits */}
              <Route
                path="/credit"
                element={<CreditPage onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />
              <Route
                path="/credit-cards"
                element={<CreditPage onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />
              <Route
                path="/creditcards"
                element={<CreditPage onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />

              {/* Portfolio Analytics & Historical Snapshots */}
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/analytics" element={<AnalysisPage />} />
              <Route path="/snapshots" element={<AnalysisPage />} />

              {/* Android Home Screen Widgets Companion */}
              <Route path="/widgets" element={<WidgetsPage />} />
              <Route path="/android-widgets" element={<WidgetsPage />} />

              {/* Fallback to prevent black-screen on unknown routes */}
              <Route
                path="*"
                element={<HomePage onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />}
              />
            </Routes>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav onQuickUpdateClick={() => setIsQuickUpdateOpen(true)} />

        {/* PWA Install Banner */}
        <PwaInstallBanner />

        {/* Quick Update Slide-up Sheet */}
        <QuickUpdateSheet
          isOpen={isQuickUpdateOpen}
          onClose={() => setIsQuickUpdateOpen(false)}
          onSuccess={(_type, msg) => showToast(msg)}
        />

        {/* Secondary Navigation / Modules Sheet */}
        <SecondaryMenuSheet
          isOpen={isSecondaryMenuOpen}
          onClose={() => setIsSecondaryMenuOpen(false)}
          onOpenSettings={() => {
            setIsSecondaryMenuOpen(false);
            setActiveModalKey('settings');
          }}
          onExportData={() => {
            setIsSecondaryMenuOpen(false);
            setActiveModalKey('backup');
          }}
          onImportData={() => {
            setIsSecondaryMenuOpen(false);
            setActiveModalKey('import_data');
          }}
          onOpenPdfModal={() => {
            setIsSecondaryMenuOpen(false);
            setPdfCategory('all');
            setActiveModalKey('pdf_export');
          }}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={activeModalKey === 'settings'}
          onClose={() => setActiveModalKey(null)}
          onOpenBackupModal={() => setActiveModalKey('backup')}
          onOpenCsvModal={() => setActiveModalKey('csv_export')}
          onOpenImportModal={() => setActiveModalKey('import_data')}
          onOpenPdfModal={() => {
            setPdfCategory('all');
            setActiveModalKey('pdf_export');
          }}
          onOpenOnboarding={() => setActiveModalKey('onboarding')}
          onSuccessToast={(msg) => showToast(msg)}
        />

        {/* Data Backup & Restore Modal */}
        <DataBackupModal
          isOpen={activeModalKey === 'backup'}
          onClose={() => setActiveModalKey(null)}
          onOpenCsvModal={() => setActiveModalKey('csv_export')}
          onOpenImportModal={() => setActiveModalKey('import_data')}
          onOpenPdfModal={() => {
            setPdfCategory('all');
            setActiveModalKey('pdf_export');
          }}
          onSuccessToast={(msg) => showToast(msg)}
        />

        {/* CSV Data Export Modal */}
        <CsvExportModal
          isOpen={activeModalKey === 'csv_export'}
          onClose={() => setActiveModalKey(null)}
          onOpenPdfModal={() => {
            setPdfCategory('all');
            setActiveModalKey('pdf_export');
          }}
          onSuccessToast={(msg) => showToast(msg)}
        />

        {/* PDF Financial Statement Export Modal */}
        <PdfExportModal
          isOpen={activeModalKey === 'pdf_export'}
          onClose={() => setActiveModalKey(null)}
          initialCategory={pdfCategory}
          onSuccessToast={(msg) => showToast(msg)}
        />

        {/* Financial Data Import Modal (JSON / CSV with Diff & Merge) */}
        <ImportDataModal
          isOpen={activeModalKey === 'import_data'}
          onClose={() => setActiveModalKey(null)}
          onSuccessToast={(msg) => showToast(msg)}
          onOpenCsvModal={() => setActiveModalKey('csv_export')}
        />

        {/* First-Use Onboarding Tour Modal */}
        <OnboardingModal
          isOpen={activeModalKey === 'onboarding'}
          onClose={() => setActiveModalKey(null)}
        />

        {/* Android Home Screen Widgets Quick Modal */}
        <AndroidWidgetModal
          isOpen={activeModalKey === 'widgets'}
          onClose={() => setActiveModalKey(null)}
        />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#0f1d35] border border-cyan-500/50 shadow-2xl shadow-black/80 flex items-center gap-2.5 text-xs font-bold text-white animate-in slide-in-from-top-4 duration-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <FinancialDataProvider>
        <SecurityProvider>
          <LayoutWrapper />
        </SecurityProvider>
      </FinancialDataProvider>
    </HashRouter>
  );
}

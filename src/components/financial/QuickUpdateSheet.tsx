import React, { useState, useEffect, useMemo } from 'react';
import {
  Banknote,
  Building2,
  CreditCard as CreditCardIcon,
  TrendingUp,
  HandCoins,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  Zap,
  AlertTriangle,
  ChevronRight,
  Info,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { FinancialAmountInput } from '../ui/FinancialAmountInput';
import { SelectField } from '../ui/SelectionSheet';
import { PriceRefreshSummaryModal } from './PriceRefreshSummaryModal';
import { useFinancialData } from '../../context/FinancialDataContext';
import { formatRupee, formatRelativeTime } from '../../utils/formatters';
import { marketPriceService } from '../../services/marketPrice/marketPriceService';
import {
  InvestmentHolding,
  MarketPriceResult,
  PortfolioPriceRefreshSummary,
  PriceRefreshFailureItem,
} from '../../types';
import { cn } from '../../utils/cn';

interface QuickUpdateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (type: string, message: string) => void;
}

export const QuickUpdateSheet: React.FC<QuickUpdateSheetProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    cashHoldings,
    bankAccounts,
    creditCards,
    investments,
    khatabookEntries,
    updateCashDenominations,
    updateBankAccount,
    updateCreditCard,
    updateInvestment,
    updateInvestmentPrice,
    updateKhatabookEntry,
    refreshInvestmentPrices,
    isPriceRefreshing,
    lastPriceRefreshSummary,
  } = useFinancialData();

  const [activeTab, setActiveTab] = useState<'cash' | 'bank' | 'card' | 'investment' | 'khatabook'>('cash');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [updatedAmount, setUpdatedAmount] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live Market Price State inside QuickUpdateSheet
  const [isSyncingPortfolio, setIsSyncingPortfolio] = useState<boolean>(false);
  const [syncSummary, setSyncSummary] = useState<PortfolioPriceRefreshSummary | null>(null);
  const [isInspectFailedOpen, setIsInspectFailedOpen] = useState<boolean>(false);
  const [isFullReportModalOpen, setIsFullReportModalOpen] = useState<boolean>(false);
  const [isFetchingSingleLive, setIsFetchingSingleLive] = useState<boolean>(false);
  const [singleLiveResult, setSingleLiveResult] = useState<MarketPriceResult | null>(null);

  // Active entities
  const activeCash = useMemo(() => cashHoldings.filter((c) => c.status === 'active'), [cashHoldings]);
  const activeBanks = useMemo(() => bankAccounts.filter((b) => b.status === 'active'), [bankAccounts]);
  const activeCards = useMemo(() => creditCards.filter((c) => c.status === 'active'), [creditCards]);
  const activeInvs = useMemo(() => investments.filter((i) => i.status === 'active'), [investments]);
  const activeKb = useMemo(() => khatabookEntries.filter((k) => k.status === 'active' && !k.isSettled), [khatabookEntries]);

  // Currently selected holding object
  const selectedHolding = useMemo(
    () => activeInvs.find((i) => i.id === selectedEntityId) || null,
    [activeInvs, selectedEntityId]
  );

  // Cash denomination state
  const [denominations, setDenominations] = useState<{ [denom: number]: number }>({
    500: 42,
    200: 12,
    100: 10,
    50: 2,
  });

  // Set default selected entities on tab change or data load
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setUpdatedAmount('');
    setSingleLiveResult(null);

    if (activeTab === 'cash') {
      if (activeCash.length > 0) {
        const defaultCash = activeCash[0];
        setSelectedEntityId(defaultCash.id);
        const denomMap: { [denom: number]: number } = { 500: 0, 200: 0, 100: 0, 50: 0 };
        defaultCash.denominations?.forEach((d) => {
          denomMap[d.denomination] = d.count;
        });
        setDenominations(denomMap);
      } else {
        setSelectedEntityId('');
      }
    } else if (activeTab === 'bank') {
      if (activeBanks.length > 0) {
        setSelectedEntityId(activeBanks[0].id);
        setUpdatedAmount(String(activeBanks[0].balance));
      } else {
        setSelectedEntityId('');
      }
    } else if (activeTab === 'card') {
      if (activeCards.length > 0) {
        setSelectedEntityId(activeCards[0].id);
        setUpdatedAmount(String(activeCards[0].outstandingBalance));
      } else {
        setSelectedEntityId('');
      }
    } else if (activeTab === 'investment') {
      if (activeInvs.length > 0) {
        setSelectedEntityId(activeInvs[0].id);
        setUpdatedAmount(String(activeInvs[0].currentValue));
      } else {
        setSelectedEntityId('');
      }
    } else if (activeTab === 'khatabook') {
      if (activeKb.length > 0) {
        setSelectedEntityId(activeKb[0].id);
        setUpdatedAmount(String(activeKb[0].amount));
      } else {
        setSelectedEntityId('');
      }
    }
  }, [isOpen, activeTab, cashHoldings, bankAccounts, creditCards, investments, khatabookEntries]);

  // Sync summary with context if available
  useEffect(() => {
    if (lastPriceRefreshSummary) {
      setSyncSummary(lastPriceRefreshSummary);
    }
  }, [lastPriceRefreshSummary]);

  const calculateCashTotal = () => {
    return Object.entries(denominations).reduce(
      (sum, [denom, count]) => sum + Number(denom) * Number(count),
      0
    );
  };

  const handleDenomChange = (denom: number, delta: number) => {
    setDenominations((prev) => ({
      ...prev,
      [denom]: Math.max(0, (prev[denom] || 0) + delta),
    }));
  };

  // Trigger live market price query for single selected holding
  const handleFetchSingleHoldingLivePrice = async () => {
    if (!selectedHolding) return;
    setIsFetchingSingleLive(true);
    setErrorMessage(null);
    setSingleLiveResult(null);

    try {
      const provider = marketPriceService.getProvider();
      const rawType = (selectedHolding.assetType || selectedHolding.type || 'STOCK').toString().toUpperCase();
      let res: MarketPriceResult;

      if (rawType === 'MUTUAL_FUND' || rawType === 'MUTUAL_FUNDS') {
        const codeOrName = selectedHolding.schemeCode || selectedHolding.symbol || selectedHolding.name;
        res = await provider.getMutualFundNAV(codeOrName, selectedHolding.name);
      } else if (rawType === 'GOLD' || rawType === 'SGB') {
        res = await provider.getGoldPrice(selectedHolding.unit || 'GRAM');
      } else if (rawType === 'ETF' && provider.getEtfPrice) {
        res = await provider.getEtfPrice(selectedHolding.symbol || selectedHolding.name);
      } else {
        res = await provider.getStockPrice(selectedHolding.symbol || selectedHolding.name);
      }

      setSingleLiveResult(res);

      if (res.isSuccess && res.price > 0) {
        const qty = Number(selectedHolding.quantity !== undefined ? selectedHolding.quantity : selectedHolding.unitsHeld || 1);
        const calculatedVal = Math.round(qty * res.price * 100) / 100;
        setUpdatedAmount(String(calculatedVal));
      } else {
        setErrorMessage(
          res.errorMessage || `Could not fetch live quote for ${selectedHolding.displayName || selectedHolding.name}. Existing valuation retained.`
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to query live market quote provider');
    } finally {
      setIsFetchingSingleLive(false);
    }
  };

  // Trigger full portfolio refresh with independent reporting
  const handleSyncAllPortfolioLive = async () => {
    setIsSyncingPortfolio(true);
    setErrorMessage(null);
    try {
      const result = await refreshInvestmentPrices({ force: true });
      setSyncSummary(result);
      if (result.totalFailed > 0) {
        setIsInspectFailedOpen(true);
      }
      // If current holding updated, refresh input
      if (selectedEntityId) {
        const fresh = investments.find((i) => i.id === selectedEntityId);
        if (fresh) {
          setUpdatedAmount(String(fresh.currentValue));
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Portfolio sync failed. Retaining manual prices.');
    } finally {
      setIsSyncingPortfolio(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      if (activeTab === 'cash') {
        const selectedCash = activeCash.find((c) => c.id === selectedEntityId) || activeCash[0];
        if (!selectedCash) throw new Error('No cash holding available to update');

        const denomArray = Object.entries(denominations).map(([denom, count]) => ({
          denomination: Number(denom),
          count: Number(count),
        }));

        await updateCashDenominations(selectedCash.id, denomArray);
        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          onClose();
          onSuccess?.(activeTab, `✓ Cash vault balance updated to ${formatRupee(calculateCashTotal())}`);
        }, 600);
      } else {
        const rawAmt = updatedAmount.trim();
        const parsed = rawAmt === '' || rawAmt === '-' ? 0 : parseFloat(rawAmt);
        if (isNaN(parsed)) {
          setErrorMessage('Please enter a valid numeric amount');
          return;
        }

        if (activeTab === 'bank') {
          const bank = activeBanks.find((b) => b.id === selectedEntityId);
          if (!bank) throw new Error('No bank account selected');
          await updateBankAccount(bank.id, { balance: parsed });
          onSuccess?.(activeTab, `✓ ${bank.name} balance updated to ${formatRupee(parsed)}`);
        } else if (activeTab === 'card') {
          const card = activeCards.find((c) => c.id === selectedEntityId);
          if (!card) throw new Error('No credit card selected');
          await updateCreditCard(card.id, { outstandingBalance: parsed });
          onSuccess?.(activeTab, `✓ ${card.cardName} dues updated to ${formatRupee(parsed)}`);
        } else if (activeTab === 'investment') {
          const inv = activeInvs.find((i) => i.id === selectedEntityId);
          if (!inv) throw new Error('No investment holding selected');

          if (singleLiveResult && singleLiveResult.isSuccess && singleLiveResult.price > 0) {
            const now = new Date().toISOString();
            await updateInvestmentPrice(inv.id, singleLiveResult.price, singleLiveResult.source, {
              priceUpdatedAt: now,
              priceAsOfDate: singleLiveResult.asOfDate || now,
              priceFetchedAt: singleLiveResult.fetchedAt || now,
              priceStatus: 'updated',
              dayChange: singleLiveResult.changeAmount,
              dayChangePercentage: singleLiveResult.changePercentage,
            });
          } else {
            await updateInvestment(inv.id, { currentValue: parsed });
          }

          onSuccess?.(activeTab, `✓ ${inv.displayName || inv.name} valuation updated to ${formatRupee(parsed)}`);
        } else if (activeTab === 'khatabook') {
          const kb = activeKb.find((k) => k.id === selectedEntityId);
          if (!kb) throw new Error('No pending Dues & Receivables entry selected');
          await updateKhatabookEntry(kb.id, { amount: parsed });
          onSuccess?.(activeTab, `✓ ${kb.personName} updated to ${formatRupee(parsed)}`);
        }

        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          onClose();
        }, 600);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const updateTabs = [
    { key: 'cash' as const, label: 'Cash', icon: Banknote, color: 'text-amber-400' },
    { key: 'bank' as const, label: 'Bank', icon: Building2, color: 'text-blue-400' },
    { key: 'card' as const, label: 'Cards', icon: CreditCardIcon, color: 'text-rose-400' },
    { key: 'investment' as const, label: 'Invest', icon: TrendingUp, color: 'text-emerald-400' },
    { key: 'khatabook' as const, label: 'Dues', icon: HandCoins, color: 'text-purple-400' },
  ];

  const isCurrentTabEmpty =
    (activeTab === 'cash' && activeCash.length === 0) ||
    (activeTab === 'bank' && activeBanks.length === 0) ||
    (activeTab === 'card' && activeCards.length === 0) ||
    (activeTab === 'investment' && activeInvs.length === 0) ||
    (activeTab === 'khatabook' && activeKb.length === 0);

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Quick Financial Command & Update"
        subtitle="Update live account balances, physical cash notes, or sync market quotes"
      >
        {/* Category Selection Tabs — Clean 5-column grid */}
        <div className="grid grid-cols-5 gap-1 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
          {updateTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setUpdatedAmount('');
                  setSingleLiveResult(null);
                  setErrorMessage(null);
                }}
                className={cn(
                  'py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none font-heading text-center',
                  isActive
                    ? 'bg-[#1e293b] text-white shadow-md border border-slate-700/70'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? tab.color : 'text-slate-400')} />
                <span className="truncate w-full">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="leading-snug">
                <strong>Notice: </strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Tab 1: Cash & Denominations Counter */}
          {activeTab === 'cash' && (
            <div className="space-y-3">
              {activeCash.length > 1 && (
                <div>
                  <SelectField
                    label="Select Cash Vault"
                    value={selectedEntityId}
                    onChange={(id) => {
                      setSelectedEntityId(id);
                      const sel = activeCash.find((c) => c.id === id);
                      if (sel) {
                        const denomMap: { [denom: number]: number } = { 500: 0, 200: 0, 100: 0, 50: 0 };
                        sel.denominations?.forEach((d) => {
                          denomMap[d.denomination] = d.count;
                        });
                        setDenominations(denomMap);
                      }
                    }}
                    options={activeCash.map((c) => ({
                      value: c.id,
                      label: c.name,
                      sublabel: c.location || 'Physical Cash',
                      badge: formatRupee(c.balance),
                      badgeColor: 'emerald' as const,
                    }))}
                  />
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/30 to-slate-900 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-300/80 font-medium">Calculated Cash Total</span>
                  <div className="text-2xl font-black text-white tabular-nums">
                    {formatRupee(calculateCashTotal())}
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  Live Calculator
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Physical Note Counter</span>
                {[500, 200, 100, 50].map((denom) => (
                  <div
                    key={denom}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-14 font-mono font-bold text-sm text-slate-200">
                        ₹{denom}
                      </span>
                      <span className="text-xs text-slate-400">
                        = {formatRupee(denom * (denominations[denom] || 0))}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDenomChange(denom, -1)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-base cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-mono font-bold text-sm text-white">
                        {denominations[denom] || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDenomChange(denom, 1)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-base cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Bank Account Update */}
          {activeTab === 'bank' && (
            <div className="space-y-3">
              <div>
                {activeBanks.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-500" />
                    <span>No active bank accounts found.</span>
                  </div>
                ) : (
                  <SelectField
                    label="Select Bank Account"
                    value={selectedEntityId}
                    onChange={(id) => {
                      setSelectedEntityId(id);
                      const sel = activeBanks.find((b) => b.id === id);
                      if (sel) setUpdatedAmount(String(sel.balance));
                    }}
                    options={activeBanks.map((b) => ({
                      value: b.id,
                      label: b.name,
                      sublabel: `${b.accountNumberMasked || 'Account'} (${b.institutionName || b.bankName || 'Bank'})`,
                      badge: formatRupee(b.balance),
                      badgeColor: 'blue' as const,
                    }))}
                  />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    New Closing Balance (₹)
                  </label>
                  <span className="text-[10px] text-cyan-400">Supports negative balance</span>
                </div>
                <FinancialAmountInput
                  id="input-quick-update-bank"
                  disabled={activeBanks.length === 0}
                  placeholder="e.g. 92500 or -5000"
                  value={updatedAmount}
                  onChange={setUpdatedAmount}
                  allowNegative={true}
                  currencySymbol="₹"
                  inputClassName="p-3.5 rounded-xl text-base focus:border-blue-500 disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Credit Card Dues Update */}
          {activeTab === 'card' && (
            <div className="space-y-3">
              <div>
                {activeCards.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-500" />
                    <span>No active credit cards found.</span>
                  </div>
                ) : (
                  <SelectField
                    label="Select Credit Card"
                    value={selectedEntityId}
                    onChange={(id) => {
                      setSelectedEntityId(id);
                      const sel = activeCards.find((c) => c.id === id);
                      if (sel) setUpdatedAmount(String(sel.outstandingBalance));
                    }}
                    options={activeCards.map((c) => ({
                      value: c.id,
                      label: `${c.bankName || ''} ${c.cardName}`,
                      sublabel: `Card ending •••• ${c.lastFourDigits}`,
                      badge: formatRupee(c.outstandingBalance),
                      badgeColor: 'rose' as const,
                    }))}
                  />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Updated Current Outstanding / Bill Amount (₹)
                  </label>
                  <span className="text-[10px] text-rose-400">Refunds/overpayments can be negative</span>
                </div>
                <FinancialAmountInput
                  id="input-quick-update-card"
                  disabled={activeCards.length === 0}
                  placeholder="e.g. 15200"
                  value={updatedAmount}
                  onChange={setUpdatedAmount}
                  allowNegative={true}
                  currencySymbol="₹"
                  inputClassName="p-3.5 rounded-xl text-base focus:border-rose-500 disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Tab 4: Investments Valuation & Live Market Sync */}
          {activeTab === 'investment' && (
            <div className="space-y-3.5">
              {/* Portfolio Market Price Sync Bar */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#0c1f38] via-[#09152b] to-[#0a1020] border border-cyan-800/50 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-bold text-xs text-white">Live Market Quotes Sync</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      AMFI (Mutual Funds) • NSE/BSE • IBJA Gold
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncAllPortfolioLive}
                    disabled={isSyncingPortfolio || isPriceRefreshing}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950/40 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={cn(
                        'w-3.5 h-3.5',
                        (isSyncingPortfolio || isPriceRefreshing) && 'animate-spin'
                      )}
                    />
                    <span>{isSyncingPortfolio || isPriceRefreshing ? 'Syncing...' : 'Sync All Live'}</span>
                  </button>
                </div>

                {/* Independent Metrics Row if a sync occurred */}
                {syncSummary && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px]">
                        <span className="text-slate-400 block">Queried</span>
                        <span className="font-bold text-white font-mono text-xs">
                          {syncSummary.totalAttempted}
                        </span>
                      </div>

                      <div className="p-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[10px]">
                        <span className="text-emerald-400 block">Verified / Live</span>
                        <span className="font-bold text-emerald-300 font-mono text-xs">
                          {syncSummary.totalSuccess !== undefined
                            ? syncSummary.totalSuccess
                            : syncSummary.totalUpdated + syncSummary.totalUnchanged}
                        </span>
                      </div>

                      <div
                        className={cn(
                          'p-1.5 rounded-xl border text-[10px]',
                          syncSummary.totalFailed > 0
                            ? 'bg-amber-950/50 border-amber-700/60 text-amber-300 font-bold'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400'
                        )}
                      >
                        <span className="block">Retained / Failed</span>
                        <span className="font-bold font-mono text-xs">
                          {syncSummary.totalFailed}
                        </span>
                      </div>
                    </div>

                    {/* Status Headline */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 flex items-center gap-1">
                        {syncSummary.isCompleteSuccess ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : syncSummary.totalFailed > 0 ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        )}
                        <span className="truncate max-w-[210px] sm:max-w-[260px]">
                          {syncSummary.statusHeadline || 'Sync completed'}
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setIsFullReportModalOpen(true)}
                        className="text-cyan-400 hover:text-cyan-300 font-bold text-[10px] hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <span>Full Report</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Failed Assets Inspection Collapsible */}
                    {syncSummary.failedHoldings && syncSummary.failedHoldings.length > 0 && (
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => setIsInspectFailedOpen(!isInspectFailedOpen)}
                          className="w-full py-1 px-2 rounded-lg bg-amber-950/40 hover:bg-amber-950/60 border border-amber-800/40 text-[10px] font-bold text-amber-300 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                            <span>Inspect {syncSummary.failedHoldings.length} Failed / Retained Assets</span>
                          </span>
                          <ChevronDown
                            className={cn(
                              'w-3 h-3 transition-transform',
                              isInspectFailedOpen && 'rotate-180'
                            )}
                          />
                        </button>

                        {isInspectFailedOpen && (
                          <div className="mt-1.5 space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                            {syncSummary.failedHoldings.map((fh: PriceRefreshFailureItem, idx: number) => (
                              <div
                                key={fh.id || idx}
                                className="p-2 rounded-xl bg-slate-900/90 border border-amber-800/30 text-[11px] space-y-0.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-200 truncate max-w-[170px]">
                                    {fh.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (fh.id && fh.id !== 'system' && fh.id !== 'network') {
                                        setSelectedEntityId(fh.id);
                                        const h = activeInvs.find((i) => i.id === fh.id);
                                        if (h) setUpdatedAmount(String(h.currentValue));
                                      }
                                    }}
                                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer"
                                  >
                                    Select
                                  </button>
                                </div>
                                <span className="text-[10px] text-amber-400 block leading-tight">
                                  {fh.reason}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Holding Selection */}
              <div>
                {activeInvs.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-500" />
                    <span>No active investment holdings found.</span>
                  </div>
                ) : (
                  <SelectField
                    label="Select Holding / Fund to Update"
                    value={selectedEntityId}
                    onChange={(id) => {
                      setSelectedEntityId(id);
                      setSingleLiveResult(null);
                      const sel = activeInvs.find((i) => i.id === id);
                      if (sel) setUpdatedAmount(String(sel.currentValue));
                    }}
                    options={activeInvs.map((i) => ({
                      value: i.id,
                      label: i.displayName || i.name,
                      sublabel: `${i.platform || 'Portfolio'} • ${i.type || i.assetType || 'Asset'}`,
                      badge: formatRupee(i.currentValue),
                      badgeColor: 'emerald' as const,
                    }))}
                    showSearch={activeInvs.length > 5}
                  />
                )}
              </div>

              {/* Selected Holding Diagnostics & Single Live Query */}
              {selectedHolding && (
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Current Recorded Price</span>
                      <span className="font-mono font-bold text-white text-sm">
                        ₹{Number(selectedHolding.currentPrice || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Source: {selectedHolding.priceSource || 'MANUAL'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleFetchSingleHoldingLivePrice}
                      disabled={isFetchingSingleLive}
                      className="px-3 py-1.5 rounded-xl bg-[#09152b] hover:bg-slate-800 border border-cyan-800/60 text-cyan-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      <Zap className={cn('w-3.5 h-3.5 text-cyan-400', isFetchingSingleLive && 'animate-spin')} />
                      <span>{isFetchingSingleLive ? 'Querying...' : 'Fetch Live NAV'}</span>
                    </button>
                  </div>

                  {singleLiveResult && singleLiveResult.isSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
                      <span className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Live NAV ({singleLiveResult.providerName})</span>
                      </span>
                      <span className="font-mono font-bold text-white">
                        ₹{singleLiveResult.price}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Portfolio Valuation (₹) *
                </label>
                <FinancialAmountInput
                  id="input-quick-update-invest"
                  disabled={activeInvs.length === 0}
                  placeholder="e.g. 115000"
                  value={updatedAmount}
                  onChange={setUpdatedAmount}
                  allowNegative={false}
                  currencySymbol="₹"
                  min={0}
                  inputClassName="p-3.5 rounded-xl text-base focus:border-emerald-500 disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Tab 5: Dues & Receivables Ledger Update */}
          {activeTab === 'khatabook' && (
            <div className="space-y-3">
              <div>
                {activeKb.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/50 text-xs text-purple-200 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 font-semibold text-purple-300">
                      <AlertCircle className="w-4 h-4 shrink-0 text-purple-400" />
                      <span>No pending dues/receivables entries</span>
                    </div>
                    <p className="text-[11px] text-purple-300/70">
                      All ledger entries are settled or none exist yet. Add a new entry from Accounts &rarr; Dues &amp; Receivables.
                    </p>
                  </div>
                ) : (
                  <SelectField
                    label="Select Person / Record"
                    value={selectedEntityId}
                    onChange={(id) => {
                      setSelectedEntityId(id);
                      const sel = activeKb.find((k) => k.id === id);
                      if (sel) setUpdatedAmount(String(sel.amount));
                    }}
                    options={activeKb.map((k) => ({
                      value: k.id,
                      label: k.personName,
                      sublabel: k.type === 'receivable' ? 'You get' : 'You owe',
                      badge: formatRupee(k.amount),
                      badgeColor: k.type === 'receivable' ? ('emerald' as const) : ('rose' as const),
                    }))}
                    showSearch={activeKb.length > 5}
                  />
                )}
              </div>

              {activeKb.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    New Pending Balance (₹)
                  </label>
                  <FinancialAmountInput
                    id="input-quick-update-khatabook"
                    placeholder="e.g. 20000 or 0 if settled"
                    value={updatedAmount}
                    onChange={setUpdatedAmount}
                    allowNegative={false}
                    currencySymbol="₹"
                    min={0}
                    inputClassName="p-3.5 rounded-xl text-base focus:border-purple-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitted || isCurrentTabEmpty}
            className={cn(
              'w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-heading mt-4 disabled:opacity-50 disabled:cursor-not-allowed',
              isSubmitted
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-cyan-900/30'
            )}
          >
            {isSubmitted ? (
              <>
                <CheckCircle2 className="w-5 h-5 animate-bounce" />
                <span>Saved to Local Vault!</span>
              </>
            ) : (
              <>
                <span>Save &amp; Update Valuation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </BottomSheet>

      {/* Standalone Full Price Refresh Diagnostic Report Modal */}
      <PriceRefreshSummaryModal
        isOpen={isFullReportModalOpen}
        onClose={() => setIsFullReportModalOpen(false)}
        summary={syncSummary}
        onForceRefresh={handleSyncAllPortfolioLive}
        onInspectHolding={(holdingId) => {
          setSelectedEntityId(holdingId);
          const h = activeInvs.find((i) => i.id === holdingId);
          if (h) setUpdatedAmount(String(h.currentValue));
        }}
      />
    </>
  );
};

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Building2,
  Landmark,
  Coins,
  Wallet,
  CreditCard,
  Receipt,
  PiggyBank,
  Search,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  Layers,
  PieChart as PieChartIcon,
  Tag,
  ArrowRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import {
  InvestmentHolding,
  CreditCard as CreditCardType,
  KhatabookEntry,
  BankAccount,
  CashHoldingAccount,
  FixedDepositAccount,
  DigitalWallet,
} from '../../types';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { FinancialCard } from '../ui/FinancialCard';
import { SelectField } from '../ui/SelectionSheet';
import { cn } from '../../utils/cn';

export type DrillDownCategoryKey =
  | 'investments'
  | 'banks'
  | 'fixed_deposits'
  | 'cash'
  | 'wallets'
  | 'liabilities'
  | 'receivables';

export type InvestmentSubFilter = 'all' | 'stock' | 'etf' | 'mutual_fund' | 'gold_sgb' | 'other';
export type LiabilitySubFilter = 'all' | 'credit_cards' | 'payables' | 'overdrafts';

interface AnalysisDrillDownExplorerProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  cashHoldings: CashHoldingAccount[];
  bankAccounts: BankAccount[];
  fixedDeposits: FixedDepositAccount[];
  wallets: DigitalWallet[];
  investments: InvestmentHolding[];
  creditCards: CreditCardType[];
  khatabookEntries: KhatabookEntry[];
  selectedCategory?: DrillDownCategoryKey | null;
  onSelectCategory?: (category: DrillDownCategoryKey) => void;
  className?: string;
}

export const AnalysisDrillDownExplorer: React.FC<AnalysisDrillDownExplorerProps> = ({
  netWorth,
  totalAssets,
  totalLiabilities,
  cashHoldings = [],
  bankAccounts = [],
  fixedDeposits = [],
  wallets = [],
  investments = [],
  creditCards = [],
  khatabookEntries = [],
  selectedCategory: controlledCategory,
  onSelectCategory,
  className,
}) => {
  const [internalCategory, setInternalCategory] = useState<DrillDownCategoryKey>('investments');
  const activeCategory = controlledCategory || internalCategory;

  const handleCategoryChange = (cat: DrillDownCategoryKey) => {
    setInternalCategory(cat);
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
  };

  // Sub-filters & Search & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [investmentFilter, setInvestmentFilter] = useState<InvestmentSubFilter>('all');
  const [liabilityFilter, setLiabilityFilter] = useState<LiabilitySubFilter>('all');
  const [sortBy, setSortBy] = useState<'value_desc' | 'value_asc' | 'pnl_desc' | 'name_asc'>('value_desc');

  // Active items
  const activeCash = (cashHoldings || []).filter((c) => c?.status === 'active');
  const activeBanks = (bankAccounts || []).filter((b) => b?.status === 'active');
  const activeFds = (fixedDeposits || []).filter((f) => f?.status === 'active');
  const activeWallets = (wallets || []).filter((w) => w?.status === 'active');
  const activeInvs = (investments || []).filter((i) => i?.status === 'active' || i?.status === 'ACTIVE');
  const activeCards = (creditCards || []).filter((c) => c?.status === 'active');
  const activeReceivables = (khatabookEntries || []).filter((k) => k?.status === 'active' && k?.type === 'receivable' && !k?.isSettled);
  const activePayables = (khatabookEntries || []).filter((k) => k?.status === 'active' && k?.type === 'payable' && !k?.isSettled);

  // Totals for percentage calculations
  const totalCashVal = activeCash.reduce((s, c) => s + Math.max(0, Number(c?.balance || 0)), 0);
  const totalBankVal = activeBanks.reduce((s, b) => s + Math.max(0, Number(b?.balance || 0)), 0);
  const totalFdVal = activeFds.reduce((s, f) => {
    const v = f?.estimatedCurrentValue !== undefined ? Number(f.estimatedCurrentValue) : Number(f?.principal || f?.balance || 0);
    return s + Math.max(0, v);
  }, 0);
  const totalWalletVal = activeWallets.reduce((s, w) => {
    if (w?.includeInNetWorth === false) return s;
    return s + Math.max(0, Number(w?.balance || 0));
  }, 0);
  const totalInvVal = activeInvs.reduce((s, i) => {
    const qty = Number(i?.quantity !== undefined ? i.quantity : i?.unitsHeld || 0);
    const price = Number(i?.currentPrice || 0);
    const v = i?.currentValue !== undefined && i.currentValue > 0 ? Number(i.currentValue) : qty * price;
    return s + Math.max(0, v);
  }, 0);
  const totalReceivablesVal = activeReceivables.reduce((s, r) => s + Math.max(0, Number(r?.amount || 0)), 0);
  const totalCardsVal = activeCards.reduce((s, c) => {
    if (c?.includeInNetWorth === false) return s;
    const out = Number(c?.outstanding !== undefined ? c.outstanding : c?.outstandingBalance || 0);
    return s + (out > 0 ? out : 0);
  }, 0);
  const totalPayablesVal = activePayables.reduce((s, p) => s + Math.max(0, Number(p?.amount || 0)), 0);
  const totalLiabVal = totalCardsVal + totalPayablesVal;

  const effectiveNetWorth = netWorth !== 0 ? netWorth : 1;

  // Category counts and totals for tabs
  const categoryMeta: Record<DrillDownCategoryKey, { label: string; count: number; total: number; icon: React.ElementType; color: string }> = {
    investments: {
      label: 'Investments',
      count: activeInvs.length,
      total: totalInvVal,
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
    banks: {
      label: 'Bank Accounts',
      count: activeBanks.length,
      total: totalBankVal,
      icon: Building2,
      color: 'text-blue-400',
    },
    fixed_deposits: {
      label: 'Fixed Deposits',
      count: activeFds.length,
      total: totalFdVal,
      icon: Landmark,
      color: 'text-cyan-400',
    },
    cash: {
      label: 'Cash Vaults',
      count: activeCash.length,
      total: totalCashVal,
      icon: Coins,
      color: 'text-amber-400',
    },
    wallets: {
      label: 'Digital Wallets',
      count: activeWallets.length,
      total: totalWalletVal,
      icon: Wallet,
      color: 'text-purple-400',
    },
    liabilities: {
      label: 'Liabilities',
      count: activeCards.length + activePayables.length,
      total: totalLiabVal,
      icon: CreditCard,
      color: 'text-rose-400',
    },
    receivables: {
      label: 'Receivables',
      count: activeReceivables.length,
      total: totalReceivablesVal,
      icon: Receipt,
      color: 'text-pink-400',
    },
  };

  // Filtered & Sorted Data according to Active Category
  const drillDownItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    if (activeCategory === 'investments') {
      let list = activeInvs.map((inv) => {
        const qty = Number(inv?.quantity !== undefined ? inv.quantity : inv?.unitsHeld || 0);
        const avgBuy = Number(inv?.averageBuyPrice || 0);
        const currPrice = Number(inv?.currentPrice || 0);
        const invested = inv?.investedAmount !== undefined && inv.investedAmount > 0 ? Number(inv.investedAmount) : qty * avgBuy;
        const current = inv?.currentValue !== undefined && inv.currentValue > 0 ? Number(inv.currentValue) : qty * currPrice;
        const pnl = current - invested;
        const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
        const categoryPct = totalInvVal > 0 ? (current / totalInvVal) * 100 : 0;
        const netWorthPct = (current / effectiveNetWorth) * 100;

        const rawType = (inv?.assetType || inv?.type || 'STOCK').toUpperCase();
        let normalizedSubtype: 'stock' | 'etf' | 'mutual_fund' | 'gold_sgb' | 'other' = 'other';
        if (rawType === 'ETF' || rawType.includes('ETF')) normalizedSubtype = 'etf';
        else if (rawType.includes('STOCK') || rawType.includes('EQUITY')) normalizedSubtype = 'stock';
        else if (rawType.includes('MUTUAL') || rawType.includes('MF') || rawType.includes('FUND')) normalizedSubtype = 'mutual_fund';
        else if (rawType.includes('GOLD') || rawType.includes('SGB')) normalizedSubtype = 'gold_sgb';

        return {
          id: inv.id,
          name: inv.name || inv.displayName || inv.symbol || 'Unnamed Holding',
          symbol: inv.symbol,
          subtype: normalizedSubtype,
          assetTypeRaw: inv.assetType || inv.type || 'Stock',
          broker: inv.broker || inv.platform || 'Direct',
          quantity: qty,
          unit: inv.unit || 'units',
          avgBuyPrice: avgBuy,
          currentPrice: currPrice,
          investedAmount: invested,
          currentValue: current,
          pnl,
          pnlPct,
          categoryPct,
          netWorthPct,
        };
      });

      // Filter by subtype
      if (investmentFilter !== 'all') {
        list = list.filter((i) => i.subtype === investmentFilter);
      }

      // Filter by search
      if (q) {
        list = list.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            (i.symbol && i.symbol.toLowerCase().includes(q)) ||
            i.broker.toLowerCase().includes(q)
        );
      }

      // Sort
      list.sort((a, b) => {
        if (sortBy === 'value_desc') return b.currentValue - a.currentValue;
        if (sortBy === 'value_asc') return a.currentValue - b.currentValue;
        if (sortBy === 'pnl_desc') return b.pnl - a.pnl;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });

      return list;
    }

    if (activeCategory === 'banks') {
      let list = activeBanks.map((bank) => {
        const bal = Number(bank?.balance || 0);
        const categoryPct = totalBankVal > 0 ? (bal / totalBankVal) * 100 : 0;
        const netWorthPct = (bal / effectiveNetWorth) * 100;

        return {
          id: bank.id,
          name: bank.name || bank.displayName || 'Bank Account',
          bankName: bank.bankName || bank.institutionName || 'Bank',
          accountType: bank.accountType || 'Savings',
          accountNumberMasked: bank.accountNumberMasked || bank.last4 ? `•••• ${bank.last4}` : '',
          ifscCode: bank.ifscCode,
          balance: bal,
          categoryPct,
          netWorthPct,
        };
      });

      if (q) {
        list = list.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.bankName.toLowerCase().includes(q) ||
            b.accountType.toLowerCase().includes(q)
        );
      }

      list.sort((a, b) => {
        if (sortBy === 'value_desc') return b.balance - a.balance;
        if (sortBy === 'value_asc') return a.balance - b.balance;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });

      return list;
    }

    if (activeCategory === 'fixed_deposits') {
      let list = activeFds.map((fd) => {
        const principal = Number(fd?.principal || fd?.balance || 0);
        const currentValue = fd?.estimatedCurrentValue !== undefined ? Number(fd.estimatedCurrentValue) : principal;
        const maturityAmount = Number(fd?.maturityAmount || currentValue);
        const interestRate = Number(fd?.interestRate || 0);
        const categoryPct = totalFdVal > 0 ? (currentValue / totalFdVal) * 100 : 0;
        const netWorthPct = (currentValue / effectiveNetWorth) * 100;

        return {
          id: fd.id,
          name: fd.name || `${fd.bankName} Fixed Deposit`,
          bankName: fd.bankName || 'Bank',
          principal,
          currentValue,
          maturityAmount,
          interestRate,
          maturityDate: fd.maturityDate,
          categoryPct,
          netWorthPct,
        };
      });

      if (q) {
        list = list.filter((f) => f.name.toLowerCase().includes(q) || f.bankName.toLowerCase().includes(q));
      }

      list.sort((a, b) => {
        if (sortBy === 'value_desc') return b.currentValue - a.currentValue;
        if (sortBy === 'value_asc') return a.currentValue - b.currentValue;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });

      return list;
    }

    if (activeCategory === 'cash') {
      let list = activeCash.map((vault) => {
        const bal = Number(vault?.balance || 0);
        const categoryPct = totalCashVal > 0 ? (bal / totalCashVal) * 100 : 0;
        const netWorthPct = (bal / effectiveNetWorth) * 100;
        const totalNotes = (vault?.denominations || []).reduce((s, d) => s + (Number(d?.count || 0)), 0);

        return {
          id: vault.id,
          name: vault.name || vault.displayName || 'Cash Vault',
          location: vault.location || 'Home / Office Vault',
          balance: bal,
          lastUpdated: vault.lastUpdated || vault.updatedAt,
          totalNotes,
          categoryPct,
          netWorthPct,
        };
      });

      if (q) {
        list = list.filter((c) => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
      }

      list.sort((a, b) => {
        if (sortBy === 'value_desc') return b.balance - a.balance;
        if (sortBy === 'value_asc') return a.balance - b.balance;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });

      return list;
    }

    if (activeCategory === 'wallets') {
      let list = activeWallets.map((wallet) => {
        const bal = Number(wallet?.balance || 0);
        const categoryPct = totalWalletVal > 0 ? (bal / totalWalletVal) * 100 : 0;
        const netWorthPct = (bal / effectiveNetWorth) * 100;

        return {
          id: wallet.id,
          name: wallet.name || wallet.displayName || wallet.providerName || 'Digital Wallet',
          provider: wallet.provider || 'Wallet',
          providerName: wallet.providerName || wallet.provider || 'Wallet',
          walletType: wallet.walletType || 'DIGITAL_WALLET',
          balance: bal,
          includeInNetWorth: wallet.includeInNetWorth !== false,
          categoryPct,
          netWorthPct,
        };
      });

      if (q) {
        list = list.filter((w) => w.name.toLowerCase().includes(q) || w.provider.toLowerCase().includes(q));
      }

      list.sort((a, b) => {
        if (sortBy === 'value_desc') return b.balance - a.balance;
        if (sortBy === 'value_asc') return a.balance - b.balance;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });

      return list;
    }

    if (activeCategory === 'liabilities') {
      const cardList = activeCards.map((card) => {
        const outstanding = Number(card?.outstanding !== undefined ? card.outstanding : card?.outstandingBalance || 0);
        const limit = Number(card?.creditLimit || 0);
        const available = Math.max(0, limit - outstanding);
        const utilization = limit > 0 && outstanding > 0 ? Math.round((outstanding / limit) * 1000) / 10 : 0;
        const categoryPct = totalLiabVal > 0 ? (outstanding / totalLiabVal) * 100 : 0;
        const netWorthPct = (outstanding / effectiveNetWorth) * 100;

        return {
          id: card.id,
          type: 'credit_card' as const,
          name: card.cardName || card.name || 'Credit Card',
          issuer: card.issuer || card.bankName || 'Bank',
          lastFour: card.lastFourDigits ? `•••• ${card.lastFourDigits}` : '',
          outstanding,
          creditLimit: limit,
          availableCredit: available,
          utilization,
          dueDate: card.dueDate || card.paymentDueDate,
          statementDate: card.statementDate,
          categoryPct,
          netWorthPct,
        };
      });

      const payableList = activePayables.map((payable) => {
        const amt = Number(payable?.amount || 0);
        const categoryPct = totalLiabVal > 0 ? (amt / totalLiabVal) * 100 : 0;
        const netWorthPct = (amt / effectiveNetWorth) * 100;

        return {
          id: payable.id,
          type: 'payable' as const,
          name: payable.personName || payable.name || 'Peer Payable',
          partyName: payable.personName || 'Contact',
          amount: amt,
          outstanding: amt,
          dueDate: payable.dueDate,
          notes: payable.notes || payable.description,
          categoryPct,
          netWorthPct,
        };
      });

      let list = [...cardList, ...payableList];

      if (liabilityFilter === 'credit_cards') {
        list = list.filter((l) => l.type === 'credit_card');
      } else if (liabilityFilter === 'payables') {
        list = list.filter((l) => l.type === 'payable');
      }

      if (q) {
        list = list.filter((l) => l.name.toLowerCase().includes(q));
      }

      list.sort((a, b) => {
        if (sortBy === 'value_desc') return b.outstanding - a.outstanding;
        if (sortBy === 'value_asc') return a.outstanding - b.outstanding;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });

      return list;
    }

    if (activeCategory === 'receivables') {
      let list = activeReceivables.map((rec) => {
        const amt = Number(rec?.amount || 0);
        const categoryPct = totalReceivablesVal > 0 ? (amt / totalReceivablesVal) * 100 : 0;
        const netWorthPct = (amt / effectiveNetWorth) * 100;

        return {
          id: rec.id,
          name: rec.personName || rec.name || 'Peer Receivable',
          partyName: rec.personName || 'Contact',
          amount: amt,
          dueDate: rec.dueDate,
          notes: rec.notes || rec.description,
          categoryPct,
          netWorthPct,
        };
      });

      if (q) {
        list = list.filter((r) => r.name.toLowerCase().includes(q));
      }

      list.sort((a, b) => {
        if (sortBy === 'value_desc') return b.amount - a.amount;
        if (sortBy === 'value_asc') return a.amount - b.amount;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });

      return list;
    }

    return [];
  }, [
    activeCategory,
    activeInvs,
    activeBanks,
    activeFds,
    activeCash,
    activeWallets,
    activeCards,
    activeReceivables,
    activePayables,
    searchQuery,
    investmentFilter,
    liabilityFilter,
    sortBy,
    totalInvVal,
    totalBankVal,
    totalFdVal,
    totalCashVal,
    totalWalletVal,
    totalLiabVal,
    totalReceivablesVal,
    effectiveNetWorth,
  ]);

  const activeMeta = categoryMeta[activeCategory];
  const ActiveIcon = activeMeta.icon;

  return (
    <div id="afinity-interactive-drilldown-explorer" className={cn('space-y-4', className)}>
      {/* Header Banner & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white font-heading">
              Interactive Asset & Liability Drill-Down
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Click any category below to reveal individual accounts, stocks, funds, vaults, and liabilities with exact Net Worth impact
          </p>
        </div>

        {/* Selected Category Metric Callout */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs self-start sm:self-auto font-mono">
          <span className="text-slate-400">Selected Segment:</span>
          <span className="font-bold text-white">{activeMeta.label}</span>
          <span className={cn('font-black', activeMeta.color)}>
            {formatRupee(activeMeta.total)}
          </span>
        </div>
      </div>

      {/* Category Selector Tabs */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {(Object.keys(categoryMeta) as DrillDownCategoryKey[]).map((catKey) => {
          const meta = categoryMeta[catKey];
          const Icon = meta.icon;
          const isSelected = activeCategory === catKey;

          return (
            <button
              key={catKey}
              id={`drilldown-tab-${catKey}`}
              type="button"
              onClick={() => handleCategoryChange(catKey)}
              className={cn(
                'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 group min-h-[72px]',
                isSelected
                  ? 'bg-slate-850 border-cyan-500/60 shadow-lg ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800/80 hover:border-slate-700'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={cn(
                    'p-1.5 rounded-xl border transition-colors',
                    isSelected
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                      : 'bg-slate-950 text-slate-400 border-slate-800 group-hover:text-slate-200'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-400 border border-slate-800/60">
                  {meta.count}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-white font-heading block truncate">
                  {meta.label}
                </span>
                <span className="text-[11px] font-mono text-slate-400 block truncate">
                  {formatRupee(meta.total)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls Bar: Sub-filters (for Invs / Liabilities), Search Input, Sort Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
        {/* Left: Sub-category pills for Investments or Liabilities */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0">
          {activeCategory === 'investments' && (
            <>
              {(
                [
                  { id: 'all', label: 'All Holdings' },
                  { id: 'stock', label: 'Stocks & Equities' },
                  { id: 'etf', label: 'ETFs' },
                  { id: 'mutual_fund', label: 'Mutual Funds' },
                  { id: 'gold_sgb', label: 'Gold & SGB' },
                  { id: 'other', label: 'Other' },
                ] as const
              ).map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setInvestmentFilter(sub.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[32px]',
                    investmentFilter === sub.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  )}
                >
                  {sub.label}
                </button>
              ))}
            </>
          )}

          {activeCategory === 'liabilities' && (
            <>
              {(
                [
                  { id: 'all', label: 'All Liabilities' },
                  { id: 'credit_cards', label: 'Credit Cards' },
                  { id: 'payables', label: 'Peer Payables' },
                ] as const
              ).map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setLiabilityFilter(sub.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[32px]',
                    liabilityFilter === sub.id
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  )}
                >
                  {sub.label}
                </button>
              ))}
            </>
          )}

          {activeCategory !== 'investments' && activeCategory !== 'liabilities' && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ActiveIcon className={cn('w-4 h-4', activeMeta.color)} />
              <span>Showing all active {activeMeta.label.toLowerCase()} ({drillDownItems.length})</span>
            </div>
          )}
        </div>

        {/* Right: Search & Sort controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeMeta.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="min-w-[140px]">
            <SelectField
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              options={[
                { value: 'value_desc', label: 'Highest Value', badge: 'High-Low', badgeColor: 'cyan' },
                { value: 'value_asc', label: 'Lowest Value', badge: 'Low-High', badgeColor: 'slate' },
                ...(activeCategory === 'investments'
                  ? [{ value: 'pnl_desc', label: 'Highest Returns', badge: 'P&L', badgeColor: 'emerald' as const }]
                  : []),
                { value: 'name_asc', label: 'Name (A-Z)', badge: 'A-Z', badgeColor: 'blue' },
              ]}
              triggerClassName="py-1.5 px-2.5 rounded-xl bg-slate-950 border-slate-800 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Drill-Down Items Table / Card Container */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        {drillDownItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ActiveIcon className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-medium">No {activeMeta.label.toLowerCase()} records match your filter</p>
            <p className="text-xs text-slate-500">Try adjusting your search query or sub-category filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Instrument / Account</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Institution / Platform</th>
                  <th className="py-3 px-4 text-right">Holdings / Balance</th>
                  {activeCategory === 'investments' && (
                    <th className="py-3 px-4 text-right hidden md:table-cell">Returns (P&amp;L)</th>
                  )}
                  {activeCategory === 'liabilities' && (
                    <th className="py-3 px-4 text-right hidden md:table-cell">Utilization &amp; Due</th>
                  )}
                  <th className="py-3 px-4 text-right">% of Segment</th>
                  <th className="py-3 px-4 text-right">Impact on Net Worth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {drillDownItems.map((item: any, idx: number) => {
                  const isInv = activeCategory === 'investments';
                  const isBank = activeCategory === 'banks';
                  const isFd = activeCategory === 'fixed_deposits';
                  const isCash = activeCategory === 'cash';
                  const isWallet = activeCategory === 'wallets';
                  const isLiab = activeCategory === 'liabilities';
                  const isRec = activeCategory === 'receivables';

                  const val = isInv
                    ? item.currentValue
                    : isFd
                    ? item.currentValue
                    : isLiab
                    ? item.outstanding
                    : isRec
                    ? item.amount
                    : item.balance;

                  return (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Name & Badge */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex-shrink-0">
                            <ActiveIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs sm:text-sm truncate block max-w-[180px] sm:max-w-[240px]">
                                {item.name}
                              </span>
                              {item.symbol && (
                                <span className="text-[10px] px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                  {item.symbol}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {isInv && `${item.quantity} ${item.unit} @ avg ₹${item.avgBuyPrice?.toLocaleString('en-IN')}`}
                              {isBank && `${item.accountType} ${item.accountNumberMasked}`}
                              {isFd && `${item.interestRate}% p.a. • Matures ${item.maturityDate || 'N/A'}`}
                              {isCash && `${item.location} • ${item.totalNotes} notes audited`}
                              {isWallet && `${item.providerName || item.provider} (${item.walletType})`}
                              {isLiab && (item.type === 'credit_card' ? `Card ${item.lastFour}` : `Contact: ${item.partyName}`)}
                              {isRec && `Contact: ${item.partyName}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Institution / Platform */}
                      <td className="py-3.5 px-4 hidden sm:table-cell font-sans text-slate-300">
                        {isInv && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                            {item.broker}
                          </span>
                        )}
                        {isBank && <span className="text-slate-300">{item.bankName}</span>}
                        {isFd && <span className="text-slate-300">{item.bankName}</span>}
                        {isCash && <span className="text-amber-300/90">{item.location}</span>}
                        {isWallet && <span className="text-purple-300/90">{item.providerName}</span>}
                        {isLiab && <span className="text-slate-300">{item.issuer || item.partyName}</span>}
                        {isRec && <span className="text-pink-300/90">{item.partyName}</span>}
                      </td>

                      {/* Value / Balance */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={cn(
                            'font-black text-xs sm:text-sm block',
                            isLiab ? 'text-rose-400' : 'text-white'
                          )}
                        >
                          {formatRupee(val)}
                        </span>
                        {isInv && (
                          <span className="text-[10px] text-slate-400 block font-sans">
                            Inv: {formatRupee(item.investedAmount)}
                          </span>
                        )}
                        {isFd && (
                          <span className="text-[10px] text-cyan-400 block font-sans">
                            Principal: {formatRupee(item.principal)}
                          </span>
                        )}
                      </td>

                      {/* Returns Column (Invs only) */}
                      {isInv && (
                        <td className="py-3.5 px-4 text-right hidden md:table-cell">
                          <span
                            className={cn(
                              'font-bold text-xs block',
                              item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            )}
                          >
                            {item.pnl >= 0 ? '+' : ''}{formatRupee(item.pnl)}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-semibold block',
                              item.pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            )}
                          >
                            {item.pnlPct >= 0 ? '+' : ''}{item.pnlPct.toFixed(1)}%
                          </span>
                        </td>
                      )}

                      {/* Utilization & Due Column (Liabilities only) */}
                      {isLiab && (
                        <td className="py-3.5 px-4 text-right hidden md:table-cell">
                          {item.type === 'credit_card' ? (
                            <>
                              <span
                                className={cn(
                                  'font-bold text-xs block',
                                  item.utilization <= 30
                                    ? 'text-emerald-400'
                                    : item.utilization <= 50
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                                )}
                              >
                                {item.utilization}% util
                              </span>
                              <span className="text-[10px] text-slate-400 block font-sans">
                                Due: {item.dueDate || 'N/A'}
                              </span>
                            </>
                          ) : (
                            <span className="text-[11px] text-orange-400 block font-sans">
                              Due: {item.dueDate || 'Upon Request'}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Segment Percentage */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-slate-200 block text-xs">
                          {item.categoryPct?.toFixed(1)}%
                        </span>
                        <div className="w-12 h-1.5 rounded-full bg-slate-800 ml-auto mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-cyan-400"
                            style={{ width: `${Math.min(100, item.categoryPct)}%` }}
                          />
                        </div>
                      </td>

                      {/* Impact on Net Worth */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={cn(
                            'font-black text-xs block',
                            isLiab ? 'text-rose-400' : 'text-emerald-400'
                          )}
                        >
                          {isLiab ? '-' : ''}{Math.abs(item.netWorthPct)?.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          of ₹{netWorth.toLocaleString('en-IN')} NW
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

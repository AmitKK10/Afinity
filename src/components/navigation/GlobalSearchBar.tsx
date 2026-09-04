/**
 * Afinity Global Command & Search Engine
 * Real-time fast omni-search for Banks, Fixed Deposits, Investments,
 * Credit Cards, Digital Wallets, Physical Cash & Khatabook ledgers.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  ArrowLeft,
  Building2,
  TrendingUp,
  CreditCard as CreditCardIcon,
  Wallet,
  Coins,
  Users,
  Rocket,
  ArrowRight,
  Sparkles,
  Command,
  CornerDownLeft,
  ChevronRight,
  Layers,
  Clock,
} from 'lucide-react';
import { useFinancialData } from '../../context/FinancialDataContext';
import { formatRupee } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export type SearchCategoryFilter = 'all' | 'banks' | 'investments' | 'credit' | 'wallets_cash' | 'khatabook';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'bank' | 'fd' | 'investment' | 'sip' | 'credit_card' | 'wallet' | 'cash' | 'khatabook' | 'ipo';
  categoryLabel: string;
  amount?: number;
  amountLabel?: string;
  amountType?: 'asset' | 'liability' | 'neutral';
  route: string;
  state?: Record<string, unknown>;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badge?: string;
  metadata?: string;
}

interface GlobalSearchBarProps {
  className?: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    bankAccounts,
    fixedDeposits,
    investments,
    sips,
    creditCards,
    wallets,
    cashHoldings,
    khatabookEntries,
    ipoApplications,
  } = useFinancialData();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Close search whenever route/location changes (e.g. from bottom nav or sidebar)
  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [location.pathname, location.search, location.hash]);

  // Clean close search helper
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
    if (window.history.state?.isGlobalSearchOverlay) {
      window.history.back();
    }
  }, []);

  // Android hardware/gesture back button & external close events
  useEffect(() => {
    if (!isOpen) return;

    // Push lightweight state entry for Android back button interception
    window.history.pushState({ isGlobalSearchOverlay: true }, '');

    const handlePopState = () => {
      // Android / browser hardware back button pressed -> close search overlay first
      setIsOpen(false);
      setQuery('');
      setSelectedIndex(0);
    };

    const handleCloseSearchEvent = () => {
      setIsOpen(false);
      setQuery('');
      setSelectedIndex(0);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('afinity-close-search', handleCloseSearchEvent);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('afinity-close-search', handleCloseSearchEvent);
    };
  }, [isOpen]);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K / '/' to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setActiveCategory('all');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Index all entities for fast searching
  const allSearchableItems: SearchResultItem[] = useMemo(() => {
    const items: SearchResultItem[] = [];

    // 1. Bank Accounts
    (bankAccounts || []).forEach((acc) => {
      const typeDisplay = acc.accountType
        ? `${acc.accountType.charAt(0).toUpperCase() + acc.accountType.slice(1)} A/C`
        : 'Bank Account';
      const last4Display = acc.last4 ? `•••• ${acc.last4}` : '';
      const bankName = acc.bankName || acc.institutionName || 'Bank';

      items.push({
        id: `bank-${acc.id}`,
        title: acc.name || `${bankName} ${typeDisplay}`,
        subtitle: [bankName, last4Display, typeDisplay].filter(Boolean).join(' • '),
        category: 'bank',
        categoryLabel: 'Bank Account',
        amount: acc.balance,
        amountLabel: 'Balance',
        amountType: 'asset',
        route: '/banks',
        state: { targetAccountId: acc.id },
        icon: Building2,
        accentColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        badge: acc.accountType?.toUpperCase(),
        metadata: `${acc.name} ${bankName} ${acc.last4 || ''} ${acc.ifscCode || ''} ${acc.accountType}`,
      });
    });

    // 2. Fixed Deposits
    (fixedDeposits || []).forEach((fd) => {
      items.push({
        id: `fd-${fd.id}`,
        title: fd.name || `${fd.bankName} Fixed Deposit`,
        subtitle: `${fd.bankName} • ${fd.interestRate ? `${fd.interestRate}% p.a.` : 'FD'} • Mat: ${
          fd.maturityDate || 'N/A'
        }`,
        category: 'fd',
        categoryLabel: 'Fixed Deposit',
        amount: fd.principal || fd.balance,
        amountLabel: 'Principal',
        amountType: 'asset',
        route: '/banks',
        state: { targetFdId: fd.id, initialTab: 'banks' },
        icon: Building2,
        accentColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        badge: fd.interestRate ? `${fd.interestRate}% FD` : 'FD',
        metadata: `${fd.name} ${fd.bankName} ${fd.interestRate} fixed deposit maturity`,
      });
    });

    // 3. Investments (Stocks, Mutual Funds, Gold, etc.)
    (investments || []).forEach((inv) => {
      const assetTypeDisplay = inv.assetType || inv.type || 'Asset';
      const brokerDisplay = inv.broker || inv.platform || '';
      const symbolDisplay = inv.symbol ? `[${inv.symbol}]` : '';

      items.push({
        id: `inv-${inv.id}`,
        title: inv.name || inv.symbol || 'Investment Holding',
        subtitle: [symbolDisplay, assetTypeDisplay, brokerDisplay].filter(Boolean).join(' • '),
        category: 'investment',
        categoryLabel: 'Investment',
        amount: inv.currentValue || (inv.currentPrice && inv.quantity ? inv.currentPrice * inv.quantity : inv.investedAmount),
        amountLabel: 'Valuation',
        amountType: 'asset',
        route: '/investments',
        state: { targetHoldingId: inv.id },
        icon: TrendingUp,
        accentColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        badge: inv.symbol || assetTypeDisplay.toUpperCase(),
        metadata: `${inv.name} ${inv.symbol || ''} ${inv.isin || ''} ${inv.broker || ''} ${inv.assetType || ''}`,
      });
    });

    // 4. SIP Mandates
    (sips || []).forEach((sip) => {
      const freqDisplay = sip.frequency ? `${sip.frequency.charAt(0).toUpperCase() + sip.frequency.slice(1)} SIP` : 'Monthly SIP';
      const statusDisplay = sip.sipStatus === 'active' ? 'Active' : 'Stopped';
      const dayDisplay = sip.deductionDay ? `Day ${sip.deductionDay}` : '';

      items.push({
        id: `sip-${sip.id}`,
        title: sip.fundName || 'Mutual Fund SIP',
        subtitle: [freqDisplay, dayDisplay, sip.platform, statusDisplay].filter(Boolean).join(' • '),
        category: 'sip',
        categoryLabel: 'SIP Mandate',
        amount: sip.amount,
        amountLabel: 'Deduction',
        amountType: 'neutral',
        route: '/investments',
        state: { tab: 'sips', targetSipId: sip.id },
        icon: Clock,
        accentColor: sip.sipStatus === 'active' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-slate-400 bg-slate-500/10 border-slate-500/30',
        badge: sip.sipStatus === 'active' ? 'ACTIVE SIP' : 'STOPPED SIP',
        metadata: `${sip.fundName} ${sip.symbol || ''} ${sip.schemeCode || ''} ${sip.platform || ''} ${sip.category || ''} sip systematic investment`,
      });
    });

    // 5. Credit Cards
    (creditCards || []).forEach((card) => {
      const issuer = card.issuer || card.bankName || 'Card';
      const last4 = card.lastFourDigits ? `•••• ${card.lastFourDigits}` : '';
      const limitDisplay = card.creditLimit ? `Limit: ${formatRupee(card.creditLimit, { compact: true })}` : '';

      items.push({
        id: `card-${card.id}`,
        title: card.cardName || `${issuer} Credit Card`,
        subtitle: [issuer, last4, limitDisplay].filter(Boolean).join(' • '),
        category: 'credit_card',
        categoryLabel: 'Credit Card',
        amount: card.outstanding || card.outstandingBalance || 0,
        amountLabel: 'Outstanding',
        amountType: 'liability',
        route: '/credit',
        state: { targetCardId: card.id },
        icon: CreditCardIcon,
        accentColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        badge: card.cardNetwork?.toUpperCase() || 'CARD',
        metadata: `${card.cardName} ${issuer} ${card.lastFourDigits} ${card.cardNetwork || ''} ${card.cardVariant || ''}`,
      });
    });

    // 6. Digital Wallets
    (wallets || []).forEach((wallet) => {
      items.push({
        id: `wallet-${wallet.id}`,
        title: wallet.name || `${wallet.providerName || wallet.provider} Wallet`,
        subtitle: `${wallet.providerName || wallet.provider} • ${wallet.owner || 'Self'}`,
        category: 'wallet',
        categoryLabel: 'Digital Wallet',
        amount: wallet.balance,
        amountLabel: 'Balance',
        amountType: 'asset',
        route: '/wallets',
        state: { targetWalletId: wallet.id },
        icon: Wallet,
        accentColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        badge: 'WALLET',
        metadata: `${wallet.name} ${wallet.provider} ${wallet.providerName || ''} ${wallet.owner || ''}`,
      });
    });

    // 7. Physical Cash Accounts
    (cashHoldings || []).forEach((cash) => {
      items.push({
        id: `cash-${cash.id}`,
        title: cash.name || 'Physical Cash Vault',
        subtitle: cash.location ? `Locker / Location: ${cash.location}` : 'Physical Denominations & Notes',
        category: 'cash',
        categoryLabel: 'Physical Cash',
        amount: cash.balance,
        amountLabel: 'Cash Balance',
        amountType: 'asset',
        route: '/cash',
        state: { targetCashId: cash.id },
        icon: Coins,
        accentColor: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
        badge: 'CASH',
        metadata: `${cash.name} ${cash.location || ''} physical cash denominations locker`,
      });
    });

    // 8. Khatabook / Dues & Receivables
    (khatabookEntries || []).forEach((entry) => {
      const isReceivable = (entry.type || '').toUpperCase() === 'RECEIVABLE';
      items.push({
        id: `khatabook-${entry.id}`,
        title: entry.personName || entry.partyName || 'Contact',
        subtitle: `${isReceivable ? 'Receivable (They owe you)' : 'Payable (You owe them)'} ${
          entry.description ? `• ${entry.description}` : ''
        }`,
        category: 'khatabook',
        categoryLabel: 'Dues & Receivables',
        amount: entry.remainingAmount ?? entry.amount,
        amountLabel: isReceivable ? 'To Collect' : 'To Pay',
        amountType: isReceivable ? 'asset' : 'liability',
        route: '/dues-receivables',
        state: { targetPerson: entry.personName },
        icon: Users,
        accentColor: isReceivable
          ? 'text-teal-400 bg-teal-500/10 border-teal-500/30'
          : 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        badge: isReceivable ? 'RECEIVABLE' : 'PAYABLE',
        metadata: `${entry.personName} ${entry.partyName || ''} ${entry.description || ''} ${entry.phone || ''}`,
      });
    });

    // 9. IPO Applications
    (ipoApplications || []).forEach((ipo) => {
      items.push({
        id: `ipo-${ipo.id}`,
        title: ipo.companyName || ipo.symbol || 'IPO Application',
        subtitle: `Symbol: ${ipo.symbol || 'N/A'} • Status: ${ipo.status} • App #${
          ipo.applicationNumber || 'N/A'
        }`,
        category: 'ipo',
        categoryLabel: 'IPO Application',
        amount: ipo.amountBlocked || ipo.bidAmount,
        amountLabel: 'Amount Blocked',
        amountType: 'neutral',
        route: '/ipo',
        state: { targetIpoId: ipo.id },
        icon: Rocket,
        accentColor: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
        badge: ipo.status?.toUpperCase() || 'IPO',
        metadata: `${ipo.companyName} ${ipo.symbol || ''} ${ipo.applicationNumber || ''} ${ipo.status}`,
      });
    });

    return items;
  }, [
    bankAccounts,
    fixedDeposits,
    investments,
    sips,
    creditCards,
    wallets,
    cashHoldings,
    khatabookEntries,
    ipoApplications,
  ]);

  // Filter items by category & query string
  const filteredResults = useMemo(() => {
    let list = allSearchableItems;

    // Apply category filter
    if (activeCategory === 'banks') {
      list = list.filter((item) => item.category === 'bank' || item.category === 'fd');
    } else if (activeCategory === 'investments') {
      list = list.filter((item) => item.category === 'investment' || item.category === 'sip' || item.category === 'ipo');
    } else if (activeCategory === 'credit') {
      list = list.filter((item) => item.category === 'credit_card');
    } else if (activeCategory === 'wallets_cash') {
      list = list.filter((item) => item.category === 'wallet' || item.category === 'cash');
    } else if (activeCategory === 'khatabook') {
      list = list.filter((item) => item.category === 'khatabook');
    }

    // Apply search query
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      return list;
    }

    return list.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(trimmedQuery);
      const matchSubtitle = item.subtitle.toLowerCase().includes(trimmedQuery);
      const matchMeta = item.metadata ? item.metadata.toLowerCase().includes(trimmedQuery) : false;
      const matchBadge = item.badge ? item.badge.toLowerCase().includes(trimmedQuery) : false;
      return matchTitle || matchSubtitle || matchMeta || matchBadge;
    });
  }, [allSearchableItems, activeCategory, query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  // Handle navigate to item
  const handleSelectItem = useCallback(
    (item: SearchResultItem) => {
      setIsOpen(false);
      setQuery('');
      setSelectedIndex(0);
      if (window.history.state?.isGlobalSearchOverlay) {
        navigate(item.route, { state: item.state, replace: true });
      } else {
        navigate(item.route, { state: item.state });
      }
    },
    [navigate]
  );

  // Keyboard navigation within the modal (Up/Down/Enter/Escape)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
    }
  };

  // Scroll active item into view smoothly
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector(
        `[data-search-index="${selectedIndex}"]`
      ) as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Category filter buttons metadata with counts
  const categoryCounts = useMemo(() => {
    return {
      all: allSearchableItems.length,
      banks: allSearchableItems.filter((i) => i.category === 'bank' || i.category === 'fd').length,
      investments: allSearchableItems.filter((i) => i.category === 'investment' || i.category === 'sip' || i.category === 'ipo').length,
      credit: allSearchableItems.filter((i) => i.category === 'credit_card').length,
      wallets_cash: allSearchableItems.filter((i) => i.category === 'wallet' || i.category === 'cash').length,
      khatabook: allSearchableItems.filter((i) => i.category === 'khatabook').length,
    };
  }, [allSearchableItems]);

  return (
    <>
      {/* 1. Header Trigger Input / Button (Desktop & Mobile) */}
      <div className={cn('relative flex items-center', className)}>
        {/* Desktop & Tablet Search Bar */}
        <button
          type="button"
          id="global-search-header-trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Search accounts, investments, and cards"
          className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all text-xs w-48 md:w-64 lg:w-72 shadow-inner group cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
          <span className="flex-1 text-left truncate text-[11px] md:text-xs">
            Search accounts, cards, stocks...
          </span>
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-[10px] font-mono text-slate-400 group-hover:text-slate-300">
            <span className="text-[9px]">⌘</span>
            <span>K</span>
          </div>
        </button>

        {/* Mobile Compact Search Icon Button */}
        <button
          type="button"
          id="global-search-mobile-trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Open Global Search"
          className="sm:hidden p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Global Search Command Palette Modal */}
      {isOpen && (
        <div
          id="global-search-overlay"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center p-3 sm:p-4 md:pt-16 animate-in fade-in duration-150 pt-safe"
          onClick={closeSearch}
        >
          <div
            className="w-full max-w-2xl bg-[#0b1120] border border-slate-700/80 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] animate-in zoom-in-95 duration-150 ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar with Mobile Back + Clear Query + Prominent Close (✕) Button */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-3.5 border-b border-slate-800 bg-[#0f172a]/95 relative">
              {/* Mobile Back Button */}
              <button
                type="button"
                id="btn-back-global-search-mobile"
                onClick={closeSearch}
                aria-label="Back to previous page"
                className="sm:hidden p-1.5 -ml-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5 text-cyan-400" />
              </button>

              <Search className="hidden sm:block w-5 h-5 text-cyan-400 flex-shrink-0" />

              <input
                ref={inputRef}
                type="text"
                id="global-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search by name, bank, last 4 digits, stock symbol, broker..."
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base outline-none font-medium min-w-0"
                autoComplete="off"
                spellCheck="false"
              />

              {/* Clear search text button (only visible when query is non-empty) */}
              {query && (
                <button
                  type="button"
                  id="btn-clear-search-text"
                  onClick={() => {
                    setQuery('');
                    setSelectedIndex(0);
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search text"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
                  title="Clear text"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Clear and Prominent Close (✕) Button */}
              <button
                type="button"
                id="btn-close-global-search"
                onClick={closeSearch}
                aria-label="Close search overlay"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer select-none active:scale-95 shadow-sm min-h-[34px]"
                title="Close search (Esc)"
              >
                <X className="w-4 h-4 text-slate-300" />
                <span className="font-heading">Close</span>
                <span className="hidden sm:inline-block text-[10px] font-mono px-1 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-400">
                  ESC
                </span>
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto no-scrollbar">
              {(
                [
                  { key: 'all', label: 'All', count: categoryCounts.all },
                  { key: 'banks', label: 'Banks & FDs', count: categoryCounts.banks },
                  { key: 'investments', label: 'Investments', count: categoryCounts.investments },
                  { key: 'credit', label: 'Credit Cards', count: categoryCounts.credit },
                  { key: 'wallets_cash', label: 'Wallets & Cash', count: categoryCounts.wallets_cash },
                  { key: 'khatabook', label: 'Dues Ledger', count: categoryCounts.khatabook },
                ] as const
              ).map((tab) => {
                const isActive = activeCategory === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveCategory(tab.key)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer',
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                        isActive
                          ? 'bg-cyan-400/20 text-cyan-200 font-bold'
                          : 'bg-slate-800 text-slate-500'
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Results List */}
            <div
              ref={resultsContainerRef}
              className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 divide-y divide-slate-800/40 max-h-[50vh] sm:max-h-[55vh]"
            >
              {filteredResults.length > 0 ? (
                filteredResults.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      data-search-index={idx}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        'group flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer select-none',
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-500/40 shadow-md'
                          : 'hover:bg-slate-900/70 border border-transparent'
                      )}
                    >
                      {/* Left: Icon & Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={cn(
                            'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border flex-shrink-0 transition-transform',
                            item.accentColor,
                            isSelected && 'scale-105 shadow-sm'
                          )}
                        >
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-100 font-heading truncate">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-slate-800/80 text-slate-300 border-slate-700 font-mono uppercase">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Right: Amount & Navigate Arrow */}
                      <div className="flex items-center gap-2.5 flex-shrink-0 text-right">
                        {item.amount !== undefined && (
                          <div className="flex flex-col items-end">
                            <span
                              className={cn(
                                'text-xs sm:text-sm font-extrabold font-mono',
                                item.amountType === 'liability'
                                  ? 'text-rose-400'
                                  : item.amountType === 'asset'
                                  ? 'text-emerald-400'
                                  : 'text-slate-200'
                              )}
                            >
                              {formatRupee(item.amount)}
                            </span>
                            {item.amountLabel && (
                              <span className="text-[10px] text-slate-500 font-medium">
                                {item.amountLabel}
                              </span>
                            )}
                          </div>
                        )}

                        <div
                          className={cn(
                            'w-6 h-6 rounded-lg flex items-center justify-center transition-colors',
                            isSelected
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'text-slate-600 group-hover:text-slate-300'
                          )}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Empty State when no matches */
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-300 font-heading">
                    No results found for &ldquo;{query}&rdquo;
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try searching with a bank name, account number last 4 digits, stock symbol, or
                    switch category filter to &ldquo;All&rdquo;.
                  </p>
                  {activeCategory !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setActiveCategory('all')}
                      className="mt-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                    >
                      Reset category filter
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer / Keyboard Shortcuts & Quick Navigation */}
            <div className="px-4 py-2.5 border-t border-slate-800/80 bg-[#080d1a] flex items-center justify-between text-[11px] text-slate-400">
              <div className="hidden sm:flex items-center gap-3 select-none">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-850 border border-slate-700 text-[10px] font-mono text-slate-300">
                    ↑
                  </kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-850 border border-slate-700 text-[10px] font-mono text-slate-300">
                    ↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-850 border border-slate-700 text-[10px] font-mono text-slate-300">
                    ↵
                  </kbd>
                  <span>Select</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-850 border border-slate-700 text-[10px] font-mono text-slate-300">
                    esc
                  </kbd>
                  <span>Close</span>
                </span>
              </div>

              <div className="text-right text-[11px] text-slate-500 w-full sm:w-auto font-mono">
                {filteredResults.length} {filteredResults.length === 1 ? 'record' : 'records'} indexed
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

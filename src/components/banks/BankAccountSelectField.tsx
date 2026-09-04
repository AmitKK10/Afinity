import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Landmark,
  Search,
  X,
  Check,
  ChevronDown,
  Building2,
  Wallet,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { BankAccount } from '../../types';
import { BankBrandBadge } from '../brand/BankBrandBadge';
import { formatRupee } from '../../utils/formatters';
import { getBankBrandTheme } from '../../utils/bankThemes';
import { cn } from '../../utils/cn';

export interface BankAccountSelectFieldProps {
  id?: string;
  label?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  value?: string;
  bankAccounts: BankAccount[];
  onChange: (bankAccountId: string, selectedAccount?: BankAccount) => void;
  minRequiredBalance?: number;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  helperText?: string;
}

const getAccountTypeBadge = (type?: string) => {
  const norm = (type || 'savings').toLowerCase();
  switch (norm) {
    case 'salary':
      return {
        label: 'Salary',
        classes: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      };
    case 'current':
      return {
        label: 'Current',
        classes: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      };
    case 'overdraft':
      return {
        label: 'Overdraft',
        classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      };
    case 'savings':
    default:
      return {
        label: 'Savings',
        classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      };
  }
};

export const BankAccountSelectField: React.FC<BankAccountSelectFieldProps> = ({
  id,
  label = 'Deduction Bank Account',
  required = false,
  error,
  placeholder = 'Select Bank Account',
  value,
  bankAccounts,
  onChange,
  minRequiredBalance,
  disabled = false,
  className,
  triggerClassName,
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Active bank accounts
  const activeAccounts = useMemo(() => {
    return bankAccounts.filter((b) => b.status !== 'archived' && b.status !== 'closed');
  }, [bankAccounts]);

  // Selected account entity
  const selectedAccount = useMemo(() => {
    return activeAccounts.find((b) => b.id === value) || bankAccounts.find((b) => b.id === value);
  }, [activeAccounts, bankAccounts, value]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedTypeFilter('all');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    let list = activeAccounts;

    if (selectedTypeFilter !== 'all') {
      list = list.filter((b) => (b.accountType || 'savings').toLowerCase() === selectedTypeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) => {
        const name = (b.displayName || b.name || '').toLowerCase();
        const bank = (b.institutionName || b.bankName || '').toLowerCase();
        const masked = (b.accountNumberMasked || b.last4 || '').toLowerCase();
        const type = (b.accountType || '').toLowerCase();
        return (
          name.includes(q) ||
          bank.includes(q) ||
          masked.includes(q) ||
          type.includes(q)
        );
      });
    }

    return list;
  }, [activeAccounts, selectedTypeFilter, searchQuery]);

  // Distinct account types available
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    activeAccounts.forEach((b) => {
      if (b.accountType) types.add(b.accountType.toLowerCase());
    });
    return Array.from(types);
  }, [activeAccounts]);

  const handleSelectAccount = (account: BankAccount) => {
    onChange(account.id, account);
    setIsOpen(false);
  };

  const selectedBadge = selectedAccount ? getAccountTypeBadge(selectedAccount.accountType) : null;
  const isSelectedSufficient =
    selectedAccount && minRequiredBalance && minRequiredBalance > 0
      ? Number(selectedAccount.balance || 0) >= minRequiredBalance
      : true;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-heading"
          >
            {label} {required && <span className="text-rose-400">*</span>}
          </label>
          {selectedAccount && (
            <span className="text-[11px] font-mono text-slate-400">
              Bal: <strong className="text-emerald-400">{formatRupee(selectedAccount.balance || 0)}</strong>
            </span>
          )}
        </div>
      )}

      {/* Afinity Custom Trigger Box */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={cn(
          'w-full text-left p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 group cursor-pointer focus:outline-none',
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-900/50 border-slate-800'
            : error
            ? 'bg-rose-950/20 border-rose-500/50 text-white focus:ring-1 focus:ring-rose-500/30'
            : selectedAccount
            ? 'bg-slate-900/90 hover:bg-slate-850 border-slate-700/80 hover:border-slate-600 shadow-md shadow-slate-950/40 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30'
            : 'bg-slate-950/80 hover:bg-slate-900 border-slate-700 text-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {selectedAccount ? (
            <>
              {/* Bank Logo / Emblem */}
              <div className="flex-shrink-0">
                <BankBrandBadge
                  bankName={selectedAccount.bankName}
                  institutionName={selectedAccount.institutionName || selectedAccount.displayName || selectedAccount.name}
                  size="md"
                />
              </div>

              {/* Account Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-white truncate">
                    {selectedAccount.displayName || selectedAccount.name}
                  </span>
                  {selectedBadge && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wider uppercase flex-shrink-0',
                        selectedBadge.classes
                      )}
                    >
                      {selectedBadge.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate mt-0.5">
                  <span>{selectedAccount.institutionName || selectedAccount.bankName || 'Bank'}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-300">
                    {selectedAccount.accountNumberMasked || (selectedAccount.last4 ? `•••• ${selectedAccount.last4}` : '')}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 flex-shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm text-slate-400">{placeholder}</span>
              </div>
            </>
          )}
        </div>

        {/* Right Arrow / Indicator */}
        <div className="flex items-center gap-2 flex-shrink-0 pl-1">
          {selectedAccount && minRequiredBalance && minRequiredBalance > 0 && !isSelectedSufficient && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30 hidden sm:inline">
              Low Balance
            </span>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
        </div>
      </button>

      {error && <p className="text-[11px] text-rose-400">{error}</p>}
      {helperText && !error && <p className="text-[10px] text-slate-500">{helperText}</p>}

      {/* Afinity Custom Selection Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[#0a0f1d] border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/80 overflow-hidden z-10 max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 flex-shrink-0 bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-heading">
                      Select Bank Account
                    </h3>
                    <p className="text-xs text-slate-400">
                      Choose account for SIP installment auto-debit
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar & Type Filter */}
              <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 space-y-2.5 flex-shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search bank name, nickname, or last 4 digits..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 font-sans"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Account Type Filter Chips */}
                {availableTypes.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setSelectedTypeFilter('all')}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                        selectedTypeFilter === 'all'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                      )}
                    >
                      All ({activeAccounts.length})
                    </button>
                    {availableTypes.map((t) => {
                      const count = activeAccounts.filter(
                        (b) => (b.accountType || 'savings').toLowerCase() === t
                      ).length;
                      const badgeInfo = getAccountTypeBadge(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedTypeFilter(t)}
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap capitalize',
                            selectedTypeFilter === t
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                          )}
                        >
                          {badgeInfo.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Scrollable Bank Account List */}
              <div className="overflow-y-auto p-3 sm:p-4 space-y-2 flex-1 max-h-[50vh] overscroll-contain">
                {filteredAccounts.length === 0 ? (
                  <div className="py-10 px-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-2.5 text-slate-500">
                      <Landmark className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-300">No bank accounts found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchQuery
                        ? `No account matches "${searchQuery}".`
                        : 'No active bank accounts available.'}
                    </p>
                  </div>
                ) : (
                  filteredAccounts.map((account) => {
                    const isSelected = account.id === value;
                    const typeBadge = getAccountTypeBadge(account.accountType);
                    const brandTheme = getBankBrandTheme(
                      account.institutionName || account.bankName || account.displayName || account.name
                    );
                    const isSufficient =
                      minRequiredBalance && minRequiredBalance > 0
                        ? Number(account.balance || 0) >= minRequiredBalance
                        : true;

                    return (
                      <motion.button
                        key={account.id}
                        type="button"
                        onClick={() => handleSelectAccount(account)}
                        whileTap={{ scale: 0.985 }}
                        className={cn(
                          'w-full text-left p-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3.5 cursor-pointer group relative overflow-hidden',
                          isSelected
                            ? 'bg-gradient-to-r from-cyan-950/60 via-slate-900/95 to-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/40'
                            : 'bg-slate-900/70 hover:bg-slate-850/90 border-slate-800 hover:border-slate-700'
                        )}
                      >
                        {/* Left: Bank Logo Badge */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            <BankBrandBadge
                              bankName={account.bankName}
                              institutionName={
                                account.institutionName || account.displayName || account.name
                              }
                              size="md"
                            />
                          </div>

                          {/* Center: Account Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={cn(
                                  'text-xs sm:text-sm font-bold truncate leading-tight',
                                  isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                                )}
                              >
                                {account.displayName || account.name}
                              </span>
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-full text-[9px] font-bold border tracking-wider uppercase flex-shrink-0',
                                  typeBadge.classes
                                )}
                              >
                                {typeBadge.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                                {account.institutionName || account.bankName || 'Bank'}
                              </span>
                              <span>•</span>
                              <span className="font-mono text-slate-300 font-medium">
                                {account.accountNumberMasked ||
                                  (account.last4 ? `•••• ${account.last4}` : '••••')}
                              </span>
                            </div>

                            {/* Balance row */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[11px] text-slate-400 font-medium">
                                Available Bal:
                              </span>
                              <span
                                className={cn(
                                  'text-xs font-mono font-bold',
                                  Number(account.balance || 0) < 0
                                    ? 'text-rose-400'
                                    : 'text-emerald-400'
                                )}
                              >
                                {formatRupee(account.balance || 0)}
                              </span>

                              {minRequiredBalance && minRequiredBalance > 0 && !isSufficient && (
                                <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  <AlertCircle className="w-2.5 h-2.5" />
                                  Low Bal for ₹{minRequiredBalance.toLocaleString('en-IN')} SIP
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Check indicator */}
                        <div className="flex-shrink-0 pl-1">
                          {isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-md shadow-cyan-500/40">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border border-slate-700 bg-slate-900 group-hover:border-slate-500 transition-colors" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 flex-shrink-0">
                <span className="text-xs text-slate-400">
                  {activeAccounts.length} active account{activeAccounts.length === 1 ? '' : 's'}
                </span>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState } from 'react';
import { Landmark, ChevronDown, ChevronUp, Plus, Shield, PiggyBank } from 'lucide-react';
import { Bank, BankAccount, FixedDepositAccount } from '../../types';
import { BankAccountCard } from './BankAccountCard';
import { FixedDepositCard } from './FixedDepositCard';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { Badge } from '../ui/Badge';

interface BankCardGroupProps {
  bank?: Bank;
  accounts: BankAccount[];
  fixedDeposits: FixedDepositAccount[];
  onUpdateBalance: (account: BankAccount) => void;
  onTransfer: (account: BankAccount) => void;
  onCloseAccount: (account: BankAccount) => void;
  onArchiveAccountToggle: (account: BankAccount) => void;
  onDeleteAccount?: (account: BankAccount) => void;
  onEditAccount?: (account: BankAccount) => void;
  onViewDetails?: (account: BankAccount) => void;
  onFDActionClick: (fd: FixedDepositAccount, action: 'withdraw' | 'renew' | 'close') => void;
  onFDEdit: (fd: FixedDepositAccount) => void;
  onFDArchiveToggle: (fd: FixedDepositAccount) => void;
  onDeleteFD?: (fd: FixedDepositAccount) => void;
  onAddAccountToBank: (bankId?: string) => void;
}

export const BankCardGroup: React.FC<BankCardGroupProps> = ({
  bank,
  accounts,
  fixedDeposits,
  onUpdateBalance,
  onTransfer,
  onCloseAccount,
  onArchiveAccountToggle,
  onDeleteAccount,
  onEditAccount,
  onViewDetails,
  onFDActionClick,
  onFDEdit,
  onFDArchiveToggle,
  onDeleteFD,
  onAddAccountToBank,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const bankName = bank?.name || accounts[0]?.institutionName || accounts[0]?.bankName || 'Other Banks';
  const totalAccountBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const totalFDBalance = fixedDeposits.reduce((sum, f) => sum + Number(f.principal || f.balance || 0), 0);
  const totalBankPosition = totalAccountBalance + totalFDBalance;

  return (
    <div
      id={`bank-group-${bank?.id || 'other'}`}
      className="rounded-3xl bg-[#0b1222] border border-slate-800/80 overflow-hidden shadow-xl"
    >
      {/* Group Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900/90 via-[#0d1629] to-slate-900/90 cursor-pointer select-none hover:bg-slate-800/40 transition-colors border-b border-slate-800/60"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
              bank?.colorTheme ? `bg-gradient-to-br ${bank.colorTheme}` : 'bg-blue-600'
            }`}
          >
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white tracking-tight">{bankName}</h2>
              {bank?.shortCode && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {bank.shortCode}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{accounts.length} account{accounts.length === 1 ? '' : 's'}</span>
              {fixedDeposits.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400">{fixedDeposits.length} FD{fixedDeposits.length === 1 ? '' : 's'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Combined Position</span>
            <MoneyDisplay
              amount={totalBankPosition}
              size="lg"
              className={totalBankPosition < 0 ? 'text-rose-400 font-bold' : 'text-white font-bold'}
            />
          </div>
          <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Bank Accounts Subgrid */}
          {accounts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading">
                  Checking, Savings & Salary Accounts
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddAccountToBank(bank?.id);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Account
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {accounts.map((acc) => (
                  <BankAccountCard
                    key={acc.id}
                    account={acc}
                    onUpdateBalance={onUpdateBalance}
                    onTransfer={onTransfer}
                    onCloseAccount={onCloseAccount}
                    onArchiveToggle={onArchiveAccountToggle}
                    onDeleteAccount={onDeleteAccount}
                    onEditAccount={onEditAccount}
                    onViewDetails={onViewDetails}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Fixed Deposits Subgrid */}
          {fixedDeposits.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-heading flex items-center gap-1.5">
                  <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
                  Fixed & Term Deposits
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fixedDeposits.map((fd) => (
                  <FixedDepositCard
                    key={fd.id}
                    fd={fd}
                    onActionClick={onFDActionClick}
                    onEdit={onFDEdit}
                    onArchiveToggle={onFDArchiveToggle}
                    onDeleteFD={onDeleteFD}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

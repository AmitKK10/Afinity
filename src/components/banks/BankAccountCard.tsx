import React, { useState } from 'react';
import {
  Landmark,
  CreditCard,
  ArrowRightLeft,
  Edit3,
  Archive,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  XCircle,
  Building2,
  Trash2,
  Scale,
  ShieldCheck,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { BankAccount } from '../../types';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { Badge } from '../ui/Badge';
import { formatRupee } from '../../utils/formatters';
import { BankBrandBadge } from '../brand/BankBrandBadge';
import { getBankBrandTheme } from '../../utils/bankThemes';
import { getBankAccountAverageBalanceStatus } from '../../services/calculations';

interface BankAccountCardProps {
  account: BankAccount;
  onUpdateBalance: (account: BankAccount) => void;
  onTransfer: (account: BankAccount) => void;
  onCloseAccount: (account: BankAccount) => void;
  onArchiveToggle: (account: BankAccount) => void;
  onDeleteAccount?: (account: BankAccount) => void;
  onEditAccount?: (account: BankAccount) => void;
  onViewDetails?: (account: BankAccount) => void;
}

export const BankAccountCard: React.FC<BankAccountCardProps> = ({
  account,
  onUpdateBalance,
  onTransfer,
  onCloseAccount,
  onArchiveToggle,
  onDeleteAccount,
  onEditAccount,
  onViewDetails,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isOverdrawn = Number(account.balance) < 0;
  const isArchived = account.status === 'archived';
  const brandTheme = getBankBrandTheme(account.institutionName || account.bankName || account.displayName || account.name);

  // Compute average balance compliance
  const avgStatus = getBankAccountAverageBalanceStatus(account);

  // Account Type Tag Config
  const getTypeBadge = () => {
    switch (account.accountType) {
      case 'salary':
        return <Badge variant="success">Salary</Badge>;
      case 'current':
        return <Badge variant="warning">Current</Badge>;
      case 'overdraft':
        return <Badge variant="danger">Overdraft Facility</Badge>;
      case 'savings':
      default:
        return <Badge variant="default">Savings</Badge>;
    }
  };

  return (
    <div
      id={`bank-account-card-${account.id}`}
      className={`relative rounded-2xl p-5 transition-all duration-200 border overflow-hidden ${
        isOverdrawn
          ? 'bg-gradient-to-br from-rose-950/30 via-slate-900/90 to-slate-950 border-rose-700/50 shadow-lg shadow-rose-950/20'
          : isArchived
          ? 'bg-slate-900/40 border-slate-800 opacity-60'
          : `bg-gradient-to-br ${brandTheme.cardGradient} ${brandTheme.cardBorder} hover:border-slate-500 shadow-md`
      }`}
    >
      {/* Background subtle ambient watermark */}
      <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white select-none">
        <span className="text-7xl font-mono font-black">{brandTheme.shortCode}</span>
      </div>

      {/* Header with Institution & Action Menu */}
      <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onViewDetails && onViewDetails(account)}
          title="Click to view bank details & average balance"
        >
          <BankBrandBadge
            bankName={account.bankName}
            institutionName={account.institutionName || account.displayName || account.name}
            size="md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight font-heading group-hover:text-blue-300 transition-colors">
                {account.displayName || account.name}
              </h3>
              {getTypeBadge()}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300/80 mt-0.5">
              <span className="font-semibold text-slate-200">
                {account.institutionName || account.bankName || brandTheme.name}
              </span>
              <span>•</span>
              <span className="font-mono text-slate-300 font-medium">
                {account.accountNumberMasked || (account.last4 ? `•••• ${account.last4}` : '•••• ••••')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            id={`btn-menu-${account.id}`}
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Account Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-30 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 text-xs divide-y divide-slate-800">
                <div className="py-1">
                  {onEditAccount && (
                    <button
                      id={`btn-menu-edit-${account.id}`}
                      onClick={() => {
                        setShowMenu(false);
                        onEditAccount(account);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-white hover:bg-blue-600 hover:text-white flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                    >
                      <Sliders className="w-4 h-4 text-blue-400" />
                      <span>Edit Bank Details</span>
                    </button>
                  )}

                  {onViewDetails && (
                    <button
                      id={`btn-menu-view-${account.id}`}
                      onClick={() => {
                        setShowMenu(false);
                        onViewDetails(account);
                      }}
                      className="w-full px-3.5 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Scale className="w-4 h-4 text-indigo-400" />
                      <span>View Details & Average Bal.</span>
                    </button>
                  )}

                  <button
                    id={`btn-menu-adjust-${account.id}`}
                    onClick={() => {
                      setShowMenu(false);
                      onUpdateBalance(account);
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-emerald-400" />
                    <span>Adjust Balance</span>
                  </button>

                  <button
                    id={`btn-menu-transfer-${account.id}`}
                    onClick={() => {
                      setShowMenu(false);
                      onTransfer(account);
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                    <span>Transfer Money</span>
                  </button>
                </div>

                <div className="py-1">
                  {!isArchived && (
                    <button
                      id={`btn-menu-close-${account.id}`}
                      onClick={() => {
                        setShowMenu(false);
                        onCloseAccount(account);
                      }}
                      className="w-full px-3.5 py-2 text-left text-rose-300 hover:bg-rose-950/40 flex items-center gap-2.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Close Account</span>
                    </button>
                  )}

                  {isArchived ? (
                    <button
                      id={`btn-menu-restore-${account.id}`}
                      onClick={() => {
                        setShowMenu(false);
                        onArchiveToggle(account);
                      }}
                      className="w-full px-3.5 py-2 text-left text-slate-400 hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      <span>Restore Account</span>
                    </button>
                  ) : (
                    <button
                      id={`btn-menu-archive-${account.id}`}
                      onClick={() => {
                        setShowMenu(false);
                        onArchiveToggle(account);
                      }}
                      className="w-full px-3.5 py-2 text-left text-slate-400 hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Archive className="w-4 h-4 text-slate-400" />
                      <span>Archive Account</span>
                    </button>
                  )}

                  {onDeleteAccount && (
                    <button
                      id={`btn-menu-delete-${account.id}`}
                      onClick={() => {
                        setShowMenu(false);
                        onDeleteAccount(account);
                      }}
                      className="w-full px-3.5 py-2 text-left text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>Delete Account</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Average Balance Status Pill (when configured or monitored) */}
      {avgStatus.monitoringEnabled && (
        <div className="mb-3">
          {avgStatus.status === 'maintained' ? (
            <div
              onClick={() => onViewDetails && onViewDetails(account)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer hover:bg-emerald-950/60 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>
                {avgStatus.period === 'quarterly' ? 'QAB' : 'MAB'}: ₹{formatRupee(avgStatus.requiredAmount)} | ₹{formatRupee(avgStatus.actualAmount)} (Maintained)
              </span>
            </div>
          ) : avgStatus.status === 'deficit' ? (
            <div
              onClick={() => onViewDetails && onViewDetails(account)}
              className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs cursor-pointer hover:bg-amber-950/60 transition-all space-y-1"
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  {avgStatus.period === 'quarterly' ? 'QAB' : 'MAB'}: Req. ₹{formatRupee(avgStatus.requiredAmount)} | Actual ₹{formatRupee(avgStatus.actualAmount)}
                </span>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Below Req. by ₹{formatRupee(avgStatus.deficit)}
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90 font-normal">
                Average balance appears below your configured requirement
              </p>
            </div>
          ) : avgStatus.requiredAmount === 0 ? (
            <div
              onClick={() => onViewDetails && onViewDetails(account)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs font-semibold cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>Zero-Balance Account (No MAB Required)</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Balance Section */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-end justify-between">
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            {isOverdrawn ? 'Overdrawn Balance (Liability)' : 'Available Balance'}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <MoneyDisplay
              amount={account.balance}
              size="xl"
              className={isOverdrawn ? 'text-rose-400 font-extrabold' : 'text-white font-extrabold'}
            />
            {isOverdrawn && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                <AlertTriangle className="w-3 h-3" />
                Overdraft
              </span>
            )}
          </div>
        </div>

        {/* Quick Direct Actions */}
        <div className="flex items-center gap-1.5">
          {onViewDetails && (
            <button
              id={`btn-details-${account.id}`}
              onClick={() => onViewDetails(account)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
              title="View bank account details and average balance logs"
            >
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              Details
            </button>
          )}
          <button
            id={`btn-transfer-${account.id}`}
            onClick={() => onTransfer(account)}
            className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            title="Transfer from/to this account"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Transfer
          </button>
          <button
            id={`btn-adjust-${account.id}`}
            onClick={() => onUpdateBalance(account)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
            title="Update balance"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Update
          </button>
        </div>
      </div>

      {/* Footer Info: IFSC, Debit Card & Notes */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          {account.ifscCode && (
            <span className="font-mono bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">
              IFSC: {account.ifscCode}
            </span>
          )}
          {account.hasDebitCard && (
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <CreditCard className="w-3 h-3" />
              Debit Card Active
            </span>
          )}
        </div>
        {account.closureDate && (
          <span className="text-rose-400">
            Closed on {new Date(account.closureDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {account.notes && (
        <div className="mt-2 text-xs text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 italic">
          "{account.notes}"
        </div>
      )}
    </div>
  );
};


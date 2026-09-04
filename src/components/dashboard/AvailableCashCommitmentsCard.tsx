import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Wallet,
  Coins,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { formatRupee } from '../../utils/formatters';
import { useFinancialData } from '../../context/FinancialDataContext';
import { cn } from '../../utils/cn';

interface AvailableCashCommitmentsCardProps {
  className?: string;
  onManageCommitments?: () => void;
}

export const AvailableCashCommitmentsCard: React.FC<AvailableCashCommitmentsCardProps> = ({
  className,
  onManageCommitments,
}) => {
  const navigate = useNavigate();
  const { bankAccounts, sips, creditCards } = useFinancialData();

  // Active bank accounts total balance
  const activeBanks = useMemo(
    () => (bankAccounts || []).filter((b) => b.status === 'active'),
    [bankAccounts]
  );
  const totalActiveBankBalances = useMemo(
    () => activeBanks.reduce((sum, b) => sum + Number(b.balance || 0), 0),
    [activeBanks]
  );

  // Active SIP commitments (monthly installments)
  const activeSips = useMemo(
    () => (sips || []).filter((s) => s.sipStatus === 'active' && s.status !== 'archived'),
    [sips]
  );
  const upcomingSIPCommitments = useMemo(
    () => activeSips.reduce((sum, s) => sum + Number(s.amount || 0), 0),
    [activeSips]
  );

  // Active Credit Card dues
  const activeCards = useMemo(
    () => (creditCards || []).filter((c) => c.status !== 'archived' && c.status !== 'closed'),
    [creditCards]
  );
  const upcomingCreditCardDues = useMemo(
    () =>
      activeCards.reduce(
        (sum, c) =>
          sum + Math.max(0, Number(c.outstanding !== undefined ? c.outstanding : c.outstandingBalance || 0)),
        0
      ),
    [activeCards]
  );

  // Total obligations & Safe Available Cash
  const totalCommitments = upcomingSIPCommitments + upcomingCreditCardDues;
  const safeAvailableCash = totalActiveBankBalances - totalCommitments;
  const isFinanciallySafe = safeAvailableCash >= 0;
  const shortfall = !isFinanciallySafe ? Math.abs(safeAvailableCash) : 0;

  // Percentage of bank balance committed (capped at 100)
  const committedPercentage =
    totalActiveBankBalances > 0
      ? Math.min(100, Math.round((totalCommitments / totalActiveBankBalances) * 100))
      : totalCommitments > 0
      ? 100
      : 0;

  return (
    <div
      id="available-cash-commitments-card"
      className={cn(
        'p-4 sm:p-5 rounded-2xl border backdrop-blur-sm transition-all duration-300 shadow-sm',
        isFinanciallySafe
          ? 'bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
          : 'bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-rose-950/30 border-rose-500/40 hover:border-rose-500/60',
        className
      )}
    >
      {/* Header with Safety Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border',
              isFinanciallySafe
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            )}
          >
            {isFinanciallySafe ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-heading text-white">
                Available Cash After Commitments
              </h3>
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono border',
                  isFinanciallySafe
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60'
                    : 'bg-rose-950/80 text-rose-400 border-rose-700/60'
                )}
              >
                {isFinanciallySafe ? '🟢 Financially Safe' : '🔴 Liquidity Shortfall'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFinanciallySafe
                ? `You have sufficient active bank liquidity to cover all upcoming SIPs & card dues with a surplus of ${formatRupee(safeAvailableCash)}.`
                : `Active bank balance cannot fully cover all commitments. Shortfall of ${formatRupee(shortfall)} detected.`}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <span className="text-[11px] font-medium text-slate-400 block">
            Safe Available Cash
          </span>
          <div
            className={cn(
              'text-xl sm:text-2xl font-black font-mono tracking-tight',
              isFinanciallySafe ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {formatRupee(safeAvailableCash)}
          </div>
        </div>
      </div>

      {/* Arithmetic Calculation Formula Strip */}
      <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-3.5">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center text-center">
          {/* Total Bank Balances */}
          <div
            onClick={() => navigate('/banks')}
            className="md:col-span-2 p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Active Bank Balance</span>
              </span>
              <span className="text-[10px] text-slate-500">{activeBanks.length} Banks</span>
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-white">
              {formatRupee(totalActiveBankBalances)}
            </div>
          </div>

          {/* Minus Operator */}
          <div className="text-slate-500 font-black text-base hidden md:block">−</div>

          {/* Upcoming SIP commitments */}
          <div
            onClick={() => navigate('/investments?tab=sips')}
            className="md:col-span-2 p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                <span>Upcoming SIPs</span>
              </span>
              <span className="text-[10px] text-slate-500">{activeSips.length} SIPs</span>
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-amber-300">
              {formatRupee(upcomingSIPCommitments)}
            </div>
          </div>

          {/* Minus Operator */}
          <div className="text-slate-500 font-black text-base hidden md:block">−</div>

          {/* Upcoming Credit Card Dues */}
          <div
            onClick={() => navigate('/credit')}
            className="md:col-span-2 p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-rose-400" />
                <span>Credit Card Dues</span>
              </span>
              <span className="text-[10px] text-slate-500">{activeCards.length} Cards</span>
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-rose-400">
              {formatRupee(upcomingCreditCardDues)}
            </div>
          </div>
        </div>
      </div>

      {/* Liquidity Utilization Progress Bar */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Commitment Utilization ({committedPercentage}% of bank balance)</span>
          <span className="font-mono text-slate-300">
            Committed: {formatRupee(totalCommitments)} / {formatRupee(totalActiveBankBalances)}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isFinanciallySafe ? 'bg-cyan-500' : 'bg-rose-500'
            )}
            style={{ width: `${committedPercentage}%` }}
          />
        </div>
      </div>

      {/* Footer Details & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>
            {isFinanciallySafe
              ? `Healthy liquidity margin: ${Math.max(0, 100 - committedPercentage)}% unencumbered buffer.`
              : `Immediate funding recommended to prevent Auto-Pay bounces or overdue interest charges.`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onManageCommitments?.();
              navigate('/investments?tab=sips');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>View SIPs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/credit')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>View Credit Cards</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

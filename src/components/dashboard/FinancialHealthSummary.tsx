import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Layers,
  ArrowUpRight,
  Activity,
  Coins,
} from 'lucide-react';
import { SectionHeader } from '../ui/SectionHeader';
import { formatRupee, formatPercentage } from '../../utils/formatters';
import { useFinancialData } from '../../context/FinancialDataContext';
import { calculateTotalInvestmentProfitLoss } from '../../services/calculations';
import { cn } from '../../utils/cn';

interface FinancialHealthSummaryProps {
  className?: string;
  onCardClick?: (metric: string) => void;
}

export const FinancialHealthSummary: React.FC<FinancialHealthSummaryProps> = ({
  className,
  onCardClick,
}) => {
  const navigate = useNavigate();
  const {
    netWorth,
    totalAssets,
    totalLiabilities,
    liquidAssets,
    bankAccounts,
    cashHoldings,
    wallets,
    investments,
  } = useFinancialData();

  // Active liquid cash across all bank accounts, cash, and digital wallets
  const availableCash = useMemo(() => {
    if (liquidAssets !== undefined && liquidAssets > 0) return liquidAssets;
    const bankTotal = (bankAccounts || [])
      .filter((b) => b.status === 'active')
      .reduce((sum, b) => sum + Number(b.balance || 0), 0);
    const cashTotal = (cashHoldings || [])
      .filter((c) => c.status !== 'archived')
      .reduce((sum, c) => sum + Number(c.balance || 0), 0);
    const walletTotal = (wallets || [])
      .filter((w) => w.status !== 'archived')
      .reduce((sum, w) => sum + Number(w.balance || 0), 0);
    return bankTotal + cashTotal + walletTotal;
  }, [liquidAssets, bankAccounts, cashHoldings, wallets]);

  // Overall Investment Valuation & Profit/Loss
  const activeHoldings = useMemo(
    () => (investments || []).filter((i) => i.status !== 'archived'),
    [investments]
  );
  const investmentValuation = useMemo(
    () => calculateTotalInvestmentProfitLoss(activeHoldings),
    [activeHoldings]
  );

  const investmentTotal = investmentValuation.totalCurrent;
  const totalPnl = investmentValuation.profitLoss;
  const totalRetPct = investmentValuation.returnPercentage;
  const isPnlPositive = totalPnl >= 0;

  const metrics = [
    {
      id: 'net_worth',
      label: 'Net Worth',
      value: netWorth,
      formatted: formatRupee(netWorth),
      subtext: 'Assets minus Liabilities',
      badge: 'Total Equity',
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60',
      icon: Activity,
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      accentColor: 'from-cyan-500/10 via-slate-900/60 to-slate-900/40',
      borderColor: 'border-cyan-500/30 hover:border-cyan-500/60',
      onClick: () => navigate('/accounts'),
    },
    {
      id: 'total_assets',
      label: 'Total Assets',
      value: totalAssets,
      formatted: formatRupee(totalAssets),
      subtext: 'Cash, Banks, Equities & Dues',
      badge: 'Gross Capital',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
      icon: Layers,
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      accentColor: 'from-emerald-500/10 via-slate-900/60 to-slate-900/40',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
      onClick: () => navigate('/accounts'),
    },
    {
      id: 'total_liabilities',
      label: 'Total Liabilities',
      value: totalLiabilities,
      formatted: formatRupee(totalLiabilities),
      subtext: totalLiabilities > 0 ? 'Cards & Payables Due' : 'Zero Active Debt',
      badge: totalLiabilities > 0 ? 'Exposure' : 'Debt Free',
      badgeColor: totalLiabilities > 0 ? 'text-rose-400 bg-rose-950/60 border-rose-800/60' : 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
      icon: CreditCard,
      iconBg: totalLiabilities > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      accentColor: totalLiabilities > 0 ? 'from-rose-500/10 via-slate-900/60 to-slate-900/40' : 'from-emerald-500/10 via-slate-900/60 to-slate-900/40',
      borderColor: totalLiabilities > 0 ? 'border-rose-500/30 hover:border-rose-500/60' : 'border-emerald-500/30 hover:border-emerald-500/60',
      onClick: () => navigate('/credit'),
    },
    {
      id: 'available_cash',
      label: 'Available Cash',
      value: availableCash,
      formatted: formatRupee(availableCash),
      subtext: 'Banks, Cash & Wallets',
      badge: 'Liquid Reserve',
      badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-800/60',
      icon: Wallet,
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      accentColor: 'from-blue-500/10 via-slate-900/60 to-slate-900/40',
      borderColor: 'border-blue-500/30 hover:border-blue-500/60',
      onClick: () => navigate('/banks'),
    },
    {
      id: 'investment_value',
      label: 'Investment Value',
      value: investmentTotal,
      formatted: formatRupee(investmentTotal),
      subtext: `${activeHoldings.length} Active Holdings`,
      badge: 'Market Value',
      badgeColor: 'text-violet-400 bg-violet-950/60 border-violet-800/60',
      icon: Coins,
      iconBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      accentColor: 'from-violet-500/10 via-slate-900/60 to-slate-900/40',
      borderColor: 'border-violet-500/30 hover:border-violet-500/60',
      onClick: () => navigate('/investments'),
    },
    {
      id: 'overall_pnl',
      label: 'Overall P/L',
      value: totalPnl,
      formatted: `${isPnlPositive ? '+' : ''}${formatRupee(totalPnl)}`,
      subtext: `${isPnlPositive ? '+' : ''}${formatPercentage(totalRetPct)} All-time Gain`,
      badge: isPnlPositive ? 'Net Gain' : 'Drawdown',
      badgeColor: isPnlPositive ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' : 'text-rose-400 bg-rose-950/60 border-rose-800/60',
      icon: isPnlPositive ? TrendingUp : TrendingDown,
      iconBg: isPnlPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      accentColor: isPnlPositive ? 'from-emerald-500/10 via-slate-900/60 to-slate-900/40' : 'from-rose-500/10 via-slate-900/60 to-slate-900/40',
      borderColor: isPnlPositive ? 'border-emerald-500/30 hover:border-emerald-500/60' : 'border-rose-500/30 hover:border-rose-500/60',
      onClick: () => navigate('/investments'),
    },
  ];

  return (
    <div id="financial-health-summary-section" className={cn('space-y-3', className)}>
      <SectionHeader
        id="financial-health-summary-header"
        title="Financial Health Summary"
        subtitle="Live net position, gross capital, liabilities & liquid reserves"
        badge={
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-[10px] font-mono font-bold text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Live
          </span>
        }
        actionText="View Accounts"
        onActionClick={() => navigate('/accounts')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              onClick={() => {
                onCardClick?.(m.id);
                m.onClick();
              }}
              className={cn(
                'group relative p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5',
                m.accentColor,
                m.borderColor
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn('p-1.5 rounded-xl border flex items-center justify-center shrink-0', m.iconBg)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors font-heading truncate">
                    {m.label}
                  </span>
                </div>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-md font-medium border font-mono shrink-0', m.badgeColor)}>
                  {m.badge}
                </span>
              </div>

              <div>
                <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  {m.formatted}
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {m.subtext}
                </div>
              </div>

              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  TrendingUp,
  Building2,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { AfinityWidgetSnapshot } from '../../types/widget';

interface LargeWidgetViewProps {
  snapshot: AfinityWidgetSnapshot;
  maskValues?: boolean;
  onNavigate?: (route: string) => void;
}

export const LargeWidgetView: React.FC<LargeWidgetViewProps> = ({
  snapshot,
  maskValues = false,
  onNavigate,
}) => {
  const navigate = useNavigate();

  const handleRoute = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      navigate(route);
    }
  };

  const displayNetWorth = maskValues ? '••••••' : snapshot.formattedNetWorthCompact || snapshot.formattedNetWorth;
  const displayAssets = maskValues ? '••••••' : snapshot.formattedTotalAssets;
  const displayLiabilities = maskValues ? '••••••' : snapshot.formattedTotalLiabilities;
  const displayInvestments = maskValues ? '••••••' : snapshot.formattedInvestmentValue;
  const displayBank = maskValues ? '••••••' : snapshot.formattedBankBalance;
  const displayCredit = maskValues ? '••••••' : snapshot.formattedCreditOutstanding;

  const next = snapshot.nextCommitment;
  const displayNextAmount = maskValues ? '••••••' : next?.formattedAmount || '₹0';
  const safety = snapshot.paymentSafety;
  const isSafe = safety.status === 'SAFE';
  const isWarning = safety.status === 'WARNING';

  return (
    <div
      id="android-widget-large"
      className="group relative w-full max-w-[390px] rounded-[26px] bg-[#080c16] border border-slate-800/90 p-4.5 shadow-2xl shadow-black/80 hover:border-cyan-500/40 transition-all select-none overflow-hidden flex flex-col justify-between"
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-48 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header Bar: Logo, Name & Live Badge */}
      <div
        onClick={() => handleRoute('/')}
        className="flex items-center justify-between cursor-pointer pb-2.5 border-b border-slate-800/60 z-10"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-sm shadow-cyan-500/20">
            <Shield className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-black text-cyan-400 font-heading tracking-wider">
            AFINITY
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
              snapshot.isDemoData
                ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
            }`}
          >
            {snapshot.isDemoData ? 'DEMO DATA' : 'LIVE VAULT'}
          </span>
        </div>
      </div>

      {/* 2. Executive Financial Hero: Net Worth, Assets, Liabilities */}
      <div
        onClick={() => handleRoute('/')}
        className="my-3 p-3 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/30 border border-cyan-950/60 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center justify-between z-10"
      >
        <div>
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-heading">
            TOTAL NET WORTH
          </span>
          <div className="text-2xl font-black text-white tracking-tight font-heading mt-0.5">
            {displayNetWorth}
          </div>
        </div>

        <div className="text-right space-y-0.5">
          <div className="text-[10px] font-bold text-emerald-400 font-mono">
            Assets: {displayAssets}
          </div>
          <div className="text-[10px] font-bold text-rose-400 font-mono">
            Dues: {displayLiabilities}
          </div>
        </div>
      </div>

      {/* 3. Three Metric Pillars: Investments, Bank, Credit */}
      <div className="grid grid-cols-3 gap-2 z-10">
        {/* Investments */}
        <div
          onClick={() => handleRoute('/investments')}
          className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1 text-slate-400 mb-0.5">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-[8px] font-bold uppercase tracking-wider">INVEST</span>
          </div>
          <div className="text-[11px] font-black text-emerald-300 font-mono truncate">
            {displayInvestments}
          </div>
        </div>

        {/* Bank */}
        <div
          onClick={() => handleRoute('/accounts')}
          className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1 text-slate-400 mb-0.5">
            <Building2 className="w-3 h-3 text-cyan-400" />
            <span className="text-[8px] font-bold uppercase tracking-wider">BANK</span>
          </div>
          <div className="text-[11px] font-black text-cyan-300 font-mono truncate">
            {displayBank}
          </div>
        </div>

        {/* Credit */}
        <div
          onClick={() => handleRoute('/credit')}
          className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-rose-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1 text-slate-400 mb-0.5">
            <CreditCard className="w-3 h-3 text-rose-400" />
            <span className="text-[8px] font-bold uppercase tracking-wider">CREDIT</span>
          </div>
          <div className="text-[11px] font-black text-rose-300 font-mono truncate">
            {displayCredit}
          </div>
        </div>
      </div>

      {/* 4. Upcoming Commitment & Payment Safety Bar */}
      <div
        onClick={() => handleRoute(next?.deepLinkRoute || '/investments')}
        className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/50 transition-all cursor-pointer z-10 group/commitment"
      >
        {/* Commitment Header */}
        <div className="flex items-center justify-between text-[8px] font-bold mb-1">
          <div className="flex items-center gap-1 text-cyan-400 uppercase tracking-wider font-heading">
            <Calendar className="w-2.5 h-2.5" />
            <span>{next ? next.categoryLabel : 'COMMITMENTS'}</span>
          </div>

          {/* Payment Safety Pill */}
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black border ${
              isSafe
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                : isWarning
                ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                : 'bg-rose-950/80 text-rose-300 border-rose-800/60'
            }`}
          >
            {isSafe ? (
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            ) : isWarning ? (
              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            ) : (
              <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
            )}
            <span>{safety.label}</span>
          </div>
        </div>

        {/* Commitment Body */}
        {next ? (
          <div className="flex items-center justify-between pt-0.5">
            <div className="min-w-0 pr-2">
              <div className="text-[11px] font-bold text-slate-100 truncate group-hover/commitment:text-cyan-300 transition-colors">
                {next.title}
              </div>
              <div className="text-[9px] font-medium text-slate-400 flex items-center gap-1">
                <span>{next.badgeText}</span>
                <span>•</span>
                <span className="font-mono">{next.dueDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs font-black text-white font-mono">
                {displayNextAmount}
              </span>
              <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover/commitment:text-cyan-400" />
            </div>
          </div>
        ) : (
          <div className="text-[11px] font-medium text-slate-400 py-1 flex items-center justify-between">
            <span>No pending payments due this week</span>
            <ExternalLink className="w-3 h-3 text-slate-600" />
          </div>
        )}
      </div>
    </div>
  );
};

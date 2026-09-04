import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, TrendingUp, Building2, CreditCard, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { AfinityWidgetSnapshot } from '../../types/widget';

interface MediumWidgetViewProps {
  snapshot: AfinityWidgetSnapshot;
  maskValues?: boolean;
  onNavigate?: (route: string) => void;
}

export const MediumWidgetView: React.FC<MediumWidgetViewProps> = ({
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
  const displayInvestments = maskValues ? '••••••' : snapshot.formattedInvestmentValue;
  const displayBank = maskValues ? '••••••' : snapshot.formattedBankBalance;
  const displayCredit = maskValues ? '••••••' : snapshot.formattedCreditOutstanding;

  const safety = snapshot.paymentSafety;
  const isSafe = safety.status === 'SAFE';
  const isWarning = safety.status === 'WARNING';

  return (
    <div
      id="android-widget-medium"
      className="group relative w-full max-w-[380px] rounded-[24px] bg-[#080c16] border border-slate-800/80 p-4 shadow-2xl shadow-black/80 hover:border-cyan-500/40 transition-all select-none overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-36 h-28 bg-gradient-to-bl from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Top Header Row: Afinity Logo, Net Worth & Payment Safety Status */}
      <div
        onClick={() => handleRoute('/')}
        className="flex items-center justify-between cursor-pointer group/header z-10 relative pb-3 border-b border-slate-800/60"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Shield className="w-4 h-4 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-heading">
                NET WORTH
              </span>
              <span
                className={`text-[8px] font-black px-1.5 py-0.2 rounded ${
                  snapshot.isDemoData
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                }`}
              >
                {snapshot.isDemoData ? 'DEMO' : 'LIVE'}
              </span>
            </div>
            <div className="text-xl font-black text-white tracking-tight font-heading group-hover/header:text-cyan-300 transition-colors">
              {displayNetWorth}
            </div>
          </div>
        </div>

        {/* Payment Safety Status Pill */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleRoute('/credit');
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold border cursor-pointer transition-transform active:scale-95 ${
            isSafe
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
              : isWarning
              ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
              : 'bg-rose-950/80 text-rose-300 border-rose-800/60'
          }`}
          title={safety.description}
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

      {/* 3 Metric Buckets: Investments, Bank, Credit */}
      <div className="grid grid-cols-3 gap-2 pt-3 z-10 relative">
        {/* 1. Investments */}
        <div
          onClick={() => handleRoute('/investments')}
          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer group/item"
        >
          <div className="flex items-center gap-1 text-slate-400">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-[8px] font-bold uppercase tracking-wider">INVEST</span>
          </div>
          <div className="text-xs font-black text-emerald-300 font-mono mt-1 truncate">
            {displayInvestments}
          </div>
        </div>

        {/* 2. Bank Balance */}
        <div
          onClick={() => handleRoute('/accounts')}
          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900 transition-all cursor-pointer group/item"
        >
          <div className="flex items-center gap-1 text-slate-400">
            <Building2 className="w-3 h-3 text-cyan-400" />
            <span className="text-[8px] font-bold uppercase tracking-wider">BANK</span>
          </div>
          <div className="text-xs font-black text-cyan-300 font-mono mt-1 truncate">
            {displayBank}
          </div>
        </div>

        {/* 3. Credit Dues */}
        <div
          onClick={() => handleRoute('/credit')}
          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-rose-500/50 hover:bg-slate-900 transition-all cursor-pointer group/item"
        >
          <div className="flex items-center gap-1 text-slate-400">
            <CreditCard className="w-3 h-3 text-rose-400" />
            <span className="text-[8px] font-bold uppercase tracking-wider">CREDIT</span>
          </div>
          <div className="text-xs font-black text-rose-300 font-mono mt-1 truncate">
            {displayCredit}
          </div>
        </div>
      </div>
    </div>
  );
};

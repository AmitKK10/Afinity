import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Building2, ExternalLink } from 'lucide-react';
import { AfinityWidgetSnapshot } from '../../types/widget';

interface SmallWidgetViewProps {
  snapshot: AfinityWidgetSnapshot;
  maskValues?: boolean;
  onNavigate?: (route: string) => void;
}

export const SmallWidgetView: React.FC<SmallWidgetViewProps> = ({
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
  const displayBank = maskValues ? '••••••' : snapshot.formattedBankBalance;

  return (
    <div
      id="android-widget-small"
      onClick={() => handleRoute('/')}
      className="group relative w-full aspect-square max-w-[200px] min-h-[170px] rounded-[24px] bg-[#080c16] border border-slate-800/80 p-3.5 flex flex-col justify-between shadow-2xl shadow-black/80 hover:border-cyan-500/50 transition-all cursor-pointer select-none overflow-hidden"
    >
      {/* Subtle ambient gradient aura */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header: Afinity Logo & Live/Demo badge */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center p-0.5 shadow-sm shadow-cyan-500/20">
            <Shield className="w-3 h-3 text-white" />
          </div>
          <span className="text-[11px] font-black text-cyan-400 font-heading tracking-wider">
            AFINITY
          </span>
        </div>

        <span
          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border ${
            snapshot.isDemoData
              ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
          }`}
        >
          {snapshot.isDemoData ? 'DEMO' : 'LIVE'}
        </span>
      </div>

      {/* Hero: Net Worth */}
      <div className="my-auto z-10 pt-1">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block font-heading">
          NET WORTH
        </span>
        <div className="text-xl font-black text-white tracking-tight font-heading mt-0.5 truncate drop-shadow-sm">
          {displayNetWorth}
        </div>
      </div>

      {/* Secondary: Available Bank Balance */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleRoute('/accounts');
        }}
        className="z-10 p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/40 transition-colors flex items-center justify-between group/sub"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Building2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[8px] font-semibold text-slate-400 uppercase block leading-none">
              BANK
            </span>
            <span className="text-[11px] font-bold text-slate-100 font-mono truncate block leading-tight">
              {displayBank}
            </span>
          </div>
        </div>

        <ExternalLink className="w-2.5 h-2.5 text-slate-600 group-hover/sub:text-cyan-400 flex-shrink-0" />
      </div>
    </div>
  );
};

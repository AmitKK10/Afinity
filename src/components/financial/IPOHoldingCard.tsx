import React, { useState } from 'react';
import {
  Layers,
  Building2,
  Calendar,
  Lock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  MoreVertical,
  Edit2,
  Archive,
  Trash2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { IPOApplication } from '../../types';
import { Badge } from '../ui/Badge';
import { formatRupee, formatFinancialDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface IPOHoldingCardProps {
  ipo: IPOApplication;
  onEdit: (ipo: IPOApplication) => void;
  onArchive: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  isArchived?: boolean;
}

export const IPOHoldingCard: React.FC<IPOHoldingCardProps> = ({
  ipo,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  isArchived = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const status = (ipo.ipoStatus || 'applied').toLowerCase();
  const isAllotted = status === 'allotted';
  const isRefunded = status === 'refunded';
  const isCancelled = status === 'cancelled';
  const isBlocked = status === 'applied' || status === 'blocked';

  const statusBadgeVariant = isAllotted
    ? 'emerald'
    : isRefunded
    ? 'slate'
    : isCancelled
    ? 'rose'
    : 'cyan';

  const statusLabel = isAllotted
    ? 'Allotted'
    : isRefunded
    ? 'Refunded'
    : isCancelled
    ? 'Cancelled'
    : 'Funds Blocked (ASBA)';

  const lots = ipo.lotsApplied || 1;
  const sharesPerLot = ipo.sharesPerLot || 1;
  const totalShares = lots * sharesPerLot;
  const bidPrice = ipo.bidPrice || 0;
  const blockedAmount = ipo.blockedAmount || ipo.applicationAmount || lots * sharesPerLot * bidPrice;

  return (
    <div
      id={`ipo-card-${ipo.id}`}
      className={cn(
        'relative rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#0b172a] via-[#091120] to-[#060a14] border shadow-xl overflow-hidden',
        isArchived
          ? 'border-slate-800 opacity-70'
          : isAllotted
          ? 'border-emerald-500/40 shadow-emerald-950/20'
          : 'border-cyan-500/30 shadow-cyan-950/20'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-900 to-blue-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0 shadow-md">
            <Building2 className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-bold text-white font-heading">
                {ipo.companyName || ipo.name}
              </h4>
              {ipo.symbol && (
                <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {ipo.symbol}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusBadgeVariant as any} size="sm">
                {statusLabel}
              </Badge>
              {ipo.bankUsed && (
                <span className="text-[11px] text-slate-400 font-medium">
                  via {ipo.bankUsed}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            aria-label="IPO Actions"
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-12 z-30 w-44 rounded-2xl bg-[#0f1d35] border border-slate-700 shadow-2xl p-1.5 space-y-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(ipo);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Application</span>
                </button>

                <div className="border-t border-slate-800 my-1" />

                {isArchived ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onRestore?.(ipo.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-400 hover:bg-emerald-950/60 transition-colors cursor-pointer text-left"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore IPO</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onArchive(ipo.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-amber-400 hover:bg-amber-950/60 transition-colors cursor-pointer text-left"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive IPO</span>
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(ipo.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Blocked Amount & Application Specs */}
      <div className="grid grid-cols-2 gap-3 p-3 sm:p-3.5 mt-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div>
          <span className="text-[11px] text-slate-400 font-medium block mb-0.5">
            {isBlocked ? 'Blocked ASBA Amount' : 'Application Value'}
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-cyan-300">
            {formatRupee(blockedAmount)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {lots} {lots === 1 ? 'Lot' : 'Lots'} ({totalShares} shares @ ₹{bidPrice})
          </span>
        </div>

        <div className="text-right flex flex-col justify-center items-end">
          {isAllotted && (
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Shares Allotted</span>
            </div>
          )}
          {isRefunded && (
            <div className="flex items-center gap-1 text-slate-300 text-xs font-semibold">
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>Refunded to Bank</span>
            </div>
          )}
          {isBlocked && (
            <div className="flex items-center gap-1 text-cyan-400 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Held in Bank</span>
            </div>
          )}
          <span className="text-[10px] text-slate-400 mt-1">
            Application No: {ipo.applicationNumber || 'ASBA-' + ipo.id.slice(-6)}
          </span>
        </div>
      </div>

      {/* Timeline Dates */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/60 text-[11px]">
        <div>
          <span className="text-slate-400 block">Applied Date</span>
          <span className="text-slate-200 font-semibold">
            {ipo.applicationDate ? formatFinancialDate(ipo.applicationDate) : '—'}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block">Allotment Date</span>
          <span className="text-cyan-300 font-semibold">
            {ipo.allotmentDate ? formatFinancialDate(ipo.allotmentDate) : 'TBD'}
          </span>
        </div>

        <div className="text-right">
          <span className="text-slate-400 block">Listing Date</span>
          <span className="text-emerald-300 font-semibold">
            {ipo.listingDate ? formatFinancialDate(ipo.listingDate) : 'TBD'}
          </span>
        </div>
      </div>

      {/* Double Counting Guard Note */}
      <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/40 text-[10px] text-slate-400">
        <AlertCircle className="w-3 h-3 text-cyan-400 shrink-0" />
        <span>
          ASBA funds remain in your bank account until allotment and are not double-counted in Net Worth.
        </span>
      </div>
    </div>
  );
};

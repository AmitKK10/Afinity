import React from 'react';
import { History, TrendingUp, TrendingDown, Clock, ShieldCheck, Tag } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { InvestmentHolding } from '../../types';
import { useFinancialData } from '../../context/FinancialDataContext';
import { formatRupee, formatPercentage, formatFinancialDate, formatPriceUpdatedTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface InvestmentPriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  holding: InvestmentHolding | null;
}

export const InvestmentPriceHistoryModal: React.FC<InvestmentPriceHistoryModalProps> = ({
  isOpen,
  onClose,
  holding,
}) => {
  const { auditEvents, balanceHistory } = useFinancialData();

  if (!holding) return null;

  // Filter audit events related to this holding
  const holdingEvents = auditEvents
    .filter(
      (e) =>
        e.entityId === holding.id ||
        (e.details as any)?.holdingId === holding.id ||
        (e.details as any)?.name === holding.name
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter balance history records
  const holdingHistories = balanceHistory
    .filter((h) => h.entityId === holding.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const currentPrice = Number(holding.currentPrice || 0);
  const avgBuy = Number(holding.averageBuyPrice || 0);
  const qty = Number(holding.quantity !== undefined ? holding.quantity : holding.unitsHeld || 0);
  const unit = holding.unit || 'units';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Price & Valuation History"
      subtitle={`Audit log for ${holding.displayName || holding.name}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-xs">
        {/* Quick Current Overview */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400 block mb-0.5">Average Purchase Price</span>
            <span className="text-base font-bold font-mono text-white">
              ₹{avgBuy.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Purchased: {qty} {unit}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block mb-0.5">Current CMP / NAV</span>
            <span className="text-base font-bold font-mono text-cyan-300">
              ₹{currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Source: {holding.priceSource || 'MANUAL'}
            </span>
          </div>
        </div>

        {/* History Timeline */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 font-heading flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Valuation Change Logs</span>
          </h4>

          {holdingEvents.length === 0 && holdingHistories.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400">
              <Clock className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-300">No Historical Price Updates Yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Initial holding recorded at ₹{avgBuy}. Future manual updates will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {holdingEvents.map((evt) => {
                const details = evt.details || {};
                const prev = details.previousPrice || details.previousBalance;
                const next = details.newPrice || details.newBalance;
                const change = next !== undefined && prev !== undefined ? next - prev : null;
                const changePct = prev && prev > 0 && change !== null ? (change / prev) * 100 : null;

                return (
                  <div
                    key={evt.id}
                    className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">
                          {evt.action === 'price_update'
                            ? 'Price Revaluation'
                            : evt.action === 'create'
                            ? 'Holding Created'
                            : evt.action}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {details.source || 'MANUAL'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {formatPriceUpdatedTime(evt.timestamp)} • {formatFinancialDate(evt.timestamp)}
                      </span>
                    </div>

                    <div className="text-right">
                      {next !== undefined && (
                        <span className="text-sm font-bold font-mono text-cyan-300 block">
                          ₹{Number(next).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      )}
                      {change !== null && change !== undefined && (
                        <span
                          className={cn(
                            'text-[10px] font-bold font-mono block',
                            change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          )}
                        >
                          {change >= 0 ? '+' : ''}
                          ₹{change.toFixed(2)} ({formatPercentage(changePct, true)})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            All price modifications maintain immutable audit trails stored locally on your device.
          </span>
        </div>
      </div>
    </Modal>
  );
};

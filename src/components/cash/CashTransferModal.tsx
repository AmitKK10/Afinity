import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Landmark,
  Banknote,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { SelectField } from '../ui/SelectionSheet';
import { BankBrandBadge } from '../brand/BankBrandBadge';
import { useFinancialData } from '../../context/FinancialDataContext';
import { formatRupee } from '../../utils/formatters';

interface CashTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'transfer' | 'atm';
  onSuccess?: (message: string) => void;
}

export const CashTransferModal: React.FC<CashTransferModalProps> = ({
  isOpen,
  onClose,
  mode = 'transfer',
  onSuccess,
}) => {
  const {
    cashHoldings,
    bankAccounts,
    transferCashBetweenVaults,
    withdrawBankToCash,
  } = useFinancialData();

  const [transferType, setTransferType] = useState<'transfer' | 'atm'>(mode);
  const [fromCashId, setFromCashId] = useState<string>('');
  const [toCashId, setToCashId] = useState<string>('');
  const [fromBankId, setFromBankId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCash = cashHoldings.filter((c) => c.status === 'active');
  const activeBanks = bankAccounts.filter((b) => b.status === 'active');

  // Initialize selections
  React.useEffect(() => {
    setTransferType(mode);
    if (activeCash.length >= 2) {
      setFromCashId(activeCash[0].id);
      setToCashId(activeCash[1].id);
    } else if (activeCash.length === 1) {
      setToCashId(activeCash[0].id);
    }
    if (activeBanks.length > 0) {
      setFromBankId(activeBanks[0].id);
    }
  }, [mode, isOpen, activeCash.length, activeBanks.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) return;

    setIsSubmitting(true);
    try {
      if (transferType === 'transfer') {
        if (!fromCashId || !toCashId || fromCashId === toCashId) return;
        await transferCashBetweenVaults(fromCashId, toCashId, amountNum, remarks);
        const fromVault = activeCash.find((c) => c.id === fromCashId);
        const toVault = activeCash.find((c) => c.id === toCashId);
        onSuccess?.(`✓ Transferred ${formatRupee(amountNum)} from ${fromVault?.name} to ${toVault?.name}`);
      } else {
        if (!fromBankId || !toCashId) return;
        await withdrawBankToCash(fromBankId, toCashId, amountNum, remarks);
        const bank = activeBanks.find((b) => b.id === fromBankId);
        const toVault = activeCash.find((c) => c.id === toCashId);
        onSuccess?.(`✓ ATM Withdrawal: ${formatRupee(amountNum)} from ${bank?.name} to ${toVault?.name}`);
      }

      setAmount('');
      setRemarks('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transferType === 'atm' ? 'ATM Cash Withdrawal' : 'Physical Cash Transfer'}
      subtitle="Reconcile movement of physical currency between vaults or from bank"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-200">
        {/* Transfer Type Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTransferType('transfer')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer font-heading flex items-center justify-center gap-1.5 ${
              transferType === 'transfer'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Vault Transfer</span>
          </button>

          <button
            type="button"
            onClick={() => setTransferType('atm')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer font-heading flex items-center justify-center gap-1.5 ${
              transferType === 'atm'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>ATM Withdrawal</span>
          </button>
        </div>

        {/* Source & Destination Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Source */}
          <div>
            {transferType === 'atm' ? (
              <SelectField
                label="Source Bank Account"
                value={fromBankId}
                onChange={(val) => setFromBankId(val)}
                options={activeBanks.map((b) => ({
                  value: b.id,
                  label: b.name,
                  sublabel: b.institutionName || b.bankName || 'Bank',
                  badge: formatRupee(b.balance),
                  badgeColor: 'blue' as const,
                  icon: <BankBrandBadge bankName={b.institutionName || b.bankName || b.name} size="sm" showIconOnly={true} />,
                }))}
              />
            ) : (
              <SelectField
                label="Source Cash Vault"
                value={fromCashId}
                onChange={(val) => setFromCashId(val)}
                options={activeCash.map((c) => ({
                  value: c.id,
                  label: c.name,
                  sublabel: c.location || 'Physical Cash',
                  badge: formatRupee(c.balance),
                  badgeColor: 'emerald' as const,
                  icon: <Banknote className="w-4 h-4 text-emerald-400" />,
                }))}
              />
            )}
          </div>

          {/* Destination */}
          <div>
            <SelectField
              label="Destination Cash Vault"
              value={toCashId}
              onChange={(val) => setToCashId(val)}
              options={activeCash.map((c) => ({
                value: c.id,
                label: c.name,
                sublabel: c.location || 'Physical Cash',
                badge: formatRupee(c.balance),
                badgeColor: 'emerald' as const,
                icon: <Banknote className="w-4 h-4 text-emerald-400" />,
              }))}
            />
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="font-semibold text-slate-300 block mb-1.5 font-heading">
            Transfer Amount (₹) *
          </label>
          <input
            type="number"
            required
            min="1"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500 text-base font-black"
          />

          {/* Fast Preset Chips */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5">
            {[500, 1000, 2000, 5000, 10000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset.toString())}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-amber-300 font-bold cursor-pointer active:scale-95 whitespace-nowrap"
              >
                ₹{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="font-semibold text-slate-300 block mb-1.5 font-heading">
            Reason / Transaction Remarks
          </label>
          <input
            type="text"
            placeholder={transferType === 'atm' ? 'ATM cash withdrawal for weekend' : 'Transferred pocket expense cash'}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
          />
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold cursor-pointer font-heading"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !amount}
            className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 cursor-pointer font-heading disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Processing...' : 'Confirm Cash Movement'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

/**
 * EditCreditCardModal.tsx — Edit Existing Credit Card
 * Allows editing all card properties: issuer, card name, nickname, last 4 digits,
 * credit limit, current outstanding dues, minimum amount due, payment bank account,
 * auto-pay safety toggle, billing cycle/due date, and notes.
 * Preserves each card's unique ID and history when editing.
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  CreditCard as CreditCardIcon,
  Sparkles,
  AlertCircle,
  Landmark,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { FinancialAmountInput } from '../ui/FinancialAmountInput';
import { SelectField } from '../ui/SelectionSheet';
import { BankBrandBadge } from '../brand/BankBrandBadge';
import { useFinancialData } from '../../context/FinancialDataContext';
import { CreditCardVisual } from '../financial/CreditCardVisual';
import { CreditCard } from '../../types';
import {
  CARD_VISUAL_PRESETS,
  POPULAR_ISSUERS,
  getPresetsForIssuer,
} from '../../utils/creditCardThemes';

interface EditCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCard | null;
  onSuccess?: (msg: string) => void;
}

export const EditCreditCardModal: React.FC<EditCreditCardModalProps> = ({
  isOpen,
  onClose,
  card,
  onSuccess,
}) => {
  const { updateCreditCard, creditLimitGroups, bankAccounts } = useFinancialData();

  const [selectedIssuer, setSelectedIssuer] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNickname, setCardNickname] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [cardNetwork, setCardNetwork] = useState<'visa' | 'mastercard' | 'rupay' | 'amex' | 'diners'>('visa');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryDisplay, setExpiryDisplay] = useState('');

  const [creditLimit, setCreditLimit] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');
  const [minAmountDue, setMinAmountDue] = useState('');

  const [paymentBankAccountId, setPaymentBankAccountId] = useState<string>('');
  const [autoPay, setAutoPay] = useState<boolean>(false);

  const [owner, setOwner] = useState<'SELF' | 'PARENT' | 'FAMILY' | 'OTHER'>('SELF');
  const [managedBy, setManagedBy] = useState<'ME' | 'PARENT' | 'OWNER' | 'OTHER'>('ME');
  const [includeInNetWorth, setIncludeInNetWorth] = useState(true);

  const [statementDay, setStatementDay] = useState('15');
  const [dueDateType, setDueDateType] = useState<'DAYS_AFTER_STATEMENT' | 'FIXED_DAY'>('DAYS_AFTER_STATEMENT');
  const [daysAfterStatement, setDaysAfterStatement] = useState('20');
  const [dueDay, setDueDay] = useState('5');

  const [sharedLimitGroupId, setSharedLimitGroupId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeBanks = (bankAccounts || []).filter((b) => b.status === 'active');

  useEffect(() => {
    if (card) {
      const issuer = card.issuer || card.bankName || 'SBI Card';
      setSelectedIssuer(issuer);
      setSelectedPresetId(card.cardVariant || 'custom_card');
      setCardName(card.cardName || card.displayName || card.name || '');
      setCardNickname(card.cardNickname || card.nickname || '');
      setLastFourDigits(card.lastFourDigits || '');
      setCardNetwork((card.cardNetwork as any) || 'visa');
      setCardholderName(card.cardholderName || '');
      setExpiryDisplay(card.expiryDisplay || '08/29');
      setCreditLimit(String(card.creditLimit || '100000'));
      setOutstandingBalance(String(card.outstanding !== undefined ? card.outstanding : card.outstandingBalance || 0));
      setMinAmountDue(String(card.minAmountDue !== undefined ? card.minAmountDue : card.minimumDue || 0));
      setPaymentBankAccountId(card.paymentBankAccountId || '');
      setAutoPay(card.autoPay === true || card.isAutoPayEnabled === true);
      setOwner((String(card.owner).toUpperCase() as any) || 'SELF');
      setManagedBy((String(card.managedBy || 'ME').toUpperCase() as any) || 'ME');
      setIncludeInNetWorth(card.includeInNetWorth !== false);
      setStatementDay(String(card.statementDay || card.billingCycleDate || 15));
      setDueDateType((card.dueDateType as any) || 'DAYS_AFTER_STATEMENT');
      setDaysAfterStatement(String(card.daysAfterStatement || 20));
      setDueDay(String(card.dueDay || 5));
      setSharedLimitGroupId(card.creditLimitGroupId || card.sharedLimitGroupId || '');
      setNotes(card.notes || '');
    }
  }, [card]);

  const availablePresets = getPresetsForIssuer(selectedIssuer);

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = CARD_VISUAL_PRESETS[presetId];
    if (preset) {
      setCardName(preset.cardName);
      setCardNetwork(preset.defaultNetwork as any);
    }
  };

  const handleIssuerChange = (issuer: string) => {
    setSelectedIssuer(issuer);
    const presets = getPresetsForIssuer(issuer);
    if (presets.length > 0) {
      handlePresetSelect(presets[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;

    setErrorMessage(null);
    const limit = parseFloat(creditLimit);
    const rawOut = outstandingBalance.trim();
    const outstanding = rawOut === '' || rawOut === '-' ? 0 : parseFloat(rawOut);
    const minDue = minAmountDue.trim() ? parseFloat(minAmountDue) : 0;

    if (isNaN(limit) || limit < 0) {
      setErrorMessage('Please enter a valid positive credit limit');
      return;
    }

    if (isNaN(outstanding)) {
      setErrorMessage('Please enter a valid numeric outstanding amount');
      return;
    }

    if (!cardName.trim()) {
      setErrorMessage('Card name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedGroup = creditLimitGroups.find((g) => g.id === sharedLimitGroupId);
      const linkedBank = activeBanks.find((b) => b.id === paymentBankAccountId);
      const isNegative = outstanding < 0;

      await updateCreditCard(card.id, {
        name: `${selectedIssuer} ${cardName}`,
        displayName: cardName,
        cardNickname: cardNickname.trim() || undefined,
        nickname: cardNickname.trim() || undefined,
        issuer: selectedIssuer,
        bankName: selectedIssuer,
        cardName,
        cardVariant: selectedPresetId,
        lastFourDigits: lastFourDigits.slice(-4) || '0000',
        maskedCardNumber: `•••• •••• •••• ${lastFourDigits.slice(-4) || '0000'}`,
        cardNetwork,
        cardholderName: cardholderName.trim() || undefined,
        expiryDisplay: expiryDisplay.trim() || undefined,
        creditLimit: limit,
        outstanding: outstanding,
        outstandingBalance: outstanding,
        minAmountDue: isNaN(minDue) ? 0 : minDue,
        minimumDue: isNaN(minDue) ? 0 : minDue,
        availableLimit: isNegative ? limit + Math.abs(outstanding) : Math.max(0, limit - outstanding),
        utilizationPercentage: limit > 0 && !isNegative ? Math.round((outstanding / limit) * 1000) / 10 : 0,
        paymentBankAccountId: paymentBankAccountId || undefined,
        paymentBankName: linkedBank?.displayName || linkedBank?.institutionName || undefined,
        autoPay,
        isAutoPayEnabled: autoPay,
        owner,
        managedBy,
        financialResponsibility: managedBy === 'ME' ? 'Self' : 'Parent',
        iPayThisCard: managedBy === 'ME',
        includeInNetWorth,
        statementDay: parseInt(statementDay, 10) || 15,
        billingCycleDate: parseInt(statementDay, 10) || 15,
        dueDateType,
        daysAfterStatement: parseInt(daysAfterStatement, 10) || 20,
        dueDay: parseInt(dueDay, 10) || 5,
        sharedLimitGroupId: sharedLimitGroupId || undefined,
        creditLimitGroupId: sharedLimitGroupId || undefined,
        sharedLimitGroupName: selectedGroup?.name,
        notes: notes.trim() || undefined,
      });

      onSuccess?.(`✓ Updated Credit Card: ${selectedIssuer} ${cardName}`);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update card');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!card) return null;

  const previewCard = {
    issuer: selectedIssuer,
    cardName: cardName || 'Credit Card',
    cardNickname: cardNickname || undefined,
    lastFourDigits,
    cardNetwork,
    cardholderName: cardholderName || (owner === 'PARENT' ? "PARENT'S CARD" : 'CARDHOLDER'),
    expiryDisplay,
    cardVariant: selectedPresetId,
    owner,
  };

  const selectedBank = activeBanks.find((b) => b.id === paymentBankAccountId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Credit Card"
      subtitle="Update card info, limits, due dates & auto-pay safety link"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Card Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-heading block">
              Card Preview
            </span>
            {cardNickname && (
              <span className="text-[10px] text-cyan-400 font-medium px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/50">
                🏷️ {cardNickname}
              </span>
            )}
          </div>
          <div className="max-w-sm mx-auto">
            <CreditCardVisual card={previewCard} size="md" />
          </div>
        </div>

        {/* Issuer and Preset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <SelectField
              label="Bank Issuer"
              required
              value={selectedIssuer}
              onChange={(val) => handleIssuerChange(val)}
              showSearch={true}
              searchPlaceholder="Search issuer..."
              options={POPULAR_ISSUERS.map((issuer) => ({
                value: issuer,
                label: issuer,
                icon: <BankBrandBadge bankName={issuer} size="sm" showIconOnly={true} />,
              }))}
            />
          </div>

          <div>
            <SelectField
              label="Card Variant Preset"
              required
              value={selectedPresetId}
              onChange={(val) => handlePresetSelect(val)}
              showSearch={true}
              options={[
                ...availablePresets.map((p) => ({
                  value: p.id,
                  label: p.cardName,
                  sublabel: p.category.toUpperCase(),
                  badge: (p.defaultNetwork || 'card').toUpperCase(),
                  badgeColor: 'cyan' as const,
                  icon: <CreditCardIcon className="w-4 h-4 text-cyan-400" />,
                })),
                {
                  value: 'custom_card',
                  label: 'Custom / Other Design',
                  sublabel: 'Custom visual style',
                  icon: <Sparkles className="w-4 h-4 text-amber-400" />,
                },
              ]}
            />
          </div>
        </div>

        {/* Card Name and Nickname */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Card Name / Variant *</label>
            <input
              type="text"
              required
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-medium"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Card Nickname <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Primary Spends, Travel Card"
              value={cardNickname}
              onChange={(e) => setCardNickname(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Last 4 Digits & Network & Expiry */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Last 4 Digits *</label>
            <input
              type="text"
              maxLength={4}
              value={lastFourDigits}
              onChange={(e) => setLastFourDigits(e.target.value.replace(/\D/g, ''))}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <SelectField
              label="Card Network"
              value={cardNetwork}
              onChange={(val) => setCardNetwork(val as any)}
              options={[
                { value: 'visa', label: 'Visa', badge: 'VISA', badgeColor: 'blue' },
                { value: 'mastercard', label: 'Mastercard', badge: 'MC', badgeColor: 'rose' },
                { value: 'rupay', label: 'RuPay', badge: 'RUPAY', badgeColor: 'emerald' },
                { value: 'amex', label: 'Amex', badge: 'AMEX', badgeColor: 'cyan' },
                { value: 'diners', label: 'Diners Club', badge: 'DINERS', badgeColor: 'purple' },
              ]}
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Cardholder Name</label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 uppercase"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Expiry (MM/YY)</label>
            <input
              type="text"
              maxLength={5}
              value={expiryDisplay}
              onChange={(e) => setExpiryDisplay(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Limit, Outstanding & Min Amount Due */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Credit Limit (₹) *</label>
            <input
              type="number"
              required
              min="0"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">Current Outstanding (₹)</label>
              <span className="text-[10px] text-cyan-400">Can be negative</span>
            </div>
            <FinancialAmountInput
              id="input-edit-card-outstanding"
              value={outstandingBalance}
              onChange={setOutstandingBalance}
              allowNegative={true}
              currencySymbol={null}
              placeholder="0"
              inputClassName="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Min Amount Due (MAD ₹)</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={minAmountDue}
              onChange={(e) => setMinAmountDue(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* PAYMENT SAFETY: Payment Bank Account & Auto-Pay Toggle */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-cyan-900/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-200 font-heading">Payment Safety & Auto-Pay</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-300">Auto-Pay</span>
              <button
                type="button"
                onClick={() => setAutoPay(!autoPay)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                  autoPay ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <SelectField
              label="Payment Bank Account"
              value={paymentBankAccountId}
              onChange={(val) => setPaymentBankAccountId(val)}
              options={[
                { value: '', label: 'None / Manual Settlement', sublabel: 'No automated balance verification' },
                ...activeBanks.map((b) => ({
                  value: b.id,
                  label: b.displayName || b.name,
                  sublabel: `${b.institutionName || 'Bank'} • ${b.accountNumberMasked || `•••• ${b.last4 || ''}`} • Bal: ₹${(b.balance || 0).toLocaleString('en-IN')}`,
                  badge: (b.balance || 0) < 0 ? 'Overdraft' : 'Available',
                  badgeColor: (b.balance || 0) >= 0 ? 'emerald' : 'rose',
                  icon: <BankBrandBadge bankName={b.institutionName || b.bankName || b.name} size="sm" showIconOnly={true} />,
                })),
              ]}
            />
          </div>

          {selectedBank && (
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <Landmark className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300">
                  {selectedBank.displayName || selectedBank.name} Balance:
                </span>
              </div>
              <span className={`font-mono font-bold ${(selectedBank.balance || 0) >= parseFloat(outstandingBalance || '0') ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{(selectedBank.balance || 0).toLocaleString('en-IN')}
                {(selectedBank.balance || 0) < parseFloat(outstandingBalance || '0') && autoPay && (
                  <span className="ml-1 text-[10px] text-rose-400 font-normal">
                    (Shortfall ₹{(parseFloat(outstandingBalance || '0') - (selectedBank.balance || 0)).toLocaleString('en-IN')})
                  </span>
                )}
              </span>
            </div>
          )}

          <p className="text-[10px] text-slate-400 leading-relaxed">
            {autoPay
              ? '🟢 Auto-Pay is active. Afinity monitors your bank balance before each due date and alerts you of shortfalls.'
              : '⚪ Manual Settlement. Auto-pay safety checks are disabled for this card.'}
          </p>
        </div>

        {/* Ownership & Payment Responsibility */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <SelectField
              label="Card Owner"
              required
              value={owner}
              onChange={(val) => setOwner(val as any)}
              options={[
                { value: 'SELF', label: 'Self (My Card)', sublabel: 'Personal primary card', badge: 'ME', badgeColor: 'emerald' },
                { value: 'PARENT', label: 'Parent (Father / Mother)', sublabel: 'Family dependent card', badge: 'PARENT', badgeColor: 'blue' },
                { value: 'FAMILY', label: 'Family Member / Spouse', sublabel: 'Add-on / Joint holder', badge: 'FAMILY', badgeColor: 'purple' },
                { value: 'OTHER', label: 'Other / Corporate', sublabel: 'Business or other holder', badge: 'OTHER', badgeColor: 'slate' },
              ]}
            />
          </div>

          <div>
            <SelectField
              label="Paid / Managed By"
              required
              value={managedBy}
              onChange={(val) => setManagedBy(val as any)}
              options={[
                { value: 'ME', label: 'I Pay / Manage This Card', sublabel: 'Included in my monthly dues', badge: 'I PAY', badgeColor: 'emerald' },
                { value: 'PARENT', label: 'Parent Pays Directly', sublabel: 'Direct settlement by parent', badge: 'PARENT', badgeColor: 'blue' },
                { value: 'OWNER', label: 'Cardholder Pays Directly', sublabel: 'Settled by primary owner', badge: 'OWNER', badgeColor: 'slate' },
              ]}
            />
          </div>
        </div>

        {/* Statement Day and Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Statement Day (1–31)</label>
            <input
              type="number"
              min="1"
              max="31"
              value={statementDay}
              onChange={(e) => setStatementDay(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <SelectField
              label="Due Date Calculation"
              value={dueDateType}
              onChange={(val) => setDueDateType(val as any)}
              options={[
                { value: 'DAYS_AFTER_STATEMENT', label: '20 Days After Statement', sublabel: 'Standard RBI grace window', badge: 'Dynamic', badgeColor: 'cyan' },
                { value: 'FIXED_DAY', label: 'Fixed Day of Month', sublabel: 'Explicit payment calendar date', badge: 'Fixed', badgeColor: 'amber' },
              ]}
            />
          </div>
        </div>

        {/* Shared Limit Group */}
        {creditLimitGroups.length > 0 && (
          <div>
            <SelectField
              label="Shared Limit Pool (Optional)"
              value={sharedLimitGroupId}
              onChange={(val) => setSharedLimitGroupId(val)}
              options={[
                { value: '', label: 'Standalone Card', sublabel: 'Has independent credit limit' },
                ...creditLimitGroups.map((g) => ({
                  value: g.id,
                  label: g.name,
                  sublabel: `Shared Limit: ₹${(g.totalLimit || g.sharedLimit || 0).toLocaleString('en-IN')}`,
                  badge: 'Shared',
                  badgeColor: 'purple' as const,
                })),
              ]}
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-slate-300 font-semibold block mb-1">
            Notes / Card Description <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="e.g. 5% cashback card, auto-pay linked to HDFC salary account"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 resize-none"
          />
        </div>

        {/* Net Worth Checkbox */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <input
            type="checkbox"
            id="includeInNetWorth-edit"
            checked={includeInNetWorth}
            onChange={(e) => setIncludeInNetWorth(e.target.checked)}
            className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 h-4 w-4"
          />
          <label htmlFor="includeInNetWorth-edit" className="text-slate-300 text-xs select-none cursor-pointer">
            Include outstanding liability in Net Worth calculation
          </label>
        </div>

        {/* Actions (sticky footer) */}
        <div className="sticky -bottom-2 bg-[#0f182d]/95 backdrop-blur-md pt-3 pb-1 mt-3 border-t border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Updating...' : '✓ Update Credit Card'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </Modal>
  );
};

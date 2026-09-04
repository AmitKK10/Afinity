/**
 * ManageSharedGroupModal.tsx — Create & Edit Shared Credit Limit Groups (Step 6B)
 */

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Check, Trash2, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { SelectField } from '../ui/SelectionSheet';
import { BankBrandBadge } from '../brand/BankBrandBadge';
import { useFinancialData } from '../../context/FinancialDataContext';
import { CreditLimitGroup, CreditCard } from '../../types';
import { POPULAR_ISSUERS } from '../../utils/creditCardThemes';

interface ManageSharedGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupToEdit?: CreditLimitGroup | null;
  onSuccess?: (msg: string) => void;
}

export const ManageSharedGroupModal: React.FC<ManageSharedGroupModalProps> = ({
  isOpen,
  onClose,
  groupToEdit,
  onSuccess,
}) => {
  const { creditLimitGroups, creditCards, addCreditLimitGroup, updateCreditLimitGroup, deleteCreditLimitGroup } =
    useFinancialData();

  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('ICICI Bank');
  const [totalLimit, setTotalLimit] = useState('250000');
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (groupToEdit) {
      setName(groupToEdit.name || '');
      setIssuer(groupToEdit.issuer || groupToEdit.bankName || 'ICICI Bank');
      setTotalLimit(String(groupToEdit.totalLimit || groupToEdit.sharedLimit || 250000));
      setSelectedCardIds(groupToEdit.cardIds || []);
      setNotes(groupToEdit.notes || '');
    } else {
      setName('ICICI Merged Limit Pool');
      setIssuer('ICICI Bank');
      setTotalLimit('250000');
      setSelectedCardIds([]);
      setNotes('');
    }
    setErrorMessage(null);
  }, [groupToEdit, isOpen]);

  const activeCards = creditCards.filter((c) => c.status === 'active');

  const toggleCard = (cardId: string) => {
    if (selectedCardIds.includes(cardId)) {
      setSelectedCardIds(selectedCardIds.filter((id) => id !== cardId));
    } else {
      setSelectedCardIds([...selectedCardIds, cardId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const limit = parseFloat(totalLimit);
    if (isNaN(limit) || limit <= 0) {
      setErrorMessage('Please enter a valid positive merged credit limit');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Group name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (groupToEdit) {
        await updateCreditLimitGroup(groupToEdit.id, {
          name: name.trim(),
          issuer: issuer.trim(),
          bankName: issuer.trim(),
          totalLimit: limit,
          sharedLimit: limit,
          cardIds: selectedCardIds,
          notes: notes.trim() || undefined,
        });
        onSuccess?.(`✓ Updated Shared Pool: ${name}`);
      } else {
        await addCreditLimitGroup({
          name: name.trim(),
          issuer: issuer.trim(),
          bankName: issuer.trim(),
          totalLimit: limit,
          sharedLimit: limit,
          cardIds: selectedCardIds,
          notes: notes.trim() || undefined,
          status: 'active',
        });
        onSuccess?.(`✓ Created Shared Pool: ${name}`);
      }

      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!groupToEdit) return;
    if (window.confirm(`Are you sure you want to remove the shared limit group "${groupToEdit.name}"? Cards will become standalone limits.`)) {
      try {
        await deleteCreditLimitGroup(groupToEdit.id);
        onSuccess?.(`Removed shared limit pool "${groupToEdit.name}"`);
        onClose();
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to delete pool');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={groupToEdit ? 'Edit Shared Limit Pool' : 'Create Shared Limit Pool'}
      subtitle="Group cards that share a combined credit limit from the same bank"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 font-medium">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Pool Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. ICICI Merged Limit Pool"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <SelectField
              label="Bank Issuer *"
              value={issuer}
              onChange={(val) => setIssuer(val)}
              showSearch={true}
              searchPlaceholder="Search bank issuer..."
              options={POPULAR_ISSUERS.map((iss) => ({
                value: iss,
                label: iss,
                icon: <BankBrandBadge bankName={iss} size="sm" showIconOnly={true} />,
              }))}
            />
          </div>
        </div>

        <div>
          <label className="text-slate-300 font-semibold block mb-1">Merged Total Credit Limit (₹) *</label>
          <input
            type="number"
            required
            min="0"
            placeholder="250000"
            value={totalLimit}
            onChange={(e) => setTotalLimit(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Member Cards Assignment */}
        <div className="space-y-2">
          <label className="text-slate-300 font-semibold block">Select Cards Sharing This Limit</label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {activeCards.length === 0 ? (
              <p className="text-slate-500 italic">No active cards to assign.</p>
            ) : (
              activeCards.map((card) => {
                const isSelected = selectedCardIds.includes(card.id);
                return (
                  <div
                    key={card.id}
                    onClick={() => toggleCard(card.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-slate-200 block">
                        {card.displayName || card.cardName || card.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        •••• {card.lastFourDigits} • {card.issuer || card.bankName}
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                        isSelected
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                          : 'border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-slate-300 font-semibold block mb-1">Notes (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Shared across ICICI Sapphiro and Amazon Pay ICICI"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {groupToEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 cursor-pointer font-bold transition-all"
              title="Delete Shared Pool"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-95 text-white font-bold text-xs shadow-xl shadow-cyan-950/40 flex items-center justify-center gap-2 cursor-pointer font-heading"
          >
            <span>{isSubmitting ? 'Saving Pool...' : groupToEdit ? 'Save Changes' : 'Create Pool'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </Modal>
  );
};

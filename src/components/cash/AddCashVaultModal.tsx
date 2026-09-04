import React, { useState } from 'react';
import { Banknote, Plus, MapPin, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useFinancialData } from '../../context/FinancialDataContext';
import { formatRupee } from '../../utils/formatters';

interface AddCashVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export const AddCashVaultModal: React.FC<AddCashVaultModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addCashHolding } = useFinancialData();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startingBalance, setStartingBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const balanceNum = parseFloat(startingBalance) || 0;
      await addCashHolding({
        name: name.trim(),
        displayName: name.trim(),
        category: 'cash',
        balance: balanceNum,
        currency: 'INR',
        status: 'active',
        location: location.trim() || 'Physical Cash Storage',
        notes: notes.trim() || undefined,
        denominations: [
          { denomination: 500, count: Math.floor(balanceNum / 500) },
          { denomination: 100, count: Math.floor((balanceNum % 500) / 100) },
        ],
      });

      onSuccess?.(`✓ Created new Cash Vault: ${name}`);
      setName('');
      setLocation('');
      setStartingBalance('');
      setNotes('');
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
      title="Create New Cash Vault"
      subtitle="Track physical cash kept in a distinct physical location or wallet"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-200">
        <div>
          <label className="font-semibold text-slate-300 block mb-1.5 font-heading">
            Vault / Pocket Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Office Desk Locker, Travel Cash Pouch"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-300 block mb-1.5 font-heading">
            Physical Storage Location
          </label>
          <input
            type="text"
            placeholder="e.g. Master Bedroom Wardrobe, Car Glove Compartment"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-300 block mb-1.5 font-heading">
            Initial Cash Balance (₹)
          </label>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm font-bold"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            You can recount specific note denominations at any time after creation.
          </span>
        </div>

        <div>
          <label className="font-semibold text-slate-300 block mb-1.5 font-heading">
            Notes / Remarks (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Reserved for emergency household expenses"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
            disabled={isSubmitting || !name.trim()}
            className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 cursor-pointer font-heading disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Creating...' : 'Create Cash Vault'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

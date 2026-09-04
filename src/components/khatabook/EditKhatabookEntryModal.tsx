import React, { useState, useEffect } from 'react';
import { Edit2, ArrowRight, ShieldCheck, Calendar, Phone, User, Info } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useFinancialData } from '../../context/FinancialDataContext';
import { KhatabookEntry } from '../../types';
import { formatRupee } from '../../utils/formatters';
import {
  getKhatabookOriginalAmount,
  getKhatabookPaidAmount,
  getKhatabookRemainingAmount,
  getKhatabookStatus,
} from '../../services/calculations';

interface EditKhatabookEntryModalProps {
  isOpen: boolean;
  entry: KhatabookEntry | null;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const EditKhatabookEntryModal: React.FC<EditKhatabookEntryModalProps> = ({
  isOpen,
  entry,
  onClose,
  onSuccess,
}) => {
  const { updateKhatabookEntry } = useFinancialData();

  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [includeInNetWorth, setIncludeInNetWorth] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (entry && isOpen) {
      const orig = getKhatabookOriginalAmount(entry);
      setPersonName(entry.personName || '');
      setAmount(orig ? orig.toString() : '');
      setPhone(entry.phone || entry.contactNumber || '');
      setDate(entry.date || (entry.createdAt ? entry.createdAt.split('T')[0] : ''));
      setDueDate(entry.dueDate || '');
      setNotes(entry.notes || entry.reason || '');
      setIncludeInNetWorth(entry.includeInNetWorth !== false);
      setErrorMessage(null);
    }
  }, [entry, isOpen]);

  if (!entry) return null;

  const currentPaid = getKhatabookPaidAmount(entry);
  const currentRemaining = getKhatabookRemainingAmount(entry);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = personName.trim();
    if (!trimmedName) {
      setErrorMessage('Person name is required');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid positive original amount');
      return;
    }

    if (parsedAmount < currentPaid) {
      setErrorMessage(
        `Original amount cannot be lower than ₹${formatRupee(currentPaid, { includeSymbol: false })} which was already settled.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const newRemaining = Math.max(0, parsedAmount - currentPaid);
      const newStatus =
        newRemaining === 0
          ? 'PAID'
          : currentPaid > 0
          ? 'PARTIALLY_PAID'
          : 'OPEN';

      await updateKhatabookEntry(entry.id, {
        name: trimmedName,
        displayName: trimmedName,
        personName: trimmedName,
        originalAmount: parsedAmount,
        remainingAmount: newRemaining,
        amount: newRemaining,
        phone: phone.trim() || undefined,
        contactNumber: phone.trim() || undefined,
        date: date || undefined,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
        reason: notes.trim() || undefined,
        includeInNetWorth,
        status: newStatus,
        isSettled: newRemaining === 0,
      });

      onSuccess?.(`✓ Updated record for ${trimmedName}`);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Due / Receivable Record"
      subtitle={`Updating record for ${entry.personName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Existing Settlement Info Callout */}
        {currentPaid > 0 && (
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/50 text-blue-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Settlement History Protected:</strong> ₹{formatRupee(currentPaid)} has already been settled. Changing the original amount will safely adjust remaining balance to (New Original - ₹{formatRupee(currentPaid)}).
            </div>
          </div>
        )}

        {/* Person Name */}
        <div>
          <label className="text-slate-300 font-semibold block mb-1">
            Person / Entity Name <span className="text-cyan-400">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              id="edit-khatabook-person-input"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>
        </div>

        {/* Original Amount & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Original Amount (₹) <span className="text-cyan-400">*</span>
            </label>
            <input
              type="number"
              required
              min={currentPaid > 0 ? currentPaid : 1}
              step="any"
              id="edit-khatabook-amount-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Contact Phone <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                id="edit-khatabook-phone-input"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Entry Date & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Transaction Date
            </label>
            <input
              type="date"
              id="edit-khatabook-date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Expected Due Date <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="date"
              id="edit-khatabook-duedate-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-slate-300 font-semibold block mb-1">
            Notes / Reason <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            id="edit-khatabook-notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Net Worth Toggle */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Include in Net Worth</span>
            </div>
            <p className="text-[11px] text-slate-400">
              When enabled, active remaining balance counts toward net worth.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="edit-khatabook-include-networth-checkbox"
              checked={includeInNetWorth}
              onChange={(e) => setIncludeInNetWorth(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="edit-khatabook-submit-btn"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer font-heading mt-2 active:scale-98 transition-all"
        >
          <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </Modal>
  );
};

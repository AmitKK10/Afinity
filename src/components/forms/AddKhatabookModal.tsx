import React, { useState } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useFinancialData } from '../../context/FinancialDataContext';
import { KhatabookType } from '../../types';
import { cn } from '../../utils/cn';

interface AddKhatabookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const AddKhatabookModal: React.FC<AddKhatabookModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addKhatabookEntry } = useFinancialData();

  const [personName, setPersonName] = useState('');
  const [type, setType] = useState<KhatabookType>('receivable');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid positive amount');
      return;
    }

    if (!personName.trim()) {
      setErrorMessage('Person or entity name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await addKhatabookEntry({
        name: personName.trim(),
        displayName: personName.trim(),
        personName: personName.trim(),
        type,
        amount: parsedAmount,
        reason: reason.trim() || undefined,
        contactNumber: contactNumber.trim() || undefined,
        dueDate: dueDate || undefined,
        status: 'active',
        isSettled: false,
      });

      onSuccess?.(`✓ Added record for ${personName}`);
      setPersonName('');
      setAmount('');
      setReason('');
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Due / Receivable Record"
      subtitle="Track personal lendings, friend splits, and upcoming payables"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Type selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setType('receivable')}
            className={cn(
              'py-2 px-3 rounded-lg font-bold transition-all cursor-pointer font-heading',
              type === 'receivable'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            + You will Receive
          </button>
          <button
            type="button"
            onClick={() => setType('payable')}
            className={cn(
              'py-2 px-3 rounded-lg font-bold transition-all cursor-pointer font-heading',
              type === 'payable'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            - You Owe / Give
          </button>
        </div>

        <div>
          <label className="text-slate-300 font-semibold block mb-1">Person or Entity Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Rohit Sharma, Society Maintenance"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Amount (₹) *</label>
            <input
              type="number"
              required
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Expected Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-300 font-semibold block mb-1">Reason / Notes</label>
          <input
            type="text"
            placeholder="e.g. Goa trip flight bookings share"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer font-heading mt-2"
        >
          <span>{isSubmitting ? 'Saving...' : '+ Add Record'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </Modal>
  );
};

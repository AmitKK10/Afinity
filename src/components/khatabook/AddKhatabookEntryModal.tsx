import React, { useState } from 'react';
import { BookOpen, ArrowRight, ArrowDownLeft, ArrowUpRight, ShieldCheck, Calendar, Phone, User, FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useFinancialData } from '../../context/FinancialDataContext';
import { KhatabookType } from '../../types';
import { cn } from '../../utils/cn';

interface AddKhatabookEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
  initialPersonName?: string;
  initialType?: KhatabookType;
}

export const AddKhatabookEntryModal: React.FC<AddKhatabookEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPersonName = '',
  initialType = 'receivable',
}) => {
  const { addKhatabookEntry, khatabookEntries } = useFinancialData();

  const [personName, setPersonName] = useState(initialPersonName);
  const [entryType, setEntryType] = useState<KhatabookType>(initialType);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [includeInNetWorth, setIncludeInNetWorth] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial props when opened
  React.useEffect(() => {
    if (isOpen) {
      if (initialPersonName) setPersonName(initialPersonName);
      if (initialType) setEntryType(initialType);
      setErrorMessage(null);
    }
  }, [isOpen, initialPersonName, initialType]);

  // Unique list of existing person names for auto-suggestions
  const existingNames = React.useMemo(() => {
    const set = new Set<string>();
    khatabookEntries.forEach((e) => {
      if (e.personName) set.add(e.personName.trim());
    });
    return Array.from(set);
  }, [khatabookEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = personName.trim();
    if (!trimmedName) {
      setErrorMessage('Person or entity name is required');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid positive amount (greater than ₹0)');
      return;
    }

    setIsSubmitting(true);
    try {
      await addKhatabookEntry({
        name: trimmedName,
        displayName: trimmedName,
        personName: trimmedName,
        entryType: entryType.toUpperCase() as KhatabookType,
        type: entryType.toLowerCase() as KhatabookType,
        originalAmount: parsedAmount,
        paidAmount: 0,
        remainingAmount: parsedAmount,
        amount: parsedAmount,
        date: date || new Date().toISOString().split('T')[0],
        dueDate: dueDate || undefined,
        phone: phone.trim() || undefined,
        contactNumber: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        reason: notes.trim() || undefined,
        includeInNetWorth,
        status: 'OPEN',
        isSettled: false,
      });

      const typeLabel = entryType.toLowerCase() === 'receivable' ? 'Receivable' : 'Payable';
      onSuccess?.(`✓ Added ₹${parsedAmount.toLocaleString('en-IN')} ${typeLabel} with ${trimmedName}`);
      
      // Reset form
      setPersonName('');
      setAmount('');
      setDueDate('');
      setPhone('');
      setNotes('');
      setIncludeInNetWorth(true);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create record');
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
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 font-medium">
            {errorMessage}
          </div>
        )}

        {/* 1. Entry Type Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            id="add-entry-type-receivable"
            onClick={() => setEntryType('receivable')}
            className={cn(
              'py-2.5 px-3 rounded-lg font-bold transition-all cursor-pointer font-heading flex items-center justify-center gap-1.5',
              entryType.toLowerCase() === 'receivable'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <ArrowDownLeft className="w-4 h-4 text-cyan-400" />
            <span>+ You Will Receive</span>
          </button>
          <button
            type="button"
            id="add-entry-type-payable"
            onClick={() => setEntryType('payable')}
            className={cn(
              'py-2.5 px-3 rounded-lg font-bold transition-all cursor-pointer font-heading flex items-center justify-center gap-1.5',
              entryType.toLowerCase() === 'payable'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
            <span>- You Owe / Give</span>
          </button>
        </div>

        {/* 2. Person Name with Auto-Suggest */}
        <div>
          <label className="text-slate-300 font-semibold block mb-1">
            Person / Entity Name <span className="text-cyan-400">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              id="khatabook-person-name-input"
              list="khatabook-person-suggestions"
              placeholder="e.g. Rahul Sharma, Society Office, Amit"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
            />
            <datalist id="khatabook-person-suggestions">
              {existingNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
        </div>

        {/* 3. Amount & Phone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Amount (₹) <span className="text-cyan-400">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              step="any"
              id="khatabook-amount-input"
              placeholder="e.g. 5000"
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
                id="khatabook-phone-input"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* 4. Entry Date & Due Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Transaction Date
            </label>
            <input
              type="date"
              id="khatabook-entry-date-input"
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
              id="khatabook-due-date-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* 5. Notes / Reason */}
        <div>
          <label className="text-slate-300 font-semibold block mb-1">
            Notes / Reason <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            id="khatabook-notes-input"
            placeholder="e.g. Goa trip flight booking split, Dinner bill"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* 6. Net Worth Inclusion Toggle */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Include in Net Worth</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {entryType.toLowerCase() === 'receivable'
                ? 'Adds to total liquid assets until settled'
                : 'Subtracts from total liquid net worth as a liability'}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="khatabook-include-networth-checkbox"
              checked={includeInNetWorth}
              onChange={(e) => setIncludeInNetWorth(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="khatabook-submit-add-btn"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer font-heading mt-2 active:scale-98 transition-all"
        >
          <span>{isSubmitting ? 'Saving...' : '+ Add Record'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </Modal>
  );
};

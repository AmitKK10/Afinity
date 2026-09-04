import React, { useState, useEffect } from 'react';
import { Layers, ArrowRight, Building2, Lock, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { SelectField } from '../ui/SelectionSheet';
import { IPOApplication } from '../../types';
import { formatRupee } from '../../utils/formatters';

interface AddIPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<any>;
  initialData?: IPOApplication | null;
  onSuccess?: (msg: string) => void;
}

export const AddIPOModal: React.FC<AddIPOModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  onSuccess,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [lotsApplied, setLotsApplied] = useState('1');
  const [sharesPerLot, setSharesPerLot] = useState('14');
  const [bidPrice, setBidPrice] = useState('1050');
  const [bankUsed, setBankUsed] = useState('HDFC Bank');
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().slice(0, 10));
  const [allotmentDate, setAllotmentDate] = useState('');
  const [listingDate, setListingDate] = useState('');
  const [ipoStatus, setIpoStatus] = useState<'applied' | 'allotted' | 'refunded' | 'cancelled'>('applied');
  const [applicationNumber, setApplicationNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.companyName || initialData.name || '');
      setSymbol(initialData.symbol || '');
      setLotsApplied((initialData.lotsApplied || 1).toString());
      setSharesPerLot((initialData.sharesPerLot || 14).toString());
      setBidPrice((initialData.bidPrice || 1000).toString());
      setBankUsed(initialData.bankUsed || 'HDFC Bank');
      setApplicationDate(initialData.applicationDate || new Date().toISOString().slice(0, 10));
      setAllotmentDate(initialData.allotmentDate || '');
      setListingDate(initialData.listingDate || '');
      setIpoStatus((initialData.ipoStatus as any) || 'applied');
      setApplicationNumber(initialData.applicationNumber || '');
      setError(null);
    } else {
      setCompanyName('');
      setSymbol('');
      setLotsApplied('1');
      setSharesPerLot('14');
      setBidPrice('1050');
      setBankUsed('HDFC Bank');
      setApplicationDate(new Date().toISOString().slice(0, 10));
      setAllotmentDate('');
      setListingDate('');
      setIpoStatus('applied');
      setApplicationNumber('');
      setError(null);
    }
  }, [initialData, isOpen]);

  const parsedLots = parseInt(lotsApplied, 10) || 1;
  const parsedSharesPerLot = parseInt(sharesPerLot, 10) || 1;
  const parsedBidPrice = parseFloat(bidPrice) || 0;
  const totalShares = parsedLots * parsedSharesPerLot;
  const blockedAmount = Math.round(totalShares * parsedBidPrice * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }
    if (blockedAmount <= 0) {
      setError('Please enter valid lots, shares per lot, and bid price');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        companyName: companyName.trim(),
        name: companyName.trim(),
        symbol: symbol.toUpperCase().trim() || undefined,
        lotsApplied: parsedLots,
        sharesPerLot: parsedSharesPerLot,
        bidPrice: parsedBidPrice,
        applicationAmount: blockedAmount,
        blockedAmount,
        bankUsed,
        applicationDate,
        allotmentDate: allotmentDate || undefined,
        listingDate: listingDate || undefined,
        ipoStatus,
        status: 'active',
        applicationNumber: applicationNumber.trim() || undefined,
        notes: `ASBA bid via ${bankUsed}`,
      });

      onSuccess?.(`✓ Recorded IPO application: ${companyName}`);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save IPO');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit IPO Application' : 'Track New IPO Bid'}
      subtitle="Record ASBA IPO applications and monitor blocked bank capital"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-slate-300 font-semibold block mb-1">Company / Issue Name *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Swiggy Limited or Bajaj Housing"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Ticker / Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g. SWIGGY"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Lots Applied *</label>
            <input
              type="number"
              min="1"
              required
              value={lotsApplied}
              onChange={(e) => setLotsApplied(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Shares Per Lot *</label>
            <input
              type="number"
              min="1"
              required
              value={sharesPerLot}
              onChange={(e) => setSharesPerLot(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Cut-off / Bid Price (₹) *</label>
            <input
              type="number"
              step="any"
              min="1"
              required
              value={bidPrice}
              onChange={(e) => setBidPrice(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Live Blocked Amount Preview */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0c1f30] to-[#07111b] border border-cyan-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">Blocked ASBA Capital</span>
            <span className="text-base font-bold font-mono text-cyan-300">
              {formatRupee(blockedAmount)}
            </span>
          </div>
          <div className="text-right text-[11px] text-slate-400">
            <span>{totalShares} total shares</span>
            <span className="block text-slate-300 font-semibold">Held via {bankUsed}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <SelectField
              label="Bank Used for ASBA"
              value={bankUsed}
              onChange={(val) => setBankUsed(val)}
              options={[
                { value: 'HDFC Bank', label: 'HDFC Bank', badge: 'HDFC', badgeColor: 'blue' },
                { value: 'ICICI Bank', label: 'ICICI Bank', badge: 'ICICI', badgeColor: 'amber' },
                { value: 'State Bank of India', label: 'State Bank of India', badge: 'SBI', badgeColor: 'blue' },
                { value: 'Axis Bank', label: 'Axis Bank', badge: 'Axis', badgeColor: 'purple' },
                { value: 'Kotak Mahindra', label: 'Kotak Mahindra Bank', badge: 'Kotak', badgeColor: 'rose' },
                { value: 'Other Bank', label: 'Other Bank' },
              ]}
              triggerClassName="p-2.5 rounded-xl bg-slate-900 border-slate-700 text-xs"
            />
          </div>

          <div>
            <SelectField
              label="Application Status"
              value={ipoStatus}
              onChange={(val) => setIpoStatus(val as any)}
              options={[
                { value: 'applied', label: 'Applied (Funds Blocked)', sublabel: 'ASBA blocked in bank', badge: 'Applied', badgeColor: 'amber' },
                { value: 'allotted', label: 'Allotted (Shares Received)', sublabel: 'Credited to demat', badge: 'Allotted', badgeColor: 'emerald' },
                { value: 'refunded', label: 'Refunded / Unblocked', sublabel: 'Amount released', badge: 'Refunded', badgeColor: 'slate' },
                { value: 'cancelled', label: 'Cancelled', sublabel: 'Application revoked', badge: 'Cancelled', badgeColor: 'rose' },
              ]}
              triggerClassName="p-2.5 rounded-xl bg-slate-900 border-slate-700 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Applied Date</label>
            <input
              type="date"
              value={applicationDate}
              onChange={(e) => setApplicationDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Allotment Date</label>
            <input
              type="date"
              value={allotmentDate}
              onChange={(e) => setAllotmentDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Listing Date</label>
            <input
              type="date"
              value={listingDate}
              onChange={(e) => setListingDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer font-heading mt-2"
        >
          <Building2 className="w-4 h-4" />
          <span>{isSubmitting ? 'Saving...' : initialData ? 'Update IPO Application' : '+ Record IPO Application'}</span>
        </button>
      </form>
    </Modal>
  );
};

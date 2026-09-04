import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  Check,
  Building2,
  Plus,
  Sparkles,
  LayoutGrid,
  List,
  ShieldCheck,
  Globe2,
  Landmark,
  Zap,
} from 'lucide-react';
import { BankBrandBadge } from '../brand/BankBrandBadge';
import { getBankBrandTheme, BankBrandTheme } from '../../utils/bankThemes';
import { cn } from '../../utils/cn';

export interface BankOption {
  id: string;
  name: string;
  short: string;
  category: 'popular' | 'private' | 'psu' | 'sfb_neo' | 'foreign';
  defaultIfsc?: string;
  theme?: string;
  badgeBg?: string;
  isPopular?: boolean;
}

export const BANK_DIRECTORY: BankOption[] = [
  // Top Popular Indian Banks
  { id: 'hdfc', name: 'HDFC Bank', short: 'HDFC', category: 'popular', defaultIfsc: 'HDFC0000001', theme: 'hdfc', isPopular: true },
  { id: 'sbi', name: 'State Bank of India', short: 'SBI', category: 'popular', defaultIfsc: 'SBIN0000001', theme: 'sbi', isPopular: true },
  { id: 'icici', name: 'ICICI Bank', short: 'ICICI', category: 'popular', defaultIfsc: 'ICIC0000001', theme: 'icici', isPopular: true },
  { id: 'axis', name: 'Axis Bank', short: 'AXIS', category: 'popular', defaultIfsc: 'UTIB0000001', theme: 'axis', isPopular: true },
  { id: 'kotak', name: 'Kotak Mahindra Bank', short: 'KOTAK', category: 'popular', defaultIfsc: 'KKBK0000001', theme: 'kotak', isPopular: true },
  { id: 'pnb', name: 'Punjab National Bank', short: 'PNB', category: 'popular', defaultIfsc: 'PUNB0000001', theme: 'pnb', isPopular: true },
  { id: 'bob', name: 'Bank of Baroda', short: 'BOB', category: 'popular', defaultIfsc: 'BARB0000001', theme: 'bob', isPopular: true },
  { id: 'canara', name: 'Canara Bank', short: 'CANARA', category: 'popular', defaultIfsc: 'CNRB0000001', theme: 'canara', isPopular: true },
  { id: 'union', name: 'Union Bank of India', short: 'UBI', category: 'popular', defaultIfsc: 'UBIN0000001', theme: 'union', isPopular: true },
  { id: 'idfc', name: 'IDFC FIRST Bank', short: 'IDFC', category: 'popular', defaultIfsc: 'IDFB0000001', theme: 'idfc', isPopular: true },
  { id: 'indusind', name: 'IndusInd Bank', short: 'INDUSIND', category: 'popular', defaultIfsc: 'INDB0000001', theme: 'indusind', isPopular: true },
  { id: 'federal', name: 'Federal Bank', short: 'FEDERAL', category: 'popular', defaultIfsc: 'FDRL0000001', theme: 'federal', isPopular: true },
  { id: 'au', name: 'AU Small Finance Bank', short: 'AU SFB', category: 'popular', defaultIfsc: 'AUBL0000001', theme: 'au', isPopular: true },
  { id: 'yes', name: 'YES Bank', short: 'YES', category: 'popular', defaultIfsc: 'YESB0000001', theme: 'yes', isPopular: true },

  // Private Sector Banks
  { id: 'bandhan', name: 'Bandhan Bank', short: 'BANDHAN', category: 'private', defaultIfsc: 'BDBL0000001', theme: 'bandhan' },
  { id: 'rbl', name: 'RBL Bank', short: 'RBL', category: 'private', defaultIfsc: 'RATN0000001', theme: 'rbl' },
  { id: 'kvb', name: 'Karur Vysya Bank', short: 'KVB', category: 'private', defaultIfsc: 'KVBL0000001', theme: 'kvb' },
  { id: 'cub', name: 'City Union Bank', short: 'CUB', category: 'private', defaultIfsc: 'CIUB0000001', theme: 'cub' },
  { id: 'sib', name: 'South Indian Bank', short: 'SIB', category: 'private', defaultIfsc: 'SIBL0000001', theme: 'sib' },
  { id: 'ktk', name: 'Karnataka Bank', short: 'KTK', category: 'private', defaultIfsc: 'KARB0000001', theme: 'ktk' },
  { id: 'csb', name: 'CSB Bank', short: 'CSB', category: 'private', defaultIfsc: 'CSBK0000001', theme: 'default' },
  { id: 'tmb', name: 'Tamilnad Mercantile Bank', short: 'TMB', category: 'private', defaultIfsc: 'TMBL0000001', theme: 'default' },
  { id: 'dcb', name: 'DCB Bank', short: 'DCB', category: 'private', defaultIfsc: 'DCBL0000001', theme: 'default' },
  { id: 'jkb', name: 'Jammu & Kashmir Bank', short: 'JKB', category: 'private', defaultIfsc: 'JAKA0000001', theme: 'default' },

  // Public Sector / Govt Banks
  { id: 'boi', name: 'Bank of India', short: 'BOI', category: 'psu', defaultIfsc: 'BKID0000001', theme: 'boi' },
  { id: 'indian', name: 'Indian Bank', short: 'INDIAN', category: 'psu', defaultIfsc: 'IDIB0000001', theme: 'indian' },
  { id: 'cbi', name: 'Central Bank of India', short: 'CBI', category: 'psu', defaultIfsc: 'CBIN0000001', theme: 'cbi' },
  { id: 'iob', name: 'Indian Overseas Bank', short: 'IOB', category: 'psu', defaultIfsc: 'IOBA0000001', theme: 'iob' },
  { id: 'uco', name: 'UCO Bank', short: 'UCO', category: 'psu', defaultIfsc: 'UCBA0000001', theme: 'uco' },
  { id: 'bom', name: 'Bank of Maharashtra', short: 'BOM', category: 'psu', defaultIfsc: 'MAHB0000001', theme: 'bom' },
  { id: 'psb', name: 'Punjab & Sind Bank', short: 'PSB', category: 'psu', defaultIfsc: 'PSIB0000001', theme: 'psb' },

  // Small Finance & Neo Banks
  { id: 'equitas', name: 'Equitas Small Finance Bank', short: 'EQUITAS', category: 'sfb_neo', defaultIfsc: 'ESFB0000001', theme: 'default' },
  { id: 'ujjivan', name: 'Ujjivan Small Finance Bank', short: 'UJJIVAN', category: 'sfb_neo', defaultIfsc: 'UJVN0000001', theme: 'default' },
  { id: 'jana', name: 'Jana Small Finance Bank', short: 'JANA', category: 'sfb_neo', defaultIfsc: 'JSFB0000001', theme: 'default' },
  { id: 'utkarsh', name: 'Utkarsh Small Finance Bank', short: 'UTKARSH', category: 'sfb_neo', defaultIfsc: 'UTKS0000001', theme: 'default' },
  { id: 'suryoday', name: 'Suryoday Small Finance Bank', short: 'SURYODAY', category: 'sfb_neo', defaultIfsc: 'SURY0000001', theme: 'default' },
  { id: 'capital', name: 'Capital Small Finance Bank', short: 'CAPITAL', category: 'sfb_neo', defaultIfsc: 'CLBL0000001', theme: 'default' },
  { id: 'jupiter', name: 'Jupiter (Federal Bank)', short: 'JUPITER', category: 'sfb_neo', defaultIfsc: 'FDRL0000001', theme: 'jupiter' },
  { id: 'fi', name: 'Fi Money (Federal Bank)', short: 'FI', category: 'sfb_neo', defaultIfsc: 'FDRL0000001', theme: 'fi' },
  { id: 'sbm', name: 'SBM Bank India', short: 'SBM', category: 'sfb_neo', defaultIfsc: 'STCB0000001', theme: 'sbm' },
  { id: 'airtel', name: 'Airtel Payments Bank', short: 'AIRTEL', category: 'sfb_neo', defaultIfsc: 'AIRP0000001', theme: 'airtel' },
  { id: 'ippb', name: 'India Post Payments Bank', short: 'IPPB', category: 'sfb_neo', defaultIfsc: 'IPOS0000001', theme: 'ippb' },
  { id: 'paytm', name: 'Paytm Payments Bank', short: 'PAYTM', category: 'sfb_neo', defaultIfsc: 'PYTM0000001', theme: 'paytm' },
  { id: 'jio', name: 'Jio Payments Bank', short: 'JIO', category: 'sfb_neo', defaultIfsc: 'JIOP0000001', theme: 'jio' },

  // Foreign / Multinational Banks
  { id: 'sc', name: 'Standard Chartered', short: 'SC', category: 'foreign', defaultIfsc: 'SCBL0000001', theme: 'sc' },
  { id: 'hsbc', name: 'HSBC India', short: 'HSBC', category: 'foreign', defaultIfsc: 'HSBC0000001', theme: 'hsbc' },
  { id: 'dbs', name: 'DBS Bank India', short: 'DBS', category: 'foreign', defaultIfsc: 'DBSS0000001', theme: 'dbs' },
  { id: 'citi', name: 'Citibank India', short: 'CITI', category: 'foreign', defaultIfsc: 'CITI0000001', theme: 'citi' },
  { id: 'deutsche', name: 'Deutsche Bank India', short: 'DEUTSCHE', category: 'foreign', defaultIfsc: 'DEUT0000001', theme: 'deutsche' },
  { id: 'barclays', name: 'Barclays Bank India', short: 'BARCLAYS', category: 'foreign', defaultIfsc: 'BARC0000001', theme: 'default' },
];

export interface BankSelectionResult {
  id?: string;
  name: string;
  short: string;
  defaultIfsc?: string;
  theme?: string;
  isCustom?: boolean;
}

interface BankSelectorProps {
  selectedBankName: string;
  onSelectBank: (bank: BankSelectionResult) => void;
  label?: string;
  showCustomInput?: boolean;
  maxHeight?: string;
  className?: string;
  allowCustomBank?: boolean;
  compact?: boolean;
}

export const BankSelector: React.FC<BankSelectorProps> = ({
  selectedBankName,
  onSelectBank,
  label = 'Select Bank / Financial Institution',
  maxHeight = 'max-h-64 sm:max-h-72',
  className = '',
  allowCustomBank = true,
  compact = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customBankName, setCustomBankName] = useState('');
  const [customIfsc, setCustomIfsc] = useState('');

  // Check if current selectedBankName matches a preset bank
  const matchingPreset = useMemo(() => {
    if (!selectedBankName) return null;
    return (
      BANK_DIRECTORY.find(
        (b) =>
          b.name.toLowerCase() === selectedBankName.toLowerCase() ||
          b.short.toLowerCase() === selectedBankName.toLowerCase()
      ) || null
    );
  }, [selectedBankName]);

  // Sync custom input if a custom bank is passed
  useEffect(() => {
    if (selectedBankName && !matchingPreset && selectedBankName !== 'Custom Bank') {
      setCustomBankName(selectedBankName);
    }
  }, [selectedBankName, matchingPreset]);

  // Filtered banks based on search & category
  const filteredBanks = useMemo(() => {
    let list = BANK_DIRECTORY;

    if (activeCategory === 'popular') {
      list = list.filter((b) => b.isPopular || b.category === 'popular');
    } else if (activeCategory === 'private') {
      list = list.filter((b) => b.category === 'private' || (b.isPopular && ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'IDFC FIRST Bank', 'IndusInd Bank', 'Federal Bank', 'YES Bank'].includes(b.name)));
    } else if (activeCategory === 'psu') {
      list = list.filter((b) => b.category === 'psu' || (b.isPopular && ['State Bank of India', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank of India'].includes(b.name)));
    } else if (activeCategory === 'sfb_neo') {
      list = list.filter((b) => b.category === 'sfb_neo' || (b.isPopular && ['AU Small Finance Bank'].includes(b.name)));
    } else if (activeCategory === 'foreign') {
      list = list.filter((b) => b.category === 'foreign');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.short.toLowerCase().includes(q) ||
          (b.defaultIfsc && b.defaultIfsc.toLowerCase().includes(q))
      );
    }

    return list;
  }, [searchQuery, activeCategory]);

  const categories = [
    { id: 'all', label: 'All Banks', icon: Landmark, count: BANK_DIRECTORY.length },
    { id: 'popular', label: 'Popular', icon: Sparkles, count: 14 },
    { id: 'psu', label: 'Govt / PSU', icon: ShieldCheck, count: 12 },
    { id: 'private', label: 'Private', icon: Building2, count: 18 },
    { id: 'sfb_neo', label: 'SFB & Neo', icon: Zap, count: 14 },
    { id: 'foreign', label: 'Foreign', icon: Globe2, count: 6 },
  ];

  const handleSelectPreset = (bank: BankOption) => {
    setIsCustomMode(false);
    onSelectBank({
      id: bank.id,
      name: bank.name,
      short: bank.short,
      defaultIfsc: bank.defaultIfsc,
      theme: bank.theme,
      isCustom: false,
    });
  };

  const handleApplyCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customBankName.trim();
    if (!trimmed) return;

    const shortCode = trimmed
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 4)
      .toUpperCase();

    onSelectBank({
      id: `custom_${Date.now()}`,
      name: trimmed,
      short: shortCode || 'BANK',
      defaultIfsc: customIfsc.trim().toUpperCase() || `${shortCode}0000001`,
      theme: 'custom',
      isCustom: true,
    });
  };

  const customThemePreview: BankBrandTheme = useMemo(() => {
    return getBankBrandTheme(customBankName || 'Custom Bank');
  }, [customBankName]);

  return (
    <div className={cn('space-y-2.5', className)} id="bank-selector-container">
      {/* Header & View Mode Switcher */}
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            title="Grid view"
            className={cn(
              'p-1 rounded text-xs transition-colors',
              viewMode === 'grid'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            title="List view"
            className={cn(
              'p-1 rounded text-xs transition-colors',
              viewMode === 'list'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search bank name (HDFC, SBI, ICICI), short code, or IFSC..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-slate-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800 no-scrollbar">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 cursor-pointer border',
                isActive
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm shadow-blue-500/10'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:bg-slate-800/60'
              )}
            >
              <Icon className="w-3 h-3" />
              <span>{cat.label}</span>
              <span
                className={cn(
                  'text-[10px] px-1 py-0.2 rounded font-mono',
                  isActive ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-800 text-slate-500'
                )}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bank Selection Scrollable Area */}
      <div
        className={cn(
          'overflow-y-auto rounded-xl border border-slate-800/90 bg-slate-950/60 p-2 sm:p-2.5 transition-all scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent',
          maxHeight
        )}
      >
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Dedicated Other / Custom Bank Card */}
            {allowCustomBank && (
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer relative group',
                  isCustomMode || (!matchingPreset && selectedBankName && selectedBankName !== '')
                    ? 'bg-amber-950/30 border-amber-500/70 text-amber-200 ring-1 ring-amber-500/50 shadow-md shadow-amber-950/30'
                    : 'bg-slate-900/60 border-dashed border-slate-700/80 text-slate-300 hover:border-amber-500/50 hover:bg-slate-900/90'
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-1.5 group-hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors truncate w-full">
                  Other / Custom Bank
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate w-full">
                  Add unlisted bank
                </div>
                {(isCustomMode || (!matchingPreset && selectedBankName && selectedBankName !== '')) && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            )}

            {/* Standard Bank Cards */}
            {filteredBanks.map((bank) => {
              const isSelected =
                !isCustomMode &&
                (selectedBankName.toLowerCase() === bank.name.toLowerCase() ||
                  selectedBankName.toLowerCase() === bank.short.toLowerCase());

              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => handleSelectPreset(bank)}
                  className={cn(
                    'flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer relative group',
                    isSelected
                      ? 'bg-blue-950/50 border-blue-500 text-white ring-1 ring-blue-500/60 shadow-md shadow-blue-950/40'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850 hover:text-white'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <BankBrandBadge bankName={bank.name} size="sm" showName={false} />
                    <span
                      className={cn(
                        'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border tracking-tight',
                        isSelected
                          ? 'bg-blue-500/20 text-blue-200 border-blue-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700/60 group-hover:text-slate-300'
                      )}
                    >
                      {bank.short}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-white tracking-tight line-clamp-1 w-full">
                    {bank.name}
                  </div>

                  {bank.defaultIfsc && (
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1 truncate w-full">
                      <span className="text-slate-400">IFSC:</span>
                      <span className="text-slate-400 group-hover:text-slate-300">
                        {bank.defaultIfsc.slice(0, 4)}...
                      </span>
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* List Mode */
          <div className="space-y-1.5">
            {/* Custom Option in List */}
            {allowCustomBank && (
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className={cn(
                  'w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer group',
                  isCustomMode || (!matchingPreset && selectedBankName && selectedBankName !== '')
                    ? 'bg-amber-950/30 border-amber-500/70 text-amber-200 ring-1 ring-amber-500/50'
                    : 'bg-slate-900/60 border-dashed border-slate-700/80 text-slate-300 hover:border-amber-500/50 hover:bg-slate-900/90'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
                      Other / Custom Financial Institution
                    </div>
                    <div className="text-[11px] text-slate-400">Specify custom bank name & IFSC</div>
                  </div>
                </div>
                {(isCustomMode || (!matchingPreset && selectedBankName && selectedBankName !== '')) && (
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            )}

            {filteredBanks.map((bank) => {
              const isSelected =
                !isCustomMode &&
                (selectedBankName.toLowerCase() === bank.name.toLowerCase() ||
                  selectedBankName.toLowerCase() === bank.short.toLowerCase());

              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => handleSelectPreset(bank)}
                  className={cn(
                    'w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer group',
                    isSelected
                      ? 'bg-blue-950/50 border-blue-500 text-white ring-1 ring-blue-500/60'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BankBrandBadge bankName={bank.name} size="sm" showName={false} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{bank.name}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>Code: {bank.short}</span>
                        {bank.defaultIfsc && <span>• IFSC: {bank.defaultIfsc}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 capitalize">
                      {bank.category.replace('_', ' ')}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty Search Fallback */}
        {filteredBanks.length === 0 && (
          <div className="py-8 px-4 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">No preset bank found for "{searchQuery}"</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                You can add this as a custom financial institution below
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCustomBankName(searchQuery);
                setIsCustomMode(true);
                handleApplyCustom();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Use "{searchQuery}" as Custom Bank</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Custom Bank Input Panel */}
      {(isCustomMode || (!matchingPreset && selectedBankName && selectedBankName !== '')) && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border border-amber-500/40 space-y-3 animate-in fade-in-50 duration-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-amber-200">Custom Bank / Provider Details</span>
            </div>
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
            >
              Back to Presets
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Bank / Provider Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={customBankName}
                onChange={(e) => {
                  setCustomBankName(e.target.value);
                  const name = e.target.value;
                  const short = name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 4)
                    .toUpperCase();
                  onSelectBank({
                    name,
                    short: short || 'BANK',
                    defaultIfsc: customIfsc || `${short}0000001`,
                    isCustom: true,
                  });
                }}
                placeholder="e.g. Kerala Gramin Bank, Revolut, Chime"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Default IFSC Prefix (Optional)
              </label>
              <input
                type="text"
                value={customIfsc}
                onChange={(e) => {
                  setCustomIfsc(e.target.value.toUpperCase());
                  onSelectBank({
                    name: customBankName,
                    short: customBankName
                      .split(/\s+/)
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 4)
                      .toUpperCase(),
                    defaultIfsc: e.target.value.toUpperCase(),
                    isCustom: true,
                  });
                }}
                placeholder="e.g. KLGB0001234"
                maxLength={11}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Live Preview Badge */}
          {customBankName.trim() && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border shadow-inner',
                    customThemePreview.logoBg,
                    customThemePreview.logoBorder
                  )}
                >
                  <span className="text-white font-mono text-[10px] font-black">
                    {customThemePreview.shortCode}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{customBankName}</div>
                  <div className="text-[10px] text-slate-400">Dynamic Card & Passbook Theme Active</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Custom Provider
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

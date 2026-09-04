import React from 'react';
import { Sparkles, Shield, Coins, Layers, Gem, TrendingUp, BarChart3 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface InvestmentBrandBadgeProps {
  name: string;
  symbol?: string;
  assetType?: 'STOCK' | 'MUTUAL_FUND' | 'GOLD' | 'SGB' | 'ETF' | 'UNLISTED_EQUITY' | 'OTHER' | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

interface BrandPreset {
  abbr: string;
  bg: string;
  border: string;
  text: string;
  logoType?: string;
  subtext?: string;
  isGold?: boolean;
}

// Preset configurations for Nifty 50, major Indian Equities, Indices, ETFs & AMCs
const BRAND_PRESETS: Record<string, BrandPreset> = {
  // Indices & ETFs
  NIFTY50: { abbr: 'N50', bg: 'from-blue-950 via-indigo-950 to-emerald-950', border: 'border-emerald-500/50', text: 'text-emerald-300', logoType: 'nifty' },
  NIFTY: { abbr: 'N50', bg: 'from-blue-950 via-indigo-950 to-emerald-950', border: 'border-emerald-500/50', text: 'text-emerald-300', logoType: 'nifty' },
  NIFTYBEES: { abbr: 'N50', bg: 'from-blue-950 via-indigo-950 to-emerald-950', border: 'border-emerald-500/50', text: 'text-emerald-300', logoType: 'nifty' },
  BANKNIFTY: { abbr: 'BNF', bg: 'from-slate-950 via-blue-950 to-cyan-950', border: 'border-cyan-500/50', text: 'text-cyan-300', logoType: 'banknifty' },
  BANKBEES: { abbr: 'BNF', bg: 'from-slate-950 via-blue-950 to-cyan-950', border: 'border-cyan-500/50', text: 'text-cyan-300', logoType: 'banknifty' },
  SENSEX: { abbr: 'BSE', bg: 'from-blue-950 via-slate-900 to-amber-950', border: 'border-amber-500/50', text: 'text-amber-300', logoType: 'sensex' },
  ITBEES: { abbr: 'IT', bg: 'from-indigo-950 to-cyan-950', border: 'border-cyan-500/50', text: 'text-cyan-200' },
  GOLDBEES: { abbr: 'GOLD', bg: 'from-amber-950 via-yellow-950 to-amber-900', border: 'border-amber-500/60', text: 'text-amber-300', isGold: true },
  SILVERBEES: { abbr: 'SLVR', bg: 'from-slate-800 to-zinc-900', border: 'border-slate-400/60', text: 'text-slate-200' },
  CPSEETF: { abbr: 'CPSE', bg: 'from-blue-950 to-slate-900', border: 'border-blue-500/50', text: 'text-blue-200' },
  MON100: { abbr: 'MO100', bg: 'from-purple-950 to-blue-950', border: 'border-purple-500/50', text: 'text-purple-200' },

  // Top Indian Equities
  RELIANCE: { abbr: 'RIL', bg: 'from-[#2b0507] via-[#0b1c4d] to-[#040e24]', border: 'border-red-500/50', text: 'text-red-200', logoType: 'ril' },
  RIL: { abbr: 'RIL', bg: 'from-[#2b0507] via-[#0b1c4d] to-[#040e24]', border: 'border-red-500/50', text: 'text-red-200', logoType: 'ril' },
  TCS: { abbr: 'TCS', bg: 'from-[#0a1128] via-[#1c2541] to-[#001233]', border: 'border-sky-500/50', text: 'text-sky-200', logoType: 'tcs' },
  HDFCBANK: { abbr: 'HDFC', bg: 'from-[#001d3d] via-[#003566] to-[#004c8f]', border: 'border-blue-500/50', text: 'text-cyan-200', logoType: 'hdfc' },
  HDFC: { abbr: 'HDFC', bg: 'from-[#001d3d] via-[#003566] to-[#004c8f]', border: 'border-blue-500/50', text: 'text-cyan-200', logoType: 'hdfc' },
  INFY: { abbr: 'INFY', bg: 'from-[#031d44] via-[#04395e] to-[#002855]', border: 'border-cyan-500/50', text: 'text-cyan-200', logoType: 'infy' },
  INFOSYS: { abbr: 'INFY', bg: 'from-[#031d44] via-[#04395e] to-[#002855]', border: 'border-cyan-500/50', text: 'text-cyan-200', logoType: 'infy' },
  ICICIBANK: { abbr: 'ICICI', bg: 'from-[#3a030b] via-[#670719] to-[#9b1c2e]', border: 'border-orange-500/50', text: 'text-orange-200', logoType: 'icici' },
  ICICI: { abbr: 'ICICI', bg: 'from-[#3a030b] via-[#670719] to-[#9b1c2e]', border: 'border-orange-500/50', text: 'text-orange-200', logoType: 'icici' },
  SBIN: { abbr: 'SBI', bg: 'from-[#001838] via-[#002d62] to-[#044389]', border: 'border-sky-400/50', text: 'text-sky-200', logoType: 'sbi' },
  SBI: { abbr: 'SBI', bg: 'from-[#001838] via-[#002d62] to-[#044389]', border: 'border-sky-400/50', text: 'text-sky-200', logoType: 'sbi' },
  BHARTIARTL: { abbr: 'AIRTEL', bg: 'from-[#380407] via-[#6e0d13] to-[#9c121b]', border: 'border-rose-500/50', text: 'text-rose-200', logoType: 'airtel' },
  AIRTEL: { abbr: 'AIRTEL', bg: 'from-[#380407] via-[#6e0d13] to-[#9c121b]', border: 'border-rose-500/50', text: 'text-rose-200', logoType: 'airtel' },
  ITC: { abbr: 'ITC', bg: 'from-[#301602] via-[#572704] to-[#803a06]', border: 'border-amber-500/50', text: 'text-amber-200', logoType: 'itc' },
  LT: { abbr: 'L&T', bg: 'from-[#021d38] via-[#0b3c66] to-[#00204a]', border: 'border-amber-500/50', text: 'text-amber-200', logoType: 'lt' },
  TATAMOTORS: { abbr: 'TATA', bg: 'from-[#031d44] via-[#004d7a] to-[#001f3f]', border: 'border-sky-500/50', text: 'text-sky-200', logoType: 'tata' },
  TATASTEEL: { abbr: 'TATA', bg: 'from-[#0a192f] via-[#172a45] to-[#203a43]', border: 'border-blue-400/50', text: 'text-blue-200', logoType: 'tata' },
  TATA: { abbr: 'TATA', bg: 'from-[#031d44] via-[#004d7a] to-[#001f3f]', border: 'border-sky-500/50', text: 'text-sky-200', logoType: 'tata' },
  HEROMOTOCO: { abbr: 'HERO', bg: 'from-[#2e0407] via-[#590a0f] to-[#801017]', border: 'border-red-500/50', text: 'text-red-200' },
  TORNTPOWER: { abbr: 'TORNT', bg: 'from-amber-950 via-slate-900 to-yellow-950', border: 'border-yellow-500/50', text: 'text-yellow-200' },
  MARUTI: { abbr: 'MARUTI', bg: 'from-[#051937] via-[#004d7a] to-[#a80000]', border: 'border-red-500/50', text: 'text-white' },
  SUNPHARMA: { abbr: 'SUN', bg: 'from-[#381a02] via-[#6e3305] to-[#a34c07]', border: 'border-orange-500/50', text: 'text-orange-200' },
  AXISBANK: { abbr: 'AXIS', bg: 'from-[#2e0414] via-[#5c082b] to-[#8a0c3f]', border: 'border-pink-500/50', text: 'text-pink-200', logoType: 'axis' },
  KOTAKBANK: { abbr: 'KOTAK', bg: 'from-[#2b0406] via-[#610a0e] to-[#9e0f16]', border: 'border-rose-500/50', text: 'text-rose-200', logoType: 'kotak' },
  MM: { abbr: 'M&M', bg: 'from-[#2e0407] via-[#590a0f] to-[#801017]', border: 'border-red-500/50', text: 'text-red-200' },
  ASIANPAINT: { abbr: 'ASIAN', bg: 'from-[#2d0538] via-[#5c0c73] to-[#8f14b3]', border: 'border-purple-500/50', text: 'text-purple-200' },
  BAJFINANCE: { abbr: 'BAJAJ', bg: 'from-[#031d44] via-[#0a3a75] to-[#1258a6]', border: 'border-blue-500/50', text: 'text-blue-200' },
  BAJAJFINSV: { abbr: 'BAJAJ', bg: 'from-[#031d44] via-[#0a3a75] to-[#1258a6]', border: 'border-blue-500/50', text: 'text-blue-200' },
  TITAN: { abbr: 'TITAN', bg: 'from-[#2b1802] via-[#523004] to-[#7a4807]', border: 'border-amber-500/60', text: 'text-amber-300' },
  ADANIENT: { abbr: 'ADANI', bg: 'from-[#03241b] via-[#074736] to-[#0d6e53]', border: 'border-emerald-500/50', text: 'text-emerald-200' },
  ADANIPORTS: { abbr: 'ADANI', bg: 'from-[#03241b] via-[#074736] to-[#0d6e53]', border: 'border-emerald-500/50', text: 'text-emerald-200' },
  ULTRACEMCO: { abbr: 'ULTRA', bg: 'from-[#2b2402] via-[#544605] to-[#7d6807]', border: 'border-yellow-500/50', text: 'text-yellow-200' },
  WIPRO: { abbr: 'WIPRO', bg: 'from-[#03212b] via-[#084257] to-[#0d6482]', border: 'border-teal-500/50', text: 'text-teal-200' },
  NTPC: { abbr: 'NTPC', bg: 'from-[#042417] via-[#09472e] to-[#0e6e47]', border: 'border-emerald-500/50', text: 'text-emerald-200' },
  POWERGRID: { abbr: 'PGRID', bg: 'from-[#03192e] via-[#07335c] to-[#0c4e8a]', border: 'border-blue-500/50', text: 'text-blue-200' },
  ONGC: { abbr: 'ONGC', bg: 'from-[#2b0805] via-[#54110b] to-[#7d1a11]', border: 'border-red-500/50', text: 'text-red-200' },
  COALINDIA: { abbr: 'COAL', bg: 'from-[#171717] via-[#262626] to-[#404040]', border: 'border-amber-500/50', text: 'text-amber-300' },
  HINDALCO: { abbr: 'HIND', bg: 'from-[#08182b] via-[#113054] to-[#1a487d]', border: 'border-blue-400/50', text: 'text-blue-200' },
  NESTLEIND: { abbr: 'NESTLE', bg: 'from-[#0f172a] via-[#1e293b] to-[#004b87]', border: 'border-sky-400/50', text: 'text-white' },

  // Unlisted Equities
  SBIFML: { abbr: 'SBIFM', bg: 'from-[#001838] via-[#002d62] to-[#044389]', border: 'border-sky-400/50', text: 'text-sky-200' },
  SBIFM: { abbr: 'SBIFM', bg: 'from-[#001838] via-[#002d62] to-[#044389]', border: 'border-sky-400/50', text: 'text-sky-200' },
  HDBFS: { abbr: 'HDBFS', bg: 'from-[#001d3d] via-[#003566] to-[#004c8f]', border: 'border-blue-500/50', text: 'text-cyan-200' },
  TATACAPITAL: { abbr: 'TATA', bg: 'from-[#031d44] via-[#004d7a] to-[#001f3f]', border: 'border-sky-500/50', text: 'text-sky-200' },

  // New-age Tech Stocks
  ZOMATO: { abbr: 'ZOMATO', bg: 'from-[#380407] via-[#6e0d13] to-[#e23744]', border: 'border-rose-500/50', text: 'text-white' },
  SWIGGY: { abbr: 'SWIGGY', bg: 'from-[#381a02] via-[#733504] to-[#fc8019]', border: 'border-orange-500/50', text: 'text-white' },
  PAYTM: { abbr: 'PAYTM', bg: 'from-[#031d44] via-[#002e6e] to-[#00baf2]', border: 'border-cyan-500/50', text: 'text-cyan-200' },
  JIOFIN: { abbr: 'JIO', bg: 'from-[#031940] via-[#004080] to-[#0a2559]', border: 'border-blue-500/50', text: 'text-blue-200' },

  // Mutual Fund AMCs
  PPFAS: { abbr: 'PPFAS', bg: 'from-emerald-950 to-teal-950', border: 'border-emerald-500/50', text: 'text-emerald-300' },
  PARAG: { abbr: 'PPFAS', bg: 'from-emerald-950 to-teal-950', border: 'border-emerald-500/50', text: 'text-emerald-300' },
  BANDHAN: { abbr: 'BANDHAN', bg: 'from-rose-950 to-red-950', border: 'border-red-500/50', text: 'text-red-200' },
  NIPPON: { abbr: 'NIPPON', bg: 'from-red-950 to-rose-900', border: 'border-red-500/50', text: 'text-red-200' },
  QUANT: { abbr: 'QUANT', bg: 'from-purple-950 to-indigo-900', border: 'border-purple-500/50', text: 'text-purple-200' },
  MIRAE: { abbr: 'MIRAE', bg: 'from-orange-950 to-blue-950', border: 'border-orange-500/50', text: 'text-orange-200' },
  AXISMF: { abbr: 'AXIS', bg: 'from-pink-950 to-rose-950', border: 'border-pink-500/50', text: 'text-pink-200' },
  MOTILAL: { abbr: 'MOSL', bg: 'from-amber-950 to-slate-900', border: 'border-amber-500/50', text: 'text-amber-200' },
  KOTAKMF: { abbr: 'KOTAK', bg: 'from-red-950 to-blue-950', border: 'border-red-500/50', text: 'text-red-200' },
  DSP: { abbr: 'DSP', bg: 'from-slate-900 to-zinc-950', border: 'border-slate-500/50', text: 'text-slate-200' },
  UTIMF: { abbr: 'UTI', bg: 'from-blue-950 to-amber-950', border: 'border-blue-500/50', text: 'text-blue-200' },

  // Gold & SGB
  SGB: { abbr: 'SGB', bg: 'from-amber-950 via-yellow-950 to-amber-900', border: 'border-amber-500/60', text: 'text-amber-300', isGold: true },
  GOLD: { abbr: 'GOLD', bg: 'from-amber-950 via-yellow-950 to-amber-900', border: 'border-amber-500/60', text: 'text-amber-300', isGold: true },
};

function getInitials(name: string, symbol?: string): string {
  if (symbol && symbol.length <= 5) return symbol.toUpperCase();
  const words = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 4).toUpperCase();
}

function findPreset(name: string, symbol?: string, assetType?: string): BrandPreset | null {
  const normType = (assetType || '').toUpperCase();
  if (normType === 'GOLD' || normType === 'SGB') {
    return BRAND_PRESETS[normType] || BRAND_PRESETS.GOLD;
  }

  const lookupKeys = [
    symbol?.toUpperCase().trim(),
    name.toUpperCase().trim(),
    ...name.toUpperCase().trim().split(/\s+/),
  ].filter(Boolean) as string[];

  for (const k of lookupKeys) {
    if (BRAND_PRESETS[k]) return BRAND_PRESETS[k];
    const found = Object.keys(BRAND_PRESETS).find((p) => k.includes(p) || p.includes(k));
    if (found) return BRAND_PRESETS[found];
  }

  return null;
}

export const InvestmentBrandBadge: React.FC<InvestmentBrandBadgeProps> = ({
  name,
  symbol,
  assetType,
  size = 'md',
  className,
}) => {
  const preset = findPreset(name, symbol, assetType);
  const initials = preset?.abbr || getInitials(name, symbol);
  const normType = (assetType || '').toUpperCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px] rounded-xl font-bold',
    md: 'w-10 h-10 text-xs rounded-2xl font-bold',
    lg: 'w-12 h-12 text-sm rounded-2xl font-extrabold',
    xl: 'w-14 h-14 text-base rounded-2xl font-black',
  };

  const isGoldAsset = normType === 'GOLD' || normType === 'SGB' || preset?.isGold;

  if (isGoldAsset) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-amber-950 via-yellow-950 to-amber-900 border border-amber-500/50 shadow-md shadow-amber-950/30 text-amber-300 font-heading shrink-0',
          sizeClasses[size],
          className
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/10 via-transparent to-yellow-300/10 pointer-events-none" />
        <Coins className={size === 'sm' ? 'w-3.5 h-3.5 mb-0.5' : 'w-4 h-4 mb-0.5 text-amber-400'} />
        <span className="leading-none text-[9px] tracking-wider font-mono font-bold">
          {normType === 'SGB' ? 'SGB' : '24K'}
        </span>
      </div>
    );
  }

  if (preset?.logoType === 'nifty') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-gradient-to-br border shadow-md shrink-0 font-heading select-none',
          preset.bg,
          preset.border,
          sizeClasses[size],
          className
        )}
      >
        <TrendingUp className={size === 'sm' ? 'w-3.5 h-3.5 text-emerald-400' : 'w-4 h-4 text-emerald-400'} />
        <span className="text-[9px] font-mono font-black text-emerald-300 leading-none mt-0.5">
          N50
        </span>
      </div>
    );
  }

  if (preset) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br border shadow-md shrink-0 font-heading tracking-tight select-none',
          preset.bg,
          preset.border,
          preset.text,
          sizeClasses[size],
          className
        )}
      >
        <span className="leading-none">{preset.abbr}</span>
      </div>
    );
  }

  // Deterministic fallback gradient from string hash
  const charCodeSum = name.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const fallbackGradients = [
    'from-cyan-950 via-slate-900 to-blue-950 text-cyan-200 border-cyan-500/40',
    'from-emerald-950 via-slate-900 to-teal-950 text-emerald-200 border-emerald-500/40',
    'from-indigo-950 via-slate-900 to-purple-950 text-indigo-200 border-indigo-500/40',
    'from-blue-950 via-slate-900 to-sky-950 text-blue-200 border-blue-500/40',
    'from-rose-950 via-slate-900 to-pink-950 text-rose-200 border-rose-500/40',
  ];
  const selectedGrad = fallbackGradients[charCodeSum % fallbackGradients.length];

  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gradient-to-br border shadow-md shrink-0 font-heading uppercase select-none',
        selectedGrad,
        sizeClasses[size],
        className
      )}
    >
      <span className="leading-none">{initials}</span>
    </div>
  );
};

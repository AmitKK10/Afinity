import React from 'react';
import { Landmark } from 'lucide-react';
import { BankBrandTheme, getBankBrandTheme } from '../../utils/bankThemes';
import { cn } from '../../utils/cn';

interface BankBrandBadgeProps {
  bankName?: string;
  institutionName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
}

export const BankBrandBadge: React.FC<BankBrandBadgeProps> = ({
  bankName,
  institutionName,
  size = 'md',
  className,
  showName = false,
}) => {
  const theme: BankBrandTheme = getBankBrandTheme(institutionName || bankName);

  const sizeMap = {
    sm: 'w-7 h-7 text-[9px] rounded-lg',
    md: 'w-9 h-9 text-xs rounded-xl',
    lg: 'w-11 h-11 text-sm rounded-2xl',
    xl: 'w-14 h-14 text-base rounded-2xl',
  };

  const renderVectorEmblem = () => {
    switch (theme.emblem) {
      case 'sbi':
        return (
          <div className="relative flex items-center justify-center">
            {/* SBI Keyhole Circle Logo */}
            <div className="w-5 h-5 rounded-full bg-[#2895f3] flex items-center justify-center relative">
              <div className="w-2 h-2 rounded-full bg-[#002d62]" />
              <div className="absolute bottom-0 w-0.5 h-2 bg-[#002d62]" />
            </div>
          </div>
        );

      case 'hdfc':
        return (
          <div className="relative flex items-center justify-center">
            {/* HDFC Bank Grid Box */}
            <div className="w-5 h-5 bg-[#004c8f] border border-white/40 flex items-center justify-center p-0.5 relative">
              <div className="w-2 h-2 bg-[#ed1c24]" />
              <div className="absolute top-0 w-0.5 h-1.5 bg-white" />
              <div className="absolute bottom-0 w-0.5 h-1.5 bg-white" />
              <div className="absolute left-0 w-1.5 h-0.5 bg-white" />
              <div className="absolute right-0 w-1.5 h-0.5 bg-white" />
            </div>
          </div>
        );

      case 'icici':
        return (
          <div className="relative flex items-center justify-center">
            {/* ICICI Flame 'i' */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#9b1c2e] to-[#f37021] flex items-center justify-center shadow-inner">
              <span className="text-[10px] font-serif font-black italic text-white leading-none">
                i
              </span>
            </div>
          </div>
        );

      case 'axis':
        return (
          <div className="relative flex items-center justify-center">
            {/* Axis Burgundy Pyramid 'A' */}
            <div className="w-4 h-4 bg-[#97144d] rounded-xs flex items-center justify-center transform rotate-45 border border-pink-400/40">
              <span className="text-[7px] font-black text-white transform -rotate-45 leading-none">
                ▲
              </span>
            </div>
          </div>
        );

      case 'kotak':
        return (
          <div className="relative flex items-center justify-center">
            {/* Kotak Red & Blue Infinity Box */}
            <div className="w-5 h-5 rounded-xs bg-[#ed1c24] flex items-center justify-center border border-white/30 shadow-inner">
              <span className="text-[9px] font-black text-white leading-none">
                K
              </span>
            </div>
          </div>
        );

      case 'pnb':
        return (
          <div className="relative flex items-center justify-center">
            {/* PNB Maroon & Yellow Emblem */}
            <div className="w-5 h-5 rounded-xs bg-[#700d23] border border-[#eab308] flex items-center justify-center shadow-inner">
              <span className="text-[8px] font-black text-[#eab308] leading-none">
                PNB
              </span>
            </div>
          </div>
        );

      case 'bob':
        return (
          <div className="relative flex items-center justify-center">
            {/* BOB Vermillion Sun Logo */}
            <div className="w-5 h-5 rounded-full bg-[#f26522] border border-amber-300/40 flex items-center justify-center shadow-inner">
              <span className="text-[9px] font-black text-white leading-none">
                ☀
              </span>
            </div>
          </div>
        );

      case 'canara':
        return (
          <div className="relative flex items-center justify-center">
            {/* Canara Interlocking Triangles */}
            <div className="w-5 h-5 rounded-xs bg-[#0054a6] border border-[#fed100]/60 flex items-center justify-center">
              <span className="text-[8px] font-black text-[#fed100] leading-none">
                ▲▼
              </span>
            </div>
          </div>
        );

      case 'union':
        return (
          <div className="relative flex items-center justify-center">
            {/* Union Bank Red & Blue U */}
            <div className="w-5 h-5 rounded-xs bg-[#d2232a] border border-[#004b87] flex items-center justify-center">
              <span className="text-[9px] font-black text-white leading-none">
                UB
              </span>
            </div>
          </div>
        );

      case 'idfc':
        return (
          <div className="relative flex items-center justify-center">
            {/* IDFC FIRST '1' */}
            <div className="w-5 h-5 rounded-xs bg-[#991b1b] border border-amber-400/50 flex items-center justify-center">
              <span className="text-[9px] font-black text-white leading-none">
                1
              </span>
            </div>
          </div>
        );

      case 'indusind':
        return (
          <div className="relative flex items-center justify-center">
            {/* IndusInd Red I */}
            <div className="w-5 h-5 rounded-xs bg-[#7f1d1d] border border-amber-400/60 flex items-center justify-center">
              <span className="text-[9px] font-black text-[#f59e0b] leading-none">
                IND
              </span>
            </div>
          </div>
        );

      case 'federal':
        return (
          <div className="relative flex items-center justify-center">
            {/* Federal Bank FB */}
            <div className="w-5 h-5 rounded-xs bg-[#1e3a8a] border border-amber-400/60 flex items-center justify-center">
              <span className="text-[8px] font-black text-amber-300 leading-none">
                FB
              </span>
            </div>
          </div>
        );

      case 'yes':
        return (
          <div className="relative flex items-center justify-center">
            {/* YES Bank Blue & Red */}
            <div className="w-5 h-5 rounded-xs bg-[#1d4ed8] border border-rose-500/80 flex items-center justify-center">
              <span className="text-[9px] font-black text-white leading-none">
                ✓
              </span>
            </div>
          </div>
        );

      case 'bandhan':
        return (
          <div className="relative flex items-center justify-center">
            {/* Bandhan Orange B */}
            <div className="w-5 h-5 rounded-xs bg-[#c2410c] border border-amber-400/50 flex items-center justify-center">
              <span className="text-[9px] font-black text-white leading-none">
                B
              </span>
            </div>
          </div>
        );

      case 'sbm':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-xs bg-[#0f172a] border border-cyan-400/60 flex items-center justify-center">
              <span className="text-[7.5px] font-black text-cyan-300 leading-none">
                SBM
              </span>
            </div>
          </div>
        );

      case 'jupiter':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-[9px] font-black text-white leading-none">
                J
              </span>
            </div>
          </div>
        );

      case 'fi':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-teal-800 border border-teal-400/60 flex items-center justify-center">
              <span className="text-[8px] font-black text-teal-200 leading-none">
                Fi
              </span>
            </div>
          </div>
        );

      case 'sc':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#10b981] flex items-center justify-center">
              <span className="text-[8px] font-black text-white leading-none">
                SC
              </span>
            </div>
          </div>
        );

      case 'hsbc':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-xs bg-[#dc2626] border border-white/50 flex items-center justify-center">
              <span className="text-[8px] font-black text-white leading-none">
                H
              </span>
            </div>
          </div>
        );

      case 'au':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-700 to-orange-500 flex items-center justify-center border border-white/30 shadow-inner">
              <span className="text-[8px] font-black text-white leading-none">
                AU
              </span>
            </div>
          </div>
        );

      case 'airtel':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-[#e11d48] flex items-center justify-center border border-white/40 shadow-inner">
              <span className="text-[8px] font-black text-white leading-none font-serif italic">
                a
              </span>
            </div>
          </div>
        );

      case 'ippb':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-xs bg-[#b45309] border border-amber-300/60 flex items-center justify-center">
              <span className="text-[7.5px] font-black text-amber-200 leading-none">
                IPPB
              </span>
            </div>
          </div>
        );

      case 'paytm':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-xs bg-[#002e6e] border border-[#00baf2] flex items-center justify-center">
              <span className="text-[7.5px] font-black text-[#00baf2] leading-none">
                PAY
              </span>
            </div>
          </div>
        );

      case 'jio':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-[#0a2540] border border-blue-400/50 flex items-center justify-center">
              <span className="text-[8px] font-black text-[#00d4ff] leading-none">
                Jio
              </span>
            </div>
          </div>
        );

      case 'dbs':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-xs bg-black border border-red-600 flex items-center justify-center">
              <span className="text-[7.5px] font-black text-red-500 leading-none">
                DBS
              </span>
            </div>
          </div>
        );

      case 'citi':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-xs bg-[#003b70] border border-red-500/80 flex items-center justify-center">
              <span className="text-[8px] font-black text-white leading-none">
                citi
              </span>
            </div>
          </div>
        );

      case 'deutsche':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-xs bg-[#0018a8] border border-white/40 flex items-center justify-center">
              <span className="text-[8px] font-black text-white leading-none">
                / /
              </span>
            </div>
          </div>
        );

      case 'rbl':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-xs bg-[#1e1b4b] border border-red-500/70 flex items-center justify-center">
              <span className="text-[7.5px] font-black text-red-400 leading-none">
                RBL
              </span>
            </div>
          </div>
        );

      case 'boi':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-[#ea580c] border border-blue-400/60 flex items-center justify-center">
              <span className="text-[8px] font-black text-white leading-none">
                BOI
              </span>
            </div>
          </div>
        );

      case 'indian':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-xs bg-[#1e3a8a] border border-amber-400/60 flex items-center justify-center">
              <span className="text-[7.5px] font-black text-amber-300 leading-none">
                IND
              </span>
            </div>
          </div>
        );

      case 'cbi':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-xs bg-[#991b1b] border border-blue-400/60 flex items-center justify-center">
              <span className="text-[7.5px] font-black text-white leading-none">
                CBI
              </span>
            </div>
          </div>
        );

      case 'iob':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-xs bg-[#1e3a8a] border border-sky-400/60 flex items-center justify-center">
              <span className="text-[7.5px] font-black text-white leading-none">
                IOB
              </span>
            </div>
          </div>
        );

      case 'uco':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-xs bg-[#0284c7] border border-amber-400/60 flex items-center justify-center">
              <span className="text-[7.5px] font-black text-white leading-none">
                UCO
              </span>
            </div>
          </div>
        );

      case 'bom':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-xs bg-[#d97706] border border-blue-400/60 flex items-center justify-center">
              <span className="text-[7.5px] font-black text-white leading-none">
                BOM
              </span>
            </div>
          </div>
        );

      case 'psb':
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-xs bg-[#b45309] border border-amber-300/60 flex items-center justify-center">
              <span className="text-[7.5px] font-black text-white leading-none">
                PSB
              </span>
            </div>
          </div>
        );

      case 'kvb':
      case 'cub':
      case 'sib':
      case 'ktk':
        return (
          <div className="relative flex items-center justify-center">
            <span className="font-mono font-black text-[8px] text-white leading-none">
              {theme.shortCode}
            </span>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center">
            <Landmark className="w-3.5 h-3.5 text-white/90" />
          </div>
        );
    }
  };

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'flex items-center justify-center border shadow-md font-heading font-black tracking-tight shrink-0 transition-transform select-none',
          theme.logoBg,
          theme.logoBorder,
          sizeMap[size]
        )}
      >
        {renderVectorEmblem()}
      </div>

      {showName && (
        <span className="text-xs font-bold text-white tracking-tight truncate">
          {theme.name}
        </span>
      )}
    </div>
  );
};

/**
 * CreditCardVisual.tsx — Premium Realistic Credit Card Visual (Step 6B)
 * Implements authentic ISO-aspect credit card rendering with offline vector branding,
 * metallic finishes, EMV chips, contactless symbols, and network logos.
 */

import React from 'react';
import { Wifi, ShieldCheck } from 'lucide-react';
import { CreditCard, CardVisualPreset } from '../../types';
import { matchCardVisualPreset, CARD_VISUAL_PRESETS } from '../../utils/creditCardThemes';
import { cn } from '../../utils/cn';

interface CreditCardVisualProps {
  card: Partial<CreditCard>;
  preset?: CardVisualPreset;
  className?: string;
  onClick?: () => void;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CreditCardVisual: React.FC<CreditCardVisualProps> = ({
  card,
  preset: customPreset,
  className,
  onClick,
  showDetails = true,
  size = 'md',
}) => {
  const preset = customPreset || (card.cardVariant && CARD_VISUAL_PRESETS[card.cardVariant]) || matchCardVisualPreset(card);

  const issuerName = card.issuer || card.bankName || preset.issuer;
  const cardName = card.cardName || card.displayName || preset.cardName;
  const lastFour = card.lastFourDigits ? String(card.lastFourDigits).slice(-4) : '••••';
  const network = (card.cardNetwork || preset.defaultNetwork || 'visa').toLowerCase();
  const cardholder = card.cardholderName || (card.owner === 'PARENT' || card.owner === 'Parent' ? "PARENT'S CARD" : 'CARDHOLDER');
  const expiry = card.expiryDisplay || '••/••';

  // Network Logo Renderer
  const renderNetworkLogo = () => {
    switch (network) {
      case 'mastercard':
        return (
          <div className="flex items-center" title="Mastercard">
            <div className="relative flex items-center">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#EB001B] opacity-95 shadow-sm" />
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#F79E1B] opacity-90 -ml-2.5 mix-blend-screen shadow-sm" />
            </div>
            {size !== 'sm' && (
              <span className="text-[9px] font-black tracking-tighter text-white/90 ml-1.5 hidden sm:inline-block">
                mastercard
              </span>
            )}
          </div>
        );
      case 'rupay':
        return (
          <div className="flex items-center gap-1" title="RuPay">
            <span className="font-extrabold italic tracking-tight text-xs sm:text-sm text-white drop-shadow">
              RuPay
            </span>
            <div className="flex -space-x-1">
              <span className="w-1.5 h-3 bg-[#097938] transform skew-x-12 rounded-sm" />
              <span className="w-1.5 h-3 bg-[#F37021] transform skew-x-12 rounded-sm" />
            </div>
          </div>
        );
      case 'amex':
      case 'american express':
        return (
          <div className="px-1.5 py-0.5 rounded bg-[#002663] border border-cyan-300/40 text-[9px] sm:text-[10px] font-black tracking-wider text-white uppercase shadow-sm">
            AMEX
          </div>
        );
      case 'diners':
      case 'diners club':
        return (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-600 text-[9px] font-bold text-white uppercase">
            <div className="w-3.5 h-3.5 rounded-full border border-sky-400 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            </div>
            <span>Diners</span>
          </div>
        );
      case 'visa':
      default:
        return (
          <div className="flex items-center" title="VISA">
            <span className="font-black italic tracking-widest text-sm sm:text-base text-white drop-shadow-md">
              VISA
            </span>
            {size === 'lg' && (
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-300 ml-1">
                Signature
              </span>
            )}
          </div>
        );
    }
  };

  // Issuer Emblem Renderer
  const renderIssuerEmblem = () => {
    switch (preset.emblemType) {
      case 'sbi':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#0091DF] flex items-center justify-center shadow-inner relative flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-white relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-0.5 h-1 bg-[#0091DF]" />
              </div>
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              SBI Card
            </span>
          </div>
        );
      case 'hdfc':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-[#004C8F] border border-white/40 flex items-center justify-center rounded-xs flex-shrink-0">
              <div className="w-2 h-2 bg-[#ED232A]" />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              HDFC BANK
            </span>
          </div>
        );
      case 'icici':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#9c2c10] to-[#f37e20] flex items-center justify-center text-[9px] font-black text-white flex-shrink-0">
              i
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              ICICI Bank
            </span>
          </div>
        );
      case 'axis':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-[#97144D] transform rotate-45 flex items-center justify-center rounded-xs shadow-sm flex-shrink-0">
              <div className="w-1.5 h-1.5 bg-white/90 rounded-xs transform -rotate-45" />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              AXIS BANK
            </span>
          </div>
        );
      case 'kotak':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#ED1C24] flex items-center justify-center text-[9px] font-black text-white shadow-sm flex-shrink-0">
              K
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              Kotak
            </span>
          </div>
        );
      case 'amex':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-xs bg-[#002663] border border-cyan-400/50 flex items-center justify-center text-[8px] font-black text-cyan-200 flex-shrink-0">
              AX
            </div>
            <span className="text-[10px] font-black tracking-widest uppercase text-white/90 drop-shadow-sm">
              AMERICAN EXPRESS
            </span>
          </div>
        );
      case 'onecard':
        return (
          <div className="flex items-center gap-1">
            <span className="text-[12px] font-black tracking-tight text-white">
              one<span className="text-cyan-400">card</span>
            </span>
          </div>
        );
      case 'idfc':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-xs bg-[#991b1b] border border-amber-400/40 flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">
              1
            </div>
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              IDFC FIRST
            </span>
          </div>
        );
      case 'indusind':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-xs bg-[#7f1d1d] border border-amber-400/50 flex items-center justify-center text-[9px] font-black text-amber-300 flex-shrink-0">
              I
            </div>
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              IndusInd Bank
            </span>
          </div>
        );
      case 'rbl':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#dc2626] to-[#2563eb] flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">
              R
            </div>
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              RBL Bank
            </span>
          </div>
        );
      case 'federal':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-xs bg-[#1e3a8a] border border-amber-400/60 flex items-center justify-center text-[8px] font-black text-amber-300 flex-shrink-0">
              FB
            </div>
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              FEDERAL BANK
            </span>
          </div>
        );
      case 'yes':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-xs bg-[#1d4ed8] border border-rose-500 flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">
              ✓
            </div>
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              YES BANK
            </span>
          </div>
        );
      case 'bob':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#ea580c] flex items-center justify-center text-[8px] font-black text-white shadow-inner flex-shrink-0">
              ☀
            </div>
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              BOB Card
            </span>
          </div>
        );
      case 'au':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-xs bg-gradient-to-tr from-[#7c2d12] to-[#701a75] flex items-center justify-center text-[8px] font-black text-amber-300 flex-shrink-0">
              AU
            </div>
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              AU BANK
            </span>
          </div>
        );
      case 'sc':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#10b981] flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">
              SC
            </div>
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              StanChart
            </span>
          </div>
        );
      case 'hsbc':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-white rounded-xs flex items-center justify-center relative overflow-hidden flex-shrink-0 shadow-xs">
              <div className="w-2 h-2 bg-[#dc2626] transform rotate-45" />
            </div>
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              HSBC
            </span>
          </div>
        );
      case 'slice':
        return (
          <div className="flex items-center gap-1">
            <span className="text-[12px] font-black tracking-tight text-white">
              slice
            </span>
          </div>
        );
      case 'scapia':
        return (
          <div className="flex items-center gap-1">
            <span className="text-[12px] font-black tracking-wide text-[#2dd4bf] lowercase font-mono">
              scapia
            </span>
          </div>
        );
      case 'fi':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#22c55e] flex items-center justify-center text-[9px] font-black text-slate-950 flex-shrink-0">
              fi
            </div>
            <span className="text-[11px] font-black tracking-tight text-white">
              Fi Money
            </span>
          </div>
        );
      case 'jupiter':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#f97316] to-[#ea580c] flex items-center justify-center text-[9px] font-black text-white flex-shrink-0">
              ♃
            </div>
            <span className="text-[11px] font-black tracking-tight text-white">
              jupiter
            </span>
          </div>
        );
      case 'phonepe':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#5f259f] border border-purple-400/40 flex items-center justify-center text-[9px] font-black text-white flex-shrink-0 shadow-sm">
              पे
            </div>
            <span className="text-[11px] font-black tracking-tight text-white drop-shadow-sm">
              PhonePe
            </span>
          </div>
        );
      case 'bandhan':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-xs bg-[#c2410c] border border-amber-400/50 flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">
              B
            </div>
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              Bandhan Bank
            </span>
          </div>
        );
      case 'pnb':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-xs bg-[#700d23] border border-[#eab308] flex items-center justify-center text-[7.5px] font-black text-[#eab308] shadow-sm flex-shrink-0">
              PNB
            </div>
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              Punjab National Bank
            </span>
          </div>
        );
      case 'sbm':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-xs bg-[#0f172a] border border-cyan-400/60 flex items-center justify-center text-[8px] font-black text-cyan-300 flex-shrink-0">
              SBM
            </div>
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm">
              SBM BANK
            </span>
          </div>
        );
      case 'roar':
        return (
          <div className="flex items-center gap-1">
            <span className="text-[12px] font-black tracking-widest text-[#a3e635] uppercase font-mono drop-shadow">
              ROAR
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[7.5px] font-black text-white/90 shadow-sm flex-shrink-0">
              {(issuerName || 'CB').slice(0, 2).toUpperCase()}
            </div>
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-white/90 drop-shadow-sm truncate max-w-[130px]">
              {issuerName}
            </span>
          </div>
        );
    }
  };

  // EMV Chip Renderer
  const renderEmvChip = () => {
    const isGold = preset.chipColor === 'gold' || preset.chipColor === 'dark_gold';
    return (
      <div
        className={cn(
          'relative rounded-md border shadow-inner overflow-hidden flex flex-col justify-between p-0.5',
          size === 'sm' ? 'w-7 h-5' : 'w-9 h-6.5',
          isGold
            ? 'bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-600 border-amber-600/70 shadow-amber-900/30'
            : 'bg-gradient-to-tr from-slate-300 via-slate-100 to-slate-400 border-slate-400/70 shadow-slate-900/30'
        )}
      >
        <div className="flex justify-between h-full">
          <div className="w-1/3 border-r border-amber-800/30 dark:border-slate-600/40 flex flex-col justify-between">
            <div className="w-full h-1/3 border-b border-amber-800/30" />
            <div className="w-full h-1/3 border-b border-amber-800/30" />
          </div>
          <div className="w-1/3 flex flex-col justify-center items-center">
            <div className="w-2 h-2 rounded-full border border-amber-800/40" />
          </div>
          <div className="w-1/3 border-l border-amber-800/30 flex flex-col justify-between">
            <div className="w-full h-1/3 border-b border-amber-800/30" />
            <div className="w-full h-1/3 border-b border-amber-800/30" />
          </div>
        </div>
      </div>
    );
  };

  // Background Pattern Renderer
  const renderBackgroundPattern = () => {
    switch (preset.patternType) {
      case 'amazon_arc':
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Subtle micro-mesh carbon texture */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle, #ffffff 0.75px, transparent 0.75px)',
                backgroundSize: '8px 8px',
              }}
            />
            {/* Brushed dark graphite angle sheen */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: 'linear-gradient(120deg, transparent 35%, rgba(255, 153, 0, 0.09) 50%, transparent 65%)',
              }}
            />
            {/* Authentic Amazon curved smile swoosh */}
            <svg
              className="absolute -right-6 -bottom-6 w-64 h-48 text-[#ff9900] opacity-25"
              viewBox="0 0 200 120"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            >
              <path d="M 15,75 Q 95,125 180,45" />
              <path d="M 155,42 L 180,45 L 172,68" fill="currentColor" stroke="none" />
            </svg>
            {/* Warm ICICI/Amazon corner glows */}
            <div className="absolute -top-10 -left-10 w-36 h-36 bg-[#ea580c]/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-[#ff9900]/12 rounded-full blur-xl pointer-events-none" />
          </div>
        );
      case 'swiggy_ribbon':
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Energetic multi-layered geometric swooshes & ribbon curves */}
            <svg
              className="absolute -top-10 -right-10 w-64 h-64 text-white opacity-15"
              viewBox="0 0 200 200"
              fill="none"
              stroke="currentColor"
              strokeWidth="22"
            >
              <circle cx="120" cy="80" r="70" />
            </svg>
            <svg
              className="absolute -bottom-14 -left-10 w-60 h-60 text-black opacity-25"
              viewBox="0 0 200 200"
              fill="none"
              stroke="currentColor"
              strokeWidth="18"
            >
              <circle cx="80" cy="120" r="60" />
            </svg>
            {/* Diagonal energetic dynamic light beam */}
            <div className="absolute -top-24 -left-12 w-96 h-28 bg-gradient-to-r from-white/10 via-white/20 to-transparent transform -rotate-25 blur-[1px]" />
            {/* Warm coral highlight luster */}
            <div className="absolute top-0 right-1/4 w-32 h-32 bg-amber-300/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-black/40 rounded-full blur-xl pointer-events-none" />
          </div>
        );
      case 'stripes':
        return (
          <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
            <div className="absolute -top-10 -right-10 w-60 h-60 border-[24px] border-cyan-400/30 rounded-full blur-[1px]" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 border-[16px] border-white/20 rounded-full blur-[1px]" />
          </div>
        );
      case 'dots':
        return (
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '12px 12px',
            }}
          />
        );
      case 'gemstone':
        return (
          <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-white/25 via-transparent to-transparent transform rotate-45 blur-sm" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-cyan-400/20 via-transparent to-transparent transform rotate-12 blur-sm" />
          </div>
        );
      case 'brushed':
        return (
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 1px, transparent 1px, transparent 2px)',
            }}
          />
        );
      case 'wave':
        return (
          <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
            <svg
              className="absolute -right-10 -bottom-10 w-64 h-64 text-amber-500/30"
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M0,50 Q25,20 50,50 T100,50" />
              <path d="M0,70 Q25,40 50,70 T100,70" />
              <path d="M0,90 Q25,60 50,90 T100,90" />
            </svg>
          </div>
        );
      case 'minimal':
        return (
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
          </div>
        );
      case 'geometric':
      default:
        return (
          <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 border border-white/20 rounded-3xl transform rotate-12" />
            <div className="absolute bottom-0 left-0 w-36 h-36 border border-cyan-400/20 rounded-full" />
          </div>
        );
    }
  };

  // Co-brand / Variant Badge Renderer
  const renderCoBrandBadge = () => {
    if (!preset.badgeLabel) return null;

    const labelLower = preset.badgeLabel.toLowerCase();

    // 1. Amazon Pay Co-Brand Badge
    if (preset.id === 'amazon_pay_icici' || labelLower.includes('amazon')) {
      return (
        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-amber-500/40 shadow-sm">
          <span className="text-[10px] font-bold text-white tracking-tight lowercase">
            amazon<span className="text-[#ff9900] font-black ml-0.5">pay</span>
          </span>
          <svg
            className="w-2.5 h-1.5 text-[#ff9900] inline-block -mb-0.5"
            viewBox="0 0 12 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M1 2.5 Q 6 6.5, 11 1.5" />
            <path d="M9 1.5 L 11 1.5 L 10.5 3.5" />
          </svg>
        </div>
      );
    }

    // 2. Swiggy Co-Brand Badge
    if (preset.id === 'hdfc_swiggy' || labelLower.includes('swiggy')) {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/30 shadow-sm">
          <div className="w-3.5 h-3.5 rounded-full bg-[#fc8019] border border-white/40 flex items-center justify-center text-[7.5px] font-black text-white shadow-xs">
            S
          </div>
          <span className="text-[9px] font-black tracking-wider uppercase text-white drop-shadow-xs">
            SWIGGY
          </span>
        </div>
      );
    }

    // 3. General Co-Brand Badge
    return (
      <div className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-wider text-white shadow-xs drop-shadow-xs">
        {preset.badgeLabel}
      </div>
    );
  };

  const backgroundGradient = card.customGradientFrom && card.customGradientTo
    ? `linear-gradient(135deg, ${card.customGradientFrom} 0%, #0d1527 60%, ${card.customGradientTo} 100%)`
    : `linear-gradient(${preset.gradient.angle || '135deg'}, ${preset.gradient.from} 0%, ${preset.gradient.via || '#0d1527'} 55%, ${preset.gradient.to} 100%)`;

  return (
    <div
      id={card.id ? `credit-card-visual-${card.id}` : 'credit-card-visual-preview'}
      onClick={onClick}
      className={cn(
        'group relative w-full aspect-[1.586/1] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 overflow-hidden border border-white/15 shadow-2xl transition-all duration-300 select-none flex flex-col justify-between',
        onClick && 'cursor-pointer hover:scale-[1.015] hover:shadow-cyan-950/40 active:scale-[0.99]',
        className
      )}
      style={{
        background: backgroundGradient,
        color: preset.textColor || '#ffffff',
      }}
    >
      {/* Background patterns and luster highlights */}
      {renderBackgroundPattern()}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-black/40 rounded-full blur-xl pointer-events-none" />

      {/* Top Header: Issuer Emblem + Co-brand Badge */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {renderIssuerEmblem()}
        </div>

        {/* Co-branded / Card variant badge */}
        {renderCoBrandBadge()}
      </div>

      {/* Card Variant Name */}
      <div className="relative z-10 my-0.5">
        <h4 className="text-xs sm:text-sm font-extrabold tracking-tight truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] font-heading">
          {cardName}
        </h4>
        <span
          className="text-[9px] sm:text-[10px] block -mt-0.5 truncate font-semibold drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]"
          style={{ color: preset.subtextColor || 'rgba(255,255,255,0.85)' }}
        >
          {preset.variantName || 'Credit Card'}
        </span>
      </div>

      {/* Center Row: EMV Chip + Contactless Wave */}
      <div className="relative z-10 flex items-center justify-between my-0.5 sm:my-1">
        <div className="flex items-center gap-2 sm:gap-2.5">
          {renderEmvChip()}
          <Wifi className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80 rotate-90 drop-shadow-xs" />
        </div>

        {/* Masked Card Number */}
        <div className="font-mono text-xs sm:text-sm tracking-widest text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] font-bold">
          •••• <span className="font-black text-white">{lastFour}</span>
        </div>
      </div>

      {/* Bottom Row: Cardholder Name + Expiry + Network Logo */}
      <div className="relative z-10 flex items-end justify-between gap-2 pt-1 border-t border-white/15">
        <div className="min-w-0">
          <span className="text-[7px] sm:text-[8px] uppercase tracking-wider text-white/70 block font-bold drop-shadow-xs">
            Cardholder
          </span>
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider truncate block text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {cardholder}
          </span>
        </div>

        {showDetails && (
          <div className="text-center px-1">
            <span className="text-[7px] sm:text-[8px] uppercase tracking-wider text-white/70 block font-bold drop-shadow-xs">
              Valid Thru
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {expiry}
            </span>
          </div>
        )}

        <div className="flex items-center justify-end flex-shrink-0 drop-shadow-xs">
          {renderNetworkLogo()}
        </div>
      </div>
    </div>
  );
};

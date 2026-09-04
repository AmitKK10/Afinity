/**
 * Credit Card Visual Presets and Themes Registry (Step 6B)
 * Provides authentic, offline-first vector & CSS representations of major Indian credit cards.
 */

import { CardVisualPreset, CreditCard } from '../types';

export const CARD_VISUAL_PRESETS: Record<string, CardVisualPreset> = {
  // ==========================================
  // === 1. SBI CARDS (State Bank of India) ===
  // ==========================================
  sbi_cashback: {
    id: 'sbi_cashback',
    issuer: 'SBI Card',
    cardName: 'SBI Cashback',
    variantName: 'Cashback 5% Online',
    defaultNetwork: 'visa',
    category: 'cashback',
    gradient: {
      from: '#051937',
      via: '#004d7a',
      to: '#008793',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#67e8f9',
    accentColor: '#00c6ff',
    emblemType: 'sbi',
    patternType: 'stripes',
    chipColor: 'gold',
    badgeLabel: '5% CASHBACK',
  },
  sbi_simplyclick: {
    id: 'sbi_simplyclick',
    issuer: 'SBI Card',
    cardName: 'SBI SimplyCLICK',
    variantName: 'SimplyCLICK 10X Rewards',
    defaultNetwork: 'visa',
    category: 'shopping',
    gradient: {
      from: '#0f172a',
      via: '#1e3a8a',
      to: '#0284c7',
      angle: '140deg',
    },
    textColor: '#ffffff',
    subtextColor: '#93c5fd',
    accentColor: '#38bdf8',
    emblemType: 'sbi',
    patternType: 'dots',
    chipColor: 'gold',
    badgeLabel: 'SIMPLYCLICK',
  },
  sbi_simplysave: {
    id: 'sbi_simplysave',
    issuer: 'SBI Card',
    cardName: 'SBI SimplySAVE',
    variantName: 'SimplySAVE Dining & Grocery',
    defaultNetwork: 'rupay',
    category: 'rewards',
    gradient: {
      from: '#3b0712',
      via: '#7f1d1d',
      to: '#991b1b',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fca5a5',
    accentColor: '#ef4444',
    emblemType: 'sbi',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'SIMPLYSAVE',
  },
  sbi_bpcl_octane: {
    id: 'sbi_bpcl_octane',
    issuer: 'SBI Card',
    cardName: 'BPCL SBI Card Octane',
    variantName: 'Octane 7.25% Fuel',
    defaultNetwork: 'rupay',
    category: 'fuel',
    gradient: {
      from: '#064e3b',
      via: '#065f46',
      to: '#047857',
      angle: '130deg',
    },
    textColor: '#ffffff',
    subtextColor: '#6ee7b7',
    accentColor: '#10b981',
    emblemType: 'sbi',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'BPCL OCTANE',
  },
  sbi_elite: {
    id: 'sbi_elite',
    issuer: 'SBI Card',
    cardName: 'SBI Card ELITE',
    variantName: 'Elite Luxury Metal',
    defaultNetwork: 'visa',
    category: 'super_premium',
    gradient: {
      from: '#111827',
      via: '#1f2937',
      to: '#374151',
      angle: '145deg',
    },
    textColor: '#fef08a',
    subtextColor: '#d1d5db',
    accentColor: '#eab308',
    emblemType: 'sbi',
    patternType: 'brushed',
    chipColor: 'dark_gold',
    badgeLabel: 'ELITE',
  },
  sbi_prime: {
    id: 'sbi_prime',
    issuer: 'SBI Card',
    cardName: 'SBI Card PRIME',
    variantName: 'PRIME Lifestyle',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#0f172a',
      via: '#1e293b',
      to: '#1e3a8a',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#cbd5e1',
    accentColor: '#eab308',
    emblemType: 'sbi',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'PRIME',
  },
  sbi_aurum: {
    id: 'sbi_aurum',
    issuer: 'SBI Card',
    cardName: 'AURUM SBI Card',
    variantName: 'Ultra Luxury 24K Metal',
    defaultNetwork: 'mastercard',
    category: 'super_premium',
    gradient: {
      from: '#09090b',
      via: '#18181b',
      to: '#050505',
      angle: '140deg',
    },
    textColor: '#fef08a',
    subtextColor: '#ca8a04',
    accentColor: '#eab308',
    emblemType: 'sbi',
    patternType: 'brushed',
    chipColor: 'dark_gold',
    badgeLabel: 'AURUM',
  },
  sbi_phonepe_black: {
    id: 'sbi_phonepe_black',
    issuer: 'SBI Card',
    cardName: 'PhonePe SBI Card Black',
    variantName: 'PhonePe Black Select 10% Rewards',
    defaultNetwork: 'visa',
    category: 'cashback',
    gradient: {
      from: '#09090b',
      via: '#2e1065',
      to: '#581c87',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#d8b4fe',
    accentColor: '#a855f7',
    emblemType: 'phonepe',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'PHONEPE BLACK',
  },

  // ==========================================
  // === 2. HDFC BANK =========================
  // ==========================================
  hdfc_infinia: {
    id: 'hdfc_infinia',
    issuer: 'HDFC Bank',
    cardName: 'HDFC Infinia Metal',
    variantName: 'Infinia Metal Edition',
    defaultNetwork: 'visa',
    category: 'super_premium',
    gradient: {
      from: '#09090b',
      via: '#18181b',
      to: '#27272a',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#a1a1aa',
    accentColor: '#eab308',
    emblemType: 'hdfc',
    patternType: 'brushed',
    chipColor: 'dark_gold',
    badgeLabel: 'INFINIA METAL',
  },
  hdfc_regalia_gold: {
    id: 'hdfc_regalia_gold',
    issuer: 'HDFC Bank',
    cardName: 'HDFC Regalia Gold',
    variantName: 'Regalia Gold Edition',
    defaultNetwork: 'visa',
    category: 'travel',
    gradient: {
      from: '#2e0219',
      via: '#4a044e',
      to: '#18020c',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#f5d0fe',
    accentColor: '#eab308',
    emblemType: 'hdfc',
    patternType: 'gemstone',
    chipColor: 'dark_gold',
    badgeLabel: 'REGALIA GOLD',
  },
  hdfc_millennia: {
    id: 'hdfc_millennia',
    issuer: 'HDFC Bank',
    cardName: 'HDFC Millennia',
    variantName: 'Millennia 5% Cashback',
    defaultNetwork: 'mastercard',
    category: 'cashback',
    gradient: {
      from: '#1e1b4b',
      via: '#312e81',
      to: '#0e7490',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#a5f3fc',
    accentColor: '#22d3ee',
    emblemType: 'hdfc',
    patternType: 'geometric',
    chipColor: 'silver',
    badgeLabel: 'MILLENNIA',
  },
  hdfc_tata_neu_infinity: {
    id: 'hdfc_tata_neu_infinity',
    issuer: 'HDFC Bank',
    cardName: 'Tata Neu Infinity HDFC',
    variantName: 'Tata Neu Infinity 10% NeuCoins',
    defaultNetwork: 'rupay',
    category: 'shopping',
    gradient: {
      from: '#18181b',
      via: '#4a044e',
      to: '#701a75',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#f472b6',
    accentColor: '#d946ef',
    emblemType: 'hdfc',
    patternType: 'wave',
    chipColor: 'gold',
    badgeLabel: 'TATA NEU INFINITY',
  },
  hdfc_tata_neu_plus: {
    id: 'hdfc_tata_neu_plus',
    issuer: 'HDFC Bank',
    cardName: 'Tata Neu Plus HDFC',
    variantName: 'Tata Neu Plus 7% NeuCoins',
    defaultNetwork: 'rupay',
    category: 'shopping',
    gradient: {
      from: '#1c1917',
      via: '#3b0764',
      to: '#581c87',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#e9d5ff',
    accentColor: '#c084fc',
    emblemType: 'hdfc',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'TATA NEU PLUS',
  },
  hdfc_swiggy: {
    id: 'hdfc_swiggy',
    issuer: 'HDFC Bank',
    cardName: 'Swiggy HDFC Card',
    variantName: 'Swiggy 10% Cashback',
    defaultNetwork: 'mastercard',
    category: 'cashback',
    gradient: {
      from: '#f97316',
      via: '#ea580c',
      to: '#7c2d12',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#ffedd5',
    accentColor: '#fc8019',
    emblemType: 'hdfc',
    patternType: 'swiggy_ribbon',
    chipColor: 'silver',
    badgeLabel: 'SWIGGY',
  },
  hdfc_diners_black: {
    id: 'hdfc_diners_black',
    issuer: 'HDFC Bank',
    cardName: 'Diners Club Black',
    variantName: 'Diners Club Black Metal',
    defaultNetwork: 'diners',
    category: 'super_premium',
    gradient: {
      from: '#09090b',
      via: '#18181b',
      to: '#0f172a',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#94a3b8',
    accentColor: '#cbd5e1',
    emblemType: 'hdfc',
    patternType: 'brushed',
    chipColor: 'silver',
    badgeLabel: 'DINERS CLUB BLACK',
  },
  hdfc_moneyback: {
    id: 'hdfc_moneyback',
    issuer: 'HDFC Bank',
    cardName: 'HDFC MoneyBack+',
    variantName: 'MoneyBack+ 10X CashPoints',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#0f172a',
      via: '#1e3a8a',
      to: '#0284c7',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#93c5fd',
    accentColor: '#38bdf8',
    emblemType: 'hdfc',
    patternType: 'dots',
    chipColor: 'gold',
    badgeLabel: 'MONEYBACK+',
  },
  hdfc_rupay: {
    id: 'hdfc_rupay',
    issuer: 'HDFC Bank',
    cardName: 'HDFC UPI RuPay Card',
    variantName: 'Virtual UPI RuPay Credit Card',
    defaultNetwork: 'rupay',
    category: 'cashback',
    gradient: {
      from: '#0f172a',
      via: '#1e3a8a',
      to: '#065f46',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#93c5fd',
    accentColor: '#38bdf8',
    emblemType: 'hdfc',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'UPI RUPAY',
  },

  // ==========================================
  // === 3. ICICI BANK ========================
  // ==========================================
  amazon_pay_icici: {
    id: 'amazon_pay_icici',
    issuer: 'ICICI Bank',
    cardName: 'Amazon Pay ICICI',
    variantName: 'Amazon Pay 5% Unlimited',
    defaultNetwork: 'visa',
    category: 'cashback',
    gradient: {
      from: '#0d0f12',
      via: '#161922',
      to: '#090a0d',
      angle: '140deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fcd34d',
    accentColor: '#ff9900',
    emblemType: 'icici',
    patternType: 'amazon_arc',
    chipColor: 'gold',
    badgeLabel: 'amazon pay',
  },
  icici_sapphiro: {
    id: 'icici_sapphiro',
    issuer: 'ICICI Bank',
    cardName: 'ICICI Sapphiro',
    variantName: 'Sapphiro Premium',
    defaultNetwork: 'mastercard',
    category: 'super_premium',
    gradient: {
      from: '#0b132b',
      via: '#1c2541',
      to: '#3a506b',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#93c5fd',
    accentColor: '#60a5fa',
    emblemType: 'icici',
    patternType: 'gemstone',
    chipColor: 'silver',
    badgeLabel: 'SAPPHIRO',
  },
  icici_sapphiro_rupay: {
    id: 'icici_sapphiro_rupay',
    issuer: 'ICICI Bank',
    cardName: 'ICICI Sapphiro RuPay',
    variantName: 'Sapphiro UPI RuPay Edition',
    defaultNetwork: 'rupay',
    category: 'super_premium',
    gradient: {
      from: '#0b132b',
      via: '#1c2541',
      to: '#3a506b',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#93c5fd',
    accentColor: '#60a5fa',
    emblemType: 'icici',
    patternType: 'gemstone',
    chipColor: 'gold',
    badgeLabel: 'SAPPHIRO RUPAY',
  },
  icici_rubyx: {
    id: 'icici_rubyx',
    issuer: 'ICICI Bank',
    cardName: 'ICICI Rubyx',
    variantName: 'Rubyx Dual Card',
    defaultNetwork: 'mastercard',
    category: 'rewards',
    gradient: {
      from: '#3d0814',
      via: '#771026',
      to: '#9f1239',
      angle: '130deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fecdd3',
    accentColor: '#f43f5e',
    emblemType: 'icici',
    patternType: 'gemstone',
    chipColor: 'gold',
    badgeLabel: 'RUBYX',
  },
  icici_rubyx_amex: {
    id: 'icici_rubyx_amex',
    issuer: 'ICICI Bank',
    cardName: 'ICICI Rubyx Amex',
    variantName: 'Rubyx American Express Edition',
    defaultNetwork: 'amex',
    category: 'rewards',
    gradient: {
      from: '#3d0814',
      via: '#771026',
      to: '#9f1239',
      angle: '130deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fecdd3',
    accentColor: '#f43f5e',
    emblemType: 'icici',
    patternType: 'gemstone',
    chipColor: 'gold',
    badgeLabel: 'RUBYX AMEX',
  },
  icici_rubyx_mastercard: {
    id: 'icici_rubyx_mastercard',
    issuer: 'ICICI Bank',
    cardName: 'ICICI Rubyx Mastercard',
    variantName: 'Rubyx Mastercard Edition',
    defaultNetwork: 'mastercard',
    category: 'rewards',
    gradient: {
      from: '#4c0519',
      via: '#881337',
      to: '#be123c',
      angle: '130deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fecdd3',
    accentColor: '#f43f5e',
    emblemType: 'icici',
    patternType: 'gemstone',
    chipColor: 'gold',
    badgeLabel: 'RUBYX MC',
  },
  icici_hpcl_super_saver: {
    id: 'icici_hpcl_super_saver',
    issuer: 'ICICI Bank',
    cardName: 'ICICI HPCL Super Saver',
    variantName: 'HPCL Super Saver 5% Fuel Savings',
    defaultNetwork: 'visa',
    category: 'fuel',
    gradient: {
      from: '#18181b',
      via: '#1e3a8a',
      to: '#ea580c',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fed7aa',
    accentColor: '#f97316',
    emblemType: 'icici',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'HPCL SUPER SAVER',
  },
  icici_coral: {
    id: 'icici_coral',
    issuer: 'ICICI Bank',
    cardName: 'ICICI Coral',
    variantName: 'Coral RuPay / Visa',
    defaultNetwork: 'rupay',
    category: 'rewards',
    gradient: {
      from: '#58151c',
      via: '#881337',
      to: '#991b1b',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fca5a5',
    accentColor: '#ef4444',
    emblemType: 'icici',
    patternType: 'dots',
    chipColor: 'gold',
    badgeLabel: 'CORAL',
  },
  icici_emeralde: {
    id: 'icici_emeralde',
    issuer: 'ICICI Bank',
    cardName: 'ICICI Emeralde',
    variantName: 'Emeralde Private Metal',
    defaultNetwork: 'mastercard',
    category: 'super_premium',
    gradient: {
      from: '#022c22',
      via: '#064e3b',
      to: '#047857',
      angle: '140deg',
    },
    textColor: '#fef08a',
    subtextColor: '#6ee7b7',
    accentColor: '#10b981',
    emblemType: 'icici',
    patternType: 'gemstone',
    chipColor: 'dark_gold',
    badgeLabel: 'EMERALDE',
  },
  icici_platinum: {
    id: 'icici_platinum',
    issuer: 'ICICI Bank',
    cardName: 'ICICI Platinum Chip',
    variantName: 'Platinum Chip Lifetime Free',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#1e293b',
      via: '#334155',
      to: '#475569',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#cbd5e1',
    accentColor: '#94a3b8',
    emblemType: 'icici',
    patternType: 'geometric',
    chipColor: 'silver',
    badgeLabel: 'PLATINUM CHIP',
  },
  icici_makemytrip: {
    id: 'icici_makemytrip',
    issuer: 'ICICI Bank',
    cardName: 'MakeMyTrip ICICI',
    variantName: 'MakeMyTrip Signature',
    defaultNetwork: 'mastercard',
    category: 'travel',
    gradient: {
      from: '#0f172a',
      via: '#1e3a8a',
      to: '#e11d48',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fda4af',
    accentColor: '#f43f5e',
    emblemType: 'icici',
    patternType: 'wave',
    chipColor: 'gold',
    badgeLabel: 'MakeMyTrip',
  },

  // ==========================================
  // === 4. AXIS BANK =========================
  // ==========================================
  axis_airtel: {
    id: 'axis_airtel',
    issuer: 'Axis Bank',
    cardName: 'Airtel Axis Bank Card',
    variantName: 'Airtel 25% Utility Cashback',
    defaultNetwork: 'mastercard',
    category: 'cashback',
    gradient: {
      from: '#1e1b4b',
      via: '#4c0519',
      to: '#881337',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fca5a5',
    accentColor: '#e11d48',
    emblemType: 'axis',
    patternType: 'wave',
    chipColor: 'gold',
    badgeLabel: 'airtel',
  },
  axis_magnus: {
    id: 'axis_magnus',
    issuer: 'Axis Bank',
    cardName: 'Axis Magnus',
    variantName: 'Magnus Burgundy',
    defaultNetwork: 'mastercard',
    category: 'super_premium',
    gradient: {
      from: '#18181b',
      via: '#4c0519',
      to: '#1c1917',
      angle: '140deg',
    },
    textColor: '#fef08a',
    subtextColor: '#fda4af',
    accentColor: '#eab308',
    emblemType: 'axis',
    patternType: 'gemstone',
    chipColor: 'dark_gold',
    badgeLabel: 'MAGNUS',
  },
  axis_atlas: {
    id: 'axis_atlas',
    issuer: 'Axis Bank',
    cardName: 'Axis Bank Atlas',
    variantName: 'Atlas Travel & Miles',
    defaultNetwork: 'visa',
    category: 'travel',
    gradient: {
      from: '#0b132b',
      via: '#1c2541',
      to: '#1e293b',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#cbd5e1',
    accentColor: '#eab308',
    emblemType: 'axis',
    patternType: 'geometric',
    chipColor: 'dark_gold',
    badgeLabel: 'ATLAS',
  },
  axis_flipkart: {
    id: 'axis_flipkart',
    issuer: 'Axis Bank',
    cardName: 'Flipkart Axis Bank',
    variantName: 'Flipkart 5% Unlimited',
    defaultNetwork: 'visa',
    category: 'shopping',
    gradient: {
      from: '#0f172a',
      via: '#1e3a8a',
      to: '#0284c7',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fef08a',
    accentColor: '#2874f0',
    emblemType: 'axis',
    patternType: 'stripes',
    chipColor: 'gold',
    badgeLabel: 'Flipkart',
  },
  axis_ace: {
    id: 'axis_ace',
    issuer: 'Axis Bank',
    cardName: 'Axis ACE',
    variantName: 'ACE 2% Unlimited Cashback',
    defaultNetwork: 'visa',
    category: 'cashback',
    gradient: {
      from: '#022c22',
      via: '#065f46',
      to: '#047857',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#6ee7b7',
    accentColor: '#10b981',
    emblemType: 'axis',
    patternType: 'dots',
    chipColor: 'gold',
    badgeLabel: 'ACE',
  },
  axis_neo: {
    id: 'axis_neo',
    issuer: 'Axis Bank',
    cardName: 'Axis Neo',
    variantName: 'Neo Lifestyle Card',
    defaultNetwork: 'mastercard',
    category: 'rewards',
    gradient: {
      from: '#083344',
      via: '#0e7490',
      to: '#065f46',
      angle: '130deg',
    },
    textColor: '#ffffff',
    subtextColor: '#a5f3fc',
    accentColor: '#06b6d4',
    emblemType: 'axis',
    patternType: 'geometric',
    chipColor: 'silver',
    badgeLabel: 'NEO',
  },
  axis_myzone: {
    id: 'axis_myzone',
    issuer: 'Axis Bank',
    cardName: 'Axis My Zone',
    variantName: 'My Zone Entertainment & SonyLIV',
    defaultNetwork: 'rupay',
    category: 'rewards',
    gradient: {
      from: '#2e1065',
      via: '#4c1d95',
      to: '#701a75',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#f5d0fe',
    accentColor: '#d946ef',
    emblemType: 'axis',
    patternType: 'wave',
    chipColor: 'gold',
    badgeLabel: 'MY ZONE',
  },
  axis_select: {
    id: 'axis_select',
    issuer: 'Axis Bank',
    cardName: 'Axis Select',
    variantName: 'Select Premium Lifestyle',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#0f172a',
      via: '#1e293b',
      to: '#312e81',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#cbd5e1',
    accentColor: '#eab308',
    emblemType: 'axis',
    patternType: 'geometric',
    chipColor: 'dark_gold',
    badgeLabel: 'SELECT',
  },

  // ==========================================
  // === 5. KOTAK MAHINDRA BANK ===============
  // ==========================================
  kotak_white: {
    id: 'kotak_white',
    issuer: 'Kotak Mahindra Bank',
    cardName: 'Kotak White Reserve',
    variantName: 'White Luxury Edition',
    defaultNetwork: 'visa',
    category: 'super_premium',
    gradient: {
      from: '#f8fafc',
      via: '#e2e8f0',
      to: '#cbd5e1',
      angle: '135deg',
    },
    textColor: '#0f172a',
    subtextColor: '#475569',
    accentColor: '#dc2626',
    emblemType: 'kotak',
    patternType: 'minimal',
    chipColor: 'silver',
    badgeLabel: 'WHITE',
  },
  kotak_league: {
    id: 'kotak_league',
    issuer: 'Kotak Mahindra Bank',
    cardName: 'Kotak League Platinum',
    variantName: 'League RuPay / Visa',
    defaultNetwork: 'rupay',
    category: 'rewards',
    gradient: {
      from: '#1e1b4b',
      via: '#1e3a8a',
      to: '#7f1d1d',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#cbd5e1',
    accentColor: '#ef4444',
    emblemType: 'kotak',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'LEAGUE',
  },
  kotak_mojo: {
    id: 'kotak_mojo',
    issuer: 'Kotak Mahindra Bank',
    cardName: 'Kotak Mojo Platinum',
    variantName: 'Mojo Travel & Lounge',
    defaultNetwork: 'visa',
    category: 'travel',
    gradient: {
      from: '#0f172a',
      via: '#18181b',
      to: '#022c22',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#86efac',
    accentColor: '#22c55e',
    emblemType: 'kotak',
    patternType: 'geometric',
    chipColor: 'silver',
    badgeLabel: 'MOJO',
  },
  kotak_zen: {
    id: 'kotak_zen',
    issuer: 'Kotak Mahindra Bank',
    cardName: 'Kotak Zen Signature',
    variantName: 'Zen Signature Rewards',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#1e293b',
      via: '#334155',
      to: '#1e1b4b',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#cbd5e1',
    accentColor: '#94a3b8',
    emblemType: 'kotak',
    patternType: 'brushed',
    chipColor: 'silver',
    badgeLabel: 'ZEN SIGNATURE',
  },
  kotak_811: {
    id: 'kotak_811',
    issuer: 'Kotak Mahindra Bank',
    cardName: 'Kotak 811 Dream Different',
    variantName: '811 Credit Card against FD',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#450a0a',
      via: '#7f1d1d',
      to: '#991b1b',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fca5a5',
    accentColor: '#ef4444',
    emblemType: 'kotak',
    patternType: 'dots',
    chipColor: 'gold',
    badgeLabel: '811 DREAM',
  },

  // ==========================================
  // === 6. AMERICAN EXPRESS ==================
  // ==========================================
  amex_platinum_metal: {
    id: 'amex_platinum_metal',
    issuer: 'American Express',
    cardName: 'Amex The Platinum Card',
    variantName: 'Centurion Metal Edition',
    defaultNetwork: 'amex',
    category: 'super_premium',
    gradient: {
      from: '#334155',
      via: '#64748b',
      to: '#475569',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#e2e8f0',
    accentColor: '#00a4e4',
    emblemType: 'amex',
    patternType: 'brushed',
    chipColor: 'silver',
    badgeLabel: 'PLATINUM',
  },
  amex_platinum_travel: {
    id: 'amex_platinum_travel',
    issuer: 'American Express',
    cardName: 'Amex Platinum Travel',
    variantName: 'Platinum Travel 48K Taj Points',
    defaultNetwork: 'amex',
    category: 'travel',
    gradient: {
      from: '#1e293b',
      via: '#334155',
      to: '#475569',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#cbd5e1',
    accentColor: '#00a4e4',
    emblemType: 'amex',
    patternType: 'brushed',
    chipColor: 'silver',
    badgeLabel: 'AMERICAN EXPRESS',
  },
  amex_mrcc: {
    id: 'amex_mrcc',
    issuer: 'American Express',
    cardName: 'Amex MRCC',
    variantName: 'Membership Rewards Credit Card',
    defaultNetwork: 'amex',
    category: 'rewards',
    gradient: {
      from: '#451a03',
      via: '#78350f',
      to: '#ca8a04',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fef08a',
    accentColor: '#eab308',
    emblemType: 'amex',
    patternType: 'geometric',
    chipColor: 'dark_gold',
    badgeLabel: 'MEMBERSHIP REWARDS',
  },
  amex_smartearn: {
    id: 'amex_smartearn',
    issuer: 'American Express',
    cardName: 'Amex SmartEarn',
    variantName: 'SmartEarn 10X Multipliers',
    defaultNetwork: 'amex',
    category: 'cashback',
    gradient: {
      from: '#0f172a',
      via: '#1e3a8a',
      to: '#2563eb',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#93c5fd',
    accentColor: '#38bdf8',
    emblemType: 'amex',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'SMARTEARN',
  },
  amex_gold: {
    id: 'amex_gold',
    issuer: 'American Express',
    cardName: 'Amex Gold Card',
    variantName: 'Gold Charge Card',
    defaultNetwork: 'amex',
    category: 'rewards',
    gradient: {
      from: '#713f12',
      via: '#a16207',
      to: '#eab308',
      angle: '135deg',
    },
    textColor: '#09090b',
    subtextColor: '#451a03',
    accentColor: '#ca8a04',
    emblemType: 'amex',
    patternType: 'gemstone',
    chipColor: 'dark_gold',
    badgeLabel: 'GOLD CARD',
  },

  // ==========================================
  // === 7. ONECARD ===========================
  // ==========================================
  onecard_metal: {
    id: 'onecard_metal',
    issuer: 'OneCard / Federal Bank',
    cardName: 'OneCard Metal',
    variantName: 'Metal 5X Rewards',
    defaultNetwork: 'visa',
    category: 'super_premium',
    gradient: {
      from: '#09090b',
      via: '#18181b',
      to: '#111827',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#94a3b8',
    accentColor: '#38bdf8',
    emblemType: 'onecard',
    patternType: 'minimal',
    chipColor: 'silver',
    badgeLabel: 'onecard',
  },

  // ==========================================
  // === 8. IDFC FIRST BANK ===================
  // ==========================================
  idfc_first_wealth: {
    id: 'idfc_first_wealth',
    issuer: 'IDFC FIRST Bank',
    cardName: 'IDFC FIRST Wealth',
    variantName: 'Wealth Lifetime Free',
    defaultNetwork: 'visa',
    category: 'super_premium',
    gradient: {
      from: '#1e1b4b',
      via: '#312e81',
      to: '#581c87',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#e9d5ff',
    accentColor: '#c026d3',
    emblemType: 'idfc',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'FIRST WEALTH',
  },
  idfc_first_select: {
    id: 'idfc_first_select',
    issuer: 'IDFC FIRST Bank',
    cardName: 'IDFC FIRST Select',
    variantName: 'Select Premium LTF',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#3b0712',
      via: '#581c87',
      to: '#701a75',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#f5d0fe',
    accentColor: '#eab308',
    emblemType: 'idfc',
    patternType: 'gemstone',
    chipColor: 'gold',
    badgeLabel: 'FIRST SELECT',
  },
  idfc_first_millennia: {
    id: 'idfc_first_millennia',
    issuer: 'IDFC FIRST Bank',
    cardName: 'IDFC FIRST Millennia',
    variantName: 'Millennia LTF 10X Rewards',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#1e1b4b',
      via: '#4338ca',
      to: '#06b6d4',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#a5f3fc',
    accentColor: '#22d3ee',
    emblemType: 'idfc',
    patternType: 'geometric',
    chipColor: 'silver',
    badgeLabel: 'FIRST MILLENNIA',
  },
  idfc_first_classic: {
    id: 'idfc_first_classic',
    issuer: 'IDFC FIRST Bank',
    cardName: 'IDFC FIRST Classic',
    variantName: 'Classic Lifetime Free',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#0f172a',
      via: '#1e3a8a',
      to: '#c2410c',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fed7aa',
    accentColor: '#f97316',
    emblemType: 'idfc',
    patternType: 'stripes',
    chipColor: 'gold',
    badgeLabel: 'FIRST CLASSIC',
  },
  idfc_first_swyp: {
    id: 'idfc_first_swyp',
    issuer: 'IDFC FIRST Bank',
    cardName: 'IDFC FIRST SWYP',
    variantName: 'SWYP Youth & EMI Card',
    defaultNetwork: 'mastercard',
    category: 'shopping',
    gradient: {
      from: '#312e81',
      via: '#701a75',
      to: '#f43f5e',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fecdd3',
    accentColor: '#fb7185',
    emblemType: 'idfc',
    patternType: 'wave',
    chipColor: 'silver',
    badgeLabel: 'SWYP',
  },
  idfc_club_vistara: {
    id: 'idfc_club_vistara',
    issuer: 'IDFC FIRST Bank',
    cardName: 'Club Vistara IDFC FIRST',
    variantName: 'Vistara Travel Platinum',
    defaultNetwork: 'mastercard',
    category: 'travel',
    gradient: {
      from: '#2e1065',
      via: '#4a044e',
      to: '#18020c',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#f5d0fe',
    accentColor: '#eab308',
    emblemType: 'idfc',
    patternType: 'gemstone',
    chipColor: 'dark_gold',
    badgeLabel: 'CLUB VISTARA',
  },

  // ==========================================
  // === 9. INDUSIND BANK =====================
  // ==========================================
  indusind_legend: {
    id: 'indusind_legend',
    issuer: 'IndusInd Bank',
    cardName: 'IndusInd Legend',
    variantName: 'Legend Lifetime Free',
    defaultNetwork: 'visa',
    category: 'super_premium',
    gradient: {
      from: '#18181b',
      via: '#27272a',
      to: '#3f3f46',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#d4d4d8',
    accentColor: '#eab308',
    emblemType: 'indusind',
    patternType: 'brushed',
    chipColor: 'dark_gold',
    badgeLabel: 'LEGEND',
  },
  indusind_pinnacle: {
    id: 'indusind_pinnacle',
    issuer: 'IndusInd Bank',
    cardName: 'IndusInd Pinnacle',
    variantName: 'Pinnacle Super Luxury',
    defaultNetwork: 'mastercard',
    category: 'super_premium',
    gradient: {
      from: '#09090b',
      via: '#1c1917',
      to: '#292524',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#d6d3d1',
    accentColor: '#eab308',
    emblemType: 'indusind',
    patternType: 'gemstone',
    chipColor: 'dark_gold',
    badgeLabel: 'PINNACLE',
  },
  indusind_tiger: {
    id: 'indusind_tiger',
    issuer: 'IndusInd Bank',
    cardName: 'IndusInd Tiger Card',
    variantName: 'Tiger Rewards & Lounge',
    defaultNetwork: 'mastercard',
    category: 'rewards',
    gradient: {
      from: '#1c1917',
      via: '#451a03',
      to: '#78350f',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fed7aa',
    accentColor: '#f97316',
    emblemType: 'indusind',
    patternType: 'stripes',
    chipColor: 'gold',
    badgeLabel: 'TIGER',
  },
  indusind_platinum_aura: {
    id: 'indusind_platinum_aura',
    issuer: 'IndusInd Bank',
    cardName: 'IndusInd Platinum Aura',
    variantName: 'Platinum Aura Edge',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#1e293b',
      via: '#1e3a8a',
      to: '#3b82f6',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#93c5fd',
    accentColor: '#60a5fa',
    emblemType: 'indusind',
    patternType: 'geometric',
    chipColor: 'silver',
    badgeLabel: 'PLATINUM AURA',
  },
  indusind_nexxt: {
    id: 'indusind_nexxt',
    issuer: 'IndusInd Bank',
    cardName: 'IndusInd Nexxt',
    variantName: 'Nexxt Interactive LED Card',
    defaultNetwork: 'mastercard',
    category: 'shopping',
    gradient: {
      from: '#0f172a',
      via: '#0284c7',
      to: '#0369a1',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#bae6fd',
    accentColor: '#38bdf8',
    emblemType: 'indusind',
    patternType: 'dots',
    chipColor: 'silver',
    badgeLabel: 'NEXXT',
  },

  // ==========================================
  // === 10. RBL BANK =========================
  // ==========================================
  rbl_world_safari: {
    id: 'rbl_world_safari',
    issuer: 'RBL Bank',
    cardName: 'RBL World Safari',
    variantName: 'World Safari 0% Forex',
    defaultNetwork: 'mastercard',
    category: 'travel',
    gradient: {
      from: '#052e16',
      via: '#065f46',
      to: '#14532d',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#bbf7d0',
    accentColor: '#eab308',
    emblemType: 'rbl',
    patternType: 'geometric',
    chipColor: 'dark_gold',
    badgeLabel: 'WORLD SAFARI',
  },
  rbl_shoprite: {
    id: 'rbl_shoprite',
    issuer: 'RBL Bank',
    cardName: 'RBL ShopRite',
    variantName: 'ShopRite Grocery 5% Cashback',
    defaultNetwork: 'mastercard',
    category: 'shopping',
    gradient: {
      from: '#450a0a',
      via: '#7f1d1d',
      to: '#b91c1c',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fecaca',
    accentColor: '#ef4444',
    emblemType: 'rbl',
    patternType: 'stripes',
    chipColor: 'gold',
    badgeLabel: 'SHOPRITE',
  },
  rbl_play: {
    id: 'rbl_play',
    issuer: 'RBL Bank',
    cardName: 'RBL Play BookMyShow',
    variantName: 'Play Cinema & Entertainment',
    defaultNetwork: 'mastercard',
    category: 'rewards',
    gradient: {
      from: '#09090b',
      via: '#18181b',
      to: '#881337',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fecdd3',
    accentColor: '#e11d48',
    emblemType: 'rbl',
    patternType: 'wave',
    chipColor: 'silver',
    badgeLabel: 'PLAY',
  },
  rbl_popcorn: {
    id: 'rbl_popcorn',
    issuer: 'RBL Bank',
    cardName: 'RBL Popcorn Card',
    variantName: 'Popcorn Movie Rewards',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#1c1917',
      via: '#450a0a',
      to: '#78350f',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fef08a',
    accentColor: '#f59e0b',
    emblemType: 'rbl',
    patternType: 'dots',
    chipColor: 'gold',
    badgeLabel: 'POPCORN',
  },
  rbl_bankbazaar_savemax_pro: {
    id: 'rbl_bankbazaar_savemax_pro',
    issuer: 'RBL Bank',
    cardName: 'RBL BankBazaar SaveMax Pro',
    variantName: 'SaveMax Pro 5X Cashback & Fuel',
    defaultNetwork: 'mastercard',
    category: 'cashback',
    gradient: {
      from: '#0f172a',
      via: '#1e3a8a',
      to: '#c2410c',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fed7aa',
    accentColor: '#f97316',
    emblemType: 'rbl',
    patternType: 'stripes',
    chipColor: 'gold',
    badgeLabel: 'SAVEMAX PRO',
  },

  // ==========================================
  // === 11. FEDERAL BANK =====================
  // ==========================================
  federal_celesta: {
    id: 'federal_celesta',
    issuer: 'Federal Bank',
    cardName: 'Federal Bank Celesta',
    variantName: 'Celesta Super Luxury',
    defaultNetwork: 'visa',
    category: 'super_premium',
    gradient: {
      from: '#3b0712',
      via: '#581c87',
      to: '#450a0a',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#f5d0fe',
    accentColor: '#eab308',
    emblemType: 'federal',
    patternType: 'gemstone',
    chipColor: 'dark_gold',
    badgeLabel: 'CELESTA',
  },
  federal_imperio: {
    id: 'federal_imperio',
    issuer: 'Federal Bank',
    cardName: 'Federal Bank Imperio',
    variantName: 'Imperio Executive',
    defaultNetwork: 'mastercard',
    category: 'rewards',
    gradient: {
      from: '#0f172a',
      via: '#1e3a8a',
      to: '#172554',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#93c5fd',
    accentColor: '#38bdf8',
    emblemType: 'federal',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'IMPERIO',
  },
  federal_signet: {
    id: 'federal_signet',
    issuer: 'Federal Bank',
    cardName: 'Federal Bank Signet',
    variantName: 'Signet Lifestyle Card',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#022c22',
      via: '#064e3b',
      to: '#047857',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#6ee7b7',
    accentColor: '#10b981',
    emblemType: 'federal',
    patternType: 'stripes',
    chipColor: 'gold',
    badgeLabel: 'SIGNET',
  },
  federal_scapia: {
    id: 'federal_scapia',
    issuer: 'Federal Bank',
    cardName: 'Scapia Federal Card',
    variantName: 'Scapia 0% Forex Travel',
    defaultNetwork: 'visa',
    category: 'travel',
    gradient: {
      from: '#042f2e',
      via: '#0f766e',
      to: '#115e59',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#99f6e4',
    accentColor: '#2dd4bf',
    emblemType: 'scapia',
    patternType: 'geometric',
    chipColor: 'silver',
    badgeLabel: 'scapia',
  },
  federal_fi: {
    id: 'federal_fi',
    issuer: 'Federal Bank',
    cardName: 'Fi Federal Card',
    variantName: 'Fi Money Rewards',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#064e3b',
      via: '#0f172a',
      to: '#022c22',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#86efac',
    accentColor: '#22c55e',
    emblemType: 'fi',
    patternType: 'minimal',
    chipColor: 'silver',
    badgeLabel: 'fi',
  },

  // ==========================================
  // === 12. YES BANK =========================
  // ==========================================
  yes_marquee: {
    id: 'yes_marquee',
    issuer: 'Yes Bank',
    cardName: 'Yes Marquee',
    variantName: 'Marquee Super Luxury Metal',
    defaultNetwork: 'visa',
    category: 'super_premium',
    gradient: {
      from: '#09090b',
      via: '#18181b',
      to: '#27272a',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#d4d4d8',
    accentColor: '#eab308',
    emblemType: 'yes',
    patternType: 'brushed',
    chipColor: 'dark_gold',
    badgeLabel: 'MARQUEE',
  },
  yes_reserv: {
    id: 'yes_reserv',
    issuer: 'Yes Bank',
    cardName: 'Yes Reserv',
    variantName: 'Reserv Premium Rewards',
    defaultNetwork: 'mastercard',
    category: 'super_premium',
    gradient: {
      from: '#0f172a',
      via: '#1e3a8a',
      to: '#1e1b4b',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#93c5fd',
    accentColor: '#38bdf8',
    emblemType: 'yes',
    patternType: 'gemstone',
    chipColor: 'gold',
    badgeLabel: 'RESERV',
  },
  yes_prosperity: {
    id: 'yes_prosperity',
    issuer: 'Yes Bank',
    cardName: 'Yes Prosperity Edge',
    variantName: 'Prosperity Lifestyle Card',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#1e1b4b',
      via: '#1d4ed8',
      to: '#0284c7',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#bae6fd',
    accentColor: '#38bdf8',
    emblemType: 'yes',
    patternType: 'geometric',
    chipColor: 'silver',
    badgeLabel: 'PROSPERITY',
  },
  yes_byoc: {
    id: 'yes_byoc',
    issuer: 'Yes Bank',
    cardName: 'Yes BYOC Card',
    variantName: 'Build Your Own Card',
    defaultNetwork: 'mastercard',
    category: 'shopping',
    gradient: {
      from: '#312e81',
      via: '#701a75',
      to: '#0284c7',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#f5d0fe',
    accentColor: '#e879f9',
    emblemType: 'yes',
    patternType: 'wave',
    chipColor: 'silver',
    badgeLabel: 'BYOC',
  },
  yes_bankbazaar_finbooster: {
    id: 'yes_bankbazaar_finbooster',
    issuer: 'Yes Bank',
    cardName: 'YES Bank FinBooster',
    variantName: 'BankBazaar FinBooster Credit Builder',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#1e1b4b',
      via: '#312e81',
      to: '#1d4ed8',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#93c5fd',
    accentColor: '#60a5fa',
    emblemType: 'yes',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'FINBOOSTER',
  },
  yes_rupay_virtual: {
    id: 'yes_rupay_virtual',
    issuer: 'Yes Bank',
    cardName: 'YES Bank RuPay Credit Card',
    variantName: 'Virtual UPI RuPay Credit Card',
    defaultNetwork: 'rupay',
    category: 'cashback',
    gradient: {
      from: '#09090b',
      via: '#1e3a8a',
      to: '#047857',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#86efac',
    accentColor: '#22c55e',
    emblemType: 'yes',
    patternType: 'dots',
    chipColor: 'gold',
    badgeLabel: 'YES RUPAY',
  },

  // ==========================================
  // === 13. BANK OF BARODA (BOB CARD) ========
  // ==========================================
  bob_eterna: {
    id: 'bob_eterna',
    issuer: 'Bank of Baroda',
    cardName: 'BOB Eterna',
    variantName: 'Eterna Luxury Rewards',
    defaultNetwork: 'visa',
    category: 'super_premium',
    gradient: {
      from: '#09090b',
      via: '#1c1917',
      to: '#3b2d12',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#fef3c7',
    accentColor: '#eab308',
    emblemType: 'bob',
    patternType: 'gemstone',
    chipColor: 'dark_gold',
    badgeLabel: 'ETERNA',
  },
  bob_premier: {
    id: 'bob_premier',
    issuer: 'Bank of Baroda',
    cardName: 'BOB Premier',
    variantName: 'Premier Travel & Dining',
    defaultNetwork: 'rupay',
    category: 'rewards',
    gradient: {
      from: '#3b0712',
      via: '#7f1d1d',
      to: '#78350f',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fecaca',
    accentColor: '#f97316',
    emblemType: 'bob',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'PREMIER',
  },
  bob_select: {
    id: 'bob_select',
    issuer: 'Bank of Baroda',
    cardName: 'BOB Select',
    variantName: 'Select Shopping Card',
    defaultNetwork: 'visa',
    category: 'shopping',
    gradient: {
      from: '#0f172a',
      via: '#1e3a8a',
      to: '#c2410c',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fed7aa',
    accentColor: '#ea580c',
    emblemType: 'bob',
    patternType: 'stripes',
    chipColor: 'gold',
    badgeLabel: 'SELECT',
  },
  bob_hpcl_energie: {
    id: 'bob_hpcl_energie',
    issuer: 'Bank of Baroda',
    cardName: 'HPCL BoB ENERGIE',
    variantName: 'HPCL 5% Fuel Cashback',
    defaultNetwork: 'rupay',
    category: 'fuel',
    gradient: {
      from: '#18181b',
      via: '#7c2d12',
      to: '#1e3a8a',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fdba74',
    accentColor: '#f97316',
    emblemType: 'bob',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'HPCL ENERGIE',
  },

  // ==========================================
  // === 14. AU SMALL FINANCE BANK ============
  // ==========================================
  au_zenith_plus: {
    id: 'au_zenith_plus',
    issuer: 'AU Small Finance Bank',
    cardName: 'AU Zenith+',
    variantName: 'Zenith+ Metal Luxury',
    defaultNetwork: 'visa',
    category: 'super_premium',
    gradient: {
      from: '#0b132b',
      via: '#1c2541',
      to: '#1e1b4b',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#cbd5e1',
    accentColor: '#eab308',
    emblemType: 'au',
    patternType: 'gemstone',
    chipColor: 'dark_gold',
    badgeLabel: 'ZENITH+',
  },
  au_vetta: {
    id: 'au_vetta',
    issuer: 'AU Small Finance Bank',
    cardName: 'AU Vetta',
    variantName: 'Vetta Lifestyle Card',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#2e1065',
      via: '#4a044e',
      to: '#3b0764',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#f5d0fe',
    accentColor: '#d946ef',
    emblemType: 'au',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'VETTA',
  },
  au_altura_plus: {
    id: 'au_altura_plus',
    issuer: 'AU Small Finance Bank',
    cardName: 'AU Altura Plus',
    variantName: 'Altura Plus Cashback',
    defaultNetwork: 'rupay',
    category: 'cashback',
    gradient: {
      from: '#042f2e',
      via: '#0f766e',
      to: '#1e293b',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#99f6e4',
    accentColor: '#2dd4bf',
    emblemType: 'au',
    patternType: 'geometric',
    chipColor: 'silver',
    badgeLabel: 'ALTURA+',
  },
  au_lit: {
    id: 'au_lit',
    issuer: 'AU Small Finance Bank',
    cardName: 'AU LIT Card',
    variantName: 'LIT Customizable Features',
    defaultNetwork: 'visa',
    category: 'custom',
    gradient: {
      from: '#09090b',
      via: '#18181b',
      to: '#7c2d12',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fdba74',
    accentColor: '#ea580c',
    emblemType: 'au',
    patternType: 'dots',
    chipColor: 'silver',
    badgeLabel: 'AU LIT',
  },

  // ==========================================
  // === 15. STANDARD CHARTERED ===============
  // ==========================================
  sc_ultimate: {
    id: 'sc_ultimate',
    issuer: 'Standard Chartered',
    cardName: 'StanChart Ultimate',
    variantName: 'Ultimate 3.33% Reward Rate',
    defaultNetwork: 'visa',
    category: 'super_premium',
    gradient: {
      from: '#0f172a',
      via: '#1e3a8a',
      to: '#047857',
      angle: '135deg',
    },
    textColor: '#fef08a',
    subtextColor: '#93c5fd',
    accentColor: '#10b981',
    emblemType: 'sc',
    patternType: 'wave',
    chipColor: 'dark_gold',
    badgeLabel: 'ULTIMATE',
  },
  sc_manhattan: {
    id: 'sc_manhattan',
    issuer: 'Standard Chartered',
    cardName: 'StanChart Manhattan',
    variantName: 'Manhattan 5% Grocery Cashback',
    defaultNetwork: 'visa',
    category: 'cashback',
    gradient: {
      from: '#1e1b4b',
      via: '#312e81',
      to: '#4338ca',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#c7d2fe',
    accentColor: '#818cf8',
    emblemType: 'sc',
    patternType: 'geometric',
    chipColor: 'silver',
    badgeLabel: 'MANHATTAN',
  },
  sc_smart: {
    id: 'sc_smart',
    issuer: 'Standard Chartered',
    cardName: 'StanChart Smart Card',
    variantName: 'Smart 2% Online Cashback',
    defaultNetwork: 'visa',
    category: 'cashback',
    gradient: {
      from: '#083344',
      via: '#0e7490',
      to: '#047857',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#a5f3fc',
    accentColor: '#22d3ee',
    emblemType: 'sc',
    patternType: 'stripes',
    chipColor: 'silver',
    badgeLabel: 'SMART CARD',
  },

  // ==========================================
  // === 16. HSBC =============================
  // ==========================================
  hsbc_premier: {
    id: 'hsbc_premier',
    issuer: 'HSBC',
    cardName: 'HSBC Premier Card',
    variantName: 'Premier Global Luxury',
    defaultNetwork: 'mastercard',
    category: 'super_premium',
    gradient: {
      from: '#0f172a',
      via: '#1e293b',
      to: '#334155',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#cbd5e1',
    accentColor: '#ef4444',
    emblemType: 'hsbc',
    patternType: 'brushed',
    chipColor: 'silver',
    badgeLabel: 'PREMIER',
  },
  hsbc_live_plus: {
    id: 'hsbc_live_plus',
    issuer: 'HSBC',
    cardName: 'HSBC Live+ Card',
    variantName: 'Live+ 10% Dining Cashback',
    defaultNetwork: 'visa',
    category: 'cashback',
    gradient: {
      from: '#450a0a',
      via: '#7f1d1d',
      to: '#991b1b',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fca5a5',
    accentColor: '#ef4444',
    emblemType: 'hsbc',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'LIVE+ CASHBACK',
  },
  hsbc_platinum: {
    id: 'hsbc_platinum',
    issuer: 'HSBC',
    cardName: 'HSBC Platinum',
    variantName: 'Platinum Lifetime Free',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#334155',
      via: '#475569',
      to: '#64748b',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#e2e8f0',
    accentColor: '#cbd5e1',
    emblemType: 'hsbc',
    patternType: 'brushed',
    chipColor: 'silver',
    badgeLabel: 'PLATINUM',
  },

  // ==========================================
  // === 17. FINTECHS & NEO-CARDS =============
  // ==========================================
  slice_card: {
    id: 'slice_card',
    issuer: 'Slice',
    cardName: 'Slice Card',
    variantName: 'Slice 3% Spark Cashback',
    defaultNetwork: 'visa',
    category: 'cashback',
    gradient: {
      from: '#1e1b4b',
      via: '#2e1065',
      to: '#4c1d95',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#e9d5ff',
    accentColor: '#c084fc',
    emblemType: 'slice',
    patternType: 'minimal',
    chipColor: 'silver',
    badgeLabel: 'slice',
  },
  scapia_card: {
    id: 'scapia_card',
    issuer: 'Scapia',
    cardName: 'Scapia Federal Card',
    variantName: 'Scapia 0% Forex Unlimited Lounge',
    defaultNetwork: 'visa',
    category: 'travel',
    gradient: {
      from: '#042f2e',
      via: '#065f46',
      to: '#0f766e',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#99f6e4',
    accentColor: '#2dd4bf',
    emblemType: 'scapia',
    patternType: 'geometric',
    chipColor: 'silver',
    badgeLabel: 'scapia',
  },
  fi_card: {
    id: 'fi_card',
    issuer: 'Fi Money',
    cardName: 'Fi Federal Credit Card',
    variantName: 'Fi 5X Accelerated Rewards',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#064e3b',
      via: '#0f172a',
      to: '#022c22',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#86efac',
    accentColor: '#22c55e',
    emblemType: 'fi',
    patternType: 'minimal',
    chipColor: 'silver',
    badgeLabel: 'fi',
  },
  jupiter_card: {
    id: 'jupiter_card',
    issuer: 'Jupiter',
    cardName: 'Jupiter CSB Edge',
    variantName: 'Jupiter Edge 2% Jewels Cashback',
    defaultNetwork: 'rupay',
    category: 'cashback',
    gradient: {
      from: '#111827',
      via: '#1f2937',
      to: '#7c2d12',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fdba74',
    accentColor: '#f97316',
    emblemType: 'jupiter',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'jupiter',
  },
  roar_bank_card: {
    id: 'roar_bank_card',
    issuer: 'Roar Bank',
    cardName: 'Roar Bank Credit Card',
    variantName: 'Roar Cyber Metal 3% Unlimited',
    defaultNetwork: 'visa',
    category: 'cashback',
    gradient: {
      from: '#050505',
      via: '#0f172a',
      to: '#14532d',
      angle: '140deg',
    },
    textColor: '#ffffff',
    subtextColor: '#bef264',
    accentColor: '#a3e635',
    emblemType: 'roar',
    patternType: 'brushed',
    chipColor: 'silver',
    badgeLabel: 'ROAR CYBER',
  },
  bandhan_ignite: {
    id: 'bandhan_ignite',
    issuer: 'Bandhan Bank',
    cardName: 'Bandhan Ignite Card',
    variantName: 'Ignite Premium Rewards',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#431407',
      via: '#9a3412',
      to: '#ea580c',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#ffedd5',
    accentColor: '#fb923c',
    emblemType: 'bandhan',
    patternType: 'wave',
    chipColor: 'gold',
    badgeLabel: 'IGNITE',
  },
  sbm_credilio: {
    id: 'sbm_credilio',
    issuer: 'SBM Bank',
    cardName: 'SBM Credilio Credit Card',
    variantName: 'Credilio Secured Credit Card',
    defaultNetwork: 'visa',
    category: 'rewards',
    gradient: {
      from: '#022c22',
      via: '#0f766e',
      to: '#0e7490',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#99f6e4',
    accentColor: '#2dd4bf',
    emblemType: 'sbm',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'CREDILIO',
  },

  // ==========================================
  // === 18. PUNJAB NATIONAL BANK (PNB) =======
  // ==========================================
  pnb_rupay_platinum: {
    id: 'pnb_rupay_platinum',
    issuer: 'Punjab National Bank',
    cardName: 'PNB RuPay Platinum',
    variantName: 'Platinum Contactless',
    defaultNetwork: 'rupay',
    category: 'shopping',
    gradient: {
      from: '#3b0611',
      via: '#700d23',
      to: '#9e1236',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fde047',
    accentColor: '#eab308',
    emblemType: 'pnb',
    patternType: 'geometric',
    chipColor: 'gold',
    badgeLabel: 'RUPAY PLATINUM',
  },
  pnb_rupay_select: {
    id: 'pnb_rupay_select',
    issuer: 'Punjab National Bank',
    cardName: 'PNB RuPay Select',
    variantName: 'Select Lounge & Wellness',
    defaultNetwork: 'rupay',
    category: 'lifestyle',
    gradient: {
      from: '#1e050c',
      via: '#4a0516',
      to: '#1a1020',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fef08a',
    accentColor: '#fbbf24',
    emblemType: 'pnb',
    patternType: 'waves',
    chipColor: 'gold',
    badgeLabel: 'RUPAY SELECT',
  },
  pnb_rakshak: {
    id: 'pnb_rakshak',
    issuer: 'Punjab National Bank',
    cardName: 'PNB Rakshak RuPay',
    variantName: 'Rakshak Defence Special',
    defaultNetwork: 'rupay',
    category: 'rewards',
    gradient: {
      from: '#0f172a',
      via: '#1e293b',
      to: '#5c1022',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#93c5fd',
    accentColor: '#eab308',
    emblemType: 'pnb',
    patternType: 'stripes',
    chipColor: 'gold',
    badgeLabel: 'PNB RAKSHAK',
  },
  pnb_millennial: {
    id: 'pnb_millennial',
    issuer: 'Punjab National Bank',
    cardName: 'PNB Millennial',
    variantName: 'Millennial Rewards',
    defaultNetwork: 'rupay',
    category: 'cashback',
    gradient: {
      from: '#3b0764',
      via: '#700d23',
      to: '#d97706',
      angle: '140deg',
    },
    textColor: '#ffffff',
    subtextColor: '#fde68a',
    accentColor: '#f59e0b',
    emblemType: 'pnb',
    patternType: 'dots',
    chipColor: 'gold',
    badgeLabel: 'MILLENNIAL',
  },

  // ==========================================
  // === 19. CUSTOM / FALLBACK ================
  // ==========================================
  custom_card: {
    id: 'custom_card',
    issuer: 'Custom Issuer',
    cardName: 'Custom Credit Card',
    variantName: 'Standard Platinum',
    defaultNetwork: 'visa',
    category: 'custom',
    gradient: {
      from: '#1e293b',
      via: '#0f172a',
      to: '#020617',
      angle: '135deg',
    },
    textColor: '#ffffff',
    subtextColor: '#94a3b8',
    accentColor: '#38bdf8',
    emblemType: 'custom',
    patternType: 'stripes',
    chipColor: 'gold',
    badgeLabel: 'PLATINUM',
  },
};

/** List of supported major issuers for the dropdown picker */
export const POPULAR_ISSUERS = [
  'HDFC Bank',
  'ICICI Bank',
  'SBI Card',
  'Axis Bank',
  'Punjab National Bank',
  'Kotak Mahindra Bank',
  'American Express',
  'OneCard / Federal',
  'IDFC FIRST Bank',
  'IndusInd Bank',
  'RBL Bank',
  'Bandhan Bank',
  'SBM Bank',
  'Roar Bank',
  'Federal Bank',
  'Yes Bank',
  'Bank of Baroda',
  'AU Small Finance Bank',
  'Standard Chartered',
  'HSBC',
  'Slice',
  'Scapia',
  'Fi Money',
  'Jupiter',
  'Other Bank',
];

/**
 * Returns available preset variants for a selected issuer
 */
export function getPresetsForIssuer(issuerName: string): CardVisualPreset[] {
  const norm = issuerName.toLowerCase();
  const allPresets = Object.values(CARD_VISUAL_PRESETS);

  if (norm.includes('pnb') || norm.includes('punjab')) {
    return allPresets.filter((p) => p.issuer === 'Punjab National Bank' || p.id.startsWith('pnb_'));
  }
  if (norm.includes('sbi') || norm.includes('state bank') || norm.includes('phonepe')) {
    return allPresets.filter((p) => p.issuer === 'SBI Card');
  }
  if (norm.includes('icici')) {
    return allPresets.filter((p) => p.issuer === 'ICICI Bank');
  }
  if (norm.includes('hdfc')) {
    return allPresets.filter((p) => p.issuer === 'HDFC Bank');
  }
  if (norm.includes('axis')) {
    return allPresets.filter((p) => p.issuer === 'Axis Bank');
  }
  if (norm.includes('kotak')) {
    return allPresets.filter((p) => p.issuer === 'Kotak Mahindra Bank');
  }
  if (norm.includes('amex') || norm.includes('american express')) {
    return allPresets.filter((p) => p.issuer === 'American Express');
  }
  if (norm.includes('onecard')) {
    return allPresets.filter((p) => p.issuer.includes('OneCard'));
  }
  if (norm.includes('idfc')) {
    return allPresets.filter((p) => p.issuer.includes('IDFC'));
  }
  if (norm.includes('indusind')) {
    return allPresets.filter((p) => p.issuer === 'IndusInd Bank');
  }
  if (norm.includes('rbl')) {
    return allPresets.filter((p) => p.issuer === 'RBL Bank');
  }
  if (norm.includes('bandhan')) {
    return allPresets.filter((p) => p.issuer === 'Bandhan Bank');
  }
  if (norm.includes('sbm')) {
    return allPresets.filter((p) => p.issuer === 'SBM Bank');
  }
  if (norm.includes('roar')) {
    return allPresets.filter((p) => p.issuer.includes('Roar'));
  }
  if (norm.includes('federal') || norm.includes('scapia') || norm.includes('fi')) {
    return allPresets.filter((p) => p.issuer === 'Federal Bank' || p.issuer === 'Scapia' || p.issuer === 'Fi Money');
  }
  if (norm.includes('yes')) {
    return allPresets.filter((p) => p.issuer === 'Yes Bank');
  }
  if (norm.includes('baroda') || norm.includes('bob')) {
    return allPresets.filter((p) => p.issuer === 'Bank of Baroda');
  }
  if (norm.includes('au')) {
    return allPresets.filter((p) => p.issuer.includes('AU'));
  }
  if (norm.includes('standard chartered') || norm.includes('scb') || norm.includes('stanchart')) {
    return allPresets.filter((p) => p.issuer === 'Standard Chartered');
  }
  if (norm.includes('hsbc')) {
    return allPresets.filter((p) => p.issuer === 'HSBC');
  }
  if (norm.includes('slice')) {
    return allPresets.filter((p) => p.issuer === 'Slice');
  }
  if (norm.includes('jupiter')) {
    return allPresets.filter((p) => p.issuer === 'Jupiter');
  }

  // Fallback: return top popular presets
  return [
    CARD_VISUAL_PRESETS.sbi_cashback,
    CARD_VISUAL_PRESETS.amazon_pay_icici,
    CARD_VISUAL_PRESETS.hdfc_swiggy,
    CARD_VISUAL_PRESETS.hdfc_infinia,
    CARD_VISUAL_PRESETS.axis_airtel,
    CARD_VISUAL_PRESETS.kotak_league,
    CARD_VISUAL_PRESETS.onecard_metal,
    CARD_VISUAL_PRESETS.idfc_first_wealth,
    CARD_VISUAL_PRESETS.indusind_legend,
    CARD_VISUAL_PRESETS.rbl_world_safari,
    CARD_VISUAL_PRESETS.bandhan_ignite,
    CARD_VISUAL_PRESETS.sbm_credilio,
    CARD_VISUAL_PRESETS.roar_bank_card,
    CARD_VISUAL_PRESETS.custom_card,
  ];
}

/**
 * Intelligent card matcher: given card attributes, finds the best matching visual preset
 */
export function matchCardVisualPreset(card: Partial<CreditCard>): CardVisualPreset {
  // If card has explicit cardVariant matching a known preset
  if (card.cardVariant && CARD_VISUAL_PRESETS[card.cardVariant]) {
    return CARD_VISUAL_PRESETS[card.cardVariant];
  }

  const nameStr = `${card.cardName || ''} ${card.displayName || ''} ${card.name || ''}`.toLowerCase();
  const issuerStr = `${card.issuer || ''} ${card.bankName || ''}`.toLowerCase();

  // Special co-brands & fintech matches first
  if (nameStr.includes('amazon') || (issuerStr.includes('icici') && (nameStr.includes('pay') || nameStr.includes('amazon')))) {
    return CARD_VISUAL_PRESETS.amazon_pay_icici;
  }
  if (nameStr.includes('swiggy') || (issuerStr.includes('hdfc') && nameStr.includes('swiggy'))) {
    return CARD_VISUAL_PRESETS.hdfc_swiggy;
  }
  if (nameStr.includes('phonepe') || nameStr.includes('phone pe')) {
    return CARD_VISUAL_PRESETS.sbi_phonepe_black;
  }
  if (nameStr.includes('roar') || issuerStr.includes('roar')) {
    return CARD_VISUAL_PRESETS.roar_bank_card;
  }
  if (nameStr.includes('bandhan') || issuerStr.includes('bandhan') || nameStr.includes('ignite')) {
    return CARD_VISUAL_PRESETS.bandhan_ignite;
  }
  if (nameStr.includes('credilio') || (issuerStr.includes('sbm') && (nameStr.includes('credilio') || nameStr.includes('card')))) {
    return CARD_VISUAL_PRESETS.sbm_credilio;
  }
  if (issuerStr.includes('sbm')) {
    return CARD_VISUAL_PRESETS.sbm_credilio;
  }

  // 1. SBI Matches
  if (nameStr.includes('cashback') && (issuerStr.includes('sbi') || nameStr.includes('sbi'))) {
    return CARD_VISUAL_PRESETS.sbi_cashback;
  }
  if (nameStr.includes('simplyclick') || (nameStr.includes('click') && issuerStr.includes('sbi'))) {
    return CARD_VISUAL_PRESETS.sbi_simplyclick;
  }
  if (nameStr.includes('simplysave') || (nameStr.includes('save') && issuerStr.includes('sbi'))) {
    return CARD_VISUAL_PRESETS.sbi_simplysave;
  }
  if (nameStr.includes('bpcl') || nameStr.includes('octane')) {
    return CARD_VISUAL_PRESETS.sbi_bpcl_octane;
  }
  if (nameStr.includes('aurum')) {
    return CARD_VISUAL_PRESETS.sbi_aurum;
  }
  if (nameStr.includes('elite')) {
    return CARD_VISUAL_PRESETS.sbi_elite;
  }
  if (nameStr.includes('prime') && issuerStr.includes('sbi')) {
    return CARD_VISUAL_PRESETS.sbi_prime;
  }

  // 2. ICICI Matches
  if (nameStr.includes('amazon') || (issuerStr.includes('icici') && nameStr.includes('pay'))) {
    return CARD_VISUAL_PRESETS.amazon_pay_icici;
  }
  if (nameStr.includes('rubyx') && (nameStr.includes('amex') || nameStr.includes('american express'))) {
    return CARD_VISUAL_PRESETS.icici_rubyx_amex;
  }
  if (nameStr.includes('rubyx') && (nameStr.includes('mastercard') || nameStr.includes('mc'))) {
    return CARD_VISUAL_PRESETS.icici_rubyx_mastercard;
  }
  if (nameStr.includes('rubyx')) {
    return CARD_VISUAL_PRESETS.icici_rubyx;
  }
  if (nameStr.includes('sapphiro') && (nameStr.includes('rupay') || nameStr.includes('upi'))) {
    return CARD_VISUAL_PRESETS.icici_sapphiro_rupay;
  }
  if (nameStr.includes('sapphiro')) {
    return CARD_VISUAL_PRESETS.icici_sapphiro;
  }
  if (nameStr.includes('coral')) {
    return CARD_VISUAL_PRESETS.icici_coral;
  }
  if (nameStr.includes('hpcl') || nameStr.includes('super saver') || nameStr.includes('super saler')) {
    if (issuerStr.includes('icici') || nameStr.includes('icici')) {
      return CARD_VISUAL_PRESETS.icici_hpcl_super_saver;
    }
  }
  if (nameStr.includes('emeralde')) {
    return CARD_VISUAL_PRESETS.icici_emeralde;
  }
  if (nameStr.includes('platinum chip') || (nameStr.includes('platinum') && issuerStr.includes('icici'))) {
    return CARD_VISUAL_PRESETS.icici_platinum;
  }
  if (nameStr.includes('makemytrip') || nameStr.includes('mmt')) {
    return CARD_VISUAL_PRESETS.icici_makemytrip;
  }

  // 3. HDFC Matches
  if (nameStr.includes('infinia')) {
    return CARD_VISUAL_PRESETS.hdfc_infinia;
  }
  if (nameStr.includes('regalia')) {
    return CARD_VISUAL_PRESETS.hdfc_regalia_gold;
  }
  if (nameStr.includes('millennia') && !issuerStr.includes('idfc')) {
    return CARD_VISUAL_PRESETS.hdfc_millennia;
  }
  if (nameStr.includes('neu infinity') || (nameStr.includes('tata neu') && nameStr.includes('infinity'))) {
    return CARD_VISUAL_PRESETS.hdfc_tata_neu_infinity;
  }
  if (nameStr.includes('neu plus') || nameStr.includes('tata neu') || nameStr.includes('neu')) {
    return CARD_VISUAL_PRESETS.hdfc_tata_neu_plus;
  }
  if (nameStr.includes('swiggy')) {
    return CARD_VISUAL_PRESETS.hdfc_swiggy;
  }
  if (nameStr.includes('diners')) {
    return CARD_VISUAL_PRESETS.hdfc_diners_black;
  }
  if (nameStr.includes('moneyback') || nameStr.includes('moneback')) {
    return CARD_VISUAL_PRESETS.hdfc_moneyback;
  }
  if ((nameStr.includes('rupay') || nameStr.includes('upi')) && (issuerStr.includes('hdfc') || nameStr.includes('hdfc'))) {
    return CARD_VISUAL_PRESETS.hdfc_rupay;
  }

  // 4. Axis Matches
  if (nameStr.includes('airtel')) {
    return CARD_VISUAL_PRESETS.axis_airtel;
  }
  if (nameStr.includes('magnus')) {
    return CARD_VISUAL_PRESETS.axis_magnus;
  }
  if (nameStr.includes('atlas')) {
    return CARD_VISUAL_PRESETS.axis_atlas;
  }
  if (nameStr.includes('flipkart')) {
    return CARD_VISUAL_PRESETS.axis_flipkart;
  }
  if (nameStr.includes('ace')) {
    return CARD_VISUAL_PRESETS.axis_ace;
  }
  if (nameStr.includes('neo')) {
    return CARD_VISUAL_PRESETS.axis_neo;
  }
  if (nameStr.includes('my zone') || nameStr.includes('myzone')) {
    return CARD_VISUAL_PRESETS.axis_myzone;
  }
  if (nameStr.includes('select') && issuerStr.includes('axis')) {
    return CARD_VISUAL_PRESETS.axis_select;
  }

  // 5. Kotak Matches
  if (nameStr.includes('dream different') || nameStr.includes('dreamdifferent') || nameStr.includes('811')) {
    return CARD_VISUAL_PRESETS.kotak_811;
  }
  if (nameStr.includes('white')) {
    return CARD_VISUAL_PRESETS.kotak_white;
  }
  if (nameStr.includes('league')) {
    return CARD_VISUAL_PRESETS.kotak_league;
  }
  if (nameStr.includes('mojo')) {
    return CARD_VISUAL_PRESETS.kotak_mojo;
  }
  if (nameStr.includes('zen')) {
    return CARD_VISUAL_PRESETS.kotak_zen;
  }

  // 6. American Express Matches
  if (issuerStr.includes('amex') || issuerStr.includes('american express')) {
    if (nameStr.includes('travel')) {
      return CARD_VISUAL_PRESETS.amex_platinum_travel;
    }
    if (nameStr.includes('mrcc') || nameStr.includes('membership')) {
      return CARD_VISUAL_PRESETS.amex_mrcc;
    }
    if (nameStr.includes('smartearn') || nameStr.includes('smart')) {
      return CARD_VISUAL_PRESETS.amex_smartearn;
    }
    if (nameStr.includes('gold')) {
      return CARD_VISUAL_PRESETS.amex_gold;
    }
    return CARD_VISUAL_PRESETS.amex_platinum_metal;
  }

  // 7. OneCard Matches
  if (nameStr.includes('onecard') || issuerStr.includes('onecard')) {
    return CARD_VISUAL_PRESETS.onecard_metal;
  }

  // 8. IDFC Matches
  if (issuerStr.includes('idfc')) {
    if (nameStr.includes('wealth')) return CARD_VISUAL_PRESETS.idfc_first_wealth;
    if (nameStr.includes('select')) return CARD_VISUAL_PRESETS.idfc_first_select;
    if (nameStr.includes('millennia')) return CARD_VISUAL_PRESETS.idfc_first_millennia;
    if (nameStr.includes('swyp')) return CARD_VISUAL_PRESETS.idfc_first_swyp;
    if (nameStr.includes('vistara')) return CARD_VISUAL_PRESETS.idfc_club_vistara;
    return CARD_VISUAL_PRESETS.idfc_first_classic;
  }

  // 9. IndusInd Matches
  if (issuerStr.includes('indusind') || nameStr.includes('indusind')) {
    if (nameStr.includes('legend')) return CARD_VISUAL_PRESETS.indusind_legend;
    if (nameStr.includes('pinnacle')) return CARD_VISUAL_PRESETS.indusind_pinnacle;
    if (nameStr.includes('tiger')) return CARD_VISUAL_PRESETS.indusind_tiger;
    if (nameStr.includes('nexxt')) return CARD_VISUAL_PRESETS.indusind_nexxt;
    return CARD_VISUAL_PRESETS.indusind_platinum_aura;
  }

  // 10. RBL Matches
  if (issuerStr.includes('rbl') || nameStr.includes('rbl')) {
    if (nameStr.includes('savemax') || nameStr.includes('bankbazaar') || nameStr.includes('bankbazar')) {
      return CARD_VISUAL_PRESETS.rbl_bankbazaar_savemax_pro;
    }
    if (nameStr.includes('safari')) return CARD_VISUAL_PRESETS.rbl_world_safari;
    if (nameStr.includes('shoprite')) return CARD_VISUAL_PRESETS.rbl_shoprite;
    if (nameStr.includes('play')) return CARD_VISUAL_PRESETS.rbl_play;
    if (nameStr.includes('popcorn')) return CARD_VISUAL_PRESETS.rbl_popcorn;
    return CARD_VISUAL_PRESETS.rbl_shoprite;
  }

  // 11. Federal Bank Matches
  if (issuerStr.includes('federal')) {
    if (nameStr.includes('celesta')) return CARD_VISUAL_PRESETS.federal_celesta;
    if (nameStr.includes('imperio')) return CARD_VISUAL_PRESETS.federal_imperio;
    if (nameStr.includes('signet')) return CARD_VISUAL_PRESETS.federal_signet;
    if (nameStr.includes('scapia')) return CARD_VISUAL_PRESETS.federal_scapia;
    if (nameStr.includes('fi')) return CARD_VISUAL_PRESETS.federal_fi;
    return CARD_VISUAL_PRESETS.federal_imperio;
  }

  // 12. Yes Bank Matches
  if (issuerStr.includes('yes') || nameStr.includes('yes bank')) {
    if (nameStr.includes('bankbazaar') || nameStr.includes('bank bazar') || nameStr.includes('finbooster')) {
      return CARD_VISUAL_PRESETS.yes_bankbazaar_finbooster;
    }
    if (nameStr.includes('rupay') || nameStr.includes('upi')) {
      return CARD_VISUAL_PRESETS.yes_rupay_virtual;
    }
    if (nameStr.includes('marquee')) return CARD_VISUAL_PRESETS.yes_marquee;
    if (nameStr.includes('reserv')) return CARD_VISUAL_PRESETS.yes_reserv;
    if (nameStr.includes('byoc')) return CARD_VISUAL_PRESETS.yes_byoc;
    return CARD_VISUAL_PRESETS.yes_prosperity;
  }

  // 13. Bank of Baroda Matches
  if (issuerStr.includes('baroda') || issuerStr.includes('bob')) {
    if (nameStr.includes('eterna')) return CARD_VISUAL_PRESETS.bob_eterna;
    if (nameStr.includes('premier')) return CARD_VISUAL_PRESETS.bob_premier;
    if (nameStr.includes('hpcl') || nameStr.includes('energie')) return CARD_VISUAL_PRESETS.bob_hpcl_energie;
    return CARD_VISUAL_PRESETS.bob_select;
  }

  // 14. AU Small Finance Matches
  if (issuerStr.includes('au') || nameStr.includes('au small')) {
    if (nameStr.includes('zenith')) return CARD_VISUAL_PRESETS.au_zenith_plus;
    if (nameStr.includes('vetta')) return CARD_VISUAL_PRESETS.au_vetta;
    if (nameStr.includes('lit')) return CARD_VISUAL_PRESETS.au_lit;
    return CARD_VISUAL_PRESETS.au_altura_plus;
  }

  // 15. Standard Chartered Matches
  if (issuerStr.includes('standard') || issuerStr.includes('scb') || issuerStr.includes('stanchart')) {
    if (nameStr.includes('ultimate')) return CARD_VISUAL_PRESETS.sc_ultimate;
    if (nameStr.includes('manhattan')) return CARD_VISUAL_PRESETS.sc_manhattan;
    return CARD_VISUAL_PRESETS.sc_smart;
  }

  // 16. HSBC Matches
  if (issuerStr.includes('hsbc')) {
    if (nameStr.includes('premier')) return CARD_VISUAL_PRESETS.hsbc_premier;
    if (nameStr.includes('live')) return CARD_VISUAL_PRESETS.hsbc_live_plus;
    return CARD_VISUAL_PRESETS.hsbc_platinum;
  }

  // 17. Slice, Scapia, Fi, Jupiter Matches
  if (nameStr.includes('slice') || issuerStr.includes('slice')) {
    return CARD_VISUAL_PRESETS.slice_card;
  }
  if (nameStr.includes('scapia') || issuerStr.includes('scapia')) {
    return CARD_VISUAL_PRESETS.scapia_card;
  }
  if (nameStr.includes('fi money') || nameStr.includes('fi card') || issuerStr.includes('fi money')) {
    return CARD_VISUAL_PRESETS.fi_card;
  }
  if (nameStr.includes('jupiter') || issuerStr.includes('jupiter')) {
    return CARD_VISUAL_PRESETS.jupiter_card;
  }

  // 18. Punjab National Bank (PNB) Matches
  if (issuerStr.includes('pnb') || issuerStr.includes('punjab') || nameStr.includes('pnb')) {
    if (nameStr.includes('rakshak')) return CARD_VISUAL_PRESETS.pnb_rakshak;
    if (nameStr.includes('select')) return CARD_VISUAL_PRESETS.pnb_rupay_select;
    if (nameStr.includes('millennial')) return CARD_VISUAL_PRESETS.pnb_millennial;
    return CARD_VISUAL_PRESETS.pnb_rupay_platinum;
  }

  // 19. Bandhan, SBM, Roar Matches
  if (issuerStr.includes('bandhan') || nameStr.includes('bandhan') || nameStr.includes('ignite')) {
    return CARD_VISUAL_PRESETS.bandhan_ignite;
  }
  if (issuerStr.includes('sbm') || nameStr.includes('credilio')) {
    return CARD_VISUAL_PRESETS.sbm_credilio;
  }
  if (nameStr.includes('roar') || issuerStr.includes('roar')) {
    return CARD_VISUAL_PRESETS.roar_credit_card;
  }

  // 20. Issuer-level default fallbacks
  if (issuerStr.includes('sbi') || issuerStr.includes('state bank')) {
    return CARD_VISUAL_PRESETS.sbi_simplyclick;
  }
  if (issuerStr.includes('icici')) {
    return CARD_VISUAL_PRESETS.icici_sapphiro;
  }
  if (issuerStr.includes('hdfc')) {
    return CARD_VISUAL_PRESETS.hdfc_millennia;
  }
  if (issuerStr.includes('axis')) {
    return CARD_VISUAL_PRESETS.axis_ace;
  }
  if (issuerStr.includes('kotak')) {
    return CARD_VISUAL_PRESETS.kotak_league;
  }

  // Dynamic deterministic custom theme generator for unlisted bank / card
  return generateDynamicCardPreset(card.issuer || 'Custom Bank', card.cardName || card.name || 'Card');
}

/** Deterministic custom gradient palettes for custom cards */
const DYNAMIC_CARD_PALETTES = [
  {
    from: '#051b2c',
    via: '#0c3859',
    to: '#0284c7',
    textColor: '#ffffff',
    subtextColor: '#7dd3fc',
    accentColor: '#38bdf8',
    chipColor: 'silver' as const,
    patternType: 'stripes' as const,
  },
  {
    from: '#022c22',
    via: '#064e3b',
    to: '#059669',
    textColor: '#ffffff',
    subtextColor: '#a7f3d0',
    accentColor: '#34d399',
    chipColor: 'gold' as const,
    patternType: 'geometric' as const,
  },
  {
    from: '#2e0854',
    via: '#581c87',
    to: '#9333ea',
    textColor: '#ffffff',
    subtextColor: '#e9d5ff',
    accentColor: '#c084fc',
    chipColor: 'gold' as const,
    patternType: 'waves' as const,
  },
  {
    from: '#3b0712',
    via: '#7f1d1d',
    to: '#b91c1c',
    textColor: '#ffffff',
    subtextColor: '#fecaca',
    accentColor: '#f87171',
    chipColor: 'gold' as const,
    patternType: 'dots' as const,
  },
  {
    from: '#1c1917',
    via: '#44403c',
    to: '#78716c',
    textColor: '#ffffff',
    subtextColor: '#e7e5e4',
    accentColor: '#d6d3d1',
    chipColor: 'silver' as const,
    patternType: 'brushed' as const,
  },
  {
    from: '#451a03',
    via: '#78350f',
    to: '#d97706',
    textColor: '#ffffff',
    subtextColor: '#fde68a',
    accentColor: '#f59e0b',
    chipColor: 'gold' as const,
    patternType: 'gemstone' as const,
  },
];

function generateDynamicCardPreset(issuer: string, cardName: string): CardVisualPreset {
  let hash = 0;
  const combined = `${issuer} ${cardName}`;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  const palette = DYNAMIC_CARD_PALETTES[Math.abs(hash) % DYNAMIC_CARD_PALETTES.length];
  const words = issuer.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
  const badgeLabel = words[0]?.toUpperCase() || 'EXCLUSIVE';

  return {
    id: `custom_${Math.abs(hash)}`,
    issuer,
    cardName,
    variantName: 'Custom Edition',
    defaultNetwork: 'visa',
    category: 'custom',
    gradient: {
      from: palette.from,
      via: palette.via,
      to: palette.to,
      angle: '135deg',
    },
    textColor: palette.textColor,
    subtextColor: palette.subtextColor,
    accentColor: palette.accentColor,
    emblemType: 'custom',
    patternType: palette.patternType,
    chipColor: palette.chipColor,
    badgeLabel: `${badgeLabel} CARD`,
  };
}


/**
 * Bank Account Brand Visuals and Themes Registry
 * Provides authentic, vector & CSS representations of top Indian Banks and financial institutions.
 */

export interface BankBrandTheme {
  id: string;
  name: string;
  shortCode: string;
  logoBg: string;
  logoBorder: string;
  textColor: string;
  accentColor: string;
  cardGradient: string;
  cardBorder: string;
  passbookBg: string;
  chipColor?: 'gold' | 'silver';
  emblem:
    | 'sbi'
    | 'hdfc'
    | 'icici'
    | 'axis'
    | 'kotak'
    | 'pnb'
    | 'bob'
    | 'canara'
    | 'union'
    | 'idfc'
    | 'indusind'
    | 'federal'
    | 'yes'
    | 'bandhan'
    | 'sbm'
    | 'jupiter'
    | 'fi'
    | 'sc'
    | 'hsbc'
    | 'au'
    | 'airtel'
    | 'ippb'
    | 'paytm'
    | 'jio'
    | 'dbs'
    | 'citi'
    | 'deutsche'
    | 'rbl'
    | 'boi'
    | 'indian'
    | 'cbi'
    | 'iob'
    | 'uco'
    | 'bom'
    | 'psb'
    | 'kvb'
    | 'cub'
    | 'sib'
    | 'ktk'
    | 'custom';
}

export const TOP_INDIAN_BANKS: Record<string, BankBrandTheme> = {
  sbi: {
    id: 'sbi',
    name: 'State Bank of India',
    shortCode: 'SBI',
    logoBg: 'bg-[#002d62]',
    logoBorder: 'border-[#2895f3]/50',
    textColor: 'text-[#2895f3]',
    accentColor: '#2895f3',
    cardGradient: 'from-[#001838] via-[#002d62] to-[#044389]',
    cardBorder: 'border-[#2895f3]/40',
    passbookBg: 'bg-[#00224b]',
    chipColor: 'silver',
    emblem: 'sbi',
  },
  hdfc: {
    id: 'hdfc',
    name: 'HDFC Bank',
    shortCode: 'HDFC',
    logoBg: 'bg-[#004c8f]',
    logoBorder: 'border-[#ed1c24]/50',
    textColor: 'text-[#004c8f]',
    accentColor: '#004c8f',
    cardGradient: 'from-[#001d3d] via-[#003566] to-[#004c8f]',
    cardBorder: 'border-[#0077b6]/40',
    passbookBg: 'bg-[#002855]',
    chipColor: 'gold',
    emblem: 'hdfc',
  },
  icici: {
    id: 'icici',
    name: 'ICICI Bank',
    shortCode: 'ICICI',
    logoBg: 'bg-[#9b1c2e]',
    logoBorder: 'border-[#f37021]/50',
    textColor: 'text-[#f37021]',
    accentColor: '#f37021',
    cardGradient: 'from-[#3a030b] via-[#670719] to-[#9b1c2e]',
    cardBorder: 'border-[#f37021]/40',
    passbookBg: 'bg-[#4d0713]',
    chipColor: 'gold',
    emblem: 'icici',
  },
  axis: {
    id: 'axis',
    name: 'Axis Bank',
    shortCode: 'AXIS',
    logoBg: 'bg-[#97144d]',
    logoBorder: 'border-pink-500/50',
    textColor: 'text-[#97144d]',
    accentColor: '#97144d',
    cardGradient: 'from-[#2e0414] via-[#5c082b] to-[#8a0c3f]',
    cardBorder: 'border-[#b51759]/40',
    passbookBg: 'bg-[#470622]',
    chipColor: 'gold',
    emblem: 'axis',
  },
  kotak: {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    shortCode: 'KOTAK',
    logoBg: 'bg-[#ed1c24]',
    logoBorder: 'border-rose-400/50',
    textColor: 'text-[#ed1c24]',
    accentColor: '#ed1c24',
    cardGradient: 'from-[#2b0406] via-[#610a0e] to-[#9e0f16]',
    cardBorder: 'border-[#ed1c24]/40',
    passbookBg: 'bg-[#4a080b]',
    chipColor: 'gold',
    emblem: 'kotak',
  },
  pnb: {
    id: 'pnb',
    name: 'Punjab National Bank',
    shortCode: 'PNB',
    logoBg: 'bg-[#700d23]',
    logoBorder: 'border-[#eab308]/50',
    textColor: 'text-[#eab308]',
    accentColor: '#eab308',
    cardGradient: 'from-[#2a040d] via-[#4f0818] to-[#700d23]',
    cardBorder: 'border-[#eab308]/40',
    passbookBg: 'bg-[#3b0611]',
    chipColor: 'gold',
    emblem: 'pnb',
  },
  bob: {
    id: 'bob',
    name: 'Bank of Baroda',
    shortCode: 'BOB',
    logoBg: 'bg-[#f26522]',
    logoBorder: 'border-amber-400/50',
    textColor: 'text-[#f26522]',
    accentColor: '#f26522',
    cardGradient: 'from-[#381102] via-[#692105] to-[#a33508]',
    cardBorder: 'border-[#f26522]/40',
    passbookBg: 'bg-[#521903]',
    chipColor: 'gold',
    emblem: 'bob',
  },
  canara: {
    id: 'canara',
    name: 'Canara Bank',
    shortCode: 'CANARA',
    logoBg: 'bg-[#0054a6]',
    logoBorder: 'border-[#fed100]/60',
    textColor: 'text-[#fed100]',
    accentColor: '#fed100',
    cardGradient: 'from-[#001730] via-[#003366] to-[#0054a6]',
    cardBorder: 'border-[#fed100]/40',
    passbookBg: 'bg-[#002447]',
    chipColor: 'gold',
    emblem: 'canara',
  },
  union: {
    id: 'union',
    name: 'Union Bank of India',
    shortCode: 'UBI',
    logoBg: 'bg-[#d2232a]',
    logoBorder: 'border-[#004b87]/60',
    textColor: 'text-white',
    accentColor: '#004b87',
    cardGradient: 'from-[#2b0507] via-[#590a0e] to-[#871116]',
    cardBorder: 'border-[#d2232a]/40',
    passbookBg: 'bg-[#40070a]',
    chipColor: 'gold',
    emblem: 'union',
  },
  idfc: {
    id: 'idfc',
    name: 'IDFC FIRST Bank',
    shortCode: 'IDFC',
    logoBg: 'bg-[#991b1b]',
    logoBorder: 'border-amber-400/50',
    textColor: 'text-white',
    accentColor: '#fbbf24',
    cardGradient: 'from-[#2d0505] via-[#5c0b0b] to-[#881313]',
    cardBorder: 'border-[#991b1b]/40',
    passbookBg: 'bg-[#450808]',
    chipColor: 'gold',
    emblem: 'idfc',
  },
  indusind: {
    id: 'indusind',
    name: 'IndusInd Bank',
    shortCode: 'INDUSIND',
    logoBg: 'bg-[#7f1d1d]',
    logoBorder: 'border-amber-400/50',
    textColor: 'text-[#f59e0b]',
    accentColor: '#f59e0b',
    cardGradient: 'from-[#290505] via-[#4d0c0c] to-[#731313]',
    cardBorder: 'border-amber-500/40',
    passbookBg: 'bg-[#3b0808]',
    chipColor: 'gold',
    emblem: 'indusind',
  },
  federal: {
    id: 'federal',
    name: 'Federal Bank',
    shortCode: 'FEDERAL',
    logoBg: 'bg-[#1e3a8a]',
    logoBorder: 'border-amber-400/60',
    textColor: 'text-amber-300',
    accentColor: '#fbbf24',
    cardGradient: 'from-[#0b132b] via-[#1c2541] to-[#253257]',
    cardBorder: 'border-amber-400/40',
    passbookBg: 'bg-[#161d36]',
    chipColor: 'gold',
    emblem: 'federal',
  },
  yes: {
    id: 'yes',
    name: 'YES Bank',
    shortCode: 'YES',
    logoBg: 'bg-[#1d4ed8]',
    logoBorder: 'border-rose-500/60',
    textColor: 'text-white',
    accentColor: '#ef4444',
    cardGradient: 'from-[#0b1b4f] via-[#173082] to-[#1e40af]',
    cardBorder: 'border-blue-400/40',
    passbookBg: 'bg-[#122461]',
    chipColor: 'silver',
    emblem: 'yes',
  },
  bandhan: {
    id: 'bandhan',
    name: 'Bandhan Bank',
    shortCode: 'BANDHAN',
    logoBg: 'bg-[#c2410c]',
    logoBorder: 'border-amber-400/50',
    textColor: 'text-white',
    accentColor: '#ea580c',
    cardGradient: 'from-[#2e0d02] via-[#5c1c05] to-[#8c2d08]',
    cardBorder: 'border-[#ea580c]/40',
    passbookBg: 'bg-[#471503]',
    chipColor: 'gold',
    emblem: 'bandhan',
  },
  sbm: {
    id: 'sbm',
    name: 'SBM Bank India',
    shortCode: 'SBM',
    logoBg: 'bg-[#0f172a]',
    logoBorder: 'border-cyan-400/60',
    textColor: 'text-cyan-300',
    accentColor: '#06b6d4',
    cardGradient: 'from-[#04111f] via-[#09223d] to-[#0f345c]',
    cardBorder: 'border-cyan-500/40',
    passbookBg: 'bg-[#06182c]',
    chipColor: 'silver',
    emblem: 'sbm',
  },
  jupiter: {
    id: 'jupiter',
    name: 'Jupiter (Federal Bank)',
    shortCode: 'JUPITER',
    logoBg: 'bg-[#ea580c]',
    logoBorder: 'border-amber-400/50',
    textColor: 'text-white',
    accentColor: '#f97316',
    cardGradient: 'from-[#1e1005] via-[#421d05] to-[#241208]',
    cardBorder: 'border-orange-500/40',
    passbookBg: 'bg-[#2b1406]',
    chipColor: 'gold',
    emblem: 'jupiter',
  },
  fi: {
    id: 'fi',
    name: 'Fi Money (Federal Bank)',
    shortCode: 'FI',
    logoBg: 'bg-[#042f2e]',
    logoBorder: 'border-teal-400/60',
    textColor: 'text-teal-300',
    accentColor: '#14b8a6',
    cardGradient: 'from-[#031d1d] via-[#063333] to-[#0d4f4e]',
    cardBorder: 'border-teal-500/40',
    passbookBg: 'bg-[#052828]',
    chipColor: 'silver',
    emblem: 'fi',
  },
  sc: {
    id: 'sc',
    name: 'Standard Chartered',
    shortCode: 'SC',
    logoBg: 'bg-[#0284c7]',
    logoBorder: 'border-emerald-400/50',
    textColor: 'text-emerald-300',
    accentColor: '#10b981',
    cardGradient: 'from-[#021f38] via-[#053861] to-[#08528c]',
    cardBorder: 'border-sky-400/40',
    passbookBg: 'bg-[#042d4f]',
    chipColor: 'silver',
    emblem: 'sc',
  },
  hsbc: {
    id: 'hsbc',
    name: 'HSBC India',
    shortCode: 'HSBC',
    logoBg: 'bg-[#dc2626]',
    logoBorder: 'border-white/50',
    textColor: 'text-white',
    accentColor: '#ef4444',
    cardGradient: 'from-[#210404] via-[#4d0a0a] to-[#781010]',
    cardBorder: 'border-rose-500/40',
    passbookBg: 'bg-[#3b0808]',
    chipColor: 'silver',
    emblem: 'hsbc',
  },
  au: {
    id: 'au',
    name: 'AU Small Finance Bank',
    shortCode: 'AU SFB',
    logoBg: 'bg-[#6b21a8]',
    logoBorder: 'border-orange-500/50',
    textColor: 'text-orange-400',
    accentColor: '#f97316',
    cardGradient: 'from-[#1e0730] via-[#45106b] to-[#7e22ce]',
    cardBorder: 'border-purple-500/40',
    passbookBg: 'bg-[#280a42]',
    chipColor: 'gold',
    emblem: 'au',
  },
  airtel: {
    id: 'airtel',
    name: 'Airtel Payments Bank',
    shortCode: 'AIRTEL',
    logoBg: 'bg-[#b91c1c]',
    logoBorder: 'border-red-400/60',
    textColor: 'text-white',
    accentColor: '#ef4444',
    cardGradient: 'from-[#2e0505] via-[#630b0b] to-[#991b1b]',
    cardBorder: 'border-red-500/40',
    passbookBg: 'bg-[#3d0808]',
    chipColor: 'silver',
    emblem: 'airtel',
  },
  ippb: {
    id: 'ippb',
    name: 'India Post Payments Bank',
    shortCode: 'IPPB',
    logoBg: 'bg-[#9a3412]',
    logoBorder: 'border-yellow-400/60',
    textColor: 'text-amber-300',
    accentColor: '#f59e0b',
    cardGradient: 'from-[#290e03] via-[#541c06] to-[#852d0a]',
    cardBorder: 'border-amber-500/40',
    passbookBg: 'bg-[#3b1505]',
    chipColor: 'gold',
    emblem: 'ippb',
  },
  paytm: {
    id: 'paytm',
    name: 'Paytm Payments Bank',
    shortCode: 'PAYTM',
    logoBg: 'bg-[#0284c7]',
    logoBorder: 'border-cyan-400/60',
    textColor: 'text-white',
    accentColor: '#00baf2',
    cardGradient: 'from-[#031b2e] via-[#043356] to-[#0284c7]',
    cardBorder: 'border-cyan-400/40',
    passbookBg: 'bg-[#04243d]',
    chipColor: 'silver',
    emblem: 'paytm',
  },
  jio: {
    id: 'jio',
    name: 'Jio Payments Bank',
    shortCode: 'JIO',
    logoBg: 'bg-[#1d4ed8]',
    logoBorder: 'border-cyan-400/60',
    textColor: 'text-white',
    accentColor: '#0ea5e9',
    cardGradient: 'from-[#0b173d] via-[#102a70] to-[#1e40af]',
    cardBorder: 'border-blue-500/40',
    passbookBg: 'bg-[#0f1f4d]',
    chipColor: 'gold',
    emblem: 'jio',
  },
  dbs: {
    id: 'dbs',
    name: 'DBS Bank India',
    shortCode: 'DBS',
    logoBg: 'bg-[#18181b]',
    logoBorder: 'border-red-500/60',
    textColor: 'text-red-500',
    accentColor: '#ef4444',
    cardGradient: 'from-[#09090b] via-[#18181b] to-[#27272a]',
    cardBorder: 'border-red-500/40',
    passbookBg: 'bg-[#121215]',
    chipColor: 'silver',
    emblem: 'dbs',
  },
  citi: {
    id: 'citi',
    name: 'Citibank India',
    shortCode: 'CITI',
    logoBg: 'bg-[#0369a1]',
    logoBorder: 'border-red-500/60',
    textColor: 'text-white',
    accentColor: '#0284c7',
    cardGradient: 'from-[#041d2e] via-[#083859] to-[#0284c7]',
    cardBorder: 'border-sky-500/40',
    passbookBg: 'bg-[#06263d]',
    chipColor: 'silver',
    emblem: 'citi',
  },
  deutsche: {
    id: 'deutsche',
    name: 'Deutsche Bank India',
    shortCode: 'DEUTSCHE',
    logoBg: 'bg-[#0f172a]',
    logoBorder: 'border-blue-500/60',
    textColor: 'text-blue-400',
    accentColor: '#3b82f6',
    cardGradient: 'from-[#050b14] via-[#0b1626] to-[#11243d]',
    cardBorder: 'border-blue-500/40',
    passbookBg: 'bg-[#081220]',
    chipColor: 'silver',
    emblem: 'deutsche',
  },
  rbl: {
    id: 'rbl',
    name: 'RBL Bank',
    shortCode: 'RBL',
    logoBg: 'bg-[#1e1b4b]',
    logoBorder: 'border-red-500/60',
    textColor: 'text-red-400',
    accentColor: '#ef4444',
    cardGradient: 'from-[#090724] via-[#141047] to-[#211c6e]',
    cardBorder: 'border-indigo-500/40',
    passbookBg: 'bg-[#100c3b]',
    chipColor: 'gold',
    emblem: 'rbl',
  },
  boi: {
    id: 'boi',
    name: 'Bank of India',
    shortCode: 'BOI',
    logoBg: 'bg-[#ea580c]',
    logoBorder: 'border-blue-500/60',
    textColor: 'text-white',
    accentColor: '#ea580c',
    cardGradient: 'from-[#2e0d02] via-[#5c1c05] to-[#8c2d08]',
    cardBorder: 'border-orange-500/40',
    passbookBg: 'bg-[#471503]',
    chipColor: 'gold',
    emblem: 'boi',
  },
  indian: {
    id: 'indian',
    name: 'Indian Bank',
    shortCode: 'INDIAN',
    logoBg: 'bg-[#1e3a8a]',
    logoBorder: 'border-amber-400/60',
    textColor: 'text-amber-300',
    accentColor: '#3b82f6',
    cardGradient: 'from-[#091530] via-[#102452] to-[#1e3a8a]',
    cardBorder: 'border-blue-500/40',
    passbookBg: 'bg-[#0c1a3b]',
    chipColor: 'gold',
    emblem: 'indian',
  },
  cbi: {
    id: 'cbi',
    name: 'Central Bank of India',
    shortCode: 'CBI',
    logoBg: 'bg-[#991b1b]',
    logoBorder: 'border-blue-500/60',
    textColor: 'text-white',
    accentColor: '#ef4444',
    cardGradient: 'from-[#2b0505] via-[#590a0a] to-[#871111]',
    cardBorder: 'border-red-500/40',
    passbookBg: 'bg-[#3b0808]',
    chipColor: 'gold',
    emblem: 'cbi',
  },
  iob: {
    id: 'iob',
    name: 'Indian Overseas Bank',
    shortCode: 'IOB',
    logoBg: 'bg-[#1e3a8a]',
    logoBorder: 'border-blue-400/60',
    textColor: 'text-white',
    accentColor: '#3b82f6',
    cardGradient: 'from-[#081229] via-[#0f234f] to-[#1a3d87]',
    cardBorder: 'border-blue-500/40',
    passbookBg: 'bg-[#0b1a3b]',
    chipColor: 'silver',
    emblem: 'iob',
  },
  uco: {
    id: 'uco',
    name: 'UCO Bank',
    shortCode: 'UCO',
    logoBg: 'bg-[#0284c7]',
    logoBorder: 'border-cyan-400/60',
    textColor: 'text-white',
    accentColor: '#0284c7',
    cardGradient: 'from-[#041a29] via-[#083552] to-[#0284c7]',
    cardBorder: 'border-sky-500/40',
    passbookBg: 'bg-[#062438]',
    chipColor: 'gold',
    emblem: 'uco',
  },
  bom: {
    id: 'bom',
    name: 'Bank of Maharashtra',
    shortCode: 'BOM',
    logoBg: 'bg-[#d97706]',
    logoBorder: 'border-blue-500/60',
    textColor: 'text-white',
    accentColor: '#d97706',
    cardGradient: 'from-[#2e1802] via-[#5c3004] to-[#8c4906]',
    cardBorder: 'border-amber-500/40',
    passbookBg: 'bg-[#422203]',
    chipColor: 'gold',
    emblem: 'bom',
  },
  psb: {
    id: 'psb',
    name: 'Punjab & Sind Bank',
    shortCode: 'PSB',
    logoBg: 'bg-[#b45309]',
    logoBorder: 'border-amber-400/60',
    textColor: 'text-white',
    accentColor: '#b45309',
    cardGradient: 'from-[#261102] via-[#4d2304] to-[#753506]',
    cardBorder: 'border-amber-500/40',
    passbookBg: 'bg-[#3b1b04]',
    chipColor: 'gold',
    emblem: 'psb',
  },
  kvb: {
    id: 'kvb',
    name: 'Karur Vysya Bank',
    shortCode: 'KVB',
    logoBg: 'bg-[#b91c1c]',
    logoBorder: 'border-amber-400/60',
    textColor: 'text-amber-300',
    accentColor: '#dc2626',
    cardGradient: 'from-[#2b0505] via-[#590a0a] to-[#871111]',
    cardBorder: 'border-red-500/40',
    passbookBg: 'bg-[#3b0808]',
    chipColor: 'gold',
    emblem: 'kvb',
  },
  cub: {
    id: 'cub',
    name: 'City Union Bank',
    shortCode: 'CUB',
    logoBg: 'bg-[#0369a1]',
    logoBorder: 'border-cyan-400/60',
    textColor: 'text-white',
    accentColor: '#0284c7',
    cardGradient: 'from-[#041a29] via-[#083552] to-[#0369a1]',
    cardBorder: 'border-sky-500/40',
    passbookBg: 'bg-[#062438]',
    chipColor: 'silver',
    emblem: 'cub',
  },
  sib: {
    id: 'sib',
    name: 'South Indian Bank',
    shortCode: 'SIB',
    logoBg: 'bg-[#991b1b]',
    logoBorder: 'border-amber-400/60',
    textColor: 'text-amber-300',
    accentColor: '#dc2626',
    cardGradient: 'from-[#2b0505] via-[#590a0a] to-[#871111]',
    cardBorder: 'border-red-500/40',
    passbookBg: 'bg-[#3b0808]',
    chipColor: 'gold',
    emblem: 'sib',
  },
  ktk: {
    id: 'ktk',
    name: 'Karnataka Bank',
    shortCode: 'KTK',
    logoBg: 'bg-[#1e3a8a]',
    logoBorder: 'border-amber-400/60',
    textColor: 'text-amber-300',
    accentColor: '#3b82f6',
    cardGradient: 'from-[#091530] via-[#102452] to-[#1e3a8a]',
    cardBorder: 'border-blue-500/40',
    passbookBg: 'bg-[#0c1a3b]',
    chipColor: 'gold',
    emblem: 'ktk',
  },
};

/** Deterministic random theme generator for any custom / unknown bank */
const CUSTOM_PALETTES = [
  {
    logoBg: 'bg-[#0f291e]',
    logoBorder: 'border-emerald-500/50',
    textColor: 'text-emerald-300',
    accentColor: '#10b981',
    cardGradient: 'from-[#041a12] via-[#082e20] to-[#0f4d36]',
    cardBorder: 'border-emerald-500/40',
    passbookBg: 'bg-[#062419]',
  },
  {
    logoBg: 'bg-[#1e1b4b]',
    logoBorder: 'border-indigo-400/50',
    textColor: 'text-indigo-300',
    accentColor: '#6366f1',
    cardGradient: 'from-[#090724] via-[#141047] to-[#211c6e]',
    cardBorder: 'border-indigo-500/40',
    passbookBg: 'bg-[#100c3b]',
  },
  {
    logoBg: 'bg-[#31111d]',
    logoBorder: 'border-pink-500/50',
    textColor: 'text-pink-300',
    accentColor: '#ec4899',
    cardGradient: 'from-[#1c070f] via-[#380e20] to-[#591533]',
    cardBorder: 'border-pink-500/40',
    passbookBg: 'bg-[#2b0b19]',
  },
  {
    logoBg: 'bg-[#1e293b]',
    logoBorder: 'border-cyan-400/50',
    textColor: 'text-cyan-300',
    accentColor: '#06b6d4',
    cardGradient: 'from-[#08121e] via-[#0f2338] to-[#183a5c]',
    cardBorder: 'border-cyan-500/40',
    passbookBg: 'bg-[#0b1c2d]',
  },
  {
    logoBg: 'bg-[#2e1065]',
    logoBorder: 'border-purple-400/50',
    textColor: 'text-purple-300',
    accentColor: '#a855f7',
    cardGradient: 'from-[#120529] via-[#240a52] to-[#3b1285]',
    cardBorder: 'border-purple-500/40',
    passbookBg: 'bg-[#1c0840]',
  },
  {
    logoBg: 'bg-[#3b1a03]',
    logoBorder: 'border-amber-400/50',
    textColor: 'text-amber-300',
    accentColor: '#f59e0b',
    cardGradient: 'from-[#1f0d01] via-[#3d1902] to-[#632904]',
    cardBorder: 'border-amber-500/40',
    passbookBg: 'bg-[#2e1302]',
  },
];

function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getBankBrandTheme(nameOrInstitution?: string): BankBrandTheme {
  const query = (nameOrInstitution || '').toLowerCase().trim();
  if (!query) {
    return {
      id: 'default_bank',
      name: 'Bank Account',
      shortCode: 'BANK',
      logoBg: 'bg-slate-800',
      logoBorder: 'border-slate-700',
      textColor: 'text-slate-300',
      accentColor: '#3b82f6',
      cardGradient: 'from-[#0b132b] via-[#1c2541] to-[#253257]',
      cardBorder: 'border-slate-700',
      passbookBg: 'bg-slate-900',
      chipColor: 'silver',
      emblem: 'custom',
    };
  }

  // Exact & Fuzzy Brand Matchers
  if (query.includes('sbi') || query.includes('state bank') || query.includes('state bank of india')) {
    return TOP_INDIAN_BANKS.sbi;
  }
  if (query.includes('hdfc')) {
    return TOP_INDIAN_BANKS.hdfc;
  }
  if (query.includes('icici')) {
    return TOP_INDIAN_BANKS.icici;
  }
  if (query.includes('axis')) {
    return TOP_INDIAN_BANKS.axis;
  }
  if (query.includes('kotak')) {
    return TOP_INDIAN_BANKS.kotak;
  }
  if (query.includes('punjab national') || query.includes('pnb')) {
    return TOP_INDIAN_BANKS.pnb;
  }
  if (query.includes('baroda') || query.includes('bob')) {
    return TOP_INDIAN_BANKS.bob;
  }
  if (query.includes('canara')) {
    return TOP_INDIAN_BANKS.canara;
  }
  if (query.includes('union bank') || query.includes('union')) {
    return TOP_INDIAN_BANKS.union;
  }
  if (query.includes('idfc')) {
    return TOP_INDIAN_BANKS.idfc;
  }
  if (query.includes('indusind')) {
    return TOP_INDIAN_BANKS.indusind;
  }
  if (query.includes('federal')) {
    return TOP_INDIAN_BANKS.federal;
  }
  if (query.includes('yes bank') || query.includes('yes')) {
    return TOP_INDIAN_BANKS.yes;
  }
  if (query.includes('bandhan')) {
    return TOP_INDIAN_BANKS.bandhan;
  }
  if (query.includes('sbm')) {
    return TOP_INDIAN_BANKS.sbm;
  }
  if (query.includes('jupiter')) {
    return TOP_INDIAN_BANKS.jupiter;
  }
  if (query.includes('fi money') || query.includes('fi bank') || query === 'fi') {
    return TOP_INDIAN_BANKS.fi;
  }
  if (query.includes('standard chartered') || query.includes('scb') || query.includes('stanchart')) {
    return TOP_INDIAN_BANKS.sc;
  }
  if (query.includes('hsbc')) {
    return TOP_INDIAN_BANKS.hsbc;
  }
  if (query.includes('au small') || query.includes('au bank') || query.includes('aubl') || query === 'au') {
    return TOP_INDIAN_BANKS.au;
  }
  if (query.includes('airtel')) {
    return TOP_INDIAN_BANKS.airtel;
  }
  if (query.includes('india post') || query.includes('ippb')) {
    return TOP_INDIAN_BANKS.ippb;
  }
  if (query.includes('paytm')) {
    return TOP_INDIAN_BANKS.paytm;
  }
  if (query.includes('jio')) {
    return TOP_INDIAN_BANKS.jio;
  }
  if (query.includes('dbs')) {
    return TOP_INDIAN_BANKS.dbs;
  }
  if (query.includes('citi') || query.includes('citibank')) {
    return TOP_INDIAN_BANKS.citi;
  }
  if (query.includes('deutsche')) {
    return TOP_INDIAN_BANKS.deutsche;
  }
  if (query.includes('rbl') || query.includes('ratnakar')) {
    return TOP_INDIAN_BANKS.rbl;
  }
  if (query.includes('bank of india') || (query.includes('boi') && !query.includes('bom'))) {
    return TOP_INDIAN_BANKS.boi;
  }
  if (query.includes('indian bank') || query.includes('idib')) {
    return TOP_INDIAN_BANKS.indian;
  }
  if (query.includes('central bank')) {
    return TOP_INDIAN_BANKS.cbi;
  }
  if (query.includes('indian overseas') || query.includes('iob')) {
    return TOP_INDIAN_BANKS.iob;
  }
  if (query.includes('uco bank') || query.includes('uco')) {
    return TOP_INDIAN_BANKS.uco;
  }
  if (query.includes('maharashtra') || query.includes('bom')) {
    return TOP_INDIAN_BANKS.bom;
  }
  if (query.includes('punjab & sind') || query.includes('punjab and sind') || query.includes('psb')) {
    return TOP_INDIAN_BANKS.psb;
  }
  if (query.includes('karur vysya') || query.includes('kvb')) {
    return TOP_INDIAN_BANKS.kvb;
  }
  if (query.includes('city union') || query.includes('cub')) {
    return TOP_INDIAN_BANKS.cub;
  }
  if (query.includes('south indian') || query.includes('sib')) {
    return TOP_INDIAN_BANKS.sib;
  }
  if (query.includes('karnataka bank') || query.includes('ktk')) {
    return TOP_INDIAN_BANKS.ktk;
  }

  // Fallback: Generate dynamic deterministic custom theme
  const hash = stringHash(query);
  const palette = CUSTOM_PALETTES[hash % CUSTOM_PALETTES.length];
  const words = nameOrInstitution.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
  const shortCode = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : words[0]?.slice(0, 4).toUpperCase() || 'BANK';

  return {
    id: `custom_${hash}`,
    name: nameOrInstitution,
    shortCode,
    logoBg: palette.logoBg,
    logoBorder: palette.logoBorder,
    textColor: palette.textColor,
    accentColor: palette.accentColor,
    cardGradient: palette.cardGradient,
    cardBorder: palette.cardBorder,
    passbookBg: palette.passbookBg,
    chipColor: hash % 2 === 0 ? 'gold' : 'silver',
    emblem: 'custom',
  };
}

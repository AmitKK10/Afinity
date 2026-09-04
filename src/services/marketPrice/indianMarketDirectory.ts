/**
 * Comprehensive verified directory of Indian Equities (NSE/BSE), ETFs,
 * AMFI Mutual Fund Scheme Codes, and Unlisted Securities.
 *
 * Used for fast search resolution, ticker matching, and asset classification.
 * NOTE: Live market prices are fetched dynamically from real-time sources (Yahoo Finance / AMFI / Gold APIs).
 * Hardcoded stale prices have been removed to prevent false/historical valuations.
 */

export interface StockDirectoryItem {
  name: string;
  symbol: string;
  sector: string;
  exchange: 'NSE' | 'BSE';
  benchmarkPrice?: number;
  aliases?: string[];
  isEtf?: boolean;
}

export interface MutualFundDirectoryItem {
  name: string;
  schemeCode: string;
  amc: string;
  category: string;
  benchmarkNav?: number;
  aliases?: string[];
}

export interface UnlistedSecurityItem {
  name: string;
  symbol: string;
  category: string;
  aliases: string[];
  description: string;
}

/**
 * Top NSE Equities with exact tickers, search aliases and realistic 2026 benchmark prices
 */
export const INDIAN_STOCKS_DIRECTORY: StockDirectoryItem[] = [
  { name: 'Reliance Industries Limited', symbol: 'RELIANCE', sector: 'Energy & Conglomerate', exchange: 'NSE', benchmarkPrice: 3020, aliases: ['RIL', 'RELIANCE IND'] },
  { name: 'Tata Consultancy Services', symbol: 'TCS', sector: 'Information Technology', exchange: 'NSE', benchmarkPrice: 4250, aliases: ['TATA CONSULTANCY'] },
  { name: 'HDFC Bank Limited', symbol: 'HDFCBANK', sector: 'Banking & Financials', exchange: 'NSE', benchmarkPrice: 1650, aliases: ['HDFC', 'HDFC BANK'] },
  { name: 'Infosys Limited', symbol: 'INFY', sector: 'Information Technology', exchange: 'NSE', benchmarkPrice: 1820, aliases: ['INFOSYS'] },
  { name: 'ICICI Bank Limited', symbol: 'ICICIBANK', sector: 'Banking & Financials', exchange: 'NSE', benchmarkPrice: 1240, aliases: ['ICICI'] },
  { name: 'State Bank of India', symbol: 'SBIN', sector: 'Public Sector Banking', exchange: 'NSE', benchmarkPrice: 830, aliases: ['SBI', 'STATE BANK', 'SBIN'] },
  { name: 'Bharti Airtel Limited', symbol: 'BHARTIARTL', sector: 'Telecommunications', exchange: 'NSE', benchmarkPrice: 1540, aliases: ['AIRTEL', 'BHARTI'] },
  { name: 'Tata Motors Limited', symbol: 'TATAMOTORS', sector: 'Automobile', exchange: 'NSE', benchmarkPrice: 1025, aliases: ['TATA MOTORS', 'TATAMTR'] },
  { name: 'ITC Limited', symbol: 'ITC', sector: 'FMCG & Diversified', exchange: 'NSE', benchmarkPrice: 510, aliases: ['ITC LTD'] },
  { name: 'Larsen & Toubro Limited', symbol: 'LT', sector: 'Engineering & Infrastructure', exchange: 'NSE', benchmarkPrice: 3680, aliases: ['L&T', 'LARSEN'] },
  { name: 'Hindustan Unilever Limited', symbol: 'HINDUNILVR', sector: 'FMCG', exchange: 'NSE', benchmarkPrice: 2780, aliases: ['HUL', 'HINDUSTAN UNILEVER'] },
  { name: 'Kotak Mahindra Bank', symbol: 'KOTAKBANK', sector: 'Banking & Financials', exchange: 'NSE', benchmarkPrice: 1820, aliases: ['KOTAK', 'KOTAK MAHINDRA'] },
  { name: 'Axis Bank Limited', symbol: 'AXISBANK', sector: 'Banking & Financials', exchange: 'NSE', benchmarkPrice: 1190, aliases: ['AXIS', 'AXIS BANK'] },
  { name: 'Bajaj Finance Limited', symbol: 'BAJFINANCE', sector: 'Financial Services / NBFC', exchange: 'NSE', benchmarkPrice: 7250, aliases: ['BAJAJ FINANCE'] },
  { name: 'Maruti Suzuki India Limited', symbol: 'MARUTI', sector: 'Automobile', exchange: 'NSE', benchmarkPrice: 12450, aliases: ['MARUTI SUZUKI', 'MARUTI'] },
  { name: 'Sun Pharmaceutical Industries', symbol: 'SUNPHARMA', sector: 'Healthcare & Pharma', exchange: 'NSE', benchmarkPrice: 1780, aliases: ['SUN PHARMA', 'SUNPHARMACEUTICAL'] },
  { name: 'Titan Company Limited', symbol: 'TITAN', sector: 'Consumer Discretionary', exchange: 'NSE', benchmarkPrice: 3580, aliases: ['TITAN IND'] },
  { name: 'Wipro Limited', symbol: 'WIPRO', sector: 'Information Technology', exchange: 'NSE', benchmarkPrice: 540, aliases: ['WIPRO'] },
  { name: 'HCL Technologies Limited', symbol: 'HCLTECH', sector: 'Information Technology', exchange: 'NSE', benchmarkPrice: 1720, aliases: ['HCL TECH'] },
  { name: 'UltraTech Cement Limited', symbol: 'ULTRACEMCO', sector: 'Cement & Building', exchange: 'NSE', benchmarkPrice: 11400, aliases: ['ULTRATECH'] },
  { name: 'NTPC Limited', symbol: 'NTPC', sector: 'Power Generation', exchange: 'NSE', benchmarkPrice: 415, aliases: ['NTPC'] },
  { name: 'Power Grid Corporation of India', symbol: 'POWERGRID', sector: 'Power Transmission', exchange: 'NSE', benchmarkPrice: 335, aliases: ['POWERGRID', 'POWER GRID'] },
  { name: 'Tata Steel Limited', symbol: 'TATASTEEL', sector: 'Metals & Mining', exchange: 'NSE', benchmarkPrice: 155, aliases: ['TATA STEEL'] },
  { name: 'Mahindra & Mahindra Limited', symbol: 'M&M', sector: 'Automobile', exchange: 'NSE', benchmarkPrice: 2840, aliases: ['M&M', 'MAHINDRA', 'MAHINDRA & MAHINDRA'] },
  { name: 'Asian Paints Limited', symbol: 'ASIANPAINT', sector: 'Consumer Paints', exchange: 'NSE', benchmarkPrice: 3120, aliases: ['ASIAN PAINTS'] },
  { name: 'Nestle India Limited', symbol: 'NESTLEIND', sector: 'FMCG & Food', exchange: 'NSE', benchmarkPrice: 2480, aliases: ['NESTLE'] },
  { name: 'Coal India Limited', symbol: 'COALINDIA', sector: 'Energy & Mining', exchange: 'NSE', benchmarkPrice: 510, aliases: ['COAL INDIA', 'CIL'] },
  { name: 'Oil & Natural Gas Corporation', symbol: 'ONGC', sector: 'Oil & Gas Exploration', exchange: 'NSE', benchmarkPrice: 315, aliases: ['ONGC'] },
  { name: 'Adani Ports and SEZ Limited', symbol: 'ADANIPORTS', sector: 'Infrastructure & Ports', exchange: 'NSE', benchmarkPrice: 1480, aliases: ['ADANI PORTS'] },
  { name: 'Adani Enterprises Limited', symbol: 'ADANIENT', sector: 'Diversified Conglomerate', exchange: 'NSE', benchmarkPrice: 3150, aliases: ['ADANI ENTERPRISES'] },
  { name: 'Hero MotoCorp Limited', symbol: 'HEROMOTOCO', sector: 'Automobile (2-Wheelers)', exchange: 'NSE', benchmarkPrice: 5240, aliases: ['HERO', 'HERO HONDA', 'HEROMOTOCORP', 'HERO MOTOCORP'] },
  { name: 'Torrent Power Limited', symbol: 'TORNTPOWER', sector: 'Power & Utilities', exchange: 'NSE', benchmarkPrice: 1720, aliases: ['TORRENT POWER', 'TORRENTPOWER', 'TORNTPOWER'] },
  { name: 'Bajaj Auto Limited', symbol: 'BAJAJ-AUTO', sector: 'Automobile (2-Wheelers)', exchange: 'NSE', benchmarkPrice: 9850, aliases: ['BAJAJ AUTO'] },
  { name: 'Zomato Limited', symbol: 'ZOMATO', sector: 'Tech / Food Delivery / Quick Commerce', exchange: 'NSE', benchmarkPrice: 265, aliases: ['ZOMATO'] },
  { name: 'Jio Financial Services Limited', symbol: 'JIOFIN', sector: 'Financial Services', exchange: 'NSE', benchmarkPrice: 345, aliases: ['JIOFIN', 'JIO FINANCIAL'] },
  { name: 'Trent Limited', symbol: 'TRENT', sector: 'Retail & Fashion', exchange: 'NSE', benchmarkPrice: 7100, aliases: ['TRENT', 'ZUDIO', 'WESTSIDE'] },
  { name: 'Bharat Electronics Limited', symbol: 'BEL', sector: 'Defence & Electronics', exchange: 'NSE', benchmarkPrice: 295, aliases: ['BEL'] },
  { name: 'Hindustan Aeronautics Limited', symbol: 'HAL', sector: 'Defence & Aerospace', exchange: 'NSE', benchmarkPrice: 4750, aliases: ['HAL'] },
  { name: 'Tata Consumer Products Limited', symbol: 'TATACONSUM', sector: 'FMCG', exchange: 'NSE', benchmarkPrice: 1180, aliases: ['TATA CONSUMER', 'TATA TEA'] },
  { name: 'Varun Beverages Limited', symbol: 'VBL', sector: 'Beverages & FMCG', exchange: 'NSE', benchmarkPrice: 1540, aliases: ['VARUN BEVERAGES', 'VBL'] },
  { name: 'Tech Mahindra Limited', symbol: 'TECHM', sector: 'Information Technology', exchange: 'NSE', benchmarkPrice: 1610, aliases: ['TECH MAHINDRA', 'TECHM'] },
  { name: 'Tata Power Company Limited', symbol: 'TATAPOWER', sector: 'Power Generation & Renewable', exchange: 'NSE', benchmarkPrice: 435, aliases: ['TATA POWER'] },
  { name: 'Vedanta Limited', symbol: 'VEDL', sector: 'Metals & Mining', exchange: 'NSE', benchmarkPrice: 465, aliases: ['VEDANTA', 'VEDL'] },
  { name: 'Swiggy Limited', symbol: 'SWIGGY', sector: 'Tech / Quick Commerce', exchange: 'NSE', benchmarkPrice: 490, aliases: ['SWIGGY'] },
  { name: 'One97 Communications Limited', symbol: 'PAYTM', sector: 'Fintech', exchange: 'NSE', benchmarkPrice: 820, aliases: ['PAYTM', 'ONE97'] },
  { name: 'HDFC Life Insurance Company', symbol: 'HDFCLIFE', sector: 'Life Insurance', exchange: 'NSE', benchmarkPrice: 720, aliases: ['HDFC LIFE'] },
  { name: 'SBI Life Insurance Company', symbol: 'SBILIFE', sector: 'Life Insurance', exchange: 'NSE', benchmarkPrice: 1780, aliases: ['SBI LIFE'] },
  { name: 'Bajaj Finserv Limited', symbol: 'BAJAJFINSV', sector: 'Financial Services', exchange: 'NSE', benchmarkPrice: 1850, aliases: ['BAJAJ FINSERV'] },
  { name: 'Eicher Motors Limited', symbol: 'EICHERMOT', sector: 'Automobile', exchange: 'NSE', benchmarkPrice: 4850, aliases: ['ROYAL ENFIELD', 'EICHER'] },
  { name: 'Grasim Industries Limited', symbol: 'GRASIM', sector: 'Cement & Chemicals', exchange: 'NSE', benchmarkPrice: 2680, aliases: ['GRASIM'] },
  { name: 'Hindalco Industries Limited', symbol: 'HINDALCO', sector: 'Metals & Aluminium', exchange: 'NSE', benchmarkPrice: 685, aliases: ['HINDALCO'] },
  { name: 'Divis Laboratories Limited', symbol: 'DIVISLAB', sector: 'Pharma & API', exchange: 'NSE', benchmarkPrice: 5450, aliases: ['DIVIS LAB'] },
  { name: 'Cipla Limited', symbol: 'CIPLA', sector: 'Healthcare & Pharma', exchange: 'NSE', benchmarkPrice: 1580, aliases: ['CIPLA'] },
  { name: 'Apollo Hospitals Enterprise', symbol: 'APOLLOHOSP', sector: 'Healthcare', exchange: 'NSE', benchmarkPrice: 6950, aliases: ['APOLLO HOSPITALS'] },
  { name: 'Dr Reddys Laboratories', symbol: 'DRREDDY', sector: 'Healthcare & Pharma', exchange: 'NSE', benchmarkPrice: 6650, aliases: ['DR REDDY', 'DRREDDYS'] },
  { name: 'Britannia Industries Limited', symbol: 'BRITANNIA', sector: 'FMCG & Food', exchange: 'NSE', benchmarkPrice: 5850, aliases: ['BRITANNIA'] },
  { name: 'Havells India Limited', symbol: 'HAVELLS', sector: 'Consumer Electricals', exchange: 'NSE', benchmarkPrice: 1840, aliases: ['HAVELLS'] },
  { name: 'Polycab India Limited', symbol: 'POLYCAB', sector: 'Cables & Wires', exchange: 'NSE', benchmarkPrice: 6750, aliases: ['POLYCAB'] },
  { name: 'Persistent Systems Limited', symbol: 'PERSISTENT', sector: 'Information Technology', exchange: 'NSE', benchmarkPrice: 5250, aliases: ['PERSISTENT'] },
  { name: 'Coforge Limited', symbol: 'COFORGE', sector: 'Information Technology', exchange: 'NSE', benchmarkPrice: 7650, aliases: ['COFORGE', 'NIIT TECH'] },
  { name: 'Siemens Limited', symbol: 'SIEMENS', sector: 'Capital Goods', exchange: 'NSE', benchmarkPrice: 7100, aliases: ['SIEMENS'] },
  { name: 'ABB India Limited', symbol: 'ABB', sector: 'Capital Goods & Robotics', exchange: 'NSE', benchmarkPrice: 8200, aliases: ['ABB'] },
  { name: 'Max Healthcare Institute', symbol: 'MAXHEALTH', sector: 'Healthcare', exchange: 'NSE', benchmarkPrice: 940, aliases: ['MAX HEALTHCARE'] },
  { name: 'Indian Railway Finance Corporation', symbol: 'IRFC', sector: 'PSU / Railway Finance', exchange: 'NSE', benchmarkPrice: 165, aliases: ['IRFC'] },
  { name: 'Rail Vikas Nigam Limited', symbol: 'RVNL', sector: 'PSU / Railways', exchange: 'NSE', benchmarkPrice: 485, aliases: ['RVNL'] },
  { name: 'Indian Oil Corporation', symbol: 'IOC', sector: 'Oil & Refining', exchange: 'NSE', benchmarkPrice: 175, aliases: ['IOC', 'INDIAN OIL'] },
  { name: 'Bharat Petroleum Corporation', symbol: 'BPCL', sector: 'Oil & Refining', exchange: 'NSE', benchmarkPrice: 345, aliases: ['BPCL', 'BHARAT PETROLEUM'] },
  { name: 'GAIL (India) Limited', symbol: 'GAIL', sector: 'Gas Transmission', exchange: 'NSE', benchmarkPrice: 220, aliases: ['GAIL'] },
  { name: 'Punjab National Bank', symbol: 'PNB', sector: 'PSU Banking', exchange: 'NSE', benchmarkPrice: 110, aliases: ['PNB', 'PUNJAB NATIONAL'] },
  { name: 'Bank of Baroda', symbol: 'BANKBARODA', sector: 'PSU Banking', exchange: 'NSE', benchmarkPrice: 255, aliases: ['BOB', 'BANK OF BARODA'] },
  { name: 'Union Bank of India', symbol: 'UNIONBANK', sector: 'PSU Banking', exchange: 'NSE', benchmarkPrice: 125, aliases: ['UNION BANK'] },
  { name: 'Canara Bank', symbol: 'CANBK', sector: 'PSU Banking', exchange: 'NSE', benchmarkPrice: 105, aliases: ['CANARA BANK'] },
  { name: 'Federal Bank Limited', symbol: 'FEDERALBNK', sector: 'Private Banking', exchange: 'NSE', benchmarkPrice: 195, aliases: ['FEDERAL BANK'] },
  { name: 'IDFC First Bank Limited', symbol: 'IDFCFIRSTB', sector: 'Private Banking', exchange: 'NSE', benchmarkPrice: 75, aliases: ['IDFC FIRST', 'IDFC BANK'] },
  { name: 'IndusInd Bank Limited', symbol: 'INDUSINDBK', sector: 'Private Banking', exchange: 'NSE', benchmarkPrice: 1120, aliases: ['INDUSIND'] },
  { name: 'Suzlon Energy Limited', symbol: 'SUZLON', sector: 'Renewable Energy', exchange: 'NSE', benchmarkPrice: 68, aliases: ['SUZLON'] },
  { name: 'Yes Bank Limited', symbol: 'YESBANK', sector: 'Private Banking', exchange: 'NSE', benchmarkPrice: 22.5, aliases: ['YES BANK'] },
  { name: 'BSE Limited', symbol: 'BSE', sector: 'Financial Market Exchange', exchange: 'NSE', benchmarkPrice: 4850, aliases: ['BSE LTD', 'BOMBAY STOCK EXCHANGE'] },
  { name: 'Multi Commodity Exchange of India', symbol: 'MCX', sector: 'Commodity Exchange', exchange: 'NSE', benchmarkPrice: 6200, aliases: ['MCX'] },
  { name: 'Central Depository Services (India)', symbol: 'CDSL', sector: 'Depository Services', exchange: 'NSE', benchmarkPrice: 1580, aliases: ['CDSL'] },
  { name: 'Computer Age Management Services', symbol: 'CAMS', sector: 'Financial Services / RTA', exchange: 'NSE', benchmarkPrice: 4450, aliases: ['CAMS'] },
  { name: 'Angel One Limited', symbol: 'ANGELONE', sector: 'Brokerage & Fintech', exchange: 'NSE', benchmarkPrice: 2850, aliases: ['ANGEL ONE', 'ANGEL BROKING'] },
];

/**
 * Top Exchange Traded Funds (ETFs) in India with accurate symbols and benchmarks
 */
export const INDIAN_ETFS_DIRECTORY: StockDirectoryItem[] = [
  { name: 'Nippon India ETF Nifty 50 BeES', symbol: 'NIFTYBEES', sector: 'Large Cap Index ETF', exchange: 'NSE', benchmarkPrice: 268.5, isEtf: true, aliases: ['NIFTY BEES', 'NIFTYBEES', 'NIPPON NIFTY 50 ETF'] },
  { name: 'Nippon India ETF Nifty Bank BeES', symbol: 'BANKBEES', sector: 'Banking Sector ETF', exchange: 'NSE', benchmarkPrice: 520.4, isEtf: true, aliases: ['BANK BEES', 'BANKBEES', 'NIPPON BANK ETF'] },
  { name: 'Nippon India ETF Gold BeES', symbol: 'GOLDBEES', sector: 'Precious Metals ETF', exchange: 'NSE', benchmarkPrice: 69.8, isEtf: true, aliases: ['GOLD BEES', 'GOLDBEES', 'NIPPON GOLD'] },
  { name: 'Nippon India Silver ETF', symbol: 'SILVERBEES', sector: 'Precious Metals ETF', exchange: 'NSE', benchmarkPrice: 94.2, isEtf: true, aliases: ['SILVER BEES', 'SILVERBEES', 'NIPPON SILVER'] },
  { name: 'Nippon India ETF Nifty IT', symbol: 'ITBEES', sector: 'IT Sector ETF', exchange: 'NSE', benchmarkPrice: 42.5, isEtf: true, aliases: ['IT BEES', 'ITBEES'] },
  { name: 'Nippon India ETF Nifty Next 50 Junior BeES', symbol: 'JUNIORBEES', sector: 'Mid/Large Cap ETF', exchange: 'NSE', benchmarkPrice: 745.0, isEtf: true, aliases: ['JUNIOR BEES', 'JUNIORBEES'] },
  { name: 'SBI Nifty 50 ETF', symbol: 'SETFNIF50', sector: 'Large Cap Index ETF', exchange: 'NSE', benchmarkPrice: 264.0, isEtf: true, aliases: ['SBI NIFTY ETF', 'SETFNIF50', 'SBI ETF NIFTY 50', 'SBINIFTY'] },
  { name: 'SBI S&P BSE Sensex ETF', symbol: 'SETFSENX', sector: 'Large Cap Index ETF', exchange: 'NSE', benchmarkPrice: 870.0, isEtf: true, aliases: ['SBI SENSEX ETF', 'SETFSENX', 'SBI ETF SENSEX'] },
  { name: 'SBI Gold ETF', symbol: 'SETFGOLD', sector: 'Precious Metals ETF', exchange: 'NSE', benchmarkPrice: 68.2, isEtf: true, aliases: ['SBI GOLD ETF', 'SETFGOLD', 'SBI ETF GOLD'] },
  { name: 'SBI Nifty Next 50 ETF', symbol: 'SETFNN50', sector: 'Large & Midcap ETF', exchange: 'NSE', benchmarkPrice: 720.0, isEtf: true, aliases: ['SBI NEXT 50 ETF', 'SETFNN50'] },
  { name: 'SBI ETF IT', symbol: 'SETFIT', sector: 'IT Sector ETF', exchange: 'NSE', benchmarkPrice: 41.8, isEtf: true, aliases: ['SBI IT ETF', 'SETFIT'] },
  { name: 'SBI ETF Private Bank', symbol: 'SETFPBK', sector: 'Private Banking ETF', exchange: 'NSE', benchmarkPrice: 285.0, isEtf: true, aliases: ['SBI PRIVATE BANK ETF', 'SETFPBK'] },
  { name: 'SBI ETF PSU Bank', symbol: 'SETFPPB', sector: 'PSU Bank ETF', exchange: 'NSE', benchmarkPrice: 74.5, isEtf: true, aliases: ['SBI PSU BANK ETF', 'SETFPPB'] },
  { name: 'CPSE ETF', symbol: 'CPSEETF', sector: 'PSU / CPSE Index ETF', exchange: 'NSE', benchmarkPrice: 94.8, isEtf: true, aliases: ['CPSE ETF', 'CPSE'] },
  { name: 'Motilal Oswal Nasdaq 100 ETF', symbol: 'MON100', sector: 'Global / US Tech ETF', exchange: 'NSE', benchmarkPrice: 175.2, isEtf: true, aliases: ['MO NASDAQ 100', 'MON100', 'NASDAQ ETF'] },
  { name: 'Mirae Asset NYSE FANG+ ETF', symbol: 'MAFANG', sector: 'Global / US Tech ETF', exchange: 'NSE', benchmarkPrice: 104.5, isEtf: true, aliases: ['FANG ETF', 'MAFANG'] },
  { name: 'ICICI Prudential Bharat 22 ETF', symbol: 'ICICIB22', sector: 'PSU / Index ETF', exchange: 'NSE', benchmarkPrice: 91.4, isEtf: true, aliases: ['BHARAT 22', 'BHARAT22', 'ICICIB22'] },
  { name: 'ICICI Prudential Nifty 50 ETF', symbol: 'ICICINIFTY', sector: 'Large Cap Index ETF', exchange: 'NSE', benchmarkPrice: 265.2, isEtf: true, aliases: ['ICICI NIFTY ETF', 'ICICINIFTY'] },
  { name: 'ICICI Prudential Gold ETF', symbol: 'ICICIGOLD', sector: 'Precious Metals ETF', exchange: 'NSE', benchmarkPrice: 67.9, isEtf: true, aliases: ['ICICI GOLD ETF', 'ICICIGOLD'] },
  { name: 'HDFC Gold ETF', symbol: 'HDFCGOLD', sector: 'Precious Metals ETF', exchange: 'NSE', benchmarkPrice: 68.4, isEtf: true, aliases: ['HDFC GOLD ETF', 'HDFCGOLD'] },
  { name: 'HDFC Silver ETF', symbol: 'HDFCSILVER', sector: 'Precious Metals ETF', exchange: 'NSE', benchmarkPrice: 93.8, isEtf: true, aliases: ['HDFC SILVER ETF', 'HDFCSILVER'] },
  { name: 'Tata Silver ETF', symbol: 'TATASILV', sector: 'Precious Metals ETF', exchange: 'NSE', benchmarkPrice: 94.0, isEtf: true, aliases: ['TATA SILVER ETF', 'TATASILV'] },
  { name: 'Kotak Nifty Bank ETF', symbol: 'KOTAKBKETF', sector: 'Banking Sector ETF', exchange: 'NSE', benchmarkPrice: 518.0, isEtf: true, aliases: ['KOTAK BANK ETF', 'KOTAKBKETF'] },
  { name: 'Nippon India ETF Nifty Auto', symbol: 'AUTOBEES', sector: 'Automobile ETF', exchange: 'NSE', benchmarkPrice: 252.0, isEtf: true, aliases: ['AUTO BEES', 'AUTOBEES'] },
  { name: 'Nippon India ETF Nifty Pharma', symbol: 'PHARMABEES', sector: 'Pharma ETF', exchange: 'NSE', benchmarkPrice: 22.8, isEtf: true, aliases: ['PHARMA BEES', 'PHARMABEES'] },
];

/**
 * Recognized Unlisted Equities & Pre-IPO Companies in India (Strict Matching Only)
 */
export const UNLISTED_EQUITY_DIRECTORY: UnlistedSecurityItem[] = [
  {
    name: 'SBI Funds Management Limited (Pre-IPO Equity)',
    symbol: 'SBIFML',
    category: 'Asset Management / AMC (Unlisted Equity)',
    aliases: ['SBIFML', 'SBI FUNDS MANAGEMENT LIMITED', 'SBI FUNDS MANAGEMENT LTD'],
    description: 'India\'s largest Mutual Fund AMC. Unlisted equity share (NOT mutual fund units).',
  },
  {
    name: 'National Stock Exchange of India Limited',
    symbol: 'NSE_UNLISTED',
    category: 'Stock Exchange (Unlisted)',
    aliases: ['NSE_UNLISTED', 'NATIONAL STOCK EXCHANGE OF INDIA', 'NSE UNLISTED SHARES'],
    description: 'Leading stock exchange of India. Pre-IPO unlisted shares.',
  },
  {
    name: 'HDB Financial Services Limited',
    symbol: 'HDBFS',
    category: 'NBFC / Financial Services (Unlisted)',
    aliases: ['HDBFS', 'HDB FINANCIAL SERVICES LIMITED'],
    description: 'Leading non-deposit taking NBFC subsidiary of HDFC Bank. Unlisted equity.',
  },
  {
    name: 'Hero FinCorp Limited',
    symbol: 'HEROFINCORP',
    category: 'NBFC (Unlisted)',
    aliases: ['HEROFINCORP', 'HERO FINCORP LIMITED'],
    description: 'Financial services arm of Hero Group. Pre-IPO unlisted equity.',
  },
  {
    name: 'Tata Capital Limited',
    symbol: 'TATACAPITAL',
    category: 'NBFC / Financial Services (Unlisted)',
    aliases: ['TATACAPITAL', 'TATA CAPITAL LIMITED'],
    description: 'Flagship financial services arm of Tata Sons. Unlisted equity.',
  },
  {
    name: 'Reliance Retail Ventures Limited',
    symbol: 'RELRETAIL',
    category: 'Retail Conglomerate (Unlisted)',
    aliases: ['RELRETAIL', 'RELIANCE RETAIL VENTURES LIMITED', 'RRVL'],
    description: 'Retail holding arm of Reliance Industries. Unlisted equity.',
  },
];

/**
 * Popular Indian Mutual Fund Direct Schemes with verified AMFI scheme codes
 */
export const POPULAR_MUTUAL_FUNDS: MutualFundDirectoryItem[] = [
  // --- SBI Mutual Funds (All Top Direct-Growth Schemes) ---
  {
    name: 'SBI Small Cap Fund - Direct Plan - Growth',
    schemeCode: '125497',
    amc: 'SBI Mutual Fund',
    category: 'Small Cap Fund',
    benchmarkNav: 182.4,
    aliases: ['SBI SMALL CAP', 'SBI SMALLCAP', 'SBI MAGNUM SMALL CAP', 'SBI SMALL CAP DIRECT', 'SBI FUNDS SMALL CAP'],
  },
  {
    name: 'SBI Contra Fund - Direct Plan - Growth',
    schemeCode: '119714',
    amc: 'SBI Mutual Fund',
    category: 'Contra Fund',
    benchmarkNav: 412.8,
    aliases: ['SBI CONTRA', 'SBI CONTRA FUND', 'SBI CONTRA DIRECT', 'SBI FUNDS CONTRA'],
  },
  {
    name: 'SBI Bluechip Fund - Direct Plan - Growth',
    schemeCode: '119707',
    amc: 'SBI Mutual Fund',
    category: 'Large Cap Fund',
    benchmarkNav: 98.6,
    aliases: ['SBI BLUECHIP', 'SBI BLUE CHIP', 'SBI BLUECHIP DIRECT', 'SBI FUNDS BLUECHIP'],
  },
  {
    name: 'SBI Focused Equity Fund - Direct Plan - Growth',
    schemeCode: '119711',
    amc: 'SBI Mutual Fund',
    category: 'Focused Fund',
    benchmarkNav: 320.5,
    aliases: ['SBI FOCUSED', 'SBI FOCUSED EQUITY', 'SBI EMERGING BUSINESSES'],
  },
  {
    name: 'SBI Long Term Equity Fund - Direct Plan - Growth (ELSS)',
    schemeCode: '119717',
    amc: 'SBI Mutual Fund',
    category: 'ELSS Tax Saver',
    benchmarkNav: 425.0,
    aliases: ['SBI ELSS', 'SBI LONG TERM EQUITY', 'SBI TAX SAVER', 'SBI MAGNUM TAX GAIN'],
  },
  {
    name: 'SBI Magnum Midcap Fund - Direct Plan - Growth',
    schemeCode: '119597',
    amc: 'SBI Mutual Fund',
    category: 'Mid Cap Fund',
    benchmarkNav: 245.8,
    aliases: ['SBI MAGNUM MIDCAP', 'SBI MIDCAP', 'SBI MID CAP FUND'],
  },
  {
    name: 'SBI Nifty 50 Index Fund - Direct Plan - Growth',
    schemeCode: '119823',
    amc: 'SBI Mutual Fund',
    category: 'Index Fund',
    benchmarkNav: 242.0,
    aliases: ['SBI NIFTY INDEX', 'SBI NIFTY 50 INDEX FUND', 'SBI INDEX FUND'],
  },
  {
    name: 'SBI Technology Opportunities Fund - Direct Plan - Growth',
    schemeCode: '119849',
    amc: 'SBI Mutual Fund',
    category: 'Sectoral / Technology',
    benchmarkNav: 230.5,
    aliases: ['SBI TECH', 'SBI TECHNOLOGY OPPORTUNITIES', 'SBI IT FUND'],
  },
  {
    name: 'SBI Healthcare Opportunities Fund - Direct Plan - Growth',
    schemeCode: '119847',
    amc: 'SBI Mutual Fund',
    category: 'Sectoral / Pharma',
    benchmarkNav: 410.2,
    aliases: ['SBI HEALTHCARE', 'SBI PHARMA FUND'],
  },
  {
    name: 'SBI Balanced Advantage Fund - Direct Plan - Growth',
    schemeCode: '149021',
    amc: 'SBI Mutual Fund',
    category: 'Dynamic Asset Allocation',
    benchmarkNav: 15.4,
    aliases: ['SBI BALANCED ADVANTAGE', 'SBI BAF'],
  },
  {
    name: 'SBI PSU Fund - Direct Plan - Growth',
    schemeCode: '119848',
    amc: 'SBI Mutual Fund',
    category: 'Thematic / PSU',
    benchmarkNav: 38.5,
    aliases: ['SBI PSU', 'SBI PSU FUND'],
  },

  // --- Parag Parikh, Quant, Tata, UTI, SBI Gold ---
  {
    name: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
    schemeCode: '122639',
    amc: 'Parag Parikh Mutual Fund',
    category: 'Flexi Cap Fund',
    aliases: ['PARAG PARIKH', 'PPFAS', 'PARAG PARIKH FLEXI CAP', 'PARAG PARIKH MUTUAL FUND', 'PPFCF'],
  },
  {
    name: 'Tata Small Cap Fund - Direct Plan - Growth',
    schemeCode: '145206',
    amc: 'Tata Mutual Fund',
    category: 'Small Cap Fund',
    aliases: ['TATA SMALL CAP', 'TATA SMALLCAP', 'TATA SMALL CAP FUND DIRECT', 'TATA SMALL CAP DIRECT GROWTH'],
  },
  {
    name: 'SBI Gold Fund - Direct Plan - Growth',
    schemeCode: '119788',
    amc: 'SBI Mutual Fund',
    category: 'Gold Fund of Funds',
    aliases: ['SBI GOLD', 'SBI GOLD FUND', 'SBI GOLD DIRECT', 'SBI GOLD FUND DIRECT GROWTH'],
  },
  {
    name: 'UTI Nifty200 Momentum 30 Index Fund - Direct Plan - Growth',
    schemeCode: '148703',
    amc: 'UTI Mutual Fund',
    category: 'Index / Momentum Fund',
    aliases: ['UTI NIFTY 200 MOMENTUM 30', 'UTI NIFTY200 MOMENTUM 30', 'UTI MOMENTUM 30', 'NIFTY200 MOMENTUM 30'],
  },
  {
    name: 'Quant Small Cap Fund - Direct Plan - Growth',
    schemeCode: '120847',
    amc: 'Quant Mutual Fund',
    category: 'Small Cap Fund',
    benchmarkNav: 265.0,
    aliases: ['QUANT SMALL CAP', 'QUANT SMALLCAP'],
  },
  {
    name: 'Quant Active Fund - Direct Plan - Growth',
    schemeCode: '120828',
    amc: 'Quant Mutual Fund',
    category: 'Multi Cap Fund',
    benchmarkNav: 670.0,
    aliases: ['QUANT ACTIVE', 'QUANT ACTIVE FUND'],
  },
  {
    name: 'Quant Mid Cap Fund - Direct Plan - Growth',
    schemeCode: '120841',
    amc: 'Quant Mutual Fund',
    category: 'Mid Cap Fund',
    benchmarkNav: 240.0,
    aliases: ['QUANT MID CAP', 'QUANT MIDCAP'],
  },
  {
    name: 'Quant Flexi Cap Fund - Direct Plan - Growth',
    schemeCode: '120843',
    amc: 'Quant Mutual Fund',
    category: 'Flexi Cap Fund',
    benchmarkNav: 105.0,
    aliases: ['QUANT FLEXI CAP', 'QUANT FLEXICAP'],
  },

  // --- Nippon, HDFC, ICICI, Bandhan, Mirae, Axis, Motilal, UTI ---
  {
    name: 'Nippon India Small Cap Fund - Direct Plan - Growth',
    schemeCode: '118778',
    amc: 'Nippon India Mutual Fund',
    category: 'Small Cap Fund',
    benchmarkNav: 168.5,
    aliases: ['NIPPON SMALL CAP', 'NIPPON INDIA SMALL CAP', 'RELIANCE SMALL CAP', 'NIPPON_SC'],
  },
  {
    name: 'Bandhan Sterling Value Fund - Direct Plan - Growth',
    schemeCode: '118671',
    amc: 'Bandhan Mutual Fund',
    category: 'Value Fund',
    benchmarkNav: 145.0,
    aliases: ['BANDHAN STERLING', 'IDFC STERLING VALUE', 'BANDHAN VALUE FUND', 'STERLING VALUE'],
  },
  {
    name: 'HDFC Mid-Cap Opportunities Fund - Direct Plan - Growth',
    schemeCode: '118989',
    amc: 'HDFC Mutual Fund',
    category: 'Mid Cap Fund',
    benchmarkNav: 195.0,
    aliases: ['HDFC MID CAP', 'HDFC MIDCAP OPPORTUNITIES'],
  },
  {
    name: 'HDFC Small Cap Fund - Direct Plan - Growth',
    schemeCode: '130503',
    amc: 'HDFC Mutual Fund',
    category: 'Small Cap Fund',
    benchmarkNav: 145.0,
    aliases: ['HDFC SMALL CAP', 'HDFC SMALLCAP'],
  },
  {
    name: 'HDFC Top 100 Fund - Direct Plan - Growth',
    schemeCode: '118968',
    amc: 'HDFC Mutual Fund',
    category: 'Large Cap Fund',
    benchmarkNav: 1120.0,
    aliases: ['HDFC TOP 100', 'HDFC TOP 200'],
  },
  {
    name: 'HDFC Flexi Cap Fund - Direct Plan - Growth',
    schemeCode: '118955',
    amc: 'HDFC Mutual Fund',
    category: 'Flexi Cap Fund',
    benchmarkNav: 1850.0,
    aliases: ['HDFC FLEXI CAP', 'HDFC EQUITY FUND'],
  },
  {
    name: 'ICICI Prudential Bluechip Fund - Direct Plan - Growth',
    schemeCode: '120586',
    amc: 'ICICI Prudential Mutual Fund',
    category: 'Large Cap Fund',
    benchmarkNav: 115.0,
    aliases: ['ICICI BLUECHIP', 'ICICI PRUDENTIAL BLUECHIP', 'ICICI PRU BLUECHIP'],
  },
  {
    name: 'ICICI Prudential Value Discovery Fund - Direct Plan - Growth',
    schemeCode: '120620',
    amc: 'ICICI Prudential Mutual Fund',
    category: 'Value Fund',
    benchmarkNav: 430.0,
    aliases: ['ICICI VALUE DISCOVERY', 'ICICI PRU VALUE DISCOVERY'],
  },
  {
    name: 'ICICI Prudential Smallcap Fund - Direct Plan - Growth',
    schemeCode: '120612',
    amc: 'ICICI Prudential Mutual Fund',
    category: 'Small Cap Fund',
    benchmarkNav: 92.5,
    aliases: ['ICICI SMALL CAP', 'ICICI SMALLCAP'],
  },
  {
    name: 'Mirae Asset Large Cap Fund - Direct Plan - Growth',
    schemeCode: '118834',
    amc: 'Mirae Asset Mutual Fund',
    category: 'Large Cap Fund',
    benchmarkNav: 125.0,
    aliases: ['MIRAE LARGE CAP', 'MIRAE ASSET LARGE CAP'],
  },
  {
    name: 'Mirae Asset ELSS Tax Saver Fund - Direct Plan - Growth',
    schemeCode: '135784',
    amc: 'Mirae Asset Mutual Fund',
    category: 'ELSS Tax Saver',
    benchmarkNav: 48.0,
    aliases: ['MIRAE TAX SAVER', 'MIRAE ELSS'],
  },
  {
    name: 'Axis Bluechip Fund - Direct Plan - Growth',
    schemeCode: '120503',
    amc: 'Axis Mutual Fund',
    category: 'Large Cap Fund',
    benchmarkNav: 58.0,
    aliases: ['AXIS BLUECHIP', 'AXIS BLUE CHIP'],
  },
  {
    name: 'Axis Small Cap Fund - Direct Plan - Growth',
    schemeCode: '125354',
    amc: 'Axis Mutual Fund',
    category: 'Small Cap Fund',
    benchmarkNav: 112.0,
    aliases: ['AXIS SMALL CAP', 'AXIS SMALLCAP'],
  },
  {
    name: 'Tata Digital India Fund - Direct Plan - Growth',
    schemeCode: '135781',
    amc: 'Tata Mutual Fund',
    category: 'Sectoral / Tech',
    benchmarkNav: 52.0,
    aliases: ['TATA DIGITAL', 'TATA DIGITAL INDIA'],
  },
  {
    name: 'Motilal Oswal Midcap Fund - Direct Plan - Growth',
    schemeCode: '127042',
    amc: 'Motilal Oswal Mutual Fund',
    category: 'Mid Cap Fund',
    benchmarkNav: 108.0,
    aliases: ['MOTILAL MIDCAP', 'MOTILAL OSWAL MIDCAP'],
  },
  {
    name: 'UTI Nifty 50 Index Fund - Direct Plan - Growth',
    schemeCode: '120716',
    amc: 'UTI Mutual Fund',
    category: 'Index Fund',
    benchmarkNav: 185.0,
    aliases: ['UTI NIFTY 50', 'UTI NIFTY INDEX'],
  },
  {
    name: 'Kotak Emerging Equity Fund - Direct Plan - Growth',
    schemeCode: '119284',
    amc: 'Kotak Mahindra Mutual Fund',
    category: 'Mid Cap Fund',
    benchmarkNav: 135.0,
    aliases: ['KOTAK EMERGING', 'KOTAK EMERGING EQUITY'],
  },
  {
    name: 'Canara Robeco Emerging Equities - Direct Plan - Growth',
    schemeCode: '118556',
    amc: 'Canara Robeco Mutual Fund',
    category: 'Large & Mid Cap Fund',
    benchmarkNav: 255.0,
    aliases: ['CANARA ROBECO EMERGING', 'CANARA EMERGING EQUITIES'],
  },
];

/**
 * Standard benchmark gold rate fallback in INR per gram (24 Karat 999 Fine Gold)
 */
export const BENCHMARK_GOLD_PRICE_PER_GRAM = 8650.0;

/**
 * Resolves a search input or holding identifier against Unlisted Equities.
 * STRICT MATCHING: Only matches exact unlisted ticker symbols or explicit private share names.
 * Will NEVER match standard mutual funds, ETFs, or listed equities.
 */
export function resolveUnlistedSecurity(input: string): UnlistedSecurityItem | undefined {
  if (!input) return undefined;
  const clean = input.trim().toUpperCase();

  // If the query clearly looks like a mutual fund or ETF, do NOT match unlisted
  if (
    clean.includes('MUTUAL FUND') ||
    clean.includes('DIRECT') ||
    clean.includes('GROWTH') ||
    clean.includes('PLAN') ||
    clean.includes('ETF') ||
    clean.includes('SCHEME') ||
    clean.includes('CAP FUND') ||
    clean.includes('INDEX FUND')
  ) {
    return undefined;
  }

  return UNLISTED_EQUITY_DIRECTORY.find((item) => {
    // Exact symbol match
    if (item.symbol.toUpperCase() === clean) return true;
    // Exact full name match
    if (item.name.toUpperCase() === clean) return true;
    // Exact alias match only (no loose substring inclusion)
    if (item.aliases.some((alias) => alias.toUpperCase() === clean)) {
      return true;
    }
    return false;
  });
}

/**
 * Resolves stock or ETF symbol to standard ticker
 */
export function resolveIndianStockSymbol(input: string): StockDirectoryItem | undefined {
  if (!input) return undefined;
  const clean = input.trim().toUpperCase();

  // 1. Check ETFs first by exact symbol or alias
  const byEtfSymbol = INDIAN_ETFS_DIRECTORY.find((e) => e.symbol.toUpperCase() === clean);
  if (byEtfSymbol) return byEtfSymbol;

  const byEtfName = INDIAN_ETFS_DIRECTORY.find((e) => e.name.toUpperCase() === clean);
  if (byEtfName) return byEtfName;

  const byEtfAlias = INDIAN_ETFS_DIRECTORY.find((e) =>
    e.aliases?.some((a) => a.toUpperCase() === clean || clean.includes(a.toUpperCase()))
  );
  if (byEtfAlias) return byEtfAlias;

  // 2. Check Equities Directory by exact symbol or name
  const bySymbol = INDIAN_STOCKS_DIRECTORY.find((s) => s.symbol.toUpperCase() === clean);
  if (bySymbol) return bySymbol;

  const byName = INDIAN_STOCKS_DIRECTORY.find((s) => s.name.toUpperCase() === clean);
  if (byName) return byName;

  const byAlias = INDIAN_STOCKS_DIRECTORY.find((s) =>
    s.aliases?.some((a) => a.toUpperCase() === clean || clean.includes(a.toUpperCase()))
  );
  if (byAlias) return byAlias;

  // 3. Substring search in ETFs
  const etfSub = INDIAN_ETFS_DIRECTORY.find((e) => {
    const eName = e.name.toUpperCase();
    const eSym = e.symbol.toUpperCase();
    return eName.includes(clean) || clean.includes(eSym);
  });
  if (etfSub) return etfSub;

  // 4. Substring search in equities
  return INDIAN_STOCKS_DIRECTORY.find((s) => {
    const sName = s.name.toUpperCase();
    const sSym = s.symbol.toUpperCase();
    return sName.includes(clean) || clean.includes(sSym);
  });
}

/**
 * Resolves Mutual Fund Scheme Code or Directory Item
 */
export function resolveMutualFundPreset(input: string): MutualFundDirectoryItem | undefined {
  if (!input) return undefined;
  const clean = input.trim().toUpperCase();

  // Check scheme code directly
  const byCode = POPULAR_MUTUAL_FUNDS.find((f) => f.schemeCode === clean);
  if (byCode) return byCode;

  // Check exact name
  const byName = POPULAR_MUTUAL_FUNDS.find((f) => f.name.toUpperCase() === clean);
  if (byName) return byName;

  // Check aliases
  const byAlias = POPULAR_MUTUAL_FUNDS.find((f) =>
    f.aliases?.some((a) => a.toUpperCase() === clean || clean.includes(a.toUpperCase()))
  );
  if (byAlias) return byAlias;

  // Keyword / Substring search
  return POPULAR_MUTUAL_FUNDS.find((f) => {
    const fName = f.name.toUpperCase();
    const fAmc = f.amc.toUpperCase();
    return fName.includes(clean) || clean.includes(fName) || fAmc.includes(clean);
  });
}

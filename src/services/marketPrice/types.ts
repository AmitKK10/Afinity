import {
  InvestmentPriceSource,
  InvestmentPriceStatus,
  InvestmentPriceRefreshFrequency,
  MarketPriceResult,
  PortfolioPriceRefreshSummary,
  InvestmentHolding,
} from '../../types';

export interface MarketPriceProvider {
  name: string;
  getStockPrice(symbol: string): Promise<MarketPriceResult>;
  getEtfPrice?(symbol: string): Promise<MarketPriceResult>;
  getMutualFundNAV(schemeCodeOrIdentifier: string, fundName?: string): Promise<MarketPriceResult>;
  getGoldPrice(unit?: string): Promise<MarketPriceResult>;
  searchMutualFunds?(query: string): Promise<Array<{ schemeCode: string; schemeName: string }>>;
}

export interface RefreshPortfolioOptions {
  force?: boolean;
  frequency?: InvestmentPriceRefreshFrequency;
  customHoldings?: InvestmentHolding[];
}

export interface RefreshIntervalConfig {
  intervalHours: number;
  label: string;
  description: string;
}

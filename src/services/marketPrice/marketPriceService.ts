/**
 * Afinity Centralized Investment Market Price Refresh Service
 * Orchestrates real-time market updates, symbol deduplication, robust partial-failure tolerance,
 * and persistent audit logging with strict protection against stale/mock data.
 */

import {
  InvestmentHolding,
  InvestmentPriceRefreshFrequency,
  InvestmentPriceStatus,
  PortfolioPriceRefreshSummary,
  MarketPriceResult,
} from '../../types';
import { MarketPriceProvider, RefreshPortfolioOptions } from './types';
import { defaultMarketPriceProvider } from './marketPriceProvider';
import { repository } from '../repository';

// Default interval values in milliseconds
export const REFRESH_INTERVAL_HOURS: Record<InvestmentPriceRefreshFrequency, number> = {
  twice_daily: 12,
  once_daily: 24,
  manual_only: Infinity,
};

export class MarketPriceService {
  private provider: MarketPriceProvider;
  private isRefreshing: boolean = false;

  constructor(provider: MarketPriceProvider = defaultMarketPriceProvider) {
    this.provider = provider;
  }

  /**
   * Set a custom or replaced provider
   */
  setProvider(provider: MarketPriceProvider) {
    this.provider = provider;
  }

  /**
   * Get active provider instance
   */
  getProvider(): MarketPriceProvider {
    return this.provider;
  }

  /**
   * Check if a specific holding is due for a price refresh based on its last updated time.
   */
  isHoldingDueForRefresh(
    holding: InvestmentHolding,
    frequency: InvestmentPriceRefreshFrequency = 'twice_daily',
    force: boolean = false
  ): boolean {
    if (force) return true;
    if (frequency === 'manual_only') return false;

    // Never auto-refresh archived holdings
    if (holding.status === 'archived') return false;

    // Unlisted equities do not have public exchange auto-refreshes
    const rawType = (holding.assetType || holding.type || '').toString().toUpperCase();
    if (rawType === 'UNLISTED_EQUITY' || holding.priceStatus === 'unlisted') {
      return false;
    }

    const lastUpdated = holding.priceUpdatedAt || holding.updatedAt || holding.lastUpdated;
    if (!lastUpdated) return true;

    const lastTime = new Date(lastUpdated).getTime();
    if (isNaN(lastTime)) return true;

    const intervalMs = REFRESH_INTERVAL_HOURS[frequency] * 60 * 60 * 1000;
    const now = Date.now();

    return now - lastTime >= intervalMs;
  }

  /**
   * Compute the next eligible refresh time string
   */
  getNextEligibleRefreshDate(
    lastRefreshedAt: string | undefined,
    frequency: InvestmentPriceRefreshFrequency = 'twice_daily'
  ): Date | null {
    if (frequency === 'manual_only') return null;
    if (!lastRefreshedAt) return new Date();

    const lastTime = new Date(lastRefreshedAt).getTime();
    if (isNaN(lastTime)) return new Date();

    const intervalMs = REFRESH_INTERVAL_HOURS[frequency] * 60 * 60 * 1000;
    return new Date(lastTime + intervalMs);
  }

  /**
   * Determine the current price status badge for an individual holding.
   */
  getHoldingPriceStatus(
    holding: InvestmentHolding,
    frequency: InvestmentPriceRefreshFrequency = 'twice_daily'
  ): InvestmentPriceStatus {
    const rawType = (holding.assetType || holding.type || '').toString().toUpperCase();
    if (rawType === 'UNLISTED_EQUITY' || holding.priceStatus === 'unlisted') {
      return 'unlisted';
    }

    if (holding.priceFailureReason && !holding.priceUpdatedAt) {
      return 'failed';
    }

    const source = (holding.priceSource || '').toString().toUpperCase();
    if (source === 'MANUAL') {
      return 'manual';
    }

    const lastUpdated = holding.priceUpdatedAt || holding.updatedAt || holding.lastUpdated;
    if (!lastUpdated) return 'stale';

    const lastTime = new Date(lastUpdated).getTime();
    if (isNaN(lastTime)) return 'stale';

    const elapsedHours = (Date.now() - lastTime) / (1000 * 60 * 60);

    if (elapsedHours < 6) {
      return 'live';
    } else if (elapsedHours < 36) {
      return 'updated';
    } else if (elapsedHours < 72) {
      return 'recent';
    } else {
      return 'stale';
    }
  }

  /**
   * Primary method to refresh portfolio investment prices.
   * Handles symbol deduplication, error isolation, partial failures, and metadata persistence.
   */
  async refreshPortfolioPrices(
    holdings: InvestmentHolding[],
    options: RefreshPortfolioOptions = {}
  ): Promise<PortfolioPriceRefreshSummary> {
    const { force = false, frequency = 'twice_daily' } = options;
    const now = new Date().toISOString();

    const summary: PortfolioPriceRefreshSummary = {
      timestamp: now,
      totalAttempted: 0,
      totalSuccess: 0,
      totalUpdated: 0,
      totalUnchanged: 0,
      totalFailed: 0,
      totalSkippedDueToInterval: 0,
      failedHoldings: [],
      updatedHoldings: [],
      unchangedHoldings: [],
      isCompleteSuccess: false,
      hasPartialFailures: false,
    };

    // Prevent concurrent runs
    if (this.isRefreshing) {
      return {
        ...summary,
        isCompleteSuccess: false,
        statusHeadline: 'Refresh already in progress',
        failedHoldings: [{ id: 'system', name: 'System', reason: 'A price refresh is already in progress' }],
      };
    }

    // Check device online status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        ...summary,
        isCompleteSuccess: false,
        statusHeadline: 'Device is offline',
        failedHoldings: [{ id: 'network', name: 'Device Offline', reason: 'Offline: Retaining last recorded prices' }],
      };
    }

    this.isRefreshing = true;

    try {
      // 1. Filter eligible active holdings
      const activeHoldings = holdings.filter((h) => (h.status || 'active') === 'active');
      const dueHoldings: InvestmentHolding[] = [];

      for (const holding of activeHoldings) {
        if (this.isHoldingDueForRefresh(holding, frequency, force)) {
          dueHoldings.push(holding);
        } else {
          summary.totalSkippedDueToInterval++;
        }
      }

      if (dueHoldings.length === 0) {
        summary.isCompleteSuccess = true;
        summary.statusHeadline = 'All investment prices are already current';
        this.isRefreshing = false;
        return summary;
      }

      summary.totalAttempted = dueHoldings.length;

      // 2. Group holdings by unique resolution key to deduplicate API queries
      const symbolMap = new Map<string, InvestmentHolding[]>();

      for (const holding of dueHoldings) {
        const rawType = (holding.assetType || holding.type || 'STOCK').toString().toUpperCase();
        let key = '';

        if (rawType === 'MUTUAL_FUND' || rawType === 'MUTUAL_FUNDS') {
          key = `MF:${holding.schemeCode || holding.symbol || holding.name}`;
        } else if (rawType === 'GOLD' || rawType === 'SGB') {
          key = `GOLD:${holding.unit || 'GRAM'}`;
        } else if (rawType === 'ETF') {
          key = `ETF:${holding.symbol || holding.name}`;
        } else if (rawType === 'UNLISTED_EQUITY') {
          key = `UNLISTED:${holding.symbol || holding.name}`;
        } else {
          key = `STOCK:${holding.symbol || holding.name}`;
        }

        const list = symbolMap.get(key) || [];
        list.push(holding);
        symbolMap.set(key, list);
      }

      // 3. Execute price requests for unique symbols concurrently
      const entries = Array.from(symbolMap.entries());

      await Promise.all(
        entries.map(async ([key, matchedHoldings]) => {
          const representative = matchedHoldings[0];
          const rawType = (representative.assetType || representative.type || 'STOCK').toString().toUpperCase();

          try {
            let res: MarketPriceResult;

            if (rawType === 'MUTUAL_FUND' || rawType === 'MUTUAL_FUNDS') {
              const codeOrName = representative.schemeCode || representative.symbol || representative.name;
              res = await this.provider.getMutualFundNAV(codeOrName, representative.name);
            } else if (rawType === 'GOLD' || rawType === 'SGB') {
              res = await this.provider.getGoldPrice(representative.unit || 'GRAM');
            } else if (rawType === 'ETF' && this.provider.getEtfPrice) {
              const symbol = representative.symbol || representative.name;
              res = await this.provider.getEtfPrice(symbol);
            } else {
              const symbol = representative.symbol || representative.name;
              res = await this.provider.getStockPrice(symbol);
            }

            if (res.isSuccess && res.price > 0) {
              const priceStatus: InvestmentPriceStatus = 'updated';
              const priceAsOf = res.asOfDate || res.dataAsOf || now;

              for (const h of matchedHoldings) {
                const oldPrice = Number(h.currentPrice || 0);
                const newPrice = res.price;

                await repository.updateInvestmentPrice(h.id, newPrice, res.source, {
                  priceUpdatedAt: now,
                  priceAsOfDate: priceAsOf,
                  priceFetchedAt: res.fetchedAt || now,
                  priceStatus,
                  dayChange: res.changeAmount,
                  dayChangePercentage: res.changePercentage,
                  priceFailureReason: undefined,
                });

                const priceChanged = Math.abs(newPrice - oldPrice) > 0.001;
                if (priceChanged) {
                  summary.totalUpdated++;
                  summary.updatedHoldings.push({
                    id: h.id,
                    name: h.displayName || h.name,
                    symbol: h.symbol,
                    assetType: h.assetType || h.type,
                    oldPrice,
                    newPrice,
                    source: res.source,
                    asOfDate: priceAsOf,
                    priceChanged: true,
                  });
                } else {
                  summary.totalUnchanged++;
                  summary.unchangedHoldings?.push({
                    id: h.id,
                    name: h.displayName || h.name,
                    symbol: h.symbol,
                    assetType: h.assetType || h.type,
                    oldPrice,
                    newPrice,
                    source: res.source,
                    asOfDate: priceAsOf,
                    priceChanged: false,
                  });
                }
              }
            } else if (res.isUnlisted) {
              // Unlisted entity: mark explicitly without falsifying market data
              summary.totalFailed += matchedHoldings.length;

              for (const h of matchedHoldings) {
                await repository.updateInvestment(h.id, {
                  assetType: 'UNLISTED_EQUITY',
                  priceStatus: 'unlisted',
                  priceSource: 'MANUAL',
                  priceFailureReason: res.errorMessage || 'Unlisted Equity (Private Market)',
                  lastPriceAttemptAt: now,
                });

                summary.failedHoldings.push({
                  id: h.id,
                  name: h.displayName || h.name,
                  symbol: h.symbol,
                  schemeCode: h.schemeCode,
                  assetType: 'UNLISTED_EQUITY',
                  reason: 'Unlisted Equity (Private/Grey Market)',
                  lastKnownPrice: h.currentPrice,
                  isUnlisted: true,
                });
              }
            } else {
              // Failed price fetch: retain previous price and record explicit failure reason
              summary.totalFailed += matchedHoldings.length;

              for (const h of matchedHoldings) {
                await repository.updateInvestment(h.id, {
                  priceStatus: 'failed',
                  priceFailureReason: res.errorMessage || 'Live market quote unavailable',
                  lastPriceAttemptAt: now,
                });

                summary.failedHoldings.push({
                  id: h.id,
                  name: h.displayName || h.name,
                  symbol: h.symbol,
                  schemeCode: h.schemeCode,
                  assetType: h.assetType || h.type,
                  reason: res.errorMessage || 'Live market quote unavailable from public provider',
                  lastKnownPrice: h.currentPrice,
                  isUnlisted: false,
                });
              }
            }
          } catch (err: any) {
            summary.totalFailed += matchedHoldings.length;

            for (const h of matchedHoldings) {
              await repository.updateInvestment(h.id, {
                priceStatus: 'failed',
                priceFailureReason: err?.message || 'Network exception during fetch',
                lastPriceAttemptAt: now,
              });

              summary.failedHoldings.push({
                id: h.id,
                name: h.displayName || h.name,
                symbol: h.symbol,
                schemeCode: h.schemeCode,
                assetType: h.assetType || h.type,
                reason: err?.message || 'Network error while querying price provider',
                lastKnownPrice: h.currentPrice,
                isUnlisted: false,
              });
            }
          }
        })
      );

      // 4. Calculate final independent counts and statuses
      summary.totalSuccess = summary.totalUpdated + summary.totalUnchanged;
      summary.isCompleteSuccess = summary.totalFailed === 0 && summary.totalAttempted > 0;
      summary.hasPartialFailures = summary.totalSuccess > 0 && summary.totalFailed > 0;

      if (summary.isCompleteSuccess) {
        summary.statusHeadline = `All ${summary.totalSuccess} asset prices verified live`;
      } else if (summary.hasPartialFailures) {
        summary.statusHeadline = `Partial refresh: ${summary.totalSuccess} verified, ${summary.totalFailed} retained manual valuation`;
      } else if (summary.totalFailed > 0) {
        summary.statusHeadline = `Could not fetch live quotes for ${summary.totalFailed} asset(s)`;
      } else {
        summary.statusHeadline = 'Portfolio prices are up to date';
      }

      // 4. Update last market price refresh timestamp in user settings
      await repository.updateSettings({
        lastMarketPriceRefreshAt: now,
      });

      // 5. Log audit event for price refresh operation
      await repository.logAuditEvent(
        'ACCOUNT_UPDATED',
        'investment_market_refresh',
        'portfolio',
        `Refreshed ${summary.totalUpdated} investment holdings`,
        {
          totalAttempted: summary.totalAttempted,
          totalUpdated: summary.totalUpdated,
          totalUnchanged: summary.totalUnchanged,
          totalFailed: summary.totalFailed,
          timestamp: now,
        }
      );

      return summary;
    } finally {
      this.isRefreshing = false;
    }
  }
}

// Global Singleton Service Instance
export const marketPriceService = new MarketPriceService();

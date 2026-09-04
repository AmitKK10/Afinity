/**
 * Afinity Widget Synchronization Hook
 * Observes financial data context changes and auto-synchronizes snapshots
 * with the native Android widget provider and companion preview.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFinancialData } from '../context/FinancialDataContext';
import { AfinityWidgetSnapshot, WidgetSyncSettings } from '../types/widget';
import {
  generateLiveWidgetSnapshot,
  generateSampleDemoSnapshot,
} from '../services/widgetDataService';
import { capacitorWidgetBridge } from '../services/capacitorWidgetBridge';

export function useWidgetSync() {
  const {
    netWorth,
    totalAssets,
    totalLiabilities,
    bankAccounts,
    creditCards,
    sips,
    portfolioSummary,
    creditPosition,
    bankPosition,
    sipSafetyReport,
    isSampleDataActive,
  } = useFinancialData();

  const [settings, setSettings] = useState<WidgetSyncSettings>(() =>
    capacitorWidgetBridge.getSettings()
  );
  const [snapshot, setSnapshot] = useState<AfinityWidgetSnapshot>(() =>
    capacitorWidgetBridge.getSnapshot()
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(
    settings.lastSyncedAt || null
  );
  const [previewDataSource, setPreviewDataSource] = useState<'live' | 'demo'>('live');

  const debounceTimerRef = useRef<any>(null);

  // Generates current live snapshot from React context
  const computeCurrentSnapshot = useCallback(
    (customSettings?: WidgetSyncSettings): AfinityWidgetSnapshot => {
      return generateLiveWidgetSnapshot({
        netWorth,
        totalAssets,
        totalLiabilities,
        bankAccounts,
        creditCards,
        sips,
        portfolioSummary,
        creditPosition,
        bankPosition,
        sipSafetyReport,
        isDemoData: isSampleDataActive ?? false,
        settings: customSettings || settings,
      });
    },
    [
      netWorth,
      totalAssets,
      totalLiabilities,
      bankAccounts,
      creditCards,
      sips,
      portfolioSummary,
      creditPosition,
      bankPosition,
      sipSafetyReport,
      isSampleDataActive,
      settings,
    ]
  );

  // Synchronize snapshot with storage and native bridge
  const syncNow = useCallback(
    async (overrideSnapshot?: AfinityWidgetSnapshot) => {
      setIsSyncing(true);
      try {
        const target = overrideSnapshot || computeCurrentSnapshot();
        const res = await capacitorWidgetBridge.syncSnapshot(target);
        setSnapshot(target);
        const timeStr = new Date(res.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setLastSyncedTime(timeStr);
        return { success: res.success, timestamp: timeStr, isNative: res.isNative };
      } catch (err) {
        console.error('Widget sync error:', err);
        return { success: false, timestamp: null, isNative: false };
      } finally {
        setIsSyncing(false);
      }
    },
    [computeCurrentSnapshot]
  );

  // Auto-sync whenever core financial balances change (debounced 1.5s)
  useEffect(() => {
    if (!settings.autoSyncEnabled) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const newSnap = computeCurrentSnapshot();
      syncNow(newSnap);
    }, 1500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    netWorth,
    totalAssets,
    totalLiabilities,
    bankAccounts,
    creditCards,
    sips,
    settings.autoSyncEnabled,
    computeCurrentSnapshot,
    syncNow,
  ]);

  // Update sync settings
  const updateSettings = useCallback((updates: Partial<WidgetSyncSettings>) => {
    const updated = capacitorWidgetBridge.saveSettings(updates);
    setSettings(updated);
  }, []);

  const demoSnapshot = generateSampleDemoSnapshot();
  const activeSnapshot = previewDataSource === 'demo' ? demoSnapshot : snapshot;

  return {
    snapshot: activeSnapshot,
    liveSnapshot: snapshot,
    demoSnapshot,
    previewDataSource,
    setPreviewDataSource,
    isSyncing,
    lastSyncedTime,
    isNative: capacitorWidgetBridge.isNative(),
    settings,
    updateSettings,
    syncNow,
  };
}

/**
 * Afinity Capacitor Native Android Widget Bridge
 * Bridges TypeScript/React state with native Android AppWidget providers via Capacitor.
 * Supports fallback to localStorage and BroadcastChannel when running in web / PWA / preview.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import { AfinityWidgetSnapshot, WidgetSyncSettings } from '../types/widget';
import {
  WIDGET_STORAGE_KEY,
  WIDGET_SETTINGS_KEY,
  DEFAULT_WIDGET_SETTINGS,
  generateSampleDemoSnapshot,
} from './widgetDataService';

export interface AfinityWidgetBridgePlugin {
  updateWidgetData(options: { snapshotJson: string }): Promise<{ success: boolean; message: string }>;
  getWidgetData(): Promise<any>;
  refreshWidgets(): Promise<{ success: boolean }>;
}

// Register Capacitor plugin proxy with fallback
const NativeWidgetBridge = registerPlugin<AfinityWidgetBridgePlugin>('AfinityWidgetBridge');

class CapacitorWidgetBridgeService {
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('afinity_widget_sync_channel');
      } catch (e) {
        console.warn('BroadcastChannel not supported in this environment');
      }
    }
  }

  /**
   * Checks if running inside a native Capacitor container (Android/iOS).
   */
  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Reads saved widget sync settings from local storage.
   */
  public getSettings(): WidgetSyncSettings {
    try {
      const stored = localStorage.getItem(WIDGET_SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_WIDGET_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error reading widget settings:', e);
    }
    return DEFAULT_WIDGET_SETTINGS;
  }

  /**
   * Updates widget sync settings.
   */
  public saveSettings(updates: Partial<WidgetSyncSettings>): WidgetSyncSettings {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...updates };
      localStorage.setItem(WIDGET_SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error saving widget settings:', e);
      return DEFAULT_WIDGET_SETTINGS;
    }
  }

  /**
   * Retrieves the current stored snapshot (from localStorage or demo fallback).
   */
  public getSnapshot(): AfinityWidgetSnapshot {
    try {
      const stored = localStorage.getItem(WIDGET_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading widget snapshot:', e);
    }
    return generateSampleDemoSnapshot();
  }

  /**
   * Synchronizes the snapshot with the native Android widget provider
   * and persists it locally for web preview.
   */
  public async syncSnapshot(snapshot: AfinityWidgetSnapshot): Promise<{
    success: boolean;
    isNative: boolean;
    timestamp: number;
    error?: string;
  }> {
    const jsonStr = JSON.stringify(snapshot);
    const now = Date.now();

    // 1. Persist in local storage
    try {
      localStorage.setItem(WIDGET_STORAGE_KEY, jsonStr);
      this.saveSettings({ lastSyncedAt: new Date(now).toISOString() });
    } catch (e) {
      console.warn('Could not save widget snapshot to localStorage', e);
    }

    // 2. Notify any open tabs / components via CustomEvent and BroadcastChannel
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('afinity_widget_snapshot_updated', {
          detail: snapshot,
        })
      );
    }

    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'SNAPSHOT_UPDATED', snapshot });
      } catch (e) {
        // Broadcast channel error ignored
      }
    }

    // 3. If running on native Android, send to Android SharedPreferences and AppWidgetManager
    if (this.isNative()) {
      try {
        await NativeWidgetBridge.updateWidgetData({ snapshotJson: jsonStr });
        return { success: true, isNative: true, timestamp: now };
      } catch (err: any) {
        console.warn('Native widget bridge update failed or running in web:', err);
        return {
          success: true, // Still succeeded locally
          isNative: false,
          timestamp: now,
          error: err?.message || 'Native bridge unavailable in browser',
        };
      }
    }

    return {
      success: true,
      isNative: false,
      timestamp: now,
    };
  }

  /**
   * Triggers an immediate refresh of all native widgets.
   */
  public async forceRefreshWidgets(): Promise<boolean> {
    if (this.isNative()) {
      try {
        const res = await NativeWidgetBridge.refreshWidgets();
        return res.success;
      } catch (e) {
        console.error('Error refreshing native widgets:', e);
        return false;
      }
    }
    return true;
  }
}

export const capacitorWidgetBridge = new CapacitorWidgetBridgeService();

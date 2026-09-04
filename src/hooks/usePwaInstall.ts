/**
 * Afinity PWA Installation Hook
 * Manages native beforeinstallprompt events, standalone detection,
 * installation state, and safe dismissal cooldowns.
 */

import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_STORAGE_KEY = 'afinity_pwa_dismissed_until';
const INSTALLED_STORAGE_KEY = 'afinity_pwa_is_installed';
const DISMISS_COOLDOWN_DAYS = 5; // Re-prompt after 5 days if dismissed

// Global store to capture event if fired before component mount
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('afinity_pwa_prompt_ready'));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    try {
      localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
    } catch {
      // Ignore localStorage errors
    }
    window.dispatchEvent(new CustomEvent('afinity_pwa_installed'));
  });
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      window.matchMedia?.('(display-mode: fullscreen)')?.matches ||
      (window.navigator as any)?.standalone === true ||
      Boolean(document.referrer?.includes('android-app://'));
    return isStandalone || localStorage.getItem(INSTALLED_STORAGE_KEY) === 'true';
  });

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (!dismissedUntil) return false;
      const expiry = parseInt(dismissedUntil, 10);
      return !isNaN(expiry) && Date.now() < expiry;
    } catch {
      return false;
    }
  });

  const [isIOS, setIsIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = (window.navigator?.userAgent || '').toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
  });

  useEffect(() => {
    // Re-check standalone status on resize / display-mode change
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');

      if (standalone) {
        setIsInstalled(true);
        try {
          localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
        } catch {}
      }
    };

    checkStandalone();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    const handlePromptReady = () => {
      if (globalDeferredPrompt) {
        setDeferredPrompt(globalDeferredPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
    };

    window.addEventListener('afinity_pwa_prompt_ready', handlePromptReady);
    window.addEventListener('afinity_pwa_installed', handleAppInstalled);

    if (globalDeferredPrompt && !deferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('afinity_pwa_prompt_ready', handlePromptReady);
      window.removeEventListener('afinity_pwa_installed', handleAppInstalled);
    };
  }, [deferredPrompt]);

  // Prompt the user with native browser install dialog
  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    if (!deferredPrompt) {
      return 'unsupported';
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
        try {
          localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
        } catch {}
        return 'accepted';
      } else {
        // User dismissed native prompt
        dismissPrompt(2); // Cooldown for 2 days
        return 'dismissed';
      }
    } catch (err) {
      console.warn('[PWA] prompt error:', err);
      return 'unsupported';
    }
  }, [deferredPrompt]);

  // Dismiss the banner with custom cooldown
  const dismissPrompt = useCallback((days: number = DISMISS_COOLDOWN_DAYS) => {
    try {
      const until = Date.now() + days * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_STORAGE_KEY, until.toString());
      setIsDismissed(true);
    } catch {}
  }, []);

  // Force reset dismissal (e.g. if opened manually from settings)
  const resetDismissal = useCallback(() => {
    try {
      localStorage.removeItem(DISMISS_STORAGE_KEY);
      setIsDismissed(false);
    } catch {}
  }, []);

  const canInstall = Boolean(deferredPrompt) && !isInstalled;

  return {
    canInstall,
    isInstalled,
    isDismissed,
    isIOS,
    promptInstall,
    dismissPrompt,
    resetDismissal,
    hasNativePrompt: Boolean(deferredPrompt),
  };
}

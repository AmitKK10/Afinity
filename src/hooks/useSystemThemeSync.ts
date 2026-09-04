import { useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'afinity_theme';
export const THEME_CHANGE_EVENT = 'afinity-theme-change';

/**
 * Applies the specified theme classes and metadata to the document.
 */
export function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');

  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light', 'theme-light');
    root.setAttribute('data-theme', 'light');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#f1f5f9');
    }
  } else {
    root.classList.remove('light', 'theme-light');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#0a0f1d');
    }
  }
}

/**
 * Reads system color scheme preference.
 */
export function getSystemThemePreference(): ThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Hook to automatically synchronize the document theme class with the user's system preference
 * if no manual theme has been set in localStorage.
 *
 * Behavior:
 * 1. Checks localStorage for a manual theme ('afinity_theme').
 * 2. If a manual theme exists ('dark' or 'light'), applies and preserves the user's explicit choice.
 * 3. If NO manual theme exists in localStorage, automatically reads the OS / system preference
 *    via matchMedia('(prefers-color-scheme: dark)') and updates the document classes whenever
 *    the system preference changes.
 * 4. Listens for external updates (other tabs, settings modals, storage events) to keep state unified.
 */
export function useSystemThemeSync() {
  const [manualTheme, setManualThemeState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [systemTheme, setSystemTheme] = useState<ThemeMode>(() => getSystemThemePreference());

  // Determine effective theme: manual theme takes precedence if present; otherwise system preference.
  const resolvedTheme: ThemeMode =
    manualTheme === 'light' || manualTheme === 'light_contrast'
      ? 'light'
      : manualTheme === 'dark'
      ? 'dark'
      : systemTheme;

  const isSystemSynchronized = !manualTheme;

  // Synchronize document theme class and attributes
  useEffect(() => {
    applyThemeToDocument(resolvedTheme);
  }, [resolvedTheme]);

  // Listen to system preference changes when no manual theme is set
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const newSysTheme: ThemeMode = e.matches ? 'dark' : 'light';
      setSystemTheme(newSysTheme);

      // If no manual theme is stored in localStorage, immediately apply system preference to document
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (!stored) {
          applyThemeToDocument(newSysTheme);
        }
      } catch {
        applyThemeToDocument(newSysTheme);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
    // Safari / Legacy browsers
    else if ('addListener' in mediaQuery) {
      mediaQuery.addListener(handleSystemThemeChange);
      return () => {
        mediaQuery.removeListener(handleSystemThemeChange);
      };
    }
  }, []);

  // Listen to storage changes (across tabs or within app)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) {
        setManualThemeState(e.newValue);
      }
    };

    const handleCustomThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: string | null }>;
      if (customEvent.detail !== undefined) {
        setManualThemeState(customEvent.detail.theme);
      } else {
        try {
          setManualThemeState(localStorage.getItem(THEME_STORAGE_KEY));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(THEME_CHANGE_EVENT, handleCustomThemeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(THEME_CHANGE_EVENT, handleCustomThemeChange);
    };
  }, []);

  // Public setter to set explicit manual theme (or clear to restore system sync)
  const setManualTheme = useCallback((theme: ThemeMode | null) => {
    try {
      if (theme) {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } else {
        localStorage.removeItem(THEME_STORAGE_KEY);
      }
      setManualThemeState(theme);
      window.dispatchEvent(
        new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme } })
      );
    } catch (e) {
      console.warn('Unable to access localStorage for theme persistence:', e);
    }
  }, []);

  // Helper to clear manual theme and restore system synchronization
  const resetToSystemTheme = useCallback(() => {
    setManualTheme(null);
  }, [setManualTheme]);

  return {
    theme: resolvedTheme,
    isSystemSynchronized,
    systemPreference: systemTheme,
    manualTheme,
    setManualTheme,
    resetToSystemTheme,
  };
}

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.afinity.finance',
  appName: 'Afinity',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Configuration for native Android widget bridge
    AfinityWidgetBridge: {
      syncIntervalMinutes: 30,
      storageKey: 'afinity_widget_snapshot',
    },
  },
};

export default config;

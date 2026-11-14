import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.catrisblocks.kawaiitetris',
  appName: 'Catris Blocks',
  webDir: 'dist',
  backgroundColor: '#122652',
  ios: {
    contentInset: 'never',
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
    },
  },
};

export default config;

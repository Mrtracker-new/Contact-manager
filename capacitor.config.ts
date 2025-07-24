import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.contactmanager.app',
  appName: 'Contact Manager',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Filesystem: {
      iosConcurrentReads: true
    },
    Preferences: {
      group: 'ContactManagerGroup'
    },
    Share: {
      useActivity: true
    },
    App: {
      handleDeepLinks: true
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;

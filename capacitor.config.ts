import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.yourname.contactmanager',
  appName: 'RNR Contact Manager',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;

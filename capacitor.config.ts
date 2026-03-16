import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.mdinfo.app',
  appName: 'M.D. INFOTECH',
  webDir: 'out',
  server: {
    url: 'https://mdinfotech-app.vercel.app/login',
    cleartext: true
  }
};

export default config;

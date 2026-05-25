import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

const supabaseHostPattern = /^https:\/\/.*\.supabase\.co\//;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Ligeirinho Hub',
        short_name: 'Ligeirinho',
        description: 'Gestão da adega — Hub administrativo',
        theme_color: '#7c2d12',
        background_color: '#fffbeb',
        display: 'standalone',
        lang: 'pt-BR',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        skipWaiting: false,
        clientsClaim: false,
        runtimeCaching: [
          {
            urlPattern: supabaseHostPattern,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      process.env.npm_package_version ?? '0.0.0',
    ),
  },
  server: {
    port: 4173,
  },
  preview: {
    port: 4173,
  },
});

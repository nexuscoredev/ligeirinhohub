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
      includeAssets: ['img/ligeirinhologo.png'],
      manifest: {
        name: 'Ligeirinho Hub',
        short_name: 'Ligeirinho',
        description: 'Gestão da distribuidora — Hub administrativo',
        theme_color: '#080808',
        background_color: '#080808',
        display: 'standalone',
        lang: 'pt-BR',
        icons: [
          {
            src: '/img/ligeirinhologo.png',
            sizes: '500x500',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/img/ligeirinhologo.png',
            sizes: '500x500',
            type: 'image/png',
            purpose: 'maskable',
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

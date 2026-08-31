import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// Vite config for PFWA.
// In dev, the /api prefix is proxied to local Supabase Edge Functions when
// running. In production the same /api/* paths hit the deployed Edge Functions.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'PFWA — Gestione Finanza Personale',
        short_name: 'PFWA',
        description: 'Conti, transazioni, investimenti e insights AI.',
        theme_color: '#0b1220',
        background_color: '#0b1220',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.in'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-rest',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: ({ request }) =>
              ['style', 'script', 'worker', 'image', 'font'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      // Local dev: proxy /api → Supabase Edge Functions.
      // Set VITE_SUPABASE_URL in .env.local; only enable when the user
      // is running `supabase functions serve` locally.
      '^/api/(.*)': {
        target: process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        changeOrigin: true,
        rewrite: (pathStr) => pathStr.replace(/^\/api/, '/functions/v1'),
      },
    },
  },
  build: {
    sourcemap: true,
    target: 'es2020',
  },
});
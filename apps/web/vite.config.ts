import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { legalManifest } from './scripts/legal-manifest.mjs';

// Ziel der Dev-Proxys, z. B. VITE_API_TARGET=http://localhost:8081, wenn das Docker-Beispiel dort läuft
const apiTarget =
  (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.VITE_API_TARGET ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // dist/legal-manifest.json: Versionen der Rechtstexte für den Server (ADR-0015)
    legalManifest(new URL('./src/content/legal', import.meta.url)),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'CampusMarkt HWG LU',
        short_name: 'CampusMarkt',
        description: 'Tausch- und Verkaufsplattform für Angehörige der HWG Ludwigshafen',
        lang: 'de',
        start_url: '/',
        display: 'standalone',
        theme_color: '#0b4f8a',
        background_color: '#ffffff',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/ws/, /^\/health/, /^\/metrics/, /^\/robots\.txt$/, /^\/\.well-known\//],
        runtimeCaching: [],
      },
    }),
  ],
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      // changeOrigin: false, damit Host und Origin übereinstimmen (sonst lehnt die CSRF-Prüfung jede Änderung ab)
      '/api': { target: apiTarget, changeOrigin: false },
      '/ws': { target: apiTarget.replace(/^http/, 'ws'), ws: true, changeOrigin: false },
    },
  },
});

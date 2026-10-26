import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { legalManifest } from './scripts/legal-manifest.mjs';

/**
 * Ziel der Dev-Proxys (MAN-PORT-001 P-3): VITE_API_TARGET aus der Umgebung oder apps/web/.env, sonst der PORT des
 * Servers aus apps/server/.env, sonst 8080. Beispiel: VITE_API_TARGET=http://localhost:8081, wenn das Docker-Beispiel
 * dort läuft.
 */
function apiTargetFor(mode: string): string {
  const web = loadEnv(mode, import.meta.dirname, ['VITE_API_TARGET']);
  const server = loadEnv(mode, `${import.meta.dirname}/../server`, ['PORT']);
  return web.VITE_API_TARGET || (server.PORT ? `http://localhost:${server.PORT}` : 'http://localhost:8080');
}

export default defineConfig(({ mode }) => {
  const apiTarget = apiTargetFor(mode);
  return {
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
          description: 'Tausch- und Verkaufsplattform der HWG Ludwigshafen / Swap and sell marketplace of HWG Ludwigshafen',
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
  };
});

import { defineConfig, loadEnv } from 'vite';
import circleDependency from 'vite-plugin-circular-dependency';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default defineConfig(({ mode }) => {
  const rawEnv = loadEnv(mode, process.cwd(), '');
  const env = {
    ...rawEnv,
    ...process.env,
  };

  const apiUrl = new URL(env.VITE_API ?? 'http://localhost:8000/api/v1/');
  const backendUrl = new URL(env.VITE_BACKEND_URL ?? 'http://localhost:8000/');
  const apiPattern = new RegExp(`^${escapeRegExp(apiUrl.origin)}${escapeRegExp(apiUrl.pathname)}`);
  const mediaPattern = new RegExp(
    `^${escapeRegExp(backendUrl.origin)}(?:/media/|.*\\.(?:png|jpg|jpeg|webp|gif|svg)$)`,
    'i',
  );

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        injectRegister: 'auto',
        registerType: 'autoUpdate',
        includeAssets: ['logo.png', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'ComicsApp',
          short_name: 'ComicsApp',
          description: 'Приложение для чтения и публикации комиксов.',
          theme_color: '#3D8CEC',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: apiPattern,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-data-cache',
                networkTimeoutSeconds: 5,
                cacheableResponse: {
                  statuses: [0, 200],
                },
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60,
                },
              },
            },
            {
              urlPattern: mediaPattern,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'media-assets-cache',
                cacheableResponse: {
                  statuses: [0, 200],
                },
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'image-cache',
                cacheableResponse: {
                  statuses: [0, 200],
                },
                expiration: {
                  maxEntries: 120,
                  maxAgeSeconds: 60 * 60 * 24 * 14,
                },
              },
            },
          ],
        },
      }),
      tsconfigPaths(),
      circleDependency({
        circleImportThrowErr: false,
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }

            if (id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'editor';
            }

            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('scheduler') ||
              id.includes('react-router') ||
              id.includes('@tanstack/react-query')
            ) {
              return 'framework';
            }

            if (id.includes('axios') || id.includes('zod') || id.includes('zustand')) {
              return 'data';
            }

            return undefined;
          },
        },
      },
    },
  };
});

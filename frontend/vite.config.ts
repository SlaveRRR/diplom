import { defineConfig, loadEnv } from 'vite';
import circleDependency from 'vite-plugin-circular-dependency';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = new URL(env.VITE_API ?? 'http://localhost:8000/api/v1/');
  const backendUrl = new URL(env.VITE_BACKEND_URL ?? 'http://localhost:8000/');

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['logo.svg'],
        manifest: {
          name: 'ComicsWebApp',
          short_name: 'ComicsWebApp',
          description: 'Платформа для чтения и публикации комиксов',
          icons: [
            {
              src: '/logo.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: '/logo.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
          theme_color: '#3D8CEC',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
        },
        workbox: {
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) =>
                request.method === 'GET' && url.origin === apiUrl.origin && url.pathname.startsWith(apiUrl.pathname),
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
              urlPattern: ({ request, url }) =>
                request.method === 'GET' &&
                url.origin === backendUrl.origin &&
                (url.pathname.includes('/media/') || /\.(?:png|jpg|jpeg|webp|gif|svg)$/i.test(url.pathname)),
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

            if (id.includes('@ant-design/plots') || id.includes('@antv')) {
              return 'charts';
            }

            if (
              id.includes('antd') ||
              id.includes('@ant-design') ||
              id.includes('@rc-component') ||
              id.includes('/rc-') ||
              id.includes('/dayjs/')
            ) {
              return 'antd';
            }

            if (id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'editor';
            }

            return 'vendor';
          },
        },
      },
    },
  };
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import circleDependency from 'vite-plugin-circular-dependency';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        maximumFileSizeToCacheInBytes: 2621440,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.href.includes('url'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'cache-backend',
              cacheableResponse: {
                statuses: [200],
              },
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 2 months
              },
            },
          },
        ],
      },
      includeAssets: ['/logo_192.svg', '/logo_512.png', '/logo_180.png', '/Logo.svg'],
      manifest: {
        name: 'Template',
        short_name: 'Template',
        description: 'Template app',
        icons: [
          {
            src: '/logo_192.svg',
            sizes: '192x192',
            type: 'image/svg',
            purpose: 'favicon',
          },
          {
            src: '/logo_512.png',
            sizes: '512x512',
            type: 'image/svg',
            purpose: 'favicon',
          },
          {
            src: '/logo_180.png',
            sizes: '180x180',
            type: 'image/svg',
            purpose: 'apple touch icon',
          },
          {
            src: '/Logo.svg',
            sizes: '512x512',
            type: 'image/svg',
            purpose: 'any maskable',
          },
        ],
        theme_color: '#3D8CEC',
        background_color: '#3DB66B',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
      },
    }),
    tsconfigPaths(),
    circleDependency(),
  ],
});

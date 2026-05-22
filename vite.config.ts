import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProd = mode === 'production';

  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'MyCollegeGenie',
          short_name: 'MCGenie',
          description: "India's biggest student ecosystem",
          theme_color: '#4400FF',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
            { src: '/favicon.png', sizes: '512x512', type: 'image/png' }
          ]
        },
        workbox: {
          // PERF FIX: Exclude the 1.2MB PDF.js worker and 452KB vendor-pdfjs
          // from precache. They are only needed for FlipbookPage and will be
          // cached at runtime the first time a user visits that page.
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          globIgnores: [
            '**/pdf.worker.min*.mjs',   // 1,244 KB — too heavy for precache
            '**/pdf.worker*.js',
            '**/vendor-pdfjs*.js',       // 452 KB — only for FlipbookPage
          ],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.mycollegegenie\.in\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 10 // 10 minutes
                },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            // Cache Google Fonts for 1 year
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }
              }
            },
          ]
        }
      })
    ],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
    },
    build: {
      target: 'es2018',
      sourcemap: false,
      chunkSizeWarningLimit: 600,
      // PERF FIX: Don't preload every chunk — only the critical path
      modulePreload: { polyfill: false },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Core React — always needed
            if (id.includes('node_modules/react/') ||
                id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/react-router-dom/')) {
              return 'vendor-react';
            }
            // Animation (heavy — separate chunk)
            if (id.includes('node_modules/motion/') ||
                id.includes('node_modules/framer-motion/')) {
              return 'vendor-motion';
            }
            // Sentry (only needed on error)
            if (id.includes('node_modules/@sentry/')) {
              return 'vendor-sentry';
            }
            // Icons (needed almost everywhere)
            if (id.includes('node_modules/lucide-react/')) {
              return 'vendor-icons';
            }
            // Supabase (auth — needed early)
            if (id.includes('node_modules/@supabase/')) {
              return 'vendor-supabase';
            }
            // PDF.js — only needed in Flipbook, already lazy loaded
            if (id.includes('node_modules/pdfjs-dist/')) {
              return 'vendor-pdfjs';
            }
            // Sonner toasts
            if (id.includes('node_modules/sonner/')) {
              return 'vendor-sonner';
            }
            // React Helmet
            if (id.includes('node_modules/react-helmet') ||
                id.includes('node_modules/react-dropzone/')) {
              return 'vendor-ui';
            }
          },
        },
      },
      minify: isProd ? 'esbuild' : false,
      // Reduce asset size with better compression hints
      assetsInlineLimit: 4096,
    },
    server: {
      port: 3000,
      host: true,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'lucide-react',
        '@supabase/supabase-js',
      ],
    },
  };
});

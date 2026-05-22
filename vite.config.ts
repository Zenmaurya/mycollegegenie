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
            {
              src: '/favicon.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/favicon.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.mycollegegenie\.in\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  // FIX Perf #4: Reduced from 24h to 10min.
                  // 24h meant new uploads were invisible to PWA users for a full day.
                  maxAgeSeconds: 60 * 10 // 10 minutes
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
    },
    build: {
      target: 'es2015',
      // Disable source maps in production (reduces bundle size, hides source)
      sourcemap: false,
      // Increase chunk warning limit
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Smart code splitting — heavy pages load separately
          manualChunks: (id) => {
            // Core React libraries
            if (id.includes('node_modules/react') || 
                id.includes('node_modules/react-dom') || 
                id.includes('node_modules/react-router-dom')) {
              return 'vendor-react';
            }
            // Animation library (heavy)
            if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) {
              return 'vendor-motion';
            }
            // Sentry (heavy, only needed on error)
            if (id.includes('node_modules/@sentry')) {
              return 'vendor-sentry';
            }
            // UI icons
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            // Supabase
            if (id.includes('node_modules/@supabase')) {
              return 'vendor-supabase';
            }
          },
        },
      },
      // Minify for production
      minify: isProd ? 'esbuild' : false,
    },
    // Optimize dev server
    server: {
      port: 3000,
      host: true,
    },
    // Pre-bundle dependencies for faster dev startup
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


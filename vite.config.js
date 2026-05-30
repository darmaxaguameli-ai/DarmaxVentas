const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

// https://vitejs.dev/config/
module.exports = defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/pdfs': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React Core - Priority 1
            if (id.includes('node_modules/react/') || 
                id.includes('node_modules/react-dom/') || 
                id.includes('node_modules/react-is/') || 
                id.includes('scheduler')) {
              return 'vendor-react-core';
            }
            // PDF and heavy document tools
            if (id.includes('@react-pdf/renderer') || id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            // Excel and data processing
            if (id.includes('xlsx') || id.includes('exceljs')) {
              return 'vendor-xlsx';
            }
            // Visualization and Maps (Combined to ensure shared context)
            if (id.includes('recharts') || id.includes('d3') || id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'vendor-viz-maps';
            }
            // Icons
            if (id.includes('react-icons')) {
              return 'vendor-icons';
            }
            // Routing
            if (id.includes('react-router-dom') || id.includes('@remix-run') || id.includes('react-router')) {
              return 'vendor-router';
            }
            // Date handling
            if (id.includes('react-datepicker') || id.includes('date-fns')) {
              return 'vendor-date';
            }
            // UI Components and feedback
            if (id.includes('sweetalert2') || id.includes('sonner') || id.includes('react-hot-toast') || id.includes('sweetalert')) {
              return 'vendor-ui-feedback';
            }
            // Remaining React-specific libs (hooks, context, etc)
            if (id.includes('react')) {
              return 'vendor-react-libs';
            }
            // Scoped packages
            if (id.includes('node_modules/@')) {
              return 'vendor-scoped';
            }
            // Everything else
            return 'vendor-others';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
  define: {
    // Polyfill Buffer for the browser (needed for @react-pdf/renderer and others)
    global: 'window',
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
});

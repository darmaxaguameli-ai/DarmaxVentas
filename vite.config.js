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
            // PDF and heavy document tools
            if (id.includes('@react-pdf/renderer') || id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            // Excel and data processing
            if (id.includes('xlsx') || id.includes('exceljs')) {
              return 'vendor-xlsx';
            }
            // Visualization and Maps
            if (id.includes('recharts') || id.includes('d3') || id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'vendor-viz-maps';
            }
            // Icons
            if (id.includes('react-icons')) {
              return 'vendor-icons';
            }
            // UI Components and feedback
            if (id.includes('sweetalert2') || id.includes('sonner') || id.includes('react-hot-toast') || id.includes('sweetalert')) {
              return 'vendor-ui-feedback';
            }
            // Date handling
            if (id.includes('react-datepicker') || id.includes('date-fns')) {
              return 'vendor-date';
            }
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

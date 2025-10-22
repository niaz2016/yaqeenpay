import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    // Ensure environment variables are available
    'process.env': {}
  },
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Allow external access
    open: true,
    cors: true, // Enable CORS
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.ngrok.io', // Allow any ngrok.io subdomain
      '.ngrok-free.app', // Allow any ngrok-free.app subdomain
      '.ngrok.app' // Allow any ngrok.app subdomain
    ],
    proxy: {
      '/api': {
        target: 'https://localhost:7137',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates for local HTTPS
        timeout: 10000,
        proxyTimeout: 10000,
        ws: true, // Enable WebSocket proxying if needed
        headers: {
          'X-Forwarded-Proto': 'https',
          'X-Forwarded-For': 'ngrok-proxy'
        }
      }
    }
  },
  preview: {
    host: true, // Also allow external access in preview mode
    port: 4173,
    cors: true
  },
});

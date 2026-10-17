import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['zego-express-engine-webrtc'],
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:4000',
        ws: true,
      },
    },
  },
});

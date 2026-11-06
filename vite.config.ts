import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Allows process.env checks in browser environments like Google AI Studio
    'process.env': {}
  },
  server: {
    port: 3000,
    open: true
  }
});


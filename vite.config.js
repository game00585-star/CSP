import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/CSP/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.csb.app', '.app.github.dev'],
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['.csb.app', '.app.github.dev'],
  },
  resolve: {preserveSymlinks: true},
});

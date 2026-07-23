import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/CSP/',
  plugins: [react()],
  resolve: {preserveSymlinks: true},
});

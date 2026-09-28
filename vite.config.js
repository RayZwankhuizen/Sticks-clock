
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve('./src'), // Use relative path to avoid __dirname issues
    },
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/, // Apply loader to .js and .jsx files in src
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx', // Enable JSX loader for .js files in dependencies
      },
    },
  },
});

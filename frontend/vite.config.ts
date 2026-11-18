import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'https://aashi-8uri.onrender.com';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@duvora/shared': path.resolve(__dirname, './src/shared/index.ts')
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false
        },
        '/socket.io': {
          target: backendUrl,
          ws: true,
          changeOrigin: true
        }
      }
    }
  };
});

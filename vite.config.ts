import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Connect } from 'vite';

// Middleware para manejar las rutas de la API en desarrollo
const apiMiddleware = {
  name: 'api-middleware',
  configureServer(server: any) {
    server.middlewares.use('/api', async (req: Connect.IncomingMessage, res: any, next: Connect.NextFunction) => {
      if (req.url?.startsWith('/sendToSheet')) {
        try {
          const apiPath = path.resolve(__dirname, 'api/sendToSheet.js');
          // Usamos importación dinámica compatible con ESM
          const { default: handler } = await import(`${apiPath}?t=${Date.now()}`);
          return handler(req, res);
        } catch (error) {
          console.error('API middleware error:', error);
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
        return;
      }
      next();
    });
  },
};

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), apiMiddleware],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});

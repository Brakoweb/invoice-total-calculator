import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Connect } from 'vite';

// Middleware para manejar dinámicamente las rutas de la API en desarrollo
const apiMiddleware = {
  name: 'api-middleware',
  configureServer(server: any) {
    server.middlewares.use('/api', async (req: Connect.IncomingMessage, res: any, next: Connect.NextFunction) => {
      // Extrae el nombre del endpoint de la URL. Ej: /highlevel?foo=bar -> /highlevel
      const apiRoute = req.url?.split('?')[0];

      if (!apiRoute) {
        return next();
      }

      try {
        // Construye la ruta al archivo del handler. Ej: /Users/.../api/highlevel.js
        const apiPath = path.resolve(__dirname, `api${apiRoute}.js`);

        // Usamos importación dinámica compatible con ESM para recargar en cada cambio
        const { default: handler } = await import(`${apiPath}?t=${Date.now()}`);
        
        // Asigna la query a la solicitud para que el handler pueda acceder a ella
        const url = new URL(req.url!, `http://${req.headers.host}`);
        (req as any).query = Object.fromEntries(url.searchParams.entries());

        return handler(req, res);
      } catch (error) {
        // Si el archivo de la API no existe, pasa al siguiente middleware
        if (error instanceof Error && 'code' in error && error.code === 'ERR_MODULE_NOT_FOUND') {
          return next();
        }
        // Para otros errores, muestra un error de servidor
        console.error(`API middleware error en ${apiRoute}:`, error);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
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

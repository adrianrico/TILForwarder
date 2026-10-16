import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Configuración de Vite.
 * - Alias `@` apunta a `src/` para evitar imports relativos profundos (`../../..`).
 * - Los encabezados de seguridad de producción viven en `public/_headers` y
 *   `render.yaml`; aquí solo se endurece el servidor de desarrollo.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  build: {
    // Sin source maps públicos: no se expone el código fuente original.
    sourcemap: false,
  },
})

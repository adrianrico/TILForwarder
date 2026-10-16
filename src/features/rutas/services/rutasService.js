/**
 * Acceso a la API de rutas personalizadas (`/routes/route`).
 * Solo hace peticiones HTTP; no contiene lógica de UI.
 */
import api from '@/shared/api/client'

export const rutasService = {
  /** Lista todas las rutas. */
  readAll:        ()     => api.get('/routes/route'),
  /** Crea o actualiza una ruta. */
  createOrUpdate: (data) => api.post('/routes/route', data),
  /** Elimina una ruta (identificador en el cuerpo). */
  remove:         (data) => api.delete('/routes/route/', { data }),
}

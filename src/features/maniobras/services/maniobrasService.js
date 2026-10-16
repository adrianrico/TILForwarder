/**
 * Acceso a la API de maniobras (`/maneuvers/*`).
 * Solo hace peticiones HTTP; no contiene lógica de UI.
 */
import api from '@/shared/api/client'

export const maniobrasService = {
  /** Lista maniobras. `params`: filtros y paginación (`page`, `limit`, ...). */
  getAll:         (params) => api.get('/maneuvers/maneuver/', { params }),
  /** Estadísticas agregadas de maniobras. */
  getStats:       (params) => api.get('/maneuvers/stats/', { params }),
  /** Crea o actualiza una maniobra. */
  save:           (data) => api.post('/maneuvers/maneuver/', data),
  /** Elimina una maniobra (identificador en el cuerpo). */
  remove:         (data) => api.delete('/maneuvers/maneuver/', { data }),
  /** Maniobras con datos GPS. */
  getGPS:         (params) => api.get('/maneuvers/getGPS/', { params }),
  /** Actualiza el enlace/coordenadas de seguimiento de una maniobra. */
  updateGPS:      (data) => api.patch('/maneuvers/updateTrackingLink/', data),
  /** Actualiza ubicación, estatus y subevento de una maniobra. */
  updateLocation: (data) => api.patch('/maneuvers/updateLocation/', data),
}

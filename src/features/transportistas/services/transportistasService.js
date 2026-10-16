/**
 * Acceso a la API de transportistas (`/transporters/*`): transportista,
 * operadores y económicos. Solo hace peticiones HTTP; no contiene lógica de UI.
 */
import api from '@/shared/api/client'

export const transportistasService = {
  /** Lista transportistas con sus operadores y económicos. */
  readAll:        ()     => api.get('/transporters/transporter/'),
  /** Crea o actualiza un transportista. */
  createOrUpdate: (data) => api.post('/transporters/transporter/', data),
  /** Elimina un transportista. */
  remove:         (data) => api.delete('/transporters/transporter/', { data }),

  /** Crea o actualiza un operador. */
  saveOperator:   (data) => api.post('/transporters/operator/', data),
  /** Elimina un operador (el backend usa `action: 'delete'` sobre el mismo endpoint). */
  deleteOperator: (data) => api.post('/transporters/operator/', { ...data, action: 'delete' }),

  /** Crea o actualiza un económico (unidad). */
  saveEco:        (data) => api.post('/transporters/eco/', data),
  /** Elimina un económico. */
  deleteEco:      (data) => api.post('/transporters/eco/', { ...data, action: 'delete' }),
}

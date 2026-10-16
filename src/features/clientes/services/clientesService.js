/**
 * Acceso a la API de clientes (`/clients/client/`).
 * Solo hace peticiones HTTP; no contiene lógica de UI.
 */
import api from '@/shared/api/client'

export const clientesService = {
  /** Lista todos los clientes. Respuesta: `{ clients_data: [...] }`. */
  readAll: () => api.get('/clients/client/'),
  /** Crea un cliente (sin `client_id`). */
  create:  (data) => api.post('/clients/client/', data),
  /** Actualiza un cliente: el backend distingue crear/actualizar por `client_id`. */
  update:  (data) => api.post('/clients/client/', data),
  /** Elimina un cliente por su `client_id`. */
  remove:  (client_id) => api.delete('/clients/client/', { data: { client_id } }),
}

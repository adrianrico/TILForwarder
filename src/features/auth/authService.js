/**
 * Acceso a la API de autenticación de TIL_Backend (`/client-auth`).
 * Las credenciales las emite el portal TIL_Superadmin. Solo hace peticiones HTTP.
 */
import api from '@/shared/api/client'

export const authService = {
  /** `{ data: { accessToken, user: { id, publicId, fullName } } }` */
  login: (username, password) => api.post('/client-auth/login', { username, password }),
  /** Revalida la sesión contra la BD (acceso restringido o usuario eliminado => 401/403). */
  me: () => api.get('/client-auth/me'),
}

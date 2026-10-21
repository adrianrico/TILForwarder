/**
 * Cliente HTTP único de la aplicación (capa de infraestructura).
 *
 * Reglas de seguridad aplicadas aquí, en un solo punto:
 *  - La URL base sale SOLO de `VITE_API_URL`; no hay URL de producción "escondida"
 *    como respaldo en el código.
 *  - En producción se exige HTTPS (evita enviar datos en texto plano).
 *  - Timeout y tamaño máximo de respuesta acotados (mitiga cuelgues y respuestas abusivas).
 *  - Sin cookies cross-site (`withCredentials: false`): la API no usa sesión por cookie.
 *  - Los errores de red se normalizan para que la UI nunca muestre trazas internas.
 */
import axios from 'axios'
import { session } from '@/features/auth/session'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('Falta la variable VITE_API_URL (ver .env.example).')
}
if (import.meta.env.PROD && !API_URL.startsWith('https://')) {
  throw new Error('En producción VITE_API_URL debe usar HTTPS.')
}

const REQUEST_TIMEOUT_MS = 10_000
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024

const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  maxContentLength: MAX_RESPONSE_BYTES,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
})

/** Adjunta el JWT del usuario (`Authorization: Bearer`) obtenido al iniciar sesión. */
api.interceptors.request.use((config) => {
  const token = session.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Respuesta de error uniforme: si el backend no envía un mensaje propio,
 * se inyecta uno genérico en `err.response.data.message` para la UI.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Sesión rechazada (token vencido, usuario restringido o eliminado): se limpia y se vuelve al login.
    if (error.response?.status === 401 && session.get() && window.location.pathname !== '/login') {
      session.clear()
      window.location.assign('/login')
    }
    if (error.code === 'ECONNABORTED') {
      error.userMessage = 'El servidor tardó demasiado en responder.'
    } else if (!error.response) {
      error.userMessage = 'No se pudo conectar con el servidor.'
    }
    return Promise.reject(error)
  },
)

export default api

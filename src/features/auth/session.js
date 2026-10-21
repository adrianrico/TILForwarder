/**
 * Almacén del token de sesión (JWT de `POST /portal/login`).
 * Se guarda en sessionStorage (se borra al cerrar la pestaña) y nunca en variables VITE_*,
 * que quedarían visibles en el bundle.
 */
const STORAGE_KEY = 'til_forwarder_token'

export const session = {
  get() {
    try { return sessionStorage.getItem(STORAGE_KEY) } catch { return null }
  },
  set(value) {
    try { sessionStorage.setItem(STORAGE_KEY, value) } catch { /* almacenamiento no disponible */ }
  },
  clear() {
    try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* almacenamiento no disponible */ }
  },
}

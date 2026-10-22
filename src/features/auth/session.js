/**
 * Almacén de la sesión (JWT de `POST /client-auth/login` de TIL_Backend + datos públicos del usuario).
 * Se guarda en sessionStorage (se borra al cerrar la pestaña) y nunca en variables VITE_*,
 * que quedarían visibles en el bundle.
 */
const TOKEN_KEY = 'til_forwarder_token'
const USER_KEY = 'til_forwarder_user'

function read(key) {
  try { return sessionStorage.getItem(key) } catch { return null }
}

export const session = {
  get() {
    return read(TOKEN_KEY)
  },
  getUser() {
    try { return JSON.parse(read(USER_KEY)) } catch { return null }
  },
  set(token, user) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token)
      sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch { /* almacenamiento no disponible */ }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
    } catch { /* almacenamiento no disponible */ }
  },
}

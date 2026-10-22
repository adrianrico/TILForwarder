import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from './authService'
import { session } from './session'

const AuthContext = createContext(null)

/**
 * Sesión del usuario: expone `{ isAuthenticated, user, login(username, password), logout() }` vía `useAuth()`.
 * El login lo valida TIL_Backend con las credenciales generadas en el portal TIL_Superadmin.
 * Al montar, si hay token se revalida con `/client-auth/me`: si el administrador restringió o
 * eliminó al usuario, la sesión se cierra.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => session.get())
  const [user, setUser] = useState(() => session.getUser())

  useEffect(() => {
    if (!token) return
    let cancelled = false
    authService.me().catch((err) => {
      const status = err.response?.status
      if (!cancelled && (status === 401 || status === 403)) logout()
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function login(username, password) {
    const { data } = await authService.login(username, password)
    const { accessToken, user: profile } = data.data
    session.set(accessToken, profile)
    setToken(accessToken)
    setUser(profile)
  }

  function logout() {
    session.clear()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: Boolean(token), user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

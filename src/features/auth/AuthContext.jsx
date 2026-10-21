import { createContext, useContext, useState } from 'react'
import api from '@/shared/api/client'
import { session } from './session'

const AuthContext = createContext(null)

/**
 * Sesión del usuario: expone `{ isAuthenticated, login(key), logout() }` vía `useAuth()`.
 * `login` envía la clave personal a `POST /portal/login` y guarda solo el token recibido.
 */
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(session.get()))

  async function login(key) {
    const { data } = await api.post('/portal/login', { key })
    session.set(data.token)
    setIsAuthenticated(true)
  }

  function logout() {
    session.clear()
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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

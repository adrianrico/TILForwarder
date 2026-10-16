import { createContext, useContext, useState } from 'react'
import api from '@/shared/api/client'
import { adminKey } from './adminKey'

const AuthContext = createContext(null)

/**
 * Sesión del administrador: expone `{ isAuthenticated, login(key), logout() }` vía `useAuth()`.
 * `login` valida la llave contra el backend antes de guardarla.
 */
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(adminKey.get()))

  async function login(key) {
    await api.get('/clients/client/', { headers: { 'X-API-Key': key } })
    adminKey.set(key)
    setIsAuthenticated(true)
  }

  function logout() {
    adminKey.clear()
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

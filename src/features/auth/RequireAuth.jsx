import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

/** Ruta protegida: sin llave de administrador redirige a /login. */
export default function RequireAuth() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

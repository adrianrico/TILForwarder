/**
 * Raíz de la aplicación: proveedores globales + tabla de rutas.
 * Cada ruta carga la página de su feature (src/features/<feature>/pages).
 */
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import AppLayout from '@/shared/layout/AppLayout'
import { AuthProvider } from '@/features/auth/AuthContext'
import RequireAuth from '@/features/auth/RequireAuth'
import GlobalLoader from '@/shared/components/GlobalLoader'
import WaveBackground from '@/shared/components/WaveBackground'
// Carga diferida por página: el navegador solo descarga el código de la vista visitada.
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const Dashboard = lazy(() => import('@/features/dashboard/pages/Dashboard'))
const Clientes = lazy(() => import('@/features/clientes/pages/Clientes'))
const Transportistas = lazy(() => import('@/features/transportistas/pages/Transportistas'))
const RutasPersonalizadas = lazy(() => import('@/features/rutas/pages/RutasPersonalizadas'))
const RutasSeguimiento = lazy(() => import('@/features/seguimiento/pages/RutasSeguimiento'))
const Maniobras = lazy(() => import('@/features/maniobras/pages/Maniobras'))

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <WaveBackground />
      <GlobalLoader />
      <BrowserRouter>
        <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="transportistas" element={<Transportistas />} />
            <Route path="rutas-personalizadas" element={<RutasPersonalizadas />} />
            <Route path="rutas-seguimiento" element={<RutasSeguimiento />} />
            <Route path="maniobras" element={<Maniobras />} />
          </Route>
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

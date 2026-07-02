import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from './components/Layout/AppLayout'
import GlobalLoader from './components/GlobalLoader'
import WaveBackground from './components/WaveBackground'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Transportistas from './pages/Transportistas'
import RutasPersonalizadas from './pages/RutasPersonalizadas'
import RutasSeguimiento from './pages/RutasSeguimiento'
import Maniobras from './pages/Maniobras'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WaveBackground />
      <GlobalLoader />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="transportistas" element={<Transportistas />} />
            <Route path="rutas-personalizadas" element={<RutasPersonalizadas />} />
            <Route path="rutas-seguimiento" element={<RutasSeguimiento />} />
            <Route path="maniobras" element={<Maniobras />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

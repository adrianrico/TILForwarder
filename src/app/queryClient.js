/**
 * Cliente global de TanStack Query (caché de datos del servidor).
 * - `retry: 1`: un reintento ante fallos transitorios; no se insiste indefinidamente.
 * - `staleTime`: 30 s sin refetch para evitar tráfico innecesario al backend.
 */
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

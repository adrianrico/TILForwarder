import { useIsFetching, useIsMutating, useQueryClient } from '@tanstack/react-query'
import TILLogo from './TILLogo'

export default function GlobalLoader() {
  const queryClient      = useQueryClient()
  const mutating         = useIsMutating()
  const initialFetching  = useIsFetching({
    predicate: (q) =>
      q.state.status === 'pending' &&
      q.state.fetchStatus === 'fetching',
  })

  const busy = mutating > 0 || initialFetching > 0
  if (!busy) return null

  const getLabel = () => {
    if (mutating > 0) {
      const m = queryClient
        .getMutationCache()
        .getAll()
        .find((m) => m.state.status === 'pending')
      return m?.meta?.label ?? 'Procesando...'
    }
    const q = queryClient
      .getQueryCache()
      .getAll()
      .find(
        (q) =>
          q.state.status === 'pending' &&
          q.state.fetchStatus === 'fetching',
      )
    return q?.meta?.label ?? 'Cargando...'
  }

  return (
    <div
      style={{
        position:             'fixed',
        inset:                0,
        zIndex:               9999,
        display:              'flex',
        alignItems:           'center',
        justifyContent:       'center',
        background:           'rgba(0, 5, 15, 0.72)',
        backdropFilter:       'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        pointerEvents:        'all',
      }}
    >
      <div
        style={{
          display:              'flex',
          flexDirection:        'column',
          alignItems:           'center',
          gap:                  20,
          padding:              '40px 52px',
          background:           'rgba(0, 14, 38, 0.62)',
          backdropFilter:       'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius:         16,
          border:               '1px solid rgba(6, 149, 228, 0.25)',
          boxShadow:            '0 24px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <TILLogo height={56} />
        <div className="til-spin" />
        <span style={{ color: '#7aafc8', fontSize: 14, letterSpacing: 0.5 }}>
          {getLabel()}
        </span>
      </div>
    </div>
  )
}

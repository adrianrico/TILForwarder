import { describe, it, expect } from 'vitest'
import { isCancelado, normalizeSubEvents, buildEvents, processRouteEvents } from '../routeEvents'

describe('routeEvents', () => {
  it('detecta "cancelado" sin importar mayúsculas/espacios', () => {
    expect(isCancelado('  CANCELADO ')).toBe(true)
    expect(isCancelado('en ruta')).toBe(false)
  })
  it('normaliza subeventos desde texto', () => {
    expect(normalizeSubEvents('a, b;\n c,, ')).toEqual(['a', 'b', 'c'])
    expect(normalizeSubEvents(undefined)).toEqual([])
  })
  it('buildEvents antepone "cancelado" y no lo duplica', () => {
    const out = buildEvents([{ event_name: 'Cancelado' }, { event_name: 'Carga', sub_events: 'x,y' }])
    expect(out.map(e => e.event_name)).toEqual(['cancelado', 'Carga'])
    expect(out[1].sub_events).toEqual(['x', 'y'])
  })
  it('processRouteEvents quita cancelado y subeventos vacíos', () => {
    const out = processRouteEvents(
      [{ event_name: 'cancelado' }, { event_name: ' Carga ', sub_events: ['a', ' '] }],
      v => v.trim(),
    )
    expect(out).toEqual([{ event_name: 'Carga', sub_events: ['a'] }])
  })
})

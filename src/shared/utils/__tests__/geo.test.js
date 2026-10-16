import { describe, it, expect } from 'vitest'
import { parseCoords, safeHttpUrl } from '../geo'

describe('parseCoords', () => {
  it('acepta "lat,lng" válido (con o sin espacio)', () => {
    expect(parseCoords('19.43,-99.13')).toEqual([19.43, -99.13])
    expect(parseCoords(' 19.43, -99.13 ')).toEqual([19.43, -99.13])
  })
  it('rechaza URLs, texto y valores fuera de rango', () => {
    expect(parseCoords('https://gps.example.com/x')).toBeNull()
    expect(parseCoords('91,0')).toBeNull()
    expect(parseCoords('0,181')).toBeNull()
    expect(parseCoords(null)).toBeNull()
  })
})

describe('safeHttpUrl', () => {
  it('permite http(s)', () => {
    expect(safeHttpUrl('https://a.com/x')).toBe('https://a.com/x')
  })
  it('bloquea esquemas peligrosos', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull()
    expect(safeHttpUrl('data:text/html,hola')).toBeNull()
    expect(safeHttpUrl('no es url')).toBeNull()
  })
})

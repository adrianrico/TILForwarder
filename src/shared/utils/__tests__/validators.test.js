import { describe, it, expect } from 'vitest'
import { optionalPhone, optionalRfc } from '../validators'

const ok = (rules, value) => rules.every(r => !r.pattern || r.pattern.test(value))

describe('validators', () => {
  it('teléfono', () => {
    expect(ok(optionalPhone, '+52 (55) 1234-5678')).toBe(true)
    expect(ok(optionalPhone, 'abc')).toBe(false)
  })
  it('RFC', () => {
    expect(ok(optionalRfc, 'XAXX010101000')).toBe(true)
    expect(ok(optionalRfc, 'XYZ123')).toBe(false)
  })
})

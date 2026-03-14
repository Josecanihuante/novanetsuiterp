import { describe, it, expect } from 'vitest'
import {
  formatCLP,
  formatPercent,
  formatRatio,
  getVariationColor,
} from './formatters'

describe('Formatters Utils', () => {
  describe('formatCLP', () => {
    it('formatea números positivos correctamente', () => {
      expect(formatCLP(1500000)).toBe('$ 1.500.000')
    })

    it('formatea números cero correctamente', () => {
      expect(formatCLP(0)).toBe('$ 0')
    })

    it('formatea números negativos correctamente', () => {
      expect(formatCLP(-50000)).toBe('-$ 50.000')
    })

    it('retorna "—" para null o undefined', () => {
      expect(formatCLP(null)).toBe('—')
      expect(formatCLP(undefined)).toBe('—')
    })
  })

  describe('formatPercent', () => {
    it('formatea porcentajes positivos', () => {
      expect(formatPercent(45.5)).toBe('45.5%')
    })

    it('formatea porcentajes cero', () => {
      expect(formatPercent(0)).toBe('0.0%')
    })

    it('formatea porcentajes negativos', () => {
      expect(formatPercent(-12.5)).toBe('-12.5%')
    })

    it('retorna "—" para null o undefined', () => {
      expect(formatPercent(null)).toBe('—')
      expect(formatPercent(undefined)).toBe('—')
    })
  })

  describe('formatRatio', () => {
    it('formatea ratio normal', () => {
      expect(formatRatio(1.5)).toBe('1.50x')
    })

    it('formatea ratio cero', () => {
      expect(formatRatio(0)).toBe('0.00x')
    })

    it('retorna "—" para null o undefined', () => {
      expect(formatRatio(null)).toBe('—')
      expect(formatRatio(undefined)).toBe('—')
    })
  })

  describe('getVariationColor', () => {
    it('retorna success para valores > 0', () => {
      expect(getVariationColor(15)).toBe('success')
      expect(getVariationColor(0.1)).toBe('success')
    })

    it('retorna danger para valores < 0', () => {
      expect(getVariationColor(-5)).toBe('danger')
      expect(getVariationColor(-0.1)).toBe('danger')
    })

    it('retorna neutral para cero, null o undefined', () => {
      expect(getVariationColor(0)).toBe('neutral')
      expect(getVariationColor(null)).toBe('neutral')
      expect(getVariationColor(undefined)).toBe('neutral')
    })
  })
})

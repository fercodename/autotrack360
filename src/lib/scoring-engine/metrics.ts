/**
 * Scoring Engine - Individual Metrics
 * Calculates individual scoring metrics
 */

import { Evento, Vehiculo } from '@/types/database'
import { VERIFICATION_LEVELS } from '@/constants'

/**
 * Cobertura (30%): Mide qué tan completo es el historial
 * Basado en: cantidad de eventos, diversidad de tipos, antigüedad del vehículo
 */
export function calculateCoberturaScore(vehiculo: Vehiculo, eventos: Evento[]): number {
  if (eventos.length === 0) return 0

  const vehicleAge = new Date().getFullYear() - vehiculo.anio
  const yearsToConsider = Math.max(1, Math.min(vehicleAge, 10))
  
  // Eventos esperados: ~2 por año (service anual + al menos 1 más)
  const expectedEvents = yearsToConsider * 2
  const eventRatio = Math.min(1, eventos.length / expectedEvents)
  
  // Bonus por diversidad de tipos de eventos
  const uniqueTypes = new Set(eventos.map(e => e.tipo)).size
  const diversityBonus = Math.min(0.2, uniqueTypes * 0.05)
  
  return Math.round((eventRatio * 0.8 + diversityBonus) * 100)
}

/**
 * Frescura (25%): Eventos recientes valen más
 * Premia historial actualizado vs abandonado
 */
export function calculateFrescuraScore(eventos: Evento[]): number {
  if (eventos.length === 0) return 0

  const now = new Date()
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const oneYearAgo = new Date(now)
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const twoYearsAgo = new Date(now)
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  let score = 0
  
  eventos.forEach(evento => {
    const eventDate = new Date(evento.fecha_evento)
    
    if (eventDate >= sixMonthsAgo) {
      score += 100 // Eventos de los últimos 6 meses: peso completo
    } else if (eventDate >= oneYearAgo) {
      score += 70 // Eventos de 6-12 meses: 70%
    } else if (eventDate >= twoYearsAgo) {
      score += 40 // Eventos de 1-2 años: 40%
    } else {
      score += 20 // Eventos más antiguos: 20%
    }
  })

  return Math.round(score / eventos.length)
}

/**
 * Nivel de Verificación (35%): % de eventos con alta verificación
 * Mayor peso a eventos nivel A y B
 */
export function calculateVerificationScore(eventos: Evento[]): number {
  if (eventos.length === 0) return 0

  const totalWeight = eventos.reduce((sum, evento) => {
    return sum + VERIFICATION_LEVELS[evento.verification_level].weight
  }, 0)

  const maxPossibleWeight = eventos.length * 1.0 // Nivel A = 1.0
  return Math.round((totalWeight / maxPossibleWeight) * 100)
}

/**
 * Consistencia (10%): Verifica que el kilometraje sea coherente
 * Detecta anomalías como kilometraje que baja entre eventos
 */
export function calculateConsistenciaScore(eventos: Evento[]): number {
  // Filtrar eventos con kilometraje registrado
  const eventosConKm = eventos
    .filter(e => e.kilometraje !== null && e.kilometraje !== undefined)
    .sort((a, b) => new Date(a.fecha_evento).getTime() - new Date(b.fecha_evento).getTime())

  if (eventosConKm.length < 2) {
    // No hay suficientes datos para evaluar consistencia
    return 100
  }

  let inconsistencias = 0
  
  for (let i = 1; i < eventosConKm.length; i++) {
    const prevKm = eventosConKm[i - 1].kilometraje!
    const currentKm = eventosConKm[i].kilometraje!
    
    // El kilometraje debería aumentar o mantenerse igual
    if (currentKm < prevKm) {
      // Permitir una tolerancia del 1% para errores de tipeo
      const tolerance = prevKm * 0.01
      if (prevKm - currentKm > tolerance) {
        inconsistencias++
      }
    }
  }

  const consistencyRatio = 1 - (inconsistencias / (eventosConKm.length - 1))
  return Math.round(consistencyRatio * 100)
}

/**
 * Scoring Engine - Trust Score Calculator
 * Calculates the overall trust score (0-100) for a vehicle
 */

import { Evento, Vehiculo } from '@/types/database'
import { TRUST_SCORE_WEIGHTS } from '@/constants'
import { calculateCoberturaScore } from './metrics'
import { calculateFrescuraScore } from './metrics'
import { calculateVerificationScore } from './metrics'
import { calculateConsistenciaScore } from './metrics'

export interface TrustScoreBreakdown {
  total: number
  cobertura: number
  frescura: number
  nivelVerificacion: number
  consistencia: number
  details: {
    totalEventos: number
    eventosRecientes: number
    eventosNivelA: number
    eventosNivelB: number
    eventosNivelC: number
    kilometrajeConsistente: boolean
  }
}

export function calculateTrustScore(
  vehiculo: Vehiculo,
  eventos: Evento[]
): TrustScoreBreakdown {
  // Si no hay eventos, el score es 0
  if (eventos.length === 0) {
    return {
      total: 0,
      cobertura: 0,
      frescura: 0,
      nivelVerificacion: 0,
      consistencia: 0,
      details: {
        totalEventos: 0,
        eventosRecientes: 0,
        eventosNivelA: 0,
        eventosNivelB: 0,
        eventosNivelC: 0,
        kilometrajeConsistente: true,
      },
    }
  }

  // Calcular cada métrica
  const coberturaScore = calculateCoberturaScore(vehiculo, eventos)
  const frescuraScore = calculateFrescuraScore(eventos)
  const verificationScore = calculateVerificationScore(eventos)
  const consistenciaScore = calculateConsistenciaScore(eventos)

  // Calcular score total ponderado
  const total = Math.round(
    coberturaScore * TRUST_SCORE_WEIGHTS.cobertura +
    frescuraScore * TRUST_SCORE_WEIGHTS.frescura +
    verificationScore * TRUST_SCORE_WEIGHTS.nivelVerificacion +
    consistenciaScore * TRUST_SCORE_WEIGHTS.consistencia
  )

  // Contar eventos por nivel
  const eventosNivelA = eventos.filter(e => e.verification_level === 'A').length
  const eventosNivelB = eventos.filter(e => e.verification_level === 'B').length
  const eventosNivelC = eventos.filter(e => e.verification_level === 'C').length

  // Contar eventos recientes (últimos 6 meses)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const eventosRecientes = eventos.filter(e => 
    new Date(e.fecha_evento) >= sixMonthsAgo
  ).length

  return {
    total: Math.min(100, Math.max(0, total)),
    cobertura: coberturaScore,
    frescura: frescuraScore,
    nivelVerificacion: verificationScore,
    consistencia: consistenciaScore,
    details: {
      totalEventos: eventos.length,
      eventosRecientes,
      eventosNivelA,
      eventosNivelB,
      eventosNivelC,
      kilometrajeConsistente: consistenciaScore >= 80,
    },
  }
}

export function getTrustScoreLabel(score: number): {
  label: string
  color: string
  description: string
} {
  if (score >= 80) {
    return {
      label: 'Excelente',
      color: 'text-trust-high',
      description: 'Historial muy completo y verificado',
    }
  }
  if (score >= 60) {
    return {
      label: 'Bueno',
      color: 'text-primary-600',
      description: 'Historial con buena cobertura',
    }
  }
  if (score >= 40) {
    return {
      label: 'Regular',
      color: 'text-trust-medium',
      description: 'Historial parcial, se recomienda más evidencias',
    }
  }
  if (score >= 20) {
    return {
      label: 'Básico',
      color: 'text-orange-500',
      description: 'Pocos eventos registrados',
    }
  }
  return {
    label: 'Incompleto',
    color: 'text-trust-low',
    description: 'Sin historial significativo',
  }
}

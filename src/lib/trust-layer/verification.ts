/**
 * Trust Layer - Verification Levels
 * Determines and validates verification levels for events
 */

import { VerificationLevel, Evento, Evidencia } from '@/types/database'
import { VERIFICATION_LEVELS } from '@/constants'

export interface VerificationResult {
  level: VerificationLevel
  reasons: string[]
  canUpgrade: boolean
  upgradeHint?: string
}

export function determineVerificationLevel(
  evento: Partial<Evento>,
  evidencias: Evidencia[],
  isVerifiedWorkshop: boolean
): VerificationResult {
  const reasons: string[] = []
  
  // Nivel A: Firmado por taller verificado
  if (evento.workshop_id && isVerifiedWorkshop && evento.workshop_signature) {
    reasons.push('Evento firmado por taller verificado')
    return {
      level: 'A',
      reasons,
      canUpgrade: false,
    }
  }
  
  // Nivel B: Tiene evidencias con hash válido
  if (evidencias.length > 0) {
    const validEvidences = evidencias.filter(e => e.hash_sha256 && e.hash_sha256.length === 64)
    if (validEvidences.length > 0) {
      reasons.push(`${validEvidences.length} evidencia(s) con hash verificable`)
      return {
        level: 'B',
        reasons,
        canUpgrade: true,
        upgradeHint: 'Para nivel A, el evento debe ser registrado por un taller verificado',
      }
    }
  }
  
  // Nivel C: Declarativo
  reasons.push('Evento sin evidencias verificables')
  return {
    level: 'C',
    reasons,
    canUpgrade: true,
    upgradeHint: 'Agregá fotos o documentos para subir a nivel B',
  }
}

export function getVerificationLevelInfo(level: VerificationLevel) {
  return VERIFICATION_LEVELS[level]
}

export function calculateVerificationScore(events: { verification_level: VerificationLevel }[]): number {
  if (events.length === 0) return 0
  
  const totalWeight = events.reduce((sum, event) => {
    return sum + VERIFICATION_LEVELS[event.verification_level].weight
  }, 0)
  
  const maxWeight = events.length * 1.0 // Nivel A = 1.0
  return Math.round((totalWeight / maxWeight) * 100)
}

export function getVerificationDistribution(events: { verification_level: VerificationLevel }[]): {
  A: number
  B: number
  C: number
  total: number
} {
  const distribution = { A: 0, B: 0, C: 0, total: events.length }
  
  events.forEach(event => {
    distribution[event.verification_level]++
  })
  
  return distribution
}

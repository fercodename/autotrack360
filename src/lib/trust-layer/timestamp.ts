/**
 * Trust Layer - Timestamp Management
 * Generates immutable UTC timestamps for evidence
 */

export function generateTimestamp(): string {
  return new Date().toISOString()
}

export function parseTimestamp(timestamp: string): Date {
  return new Date(timestamp)
}

export function formatTimestamp(timestamp: string, locale: string = 'es-AR'): string {
  const date = parseTimestamp(timestamp)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date)
}

export function getTimestampAge(timestamp: string): {
  days: number
  months: number
  years: number
  isRecent: boolean
} {
  const date = parseTimestamp(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)
  
  return {
    days,
    months,
    years,
    isRecent: days <= 180, // Considerado reciente si es de los últimos 6 meses
  }
}

export function isTimestampValid(timestamp: string): boolean {
  const date = parseTimestamp(timestamp)
  const now = new Date()
  
  // Timestamp no puede ser del futuro
  if (date > now) return false
  
  // Timestamp no puede ser de hace más de 50 años (vehículos muy antiguos)
  const fiftyYearsAgo = new Date()
  fiftyYearsAgo.setFullYear(fiftyYearsAgo.getFullYear() - 50)
  if (date < fiftyYearsAgo) return false
  
  return true
}

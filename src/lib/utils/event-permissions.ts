/**
 * Utilidades para permisos de edición de eventos
 */

const EDIT_WINDOW_HOURS = 48

export function canEditEvent(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
  return hoursSinceCreation <= EDIT_WINDOW_HOURS
}

export function getEditTimeRemaining(createdAt: string): {
  canEdit: boolean
  hoursRemaining: number
  message: string
} {
  const created = new Date(createdAt)
  const now = new Date()
  const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
  const hoursRemaining = Math.max(0, EDIT_WINDOW_HOURS - hoursSinceCreation)
  
  if (hoursRemaining <= 0) {
    return {
      canEdit: false,
      hoursRemaining: 0,
      message: 'El período de edición ha expirado',
    }
  }
  
  if (hoursRemaining < 1) {
    const minutesRemaining = Math.round(hoursRemaining * 60)
    return {
      canEdit: true,
      hoursRemaining,
      message: `Podés editar por ${minutesRemaining} minutos más`,
    }
  }
  
  return {
    canEdit: true,
    hoursRemaining,
    message: `Podés editar por ${Math.round(hoursRemaining)} horas más`,
  }
}

export function validateKilometraje(
  nuevoKm: number,
  fechaEvento: string,
  eventosExistentes: { fecha_evento: string; kilometraje: number | null }[]
): {
  isValid: boolean
  warning: string | null
} {
  const fecha = new Date(fechaEvento)
  
  // Filtrar eventos con kilometraje
  const eventosConKm = eventosExistentes
    .filter(e => e.kilometraje !== null)
    .sort((a, b) => new Date(a.fecha_evento).getTime() - new Date(b.fecha_evento).getTime())
  
  if (eventosConKm.length === 0) {
    return { isValid: true, warning: null }
  }
  
  // Encontrar evento anterior más cercano (por fecha)
  const eventosAnteriores = eventosConKm.filter(e => new Date(e.fecha_evento) < fecha)
  const eventoAnterior = eventosAnteriores[eventosAnteriores.length - 1]
  
  // Encontrar evento posterior más cercano (por fecha)
  const eventosPosteriores = eventosConKm.filter(e => new Date(e.fecha_evento) > fecha)
  const eventoPosterior = eventosPosteriores[0]
  
  // Validar contra evento anterior
  if (eventoAnterior && nuevoKm < eventoAnterior.kilometraje!) {
    return {
      isValid: false,
      warning: `El kilometraje (${nuevoKm.toLocaleString()} km) es menor al evento anterior (${eventoAnterior.kilometraje!.toLocaleString()} km). Verificá que sea correcto.`,
    }
  }
  
  // Validar contra evento posterior
  if (eventoPosterior && nuevoKm > eventoPosterior.kilometraje!) {
    return {
      isValid: false,
      warning: `El kilometraje (${nuevoKm.toLocaleString()} km) es mayor al evento posterior (${eventoPosterior.kilometraje!.toLocaleString()} km). Verificá que sea correcto.`,
    }
  }
  
  return { isValid: true, warning: null }
}

/**
 * Estima la fecha en que un vehículo alcanzará un kilometraje objetivo,
 * basado en su historial de eventos con km registrado.
 *
 * Requiere al menos 2 eventos con km para calcular la tasa.
 * Retorna null si no hay suficientes datos.
 */

interface EventoConKm {
  fecha_evento: string
  kilometraje: number
}

interface EstimacionKm {
  /** Fecha estimada en que se alcanzará el target */
  fechaEstimada: Date
  /** Km/día calculados del historial */
  kmPorDia: number
  /** Último km registrado */
  ultimoKm: number
  /** Km estimados a hoy */
  kmEstimadosHoy: number
  /** Confianza: 'baja' (2-3 eventos), 'media' (4-6), 'alta' (7+) */
  confianza: 'baja' | 'media' | 'alta'
}

export function estimarFechaParaKm(
  eventos: EventoConKm[],
  targetKm: number
): EstimacionKm | null {
  // Filtrar eventos con km válido y ordenar por fecha
  const conKm = eventos
    .filter(e => e.kilometraje != null && e.kilometraje > 0)
    .sort((a, b) => new Date(a.fecha_evento).getTime() - new Date(b.fecha_evento).getTime())

  if (conKm.length < 2) return null

  const primero = conKm[0]
  const ultimo = conKm[conKm.length - 1]

  const diasEntreExtremos =
    (new Date(ultimo.fecha_evento).getTime() - new Date(primero.fecha_evento).getTime()) /
    (1000 * 60 * 60 * 24)

  // Si los eventos son del mismo día, no podemos calcular tasa
  if (diasEntreExtremos <= 0) return null

  const kmRecorridos = ultimo.kilometraje - primero.kilometraje

  // Si el km no avanzó (o retrocedió), no tiene sentido estimar
  if (kmRecorridos <= 0) return null

  const kmPorDia = kmRecorridos / diasEntreExtremos

  // Km estimados a hoy
  const diasDesdeUltimo =
    (Date.now() - new Date(ultimo.fecha_evento).getTime()) /
    (1000 * 60 * 60 * 24)

  const kmEstimadosHoy = ultimo.kilometraje + kmPorDia * diasDesdeUltimo

  // Si ya superó el target, la fecha estimada es en el pasado (vencido)
  const kmFaltantes = targetKm - kmEstimadosHoy
  const diasHastaTarget = kmFaltantes / kmPorDia

  const fechaEstimada = new Date(Date.now() + diasHastaTarget * 24 * 60 * 60 * 1000)

  // Confianza basada en cantidad de datos
  let confianza: 'baja' | 'media' | 'alta' = 'baja'
  if (conKm.length >= 7) confianza = 'alta'
  else if (conKm.length >= 4) confianza = 'media'

  return {
    fechaEstimada,
    kmPorDia: Math.round(kmPorDia * 10) / 10,
    ultimoKm: ultimo.kilometraje,
    kmEstimadosHoy: Math.round(kmEstimadosHoy),
    confianza,
  }
}

/**
 * Formatea la estimación como texto amigable.
 * Ej: "~mayo 2026" o "Vencido (~hace 2 meses)"
 */
export function formatearEstimacionKm(estimacion: EstimacionKm): string {
  const ahora = new Date()
  const diff = estimacion.fechaEstimada.getTime() - ahora.getTime()
  const diasDiff = Math.round(diff / (1000 * 60 * 60 * 24))

  if (diasDiff < -30) {
    const mesesAtras = Math.abs(Math.round(diasDiff / 30))
    return `Vencido (~hace ${mesesAtras} ${mesesAtras === 1 ? 'mes' : 'meses'})`
  }

  if (diasDiff < 0) {
    return 'Vencido (estos días)'
  }

  if (diasDiff <= 7) {
    return 'Esta semana'
  }

  if (diasDiff <= 30) {
    return `En ~${Math.round(diasDiff / 7)} semanas`
  }

  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const mes = meses[estimacion.fechaEstimada.getMonth()]
  const anio = estimacion.fechaEstimada.getFullYear()

  if (anio === ahora.getFullYear()) {
    return `~${mes}`
  }

  return `~${mes} ${anio}`
}

'use client'

import Link from 'next/link'
import { CalendarClock, AlertTriangle, Clock, CheckCircle2, Gauge } from 'lucide-react'
import { Card, CardContent, PatentePlate } from '@/components/ui'
import { EVENT_TYPES } from '@/constants'

export interface ProximaRevision {
  eventoId: string
  vehiculoId: string
  patente: string
  contactName: string | null
  tipo: string
  proximaRevisionAt: string | null
  proximaRevisionKm: number | null
  /** Fecha estimada para alcanzar los km (calculada server-side) */
  kmFechaEstimada: string | null
  /** Confianza de la estimación */
  kmConfianza: 'baja' | 'media' | 'alta' | null
}

interface TallerProximasRevisionesProps {
  revisiones: ProximaRevision[]
}

function getDiasRestantes(fecha: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const target = new Date(fecha + 'T00:00:00')
  return Math.ceil((target.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function getUrgenciaConfig(dias: number) {
  if (dias < 0) {
    return {
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      icon: AlertTriangle,
      label: `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`,
    }
  }
  if (dias === 0) {
    return {
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      icon: AlertTriangle,
      label: 'Vence hoy',
    }
  }
  if (dias <= 7) {
    return {
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      icon: AlertTriangle,
      label: `En ${dias} día${dias !== 1 ? 's' : ''}`,
    }
  }
  if (dias <= 30) {
    return {
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      icon: Clock,
      label: `En ${dias} días`,
    }
  }
  return {
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    icon: CheckCircle2,
    label: `En ${dias} días`,
  }
}

function getEffectiveDateAndDias(rev: ProximaRevision): { fecha: string | null; dias: number; esEstimacion: boolean } {
  const fechaDate = rev.proximaRevisionAt
  const fechaKm = rev.kmFechaEstimada

  if (fechaDate && fechaKm) {
    // Usar la que vence primero
    const diasDate = getDiasRestantes(fechaDate)
    const diasKm = getDiasRestantes(fechaKm)
    if (diasKm < diasDate) {
      return { fecha: fechaKm, dias: diasKm, esEstimacion: true }
    }
    return { fecha: fechaDate, dias: diasDate, esEstimacion: false }
  }

  if (fechaDate) {
    return { fecha: fechaDate, dias: getDiasRestantes(fechaDate), esEstimacion: false }
  }

  if (fechaKm) {
    return { fecha: fechaKm, dias: getDiasRestantes(fechaKm), esEstimacion: true }
  }

  return { fecha: null, dias: 999, esEstimacion: false }
}

const CONFIANZA_LABEL: Record<string, string> = {
  baja: 'aprox.',
  media: 'est.',
  alta: 'est.',
}

export function TallerProximasRevisiones({ revisiones }: TallerProximasRevisionesProps) {
  if (revisiones.length === 0) {
    return (
      <Card className="card-premium">
        <CardContent className="py-8 text-center">
          <CalendarClock className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No hay revisiones próximas programadas</p>
          <p className="text-slate-500 text-xs mt-1">
            Agregá fecha o km de próxima revisión al crear un evento
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {revisiones.map((rev) => {
        const { fecha, dias, esEstimacion } = getEffectiveDateAndDias(rev)
        const urgencia = getUrgenciaConfig(dias)
        const UrgenciaIcon = urgencia.icon
        const tipoConfig = EVENT_TYPES[rev.tipo as keyof typeof EVENT_TYPES]

        const fechaFormatted = fecha
          ? new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : null

        return (
          <Link
            key={rev.eventoId}
            href={`/dashboard/taller/vehiculo/${rev.vehiculoId}`}
            className="block"
          >
            <Card className={`border ${urgencia.bg} hover:border-slate-500 transition-colors cursor-pointer`}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex-shrink-0 ${urgencia.color}`}>
                      <UrgenciaIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <PatentePlate patente={rev.patente} size="sm" />
                        {rev.contactName && (
                          <span className="text-xs text-slate-400 truncate max-w-[8rem]">
                            {rev.contactName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-xs text-slate-500 truncate">
                          {tipoConfig?.label || rev.tipo}
                          {fechaFormatted && ` — ${fechaFormatted}`}
                        </p>
                        {rev.proximaRevisionKm && (
                          <span className="text-xs text-slate-500 flex items-center gap-0.5">
                            <Gauge className="h-3 w-3" />
                            {rev.proximaRevisionKm.toLocaleString('es-AR')} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-medium whitespace-nowrap ${urgencia.color}`}>
                      {urgencia.label}
                    </span>
                    {esEstimacion && rev.kmConfianza && (
                      <p className="text-[10px] text-slate-600">
                        {CONFIANZA_LABEL[rev.kmConfianza]} por km
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

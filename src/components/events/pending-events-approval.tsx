'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle, Check, X, Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { EVENT_TYPES } from '@/constants'
import type { Evento, Evidencia } from '@/types/database'

interface EventoWithEvidencias extends Evento {
  evidencias: Evidencia[]
}

interface PendingEventsApprovalProps {
  eventos: EventoWithEvidencias[]
  vehiculoId: string
}

export function PendingEventsApproval({ eventos, vehiculoId }: PendingEventsApprovalProps) {
  const router = useRouter()

  const handleApprove = async (eventoId: string) => {
    const supabase = createClient()
    await supabase
      .from('eventos')
      .update({ approval_status: 'aprobado' })
      .eq('id', eventoId)
    router.refresh()
  }

  const handleReject = async (eventoId: string) => {
    const supabase = createClient()
    await supabase
      .from('eventos')
      .update({ approval_status: 'rechazado' })
      .eq('id', eventoId)
    router.refresh()
  }

  return (
    <Card className="border-yellow-500/30 bg-yellow-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-400">
          <AlertCircle className="h-5 w-5" />
          Eventos pendientes de aprobación ({eventos.length})
        </CardTitle>
        <p className="text-sm text-slate-400">
          Un taller cargó estos servicios. Aprobálos para sumarlos al historial del vehículo.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {eventos.map((evento) => (
          <div
            key={evento.id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-surface-light/50 border border-slate-700"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-accent" />
                <span className="text-sm text-slate-400">
                  {EVENT_TYPES[evento.tipo as keyof typeof EVENT_TYPES]?.label || evento.tipo}
                </span>
              </div>
              <h3 className="font-semibold text-white mt-1">{evento.titulo}</h3>
              <p className="text-sm text-slate-400">
                {format(new Date(evento.fecha_evento), "d 'de' MMMM, yyyy", { locale: es })}
                {evento.kilometraje && ` • ${evento.kilometraje.toLocaleString('es-AR')} km`}
              </p>
              {evento.evidencias?.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {evento.evidencias.length} evidencia{evento.evidencias.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="text-green-400 border-green-500/50 hover:bg-green-900/30"
                onClick={() => handleApprove(evento.id)}
              >
                <Check className="h-4 w-4 mr-1" />
                Aprobar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:bg-red-900/30"
                onClick={() => handleReject(evento.id)}
              >
                <X className="h-4 w-4 mr-1" />
                Rechazar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

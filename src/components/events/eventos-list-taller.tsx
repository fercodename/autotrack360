'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Wrench, Settings, ClipboardCheck, Search, FileText, ImageIcon, ChevronRight, Clock, Check, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { Evento, Evidencia } from '@/types/database'
import { VERIFICATION_LEVELS, EVENT_APPROVAL_STATUS } from '@/constants'

interface EventoWithEvidencias extends Evento {
  evidencias: Evidencia[]
}

interface EventosListTallerProps {
  eventos: EventoWithEvidencias[]
  vehiculoId: string
}

const EVENT_ICONS = {
  service: Wrench,
  reparacion: Settings,
  vtv: ClipboardCheck,
  inspeccion: Search,
  otro: FileText,
}

const EVENT_COLORS = {
  service: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  reparacion: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  vtv: 'bg-green-500/10 text-green-400 border border-green-500/20',
  inspeccion: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  otro: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
}

const APPROVAL_BADGE = {
  pendiente_aprobacion: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  aprobado: 'bg-green-500/20 text-green-400 border border-green-500/30',
  rechazado: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

export function EventosListTaller({ eventos, vehiculoId }: EventosListTallerProps) {
  if (eventos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-surface-light flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Sin trabajos registrados</h3>
          <p className="text-slate-400">Registrá el primer service o reparación que le hiciste a este vehículo. Podés adjuntar fotos y comprobantes.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {eventos.map((evento) => {
        const Icon = EVENT_ICONS[evento.tipo as keyof typeof EVENT_ICONS]
        const colorClass = EVENT_COLORS[evento.tipo as keyof typeof EVENT_ICONS]
        const verificationInfo = VERIFICATION_LEVELS[evento.verification_level]
        const approvalClass = APPROVAL_BADGE[evento.approval_status]

        return (
          <Link
            key={evento.id}
            href={`/dashboard/taller/vehiculo/${vehiculoId}/evento/${evento.id}`}
          >
            <Card className="card-premium-hover cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-white truncate">{evento.titulo}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${verificationInfo.bgColor} text-white`}>
                        {evento.verification_level}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${approvalClass}`}>
                        {EVENT_APPROVAL_STATUS[evento.approval_status].short}
                      </span>
                    </div>

                    <p className="text-sm text-slate-400 mb-2">
                      {format(new Date(evento.fecha_evento), "d 'de' MMMM, yyyy", { locale: es })}
                      {evento.kilometraje && ` • ${evento.kilometraje.toLocaleString('es-AR')} km`}
                    </p>

                    {evento.descripcion && (
                      <p className="text-sm text-slate-300 line-clamp-2">{evento.descripcion}</p>
                    )}

                    {evento.evidencias && evento.evidencias.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-300">
                        <ImageIcon className="h-3 w-3" />
                        {evento.evidencias.length} archivo{evento.evidencias.length !== 1 ? 's' : ''} adjunto{evento.evidencias.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {evento.costo && (
                      <span className="text-sm font-medium text-accent">
                        ${evento.costo.toLocaleString('es-AR')}
                      </span>
                    )}
                    <ChevronRight className="h-5 w-5 text-slate-600" />
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

'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Wrench, Settings, ClipboardCheck, Search, FileText, ImageIcon, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { Evento, Evidencia } from '@/types/database'
import { VERIFICATION_LEVELS } from '@/constants'

interface EventoWithEvidencias extends Evento {
  evidencias: Evidencia[]
}

interface EventosListProps {
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

export function EventosList({ eventos, vehiculoId }: EventosListProps) {
  if (eventos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-surface-light flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Todavía no hay eventos
          </h3>
          <p className="text-slate-400">
            Registrá un service, reparación o VTV para empezar a construir el historial verificable de este vehículo.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {eventos.map((evento) => {
        const Icon = EVENT_ICONS[evento.tipo]
        const colorClass = EVENT_COLORS[evento.tipo]
        const verificationInfo = VERIFICATION_LEVELS[evento.verification_level]

        return (
          <Link 
            key={evento.id} 
            href={`/dashboard/vehiculo/${vehiculoId}/evento/${evento.id}`}
          >
            <Card className="card-premium-hover cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {evento.titulo}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${verificationInfo.bgColor} text-white`}>
                        {evento.verification_level}
                      </span>
                    </div>

                    <p className="text-sm text-slate-400 mb-2">
                      {format(new Date(evento.fecha_evento), "d 'de' MMMM, yyyy", { locale: es })}
                      {evento.kilometraje && ` • ${evento.kilometraje.toLocaleString('es-AR')} km`}
                    </p>

                    {evento.descripcion && (
                      <p className="text-sm text-slate-300 line-clamp-2">
                        {evento.descripcion}
                      </p>
                    )}

                    {evento.evidencias && evento.evidencias.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-accent">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>{evento.evidencias.length} evidencia{evento.evidencias.length !== 1 ? 's' : ''} — tocá para ver o previsualizar</span>
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

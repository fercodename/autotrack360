'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Wrench, Settings, ClipboardCheck, Search, FileText } from 'lucide-react'
import { PatentePlate } from '@/components/ui'
import { EventType, EventApprovalStatus } from '@/types/database'
import { EVENT_APPROVAL_STATUS } from '@/constants'

const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  service: Wrench,
  reparacion: Settings,
  vtv: ClipboardCheck,
  inspeccion: Search,
  otro: FileText,
}

const APPROVAL_DOTS: Record<string, string> = {
  pendiente_aprobacion: 'bg-yellow-400',
  aprobado: 'bg-green-400',
  rechazado: 'bg-red-400',
}

export interface RecentEvent {
  id: string
  vehiculo_id: string
  tipo: EventType
  titulo: string
  fecha_evento: string
  approval_status: EventApprovalStatus
  costo: number | null
  patente: string
}

export function TallerRecentActivity({ eventos }: { eventos: RecentEvent[] }) {
  if (eventos.length === 0) return null

  return (
    <div className="space-y-0 divide-y divide-slate-800/50">
      {eventos.map((evento) => {
        const Icon = EVENT_ICONS[evento.tipo] || FileText
        const dotClass = APPROVAL_DOTS[evento.approval_status]

        return (
          <Link
            key={evento.id}
            href={`/dashboard/taller/vehiculo/${evento.vehiculo_id}/evento/${evento.id}`}
            className="flex items-center gap-3 py-2 px-1 hover:bg-surface-light/30 rounded-lg transition-colors group"
          >
            <Icon className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
            <span className="text-sm text-slate-400 truncate flex-1 group-hover:text-slate-200 transition-colors">
              {evento.titulo}
            </span>
            <PatentePlate patente={evento.patente} size="sm" />
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`}
              title={EVENT_APPROVAL_STATUS[evento.approval_status].short}
            />
            <span className="text-xs text-slate-600 flex-shrink-0">
              {format(new Date(evento.fecha_evento), "d MMM", { locale: es })}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Wrench, Settings, ClipboardCheck, Search, FileText, Calendar, Gauge, DollarSign, Shield } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { ExpandableText } from '@/components/ui/expandable-text'
import { VERIFICATION_LEVELS, EVENT_APPROVAL_STATUS } from '@/constants'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AddEvidenceButton } from '@/components/evidence/add-evidence-button'
import { EvidencePreviewItem, type EvidenceWithUrl } from '@/components/evidence/evidence-preview'
import { TallerEventoNotas } from '@/components/taller/taller-evento-notas'

interface Props {
  params: Promise<{ id: string; eventoId: string }>
}

const EVENT_ICONS = {
  service: Wrench,
  reparacion: Settings,
  vtv: ClipboardCheck,
  inspeccion: Search,
  otro: FileText,
}

const EVENT_COLORS = {
  service: 'bg-blue-900/50 text-blue-400',
  reparacion: 'bg-orange-900/50 text-orange-400',
  vtv: 'bg-green-900/50 text-green-400',
  inspeccion: 'bg-purple-900/50 text-purple-400',
  otro: 'bg-slate-700 text-slate-300',
}

const EVENT_LABELS = {
  service: 'Service',
  reparacion: 'Reparación',
  vtv: 'VTV',
  inspeccion: 'Inspección',
  otro: 'Otro',
}

export default async function TallerEventoDetailPage({ params }: Props) {
  const { id: vehiculoId, eventoId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: evento, error } = await supabase
    .from('eventos')
    .select(`*, evidencias (*)`)
    .eq('id', eventoId)
    .single()

  if (error || !evento) notFound()

  const { data: link } = await supabase
    .from('vehiculo_taller')
    .select('vehiculo_id')
    .eq('vehiculo_id', vehiculoId)
    .eq('taller_id', user!.id)
    .single()

  if (!link) notFound()

  const isMyEvent = evento.workshop_id === user!.id || evento.created_by === user!.id
  if (!isMyEvent) notFound()

  const { data: vehiculo } = await supabase.from('vehiculos').select('id, patente').eq('id', vehiculoId).single()
  if (!vehiculo) notFound()

  const Icon = EVENT_ICONS[evento.tipo as keyof typeof EVENT_ICONS]
  const colorClass = EVENT_COLORS[evento.tipo as keyof typeof EVENT_COLORS]
  const eventLabel = EVENT_LABELS[evento.tipo as keyof typeof EVENT_LABELS]
  const verificationInfo = VERIFICATION_LEVELS[evento.verification_level as keyof typeof VERIFICATION_LEVELS]

  const evidenciasConUrl: EvidenceWithUrl[] = await Promise.all(
    (evento.evidencias || []).map(async (e: { storage_path: string; [key: string]: unknown }) => {
      const { data } = await supabase.storage.from('evidencias').createSignedUrl(e.storage_path, 3600)
      return { ...e, signedUrl: data?.signedUrl ?? null } as EvidenceWithUrl
    })
  )

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/dashboard/taller/vehiculo/${vehiculoId}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a {vehiculo.patente}
      </Link>

      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorClass}`}>
              <Icon className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-slate-400">{eventLabel}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium text-white ${verificationInfo.bgColor}`}>
                  Nivel {evento.verification_level}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                  {EVENT_APPROVAL_STATUS[evento.approval_status].short}
                </span>
              </div>
              <h1 className="text-xl font-bold text-white mb-2">{evento.titulo}</h1>
              <p className="text-sm text-slate-400">{verificationInfo.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Detalles del Evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-light rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Fecha</p>
                <p className="font-semibold text-white">
                  {format(new Date(evento.fecha_evento), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
            </div>
            {evento.kilometraje && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-light rounded-lg flex items-center justify-center">
                  <Gauge className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Kilometraje</p>
                  <p className="font-semibold text-white">{evento.kilometraje.toLocaleString('es-AR')} km</p>
                </div>
              </div>
            )}
            {evento.costo && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-light rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Costo</p>
                  <p className="font-semibold text-white">${evento.costo.toLocaleString('es-AR')}</p>
                </div>
              </div>
            )}
            {(evento.proxima_revision_at || evento.proxima_revision_km) && (
              <div className="flex items-center gap-3 col-span-2">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Próxima revisión</p>
                  <div className="flex items-center gap-3">
                    {evento.proxima_revision_at && (
                      <p className="font-semibold text-white">
                        {format(new Date(evento.proxima_revision_at), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    )}
                    {evento.proxima_revision_km && (
                      <p className="font-semibold text-white flex items-center gap-1">
                        <Gauge className="h-4 w-4 text-slate-400" />
                        {evento.proxima_revision_km.toLocaleString('es-AR')} km
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {evento.descripcion && (
            <div className="pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Descripción</p>
              <ExpandableText text={evento.descripcion} maxLines={3} />
            </div>
          )}
        </CardContent>
      </Card>

      <TallerEventoNotas
        eventoId={eventoId}
        notasIniciales={evento.notas_internas_taller ?? null}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-600" />
              Evidencias ({evidenciasConUrl.length})
            </CardTitle>
            <AddEvidenceButton eventoId={eventoId} vehiculoId={vehiculoId} />
          </div>
        </CardHeader>
        <CardContent>
          {evidenciasConUrl.length > 0 ? (
            <div className="space-y-2">
              {evidenciasConUrl.map((ev) => (
                <EvidencePreviewItem
                  key={ev.id}
                  evidencia={ev}
                  variant={ev.tipo === 'comprobante' ? 'comprobante' : 'tecnica'}
                />
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-4">No hay evidencias adjuntas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

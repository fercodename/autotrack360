import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Car, Plus, Calendar, Gauge, Hash, Fuel, Palette, QrCode, Bell } from 'lucide-react'
import { Button } from '@/components/ui'
import { Card, CardHeader, CardTitle, CardContent, PatentePlate } from '@/components/ui'
import { TrustScoreBadge } from '@/components/scoring/trust-score-badge'
import { RecalculateButton } from '@/components/scoring/recalculate-button'
import { EventosList } from '@/components/events/eventos-list'
import { PendingEventsApproval } from '@/components/events/pending-events-approval'

interface Props {
  params: Promise<{ id: string }>
}

export default async function VehiculoDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: vehiculo, error } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single()

  if (error || !vehiculo) {
    notFound()
  }

  const { data: todosEventos } = await supabase
    .from('eventos')
    .select(`
      *,
      evidencias (*)
    `)
    .eq('vehiculo_id', id)
    .order('fecha_evento', { ascending: false })

  const eventosAprobados = (todosEventos || []).filter(
    e => !e.is_hidden && (e.approval_status === 'aprobado' || e.approval_status == null)
  )
  const eventosPendientes = (todosEventos || []).filter(
    e => e.approval_status === 'pendiente_aprobacion'
  )

  const today = new Date().toISOString().split('T')[0]
  const proximasRevisiones = (eventosAprobados || [])
    .filter((e: { proxima_revision_at: string | null }) => e.proxima_revision_at && e.proxima_revision_at >= today)
    .sort((a: { proxima_revision_at: string }, b: { proxima_revision_at: string }) => a.proxima_revision_at.localeCompare(b.proxima_revision_at))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link 
            href="/dashboard" 
            className="mt-1 p-2 hover:bg-surface-light rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <PatentePlate patente={vehiculo.patente} size="lg" />
            </div>
            <p className="text-slate-400 mt-1">
              {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrustScoreBadge score={vehiculo.trust_score} size="md" />
          <RecalculateButton vehiculoId={id} />
        </div>
      </div>

      {/* Vehicle Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-accent" />
            Información del Vehículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center">
                <Gauge className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Kilometraje</p>
                <p className="font-semibold text-white">
                  {vehiculo.kilometraje_actual?.toLocaleString('es-AR')} km
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center">
                <Calendar className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Año</p>
                <p className="font-semibold text-white">{vehiculo.anio}</p>
              </div>
            </div>

            {vehiculo.tipo_combustible && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center">
                  <Fuel className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Combustible</p>
                  <p className="font-semibold text-white capitalize">{vehiculo.tipo_combustible}</p>
                </div>
              </div>
            )}

            {vehiculo.color && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center">
                  <Palette className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Color</p>
                  <p className="font-semibold text-white capitalize">{vehiculo.color}</p>
                </div>
              </div>
            )}

            {vehiculo.vin && (
              <div className="flex items-center gap-3 col-span-2">
                <div className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center">
                  <Hash className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">VIN</p>
                  <p className="font-semibold font-mono text-sm text-white">{vehiculo.vin}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/dashboard/vehiculo/${id}/compartir`} className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full sm:w-auto">
            <QrCode className="h-4 w-4 mr-2" />
            Compartir QR
          </Button>
        </Link>
      </div>

      {/* Eventos pendientes de aprobación (creados por taller) */}
      {eventosPendientes.length > 0 && (
        <PendingEventsApproval
          eventos={eventosPendientes}
          vehiculoId={id}
        />
      )}

      {/* Próximas revisiones (recordatorios) */}
      {proximasRevisiones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />
              Próximas revisiones
            </CardTitle>
            <p className="text-sm text-slate-400 mt-1">
              Recordatorios según los eventos cargados; podés agendar el próximo service.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {proximasRevisiones.map((ev: { id: string; titulo: string; proxima_revision_at: string }) => (
                <li key={ev.id}>
                  <Link
                    href={`/dashboard/vehiculo/${id}/evento/${ev.id}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-light/50 hover:bg-surface-light transition-colors"
                  >
                    <span className="font-medium text-white">{ev.titulo}</span>
                    <span className="text-sm text-slate-400">
                      {new Date(ev.proxima_revision_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Events Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          Historial de Eventos
        </h2>
        <Link href={`/dashboard/vehiculo/${id}/evento/nuevo`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Evento
          </Button>
        </Link>
      </div>

      <EventosList eventos={eventosAprobados} vehiculoId={id} />
    </div>
  )
}

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Car, Plus, ChevronRight, Gauge, Wrench, Users } from 'lucide-react'
import { Card, CardContent, PatentePlate } from '@/components/ui'
import { Button } from '@/components/ui'
import { TrustScoreBadge } from '@/components/scoring/trust-score-badge'
import { TallerVehiculosList } from '@/components/taller/taller-vehiculos-list'
import { TallerDashboardStats } from '@/components/taller/taller-dashboard-stats'
import { TallerRecentActivity, type RecentEvent } from '@/components/taller/taller-recent-activity'
import { TallerProximasRevisiones, type ProximaRevision } from '@/components/taller/taller-proximas-revisiones'
import { estimarFechaParaKm } from '@/lib/utils/km-estimator'

function DashboardFallback() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Inicio</h1>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-slate-400">No se pudo cargar el panel. Probá recargar la página.</p>
          <Link href="/dashboard" className="inline-block mt-4">
            <Button variant="outline">Recargar</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isTaller = profile?.role === 'taller'

  if (isTaller) {
    try {
      return await TallerDashboard()
    } catch {
      return <DashboardFallback />
    }
  }

  const { data: vehiculos } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Vehículos</h1>
          <p className="text-slate-400">
            {vehiculos?.length || 0} vehículo{vehiculos?.length !== 1 ? 's' : ''} registrado{vehiculos?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/vehiculo/nuevo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </Link>
      </div>

      {vehiculos && vehiculos.length > 0 ? (
        <div className="grid gap-4">
          {vehiculos.map((vehiculo) => (
            <Link key={vehiculo.id} href={`/dashboard/vehiculo/${vehiculo.id}`}>
              <Card className="card-premium-hover cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-primary-600/20 border border-accent/20 flex items-center justify-center flex-shrink-0">
                      <Car className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <PatentePlate patente={vehiculo.patente} size="sm" />
                      </div>
                      <p className="text-slate-300 truncate mt-1">
                        {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})
                      </p>
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <Gauge className="h-3 w-3" />
                        {vehiculo.kilometraje_actual?.toLocaleString('es-AR')} km
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <TrustScoreBadge score={vehiculo.trust_score} size="sm" showLabel={false} />
                      <ChevronRight className="h-5 w-5 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-surface-light flex items-center justify-center mb-4">
              <Car className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Empezá agregando tu vehículo</h3>
            <p className="text-slate-400 mb-6">Cargá la patente, marca y modelo. Después vas a poder registrar services, reparaciones y generar un historial verificable.</p>
            <Link href="/dashboard/vehiculo/nuevo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Vehículo
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

async function TallerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let clientVehicles: Array<{ id: string; patente: string; marca: string; modelo: string; anio: number; kilometraje_actual: number }> = []
  let vehiculoIds: string[] = []

  try {
    const { data: links } = await supabase
      .from('vehiculo_taller')
      .select('vehiculo_id')
      .eq('taller_id', user.id)

    vehiculoIds = (links || []).map(l => l.vehiculo_id)
    if (vehiculoIds.length > 0) {
      const { data } = await supabase.from('vehiculos').select('*').in('id', vehiculoIds).order('patente')
      clientVehicles = (data || []) as typeof clientVehicles
    }
  } catch {
    clientVehicles = []
  }

  // Metricas: pendientes de aprobacion
  let pendientesAprobacion = 0
  if (vehiculoIds.length > 0) {
    const { count } = await supabase
      .from('eventos')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pendiente_aprobacion')
      .eq('created_by', user.id)
      .in('vehiculo_id', vehiculoIds)
    pendientesAprobacion = count || 0
  }

  // Metricas: proximas revisiones (30 dias) — por fecha o por km
  let proximasRevisiones = 0
  if (vehiculoIds.length > 0) {
    const now = new Date()
    const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const { count } = await supabase
      .from('eventos')
      .select('*', { count: 'exact', head: true })
      .in('vehiculo_id', vehiculoIds)
      .or('proxima_revision_at.not.is.null,proxima_revision_km.not.is.null')
      .gte('proxima_revision_at', now.toISOString())
      .lte('proxima_revision_at', in30days.toISOString())
    // Nota: el count por fecha es aproximado — los de km se cuentan en el detalle
    proximasRevisiones = count || 0
  }

  // Proximas revisiones detalladas (por fecha y/o km)
  let proximasRevisionesDetalle: ProximaRevision[] = []
  if (vehiculoIds.length > 0) {
    const now = new Date()
    const pastLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const in90days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    // Fetch eventos con proxima_revision_at O proxima_revision_km
    const { data: revData } = await supabase
      .from('eventos')
      .select('id, vehiculo_id, tipo, proxima_revision_at, proxima_revision_km')
      .in('vehiculo_id', vehiculoIds)
      .or('proxima_revision_at.not.is.null,proxima_revision_km.not.is.null')
      .order('proxima_revision_at', { ascending: true, nullsFirst: false })
      .limit(30)

    if (revData) {
      const { data: contactLinks } = await supabase
        .from('vehiculo_taller')
        .select('vehiculo_id, contact_name')
        .eq('taller_id', user.id)
        .in('vehiculo_id', vehiculoIds)

      const contactMap = new Map((contactLinks || []).map(c => [c.vehiculo_id, c.contact_name]))
      const patenteMap = new Map(clientVehicles.map(v => [v.id, v.patente]))

      // Para estimación de km, necesitamos el historial de km por vehículo
      const vehiculosConKmTarget = [...new Set(
        revData.filter(e => e.proxima_revision_km).map(e => e.vehiculo_id)
      )]

      // Fetch historial de km para los vehículos que tienen target de km
      const kmHistorialMap = new Map<string, Array<{ fecha_evento: string; kilometraje: number }>>()
      if (vehiculosConKmTarget.length > 0) {
        const { data: kmData } = await supabase
          .from('eventos')
          .select('vehiculo_id, fecha_evento, kilometraje')
          .in('vehiculo_id', vehiculosConKmTarget)
          .not('kilometraje', 'is', null)
          .gt('kilometraje', 0)
          .order('fecha_evento', { ascending: true })

        if (kmData) {
          for (const e of kmData) {
            const arr = kmHistorialMap.get(e.vehiculo_id) || []
            arr.push({ fecha_evento: e.fecha_evento, kilometraje: e.kilometraje! })
            kmHistorialMap.set(e.vehiculo_id, arr)
          }
        }
      }

      const revisions: ProximaRevision[] = revData
        .map(e => {
          let kmFechaEstimada: string | null = null
          let kmConfianza: 'baja' | 'media' | 'alta' | null = null

          if (e.proxima_revision_km) {
            const historial = kmHistorialMap.get(e.vehiculo_id)
            if (historial) {
              const estimacion = estimarFechaParaKm(historial, e.proxima_revision_km)
              if (estimacion) {
                kmFechaEstimada = estimacion.fechaEstimada.toISOString().split('T')[0]
                kmConfianza = estimacion.confianza
              }
            }
          }

          // Filtrar: solo mostrar si la fecha (real o estimada) está en el rango
          const fechaEfectiva = e.proxima_revision_at || kmFechaEstimada
          if (fechaEfectiva) {
            const diasRestantes = Math.ceil(
              (new Date(fechaEfectiva).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
            if (diasRestantes < -30 || diasRestantes > 90) return null
          } else if (!e.proxima_revision_km) {
            return null
          }

          return {
            eventoId: e.id,
            vehiculoId: e.vehiculo_id,
            patente: patenteMap.get(e.vehiculo_id) || '---',
            contactName: contactMap.get(e.vehiculo_id) || null,
            tipo: e.tipo,
            proximaRevisionAt: e.proxima_revision_at,
            proximaRevisionKm: e.proxima_revision_km,
            kmFechaEstimada,
            kmConfianza,
          }
        })
        .filter((r): r is ProximaRevision => r !== null)

      proximasRevisionesDetalle = revisions.slice(0, 20)
    }
  }

  // Actividad reciente: ultimos 5 eventos con patente
  let recentEvents: RecentEvent[] = []
  if (vehiculoIds.length > 0) {
    const { data: eventos } = await supabase
      .from('eventos')
      .select('id, vehiculo_id, tipo, titulo, fecha_evento, approval_status, costo')
      .eq('created_by', user.id)
      .in('vehiculo_id', vehiculoIds)
      .order('created_at', { ascending: false })
      .limit(5)

    if (eventos) {
      const patenteMap = new Map(clientVehicles.map(v => [v.id, v.patente]))
      recentEvents = eventos.map(e => ({
        ...e,
        patente: patenteMap.get(e.vehiculo_id) || '---',
      })) as RecentEvent[]
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wrench className="h-7 w-7 text-accent" />
          Panel del Taller
        </h1>
      </div>

      <TallerDashboardStats
        totalVehiculos={clientVehicles.length}
        pendientesAprobacion={pendientesAprobacion}
        proximasRevisiones={proximasRevisiones}
      />

      {/* Acciones rapidas */}
      <div className="flex gap-3">
        <Link href="/dashboard/taller/vehiculo/nuevo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar vehículo
          </Button>
        </Link>
        <Link href="/dashboard/taller/clientes">
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Ver clientes
          </Button>
        </Link>
      </div>

      {/* Próximas revisiones */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Car className="h-5 w-5 text-accent" />
          Próximas Revisiones
        </h2>
        <TallerProximasRevisiones revisiones={proximasRevisionesDetalle} />
      </div>

      {/* Listado de vehiculos */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Todos los Vehículos</h2>
        <TallerVehiculosList vehiculos={clientVehicles} />
      </div>

      {/* Actividad reciente — minimalista al fondo */}
      {recentEvents.length > 0 && (
        <div className="pt-4 border-t border-slate-800/50">
          <h3 className="text-sm font-medium text-slate-500 mb-2">Últimos trabajos</h3>
          <TallerRecentActivity eventos={recentEvents} />
        </div>
      )}
    </div>
  )
}

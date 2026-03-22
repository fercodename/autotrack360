import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Car, Calendar, Gauge, CheckCircle, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, PatentePlate } from '@/components/ui'
import { TrustScoreBadge } from '@/components/scoring/trust-score-badge'
import { ReporteEventosConEvidencias } from './reporte-eventos-con-evidencias'

// Evitar caché: el reporte debe cargar siempre datos frescos (eventos + evidencias)
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

export default async function ReportePublicoPage({ params }: Props) {
  noStore()
  const { token } = await params
  const supabase = await createClient()

  // Buscar el reporte por token
  const { data: reporte, error: reporteError } = await supabase
    .from('reportes_qr')
    .select('*')
    .eq('token', token)
    .eq('is_revoked', false)
    .single()

  if (reporteError || !reporte) {
    notFound()
  }

  // Verificar si expiró
  const isExpired = new Date(reporte.expires_at) < new Date()
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Reporte Expirado
            </h1>
            <p className="text-gray-600">
              Este link ya no es válido. Pedile al propietario que genere uno nuevo.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Incrementar contador de vistas
  await supabase
    .from('reportes_qr')
    .update({ 
      view_count: reporte.view_count + 1,
      last_viewed_at: new Date().toISOString()
    })
    .eq('id', reporte.id)

  // Obtener vehículo
  const { data: vehiculo } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('id', reporte.vehiculo_id)
    .single()

  if (!vehiculo) {
    notFound()
  }

  // Obtener eventos del vehículo (primero sin evidencias por si RLS de evidencias falla en anon)
  const { data: eventosRaw, error: eventosError } = await supabase
    .from('eventos')
    .select('*')
    .eq('vehiculo_id', vehiculo.id)
    .order('fecha_evento', { ascending: false })

  if (eventosError) {
    console.error('[Reporte] Error al cargar eventos:', eventosError)
  }

  const eventosAprobados = (eventosRaw || []).filter(
    (e: { is_hidden?: boolean; approval_status?: string | null }) =>
      !e.is_hidden && (e.approval_status === 'aprobado' || e.approval_status == null)
  )
  const eventosOcultos = (eventosRaw || []).filter((e: { is_hidden?: boolean }) => e.is_hidden).length

  const eventos = eventosAprobados
  const totalEventos = eventos.length
  const nivelA = eventos.filter((e: { verification_level: string }) => e.verification_level === 'A').length
  const nivelB = eventos.filter((e: { verification_level: string }) => e.verification_level === 'B').length
  const nivelC = eventos.filter((e: { verification_level: string }) => e.verification_level === 'C').length

  const eventosParaCliente = eventos.map((e: { id: string; titulo: string; tipo: string; verification_level: string; fecha_evento: string; kilometraje: number | null; descripcion: string | null; costo: number | null }) => ({
    id: e.id,
    titulo: e.titulo,
    tipo: e.tipo,
    verification_level: e.verification_level,
    fecha_evento: e.fecha_evento,
    kilometraje: e.kilometraje,
    descripcion: e.descripcion,
    costo: e.costo,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Car className="h-7 w-7 text-primary-600" />
              <span className="text-lg font-bold text-gray-900">AutoTrack 360°</span>
            </Link>
            <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Reporte Verificado
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Vehicle Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Car className="h-8 w-8 text-primary-600" />
          </div>
          <div className="flex justify-center mb-2">
            <PatentePlate patente={vehiculo.patente} size="lg" className="border-gray-300 shadow-lg" />
          </div>
          <p className="text-xl text-gray-600">
            {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})
          </p>
        </div>

        {/* Trust Score Card */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <TrustScoreBadge score={vehiculo.trust_score} size="lg" />
              
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Distribución de Verificación
                </h2>
                <div className="flex gap-4 justify-center sm:justify-start">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-trust-high text-white rounded-full flex items-center justify-center mx-auto font-bold">
                      {nivelA}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Nivel A</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-trust-medium text-white rounded-full flex items-center justify-center mx-auto font-bold">
                      {nivelB}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Nivel B</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-trust-low text-white rounded-full flex items-center justify-center mx-auto font-bold">
                      {nivelC}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Nivel C</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información del Vehículo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Gauge className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Kilometraje</p>
                  <p className="font-semibold">{vehiculo.kilometraje_actual?.toLocaleString('es-AR')} km</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Año</p>
                  <p className="font-semibold">{vehiculo.anio}</p>
                </div>
              </div>
              {vehiculo.tipo_combustible && (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5" />
                  <div>
                    <p className="text-sm text-gray-500">Combustible</p>
                    <p className="font-semibold capitalize">{vehiculo.tipo_combustible}</p>
                  </div>
                </div>
              )}
              {vehiculo.color && (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5" />
                  <div>
                    <p className="text-sm text-gray-500">Color</p>
                    <p className="font-semibold capitalize">{vehiculo.color}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hidden Events Warning */}
        {eventosOcultos > 0 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm mb-6">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {eventosOcultos} evento{eventosOcultos !== 1 ? 's' : ''} oculto{eventosOcultos !== 1 ? 's' : ''} por el propietario
          </div>
        )}

        {/* Events Timeline — evidencias se cargan en el cliente vía /api/reporte/[token]/evidencias */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Historial de Eventos ({totalEventos})
        </h2>

        <ReporteEventosConEvidencias token={token} eventos={eventosParaCliente} />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Reporte generado por <span className="font-medium">AutoTrack 360°</span>
          </p>
          <p className="mt-1">
            Cuando existen, las evidencias de eventos nivel A y B son verificables con hash SHA-256
          </p>
        </div>
      </main>
    </div>
  )
}

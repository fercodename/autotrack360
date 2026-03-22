import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Car, Plus, Calendar, Gauge, Wrench, User } from 'lucide-react'
import { Button } from '@/components/ui'
import { Card, CardHeader, CardTitle, CardContent, PatentePlate } from '@/components/ui'
import { EventosListTaller } from '@/components/events/eventos-list-taller'
import { ContactoPropietarioForm } from '@/components/taller/contacto-propietario-form'
import { TallerNotasInternas } from '@/components/taller/taller-notas-internas'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TallerVehiculoDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  if (profile?.role !== 'taller') {
    notFound()
  }

  const { data: vehiculo, error } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !vehiculo) notFound()

  const { data: link } = await supabase
    .from('vehiculo_taller')
    .select('vehiculo_id, contact_name, contact_email, contact_phone, notas')
    .eq('vehiculo_id', id)
    .eq('taller_id', user!.id)
    .single()

  if (!link) notFound()

  // Si el vehículo tiene propietario en la plataforma, traer su perfil para prellenar contacto
  let ownerProfile: { full_name: string | null; phone: string | null } | null = null
  if (vehiculo.owner_id) {
    const { data: owner } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', vehiculo.owner_id)
      .single()
    ownerProfile = owner ?? null
  }

  const contactInitialData = {
    contact_name: link.contact_name ?? ownerProfile?.full_name ?? null,
    contact_email: link.contact_email ?? null,
    contact_phone: link.contact_phone ?? ownerProfile?.phone ?? null,
  }

  const { data: todosEventos } = await supabase
    .from('eventos')
    .select(`*, evidencias (*)`)
    .eq('vehiculo_id', id)
    .order('fecha_evento', { ascending: false })

  const misEventos = (todosEventos || []).filter(
    e => e.workshop_id === user!.id || e.created_by === user!.id
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard"
            className="mt-1 p-2 hover:bg-surface-light rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-400" />
          </Link>
          <div>
            <PatentePlate patente={vehiculo.patente} size="lg" />
            <p className="text-slate-400 mt-1">
              {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-accent" />
            Datos de contacto del propietario
          </CardTitle>
          <p className="text-sm text-slate-400 mt-1">
            Para recordatorios, alertas y contacto. Los datos se validan por formato (email, teléfono).
          </p>
        </CardHeader>
        <CardContent>
          {vehiculo.owner_id && ownerProfile && (
            <p className="text-sm text-slate-500 mb-4">
              Este vehículo tiene propietario en AutoTrack. Nombre y teléfono se completaron desde su perfil; podés editarlos y agregar el email si lo tenés.
            </p>
          )}
          <ContactoPropietarioForm
            vehiculoId={id}
            initialData={contactInitialData}
          />
        </CardContent>
      </Card>

      <TallerNotasInternas
        vehiculoId={id}
        tallerId={user!.id}
        notasIniciales={link.notas ?? null}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-accent" />
            Datos del vehículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center">
                <Gauge className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Kilometraje</p>
                <p className="font-semibold text-white">{vehiculo.kilometraje_actual?.toLocaleString('es-AR')} km</p>
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
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Wrench className="h-5 w-5 text-accent" />
          Trabajos que hiciste en este vehículo
        </h2>
        <Link href={`/dashboard/taller/vehiculo/${id}/evento/nuevo`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar servicio
          </Button>
        </Link>
      </div>

      <EventosListTaller eventos={misEventos} vehiculoId={id} />
    </div>
  )
}

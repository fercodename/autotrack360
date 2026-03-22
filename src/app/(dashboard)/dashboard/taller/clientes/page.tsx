import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, ArrowLeft } from 'lucide-react'
import { TallerClientesList, type ClienteGroup } from '@/components/taller/taller-clientes-list'

export default async function TallerClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch vehiculo_taller links con contacto
  const { data: links } = await supabase
    .from('vehiculo_taller')
    .select('vehiculo_id, contact_name, contact_email, contact_phone')
    .eq('taller_id', user.id)

  if (!links || links.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <TallerClientesList clientes={[]} />
      </div>
    )
  }

  const vehiculoIds = links.map(l => l.vehiculo_id)

  // Fetch vehiculos
  const { data: vehiculos } = await supabase
    .from('vehiculos')
    .select('id, patente, marca, modelo, anio')
    .in('id', vehiculoIds)

  // Fetch ultimo evento por vehiculo
  const { data: lastEvents } = await supabase
    .from('eventos')
    .select('vehiculo_id, fecha_evento')
    .in('vehiculo_id', vehiculoIds)
    .eq('is_hidden', false)
    .order('fecha_evento', { ascending: false })

  // Map: vehiculo_id -> ultima fecha
  const lastDateMap = new Map<string, string>()
  for (const ev of lastEvents || []) {
    if (!lastDateMap.has(ev.vehiculo_id)) {
      lastDateMap.set(ev.vehiculo_id, ev.fecha_evento)
    }
  }

  // Map: vehiculo_id -> vehiculo data
  const vehiculoMap = new Map(
    (vehiculos || []).map(v => [v.id, v])
  )

  // Agrupar por contact_name (case-insensitive)
  const groupMap = new Map<string, ClienteGroup>()

  for (const link of links) {
    const name = (link.contact_name || '').trim()
    const key = name.toLowerCase() || '__sin_contacto__'
    const displayName = name || 'Sin contacto asignado'

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        name: displayName,
        phone: link.contact_phone,
        email: link.contact_email,
        vehiculos: [],
      })
    }

    const v = vehiculoMap.get(link.vehiculo_id)
    if (v) {
      groupMap.get(key)!.vehiculos.push({
        id: v.id,
        patente: v.patente,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        lastServiceDate: lastDateMap.get(v.id) ?? null,
      })
    }
  }

  // Ordenar: con nombre primero, sin contacto al final
  const clientes = Array.from(groupMap.values()).sort((a, b) => {
    if (a.name === 'Sin contacto asignado') return 1
    if (b.name === 'Sin contacto asignado') return -1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="space-y-6">
      <Header />
      <p className="text-slate-400">
        {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}
      </p>
      <TallerClientesList clientes={clientes} />
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-center gap-4">
      <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Users className="h-7 w-7 text-accent" />
        Mis Clientes
      </h1>
    </div>
  )
}

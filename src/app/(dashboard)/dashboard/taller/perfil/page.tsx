import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Building2 } from 'lucide-react'
import { TallerPerfilForm } from '@/components/taller/taller-perfil-form'

export default async function TallerPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, cuit, address, telefono_comercial, email_comercial, especialidades, horario')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/dashboard')

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building2 className="h-7 w-7 text-accent" />
          Perfil del Taller
        </h1>
        <p className="text-slate-400 mt-1">
          Estos datos se muestran en los reportes públicos para generar confianza.
        </p>
      </div>

      <TallerPerfilForm
        initialData={{
          business_name: profile.business_name,
          cuit: profile.cuit,
          address: profile.address,
          telefono_comercial: profile.telefono_comercial ?? null,
          email_comercial: profile.email_comercial ?? null,
          especialidades: profile.especialidades ?? [],
          horario: profile.horario ?? null,
        }}
      />
    </div>
  )
}

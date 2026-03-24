import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UserCircle, Mail, KeyRound, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

export default async function PropietarioPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: { full_name: string | null; role: string; phone: string | null } | null }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserCircle className="h-7 w-7 text-accent" />
          Mi Perfil
        </h1>
      </div>

      <Card className="card-premium">
        <CardContent className="py-6 space-y-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Nombre</p>
            <p className="text-white font-medium">{profile?.full_name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Email</p>
            <p className="text-white font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              {user.email}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Rol</p>
            <p className="text-white font-medium capitalize">{profile?.role || 'propietario'}</p>
          </div>
        </CardContent>
      </Card>

      <Link
        href="/dashboard/cambiar-password"
        className="flex items-center gap-3 p-4 rounded-xl bg-surface-light/30 border border-slate-700 hover:border-accent/30 transition-colors"
      >
        <KeyRound className="h-5 w-5 text-accent" />
        <span className="text-white font-medium">Cambiar contraseña</span>
      </Link>
    </div>
  )
}

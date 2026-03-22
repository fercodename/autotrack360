import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Gauge, Home, Plus, Settings, KeyRound, Building2, UserCircle } from 'lucide-react'
import { LogoutButton } from '@/components/layout/logout-button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          role: user.user_metadata?.role || 'propietario',
        } as Record<string, unknown>,
        { onConflict: 'id' }
      )
      .select()
      .single()
    profile = newProfile
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm bg-surface-dark/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-primary-600 flex items-center justify-center shadow-lg shadow-accent/20">
              <Gauge className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white hidden sm:block">AutoTrack <span className="text-accent">360°</span></span>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:block">
              {profile?.full_name || user.email}
            </span>
            <span className="text-xs px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full capitalize font-medium">
              {profile?.role || 'propietario'}
            </span>
            <Link
              href={profile?.role === 'taller' ? '/dashboard/taller/perfil' : '/dashboard/perfil'}
              className="text-slate-400 hover:text-accent transition-colors hidden sm:block"
              title={profile?.role === 'taller' ? 'Perfil del taller' : 'Mi perfil'}
            >
              {profile?.role === 'taller' ? <Building2 className="h-4 w-4" /> : <UserCircle className="h-4 w-4" />}
            </Link>
            <Link
              href="/dashboard/cambiar-password"
              className="text-slate-400 hover:text-accent transition-colors"
              title="Cambiar contraseña"
            >
              <KeyRound className="h-4 w-4" />
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface-dark/95 backdrop-blur-sm border-t border-slate-800 sm:hidden z-50">
        <div className="flex items-center justify-around py-2">
          <Link 
            href="/dashboard" 
            className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-accent transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Inicio</span>
          </Link>
          <Link 
            href={profile?.role === 'taller' ? '/dashboard/taller/vehiculo/nuevo' : '/dashboard/vehiculo/nuevo'}
            className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-accent transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs">Agregar</span>
          </Link>
          <Link
            href={profile?.role === 'taller' ? '/dashboard/taller/perfil' : '/dashboard/perfil'}
            className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-accent transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs">Perfil</span>
          </Link>
        </div>
      </nav>

      {/* Spacer for mobile nav */}
      <div className="h-16 sm:hidden" />
    </div>
  )
}

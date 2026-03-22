import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { KeyRound, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { CambiarPasswordForm } from '@/components/auth/cambiar-password-form'

export default async function CambiarPasswordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <KeyRound className="h-7 w-7 text-accent" />
          Cambiar Contraseña
        </h1>
      </div>

      <Card className="card-premium">
        <CardContent className="py-6">
          <CambiarPasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}

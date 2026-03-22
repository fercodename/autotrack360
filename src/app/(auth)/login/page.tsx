'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, PasswordInput } from '@/components/ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('Email o contraseña incorrectos. Verificá los datos e intentá de nuevo.')
        } else if (error.message === 'Email not confirmed') {
          setError('Tu email todavía no fue confirmado. Revisá tu bandeja de entrada (y spam).')
        } else {
          setError(error.message)
        }
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Ocurrió un error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-primary-600/20 border border-accent/20 flex items-center justify-center mb-4">
          <LogIn className="h-7 w-7 text-accent" />
        </div>
        <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
        <CardDescription>
          Ingresá a tu cuenta de AutoTrack 360°
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12"
              required
              autoComplete="email"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <PasswordInput
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12"
              required
              autoComplete="current-password"
              minLength={6}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Ingresar
          </Button>

          <Link href="/recuperar-password" className="text-sm text-slate-400 hover:text-accent text-center transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>

          <p className="text-sm text-slate-400 text-center">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="text-accent hover:underline font-medium">
              Registrate como propietario
            </Link>
          </p>
          <p className="text-sm text-slate-500 text-center">
            ¿Sos taller?{' '}
            <Link href="/talleres/registro" className="text-accent hover:underline font-medium">
              Registrate acá
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

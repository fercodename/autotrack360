'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Mail, Lock, User, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, PasswordInput, AlertBanner } from '@/components/ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'
import { validatePasswordPair } from '@/lib/utils/validators'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const validationError = validatePasswordPair(password, confirmPassword)
    if (validationError) {
      setError(validationError)
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'propietario',
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Este email ya está registrado')
        } else {
          setError(signUpError.message)
        }
        return
      }

      if (data.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: profileError } = await (supabase.from('profiles') as any).upsert(
          {
            id: data.user.id,
            full_name: fullName,
            role: 'propietario',
          },
          { onConflict: 'id' }
        )

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }
      }

      setSuccess(true)

      if (data.session) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Ocurrió un error al registrarse')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            ¡Registro exitoso!
          </h2>
          <p className="text-slate-400 mb-2">
            Te enviamos un email de confirmación. Revisá tu bandeja de entrada (y la carpeta de spam).
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Hasta que no confirmes tu email, no vas a poder iniciar sesión.
          </p>
          <Link href="/login">
            <Button variant="outline">
              Ir a Iniciar Sesión
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-primary-600/20 border border-accent/20 flex items-center justify-center mb-4">
          <UserPlus className="h-7 w-7 text-accent" />
        </div>
        <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
        <CardDescription>
          Armá el historial de tu vehículo y vendé con más confianza.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleRegister}>
        <CardContent className="space-y-4">
          {error && <AlertBanner variant="error">{error}</AlertBanner>}

          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              type="text"
              placeholder="Nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-12"
              required
              autoComplete="name"
            />
          </div>

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
              placeholder="Contraseña (mín. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12"
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <PasswordInput
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-12"
              required
              autoComplete="new-password"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Crear Cuenta
          </Button>

          <p className="text-sm text-slate-400 text-center">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-accent hover:underline font-medium">
              Iniciá sesión
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

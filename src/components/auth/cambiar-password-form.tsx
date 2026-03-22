'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, PasswordInput, AlertBanner } from '@/components/ui'
import { validatePasswordPair } from '@/lib/utils/validators'

export function CambiarPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const validationError = validatePasswordPair(password, confirmPassword)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      setPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(false), 5000)
    } catch {
      setError('Ocurrió un error al cambiar la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <AlertBanner variant="error">{error}</AlertBanner>}
      {success && <AlertBanner variant="success">Contraseña actualizada correctamente.</AlertBanner>}

      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <PasswordInput
          placeholder="Nueva contraseña (mín. 6 caracteres)"
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
          placeholder="Confirmar nueva contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="pl-12"
          required
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Cambiar contraseña
      </Button>
    </form>
  )
}

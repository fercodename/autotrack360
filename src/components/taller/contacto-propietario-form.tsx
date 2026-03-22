'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Phone, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'
import { contactoSchema, type ContactoFormData } from '@/lib/utils/validators'

interface ContactoPropietarioFormProps {
  vehiculoId: string
  initialData: {
    contact_name: string | null
    contact_email: string | null
    contact_phone: string | null
  }
  onSaved?: () => void
}

export function ContactoPropietarioForm({ vehiculoId, initialData, onSaved }: ContactoPropietarioFormProps) {
  const [contact_name, setContactName] = useState(initialData.contact_name ?? '')
  const [contact_email, setContactEmail] = useState(initialData.contact_email ?? '')
  const [contact_phone, setContactPhone] = useState(initialData.contact_phone ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setContactName(initialData.contact_name ?? '')
    setContactEmail(initialData.contact_email ?? '')
    setContactPhone(initialData.contact_phone ?? '')
  }, [initialData.contact_name, initialData.contact_email, initialData.contact_phone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const raw: ContactoFormData = {
      contact_name: contact_name.trim() || undefined,
      contact_email: contact_email.trim() || undefined,
      contact_phone: contact_phone.trim() || undefined,
    }
    const parsed = contactoSchema.safeParse({
      contact_name: raw.contact_name ?? '',
      contact_email: raw.contact_email ?? '',
      contact_phone: raw.contact_phone ?? '',
    })
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors
      const msg = first.contact_email?.[0] ?? first.contact_phone?.[0] ?? first.contact_name?.[0] ?? 'Revisá los datos'
      setError(msg)
      return
    }
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Debés iniciar sesión')
        return
      }
      const { error: updateError } = await supabase
        .from('vehiculo_taller')
        .update({
          contact_name: (parsed.data.contact_name?.trim() || null) as string | null,
          contact_email: (parsed.data.contact_email?.trim() || null) as string | null,
          contact_phone: (parsed.data.contact_phone?.trim() || null) as string | null,
        })
        .eq('vehiculo_id', vehiculoId)
        .eq('taller_id', user.id)
      if (updateError) {
        setError(updateError.message)
        return
      }
      setSuccess(true)
      onSaved?.()
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Error al guardar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
          Datos de contacto guardados.
        </div>
      )}
      <div className="relative">
        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <Input
          type="text"
          placeholder="Nombre del propietario o contacto"
          value={contact_name}
          onChange={(e) => setContactName(e.target.value)}
          className="pl-12"
          maxLength={200}
        />
      </div>
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <Input
          type="email"
          placeholder="email@ejemplo.com"
          value={contact_email}
          onChange={(e) => setContactEmail(e.target.value)}
          className="pl-12"
          maxLength={255}
        />
      </div>
      <div className="relative">
        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <Input
          type="tel"
          placeholder="Ej: +54 11 1234-5678 o 11 12345678"
          value={contact_phone}
          onChange={(e) => setContactPhone(e.target.value)}
          className="pl-12"
          maxLength={30}
        />
      </div>
      <p className="text-xs text-slate-500">
        Email y teléfono se validan por formato. Se usan para recordatorios y contacto.
      </p>
      <Button type="submit" isLoading={isLoading}>
        Guardar datos de contacto
      </Button>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Mail, Phone, MapPin, Clock, AlertCircle, Hash } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'
import { Card, CardContent } from '@/components/ui'
import { tallerPerfilSchema, type TallerPerfilFormData } from '@/lib/utils/validators'
import { TALLER_ESPECIALIDADES } from '@/constants'

interface TallerPerfilFormProps {
  initialData: {
    business_name: string | null
    cuit: string | null
    address: string | null
    telefono_comercial: string | null
    email_comercial: string | null
    especialidades: string[]
    horario: string | null
  }
}

export function TallerPerfilForm({ initialData }: TallerPerfilFormProps) {
  const router = useRouter()
  const [businessName, setBusinessName] = useState(initialData.business_name ?? '')
  const [cuit, setCuit] = useState(initialData.cuit ?? '')
  const [address, setAddress] = useState(initialData.address ?? '')
  const [telefonoComercial, setTelefonoComercial] = useState(initialData.telefono_comercial ?? '')
  const [emailComercial, setEmailComercial] = useState(initialData.email_comercial ?? '')
  const [especialidades, setEspecialidades] = useState<string[]>(initialData.especialidades ?? [])
  const [horario, setHorario] = useState(initialData.horario ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const toggleEspecialidad = (esp: string) => {
    setEspecialidades(prev =>
      prev.includes(esp) ? prev.filter(e => e !== esp) : [...prev, esp]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const raw: TallerPerfilFormData = {
      business_name: businessName.trim(),
      cuit: cuit.trim() || '',
      address: address.trim() || '',
      telefono_comercial: telefonoComercial.trim() || '',
      email_comercial: emailComercial.trim() || '',
      especialidades,
      horario: horario.trim() || '',
    }

    const parsed = tallerPerfilSchema.safeParse(raw)
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors
      const msg = fields.business_name?.[0] ?? fields.cuit?.[0] ?? fields.email_comercial?.[0] ?? fields.telefono_comercial?.[0] ?? 'Revisá los datos'
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
        .from('profiles')
        .update({
          business_name: parsed.data.business_name || null,
          cuit: parsed.data.cuit || null,
          address: parsed.data.address || null,
          telefono_comercial: parsed.data.telefono_comercial || null,
          email_comercial: parsed.data.email_comercial || null,
          especialidades: parsed.data.especialidades,
          horario: parsed.data.horario || null,
        })
        .eq('id', user.id)

      if (updateError) {
        setError(updateError.message)
        return
      }
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    } catch {
      setError('Error al guardar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
          Perfil guardado correctamente.
        </div>
      )}

      <Card className="card-premium">
        <CardContent className="py-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Datos del negocio</h3>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              type="text"
              placeholder="Nombre comercial *"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="pl-12"
              maxLength={200}
            />
          </div>
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              type="text"
              placeholder="CUIT (ej: 20-12345678-9)"
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              className="pl-12"
              maxLength={13}
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              type="text"
              placeholder="Dirección"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="pl-12"
              maxLength={300}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="card-premium">
        <CardContent className="py-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Contacto</h3>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              type="tel"
              placeholder="Teléfono del taller"
              value={telefonoComercial}
              onChange={(e) => setTelefonoComercial(e.target.value)}
              className="pl-12"
              maxLength={30}
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              type="email"
              placeholder="Email del taller"
              value={emailComercial}
              onChange={(e) => setEmailComercial(e.target.value)}
              className="pl-12"
              maxLength={255}
            />
          </div>
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              type="text"
              placeholder="Horario de atención (ej: Lun-Vie 8-18, Sab 8-13)"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className="pl-12"
              maxLength={200}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="card-premium">
        <CardContent className="py-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Especialidades</h3>
          <div className="flex flex-wrap gap-2">
            {TALLER_ESPECIALIDADES.map((esp) => {
              const selected = especialidades.includes(esp)
              return (
                <button
                  key={esp}
                  type="button"
                  onClick={() => toggleEspecialidad(esp)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selected
                      ? 'bg-accent/20 border-accent/40 text-accent'
                      : 'bg-surface-light border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {esp}
                </button>
              )
            })}
          </div>
          {especialidades.length > 0 && (
            <p className="text-xs text-slate-500">
              {especialidades.length} especialidad{especialidades.length !== 1 ? 'es' : ''} seleccionada{especialidades.length !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      <Button type="submit" isLoading={isLoading} className="w-full">
        Guardar perfil
      </Button>
    </form>
  )
}

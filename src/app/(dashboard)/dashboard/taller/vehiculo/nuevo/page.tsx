'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Car, Search, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { MarcaModeloSelect } from '@/components/vehiculos/marca-modelo-select'
import { formatPatente, patenteSearchVariants, contactoSchema } from '@/lib/utils/validators'

export default function TallerVehiculoNuevoPage() {
  const router = useRouter()
  const [step, setStep] = useState<'search' | 'form'>('search')
  const [patente, setPatente] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    patente: '',
    marca: '',
    modelo: '',
    marca_id: null as number | null,
    modelo_id: null as number | null,
    anio: new Date().getFullYear(),
    vin: '',
    color: '',
    tipo_combustible: '',
    kilometraje_actual: 0,
  })
  const [contacto, setContacto] = useState({ contact_name: '', contact_email: '', contact_phone: '' })

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
      const normalized = patente.replace(/\s/g, '').toUpperCase()
      if (!normalized) return
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Debés iniciar sesión')
          return
        }

        const variants = patenteSearchVariants(normalized)
        const { data: vehiculo } = await supabase
          .from('vehiculos')
          .select('id, patente, marca, modelo, anio')
          .in('patente', variants)
          .maybeSingle()

      if (vehiculo) {
        const { error: linkError } = await supabase
          .from('vehiculo_taller')
          .upsert({ vehiculo_id: vehiculo.id, taller_id: user.id }, { onConflict: 'vehiculo_id,taller_id' })
        if (linkError) {
          if (linkError.code === '23505') {
            router.push(`/dashboard/taller/vehiculo/${vehiculo.id}`)
            return
          }
          setError(linkError.message)
          return
        }
        router.push(`/dashboard/taller/vehiculo/${vehiculo.id}`)
        return
      }

      setFormData(prev => ({ ...prev, patente: formatPatente(normalized) }))
      setStep('form')
    } catch (err) {
      setError('Error al buscar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const contactParsed = contactoSchema.safeParse({
      contact_name: contacto.contact_name.trim() || '',
      contact_email: contacto.contact_email.trim() || '',
      contact_phone: contacto.contact_phone.trim() || '',
    })
    if (!contactParsed.success && (contacto.contact_name || contacto.contact_email || contacto.contact_phone)) {
      const first = contactParsed.error.flatten().fieldErrors
      setError(first.contact_email?.[0] ?? first.contact_phone?.[0] ?? first.contact_name?.[0] ?? 'Revisá los datos de contacto')
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

      const { data: vehiculo, error: insertError } = await supabase
        .from('vehiculos')
        .insert({
          owner_id: null,
          patente: formData.patente.replace(/\s/g, '').toUpperCase(),
          marca: formData.marca,
          modelo: formData.modelo,
          marca_id: formData.marca_id,
          modelo_id: formData.modelo_id,
          anio: formData.anio,
          vin: formData.vin || null,
          color: formData.color || null,
          tipo_combustible: formData.tipo_combustible || null,
          kilometraje_actual: formData.kilometraje_actual,
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.code === '23505') setError('Ya existe un vehículo con esa patente')
        else setError(insertError.message)
        return
      }

      const contactPayload = contactParsed.success
        ? {
            contact_name: contactParsed.data.contact_name?.trim() || null,
            contact_email: contactParsed.data.contact_email?.trim() || null,
            contact_phone: contactParsed.data.contact_phone?.trim() || null,
          }
        : { contact_name: null, contact_email: null, contact_phone: null }
      await supabase.from('vehiculo_taller').insert({
        vehiculo_id: vehiculo.id,
        taller_id: user.id,
        ...contactPayload,
      })
      router.push(`/dashboard/taller/vehiculo/${vehiculo.id}`)
      router.refresh()
    } catch (err) {
      setError('Error al guardar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'patente') setFormData(prev => ({ ...prev, patente: formatPatente(value) }))
    else if (name === 'anio' || name === 'kilometraje_actual') setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
    else setFormData(prev => ({ ...prev, [name]: value }))
  }
  const handleContactoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setContacto(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
              <Car className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle>Agregar vehículo cliente</CardTitle>
              <p className="text-sm text-slate-400">
                Buscá por patente o cargá uno nuevo si no está en el sistema.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 'search' ? (
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Patente</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={patente}
                    onChange={(e) => setPatente(formatPatente(e.target.value))}
                    placeholder="ABC 123 o AB 123 CD"
                    className="flex-1 px-4 py-2.5 bg-surface-light/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 uppercase font-mono"
                    maxLength={10}
                  />
                  <Button type="submit" isLoading={isLoading}>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Si el vehículo ya existe en AutoTrack, se vinculará a tu lista de clientes. Si no, podés crearlo.
              </p>
            </form>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <p className="text-sm text-slate-400">
                No se encontró esa patente. Completá los datos para dar de alta el vehículo.
              </p>
              <Input label="Patente *" name="patente" value={formData.patente} onChange={handleFormChange} required maxLength={10} className="uppercase font-mono" />
              <MarcaModeloSelect
                marca={formData.marca}
                marcaId={formData.marca_id}
                modelo={formData.modelo}
                modeloId={formData.modelo_id}
                onMarcaChange={(marca, marca_id) => setFormData(prev => ({ ...prev, marca, marca_id }))}
                onModeloChange={(modelo, modelo_id) => setFormData(prev => ({ ...prev, modelo, modelo_id }))}
              />
              <Input label="Año *" name="anio" type="number" value={formData.anio} onChange={handleFormChange} min={1900} max={new Date().getFullYear() + 1} required />
              <Input label="Kilometraje actual" name="kilometraje_actual" type="number" value={formData.kilometraje_actual} onChange={handleFormChange} min={0} />
              <div className="border-t border-slate-700 pt-4 mt-4">
                <p className="text-sm font-medium text-slate-300 mb-2">Datos de contacto del propietario (opcional)</p>
                <p className="text-xs text-slate-500 mb-3">Para recordatorios y contacto. Email y teléfono se validan por formato.</p>
                <div className="space-y-3">
                  <Input label="Nombre" name="contact_name" value={contacto.contact_name} onChange={handleContactoChange} placeholder="Nombre del propietario o contacto" maxLength={200} />
                  <Input label="Email" name="contact_email" type="email" value={contacto.contact_email} onChange={handleContactoChange} placeholder="email@ejemplo.com" maxLength={255} />
                  <Input label="Teléfono" name="contact_phone" type="tel" value={contacto.contact_phone} onChange={handleContactoChange} placeholder="Ej: +54 11 1234-5678" maxLength={30} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep('search')}>
                  Volver a buscar
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  Crear y agregar a mis clientes
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

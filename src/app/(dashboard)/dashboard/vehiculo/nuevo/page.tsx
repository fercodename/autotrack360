'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Car, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui'
import { MarcaModeloSelect } from '@/components/vehiculos/marca-modelo-select'
import { formatPatente } from '@/lib/utils/validators'

export default function NuevoVehiculoPage() {
  const router = useRouter()
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'patente') {
      setFormData(prev => ({ ...prev, patente: formatPatente(value) }))
    } else if (name === 'anio' || name === 'kilometraje_actual') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Debés iniciar sesión')
        return
      }

      const { data, error: insertError } = await supabase
        .from('vehiculos')
        .insert({
          owner_id: user.id,
          patente: formData.patente,
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
        if (insertError.code === '23505') {
          setError('Ya existe un vehículo con esta patente')
        } else {
          setError(insertError.message)
        }
        return
      }

      router.push(`/dashboard/vehiculo/${data.id}`)
      router.refresh()
    } catch (err) {
      setError('Ocurrió un error al guardar el vehículo')
    } finally {
      setIsLoading(false)
    }
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
            <CardTitle>Agregar Vehículo</CardTitle>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Patente *"
                name="patente"
                value={formData.patente}
                onChange={handleChange}
                placeholder="ABC123 o AB123CD"
                required
                maxLength={7}
                className="uppercase font-mono"
              />
              <Input
                label="Año *"
                name="anio"
                type="number"
                value={formData.anio}
                onChange={handleChange}
                min={1900}
                max={new Date().getFullYear() + 1}
                required
              />
            </div>

            <MarcaModeloSelect
              marca={formData.marca}
              marcaId={formData.marca_id}
              modelo={formData.modelo}
              modeloId={formData.modelo_id}
              onMarcaChange={(marca, marcaId) => setFormData(prev => ({ ...prev, marca, marca_id: marcaId }))}
              onModeloChange={(modelo, modeloId) => setFormData(prev => ({ ...prev, modelo, modelo_id: modeloId }))}
            />

            <Input
              label="Chasis Nro (opcional)"
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              placeholder="17 caracteres"
              maxLength={17}
              helperText="Número de chasis del vehículo"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Color (opcional)"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="Ej: Blanco"
              />
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Combustible
                </label>
                <select
                  name="tipo_combustible"
                  value={formData.tipo_combustible}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-light/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                >
                  <option value="" className="bg-slate-800 text-white">Seleccionar...</option>
                  <option value="nafta" className="bg-slate-800 text-white">Nafta</option>
                  <option value="diesel" className="bg-slate-800 text-white">Diesel</option>
                  <option value="gnc" className="bg-slate-800 text-white">GNC</option>
                  <option value="electrico" className="bg-slate-800 text-white">Eléctrico</option>
                  <option value="hibrido" className="bg-slate-800 text-white">Híbrido</option>
                </select>
              </div>
            </div>

            <Input
              label="Kilometraje actual"
              name="kilometraje_actual"
              type="number"
              value={formData.kilometraje_actual}
              onChange={handleChange}
              min={0}
              helperText="Kilómetros actuales del vehículo"
            />
          </CardContent>

          <CardFooter className="flex gap-3">
            <Link href="/dashboard" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              Guardar Vehículo
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

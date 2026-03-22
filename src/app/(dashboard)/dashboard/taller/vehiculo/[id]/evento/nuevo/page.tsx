'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, AlertCircle, AlertTriangle, StickyNote, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui'
import { FileUpload } from '@/components/evidence/file-upload'
import { EVENT_TYPES } from '@/constants'
import { EventType } from '@/types/database'
import { updateVehicleTrustScore } from '@/lib/scoring-engine'
import { validateKilometraje } from '@/lib/utils/event-permissions'
import { FileWithHash } from '@/components/evidence/file-upload'

export default function TallerNuevoEventoPage() {
  const router = useRouter()
  const params = useParams()
  const vehiculoId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<FileWithHash[]>([])
  const [kmWarning, setKmWarning] = useState<string | null>(null)
  const [eventosExistentes, setEventosExistentes] = useState<{ fecha_evento: string; kilometraje: number | null }[]>([])

  const [formData, setFormData] = useState({
    tipo: 'service' as EventType,
    titulo: '',
    descripcion: '',
    fecha_evento: new Date().toISOString().split('T')[0],
    kilometraje: '',
    costo: '',
    proxima_revision_at: '',
    proxima_revision_km: '',
    notas_internas_taller: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('eventos')
      .select('fecha_evento, kilometraje')
      .eq('vehiculo_id', vehiculoId)
      .eq('is_hidden', false)
      .then(({ data }) => setEventosExistentes(data || []))
  }, [vehiculoId])

  useEffect(() => {
    if (formData.kilometraje && formData.fecha_evento) {
      const validation = validateKilometraje(
        parseInt(formData.kilometraje),
        formData.fecha_evento,
        eventosExistentes
      )
      setKmWarning(validation.warning)
    } else {
      setKmWarning(null)
    }
  }, [formData.kilometraje, formData.fecha_evento, eventosExistentes])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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

      const verificationLevel = files.length > 0 ? 'B' : 'C'

      const { data: evento, error: eventoError } = await supabase
        .from('eventos')
        .insert({
          vehiculo_id: vehiculoId,
          created_by: user.id,
          workshop_id: user.id,
          tipo: formData.tipo,
          titulo: formData.titulo,
          descripcion: formData.descripcion || null,
          fecha_evento: formData.fecha_evento,
          kilometraje: formData.kilometraje ? parseInt(formData.kilometraje) : null,
          costo: formData.costo ? parseFloat(formData.costo) : null,
          verification_level: verificationLevel,
          proxima_revision_at: formData.proxima_revision_at || null,
          proxima_revision_km: formData.proxima_revision_km ? parseInt(formData.proxima_revision_km) : null,
          notas_internas_taller: formData.notas_internas_taller.trim() || null,
        })
        .select()
        .single()

      if (eventoError) {
        setError(eventoError.message)
        return
      }

      if (files.length > 0 && evento) {
        for (const fileData of files) {
          const fileName = `${vehiculoId}/${evento.id}/${Date.now()}_${fileData.file.name}`
          const { error: uploadError } = await supabase.storage.from('evidencias').upload(fileName, fileData.file)
          if (uploadError) continue
          await supabase.from('evidencias').insert({
            evento_id: evento.id,
            uploaded_by: user.id,
            file_name: fileData.file.name,
            file_type: fileData.file.type,
            file_size: fileData.file.size,
            storage_path: fileName,
            hash_sha256: fileData.hash,
            timestamp_utc: new Date().toISOString(),
            tipo: fileData.tipo,
          })
        }
      }

      if (formData.kilometraje) {
        const nuevoKm = parseInt(formData.kilometraje)
        const { data: vehiculo } = await supabase.from('vehiculos').select('kilometraje_actual').eq('id', vehiculoId).single()
        if (vehiculo && nuevoKm > (vehiculo.kilometraje_actual || 0)) {
          await supabase.from('vehiculos').update({ kilometraje_actual: nuevoKm }).eq('id', vehiculoId)
        }
      }

      await updateVehicleTrustScore(supabase, vehiculoId)

      router.push(`/dashboard/taller/vehiculo/${vehiculoId}`)
      router.refresh()
    } catch (err) {
      setError('Ocurrió un error al guardar el evento')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/dashboard/taller/vehiculo/${vehiculoId}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al vehículo
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle>Agregar servicio</CardTitle>
              <p className="text-sm text-slate-400">
                Si el vehículo tiene dueño en la plataforma, quedará pendiente de su aprobación.
              </p>
            </div>
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

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Tipo de evento *</label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-surface-light/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              >
                {Object.entries(EVENT_TYPES).map(([key, { label }]) => (
                  <option key={key} value={key} className="bg-slate-800 text-white">{label}</option>
                ))}
              </select>
            </div>

            <Input label="Título *" name="titulo" value={formData.titulo} onChange={handleChange} placeholder="Ej: Service 10.000 km" required />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Detalles del servicio..."
                rows={3}
                className="w-full px-4 py-2.5 bg-surface-light/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Fecha *" name="fecha_evento" type="date" value={formData.fecha_evento} onChange={handleChange} required max={new Date().toISOString().split('T')[0]} />
              <Input label="Kilometraje" name="kilometraje" type="number" value={formData.kilometraje} onChange={handleChange} placeholder="Ej: 45000" min={0} />
            </div>

            {kmWarning && (
              <div className="flex items-start gap-2 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Posible inconsistencia de kilometraje</p>
                  <p className="text-yellow-300">{kmWarning}</p>
                </div>
              </div>
            )}

            <Input label="Costo (ARS)" name="costo" type="number" value={formData.costo} onChange={handleChange} placeholder="Ej: 15000" min={0} step="0.01" />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Próx. revisión - fecha"
                name="proxima_revision_at"
                type="date"
                value={formData.proxima_revision_at}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
              />
              <Input
                label="Próx. revisión - km"
                name="proxima_revision_km"
                type="number"
                value={formData.proxima_revision_km}
                onChange={handleChange}
                placeholder="Ej: 90000"
                min={0}
              />
            </div>
            <p className="text-xs text-slate-500 -mt-2">
              Opcionales. Podés poner fecha, km, o ambos. Si ponés km, el sistema estima cuándo se alcanzarían.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-amber-400" />
                Notas internas
                <span className="text-xs text-slate-500 flex items-center gap-1 font-normal">
                  <EyeOff className="h-3 w-3" />
                  Solo visible para el taller
                </span>
              </label>
              <textarea
                name="notas_internas_taller"
                value={formData.notas_internas_taller}
                onChange={handleChange}
                placeholder="Notas privadas sobre este trabajo..."
                rows={2}
                maxLength={2000}
                className="w-full px-4 py-2.5 bg-surface-light/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Evidencias (fotos, facturas, PDFs)</label>
              <FileUpload onFilesChange={setFiles} maxFiles={5} />
              <p className="mt-2 text-xs text-slate-400">
                {files.length > 0 ? `✓ ${files.length} archivo(s) con hash - Nivel B` : 'Sin archivos - Nivel C'}
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex gap-3">
            <Link href={`/dashboard/taller/vehiculo/${vehiculoId}`} className="flex-1">
              <Button type="button" variant="outline" className="w-full">Cancelar</Button>
            </Link>
            <Button type="submit" className="flex-1" isLoading={isLoading}>Guardar servicio</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, AlertCircle, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui'
import { canEditEvent, getEditTimeRemaining } from '@/lib/utils/event-permissions'
import { EVENT_TYPES } from '@/constants'

export default function EditarEventoPage() {
  const router = useRouter()
  const params = useParams()
  const vehiculoId = params.id as string
  const eventoId = params.eventoId as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [editMessage, setEditMessage] = useState('')
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    costo: '',
  })
  
  const [originalData, setOriginalData] = useState({
    tipo: '',
    fecha_evento: '',
    kilometraje: null as number | null,
    created_at: '',
  })

  useEffect(() => {
    loadEvento()
  }, [eventoId])

  const loadEvento = async () => {
    const supabase = createClient()
    const { data: evento, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', eventoId)
      .single()

    if (error || !evento) {
      setError('Evento no encontrado')
      setIsLoading(false)
      return
    }

    const editStatus = getEditTimeRemaining(evento.created_at)
    setCanEdit(editStatus.canEdit)
    setEditMessage(editStatus.message)

    setFormData({
      titulo: evento.titulo,
      descripcion: evento.descripcion || '',
      costo: evento.costo?.toString() || '',
    })

    setOriginalData({
      tipo: evento.tipo,
      fecha_evento: evento.fecha_evento,
      kilometraje: evento.kilometraje,
      created_at: evento.created_at,
    })

    setIsLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canEdit) {
      setError('El período de edición ha expirado')
      return
    }
    
    setError(null)
    setIsSaving(true)

    try {
      const supabase = createClient()
      
      const { error: updateError } = await supabase
        .from('eventos')
        .update({
          titulo: formData.titulo,
          descripcion: formData.descripcion || null,
          costo: formData.costo ? parseFloat(formData.costo) : null,
        })
        .eq('id', eventoId)

      if (updateError) {
        setError(updateError.message)
        return
      }

      router.push(`/dashboard/vehiculo/${vehiculoId}/evento/${eventoId}`)
      router.refresh()
    } catch (err) {
      setError('Ocurrió un error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            Cargando...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link 
          href={`/dashboard/vehiculo/${vehiculoId}/evento/${eventoId}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al evento
        </Link>

        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-surface-light rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-slate-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Edición no disponible
            </h2>
            <p className="text-slate-300">
              {editMessage}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Los eventos solo pueden editarse durante las primeras 48 horas.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const eventTypeLabel = EVENT_TYPES[originalData.tipo as keyof typeof EVENT_TYPES]?.label || originalData.tipo

  return (
    <div className="max-w-2xl mx-auto">
      <Link 
        href={`/dashboard/vehiculo/${vehiculoId}/evento/${eventoId}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al evento
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
              <Pencil className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle>Editar Evento</CardTitle>
              <p className="text-sm text-slate-400">{editMessage}</p>
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

            {/* Campos no editables */}
            <div className="p-4 bg-surface-light/50 rounded-lg space-y-2 border border-slate-700">
              <p className="text-xs text-slate-400 uppercase font-medium">Campos no editables</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Tipo:</span>
                  <p className="font-medium text-white">{eventTypeLabel}</p>
                </div>
                <div>
                  <span className="text-slate-400">Fecha:</span>
                  <p className="font-medium text-white">{originalData.fecha_evento}</p>
                </div>
                <div>
                  <span className="text-slate-400">Kilometraje:</span>
                  <p className="font-medium text-white">
                    {originalData.kilometraje?.toLocaleString('es-AR') || '-'} km
                  </p>
                </div>
              </div>
            </div>

            {/* Campos editables */}
            <Input
              label="Título"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 bg-surface-light/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              />
            </div>

            <Input
              label="Costo (ARS)"
              name="costo"
              type="number"
              value={formData.costo}
              onChange={handleChange}
              min={0}
              step="0.01"
            />
          </CardContent>

          <CardFooter className="flex gap-3">
            <Link href={`/dashboard/vehiculo/${vehiculoId}/evento/${eventoId}`} className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" className="flex-1" isLoading={isSaving}>
              Guardar Cambios
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

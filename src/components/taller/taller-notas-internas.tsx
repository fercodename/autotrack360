'use client'

import { useState } from 'react'
import { StickyNote, Save, AlertCircle, CheckCircle, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { Card, CardContent } from '@/components/ui'

interface TallerNotasInternasProps {
  vehiculoId: string
  tallerId: string
  notasIniciales: string | null
}

export function TallerNotasInternas({ vehiculoId, tallerId, notasIniciales }: TallerNotasInternasProps) {
  const [notas, setNotas] = useState(notasIniciales ?? '')
  const [saved, setSaved] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (value: string) => {
    setNotas(value)
    setSaved(false)
    setSuccess(false)
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('vehiculo_taller')
        .update({ notas: notas.trim() || null })
        .eq('vehiculo_id', vehiculoId)
        .eq('taller_id', tallerId)

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSaved(true)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Error al guardar las notas')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="card-premium">
      <CardContent className="py-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-amber-400" />
            Notas internas
          </h3>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <EyeOff className="h-3 w-3" />
            Solo visible para el taller
          </span>
        </div>

        <textarea
          value={notas}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Anotaciones privadas sobre este vehículo o cliente... (ej: revisar escape en próxima visita, cliente prefiere turno por la mañana)"
          rows={4}
          maxLength={2000}
          className="w-full px-4 py-2.5 rounded-xl transition-all duration-200 bg-surface-light/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-y text-sm"
        />

        <div className="flex items-center justify-between">
          <div className="flex-1">
            {error && (
              <div className="flex items-center gap-1 text-red-400 text-xs">
                <AlertCircle className="h-3 w-3" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-1 text-green-400 text-xs">
                <CheckCircle className="h-3 w-3" />
                Notas guardadas
              </div>
            )}
            {!saved && !error && !success && (
              <span className="text-xs text-amber-400">Sin guardar</span>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            isLoading={isLoading}
            disabled={saved}
            variant={saved ? 'ghost' : 'primary'}
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

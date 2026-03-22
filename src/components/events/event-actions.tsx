'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, EyeOff, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { getEditTimeRemaining } from '@/lib/utils/event-permissions'

interface EventActionsProps {
  eventoId: string
  vehiculoId: string
  createdAt: string
  isHidden: boolean
}

export function EventActions({ eventoId, vehiculoId, createdAt, isHidden }: EventActionsProps) {
  const router = useRouter()
  const [isHiding, setIsHiding] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  const { canEdit, message } = getEditTimeRemaining(createdAt)

  const handleHide = async () => {
    setIsHiding(true)
    try {
      const supabase = createClient()
      await supabase
        .from('eventos')
        .update({ is_hidden: true })
        .eq('id', eventoId)
      
      router.push(`/dashboard/vehiculo/${vehiculoId}`)
      router.refresh()
    } catch (err) {
      console.error('Error hiding event:', err)
    } finally {
      setIsHiding(false)
      setShowConfirm(false)
    }
  }

  if (isHidden) {
    return (
      <div className="text-sm text-slate-400 italic">
        Este evento está oculto
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/vehiculo/${vehiculoId}/evento/${eventoId}/editar`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfirm(true)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <EyeOff className="h-4 w-4 mr-2" />
          Ocultar
        </Button>
      </div>
      
      {canEdit && (
        <p className="text-xs text-slate-400">{message}</p>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl p-6 max-w-md w-full border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-900/50 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold text-white">¿Ocultar este evento?</h3>
            </div>
            
            <p className="text-slate-300 mb-2">
              El evento no se eliminará, pero no será visible en el historial.
            </p>
            <p className="text-sm text-slate-400 mb-6">
              En los reportes compartidos aparecerá como "evento oculto por el propietario" para mantener la transparencia.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleHide}
                isLoading={isHiding}
              >
                Sí, ocultar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

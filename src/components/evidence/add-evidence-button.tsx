'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { FileUpload } from './file-upload'

import { FileWithHash } from './file-upload'

interface AddEvidenceButtonProps {
  eventoId: string
  vehiculoId: string
  onSuccess?: () => void
}

export function AddEvidenceButton({ eventoId, vehiculoId, onSuccess }: AddEvidenceButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [files, setFiles] = useState<FileWithHash[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async () => {
    if (files.length === 0) return
    
    setIsUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Debés iniciar sesión')
        return
      }

      for (const fileData of files) {
        const fileName = `${vehiculoId}/${eventoId}/${Date.now()}_${fileData.file.name}`
        
        // Subir archivo a Storage
        const { error: uploadError } = await supabase.storage
          .from('evidencias')
          .upload(fileName, fileData.file)

        if (uploadError) {
          console.error('Error uploading file:', uploadError)
          setError(`Error subiendo ${fileData.file.name}`)
          continue
        }

        // Crear registro de evidencia
        const { error: insertError } = await supabase.from('evidencias').insert({
          evento_id: eventoId,
          uploaded_by: user.id,
          file_name: fileData.file.name,
          file_type: fileData.file.type,
          file_size: fileData.file.size,
          storage_path: fileName,
          hash_sha256: fileData.hash,
          timestamp_utc: new Date().toISOString(),
          tipo: fileData.tipo,
        })

        if (insertError) {
          console.error('Error saving evidence:', insertError)
          setError(`Error guardando ${fileData.file.name}`)
        }
      }

      // Actualizar nivel de verificación a B si estaba en C
      await supabase
        .from('eventos')
        .update({ verification_level: 'B' })
        .eq('id', eventoId)
        .eq('verification_level', 'C')

      setFiles([])
      setIsOpen(false)
      router.refresh()
      onSuccess?.()
    } catch (err) {
      setError('Error al subir las evidencias')
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Agregar Evidencias
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Agregar Evidencias</h3>
          <button 
            onClick={() => { setIsOpen(false); setFiles([]); setError(null); }}
            className="p-1 hover:bg-surface-light rounded"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <FileUpload onFilesChange={setFiles} maxFiles={5} />

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { setIsOpen(false); setFiles([]); }}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleUpload}
            isLoading={isUploading}
            disabled={files.length === 0}
          >
            <Upload className="h-4 w-4 mr-2" />
            Subir ({files.length})
          </Button>
        </div>
      </div>
    </div>
  )
}

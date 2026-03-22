'use client'

import { useCallback, useState } from 'react'
import { Upload, X, FileText, Image, File } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateFile } from '@/lib/utils/validators'
import { generateFileHash } from '@/lib/trust-layer'
import { Button } from '@/components/ui'

import { EvidenceType } from '@/types/database'

export interface FileWithHash {
  file: File
  hash: string
  preview?: string
  tipo: EvidenceType
}

interface FileUploadProps {
  onFilesChange: (files: FileWithHash[]) => void
  maxFiles?: number
  disabled?: boolean
  defaultTipo?: EvidenceType
  showTipoSelector?: boolean
}

export function FileUpload({ onFilesChange, maxFiles = 5, disabled, defaultTipo = 'tecnica', showTipoSelector = true }: FileUploadProps) {
  const [files, setFiles] = useState<FileWithHash[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState<EvidenceType>(defaultTipo)

  const processFiles = useCallback(async (newFiles: FileList | File[]) => {
    setError(null)
    setIsProcessing(true)

    const filesToAdd: FileWithHash[] = []

    for (const file of Array.from(newFiles)) {
      if (files.length + filesToAdd.length >= maxFiles) {
        setError(`Máximo ${maxFiles} archivos permitidos`)
        break
      }

      const validation = validateFile(file)
      if (!validation.valid) {
        setError(validation.error!)
        continue
      }

      try {
        const hash = await generateFileHash(file)
        const preview = file.type.startsWith('image/') 
          ? URL.createObjectURL(file) 
          : undefined

        filesToAdd.push({ file, hash, preview, tipo: selectedTipo })
      } catch (err) {
        setError('Error al procesar el archivo')
      }
    }

    const updatedFiles = [...files, ...filesToAdd]
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
    setIsProcessing(false)
  }, [files, maxFiles, onFilesChange, selectedTipo])

  const updateFileTipo = useCallback((index: number, tipo: EvidenceType) => {
    const updatedFiles = files.map((f, i) => i === index ? { ...f, tipo } : f)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }, [files, onFilesChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return
    processFiles(e.dataTransfer.files)
  }, [disabled, processFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
  }, [processFiles])

  const removeFile = useCallback((index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    if (files[index].preview) {
      URL.revokeObjectURL(files[index].preview!)
    }
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }, [files, onFilesChange])

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image
    if (type === 'application/pdf') return FileText
    return File
  }

  return (
    <div className="space-y-4">
      {showTipoSelector && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedTipo('tecnica')}
            className={cn(
              'flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors',
              selectedTipo === 'tecnica'
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-slate-600 text-slate-400 hover:border-slate-500'
            )}
          >
            📷 Evidencia Técnica
          </button>
          <button
            type="button"
            onClick={() => setSelectedTipo('comprobante')}
            className={cn(
              'flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors',
              selectedTipo === 'comprobante'
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-slate-600 text-slate-400 hover:border-slate-500'
            )}
          >
            🧾 Comprobante de Pago
          </button>
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
          disabled ? 'bg-surface-light/30 cursor-not-allowed' : 'hover:border-accent cursor-pointer',
          error ? 'border-red-500/50 bg-red-900/20' : 'border-slate-600'
        )}
      >
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.xls,.xlsx"
          onChange={handleFileSelect}
          disabled={disabled || isProcessing}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className={cn(!disabled && 'cursor-pointer')}>
          <Upload className={cn(
            'mx-auto h-12 w-12 mb-4',
            error ? 'text-red-400' : 'text-slate-500'
          )} />
          <p className="text-slate-300 font-medium">
            {isProcessing ? 'Procesando...' : 'Arrastrá archivos o hacé clic para seleccionar'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {selectedTipo === 'tecnica' 
              ? 'Fotos del trabajo, informes, checklists' 
              : 'Facturas, tickets, comprobantes de transferencia'}
          </p>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {files.map((fileData, index) => {
            const Icon = getFileIcon(fileData.file.type)
            return (
              <div
                key={index}
                className="relative group border border-slate-600 rounded-lg p-3 bg-surface-light/30"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-red-900/50 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </Button>
                
                {fileData.preview ? (
                  <img
                    src={fileData.preview}
                    alt={fileData.file.name}
                    className="w-full h-20 object-cover rounded mb-2"
                  />
                ) : (
                  <div className="w-full h-20 bg-slate-700 rounded mb-2 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-slate-400" />
                  </div>
                )}
                
                <p className="text-xs text-slate-300 truncate" title={fileData.file.name}>
                  {fileData.file.name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs">
                    {fileData.tipo === 'tecnica' ? '📷' : '🧾'}
                  </span>
                  <select
                    value={fileData.tipo}
                    onChange={(e) => updateFileTipo(index, e.target.value as EvidenceType)}
                    className="text-xs border-none bg-transparent p-0 text-slate-300 cursor-pointer"
                  >
                    <option value="tecnica" className="bg-slate-800 text-white">Técnica</option>
                    <option value="comprobante" className="bg-slate-800 text-white">Comprobante</option>
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

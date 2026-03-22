'use client'

import { useState } from 'react'
import { FileText, ImageIcon, X, ExternalLink, Download } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface EvidenceWithUrl {
  id: string
  file_name: string
  file_type: string
  storage_path: string
  hash_sha256: string
  timestamp_utc: string
  tipo?: string
  signedUrl: string | null
}

export function EvidencePreviewItem({
  evidencia,
  variant = 'tecnica',
}: {
  evidencia: EvidenceWithUrl
  variant?: 'tecnica' | 'comprobante'
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const isImage = evidencia.file_type.startsWith('image/')
  const isPdf = evidencia.file_type === 'application/pdf'

  const wrapperClass =
    variant === 'comprobante'
      ? 'flex items-center gap-4 p-3 bg-green-900/30 rounded-lg'
      : 'flex items-center gap-4 p-3 bg-surface-light/50 rounded-lg'

  return (
    <>
      <div className={wrapperClass}>
        <div
          className={`w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 ${
            variant === 'comprobante' ? 'bg-green-900/50' : 'bg-slate-700'
          }`}
        >
          {isImage && evidencia.signedUrl ? (
            <button
              type="button"
              className="block w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent rounded"
              onClick={() => setModalOpen(true)}
              title="Ver imagen"
            >
              <img
                src={evidencia.signedUrl}
                alt={evidencia.file_name}
                className="w-full h-full object-cover"
              />
            </button>
          ) : isImage ? (
            <div className="w-full h-full bg-slate-600 flex items-center justify-center text-slate-300 text-xs">
              <ImageIcon className="h-6 w-6" />
            </div>
          ) : (
            <FileText className={`h-6 w-6 ${variant === 'comprobante' ? 'text-green-400' : 'text-slate-400'}`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-white truncate">{evidencia.file_name}</p>
          <p className="text-xs text-slate-400 font-mono truncate" title={evidencia.hash_sha256}>
            SHA-256: {evidencia.hash_sha256.slice(0, 16)}...
          </p>
          <p className="text-xs text-slate-500">
            {format(new Date(evidencia.timestamp_utc), 'd MMM yyyy, HH:mm', { locale: es })}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <ShieldIcon />
          {evidencia.signedUrl && (
            <>
              {isImage && (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="p-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                  title="Ver imagen"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
              )}
              {(isPdf || !isImage) && (
                <a
                  href={evidencia.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                  title={isPdf ? 'Ver PDF' : 'Descargar'}
                >
                  {isPdf ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                </a>
              )}
            </>
          )}
        </div>
      </div>

      {modalOpen && isImage && evidencia.signedUrl && (
        <EvidenceImageModal
          src={evidencia.signedUrl}
          alt={evidencia.file_name}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}

function ShieldIcon() {
  return (
    <span className="text-trust-high" title="Hash verificado">
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    </span>
  )
}

function EvidenceImageModal({
  src,
  alt,
  onClose,
}: {
  src: string
  alt: string
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa de imagen"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
        aria-label="Cerrar"
      >
        <X className="h-6 w-6" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui'
import { ExpandableText } from '@/components/ui/expandable-text'
import { VERIFICATION_LEVELS } from '@/constants'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Wrench, Settings, ClipboardCheck, Search, FileText, ImageIcon, X, ExternalLink } from 'lucide-react'

const EVENT_ICONS = {
  service: Wrench,
  reparacion: Settings,
  vtv: ClipboardCheck,
  inspeccion: Search,
  otro: FileText,
}

const EVENT_COLORS = {
  service: 'bg-blue-100 text-blue-600',
  reparacion: 'bg-orange-100 text-orange-600',
  vtv: 'bg-green-100 text-green-600',
  inspeccion: 'bg-purple-100 text-purple-600',
  otro: 'bg-gray-100 text-gray-600',
}

type EvidenciaItem = { id: string; file_name: string; file_type: string; evento_id: string }

type EventoParaLista = {
  id: string
  titulo: string
  tipo: string
  verification_level: string
  fecha_evento: string
  kilometraje: number | null
  descripcion: string | null
  costo: number | null
}

export function ReporteEventosConEvidencias({
  token,
  eventos,
}: {
  token: string
  eventos: EventoParaLista[]
}) {
  const [byEventoId, setByEventoId] = useState<Record<string, EvidenciaItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null)

  useEffect(() => {
    if (eventos.length === 0) {
      setLoading(false)
      return
    }
    fetch(`/api/reporte/${token}/evidencias`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { byEventoId: {} }))
      .then((data) => {
        setByEventoId(data.byEventoId ?? {})
      })
      .catch(() => setByEventoId({}))
      .finally(() => setLoading(false))
  }, [token, eventos.length])

  if (eventos.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No hay eventos registrados
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {eventos.map((evento) => {
          const Icon = EVENT_ICONS[evento.tipo as keyof typeof EVENT_ICONS]
          const colorClass = EVENT_COLORS[evento.tipo as keyof typeof EVENT_COLORS]
          const verificationInfo = VERIFICATION_LEVELS[evento.verification_level as keyof typeof VERIFICATION_LEVELS]
          const evidencias = byEventoId[evento.id] ?? byEventoId[evento.id.toLowerCase()] ?? []

          return (
            <Card key={evento.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{evento.titulo}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium text-white ${verificationInfo.bgColor}`}
                        title={verificationInfo.description}
                      >
                        {evento.verification_level}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mb-2">
                      {format(new Date(evento.fecha_evento), "d 'de' MMMM, yyyy", { locale: es })}
                      {evento.kilometraje != null && ` • ${evento.kilometraje.toLocaleString('es-AR')} km`}
                    </p>

                    {evento.descripcion && (
                      <div className="mb-2">
                        <ExpandableText text={evento.descripcion} maxLines={2} className="text-sm" />
                      </div>
                    )}

                    <div className="space-y-3 mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700">
                        Evidencias ({loading ? '…' : evidencias.length})
                      </p>
                      {loading ? (
                        <p className="text-xs text-gray-500">Cargando…</p>
                      ) : evidencias.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {evidencias.map((e) => {
                            const isImg = e.file_type?.startsWith('image/')
                            const inlineUrl = `/api/reporte/${token}/evidencia/${e.id}?inline=1`
                            const directUrl = `/api/reporte/${token}/evidencia/${e.id}`

                            if (isImg) {
                              return (
                                <button
                                  key={e.id}
                                  type="button"
                                  onClick={() => setModalImage({ src: inlineUrl, alt: e.file_name })}
                                  className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  title={e.file_name}
                                >
                                  <img
                                    src={inlineUrl}
                                    alt={e.file_name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                                  </div>
                                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                                    {e.file_name}
                                  </span>
                                </button>
                              )
                            }

                            const isPdf = e.file_type === 'application/pdf'
                            return (
                              <a
                                key={e.id}
                                href={directUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center aspect-square rounded-lg bg-gray-50 border border-gray-200 hover:border-blue-400 hover:bg-gray-100 transition-colors p-3 text-center"
                                title={e.file_name}
                              >
                                <FileText className="h-8 w-8 text-gray-400 mb-2" />
                                <span className="text-xs text-gray-700 truncate w-full">{e.file_name}</span>
                                <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1">
                                  <ExternalLink className="h-3 w-3" />
                                  {isPdf ? 'Ver PDF' : 'Ver archivo'}
                                </span>
                              </a>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Sin archivos para este evento</p>
                      )}
                    </div>
                  </div>

                  {evento.costo != null && evento.costo > 0 && (
                    <span className="text-sm font-medium text-gray-900">
                      ${evento.costo.toLocaleString('es-AR')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setModalImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa de imagen"
        >
          <button
            type="button"
            onClick={() => setModalImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={modalImage.src}
            alt={modalImage.alt}
            className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

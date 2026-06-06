'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import {
  ClipboardCheck, ExternalLink, CheckCircle2, AlertCircle,
  Loader2, ShieldCheck, AlertTriangle, FileX,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { updateVehicleTrustScore } from '@/lib/scoring-engine'

const TURNSTILE_SITE_KEY = '0x4AAAAAAB8GkEqt6sgz9dUq'

declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
      execute: (widgetId: string) => void
    }
  }
}

// ─── Tipos del API de VTV ─────────────────────────────────────────────────────

type VTVVerificacion = {
  id: string
  fecha_verificacion: string   // "DD/MM/YYYY HH:mm:ss"
  tipo_resultado_id: string    // "1"=APROBADO "2"=CONDICIONAL "3"=RECHAZADO
  comentarios: string
  numero_oblea: string         // "0" si fue rechazada sin oblea
  fecha_vencimiento: string    // "DD/MM/YYYY HH:mm:ss"
  reverificacion: string       // "True" | "False"
}
type VTVEntry = {
  verificacion: VTVVerificacion
  vehiculo: { dominio: string; marca: string; modelo: string }
  planta: { nombre: string }
}
type VTVApiResponse = {
  status?: string
  payload?: VTVEntry[]
  ok?: boolean
  message?: string
}

// ─── Lookup por tipo_resultado_id ─────────────────────────────────────────────

const TIPO: Record<string, { label: string; color: string; bg: string; dot: string; badge: string }> = {
  '1': {
    label: 'APROBADO',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-900/60 text-emerald-300',
  },
  '2': {
    label: 'CONDICIONAL',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    dot: 'bg-amber-400',
    badge: 'bg-amber-900/60 text-amber-300',
  },
  '3': {
    label: 'RECHAZADO',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    dot: 'bg-red-400',
    badge: 'bg-red-900/60 text-red-300',
  },
}
const TIPO_DEFAULT = {
  label: 'DESCONOCIDO',
  color: 'text-slate-400',
  bg: 'bg-slate-500/10 border-slate-500/20',
  dot: 'bg-slate-400',
  badge: 'bg-slate-800 text-slate-400',
}

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

/** "DD/MM/YYYY HH:mm:ss" → "YYYY-MM-DD" */
function toISODate(vtvDate: string): string {
  const [d, m, y] = vtvDate.split(' ')[0].split('/')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

/** "DD/MM/YYYY HH:mm:ss" → "DD/MM/YYYY" */
function toDisplay(vtvDate: string): string {
  return vtvDate.split(' ')[0]
}

/** Clave única por entry: oblea si existe, si no el id interno */
function entryKey(e: VTVEntry): string {
  return e.verificacion.numero_oblea !== '0'
    ? e.verificacion.numero_oblea
    : `id:${e.verificacion.id}`
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  vehiculoId: string
  patente: string
  /** Obleas ya presentes en el historial (para marcar como "ya importada") */
  vtvsEnHistorial?: string[]
}

type UIState = 'idle' | 'token-loading' | 'ready' | 'fetching' | 'result' | 'not-found' | 'importing' | 'imported' | 'error'

// ─── Componente ───────────────────────────────────────────────────────────────

export function VTVStatusCard({ vehiculoId, patente, vtvsEnHistorial = [] }: Props) {
  const router = useRouter()
  const [uiState, setUiState] = useState<UIState>('idle')
  const [token, setToken] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [vtvData, setVtvData] = useState<VTVApiResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [importedCount, setImportedCount] = useState(0)

  // Selección: Set de claves seleccionadas para importar
  const [selected, setSelected] = useState<Set<string>>(new Set())
  // Km opcional solo para la verificación más reciente
  const [kmReciente, setKmReciente] = useState('')

  const widgetRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Turnstile ──────────────────────────────────────────────────────────────

  const renderWidget = () => {
    if (!containerRef.current || !window.turnstile) return
    if (widgetRef.current) window.turnstile.remove(widgetRef.current)
    setUiState(prev => prev === 'idle' ? 'token-loading' : prev)
    widgetRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (t: string) => { setToken(t); setUiState(prev => prev === 'token-loading' ? 'ready' : prev) },
      'expired-callback': () => { setToken(null) },
      'error-callback': () => { setToken(null) },
      size: 'invisible',
    })
  }

  useEffect(() => { if (scriptLoaded) renderWidget() }, [scriptLoaded]) // eslint-disable-line

  // ── Consultar ──────────────────────────────────────────────────────────────

  const handleConsultar = async () => {
    setUiState('fetching')
    setErrorMsg(null)

    const doFetch = async (tkn: string) => {
      try {
        const res = await fetch(`/api/vtv/${patente}`, {
          headers: { 'x-turnstile-token': tkn },
        })
        const data: VTVApiResponse = await res.json()

        if (data.status === 'success' && data.payload?.length) {
          setVtvData(data)
          // Preseleccionar todas las que NO estén ya en el historial
          const initialSelected = new Set(
            data.payload
              .map(entryKey)
              .filter(k => {
                const oblea = k.startsWith('id:') ? null : k
                return oblea ? !vtvsEnHistorial.includes(oblea) : true
              })
          )
          setSelected(initialSelected)
          setUiState('result')
        } else if (data.status === 'success' && (!data.payload || data.payload.length === 0)) {
          setUiState('not-found')
        } else {
          setUiState('error')
          setErrorMsg(data.message || 'No se pudo obtener la información de VTV.')
        }
      } catch {
        setUiState('error')
        setErrorMsg('Error de conexión al consultar el servicio de VTV.')
      } finally {
        setToken(null)
        if (widgetRef.current && window.turnstile) {
          window.turnstile.remove(widgetRef.current)
          renderWidget()
        }
      }
    }

    if (token) {
      await doFetch(token)
    } else if (window.turnstile) {
      // Token no disponible aún: re-renderizar y ejecutar
      if (widgetRef.current) window.turnstile.remove(widgetRef.current)
      widgetRef.current = window.turnstile.render(containerRef.current!, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: async (t: string) => { await doFetch(t) },
        'error-callback': () => { setUiState('error'); setErrorMsg('Error en la verificación de seguridad.') },
        size: 'invisible',
      })
      window.turnstile.execute(widgetRef.current)
    }
  }

  // ── Toggle checkbox ────────────────────────────────────────────────────────

  const toggleEntry = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // ── Importar seleccionadas ─────────────────────────────────────────────────

  const handleImportar = async () => {
    if (!vtvData?.payload || selected.size === 0) return
    setUiState('importing')

    const entries = vtvData.payload.filter(e => selected.has(entryKey(e)))
    const latestKey = vtvData.payload[0] ? entryKey(vtvData.payload[0]) : null

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUiState('error'); setErrorMsg('Debés estar autenticado.'); return }

      let count = 0
      for (const entry of entries) {
        const tipo = TIPO[entry.verificacion.tipo_resultado_id] ?? TIPO_DEFAULT
        const key = entryKey(entry)
        const isLatest = key === latestKey
        const km = isLatest && kmReciente ? parseInt(kmReciente) : null

        const descripcion = [
          `Resultado de la Verificación Técnica Vehicular importado desde el Registro Oficial de la Provincia de Buenos Aires.`,
          ``,
          `Estado: ${tipo.label}`,
          entry.verificacion.numero_oblea !== '0'
            ? `Nro. Oblea: ${entry.verificacion.numero_oblea}`
            : `Nro. Oblea: no asignada (verificación rechazada)`,
          `Planta de verificación: ${entry.planta.nombre}`,
          `Vencimiento: ${toDisplay(entry.verificacion.fecha_vencimiento)}`,
          entry.verificacion.reverificacion === 'True' ? `Re-verificación: Sí` : null,
          ``,
          `Fuente: vtv.gba.gob.ar — Importado el ${new Date().toLocaleDateString('es-AR')}`,
        ].filter(l => l !== null).join('\n')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('eventos')
          .insert({
            vehiculo_id: vehiculoId,
            created_by: user.id,
            tipo: 'vtv',
            titulo: entry.verificacion.numero_oblea !== '0'
              ? `VTV ${tipo.label} — Oblea ${entry.verificacion.numero_oblea}`
              : `VTV ${tipo.label} — ${toDisplay(entry.verificacion.fecha_verificacion)}`,
            descripcion,
            fecha_evento: toISODate(entry.verificacion.fecha_verificacion),
            kilometraje: km,
            costo: null,
            verification_level: 'O',
            proxima_revision_at: toISODate(entry.verificacion.fecha_vencimiento),
            proxima_revision_km: null,
          })

        if (!error) count++
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateVehicleTrustScore(supabase as any, vehiculoId)
      setImportedCount(count)
      setUiState('imported')
      router.refresh()
    } catch {
      setUiState('error')
      setErrorMsg('Error al guardar los eventos en el historial.')
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  const latest = vtvData?.payload?.[0]
  const latestTipo = latest ? (TIPO[latest.verificacion.tipo_resultado_id] ?? TIPO_DEFAULT) : null
  const isImporting = uiState === 'importing'
  const selectedCount = selected.size

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={containerRef} className="hidden" aria-hidden="true" />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-accent" />
              Estado VTV
            </CardTitle>
            <a
              href="https://vtv.gba.gob.ar/consultar-vtv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              vtv.gba.gob.ar <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Consultá el estado oficial directo del Registro Provincial de Buenos Aires.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* ── IDLE / READY ── */}
          {(uiState === 'idle' || uiState === 'token-loading' || uiState === 'ready') && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleConsultar}
                disabled={uiState === 'token-loading' || !scriptLoaded}
                variant="outline"
                className="gap-2"
              >
                {uiState === 'token-loading'
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Inicializando…</>
                  : <><ClipboardCheck className="h-4 w-4" /> Consultar VTV oficial</>}
              </Button>
            </div>
          )}

          {/* ── FETCHING ── */}
          {uiState === 'fetching' && (
            <div className="flex items-center gap-3 text-slate-400 text-sm py-2">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              Consultando Registro Oficial de VTV…
            </div>
          )}

          {/* ── NOT FOUND ── */}
          {uiState === 'not-found' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center py-6 px-4 rounded-xl bg-slate-800/40 border border-slate-700/50 gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-700/60 flex items-center justify-center">
                  <FileX className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Sin VTV registrada</p>
                  <p className="text-sm text-slate-400 mt-1 max-w-xs">
                    No encontramos verificaciones técnicas para la patente{' '}
                    <span className="font-mono font-semibold text-slate-300">{patente}</span>{' '}
                    en el Registro Oficial de la Provincia de Buenos Aires.
                  </p>
                </div>
                <div className="text-xs text-slate-500 space-y-0.5">
                  <p>Puede deberse a que el vehículo:</p>
                  <p>• No está registrado en la Pcia. de Bs. As.</p>
                  <p>• Nunca realizó una VTV en la provincia</p>
                  <p>• La patente fue ingresada incorrectamente</p>
                </div>
                <a
                  href="https://vtv.gba.gob.ar/consultar-vtv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline mt-1"
                >
                  Verificar manualmente en vtv.gba.gob.ar <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Button variant="outline" size="sm" onClick={() => setUiState('idle')}>
                Reintentar
              </Button>
            </div>
          )}

          {/* ── ERROR ── */}
          {uiState === 'error' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setUiState('idle'); setErrorMsg(null) }}>
                Reintentar
              </Button>
            </div>
          )}

          {/* ── RESULT ── */}
          {uiState === 'result' && latest && latestTipo && (
            <div className="space-y-4">

              {/* Estado actual */}
              <div className={`flex items-center justify-between p-3 rounded-xl border ${latestTipo.bg}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${latestTipo.dot}`} />
                  <span className={`font-semibold ${latestTipo.color}`}>{latestTipo.label}</span>
                  <span className="text-slate-400 text-sm">·</span>
                  <span className="text-slate-300 text-sm">Vence {toDisplay(latest.verificacion.fecha_vencimiento)}</span>
                </div>
                <span className="text-slate-400 text-xs">{latest.vehiculo.marca} {latest.vehiculo.modelo}</span>
              </div>

              {/* Lista de verificaciones */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                  Verificaciones encontradas ({vtvData!.payload!.length}) · Seleccioná las que querés importar
                </p>

                <div className="border border-slate-700/50 rounded-xl divide-y divide-slate-700/50 overflow-hidden">
                  {vtvData!.payload!.map((entry, i) => {
                    const t = TIPO[entry.verificacion.tipo_resultado_id] ?? TIPO_DEFAULT
                    const key = entryKey(entry)
                    const isLatest = i === 0
                    const oblea = entry.verificacion.numero_oblea
                    const yaEnHistorial = oblea !== '0' && vtvsEnHistorial.includes(oblea)
                    const isChecked = selected.has(key)

                    return (
                      <div
                        key={key}
                        className={`px-4 py-3 ${yaEnHistorial ? 'opacity-50' : 'hover:bg-slate-800/30'} transition-colors`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={yaEnHistorial ? false : isChecked}
                            disabled={yaEnHistorial}
                            onChange={() => !yaEnHistorial && toggleEntry(key)}
                            className="mt-0.5 accent-amber-500 h-4 w-4 flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
                          />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${t.badge}`}>
                                {t.label}
                              </span>
                              <span className="text-slate-300 text-sm">{toDisplay(entry.verificacion.fecha_verificacion)}</span>
                              <span className="text-slate-500 text-xs">{entry.planta.nombre}</span>
                              {entry.verificacion.reverificacion === 'True' && (
                                <span className="text-xs text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded">re-verif.</span>
                              )}
                              {isLatest && (
                                <span className="text-xs text-accent font-semibold">← actual</span>
                              )}
                              {yaEnHistorial && (
                                <span className="text-xs text-slate-500 italic">ya importada</span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              {oblea !== '0'
                                ? <span>Oblea <span className="font-mono text-slate-400">{oblea}</span></span>
                                : <span className="text-slate-600">sin oblea asignada</span>
                              }
                              <span>·</span>
                              <span>Vence {toDisplay(entry.verificacion.fecha_vencimiento)}</span>
                            </div>

                            {/* Km opcional solo para la más reciente */}
                            {isLatest && isChecked && !yaEnHistorial && (
                              <div className="mt-2 flex items-center gap-2">
                                <input
                                  type="number"
                                  value={kmReciente}
                                  onChange={e => setKmReciente(e.target.value)}
                                  placeholder="Km al momento (opcional)"
                                  min={0}
                                  className="w-48 px-3 py-1.5 text-xs bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-accent"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Advertencia si ninguna seleccionada */}
              {selectedCount === 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-900/20 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Seleccioná al menos una verificación para importar.
                </div>
              )}

              {/* Fuente */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" />
                Datos del Registro Oficial de VTV · Provincia de Buenos Aires
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-3 pt-1">
                <Button
                  onClick={handleImportar}
                  disabled={isImporting || selectedCount === 0}
                  className="gap-2"
                >
                  {isImporting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
                    : <><CheckCircle2 className="h-4 w-4" />
                        Importar {selectedCount > 0 ? `${selectedCount} verificación${selectedCount > 1 ? 'es' : ''}` : ''}
                      </>
                  }
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setUiState('idle'); setVtvData(null) }}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}

          {/* ── IMPORTING ── */}
          {uiState === 'importing' && (
            <div className="flex items-center gap-3 text-slate-400 text-sm py-2">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              Guardando en el historial…
            </div>
          )}

          {/* ── IMPORTED ── */}
          {uiState === 'imported' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-300">
                    {importedCount === 1
                      ? '1 verificación agregada al historial'
                      : `${importedCount} verificaciones agregadas al historial`}
                  </p>
                  <p className="text-emerald-400/60 text-xs mt-0.5">
                    Los eventos quedaron registrados con los datos del Registro Provincial.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setUiState('idle'); setVtvData(null); setImportedCount(0) }}
              >
                Consultar de nuevo
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </>
  )
}

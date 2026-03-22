'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, QrCode, Copy, Check, Trash2, Clock, Eye, AlertCircle, Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { generateQRDataURL, generateReportToken } from '@/lib/utils/qr-generator'
import { format, addHours } from 'date-fns'
import { es } from 'date-fns/locale'
import { ReporteQR } from '@/types/database'

export default function CompartirVehiculoPage() {
  const params = useParams()
  const router = useRouter()
  const vehiculoId = params.id as string

  const [reportes, setReportes] = useState<ReporteQR[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [qrImages, setQrImages] = useState<Record<string, string>>({})
  const [ttlHours, setTtlHours] = useState(72)

  useEffect(() => {
    loadReportes()
  }, [vehiculoId])

  const loadReportes = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('reportes_qr')
      .select('*')
      .eq('vehiculo_id', vehiculoId)
      .eq('is_revoked', false)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setReportes(data || [])
      
      // Generar QR images
      const images: Record<string, string> = {}
      for (const reporte of data || []) {
        const url = `${window.location.origin}/reporte/${reporte.token}`
        images[reporte.id] = await generateQRDataURL(url)
      }
      setQrImages(images)
    }
    setIsLoading(false)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Debés iniciar sesión')
        return
      }

      const token = generateReportToken()
      const expiresAt = addHours(new Date(), ttlHours)

      const { data, error: insertError } = await supabase
        .from('reportes_qr')
        .insert({
          vehiculo_id: vehiculoId,
          created_by: user.id,
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return
      }

      // Generar QR para el nuevo reporte
      const url = `${window.location.origin}/reporte/${token}`
      const qrImage = await generateQRDataURL(url)
      
      setReportes([data, ...reportes])
      setQrImages({ ...qrImages, [data.id]: qrImage })
    } catch (err) {
      setError('Error al generar el reporte')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    const supabase = createClient()
    await supabase
      .from('reportes_qr')
      .update({ is_revoked: true })
      .eq('id', id)

    setReportes(reportes.filter(r => r.id !== id))
  }

  const handleCopy = async (token: string, id: string) => {
    const url = `${window.location.origin}/reporte/${token}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback for when Clipboard API is denied
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  return (
    <div className="max-w-2xl mx-auto">
      <Link 
        href={`/dashboard/vehiculo/${vehiculoId}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al vehículo
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Share2 className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardTitle>Compartir Historial</CardTitle>
              <p className="text-sm text-slate-400">
                Generá un link seguro para compartir el historial
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Tiempo de expiración
              </label>
              <select
                value={ttlHours}
                onChange={(e) => setTtlHours(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-surface-light/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              >
                <option value={24} className="bg-slate-800 text-white">24 horas</option>
                <option value={72} className="bg-slate-800 text-white">3 días</option>
                <option value={168} className="bg-slate-800 text-white">1 semana</option>
                <option value={720} className="bg-slate-800 text-white">30 días</option>
              </select>
            </div>
            <Button onClick={handleGenerate} isLoading={isGenerating}>
              <QrCode className="h-4 w-4 mr-2" />
              Generar QR
            </Button>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold text-white mb-4">
        Links activos ({reportes.filter(r => !isExpired(r.expires_at)).length})
      </h2>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-400">
            Cargando...
          </CardContent>
        </Card>
      ) : reportes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-surface-light rounded-full flex items-center justify-center mb-4">
              <QrCode className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Compartí el historial
            </h3>
            <p className="text-slate-400">
              Generá un link con QR para que un comprador pueda ver el historial verificado de este vehículo. El link expira automáticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reportes.map((reporte) => {
            const expired = isExpired(reporte.expires_at)
            
            return (
              <Card key={reporte.id} className={expired ? 'opacity-60' : ''}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    {qrImages[reporte.id] && (
                      <img 
                        src={qrImages[reporte.id]} 
                        alt="QR Code"
                        className="w-24 h-24 rounded-lg border"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {expired ? (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                            Expirado
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            Activo
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-400 font-mono truncate mb-2">
                        /reporte/{reporte.token.slice(0, 12)}...
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {expired ? 'Expiró' : 'Expira'} {format(new Date(reporte.expires_at), "d MMM, HH:mm", { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {reporte.view_count} vista{reporte.view_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!expired && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(reporte.token, reporte.id)}
                        >
                          {copiedId === reporte.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(reporte.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

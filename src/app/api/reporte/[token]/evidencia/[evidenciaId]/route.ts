import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

/**
 * GET /api/reporte/[token]/evidencia/[evidenciaId]
 * Valida que el reporte sea válido y que la evidencia pertenezca al vehículo del reporte.
 *
 * Sin query params: redirige a una URL firmada (1h).
 * Con ?inline=1: sirve el archivo directamente (proxy) para usar como src de <img>/<iframe>.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string; evidenciaId: string }> }
) {
  const { token, evidenciaId } = await context.params
  const supabase = await createClient()

  const { data: reporte } = await supabase
    .from('reportes_qr')
    .select('id, vehiculo_id, expires_at')
    .eq('token', token)
    .eq('is_revoked', false)
    .single()

  if (!reporte) {
    return NextResponse.json({ error: 'Reporte no encontrado o revocado' }, { status: 404 })
  }

  if (new Date(reporte.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Reporte expirado' }, { status: 410 })
  }

  const { data: evidencia } = await supabase
    .from('evidencias')
    .select('id, storage_path, file_type, evento_id')
    .eq('id', evidenciaId)
    .single()

  if (!evidencia) {
    return NextResponse.json({ error: 'Evidencia no encontrada' }, { status: 404 })
  }

  const { data: evento } = await supabase
    .from('eventos')
    .select('vehiculo_id')
    .eq('id', evidencia.evento_id)
    .single()

  if (!evento || evento.vehiculo_id !== reporte.vehiculo_id) {
    return NextResponse.json({ error: 'Evidencia no pertenece a este reporte' }, { status: 403 })
  }

  const admin = createServiceRoleClient()
  const { data: signed, error } = await admin.storage
    .from('evidencias')
    .createSignedUrl(evidencia.storage_path, 3600)

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: 'No se pudo generar el enlace' }, { status: 500 })
  }

  // Modo inline: proxy del archivo para usar como src de <img>/<iframe>
  const inline = request.nextUrl.searchParams.get('inline') === '1'
  if (inline) {
    const fileRes = await fetch(signed.signedUrl)
    if (!fileRes.ok) {
      return NextResponse.json({ error: 'No se pudo obtener el archivo' }, { status: 502 })
    }

    const contentType = evidencia.file_type || fileRes.headers.get('content-type') || 'application/octet-stream'
    return new NextResponse(fileRes.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  }

  return NextResponse.redirect(signed.signedUrl)
}

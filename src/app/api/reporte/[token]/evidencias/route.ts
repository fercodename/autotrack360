import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEvidenciasParaEventos } from '@/lib/reporte-evidencias'

/**
 * GET /api/reporte/[token]/evidencias
 * Devuelve evidencias de los eventos aprobados del reporte, agrupadas por evento_id.
 * La página del reporte puede usar esta API o llamar getEvidenciasParaEventos directo.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token: tokenFromPath } = await context.params
  const url = request.url ? new URL(request.url) : null
  const tokenFromQuery = url?.searchParams.get('token')
  const token = (tokenFromQuery && tokenFromQuery.trim()) || tokenFromPath

  if (!token || !token.trim()) {
    return NextResponse.json(
      { error: 'Falta el token. Usá la URL del reporte y reemplazá por: /api/reporte/TOKEN/evidencias?debug=1 o agregá ?token=TOKEN' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data: reporte, error: reporteError } = await supabase
    .from('reportes_qr')
    .select('id, vehiculo_id, expires_at')
    .eq('token', token.trim())
    .eq('is_revoked', false)
    .single()

  if (reporteError || !reporte) {
    return NextResponse.json(
      { error: 'Reporte no encontrado', hint: 'Revisá que el token sea el de la URL del reporte (la parte después de /reporte/). Podés probar con ?token=TU_TOKEN' },
      { status: 404 }
    )
  }

  if (new Date(reporte.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Reporte expirado' }, { status: 410 })
  }

  const { data: eventosRaw } = await supabase
    .from('eventos')
    .select('id, is_hidden, approval_status')
    .eq('vehiculo_id', reporte.vehiculo_id)

  const eventosAprobados = (eventosRaw || []).filter(
    (e: { is_hidden?: boolean; approval_status?: string | null }) =>
      !e.is_hidden && (e.approval_status === 'aprobado' || e.approval_status == null)
  )
  const eventoIds = eventosAprobados.map((e: { id: string }) => e.id)

  try {
    const byEventoId = await getEvidenciasParaEventos(eventoIds)
    const totalEvidencias = Object.values(byEventoId).reduce((n, arr) => n + arr.length, 0)
    // Debug: si en la URL agregás ?debug=1 ves eventoIds y total (ej: /api/reporte/TOKEN/evidencias?debug=1)
    const wantDebug = url && url.searchParams.get('debug') === '1'
    if (wantDebug) {
      return NextResponse.json({
        byEventoId,
        _debug: { eventoIds, eventosCount: eventoIds.length, totalEvidencias },
      })
    }
    return NextResponse.json({ byEventoId })
  } catch (err) {
    console.error('[API evidencias]', err)
    return NextResponse.json({ byEventoId: {} })
  }
}

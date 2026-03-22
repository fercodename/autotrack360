import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

/**
 * GET /api/reporte/[token]/debug-evidencia
 * Diagnóstico: devuelve eventoIds, resultado de la query de evidencias con service role,
 * y si falla el cliente admin. Usar solo para depurar.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params
  const supabase = await createClient()

  const { data: reporte, error: reporteError } = await supabase
    .from('reportes_qr')
    .select('id, vehiculo_id, expires_at')
    .eq('token', token)
    .eq('is_revoked', false)
    .single()

  if (reporteError || !reporte) {
    return NextResponse.json({
      ok: false,
      error: 'Reporte no encontrado o revocado',
      reporteError: reporteError?.message,
    }, { status: 404 })
  }

  if (new Date(reporte.expires_at) < new Date()) {
    return NextResponse.json({ ok: false, error: 'Reporte expirado' }, { status: 410 })
  }

  const { data: eventosRaw } = await supabase
    .from('eventos')
    .select('id, titulo, is_hidden, approval_status')
    .eq('vehiculo_id', reporte.vehiculo_id)
    .order('fecha_evento', { ascending: false })

  const eventosAprobados = (eventosRaw || []).filter(
    (e: { is_hidden?: boolean; approval_status?: string | null }) =>
      !e.is_hidden && (e.approval_status === 'aprobado' || e.approval_status == null)
  )
  const eventoIds = eventosAprobados.map((e: { id: string }) => e.id)

  const out: {
    ok: boolean
    eventoIds: string[]
    eventosCount: number
    serviceRoleAvailable: boolean
    evidenciasError?: string
    evidenciasCount: number
    firstEvidenciaEventoId?: string
    rawEvidenciaIds?: string[]
  } = {
    ok: true,
    eventoIds,
    eventosCount: eventoIds.length,
    serviceRoleAvailable: false,
    evidenciasCount: 0,
  }

  try {
    createServiceRoleClient()
    out.serviceRoleAvailable = true
  } catch (e) {
    return NextResponse.json({
      ...out,
      error: 'SUPABASE_SERVICE_ROLE_KEY no configurada o inválida',
      detail: String(e),
    })
  }

  if (eventoIds.length === 0) {
    return NextResponse.json(out)
  }

  const admin = createServiceRoleClient()
  const { data: evidenciasData, error: evidenciasError } = await admin
    .from('evidencias')
    .select('id, evento_id')
    .in('evento_id', eventoIds)

  if (evidenciasError) {
    out.evidenciasError = evidenciasError.message
    return NextResponse.json(out)
  }

  out.evidenciasCount = evidenciasData?.length ?? 0
  if (evidenciasData?.length) {
    out.firstEvidenciaEventoId = evidenciasData[0].evento_id
    out.rawEvidenciaIds = evidenciasData.map((e: { id: string }) => e.id)
  }

  return NextResponse.json(out)
}

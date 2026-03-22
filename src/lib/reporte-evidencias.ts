import { createServiceRoleClient } from '@/lib/supabase/admin'

export type EvidenciaParaReporte = {
  id: string
  file_name: string
  file_type: string
  hash_sha256: string
  timestamp_utc: string
  tipo?: string
  evento_id: string
}

/**
 * Obtiene evidencias para una lista de evento_id usando service role (bypass RLS).
 * Solo usar en el servidor (página reporte público, API routes).
 */
export async function getEvidenciasParaEventos(
  eventoIds: string[]
): Promise<Record<string, EvidenciaParaReporte[]>> {
  if (eventoIds.length === 0) return {}

  try {
    const admin = createServiceRoleClient()
    const { data, error } = await admin
      .from('evidencias')
      .select('id, file_name, file_type, hash_sha256, timestamp_utc, evento_id')
      .in('evento_id', eventoIds)

    if (error) {
      console.error('[getEvidenciasParaEventos] Supabase error:', error)
      return {}
    }

    const byEventoId: Record<string, EvidenciaParaReporte[]> = {}
    for (const ev of data || []) {
      const eid = String(ev.evento_id ?? '').toLowerCase()
      if (!eid) continue
      if (!byEventoId[eid]) byEventoId[eid] = []
      byEventoId[eid].push(ev as EvidenciaParaReporte)
    }
    return byEventoId
  } catch (err) {
    console.error('[getEvidenciasParaEventos]', err)
    return {}
  }
}

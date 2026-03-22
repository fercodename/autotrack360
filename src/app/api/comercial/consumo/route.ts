import { NextRequest, NextResponse } from 'next/server'
import { authenticateOrgApiKey, formatCreditos } from '@/lib/api/comercial-auth'
import { createServiceRoleClient } from '@/lib/supabase/admin'

/**
 * GET /api/comercial/consumo
 *
 * Consultar créditos restantes y consumo reciente. NO consume créditos.
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateOrgApiKey(request, 'consulta_basica')
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const diasParam = request.nextUrl.searchParams.get('dias')
  const dias = diasParam ? Math.max(1, parseInt(diasParam) || 30) : 30

  const supabase = createServiceRoleClient()
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString()

  const { data: consumos } = await supabase
    .from('org_consumos')
    .select('tipo_consulta, creditos_consumidos')
    .eq('org_id', auth.org.organizacion.id)
    .gte('created_at', desde)

  const lista = consumos || []

  const porTipo: Record<string, number> = {}
  let totalCreditos = 0
  for (const c of lista) {
    const tipo = (c as { tipo_consulta: string }).tipo_consulta
    porTipo[tipo] = (porTipo[tipo] || 0) + 1
    totalCreditos += (c as { creditos_consumidos: number }).creditos_consumidos
  }

  return NextResponse.json({
    organizacion: auth.org.organizacion.nombre,
    plan: auth.org.planNombre,
    creditos_restantes: formatCreditos(auth.org.creditosRestantes),
    consumo_periodo: {
      dias,
      total_consultas: lista.length,
      total_creditos: totalCreditos,
      por_tipo: porTipo,
    },
  })
}

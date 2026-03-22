import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { authenticateOrgApiKey, registrarConsumo, formatCreditos, getClientIp } from '@/lib/api/comercial-auth'
import { formatPatente } from '@/lib/utils/validators'

/**
 * POST /api/comercial/consulta
 *
 * Consulta básica de un vehículo por patente. Consume 1 crédito.
 *
 * Nivel de acceso: consulta_basica
 * NO incluye: evidencias, costos, descripciones, datos del propietario
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateOrgApiKey(request, 'consulta_basica')
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: { patente?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  if (!body.patente) {
    return NextResponse.json({ error: 'Campo "patente" requerido' }, { status: 400 })
  }

  const patente = formatPatente(body.patente)
  const ip = getClientIp(request)
  const supabase = createServiceRoleClient()

  const { data: vehiculo } = await supabase
    .from('vehiculos')
    .select('id, patente, marca, modelo, anio, kilometraje_actual, trust_score')
    .eq('patente', patente)
    .single()

  if (!vehiculo) {
    await registrarConsumo({
      orgId: auth.org.organizacion.id,
      apiKeyId: auth.org.apiKey.id,
      tipoConsulta: 'consulta_basica',
      patente,
      vehiculoId: null,
      encontrado: false,
      ip,
    })

    return NextResponse.json({
      encontrado: false,
      creditos_restantes: formatCreditos(auth.org.creditosRestantes, 1),
    })
  }

  // Eventos aprobados y no ocultos
  const { data: eventos } = await supabase
    .from('eventos')
    .select('tipo, fecha_evento, kilometraje')
    .eq('vehiculo_id', vehiculo.id)
    .eq('is_hidden', false)
    .eq('approval_status', 'aprobado')
    .order('fecha_evento', { ascending: true })

  const eventosList = eventos || []

  // Agrupar por tipo
  const eventosPorTipo: Record<string, number> = {}
  for (const e of eventosList) {
    const tipo = (e as { tipo: string }).tipo
    eventosPorTipo[tipo] = (eventosPorTipo[tipo] || 0) + 1
  }

  // Verificar consistencia de km (orden ya ascendente del DB)
  const kms = eventosList
    .filter((e: { kilometraje: number | null }) => e.kilometraje != null)
    .map((e: { kilometraje: number | null }) => e.kilometraje as number)

  let kmConsistente = true
  for (let i = 1; i < kms.length; i++) {
    if (kms[i] < kms[i - 1]) {
      kmConsistente = false
      break
    }
  }

  const ultimoEvento = eventosList.length > 0
    ? (eventosList[eventosList.length - 1] as { fecha_evento: string }).fecha_evento
    : null

  // Registrar consumo (no bloqueante)
  registrarConsumo({
    orgId: auth.org.organizacion.id,
    apiKeyId: auth.org.apiKey.id,
    tipoConsulta: 'consulta_basica',
    patente,
    vehiculoId: vehiculo.id,
    encontrado: true,
    ip,
  })

  return NextResponse.json({
    encontrado: true,
    vehiculo: {
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      trust_score: vehiculo.trust_score,
      total_eventos: eventosList.length,
      eventos_por_tipo: eventosPorTipo,
      ultimo_evento: ultimoEvento,
      km_registrado: vehiculo.kilometraje_actual,
      km_consistente: kmConsistente,
    },
    creditos_restantes: formatCreditos(auth.org.creditosRestantes, 1),
  })
}

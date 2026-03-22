import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { authenticateOrgApiKey, registrarConsumo, formatCreditos, getClientIp } from '@/lib/api/comercial-auth'
import { formatPatente } from '@/lib/utils/validators'

/**
 * POST /api/comercial/reporte
 *
 * Genera un reporte comercial (vista limitada) para un vehículo. Consume 2 créditos.
 *
 * Nivel de acceso: reporte_comercial
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateOrgApiKey(request, 'reporte_comercial')
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: { patente?: string; ttl_hours?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  if (!body.patente) {
    return NextResponse.json({ error: 'Campo "patente" requerido' }, { status: 400 })
  }

  const patente = formatPatente(body.patente)
  const ttlHours = body.ttl_hours ?? 48
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
      tipoConsulta: 'reporte_comercial',
      patente,
      vehiculoId: null,
      encontrado: false,
      ip,
    })

    return NextResponse.json({
      encontrado: false,
      creditos_restantes: formatCreditos(auth.org.creditosRestantes, 2),
    })
  }

  // Generar token de reporte
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString()

  // Insert reporte + registrar consumo en paralelo
  await Promise.all([
    supabase.from('reportes_qr').insert({
      vehiculo_id: vehiculo.id,
      created_by: auth.org.organizacion.id,
      token,
      expires_at: expiresAt,
      is_revoked: false,
    }),
    registrarConsumo({
      orgId: auth.org.organizacion.id,
      apiKeyId: auth.org.apiKey.id,
      tipoConsulta: 'reporte_comercial',
      patente,
      vehiculoId: vehiculo.id,
      encontrado: true,
      ip,
    }),
  ])

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  return NextResponse.json({
    encontrado: true,
    reporte: {
      token,
      url: `${baseUrl}/reporte/${token}`,
      expira: expiresAt,
      tipo: 'comercial',
    },
    vehiculo: {
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      trust_score: vehiculo.trust_score,
      km_registrado: vehiculo.kilometraje_actual,
    },
    creditos_restantes: formatCreditos(auth.org.creditosRestantes, 2),
  })
}

import { NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { createHash } from 'crypto'
import type { OrgApiKey, OrgSuscripcion, Organizacion, TipoConsulta } from '@/types/database'

const API_KEY_PREFIX = 'at360_biz_'

const CREDITOS_POR_CONSULTA: Record<TipoConsulta, number> = {
  consulta_basica: 1,
  reporte_comercial: 2,
  reporte_completo: 3,
}

export interface AuthenticatedOrg {
  organizacion: Organizacion
  apiKey: OrgApiKey
  suscripcion: OrgSuscripcion
  creditosRestantes: number
  planNombre: string
}

export type AuthResult = {
  ok: true
  org: AuthenticatedOrg
} | {
  ok: false
  error: string
  status: number
}

/** Formatea créditos restantes para la respuesta JSON */
export function formatCreditos(restantes: number, descontados: number = 0): string | number {
  if (restantes === -1) return 'ilimitado'
  return restantes - descontados
}

/** Extrae IP del cliente del request */
export function getClientIp(request: NextRequest): string | null {
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
}

/**
 * Autentica una request comercial B2B via API key.
 *
 * Espera header: Authorization: Bearer at360_biz_xxxxx
 *
 * Verifica:
 * 1. API key existe y está activa
 * 2. Organización existe y está activa
 * 3. Suscripción vigente con créditos disponibles
 * 4. El permiso requerido está en la key
 */
export async function authenticateOrgApiKey(
  request: NextRequest,
  permisoRequerido: TipoConsulta = 'consulta_basica'
): Promise<AuthResult> {
  // 1. Extraer API key del header
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, error: 'API key requerida. Usar: Authorization: Bearer <key>', status: 401 }
  }

  const rawKey = authHeader.slice(7)
  if (!rawKey.startsWith(API_KEY_PREFIX)) {
    return { ok: false, error: `API key inválida. Debe comenzar con ${API_KEY_PREFIX}`, status: 401 }
  }

  // 2. Hashear y buscar
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const supabase = createServiceRoleClient()

  const { data: apiKey, error: keyError } = await supabase
    .from('org_api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()

  if (keyError || !apiKey) {
    return { ok: false, error: 'API key inválida o desactivada', status: 401 }
  }

  // 3. Verificar permisos
  const typedKey = apiKey as unknown as OrgApiKey
  if (!typedKey.permisos.includes(permisoRequerido)) {
    return { ok: false, error: `Permiso '${permisoRequerido}' no autorizado para esta key`, status: 403 }
  }

  // 4. Buscar org + suscripción en paralelo
  const [orgResult, subResult] = await Promise.all([
    supabase.from('organizaciones').select('*').eq('id', typedKey.org_id).eq('is_active', true).single(),
    supabase.from('org_suscripciones').select('*').eq('org_id', typedKey.org_id).eq('is_active', true).single(),
  ])

  if (!orgResult.data) {
    return { ok: false, error: 'Organización inactiva o no encontrada', status: 403 }
  }

  if (!subResult.data) {
    return { ok: false, error: 'Sin suscripción activa. Contactar a AutoTrack360.', status: 403 }
  }

  const typedSub = subResult.data as unknown as OrgSuscripcion

  // 5. Verificar plan y créditos
  const { data: plan } = await supabase
    .from('org_planes')
    .select('nombre, creditos_mensuales')
    .eq('id', typedSub.plan_id)
    .single()

  const planData = plan as unknown as { nombre: string; creditos_mensuales: number } | null
  const isIlimitado = planData && planData.creditos_mensuales === 0
  if (!isIlimitado && typedSub.creditos_restantes <= 0) {
    return { ok: false, error: 'Créditos agotados. Upgrade de plan o esperar renovación.', status: 429 }
  }

  // 6. Actualizar last_used_at (fire-and-forget, no bloquea la response)
  supabase
    .from('org_api_keys')
    .update({ last_used_at: new Date().toISOString() } as never)
    .eq('id', typedKey.id)
    .then(() => {})

  return {
    ok: true,
    org: {
      organizacion: orgResult.data as unknown as Organizacion,
      apiKey: typedKey,
      suscripcion: typedSub,
      creditosRestantes: isIlimitado ? -1 : typedSub.creditos_restantes,
      planNombre: planData?.nombre ?? 'desconocido',
    },
  }
}

/** Opciones para registrar un consumo */
export interface ConsumoOpts {
  orgId: string
  apiKeyId: string
  tipoConsulta: TipoConsulta
  patente: string | null
  vehiculoId: string | null
  encontrado: boolean
  ip: string | null
}

/**
 * Registra un consumo y descuenta créditos
 */
export async function registrarConsumo(opts: ConsumoOpts) {
  const creditos = CREDITOS_POR_CONSULTA[opts.tipoConsulta]
  const supabase = createServiceRoleClient()

  // Insert consumo + fetch suscripción en paralelo
  const [, { data: sub }] = await Promise.all([
    supabase.from('org_consumos').insert({
      org_id: opts.orgId,
      api_key_id: opts.apiKeyId,
      tipo_consulta: opts.tipoConsulta,
      creditos_consumidos: creditos,
      patente_consultada: opts.patente,
      vehiculo_id: opts.vehiculoId,
      vehiculo_encontrado: opts.encontrado,
      ip_origen: opts.ip,
    }),
    supabase
      .from('org_suscripciones')
      .select('id, creditos_restantes')
      .eq('org_id', opts.orgId)
      .eq('is_active', true)
      .single(),
  ])

  if (sub) {
    const typedSub = sub as unknown as { id: string; creditos_restantes: number }
    await supabase
      .from('org_suscripciones')
      .update({ creditos_restantes: Math.max(0, typedSub.creditos_restantes - creditos) } as never)
      .eq('id', typedSub.id)
  }
}

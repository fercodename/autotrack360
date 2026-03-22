import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, requirePermission } from '@/lib/api/auth'
import { createServiceRoleClient } from '@/lib/supabase/admin'

/**
 * GET /api/v1/vehiculos
 *
 * Lista los vehículos del usuario autenticado por API key.
 * Permiso requerido: read
 *
 * Headers:
 *   Authorization: Bearer at360_xxxxx
 *
 * Response:
 *   { vehiculos: [{ id, patente, marca, modelo, anio, kilometraje_actual, trust_score }] }
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (auth.response) return auth.response

  const permError = requirePermission(auth.user, 'read')
  if (permError) return permError

  try {
    const supabase = createServiceRoleClient()
    const { userId } = auth.user

    // Vehículos propios (propietario)
    const { data: propios } = await supabase
      .from('vehiculos')
      .select('id, patente, marca, modelo, anio, kilometraje_actual, trust_score')
      .eq('owner_id', userId)

    // Vehículos de clientes (taller)
    const { data: clienteLinks } = await supabase
      .from('vehiculo_taller')
      .select('vehiculo_id')
      .eq('taller_id', userId)

    let clientes: typeof propios = []
    if (clienteLinks && clienteLinks.length > 0) {
      const ids = clienteLinks.map((l) => l.vehiculo_id)
      const { data } = await supabase
        .from('vehiculos')
        .select('id, patente, marca, modelo, anio, kilometraje_actual, trust_score')
        .in('id', ids)
      clientes = data || []
    }

    return NextResponse.json({
      vehiculos: {
        propios: propios || [],
        clientes: clientes || [],
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

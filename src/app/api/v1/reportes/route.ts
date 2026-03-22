import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, requirePermission } from '@/lib/api/auth'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

/**
 * POST /api/v1/reportes
 *
 * Genera un reporte público QR para un vehículo.
 * Permiso requerido: write
 *
 * Headers:
 *   Authorization: Bearer at360_xxxxx
 *
 * Body:
 *   { vehiculo_id: string, ttl_hours?: number }
 *
 * Response:
 *   { token, url, expires_at }
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (auth.response) return auth.response

  const permError = requirePermission(auth.user, 'write')
  if (permError) return permError

  try {
    const body = await req.json()
    const { vehiculo_id, ttl_hours = 72 } = body

    if (!vehiculo_id) {
      return NextResponse.json({ error: 'vehiculo_id is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const { userId } = auth.user

    // Verificar que el usuario tiene acceso al vehículo
    const { data: vehiculo } = await supabase
      .from('vehiculos')
      .select('id, owner_id')
      .eq('id', vehiculo_id)
      .single()

    if (!vehiculo) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    const isOwner = vehiculo.owner_id === userId
    let isTaller = false
    if (!isOwner) {
      const { data: link } = await supabase
        .from('vehiculo_taller')
        .select('vehiculo_id')
        .eq('vehiculo_id', vehiculo_id)
        .eq('taller_id', userId)
        .single()
      isTaller = !!link
    }

    if (!isOwner && !isTaller) {
      return NextResponse.json({ error: 'Access denied to this vehicle' }, { status: 403 })
    }

    // Generar token y crear reporte
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + ttl_hours * 60 * 60 * 1000).toISOString()

    const { data: reporte, error: insertError } = await supabase
      .from('reportes_qr')
      .insert({
        vehiculo_id,
        created_by: userId,
        token,
        expires_at: expiresAt,
        is_revoked: false,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const baseUrl = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
    const protocol = req.headers.get('x-forwarded-proto') || 'https'

    return NextResponse.json({
      token: reporte.token,
      url: `${protocol}://${baseUrl}/reporte/${reporte.token}`,
      expires_at: reporte.expires_at,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

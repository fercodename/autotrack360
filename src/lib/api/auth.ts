import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export interface ApiUser {
  userId: string
  permissions: string[]
  keyId: string
}

/**
 * Resultado de la autenticación por API key.
 * Si `user` es null, `response` contiene el error HTTP para devolver.
 */
type AuthResult =
  | { user: ApiUser; response?: never }
  | { user?: never; response: NextResponse }

/**
 * Autentica un request via API key (header `Authorization: Bearer at360_xxx`).
 * Busca el hash SHA-256 del key en `user_api_keys`, verifica que esté activo,
 * y devuelve el usuario asociado con sus permisos.
 *
 * Uso en un route handler:
 * ```ts
 * export async function GET(req: NextRequest) {
 *   const auth = await authenticateApiKey(req)
 *   if (auth.response) return auth.response
 *   const { userId, permissions } = auth.user
 *   // ...
 * }
 * ```
 */
export async function authenticateApiKey(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      response: NextResponse.json(
        { error: 'Missing or invalid Authorization header. Use: Bearer <api_key>' },
        { status: 401 }
      ),
    }
  }

  const apiKey = authHeader.slice(7) // Remove "Bearer "

  if (!apiKey || apiKey.length < 20) {
    return {
      response: NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 401 }
      ),
    }
  }

  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

  try {
    const supabase = createServiceRoleClient()

    const { data: keyRecord, error } = await supabase
      .from('user_api_keys')
      .select('id, user_id, permissions, is_active')
      .eq('key_hash', keyHash)
      .single()

    if (error || !keyRecord) {
      return {
        response: NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        ),
      }
    }

    if (!keyRecord.is_active) {
      return {
        response: NextResponse.json(
          { error: 'API key is disabled' },
          { status: 403 }
        ),
      }
    }

    // Actualizar last_used_at (fire and forget)
    supabase
      .from('user_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRecord.id)
      .then(() => {})

    return {
      user: {
        userId: keyRecord.user_id,
        permissions: keyRecord.permissions,
        keyId: keyRecord.id,
      },
    }
  } catch {
    return {
      response: NextResponse.json(
        { error: 'Internal authentication error' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Verifica que el usuario autenticado tenga un permiso específico.
 */
export function requirePermission(
  user: ApiUser,
  permission: 'read' | 'write' | 'admin'
): NextResponse | null {
  if (user.permissions.includes('admin')) return null // admin tiene todo
  if (!user.permissions.includes(permission)) {
    return NextResponse.json(
      { error: `Insufficient permissions. Required: ${permission}` },
      { status: 403 }
    )
  }
  return null
}

/**
 * Genera un nuevo API key y su hash.
 * Devuelve el key en texto plano (para mostrárselo al usuario una sola vez)
 * y el hash (para guardar en la DB).
 */
export function generateApiKey(): { apiKey: string; keyHash: string; keyPrefix: string } {
  const randomBytes = crypto.randomBytes(32).toString('hex')
  const apiKey = `at360_${randomBytes}`
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
  const keyPrefix = apiKey.slice(0, 12)

  return { apiKey, keyHash, keyPrefix }
}

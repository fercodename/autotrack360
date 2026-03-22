import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

/**
 * Cliente Supabase con service role. Solo usar en API routes o server actions
 * donde se necesite bypass de RLS (ej. generar signed URLs para reporte público).
 * No exponer en el cliente.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ marcaId: string }> }
) {
  const { marcaId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('modelos')
    .select('id, nombre')
    .eq('marca_id', parseInt(marcaId))
    .order('nombre')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
  })
}

import { NextRequest, NextResponse } from 'next/server'

const VTV_API_BASE = 'https://vtv-web-api.transporte.gba.gob.ar'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dominio: string }> }
) {
  const { dominio: rawDominio } = await params
  const turnstileToken = request.headers.get('x-turnstile-token')

  if (!turnstileToken) {
    return NextResponse.json({ error: 'Token de verificación requerido' }, { status: 400 })
  }

  const dominio = rawDominio.toUpperCase().replace(/[^A-Z0-9]/g, '')

  if (!dominio) {
    return NextResponse.json({ error: 'Dominio inválido' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${VTV_API_BASE}/api/historialvtvs/patente/${dominio}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Turnstile-Token': turnstileToken,
          'Origin': 'https://vtv.gba.gob.ar',
          'Referer': 'https://vtv.gba.gob.ar/',
        },
      }
    )

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[VTV API]', msg)
    return NextResponse.json({ error: 'Error al conectar con el servicio de VTV', detail: msg }, { status: 500 })
  }
}

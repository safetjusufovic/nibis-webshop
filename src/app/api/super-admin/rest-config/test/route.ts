import { NextRequest, NextResponse } from 'next/server'
import { RestAdapter } from '@/lib/erp/rest-adapter'

const SECRET = process.env.SUPER_ADMIN_SECRET || 'nibis-super-2025'
function isAuth(req: NextRequest) { return req.headers.get('x-super-admin-secret') === SECRET }

// Test REST config - vrati sirovi odgovor da korisnik vidi strukturu
export async function POST(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { config, resource } = await req.json()
  if (!config?.baseUrl) return NextResponse.json({ error: 'Base URL nije postavljen' })

  try {
    const adapter = new RestAdapter(config)
    const sample = await adapter.rawSample(resource || 'artikli')
    return NextResponse.json({ sample })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}

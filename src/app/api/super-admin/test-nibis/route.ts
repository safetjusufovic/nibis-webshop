import { NextRequest, NextResponse } from 'next/server'
import { testConnection } from '@/lib/nibis'

const SECRET = 'nibis-super-2025'

// Test NIBIS konekcije prije kreiranja shopa (onboarding čarobnjak)
export async function POST(req: NextRequest) {
  if (req.headers.get('x-super-admin-secret') !== SECRET) {
    return NextResponse.json({ ok: false, error: 'Neovlašteno' }, { status: 401 })
  }

  const { nibis_api_url, nibis_api_key, company_year, org_jed_id } = await req.json()

  if (!nibis_api_url || !nibis_api_key) {
    return NextResponse.json({ ok: false, error: 'URL i API ključ su obavezni' })
  }

  const result = await testConnection({
    baseUrl: nibis_api_url,
    apiKey: nibis_api_key,
    companyYear: company_year?.toString() || new Date().getFullYear().toString(),
    orgJedId: parseInt(org_jed_id) || 1,
  })

  return NextResponse.json(result)
}

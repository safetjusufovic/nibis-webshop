import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getErpAdapter, getShopErpConfig } from '@/lib/erp'

export async function GET(req: NextRequest) {
  const shopSlug = req.nextUrl.searchParams.get('shop') || 'main'
  const search = req.nextUrl.searchParams.get('search') || ''

  // Dohvati shop id (za adapter config)
  const { data: shop } = await supabaseAdmin
    .from('shopovi')
    .select('id')
    .eq('slug', shopSlug)
    .single()

  try {
    // Adapter — NIBIS shop dobija NibisAdapter, custom_rest dobija RestAdapter
    const erpConfig = shop?.id
      ? await getShopErpConfig(shop.id)
      : { tip: 'nibis' as const, baseUrl: process.env.NIBIS_API_URL ?? '', apiKey: process.env.NIBIS_API_KEY ?? '', companyYear: process.env.NIBIS_COMPANY_YEAR ?? new Date().getFullYear().toString(), orgJedId: parseInt(process.env.ORG_JED_ID ?? '1') }

    const adapter = getErpAdapter(erpConfig)
    const data = await adapter.getPartneri({ search, perPage: 20 })
    return NextResponse.json({ items: data.items ?? [] })
  } catch (e: any) {
    return NextResponse.json({ items: [], error: e.message }, { status: 500 })
  }
}

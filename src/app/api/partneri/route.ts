import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getPartneri } from '@/lib/nibis'
import type { NibisConfig } from '@/types/nibis'

const defaultConfig: NibisConfig = {
  baseUrl: process.env.NIBIS_API_URL ?? '',
  apiKey: process.env.NIBIS_API_KEY ?? '',
  companyYear: process.env.NIBIS_COMPANY_YEAR ?? new Date().getFullYear().toString(),
  orgJedId: parseInt(process.env.ORG_JED_ID ?? '1'),
}

export async function GET(req: NextRequest) {
  const shopSlug = req.nextUrl.searchParams.get('shop') || 'main'
  const search = req.nextUrl.searchParams.get('search') || ''

  // Dohvati shop NIBIS config
  const { data: shop } = await supabaseAdmin
    .from('shopovi')
    .select('nibis_api_url, nibis_api_key, company_year, org_jed_id')
    .eq('slug', shopSlug)
    .single()

  const config: NibisConfig = shop?.nibis_api_url && shop?.nibis_api_key
    ? {
        baseUrl: shop.nibis_api_url,
        apiKey: shop.nibis_api_key,
        companyYear: shop.company_year?.toString() ?? new Date().getFullYear().toString(),
        orgJedId: shop.org_jed_id ?? 1,
      }
    : defaultConfig

  try {
    const data = await getPartneri({ search, perPage: 20 }, config)
    return NextResponse.json({ items: data.items ?? [] })
  } catch (e: any) {
    return NextResponse.json({ items: [], error: e.message }, { status: 500 })
  }
}

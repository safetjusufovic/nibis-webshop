import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { siteConfig } from '@/lib/config'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const orgJedId = parseInt(sp.get('orgJedId') ?? String(siteConfig.orgJedId))
  const idsParam = sp.get('ids')
  const artikalIds = idsParam ? idsParam.split(',').map(Number).filter(Boolean) : null
  const shopSlug = sp.get('shop') || ''

  try {
    let query = supabaseAdmin
      .from('stanje_skladista')
      .select('id, artikal_id, org_jed_id, raspoloziva_kolicina, nabavna_cijena, vpcijena, mpcijena')
      .eq('org_jed_id', orgJedId)

    if (artikalIds?.length) query = query.in('artikal_id', artikalIds)

    if (shopSlug) {
      const { data: shopData } = await supabaseAdmin
        .from('shopovi')
        .select('id')
        .eq('slug', shopSlug)
        .eq('status', 'aktivan')
        .single()

      if (shopData?.id) {
        query = query.eq('shop_id', shopData.id)
      } else {
        return NextResponse.json({ items: [], total: 0 })
      }
    }

    const { data, error } = await query
    if (error) throw error

    const items = (data ?? []).map((s: any) => ({
      id: s.id,
      artikalId: s.artikal_id,
      orgJedId: s.org_jed_id,
      raspolozivaKolicina: s.raspoloziva_kolicina,
      nabavnaCijena: s.nabavna_cijena,
      vpcijena: s.vpcijena,
      mpcijena: s.mpcijena,
    }))

    return NextResponse.json({ items, total: items.length })
  } catch (e: any) {
    console.error('[STANJE]', e)
    return NextResponse.json({ items: [], total: 0, error: e.message }, { status: 500 })
  }
}

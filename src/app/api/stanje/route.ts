import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const idsParam = sp.get('ids')
  const artikalIds = idsParam ? idsParam.split(',').map(Number).filter(Boolean) : null
  const shopSlug = sp.get('shop') || 'main'

  try {
    // Resolve shop + njegov org_jed_id
    const { data: shopData } = await supabaseAdmin
      .from('shopovi')
      .select('id, org_jed_id')
      .eq('slug', shopSlug)
      .eq('status', 'aktivan')
      .single()

    if (!shopData?.id) {
      return NextResponse.json({ items: [], total: 0 })
    }

    let query = supabaseAdmin
      .from('stanje_skladista')
      .select('id, artikal_id, org_jed_id, raspoloziva_kolicina, nabavna_cijena, vpcijena, mpcijena')
      .eq('shop_id', shopData.id)

    if (artikalIds?.length) query = query.in('artikal_id', artikalIds)

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

    return NextResponse.json({ items, total: items.length }, {
      headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' }
    })
  } catch (e: any) {
    console.error('[STANJE]', e)
    return NextResponse.json({ items: [], total: 0, error: e.message }, { status: 500 })
  }
}

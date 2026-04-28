import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { siteConfig } from '@/lib/config'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const orgJedId = parseInt(sp.get('orgJedId') ?? String(siteConfig.orgJedId))
  const idsParam = sp.get('ids')
  const artikalIds = idsParam ? idsParam.split(',').map(Number).filter(Boolean) : null

  try {
    let query = supabase
      .from('stanje_skladista')
      .select('id, artikal_id, org_jed_id, raspoloziva_kolicina, nabavna_cijena, vpcijena, mpcijena')
      .eq('org_jed_id', orgJedId)

    if (artikalIds?.length) {
      query = query.in('artikal_id', artikalIds)
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

    return NextResponse.json(
      { total: items.length, filtered: items.length, page: 1, perPage: items.length, items },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
    )
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

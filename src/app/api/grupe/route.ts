import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

async function resolveShopId(req: NextRequest): Promise<string | null> {
  const shopSlug = req.nextUrl.searchParams.get('shop')
  if (!shopSlug) return null
  const { data } = await supabaseAdmin.from('shopovi').select('id').eq('slug', shopSlug).eq('status', 'aktivan').single()
  return data?.id || null
}

export async function GET(req: NextRequest) {
  try {
    const shopId = await resolveShopId(req)

    let query = supabase
      .from('grupe')
      .select('id, sifra, naziv, opis, prefix, nivo, parent_id, boja, ikona_url', { count: 'exact' })
      .order('nivo').order('naziv')

    if (shopId) {
      query = query.eq('shop_id', shopId)
    } else {
      query = query.is('shop_id', null)
    }

    const { data, error, count } = await query
    if (error) throw error

    const items = (data || []).map(g => ({
      id: g.id, sifra: g.sifra, naziv: g.naziv, opis: g.opis,
      prefix: g.prefix, nivo: g.nivo, parentId: g.parent_id,
      boja: g.boja, ikonaUrl: g.ikona_url,
    }))

    return NextResponse.json(
      { items, total: count ?? items.length },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    )
  } catch (e: any) {
    return NextResponse.json({ items: [], total: 0, error: e.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const shopSlug = req.nextUrl.searchParams.get('shop') || 'main'
    
    const { data: shopData } = await supabaseAdmin
      .from('shopovi')
      .select('id')
      .eq('slug', shopSlug)
      .eq('status', 'aktivan')
      .single()
    
    if (!shopData?.id) {
      return NextResponse.json({ items: [], total: 0 })
    }

    const { data, error, count } = await supabaseAdmin
      .from('grupe')
      .select('id, sifra, naziv, opis, prefix, nivo, parent_id, boja, ikona_url', { count: 'exact' })
      .eq('shop_id', shopData.id)
      .order('nivo')
      .order('naziv')

    if (error) throw error

    const items = (data || []).map(g => ({
      id: g.id, sifra: g.sifra, naziv: g.naziv, opis: g.opis,
      prefix: g.prefix, nivo: g.nivo, parentId: g.parent_id,
      boja: g.boja, ikonaUrl: g.ikona_url,
    }))

    return NextResponse.json(
      { items, total: count ?? items.length },
      { headers: { 'Cache-Control': 'public, s-maxage=60' } }
    )
  } catch (e: any) {
    return NextResponse.json({ items: [], total: 0, error: e.message }, { status: 500 })
  }
}

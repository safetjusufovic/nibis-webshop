import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function getShopId(shopSlug: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('shopovi').select('id').eq('slug', shopSlug).single()
  return data?.id || null
}

// GET ?artikal=123&shop=slug — lista slika artikla
export async function GET(req: NextRequest) {
  const artikalId = req.nextUrl.searchParams.get('artikal')
  const shopSlug = req.nextUrl.searchParams.get('shop') || 'main'
  if (!artikalId) return NextResponse.json({ slike: [] })

  const shopId = await getShopId(shopSlug)
  if (!shopId) return NextResponse.json({ slike: [] })

  const { data } = await supabaseAdmin
    .from('artikal_slike')
    .select('id, url, redoslijed')
    .eq('artikal_id', artikalId)
    .eq('shop_id', shopId)
    .order('redoslijed', { ascending: true })

  return NextResponse.json({ slike: data || [] })
}

// POST — dodaj sliku { artikal, shop, url }
export async function POST(req: NextRequest) {
  const { artikal, shop, url } = await req.json()
  const shopId = await getShopId(shop || 'main')
  if (!shopId || !artikal || !url) return NextResponse.json({ error: 'Nedostaju podaci' }, { status: 400 })

  // Redoslijed = broj postojećih slika
  const { count } = await supabaseAdmin
    .from('artikal_slike')
    .select('id', { count: 'exact', head: true })
    .eq('artikal_id', artikal).eq('shop_id', shopId)

  const { data, error } = await supabaseAdmin
    .from('artikal_slike')
    .insert({ artikal_id: artikal, shop_id: shopId, url, redoslijed: count || 0 })
    .select('id, url, redoslijed')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Ako je prva slika, postavi je i kao glavnu (artikli.slika_url)
  if ((count || 0) === 0) {
    await supabaseAdmin.from('artikli').update({ slika_url: url, slika_rucna: true }).eq('id', artikal).eq('shop_id', shopId)
  }

  return NextResponse.json({ slika: data })
}

// DELETE ?id=uuid&shop=slug — ukloni sliku
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const shopSlug = req.nextUrl.searchParams.get('shop') || 'main'
  const shopId = await getShopId(shopSlug)
  if (!id || !shopId) return NextResponse.json({ error: 'Nedostaju podaci' }, { status: 400 })

  // Dohvati sliku prije brisanja (da znamo artikal i je li bila glavna)
  const { data: slika } = await supabaseAdmin
    .from('artikal_slike').select('artikal_id, url, redoslijed').eq('id', id).eq('shop_id', shopId).single()

  await supabaseAdmin.from('artikal_slike').delete().eq('id', id).eq('shop_id', shopId)

  // Ako je bila glavna (redoslijed 0), postavi sljedeću kao glavnu
  if (slika && slika.redoslijed === 0) {
    const { data: sljedeca } = await supabaseAdmin
      .from('artikal_slike').select('url').eq('artikal_id', slika.artikal_id).eq('shop_id', shopId)
      .order('redoslijed', { ascending: true }).limit(1).single()
    await supabaseAdmin.from('artikli')
      .update({ slika_url: sljedeca?.url || null, slika_rucna: !!sljedeca })
      .eq('id', slika.artikal_id).eq('shop_id', shopId)
  }

  return NextResponse.json({ ok: true })
}

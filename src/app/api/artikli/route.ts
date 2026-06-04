import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Keš shop slug -> id (u memoriji, dok je instanca topla)
const shopIdCache = new Map<string, { id: string | null; ts: number }>()
const SHOP_CACHE_MS = 60_000

async function resolveShopId(shopSlug: string): Promise<string | null> {
  const cached = shopIdCache.get(shopSlug)
  if (cached && Date.now() - cached.ts < SHOP_CACHE_MS) return cached.id
  const { data } = await supabaseAdmin
    .from('shopovi').select('id').eq('slug', shopSlug).eq('status', 'aktivan').single()
  const id = data?.id || null
  shopIdCache.set(shopSlug, { id, ts: Date.now() })
  return id
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const page = parseInt(sp.get('page') ?? '1')
  const perPage = parseInt(sp.get('perPage') ?? '24')
  const search = sp.get('search') || ''
  const grupaId = sp.get('grupaId') || ''
  const sortBy = sp.get('sortBy') || 'naziv_asc'
  const akcija = sp.get('akcija') === 'true'
  const shopSlug = sp.get('shop') || 'main'

  // Uvijek filtriraj po shop_id - svaki shop ima vlastite artikle (keširan lookup)
  const shopId = await resolveShopId(shopSlug)
  if (!shopId) {
    return NextResponse.json({ items: [], total: 0 })
  }

  let query = supabaseAdmin
    .from('artikli')
    .select('id, sifra, barkod, naziv, naziv2, proc_poreza, planska_maloprodajna_cijena, planska_veleprodajna_cijena, slika_url, grupa_id, akcija_popust, akcija_do, aktivan, webshop_aktivan', { count: 'exact' })
    .eq('aktivan', true)
    .eq('webshop_aktivan', true)
    .eq('shop_id', shopId)

  if (search) query = query.or(`naziv.ilike.%${search}%,sifra.ilike.%${search}%,barkod.ilike.%${search}%`)
  if (grupaId) query = query.eq('grupa_id', grupaId)
  if (akcija) query = query.gt('akcija_popust', 0)

  if (sortBy === 'naziv_asc') query = query.order('naziv', { ascending: true })
  else if (sortBy === 'naziv_desc') query = query.order('naziv', { ascending: false })
  else if (sortBy === 'cijena_asc') query = query.order('planska_maloprodajna_cijena', { ascending: true })
  else if (sortBy === 'cijena_desc') query = query.order('planska_maloprodajna_cijena', { ascending: false })
  else query = query.order('naziv', { ascending: true })

  query = query.range((page - 1) * perPage, page * perPage - 1)

  const { data, error, count } = await query
  if (error) {
    console.error('[ARTIKLI]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Dohvati grupe za ovaj shop (manualni join jer FK ne postoji)
  const grupaIds = [...new Set((data || []).map((a: any) => a.grupa_id).filter(Boolean))]
  const grupaMap: Record<number, any> = {}
  if (grupaIds.length) {
    const { data: grupe } = await supabaseAdmin
      .from('grupe').select('id, naziv')
      .eq('shop_id', shopId)
      .in('id', grupaIds)
    grupe?.forEach((g: any) => { grupaMap[g.id] = g })
  }

  const items = (data || []).map((a: any) => ({
    id: a.id,
    sifra: a.sifra,
    barkod: a.barkod,
    naziv: a.naziv,
    naziv2: a.naziv2,
    procPoreza: a.proc_poreza,
    planskaMaloprodajnaCijena: a.planska_maloprodajna_cijena,
    planskaVeleprodajnaCijena: a.planska_veleprodajna_cijena,
    slika_url: a.slika_url,
    grupaId: a.grupa_id,
    akcija_popust: a.akcija_popust,
    akcija_do: a.akcija_do,
    aktivan: a.aktivan,
    grupa: grupaMap[a.grupa_id] ?? null,
  }))

  return NextResponse.json({ items, total: count ?? 0 }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' }
  })
}

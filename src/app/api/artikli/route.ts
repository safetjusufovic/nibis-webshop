import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

async function resolveShopId(req: NextRequest): Promise<string | null> {
  const shopSlug = req.nextUrl.searchParams.get('shop')
  if (!shopSlug) return null
  const { data } = await supabaseAdmin
    .from('shopovi')
    .select('id')
    .eq('slug', shopSlug)
    .eq('status', 'aktivan')
    .single()
  return data?.id || null
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const page = parseInt(sp.get('page') ?? '1')
  const perPage = parseInt(sp.get('perPage') ?? '24')
  const search = sp.get('search') || ''
  const grupaId = sp.get('grupaId') || ''
  const sortBy = sp.get('sortBy') || 'naziv_asc'
  const akcija = sp.get('akcija') === 'true'
  const cijenaOd = parseFloat(sp.get('cijenaOd') || '0')
  const cijenaDo = parseFloat(sp.get('cijenaDo') || '0')

  const shopId = await resolveShopId(req)

  let query = supabase
    .from('artikli')
    .select('id, sifra, barkod, naziv, naziv2, jedinica_mjere, proc_poreza, planska_maloprodajna_cijena, planska_veleprodajna_cijena, slika_url, grupa_id, akcija_popust, akcija_do, aktivan, grupe:grupa_id(id,naziv)', { count: 'exact' })
    .eq('aktivan', true)

  // Izolacija: klijentski shop filtrira po shop_id, glavni shop NE filtrira
  if (shopId) {
    query = query.eq('shop_id', shopId)
  }
  // Bez shop param = glavni shop = svi artikli bez filtra

  if (search) query = query.or(`naziv.ilike.%${search}%,sifra.ilike.%${search}%,barkod.ilike.%${search}%`)
  if (grupaId) query = query.eq('grupa_id', grupaId)
  if (akcija) query = query.gt('akcija_popust', 0)
  if (cijenaOd > 0) query = query.gte('planska_maloprodajna_cijena', cijenaOd)
  if (cijenaDo > 0) query = query.lte('planska_maloprodajna_cijena', cijenaDo)

  if (sortBy === 'naziv_asc') query = query.order('naziv', { ascending: true })
  else if (sortBy === 'naziv_desc') query = query.order('naziv', { ascending: false })
  else if (sortBy === 'cijena_asc') query = query.order('planska_maloprodajna_cijena', { ascending: true })
  else if (sortBy === 'cijena_desc') query = query.order('planska_maloprodajna_cijena', { ascending: false })
  else query = query.order('naziv', { ascending: true })

  query = query.range((page - 1) * perPage, page * perPage - 1)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = (data || []).map((a: any) => ({
    id: a.id, sifra: a.sifra, barkod: a.barkod, naziv: a.naziv, naziv2: a.naziv2,
    jedinicaMjere: a.jedinica_mjere, procPoreza: a.proc_poreza,
    planskaMaloprodajnaCijena: a.planska_maloprodajna_cijena,
    planskaVeleprodajnaCijena: a.planska_veleprodajna_cijena,
    slika_url: a.slika_url, grupaId: a.grupa_id,
    akcija_popust: a.akcija_popust, akcija_do: a.akcija_do,
    aktivan: a.aktivan, grupa: a.grupe,
  }))

  return NextResponse.json({ items, total: count ?? 0 })
}

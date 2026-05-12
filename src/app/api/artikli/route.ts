import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const page = parseInt(sp.get('page') ?? '1')
  const perPage = parseInt(sp.get('perPage') ?? '24')
  const search = sp.get('search') || ''
  const grupaId = sp.get('grupaId') || ''
  const sortBy = sp.get('sortBy') || 'naziv_asc'
  const akcija = sp.get('akcija') === 'true'
  const shopSlug = sp.get('shop') || ''

  let query = supabaseAdmin
    .from('artikli')
    .select('id, sifra, barkod, naziv, naziv2, jedinica_mjere, proc_poreza, planska_maloprodajna_cijena, planska_veleprodajna_cijena, slika_url, grupa_id, akcija_popust, akcija_do, aktivan, grupe:grupa_id(id,naziv)', { count: 'exact' })
    .eq('aktivan', true)

  // Shop izolacija - samo ako je shop param prisutan
  if (shopSlug) {
    // Dohvati shop_id za ovaj slug
    const { data: shopData } = await supabaseAdmin
      .from('shopovi')
      .select('id')
      .eq('slug', shopSlug)
      .eq('status', 'aktivan')
      .single()
    
    if (shopData?.id) {
      query = query.eq('shop_id', shopData.id)
    } else {
      // Shop ne postoji - vrati prazno
      return NextResponse.json({ items: [], total: 0 })
    }
  }
  // Bez ?shop= - glavni shop - vrati sve artikle

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

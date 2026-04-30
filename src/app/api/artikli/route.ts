import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const page = parseInt(sp.get('page') ?? '1')
  const perPage = parseInt(sp.get('perPage') ?? '24')
  const search = sp.get('search') ?? ''
  const grupaId = sp.get('grupaId')
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  try {
    let query = supabase
      .from('artikli')
      .select(`
        id, sifra, barkod, naziv, naziv2, opis,
        proc_poreza,
        planska_maloprodajna_cijena, planska_veleprodajna_cijena,
        slika_url, grupa_id,
        akcija_popust, akcija_do,
        grupe:grupa_id ( id, sifra, naziv )
      `, { count: 'exact' })
      .eq('aktivan', true)
      .eq('webshop_aktivan', true)
      .range(from, to)

    if (search) {
      query = query.or(`naziv.ilike.%${search}%,sifra.ilike.%${search}%`)
    }
    if (grupaId) query = query.eq('grupa_id', grupaId)
    if (sp.get('akcija') === 'true') query = query.gt('akcija_popust', 0)

    // Filter cijene
    const cijenaOd = sp.get('cijenaOd')
    const cijenaDo = sp.get('cijenaDo')
    if (cijenaOd) query = query.gte('planska_maloprodajna_cijena', parseFloat(cijenaOd))
    if (cijenaDo) query = query.lte('planska_maloprodajna_cijena', parseFloat(cijenaDo))

    // Sortiranje
    const sortBy = sp.get('sortBy') ?? 'naziv'
    if (sortBy === 'naziv') query = query.order('naziv', { ascending: true })
    else if (sortBy === 'naziv_desc') query = query.order('naziv', { ascending: false })
    else if (sortBy === 'cijena_asc') query = query.order('planska_maloprodajna_cijena', { ascending: true })
    else if (sortBy === 'cijena_desc') query = query.order('planska_maloprodajna_cijena', { ascending: false })
    else query = query.order('naziv', { ascending: true })

    const { data, error, count } = await query
    if (error) throw error

    const items = (data ?? []).map((a: any) => ({
      id: a.id, sifra: a.sifra, barkod: a.barkod,
      naziv: a.naziv, naziv2: a.naziv2, opis: a.opis,
      aktivan: true, vanUpotrebe: false,
      procPoreza: a.proc_poreza,
      planskaMaloprodajnaCijena: a.planska_maloprodajna_cijena,
      planskaVeleprodajnaCijena: a.planska_veleprodajna_cijena,
      slika_url: a.slika_url,
      grupaId: a.grupa_id,
      grupa: a.grupe ?? null,
      akcija_popust: a.akcija_popust ?? 0,
      akcija_do: a.akcija_do ?? null,
    }))

    return NextResponse.json({ total: count ?? 0, filtered: count ?? 0, page, perPage, items })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

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
        aktivan, van_upotrebe, proc_poreza,
        planska_maloprodajna_cijena, planska_veleprodajna_cijena,
        slika_url, grupa_id,
        webshop_aktivan, akcija_popust, akcija_do,
        grupe:grupa_id ( id, sifra, naziv )
      `, { count: 'exact' })
      .eq('aktivan', true)
      .eq('van_upotrebe', false)
      .order('naziv')
      .range(from, to)

    if (search) {
      query = query.or(`naziv.ilike.%${search}%,sifra.ilike.%${search}%,barkod.ilike.%${search}%`)
    }
    query = query.eq('webshop_aktivan', true)
    if (grupaId) query = query.eq('grupa_id', grupaId)

    const { data, error, count } = await query
    if (error) throw error

    const items = (data ?? []).map((a: any) => ({
      id: a.id, sifra: a.sifra, barkod: a.barkod,
      naziv: a.naziv, naziv2: a.naziv2, opis: a.opis,
      aktivan: a.aktivan, vanUpotrebe: a.van_upotrebe,
      procPoreza: a.proc_poreza,
      planskaMaloprodajnaCijena: a.planska_maloprodajna_cijena,
      planskaVeleprodajnaCijena: a.planska_veleprodajna_cijena,
      slika_url: a.slika_url,
      grupaId: a.grupa_id,
      grupa: a.grupe ?? null,
    }))

    return NextResponse.json({ total: count ?? 0, filtered: count ?? 0, page, perPage, items })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

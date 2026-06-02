import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  // Resolve shop
  const shopSlug = req.nextUrl.searchParams.get('shop') || 'main'
  const { data: shopData } = await supabaseAdmin
    .from('shopovi').select('id').eq('slug', shopSlug).single()
  if (!shopData?.id) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('artikli')
    .select(`
      id, sifra, barkod, naziv, naziv2, opis,
      proc_poreza, tar_broj, jedinica_mjere,
      planska_maloprodajna_cijena, planska_veleprodajna_cijena,
      slika_url, grupa_id,
      akcija_popust, akcija_do
    `)
    .eq('id', id)
    .eq('shop_id', shopData.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Dohvati grupu manualno
  let grupa = null
  if (data.grupa_id) {
    const { data: g } = await supabaseAdmin
      .from('grupe').select('id, sifra, naziv')
      .eq('id', data.grupa_id).eq('shop_id', shopData.id).single()
    grupa = g
  }

  const artikal = {
    id: data.id,
    sifra: data.sifra,
    barkod: data.barkod,
    naziv: data.naziv,
    naziv2: data.naziv2,
    opis: data.opis,
    procPoreza: data.proc_poreza,
    tarBroj: data.tar_broj,
    jedinicaMjere: data.jedinica_mjere,
    planskaMaloprodajnaCijena: data.planska_maloprodajna_cijena,
    planskaVeleprodajnaCijena: data.planska_veleprodajna_cijena,
    slika_url: data.slika_url,
    grupaId: data.grupa_id,
    grupa,
    akcija_popust: data.akcija_popust,
    akcija_do: data.akcija_do,
    aktivan: true,
  }

  return NextResponse.json(artikal)
}

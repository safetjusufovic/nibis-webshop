import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const { data, error } = await supabase
    .from('artikli')
    .select(`
      id, sifra, barkod, naziv, naziv2, opis,
      proc_poreza, tar_broj, jedinica_mjere,
      planska_maloprodajna_cijena, planska_veleprodajna_cijena,
      slika_url, grupa_id,
      akcija_popust, akcija_do,
      grupe:grupa_id ( id, sifra, naziv )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Mapa u isti format kao /api/artikli lista
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
    grupa: (data as any).grupe ?? null,
    akcija_popust: data.akcija_popust,
    akcija_do: data.akcija_do,
    aktivan: true,
  }

  return NextResponse.json(artikal)
}

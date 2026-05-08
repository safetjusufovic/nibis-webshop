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

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

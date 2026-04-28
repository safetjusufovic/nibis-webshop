import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error, count } = await supabase
      .from('grupe')
      .select('id, sifra, naziv, opis, prefix, nivo, parent_id', { count: 'exact' })
      .order('naziv')
      .limit(200)

    if (error) throw error

    const items = (data ?? []).map((g: any) => ({
      id: g.id, sifra: g.sifra, naziv: g.naziv,
      opis: g.opis, prefix: g.prefix, nivo: g.nivo,
      parentId: g.parent_id,
    }))

    return NextResponse.json(
      { total: count ?? 0, filtered: count ?? 0, page: 1, perPage: 200, items },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    )
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

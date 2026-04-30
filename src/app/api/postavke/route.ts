import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const kljuci = req.nextUrl.searchParams.get('kljuci')?.split(',') ?? []
  const { data } = await supabase.from('postavke').select('kljuc, vrijednost')
    .in('kljuc', kljuci.length > 0 ? kljuci : ['_'])
  const map: Record<string, string> = {}
  data?.forEach(p => { map[p.kljuc] = p.vrijednost })
  return NextResponse.json(map, {
    headers: { 'Cache-Control': 'public, s-maxage=60' }
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const MAIN_HOSTS = ['nibis-webshop.vercel.app', 'localhost', '127.0.0.1']

async function getShopId(req: NextRequest): Promise<string | null> {
  const shopId = req.nextUrl.searchParams.get('shop_id')
  if (shopId) return shopId

  const shopSlug = req.nextUrl.searchParams.get('shop')
  if (shopSlug) {
    const { data } = await supabaseAdmin
      .from('shopovi').select('id')
      .eq('slug', shopSlug).eq('status', 'aktivan').single()
    return data?.id || null
  }

  const hostname = (req.headers.get('host') || '').split(':')[0]
  if (MAIN_HOSTS.some(h => hostname === h) || hostname.endsWith('.vercel.app')) return null

  const { data } = await supabaseAdmin.from('shopovi')
    .select('id')
    .or(`domena.eq.${hostname},slug.eq.${hostname.split('.')[0]}`)
    .eq('status', 'aktivan').single()
  return data?.id || null
}

export async function GET(req: NextRequest) {
  const kljuci = req.nextUrl.searchParams.get('kljuci')?.split(',') ?? []
  const shopId = await getShopId(req)

  const q = supabaseAdmin.from('postavke')
    .select('kljuc, vrijednost, shop_id')
    .in('kljuc', kljuci.length > 0 ? kljuci : ['_'])

  const { data } = shopId
    ? await q.eq('shop_id', shopId)        // klijentski shop — SAMO njegove
    : await q.is('shop_id', null)          // glavni shop — SAMO globalne

  const map: Record<string, string> = {}
  data?.forEach(p => { map[p.kljuc] = p.vrijednost })

  return NextResponse.json(map, {
    headers: { 'Cache-Control': 'no-store' }  // ne cachira — svaki shop mora dobiti svoje
  })
}

export async function POST(req: NextRequest) {
  const shopId = await getShopId(req)
  const body = await req.json()

  if (Array.isArray(body)) {
    const rows = body.map(({ kljuc, vrijednost }: any) => ({
      kljuc, vrijednost: vrijednost || '', shop_id: shopId || null
    }))
    const { error } = await supabaseAdmin.from('postavke')
      .upsert(rows, { onConflict: 'kljuc,shop_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const { kljuc, vrijednost } = body
  const { error } = await supabaseAdmin.from('postavke')
    .upsert({ kljuc, vrijednost: vrijednost || '', shop_id: shopId || null }, { onConflict: 'kljuc,shop_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// Helper — dohvati shop_id iz headera ili query params
const MAIN_HOSTS = ['nibis-webshop.vercel.app', 'localhost', '127.0.0.1']

async function getShopId(req: NextRequest): Promise<string | null> {
  // 1. Explicit shop_id (super admin)
  const shopId = req.nextUrl.searchParams.get('shop_id')
  if (shopId) return shopId

  // 2. ?shop=slug query param
  const shopSlug = req.nextUrl.searchParams.get('shop')
  if (shopSlug) {
    const { data } = await supabaseAdmin.from('shopovi').select('id').eq('slug', shopSlug).eq('status', 'aktivan').single()
    return data?.id || null
  }

  // 3. Custom domena ili subdomena
  const hostname = (req.headers.get('host') || '').split(':')[0]

  // Glavni shop — vrati null (čita globalne postavke)
  if (MAIN_HOSTS.some(h => hostname === h || hostname.endsWith('.vercel.app'))) return null

  // Traži po custom domeni ili subdomeni
  const { data } = await supabaseAdmin.from('shopovi')
    .select('id')
    .or(`domena.eq.${hostname},slug.eq.${hostname.split('.')[0]}`)
    .eq('status', 'aktivan')
    .single()

  return data?.id || null
}

export async function GET(req: NextRequest) {
  const kljuci = req.nextUrl.searchParams.get('kljuci')?.split(',') ?? []
  const shopId = await getShopId(req)

  let q = supabase.from('postavke').select('kljuc, vrijednost')
    .in('kljuc', kljuci.length > 0 ? kljuci : ['_'])

  // Filter po shopu ako postoji, inače vrati globalne (shop_id null)
  if (shopId) {
    q = q.or(`shop_id.eq.${shopId},shop_id.is.null`)
  } else {
    q = q.is('shop_id', null)
  }

  const { data } = await q

  // Shop-specific postavke imaju prioritet nad globalnim
  const map: Record<string, string> = {}
  // Prvo globalne
  data?.filter(p => !(p as any).shop_id).forEach(p => { map[p.kljuc] = p.vrijednost })
  // Pa shop-specific (override)
  data?.filter(p => (p as any).shop_id).forEach(p => { map[p.kljuc] = p.vrijednost })

  return NextResponse.json(map, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
  })
}

export async function POST(req: NextRequest) {
  const shopId = await getShopId(req)
  const body = await req.json()
  
  // Bulk save - array of {kljuc, vrijednost}
  if (Array.isArray(body)) {
    const rows = body.map(({ kljuc, vrijednost }: any) => ({
      kljuc, vrijednost: vrijednost || '', shop_id: shopId || null
    }))
    const { error } = await supabaseAdmin.from('postavke')
      .upsert(rows, { onConflict: 'kljuc,shop_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }
  
  // Single save
  const { kljuc, vrijednost } = body
  const { error } = await supabaseAdmin.from('postavke')
    .upsert({ kljuc, vrijednost: vrijednost || '', shop_id: shopId || null }, { onConflict: 'kljuc,shop_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

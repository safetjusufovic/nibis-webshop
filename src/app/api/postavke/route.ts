import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Keš shop slug -> id (u memoriji servera, traje dok je instanca topla)
const shopIdCache = new Map<string, { id: string | null; ts: number }>()
const SHOP_CACHE_MS = 60_000

async function getShopId(req: NextRequest): Promise<string | null> {
  const shopSlug = req.nextUrl.searchParams.get('shop') || 'main'
  const cached = shopIdCache.get(shopSlug)
  if (cached && Date.now() - cached.ts < SHOP_CACHE_MS) return cached.id
  const { data } = await supabaseAdmin
    .from('shopovi').select('id')
    .eq('slug', shopSlug).eq('status', 'aktivan').single()
  const id = data?.id || null
  shopIdCache.set(shopSlug, { id, ts: Date.now() })
  return id
}

export async function GET(req: NextRequest) {
  const kljuci = req.nextUrl.searchParams.get('kljuci')?.split(',') ?? []
  const shopId = await getShopId(req)
  if (!shopId) return NextResponse.json({})

  const { data } = await supabaseAdmin
    .from('postavke')
    .select('kljuc, vrijednost')
    .in('kljuc', kljuci.length > 0 ? kljuci : ['_'])
    .eq('shop_id', shopId)

  const map: Record<string, string> = {}
  data?.forEach(p => { map[p.kljuc] = p.vrijednost })

  return NextResponse.json(map, {
    headers: {
      // Keširaj 30s na CDN-u, dozvoli stale-while-revalidate za brzinu
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120'
    }
  })
}

export async function POST(req: NextRequest) {
  const shopId = await getShopId(req)
  if (!shopId) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
  
  const body = await req.json()

  if (Array.isArray(body)) {
    const rows = body.map(({ kljuc, vrijednost }: any) => ({
      kljuc, vrijednost: vrijednost || '', shop_id: shopId
    }))
    const { error } = await supabaseAdmin.from('postavke')
      .upsert(rows, { onConflict: 'kljuc,shop_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const { kljuc, vrijednost } = body
  const { error } = await supabaseAdmin.from('postavke')
    .upsert({ kljuc, vrijednost: vrijednost || '', shop_id: shopId }, { onConflict: 'kljuc,shop_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

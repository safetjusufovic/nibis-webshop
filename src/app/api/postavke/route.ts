import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Helper — dohvati shop_id iz headera ili query params
async function getShopId(req: NextRequest): Promise<string | null> {
  // 1. Explicit shop_id (super admin)
  const shopId = req.nextUrl.searchParams.get('shop_id')
  if (shopId) return shopId

  // 2. ?shop=slug query param (multi-tenant na istoj domeni)
  const shopSlug = req.nextUrl.searchParams.get('shop')
  if (shopSlug) {
    const { data } = await supabase.from('shopovi').select('id').eq('slug', shopSlug).eq('status', 'aktivan').single()
    return data?.id || null
  }

  // 3. Hostname → shop lookup (custom domena ili subdomena)
  const hostname = (req.headers.get('host') || '').split(':')[0]
  const slug = hostname.split('.')[0]

  // Ne tražimo za localhost ili vercel preview
  if (['localhost', 'nibis-webshop', '127'].includes(slug)) return null

  const { data } = await supabase.from('shopovi')
    .select('id')
    .or(`slug.eq.${slug},domena.eq.${hostname}`)
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
  const { kljuc, vrijednost, shop_id } = await req.json()
  const { error } = await supabase.from('postavke')
    .upsert({ kljuc, vrijednost, shop_id: shop_id || null }, { onConflict: 'kljuc' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Proxy za ERP slike koje traže autentifikaciju.
// Kupčev browser zove /api/slika-proxy?artikal=123&shop=slug
// Server dohvati sliku s ERP ključem i servira je (browser ne vidi ključ).

// Keš dohvaćenih slika (u memoriji, dok je instanca topla)
const cache = new Map<string, { buf: ArrayBuffer; type: string; ts: number }>()
const CACHE_MS = 10 * 60 * 1000 // 10 min

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url') || ''
  const shopSlug = req.nextUrl.searchParams.get('shop') || 'main'

  if (!url) return new NextResponse('Nedostaje url', { status: 400 })

  // Sigurnost — dozvoli samo http(s) URL-ove
  if (!/^https?:\/\//.test(url)) return new NextResponse('Nevažeći url', { status: 400 })

  const cacheKey = shopSlug + '|' + url
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    return new NextResponse(cached.buf, {
      headers: { 'Content-Type': cached.type, 'Cache-Control': 'public, max-age=3600' },
    })
  }

  // Dohvati shop ERP config za autentifikaciju slike
  const { data: shop } = await supabaseAdmin
    .from('shopovi')
    .select('nibis_api_key, erp_rest_config, slika_auth_header, slika_auth_value')
    .eq('slug', shopSlug)
    .single()

  // Headeri za autentifikaciju slike (ako shop ima konfigurisano)
  const headers: Record<string, string> = {}
  const authHeader = (shop as any)?.slika_auth_header
  const authValue = (shop as any)?.slika_auth_value
  if (authHeader && authValue) {
    headers[authHeader] = authValue
  } else if (shop?.nibis_api_key) {
    // Fallback — probaj NIBIS ključ (ovisi kako ERP štiti slike)
    headers['Authorization'] = 'Bearer ' + shop.nibis_api_key
  }

  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) })
    if (!res.ok) return new NextResponse('Slika nedostupna (' + res.status + ')', { status: 404 })

    const buf = await res.arrayBuffer()
    const type = res.headers.get('content-type') || 'image/jpeg'
    cache.set(cacheKey, { buf, type, ts: Date.now() })

    return new NextResponse(buf, {
      headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' },
    })
  } catch (e: any) {
    return new NextResponse('Greška: ' + e.message, { status: 500 })
  }
}

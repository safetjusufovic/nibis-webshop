import { NextRequest, NextResponse } from 'next/server'

const MAIN_HOSTS = ['nibis-webshop.vercel.app', 'localhost', '127.0.0.1']

// In-memory cache (po edge instanci) da ne pitamo bazu svaki put
const domainCache = new Map<string, { slug: string | null; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 min

async function resolveSlug(req: NextRequest, hostname: string): Promise<string | null> {
  const cached = domainCache.get(hostname)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.slug

  try {
    const url = new URL('/api/resolve-domain', req.url)
    url.searchParams.set('domain', hostname)
    const res = await fetch(url.toString())
    const data = await res.json()
    domainCache.set(hostname, { slug: data.slug, ts: Date.now() })
    return data.slug
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get('host')?.split(':')[0] ?? ''
  const pathname = req.nextUrl.pathname

  // Preskoči API, statiku
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Glavni shop ili vercel domena - pusti normalno
  if (MAIN_HOSTS.some(h => hostname === h) || hostname.endsWith('.vercel.app')) {
    return NextResponse.next()
  }

  // Custom domena - nađi shop slug
  const slug = await resolveSlug(req, hostname)
  if (!slug) {
    // Nepoznata domena - pusti na glavni shop
    return NextResponse.next()
  }

  // Ako putanja već počinje sa /slug, ne diraj (izbjegni dvostruko)
  if (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)) {
    return NextResponse.next()
  }

  // Rewrite: novishop.ba/katalog -> interno /novishop/katalog (URL ostaje čist)
  const url = req.nextUrl.clone()
  url.pathname = `/${slug}${pathname === '/' ? '' : pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!_next|api|favicon).*)'],
}

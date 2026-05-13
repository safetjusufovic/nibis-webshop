import { NextRequest, NextResponse } from 'next/server'

const MAIN_HOSTS = ['nibis-webshop.vercel.app', 'localhost', '127.0.0.1']

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host')?.split(':')[0] ?? ''
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // Preskoči API, statiku, admin
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Ako već ima shop param, pusti
  if (url.searchParams.get('shop')) return NextResponse.next()

  // Glavni shop — pusti
  if (MAIN_HOSTS.some(h => hostname === h) || hostname.endsWith('.vercel.app')) {
    return NextResponse.next()
  }

  // Custom domena ili subdomena — API rute rješavaju po hostu automatski
  // Za frontend — pokušaj sačuvati shop iz referer-a
  const referer = req.headers.get('referer') || ''
  if (referer) {
    try {
      const refShop = new URL(referer).searchParams.get('shop')
      if (refShop) {
        url.searchParams.set('shop', refShop)
        return NextResponse.redirect(url)
      }
    } catch {}
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|favicon).*)'],
}

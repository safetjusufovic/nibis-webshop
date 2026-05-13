import { NextRequest, NextResponse } from 'next/server'

// Hostovi koji su glavni shop — ne redirectuju
const MAIN_HOSTS = [
  'nibis-webshop.vercel.app',
  'localhost',
  '127.0.0.1',
]

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host')?.split(':')[0] ?? ''
  const url = req.nextUrl.clone()

  // Ako je već ima ?shop= param, pusti
  if (url.searchParams.get('shop')) return NextResponse.next()

  // Ako je glavni shop ili API ruta, pusti
  if (MAIN_HOSTS.some(h => hostname === h || hostname.endsWith('.vercel.app'))) {
    return NextResponse.next()
  }

  // Custom domena ili subdomena — dodaj shop param interno
  // Ne radimo redirect, nego rewrite da URL ostane čist
  // Shop se dohvata u API rutama direktno po hostu
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|favicon).*)'],
}

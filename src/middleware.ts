import { NextRequest, NextResponse } from 'next/server'

const MAIN_HOSTS = ['nibis-webshop.vercel.app', 'localhost', '127.0.0.1']

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host')?.split(':')[0] ?? ''
  const pathname = req.nextUrl.pathname

  // Preskoči API, statiku, admin, super-admin
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Glavni shop ili vercel domena - pusti
  if (MAIN_HOSTS.some(h => hostname === h) || hostname.endsWith('.vercel.app')) {
    return NextResponse.next()
  }

  // Custom domena klijenta - API rute rješavaju izolaciju po hostu automatski
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|favicon).*)'],
}

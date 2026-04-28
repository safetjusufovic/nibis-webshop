import { NextRequest, NextResponse } from 'next/server'

const PUBLIC = ['/login', '/register', '/api/']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  if (PUBLIC.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Supabase koristi sb-[project-ref]-auth-token cookie
  const cookies = req.cookies.getAll()
  const hasSession = cookies.some(c => 
    c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )

  if (!hasSession) {
    const url = new URL('/login', req.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

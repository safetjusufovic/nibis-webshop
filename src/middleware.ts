import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Preskoči API rute, admin, statičke fajlove i login
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Provjeri maintenance mode
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('postavke')
      .select('vrijednost')
      .eq('kljuc', 'shop_maintenance')
      .single()

    if (data?.vrijednost === 'true') {
      // Provjeri da li je admin (ima cookie sesije)
      const sessionCookie = req.cookies.get('sb-access-token') ||
        req.cookies.get('supabase-auth-token')

      if (!sessionCookie) {
        return new NextResponse(
          `<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Održavanje</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: DM Sans, sans-serif; background: #F8FAFA; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .box { text-align: center; padding: 48px 32px; max-width: 440px; }
    .emoji { font-size: 56px; margin-bottom: 20px; }
    h1 { font-size: 24px; font-weight: 700; color: #0D1F1A; margin-bottom: 10px; }
    p { font-size: 15px; color: #6B8279; line-height: 1.6; margin-bottom: 28px; }
    a { display: inline-block; padding: 12px 28px; background: #0F6E56; color: white; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="box">
    <div class="emoji">🔧</div>
    <h1>Privremeno nedostupno</h1>
    <p>Webshop je trenutno u održavanju. Molimo pokušajte malo kasnije.</p>
    <a href="/login">Admin prijava</a>
  </div>
</body>
</html>`,
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
      }
    }
  } catch {
    // Ako ne možemo provjeriti — propusti (ne blokiraj)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

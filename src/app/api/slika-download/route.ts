import { NextRequest, NextResponse } from 'next/server'

// Skine sliku s vanjskog URL-a (zaobilazi hotlink zaštitu + Google zamotane URL-ove)
// i vrati je kao binarne podatke da je frontend uploaduje u Storage.
export async function POST(req: NextRequest) {
  let { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'Nedostaje URL' }, { status: 400 })

  // Izvuci pravi URL iz Google "imgres" zamotanog linka
  try {
    if (url.includes('google.com/imgres') || url.includes('imgurl=')) {
      const u = new URL(url)
      const imgurl = u.searchParams.get('imgurl')
      if (imgurl) url = decodeURIComponent(imgurl)
    }
  } catch {}

  if (!/^https?:\/\//.test(url)) return NextResponse.json({ error: 'Nevažeći URL' }, { status: 400 })

  try {
    const res = await fetch(url, {
      headers: {
        // Pretvaraj se da je browser — zaobilazi neke hotlink zaštite
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*',
        'Referer': new URL(url).origin,
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return NextResponse.json({ error: 'Slika nedostupna (HTTP ' + res.status + ')' }, { status: 400 })

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'URL ne vodi na sliku (' + (contentType || 'nepoznato') + ')' }, { status: 400 })
    }

    const buf = await res.arrayBuffer()
    if (buf.byteLength > 10 * 1024 * 1024) return NextResponse.json({ error: 'Slika prevelika' }, { status: 400 })

    // Vrati kao base64 da frontend napravi File i uploaduje u Storage
    const base64 = Buffer.from(buf).toString('base64')
    return NextResponse.json({ data: base64, contentType, ext: contentType.split('/')[1]?.split('+')[0] || 'jpg' })
  } catch (e: any) {
    return NextResponse.json({ error: 'Greška pri preuzimanju: ' + e.message }, { status: 500 })
  }
}

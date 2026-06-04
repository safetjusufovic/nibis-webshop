import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || ''
  if (!q) return NextResponse.json({ images: [] })

  const apiKey = process.env.GOOGLE_API_KEY
  const cx = process.env.GOOGLE_CX

  // Google Custom Search (preporučeno - pouzdano)
  if (apiKey && cx) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(q)}&searchType=image&num=10&imgSize=medium&imgType=photo&safe=active`
      )
      const data = await res.json()
      if (data.error) {
        // Vrati jasnu grešku da admin zna šta nije u redu
        return NextResponse.json({
          images: [],
          error: 'Google API: ' + (data.error.message || 'greška'),
        })
      }
      const images = (data.items || []).map((item: any) => item.link).filter(Boolean)
      return NextResponse.json({ images, source: 'google' })
    } catch (e: any) {
      return NextResponse.json({ images: [], error: 'Google poziv pao: ' + e.message })
    }
  }

  // Bez Google ključeva - pokušaj Bing scraping (manje pouzdano)
  try {
    const bingRes = await fetch(
      `https://www.bing.com/images/search?q=${encodeURIComponent(q)}&form=HDRSC2&first=1&count=12`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      }
    )
    if (bingRes.ok) {
      const html = await bingRes.text()
      const murls: string[] = []
      const murlRegex = /"murl":"([^"]+)"/g
      let match
      while ((match = murlRegex.exec(html)) !== null && murls.length < 12) {
        try {
          const url = decodeURIComponent(match[1])
          if (url.startsWith('http')) murls.push(url)
        } catch {}
      }
      if (murls.length > 0) return NextResponse.json({ images: murls, source: 'bing' })
    }
  } catch {}

  return NextResponse.json({
    images: [],
    error: 'Google API ključevi nisu postavljeni (GOOGLE_API_KEY, GOOGLE_CX), a Bing fallback nije vratio rezultate.',
  })
}

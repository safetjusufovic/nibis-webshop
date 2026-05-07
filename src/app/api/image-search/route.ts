import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || ''
  if (!q) return NextResponse.json({ images: [] })

  try {
    // Opcija 1: Google Custom Search API (ako je konfigurisan)
    const apiKey = process.env.GOOGLE_API_KEY
    const cx = process.env.GOOGLE_CX

    if (apiKey && cx) {
      const res = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(q)}&searchType=image&num=10&imgSize=medium&safe=active`
      )
      const data = await res.json()
      const images = (data.items || []).map((item: any) => item.link).filter(Boolean)
      return NextResponse.json({ images, source: 'google' })
    }

    // Opcija 2: DuckDuckGo Image Search (besplatno, bez API ključa)
    const ddgRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(q + ' product photo')}&iax=images&ia=images&format=json`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        }
      }
    )

    if (ddgRes.ok) {
      const text = await ddgRes.text()
      // Izvuci image URLs iz DDG odgovora
      const vqdMatch = text.match(/vqd=([\d-]+)/)
      if (vqdMatch) {
        const vqd = vqdMatch[1]
        const imgRes = await fetch(
          `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(q + ' product')}&vqd=${vqd}&f=,,,,,&p=1`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://duckduckgo.com/',
            }
          }
        )
        if (imgRes.ok) {
          const imgData = await imgRes.json()
          const images = (imgData.results || [])
            .slice(0, 12)
            .map((r: any) => r.thumbnail || r.image)
            .filter(Boolean)
          if (images.length > 0) {
            return NextResponse.json({ images, source: 'duckduckgo' })
          }
        }
      }
    }

    // Opcija 3: Bing Image Search (scraping)
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
      // Izvuci murl (media URL) vrijednosti
      const murls: string[] = []
      const murlRegex = /"murl":"([^"]+)"/g
      let match
      while ((match = murlRegex.exec(html)) !== null && murls.length < 12) {
        try {
          const url = decodeURIComponent(match[1])
          if (url.startsWith('http')) murls.push(url)
        } catch {}
      }
      if (murls.length > 0) {
        return NextResponse.json({ images: murls, source: 'bing' })
      }
    }

    return NextResponse.json({ images: [], source: 'none' })
  } catch (err) {
    return NextResponse.json({ images: [], error: 'Search failed' })
  }
}

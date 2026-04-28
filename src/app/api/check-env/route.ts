import { NextRequest, NextResponse } from 'next/server'
import { getStanje } from '@/lib/nibis'
import { siteConfig } from '@/lib/config'

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1')
  
  try {
    const data = await getStanje(siteConfig.orgJedId, page)
    return NextResponse.json({
      total: data.total,
      filtered: data.filtered,
      page: data.page,
      perPage: data.perPage,
      itemsCount: data.items.length,
      firstId: data.items[0]?.id,
      lastId: data.items[data.items.length - 1]?.id,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}

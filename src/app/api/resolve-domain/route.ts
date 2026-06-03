import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Mapira custom domenu na shop slug. Keširano 5 min.
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')
  if (!domain) return NextResponse.json({ slug: null })

  const { data } = await supabaseAdmin
    .from('shopovi')
    .select('slug')
    .eq('domena', domain)
    .eq('status', 'aktivan')
    .single()

  return NextResponse.json(
    { slug: data?.slug || null },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ id: null })

  const { data } = await supabaseAdmin
    .from('shopovi')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'aktivan')
    .single()

  return NextResponse.json({ id: data?.id || null }, {
    headers: { 'Cache-Control': 'public, s-maxage=300' }
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Javna ruta: vrati shop id za slug. Bezopasno - id nije tajna,
// a omogućava admin komponentama da rade bez super-admin secreta u browseru.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || 'main'
  const { data } = await supabaseAdmin
    .from('shopovi')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'aktivan')
    .maybeSingle()

  return NextResponse.json(
    { id: data?.id || null },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
  )
}

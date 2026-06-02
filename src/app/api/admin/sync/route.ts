import { NextRequest, NextResponse } from 'next/server'
import { runSync } from '@/lib/sync'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 60

// Admin sync - sinhronizuje SAMO trenutni shop (po slug-u)
export async function POST(req: NextRequest) {
  const { shop } = await req.json()
  const shopSlug = shop || 'main'

  // Dohvati shop_id
  const { data: shopData } = await supabaseAdmin
    .from('shopovi')
    .select('id')
    .eq('slug', shopSlug)
    .single()

  if (!shopData?.id) {
    return NextResponse.json({ ok: false, error: 'Shop nije pronađen' }, { status: 404 })
  }

  const result = await runSync(shopData.id)
  return NextResponse.json({ ok: result.success, ...result, shop: shopSlug, timestamp: new Date().toISOString() })
}

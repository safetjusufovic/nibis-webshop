import { NextRequest, NextResponse } from 'next/server'
import { syncChunk } from '@/lib/sync'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 10 // Free plan limit

// Admin sync - chunk po chunk (jedna stranica po pozivu)
// Frontend poziva ovo u petlji dok ima više stranica
export async function POST(req: NextRequest) {
  const { shop, what, page } = await req.json()
  const shopSlug = shop || 'main'

  const { data: shopData } = await supabaseAdmin
    .from('shopovi')
    .select('id')
    .eq('slug', shopSlug)
    .single()

  if (!shopData?.id) {
    return NextResponse.json({ ok: false, error: 'Shop nije pronađen' }, { status: 404 })
  }

  const result = await syncChunk(shopData.id, what || 'grupe', page || 1)
  return NextResponse.json({ ok: true, ...result })
}

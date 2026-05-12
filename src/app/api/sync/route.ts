import { NextRequest, NextResponse } from 'next/server'
import { runSync, runIncrementalSync } from '@/lib/sync'
import { testConnection, defaultConfig, NibisConfig } from '@/lib/nibis'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET
  const isVercelCron = authHeader === `Bearer ${cronSecret}`
  const isManual = req.nextUrl.searchParams.get('secret') === cronSecret

  if (cronSecret && !isVercelCron && !isManual) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const shopId = req.nextUrl.searchParams.get('shop_id') || undefined
  const incremental = req.nextUrl.searchParams.get('incremental') === 'true'
  const minutes = parseInt(req.nextUrl.searchParams.get('minutes') || '5')

  // Ako nema shop_id, synca SVE aktivne shopove
  if (!shopId) {
    const { data: shopovi } = await supabaseAdmin
      .from('shopovi')
      .select('id, naziv, nibis_api_url, nibis_api_key')
      .eq('status', 'aktivan')
      .not('nibis_api_url', 'is', null)

    if (!shopovi?.length) {
      // Samo default shop
      const result = incremental ? await runIncrementalSync(minutes) : await runSync()
      return NextResponse.json({ ok: result.success, ...result, timestamp: new Date().toISOString() })
    }

    // Synca svaki shop paralelno
    const results = await Promise.allSettled(
      shopovi.map(s => incremental ? runIncrementalSync(minutes, s.id) : runSync(s.id))
    )

    const summary = results.map((r, i) => ({
      shop: shopovi[i].naziv,
      shop_id: shopovi[i].id,
      ...(r.status === 'fulfilled' ? r.value : { success: false, error: String(r.reason) })
    }))

    return NextResponse.json({ ok: true, shops: summary, timestamp: new Date().toISOString() })
  }

  // Sync specifičnog shopa
  const result = incremental
    ? await runIncrementalSync(minutes, shopId)
    : await runSync(shopId)

  return NextResponse.json({ ok: result.success, ...result, shop_id: shopId, timestamp: new Date().toISOString() })
}

// Test konekcije — provjeri da li API radi bez full sync
export async function POST(req: NextRequest) {
  const { shop_id, nibis_api_url, nibis_api_key } = await req.json()

  const config: NibisConfig = nibis_api_url && nibis_api_key
    ? { baseUrl: nibis_api_url, apiKey: nibis_api_key }
    : shop_id
    ? await (async () => {
        const { data } = await supabaseAdmin.from('shopovi').select('nibis_api_url, nibis_api_key').eq('id', shop_id).single()
        return { baseUrl: data?.nibis_api_url || '', apiKey: data?.nibis_api_key || '' }
      })()
    : defaultConfig

  const result = await testConnection(config)
  return NextResponse.json(result)
}

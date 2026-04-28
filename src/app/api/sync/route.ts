import { NextRequest, NextResponse } from 'next/server'
import { runSync, runSyncPartial } from '@/lib/sync'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET
  const isVercelCron = authHeader === `Bearer ${cronSecret}`
  const isManual = req.nextUrl.searchParams.get('secret') === cronSecret

  if (cronSecret && !isVercelCron && !isManual) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const only = req.nextUrl.searchParams.get('only')
  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1')

  console.log('[SYNC] Pokrenuto:', new Date().toISOString(), only ? `only=${only}` : 'full')

  const result = only
    ? await runSyncPartial(only, page)
    : await runSync()

  return NextResponse.json({ ok: result.success, ...result, timestamp: new Date().toISOString() })
}

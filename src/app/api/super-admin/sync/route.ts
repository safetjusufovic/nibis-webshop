import { NextRequest, NextResponse } from 'next/server'
import { runSync, runIncrementalSync } from '@/lib/sync'

function isAuth(req: NextRequest) {
  const secret = req.headers.get('x-super-admin-secret')
  return secret === (process.env.SUPER_ADMIN_SECRET || 'nibis-super-2025')
}

export const maxDuration = 60

export async function GET(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = req.nextUrl.searchParams.get('shop_id')
  if (!shopId) return NextResponse.json({ error: 'shop_id obavezan' }, { status: 400 })

  const incremental = req.nextUrl.searchParams.get('incremental') === 'true'
  const result = incremental
    ? await runIncrementalSync(5, shopId)
    : await runSync(shopId)

  return NextResponse.json({ ok: result.success, ...result, timestamp: new Date().toISOString() })
}

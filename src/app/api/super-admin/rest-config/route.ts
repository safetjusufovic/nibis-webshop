import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const SECRET = process.env.SUPER_ADMIN_SECRET || 'nibis-super-2025'
function isAuth(req: NextRequest) { return req.headers.get('x-super-admin-secret') === SECRET }

// Snimi REST config za shop i postavi erp_tip na custom_rest
export async function POST(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { shopId, config } = await req.json()
  if (!shopId || !config) return NextResponse.json({ error: 'shopId i config obavezni' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('shopovi')
    .update({ erp_tip: 'custom_rest', erp_rest_config: config, nibis_api_url: config.baseUrl })
    .eq('id', shopId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Dohvati postojeći config
export async function GET(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const shopId = req.nextUrl.searchParams.get('shopId')
  if (!shopId) return NextResponse.json({ error: 'shopId obavezan' }, { status: 400 })
  const { data } = await supabaseAdmin.from('shopovi').select('erp_rest_config').eq('id', shopId).single()
  return NextResponse.json({ config: data?.erp_rest_config || null })
}

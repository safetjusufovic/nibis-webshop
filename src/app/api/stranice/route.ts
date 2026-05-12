import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

async function resolveShopId(req: NextRequest): Promise<string | null> {
  const shopSlug = req.nextUrl.searchParams.get('shop')
  if (!shopSlug) return null
  const { data } = await supabaseAdmin.from('shopovi').select('id').eq('slug', shopSlug).eq('status', 'aktivan').single()
  return data?.id || null
}

export async function GET(req: NextRequest) {
  const tip = req.nextUrl.searchParams.get('tip')
  const slug = req.nextUrl.searchParams.get('slug')
  const sve = req.nextUrl.searchParams.get('sve')
  const shopId = await resolveShopId(req)

  let q = supabase.from('stranice').select('*').order('redoslijed').order('created_at', { ascending: false })

  if (slug) q = q.eq('slug', slug).single() as any
  if (tip) q = q.eq('tip', tip)
  if (!sve) q = q.eq('objavljen', true)

  // Shop izolacija
  if (shopId) {
    q = q.eq('shop_id', shopId)
  } else {
    q = q.is('shop_id', null)
  }

  const { data, error } = await q as any
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const shopId = await resolveShopId(req)
  const { data, error } = await supabase.from('stranice').insert({
    ...body,
    ...(shopId && { shop_id: shopId }),
    updated_at: new Date().toISOString(),
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body
  const { data, error } = await supabase.from('stranice').update({
    ...rest,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  const { error } = await supabase.from('stranice').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

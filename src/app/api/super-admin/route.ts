import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Jednostavna auth provjera — Super Admin Secret iz env
function isAuth(req: NextRequest) {
  const secret = req.headers.get('x-super-admin-secret')
  return secret === (process.env.SUPER_ADMIN_SECRET || 'nibis-super-2025')
}

// GET — lista shopova
export async function GET(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('shopovi')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — kreiraj shop
export async function POST(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { naziv, slug, domena, plan, admin_email, nibis_api_url, nibis_api_key } = body

  if (!naziv || !admin_email) {
    return NextResponse.json({ error: 'Naziv i email su obavezni' }, { status: 400 })
  }

  // Kreiraj shop
  const { data: shop, error: shopErr } = await supabaseAdmin
    .from('shopovi')
    .insert({ naziv, slug, domena: domena || null, plan, admin_email, nibis_api_url: nibis_api_url || null, nibis_api_key: nibis_api_key || null, status: 'aktivan' })
    .select()
    .single()

  if (shopErr) return NextResponse.json({ error: shopErr.message }, { status: 500 })

  // Default postavke
  await supabaseAdmin.from('postavke').insert([
    { kljuc: 'shop_naziv', vrijednost: naziv, shop_id: shop.id },
    { kljuc: 'shop_email', vrijednost: admin_email, shop_id: shop.id },
    { kljuc: 'theme_primary_boja', vrijednost: '#0F6E56', shop_id: shop.id },
    { kljuc: 'shop_template', vrijednost: 'default', shop_id: shop.id },
  ])

  return NextResponse.json(shop)
}

// PATCH — update status
export async function PATCH(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status, nibis_api_url, nibis_api_key } = await req.json()
  const updates: any = { updated_at: new Date().toISOString() }
  if (status !== undefined) updates.status = status
  if (nibis_api_url !== undefined) updates.nibis_api_url = nibis_api_url
  if (nibis_api_key !== undefined) updates.nibis_api_key = nibis_api_key

  const { error } = await supabaseAdmin.from('shopovi').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE — obriši shop
export async function DELETE(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const { error } = await supabaseAdmin.from('shopovi').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

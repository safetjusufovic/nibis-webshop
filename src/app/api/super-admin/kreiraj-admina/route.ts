import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const SECRET = process.env.SUPER_ADMIN_SECRET || 'nibis-super-2025'

// Kreira admin korisnika za određeni shop
export async function POST(req: NextRequest) {
  // Zaštita super-admin secretom
  if (req.headers.get('x-super-admin-secret') !== SECRET) {
    return NextResponse.json({ error: 'Neovlašteno' }, { status: 401 })
  }

  const { email, lozinka, ime, shopId } = await req.json()
  if (!email || !lozinka || !shopId) {
    return NextResponse.json({ error: 'Trebaju email, lozinka i shopId' }, { status: 400 })
  }
  if (lozinka.length < 6) {
    return NextResponse.json({ error: 'Lozinka mora imati najmanje 6 znakova' }, { status: 400 })
  }

  // Provjeri postoji li shop
  const { data: shop } = await supabaseAdmin
    .from('shopovi').select('id, naziv').eq('id', shopId).maybeSingle()
  if (!shop) return NextResponse.json({ error: 'Shop ne postoji' }, { status: 404 })

  // 1. Kreiraj Supabase Auth korisnika
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: lozinka,
    email_confirm: true,  // odmah potvrđen, ne treba verifikacija
  })

  if (authError) {
    // Ako korisnik već postoji, probaj ga samo unaprijediti u admina
    if (authError.message?.includes('already') || authError.status === 422) {
      // Nađi postojećeg po emailu
      const { data: list } = await supabaseAdmin.auth.admin.listUsers()
      const postojeci = list?.users?.find((u: any) => u.email === email)
      if (postojeci) {
        await supabaseAdmin.from('korisnici').upsert({
          id: postojeci.id, ime: ime || email, odobren: true, role: 'admin', shop_id: shopId,
        })
        return NextResponse.json({ ok: true, vec_postojao: true })
      }
    }
    return NextResponse.json({ error: 'Auth greška: ' + authError.message }, { status: 500 })
  }

  // 2. Kreiraj profil s role=admin i shop_id
  await supabaseAdmin.from('korisnici').upsert({
    id: authData.user.id,
    ime: ime || email,
    odobren: true,
    role: 'admin',
    shop_id: shopId,
  })

  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendAccountApproved } from '@/lib/email'
import { siteConfig } from '@/lib/config'

export async function POST(req: NextRequest) {
  try {
    const { zahtjevId, userId, ime, prezime, email, partnerId } = await req.json()

    // Dohvati shop_id iz zahtjeva
    const { data: zahtjev } = await supabaseAdmin
      .from('registracija_zahtjevi')
      .select('shop_id')
      .eq('id', zahtjevId)
      .single()

    const shopId = zahtjev?.shop_id ?? null
    if (!shopId) {
      return NextResponse.json({ error: 'Zahtjev nema shop_id - ne mogu odobriti' }, { status: 400 })
    }

    // Kreiraj korisnik profil sa shop_id
    await supabaseAdmin.from('korisnici').upsert({
      id: userId,
      ime,
      prezime,
      odobren: true,
      role: 'kupac',
      partner_id: partnerId ?? null,
      shop_id: shopId,
    })

    // Označi zahtjev
    await supabaseAdmin.from('registracija_zahtjevi').update({ odobren: true }).eq('id', zahtjevId)

    // Email obavijest
    if (email) {
      await sendAccountApproved({
        toEmail: email,
        imeKupca: `${ime ?? ''} ${prezime ?? ''}`.trim() || email,
        shopName: siteConfig.name,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

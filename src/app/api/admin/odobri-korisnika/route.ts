import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendAccountApproved } from '@/lib/email'
import { siteConfig } from '@/lib/config'

export async function POST(req: NextRequest) {
  try {
    const { zahtjevId, userId, ime, prezime, email, partnerId } = await req.json()

    // Kreiraj korisnik profil
    await supabaseAdmin.from('korisnici').upsert({
      id: userId,
      ime,
      prezime,
      odobren: true,
      role: 'kupac',
      partner_id: partnerId ?? null,
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

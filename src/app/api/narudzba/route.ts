import { NextRequest, NextResponse } from 'next/server'
import { createNarudzba } from '@/lib/nibis'
import { supabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { siteConfig } from '@/lib/config'
import { sendOrderConfirmation, sendAdminOrderNotification } from '@/lib/email'
import type { NarudzbaCreate } from '@/types/nibis'

export async function POST(req: NextRequest) {
  try {
    // 1. Provjeri autentikaciju — uzmi JWT iz Authorization headera
    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')

    // Kreiraj klijent sa korisnikovim tokenom da dobijemo njegov profil
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Neovlašten pristup' }, { status: 401 })
    }

    // 2. Uzmi profil korisnika — partner_id je NIBIS ID partnera
    const { data: korisnik } = await supabaseAdmin
      .from('korisnici')
      .select('id, partner_id, odobren, role, partneri:partner_id(id, naziv, rabat)')
      .eq('id', user.id)
      .single()

    if (!korisnik || !korisnik.odobren) {
      return NextResponse.json({ error: 'Račun nije odobren' }, { status: 403 })
    }

    const body = await req.json()
    const externalId = `WEB-${Date.now()}-${user.id.slice(0, 8)}`

    const payload: NarudzbaCreate = {
      orgJedId: siteConfig.orgJedId,
      datum: new Date().toISOString(),
      rbrAuto: true,
      rbr: null,
      // partnerId dolazi iz Supabase profila — NIBIS ID partnera
      partnerId: korisnik.partner_id ?? null,
      knjigaFakturaId: null,
      externalId,
      datumVazenja: null,
      rokPlacanja: null,
      valutaId: null,
      nacinIsporukeId: null,
      datumIsporukeOd: null,
      datumIsporukeDo: null,
      nacinPlacanja: body.nacinPlacanja ?? 'Virman',
      sredstvoPlacanjaId: null,
      nacinOdredjivanjaCijene: 'StandardnaProdaja',
      nacinObracunaPoreza: 'SaPorezom',
      komercijalistId: null,
      opis1: body.napomena ?? null,
      opis2: null,
      opis3: null,
      napomena: body.napomena ?? null,
      stavke: body.stavke,
    }

    // 3. Pošalji u NIBIS
    const nibisResult = await createNarudzba(payload)

    // 4. Spremi u Supabase
    // jedinicnaCijena je vpcijena = BEZ PDV-a (osnovica)
    const ukupnoBez = body.stavke.reduce((s: number, st: any) => {
      return s + st.kolicina * st.jedinicnaCijena
    }, 0)
    const ukupnoPorez = body.stavke.reduce((s: number, st: any) => {
      return s + st.kolicina * st.jedinicnaCijena * ((st.poreskaStopa ?? 0) / 100)
    }, 0)
    const ukupnoSa = Math.round((ukupnoBez + ukupnoPorez) * 100) / 100

    const { data: narudzba } = await supabaseAdmin
      .from('narudzbe')
      .insert({
        korisnik_id: user.id,
        partner_id: korisnik.partner_id,
        nibis_id: nibisResult.id,
        nibis_oznaka: nibisResult.oznakaDokumenta,
        nibis_external_id: externalId,
        org_jed_id: payload.orgJedId,
        ukupno_bez_poreza: Math.round(ukupnoBez * 100) / 100,
        ukupno_porez: Math.round(ukupnoPorez * 100) / 100,
        ukupno_sa_porezom: ukupnoSa,
        nacin_placanja: payload.nacinPlacanja,
        napomena: payload.napomena,
        status: 'poslana',
      })
      .select('id')
      .single()

    if (narudzba) {
      await supabaseAdmin.from('narudzba_stavke').insert(
        body.stavke.map((st: any) => ({
          narudzba_id: narudzba.id,
          artikal_id: st.artikalId,
          naziv: st.naziv,
          sifra: st.sifra ?? '',
          kolicina: st.kolicina,
          jedinicna_cijena: st.jedinicnaCijena,
          poreska_stopa: st.poreskaStopa ?? 0,
        }))
      )
    }

    // 5. Email notifikacije (ne blokiramo response)
    const userEmail = user.email ?? ''
    const imeKupca = korisnik ? `${(korisnik as any).ime ?? ''} ${(korisnik as any).prezime ?? ''}`.trim() || userEmail : userEmail
    const partnerNaziv = (korisnik?.partneri as any)?.naziv ?? ''

    Promise.all([
      sendOrderConfirmation({
        toEmail: userEmail,
        imeKupca,
        oznakaDokumenta: nibisResult.oznakaDokumenta,
        ukupno: nibisResult.ukupnoSaPorezom,
        stavke: body.stavke.map((s: any) => ({ naziv: s.naziv, kolicina: s.kolicina, jedinicnaCijena: s.jedinicnaCijena })),
        nacinPlacanja: payload.nacinPlacanja,
        napomena: payload.napomena,
      }),
      sendAdminOrderNotification({
        oznakaDokumenta: nibisResult.oznakaDokumenta,
        partnerNaziv,
        korisnikIme: imeKupca,
        ukupno: nibisResult.ukupnoSaPorezom,
        stavkeCount: body.stavke.length,
      }),
    ]).catch(e => console.error('[EMAIL]', e))

    return NextResponse.json(nibisResult)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}

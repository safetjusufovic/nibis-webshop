import { NextRequest, NextResponse } from 'next/server'
import { createNarudzba } from '@/lib/nibis'
import { supabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { siteConfig } from '@/lib/config'
import { sendOrderConfirmation, sendAdminOrderNotification } from '@/lib/email'
import type { NarudzbaCreate, NibisConfig } from '@/types/nibis'

const MAIN_HOSTS = ['nibis-webshop.vercel.app', 'localhost', '127.0.0.1']

async function getShopConfig(req: NextRequest): Promise<{ shopId: string | null; nibisConfig: NibisConfig; orgJedId: number }> {
  const defaultConfig: NibisConfig = {
    baseUrl: process.env.NIBIS_API_URL ?? '',
    apiKey: process.env.NIBIS_API_KEY ?? '',
    companyYear: process.env.NIBIS_COMPANY_YEAR ?? new Date().getFullYear().toString(),
    orgJedId: parseInt(process.env.ORG_JED_ID ?? '1'),
  }

  // Čitaj shop iz query param ili hostnamea
  const shopSlug = req.nextUrl.searchParams.get('shop') || (() => {
    const host = (req.headers.get('host') || '').split(':')[0]
    if (MAIN_HOSTS.some(h => host === h) || host.endsWith('.vercel.app')) return 'main'
    return host.split('.')[0]
  })()

  const { data: shop } = await supabaseAdmin
    .from('shopovi')
    .select('id, nibis_api_url, nibis_api_key, org_jed_id, company_year')
    .eq('slug', shopSlug)
    .eq('status', 'aktivan')
    .single()

  if (!shop) return { shopId: null, nibisConfig: defaultConfig, orgJedId: defaultConfig.orgJedId ?? 1 }

  const nibisConfig: NibisConfig = shop.nibis_api_url && shop.nibis_api_key
    ? {
        baseUrl: shop.nibis_api_url,
        apiKey: shop.nibis_api_key,
        companyYear: shop.company_year?.toString() ?? new Date().getFullYear().toString(),
        orgJedId: shop.org_jed_id ?? 1,
      }
    : defaultConfig

  return {
    shopId: shop.id,
    nibisConfig,
    orgJedId: shop.org_jed_id ?? defaultConfig.orgJedId ?? 1,
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Shop config + tip cijene (treba prvo da znamo je li B2C)
    const { shopId, nibisConfig, orgJedId } = await getShopConfig(req)

    let tipCijene: 'vpcijena' | 'mpcijena' = 'vpcijena'
    let b2cPartnerId: number | null = null
    if (shopId) {
      const { data: postavke } = await supabaseAdmin
        .from('postavke').select('kljuc, vrijednost').eq('shop_id', shopId)
        .in('kljuc', ['tip_cijene', 'b2c_partner_id'])
      postavke?.forEach((p: any) => {
        if (p.kljuc === 'tip_cijene' && (p.vrijednost === 'mpcijena' || p.vrijednost === 'mp')) tipCijene = 'mpcijena'
        if (p.kljuc === 'b2c_partner_id' && p.vrijednost) b2cPartnerId = parseInt(p.vrijednost)
      })
    }
    const jeB2C = tipCijene === 'mpcijena'

    // 2. Auth — obavezan za B2B, opcionalan za B2C (gost može naručiti)
    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    let user: any = null
    if (token) {
      const supabaseUser = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      )
      const { data } = await supabaseUser.auth.getUser()
      user = data?.user ?? null
    }

    // B2B traži prijavu; B2C dozvoljava gosta
    if (!user && !jeB2C) {
      return NextResponse.json({ error: 'Prijava je obavezna za poslovne kupce' }, { status: 401 })
    }

    // SMTP postavke shopa (svaki shop svoje) + admin email
    let shopSmtp: any = undefined
    let shopAdminEmail: string | undefined = undefined
    if (shopId) {
      const { data: emailPostavke } = await supabaseAdmin
        .from('postavke').select('kljuc, vrijednost').eq('shop_id', shopId)
        .in('kljuc', ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'email_admin'])
      const ep: Record<string, string> = {}
      emailPostavke?.forEach((p: any) => { ep[p.kljuc] = p.vrijednost })
      if (ep.smtp_user && ep.smtp_pass) {
        shopSmtp = {
          host: ep.smtp_host || 'smtp.gmail.com',
          port: parseInt(ep.smtp_port || '465'),
          user: ep.smtp_user, pass: ep.smtp_pass,
          from: ep.smtp_from || ep.smtp_user,
        }
      }
      shopAdminEmail = ep.email_admin || undefined
    }

    // 3. Korisnik (samo ako je prijavljen; gost B2C nema profil)
    let korisnik: any = null
    if (user) {
      const { data } = await supabaseAdmin
        .from('korisnici')
        .select('id, partner_id, odobren, role, partneri:partner_id(id, naziv, rabat)')
        .eq('id', user.id)
        .single()
      korisnik = data
      if (!korisnik || !korisnik.odobren) {
        return NextResponse.json({ error: 'Račun nije odobren' }, { status: 403 })
      }
    }

    const body = await req.json()
    const externalId = `WEB-${Date.now()}-${user ? user.id.slice(0, 8) : 'gost'}`

    // Partner: prijavljeni → njegov partner; gost B2C → generički B2C partner
    const partnerIdZaNarudzbu = korisnik?.partner_id ?? b2cPartnerId ?? null

    // Gostovi podaci (B2C) — idu u napomenu jer NIBIS veže za generičkog partnera
    const gostInfo = (!user && body.gost)
      ? `KUPAC: ${body.gost.ime || ''} | Tel: ${body.gost.telefon || ''} | Email: ${body.gost.email || ''} | Adresa: ${body.gost.adresa || ''}`
      : ''

    const payload: NarudzbaCreate = {
      orgJedId,
      datum: new Date().toISOString(),
      rbrAuto: true,
      rbr: null,
      partnerId: partnerIdZaNarudzbu,
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
      napomena: [body.napomena, gostInfo].filter(Boolean).join(' || ') || null,
      stavke: body.stavke,
    }

    // 4. Izračunaj totale (prije slanja - trebaju i ako NIBIS padne)
    let ukupnoBez = 0, ukupnoPorez = 0
    body.stavke.forEach((st: any) => {
      const total = st.kolicina * st.jedinicnaCijena
      const stopa = (st.poreskaStopa ?? 0) / 100
      if (tipCijene === 'mpcijena') {
        const bez = total / (1 + stopa)
        ukupnoBez += bez
        ukupnoPorez += total - bez
      } else {
        ukupnoBez += total
        ukupnoPorez += total * stopa
      }
    })
    const ukupnoSa = Math.round((ukupnoBez + ukupnoPorez) * 100) / 100

    // 5. Pošalji u NIBIS — ali ako padne, narudžba se SVEJEDNO sprema (kupac ne gubi)
    let nibisResult: any = null
    let nibisGreska: string | null = null
    try {
      nibisResult = await createNarudzba(payload, nibisConfig)
    } catch (err: any) {
      nibisGreska = err?.message || String(err)
      console.error('[NARUDZBA] NIBIS pad:', nibisGreska)
    }

    // 6. Spremi u Supabase bez obzira na NIBIS
    // Ako NIBIS uspio → status 'poslana'; ako pao → 'ceka_nibis' (ručna obrada)
    const { data: narudzba } = await supabaseAdmin
      .from('narudzbe')
      .insert({
        korisnik_id: user?.id ?? null,
        partner_id: korisnik?.partner_id ?? b2cPartnerId ?? null,
        nibis_id: nibisResult?.id ?? null,
        nibis_oznaka: nibisResult?.oznakaDokumenta ?? null,
        nibis_external_id: externalId,
        org_jed_id: orgJedId,
        ukupno_bez_poreza: Math.round(ukupnoBez * 100) / 100,
        ukupno_porez: Math.round(ukupnoPorez * 100) / 100,
        ukupno_sa_porezom: ukupnoSa,
        nacin_placanja: payload.nacinPlacanja,
        napomena: payload.napomena,
        status: nibisResult ? 'poslana' : 'ceka_nibis',
        greska: nibisGreska,
        ...(shopId && { shop_id: shopId }),
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

    // 6. Email
    const userEmail = user?.email ?? body.gost?.email ?? ''
    const imeKupca = `${(korisnik as any).ime ?? ''} ${(korisnik as any).prezime ?? ''}`.trim() || userEmail
    const partnerNaziv = (korisnik?.partneri as any)?.naziv ?? ''

    Promise.all([
      sendOrderConfirmation({
        smtp: shopSmtp,
        toEmail: userEmail,
        imeKupca,
        oznakaDokumenta: nibisResult?.oznakaDokumenta ?? ('NAR-' + externalId.slice(-8)),
        ukupno: nibisResult?.ukupnoSaPorezom ?? ukupnoSa,
        stavke: body.stavke.map((s: any) => ({ naziv: s.naziv, kolicina: s.kolicina, jedinicnaCijena: s.jedinicnaCijena })),
        nacinPlacanja: payload.nacinPlacanja,
        napomena: payload.napomena,
      }),
      sendAdminOrderNotification({
        smtp: shopSmtp,
        adminEmail: shopAdminEmail,
        oznakaDokumenta: nibisResult?.oznakaDokumenta ?? ('NAR-' + externalId.slice(-8)),
        partnerNaziv,
        korisnikIme: imeKupca,
        ukupno: nibisResult?.ukupnoSaPorezom ?? ukupnoSa,
        stavkeCount: body.stavke.length,
      }),
    ]).catch(e => console.error('[EMAIL]', e))

    // Vrati uspjeh kupcu — narudžba je sigurno sačuvana (i ako NIBIS trenutno ne radi)
    if (nibisResult) {
      return NextResponse.json(nibisResult)
    } else {
      return NextResponse.json({
        id: narudzba?.id ?? null,
        oznakaDokumenta: 'NAR-' + externalId.slice(-8),
        ukupnoSaPorezom: ukupnoSa,
        _napomena: 'Narudžba je zaprimljena. Obrada u sistemu je u toku.',
      })
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}

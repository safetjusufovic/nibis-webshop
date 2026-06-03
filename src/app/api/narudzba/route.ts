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
    // 1. Auth
    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Neovlašten pristup' }, { status: 401 })
    }

    // 2. Shop config
    const { shopId, nibisConfig, orgJedId } = await getShopConfig(req)

    // Tip cijene shopa (vpcijena=B2B bez PDV, mpcijena=B2C sa PDV)
    let tipCijene: 'vpcijena' | 'mpcijena' = 'vpcijena'
    if (shopId) {
      const { data: tcPostavka } = await supabaseAdmin
        .from('postavke').select('vrijednost').eq('kljuc', 'tip_cijene').eq('shop_id', shopId).single()
      if (tcPostavka?.vrijednost === 'mpcijena' || tcPostavka?.vrijednost === 'mp') tipCijene = 'mpcijena'
    }

    // 3. Korisnik
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
      orgJedId,
      datum: new Date().toISOString(),
      rbrAuto: true,
      rbr: null,
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

    // 4. Pošalji u NIBIS - koristi shop-specific config
    const nibisResult = await createNarudzba(payload, nibisConfig)

    // 5. Spremi u Supabase
    let ukupnoBez = 0, ukupnoPorez = 0
    body.stavke.forEach((st: any) => {
      const total = st.kolicina * st.jedinicnaCijena
      const stopa = (st.poreskaStopa ?? 0) / 100
      if (tipCijene === 'mpcijena') {
        // MP cijena je SA PDV-om - izvlačimo PDV
        const bez = total / (1 + stopa)
        ukupnoBez += bez
        ukupnoPorez += total - bez
      } else {
        // VP cijena je BEZ PDV-a - dodajemo PDV
        ukupnoBez += total
        ukupnoPorez += total * stopa
      }
    })
    const ukupnoSa = Math.round((ukupnoBez + ukupnoPorez) * 100) / 100

    const { data: narudzba } = await supabaseAdmin
      .from('narudzbe')
      .insert({
        korisnik_id: user.id,
        partner_id: korisnik.partner_id,
        nibis_id: nibisResult.id,
        nibis_oznaka: nibisResult.oznakaDokumenta,
        nibis_external_id: externalId,
        org_jed_id: orgJedId,
        ukupno_bez_poreza: Math.round(ukupnoBez * 100) / 100,
        ukupno_porez: Math.round(ukupnoPorez * 100) / 100,
        ukupno_sa_porezom: ukupnoSa,
        nacin_placanja: payload.nacinPlacanja,
        napomena: payload.napomena,
        status: 'poslana',
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
    const userEmail = user.email ?? ''
    const imeKupca = `${(korisnik as any).ime ?? ''} ${(korisnik as any).prezime ?? ''}`.trim() || userEmail
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

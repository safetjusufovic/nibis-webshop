import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createNarudzba } from '@/lib/nibis'
import type { NibisConfig } from '@/types/nibis'

// Ponovo pošalji narudžbu u NIBIS (za narudžbe sa statusom ceka_nibis)
export async function POST(req: NextRequest) {
  const { narudzbaId, shop } = await req.json()
  if (!narudzbaId) return NextResponse.json({ error: 'Nedostaje narudzbaId' }, { status: 400 })

  // Dohvati narudžbu
  const { data: narudzba } = await supabaseAdmin
    .from('narudzbe').select('*').eq('id', narudzbaId).single()
  if (!narudzba) return NextResponse.json({ error: 'Narudžba nije pronađena' }, { status: 404 })
  if (narudzba.status === 'poslana' && narudzba.nibis_oznaka) {
    return NextResponse.json({ ok: true, oznaka: narudzba.nibis_oznaka, vec: true })
  }

  // Dohvati stavke
  const { data: stavke } = await supabaseAdmin
    .from('narudzba_stavke').select('*').eq('narudzba_id', narudzbaId)
  if (!stavke?.length) return NextResponse.json({ error: 'Narudžba nema stavki' }, { status: 400 })

  // Dohvati shop NIBIS config
  const { data: shopData } = await supabaseAdmin
    .from('shopovi').select('nibis_api_url, nibis_api_key, company_year, org_jed_id').eq('id', narudzba.shop_id).single()

  const config: NibisConfig = shopData?.nibis_api_url && shopData?.nibis_api_key
    ? { baseUrl: shopData.nibis_api_url, apiKey: shopData.nibis_api_key, companyYear: shopData.company_year?.toString() || new Date().getFullYear().toString(), orgJedId: shopData.org_jed_id || 1 }
    : { baseUrl: process.env.NIBIS_API_URL!, apiKey: process.env.NIBIS_API_KEY!, companyYear: process.env.NIBIS_COMPANY_YEAR || new Date().getFullYear().toString(), orgJedId: parseInt(process.env.ORG_JED_ID || '1') }

  const payload: any = {
    orgJedId: narudzba.org_jed_id || config.orgJedId,
    datum: new Date().toISOString(),
    rbrAuto: true, rbr: null,
    partnerId: narudzba.partner_id,
    externalId: narudzba.nibis_external_id || ('RESEND-' + narudzbaId),
    nacinPlacanja: narudzba.nacin_placanja || 'Virman',
    nacinOdredjivanjaCijene: 'StandardnaProdaja',
    nacinObracunaPoreza: 'SaPorezom',
    napomena: narudzba.napomena,
    stavke: stavke.map((s: any) => ({
      rbr: null, tip: 'Artikal',
      artikalId: s.artikal_id, naziv: s.naziv,
      kolicina: s.kolicina, jedinicnaCijena: s.jedinicna_cijena,
      poreskaStopa: s.poreska_stopa ?? 0,
    })),
  }

  try {
    const result = await createNarudzba(payload, config)
    await supabaseAdmin.from('narudzbe').update({
      status: 'poslana', nibis_id: result.id, nibis_oznaka: result.oznakaDokumenta, greska: null,
    }).eq('id', narudzbaId)
    return NextResponse.json({ ok: true, oznaka: result.oznakaDokumenta })
  } catch (e: any) {
    await supabaseAdmin.from('narudzbe').update({ greska: e.message }).eq('id', narudzbaId)
    return NextResponse.json({ ok: false, error: e.message })
  }
}

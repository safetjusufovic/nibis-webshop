import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createNarudzba } from '@/lib/nibis'
import type { NibisConfig } from '@/types/nibis'

// Monri callback - kupac se vraća nakon plaćanja
// Ako je uspjeh, šalje narudžbu u NIBIS
async function handleCallback(req: NextRequest, params: URLSearchParams) {
  const orderNumber = params.get('order') || ''
  const shopSlug = params.get('shop') || 'main'
  // Monri šalje status u GET/POST params
  const status = params.get('status') || params.get('response_code') || ''
  const approved = status === 'approved' || status === '0000' || params.get('approval_code')

  const origin = req.nextUrl.origin
  const shopPrefix = shopSlug === 'main' ? '' : '/' + shopSlug

  // Dohvati pending narudžbu
  const { data: pending } = await supabaseAdmin
    .from('placanja_pending')
    .select('*')
    .eq('order_number', orderNumber)
    .single()

  if (!pending) {
    return NextResponse.redirect(`${origin}${shopPrefix}/?placanje=greska`)
  }

  if (pending.status === 'placeno') {
    // Već obrađeno
    return NextResponse.redirect(`${origin}${shopPrefix}/moje-narudzbe?placanje=uspjeh`)
  }

  if (!approved) {
    await supabaseAdmin.from('placanja_pending').update({ status: 'odbijeno' }).eq('id', pending.id)
    return NextResponse.redirect(`${origin}${shopPrefix}/?placanje=odbijeno`)
  }

  // Plaćanje uspješno - pošalji narudžbu u NIBIS
  try {
    const payload = pending.narudzba_payload

    // Dohvati shop NIBIS config
    const { data: shop } = await supabaseAdmin
      .from('shopovi').select('id, nibis_api_url, nibis_api_key, company_year, org_jed_id').eq('id', pending.shop_id).single()

    const config: NibisConfig = shop?.nibis_api_url && shop?.nibis_api_key
      ? { baseUrl: shop.nibis_api_url, apiKey: shop.nibis_api_key, companyYear: shop.company_year?.toString() || new Date().getFullYear().toString(), orgJedId: shop.org_jed_id || 1 }
      : { baseUrl: process.env.NIBIS_API_URL!, apiKey: process.env.NIBIS_API_KEY!, companyYear: process.env.NIBIS_COMPANY_YEAR || new Date().getFullYear().toString(), orgJedId: parseInt(process.env.ORG_JED_ID || '1') }

    const nibisResult = await createNarudzba(payload, config)

    // Spremi narudžbu u Supabase
    await supabaseAdmin.from('narudzbe').insert({
      korisnik_id: payload._korisnikId,
      partner_id: payload.partnerId,
      nibis_id: nibisResult.id,
      nibis_oznaka: nibisResult.oznakaDokumenta,
      nibis_external_id: payload.externalId,
      org_jed_id: config.orgJedId,
      ukupno_sa_porezom: pending.amount,
      nacin_placanja: 'Online kartica',
      status: 'placeno',
      shop_id: pending.shop_id,
    })

    await supabaseAdmin.from('placanja_pending').update({ status: 'placeno', nibis_oznaka: nibisResult.oznakaDokumenta }).eq('id', pending.id)

    return NextResponse.redirect(`${origin}${shopPrefix}/moje-narudzbe?placanje=uspjeh`)
  } catch (e: any) {
    console.error('[PLACANJE CALLBACK] NIBIS greška:', e)
    // Plaćeno ali NIBIS pao - označi za ručnu obradu
    await supabaseAdmin.from('placanja_pending').update({ status: 'placeno_nibis_greska', greska: String(e) }).eq('id', pending.id)
    return NextResponse.redirect(`${origin}${shopPrefix}/moje-narudzbe?placanje=uspjeh_nibis_greska`)
  }
}

export async function GET(req: NextRequest) {
  return handleCallback(req, req.nextUrl.searchParams)
}

export async function POST(req: NextRequest) {
  // Monri može slati POST s form podacima
  const formData = await req.formData().catch(() => null)
  const params = new URLSearchParams(req.nextUrl.searchParams)
  if (formData) {
    formData.forEach((v, k) => params.set(k, String(v)))
  }
  return handleCallback(req, params)
}

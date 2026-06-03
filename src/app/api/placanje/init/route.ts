import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { buildFormData, type MonriConfig } from '@/lib/monri'

// Inicira Monri plaćanje za B2C narudžbu
// Vraća form podatke koje frontend POST-uje na Monri
export async function POST(req: NextRequest) {
  try {
    const { shop, amount, orderInfo, fullName, email, city, address, narudzbaPayload } = await req.json()
    const shopSlug = shop || 'main'

    // Dohvati shop
    const { data: shopData } = await supabaseAdmin
      .from('shopovi').select('id, naziv').eq('slug', shopSlug).eq('status', 'aktivan').single()
    if (!shopData?.id) return NextResponse.json({ error: 'Shop nije pronađen' }, { status: 404 })

    // Dohvati Monri postavke shopa
    const { data: postavke } = await supabaseAdmin
      .from('postavke').select('kljuc, vrijednost')
      .eq('shop_id', shopData.id)
      .in('kljuc', ['online_placanje', 'monri_merchant_key', 'monri_authenticity_token', 'monri_test'])

    const pmap: Record<string, string> = {}
    postavke?.forEach((p: any) => { pmap[p.kljuc] = p.vrijednost })

    if (pmap.online_placanje !== 'true') {
      return NextResponse.json({ error: 'Online plaćanje nije omogućeno za ovaj shop' }, { status: 400 })
    }
    if (!pmap.monri_merchant_key || !pmap.monri_authenticity_token) {
      return NextResponse.json({ error: 'Monri nije konfigurisan' }, { status: 400 })
    }

    const config: MonriConfig = {
      merchantKey: pmap.monri_merchant_key,
      authenticityToken: pmap.monri_authenticity_token,
      test: pmap.monri_test !== 'false', // default test mode
    }

    // Jedinstveni order number
    const orderNumber = 'WEB' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase()

    // Spremi pending narudžbu (čeka plaćanje) - payload se čuva da se pošalje u NIBIS nakon uspjeha
    const { data: pending } = await supabaseAdmin
      .from('placanja_pending')
      .insert({
        shop_id: shopData.id,
        order_number: orderNumber,
        amount,
        narudzba_payload: narudzbaPayload,
        status: 'pending',
      })
      .select('id')
      .single()

    const origin = req.nextUrl.origin
    const formData = buildFormData(config, {
      orderNumber,
      amount,
      orderInfo: orderInfo || ('Narudžba ' + shopData.naziv),
      fullName: fullName || 'Kupac',
      email: email || '',
      city, address,
      successUrl: `${origin}/api/placanje/callback?order=${orderNumber}&shop=${shopSlug}`,
      cancelUrl: `${origin}/${shopSlug === 'main' ? '' : shopSlug}?placanje=otkazano`,
      callbackUrl: `${origin}/api/placanje/callback?order=${orderNumber}&shop=${shopSlug}`,
    })

    return NextResponse.json({ ...formData, orderNumber, pendingId: pending?.id })
  } catch (e: any) {
    console.error('[PLACANJE INIT]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isAuth(req: NextRequest) {
  const secret = req.headers.get('x-super-admin-secret')
  return secret === (process.env.SUPER_ADMIN_SECRET || 'nibis-super-2025')
}

// Kompletan set default postavki za novi shop — neutralne vrijednosti, ništa od glavnog shopa
function defaultPostavke(shopId: string, naziv: string, email: string) {
  const p = (kljuc: string, vrijednost: string) => ({ kljuc, vrijednost, shop_id: shopId })
  return [
    // Firma
    p('shop_naziv', naziv),
    p('shop_email', email),
    p('shop_telefon', ''),
    p('shop_adresa', ''),
    p('shop_grad', ''),
    p('shop_web', ''),
    p('shop_pib', ''),
    p('shop_pdv_broj', ''),
    // Logo
    p('theme_logo_url', ''),
    p('theme_favicon_url', ''),
    // SEO
    p('seo_naslov', naziv + ' — B2B webshop'),
    p('seo_opis', ''),
    p('seo_og_slika', ''),
    // Boje
    p('theme_primary_boja', '#0F6E56'),
    p('theme_bg_stranica', '#F8FAFA'),
    p('theme_bg_kartica', '#ffffff'),
    p('theme_border_boja', '#E8EDEB'),
    p('theme_tekst_boja', '#0D1F1A'),
    p('theme_tekst_muted', '#6B8279'),
    p('theme_cijena_boja', '#0F6E56'),
    p('theme_akcija_boja', '#DC2626'),
    // Font
    p('theme_font', 'DM Sans'),
    p('theme_font_body_size', '14'),
    p('theme_font_naslov_size', '22'),
    p('theme_border_radius', '10'),
    p('theme_dugme_stil', 'gradient'),
    p('theme_kartica_radius', '14'),
    p('theme_kartica_shadow', 'true'),
    // Header
    p('header_layout', 'minimal'),
    p('header_boja', '#ffffff'),
    p('header_tekst_boja', '#111827'),
    p('header_visina_nova', '64'),
    p('header_shadow_nova', 'true'),
    p('header_sticky', 'true'),
    p('header_blur', 'true'),
    p('header_search_stil', 'inline'),
    p('header_search_sirina', '520'),
    p('header_search_placeholder', 'Pretraži artikle, šifre, barkodove...'),
    p('header_korpa_stil', 'button'),
    p('header_korpa_boja', ''),
    p('header_border_bottom', 'true'),
    // Top bar
    p('topbar_aktivan', 'false'),
    p('topbar_boja', '#1F2937'),
    p('topbar_tekst_boja', '#9CA3AF'),
    p('topbar_telefon', ''),
    p('topbar_email', email),
    p('topbar_radno_vrijeme', ''),
    p('topbar_adresa', ''),
    p('topbar_custom_tekst', ''),
    // Announcement bar
    p('announcement_bar', ''),
    p('baner_boja_pozadine', '#085041'),
    p('baner_boja_teksta', '#ffffff'),
    // Nav kategorija
    p('navkat_aktivan', 'false'),
    p('navkat_boja', '#1e3a5f'),
    p('navkat_tekst_boja', '#ffffff'),
    p('navkat_visina', '44'),
    p('navkat_stil', 'flat'),
    p('navkat_akcijski_dugme', 'false'),
    p('navkat_akcijski_tekst', 'Akcijski proizvodi'),
    p('navkat_akcijski_boja', '#DC2626'),
    // Hero
    p('hero_aktivan', 'true'),
    p('hero_naslov', 'Dobrodošli u ' + naziv),
    p('hero_podnaslov', 'Profesionalna roba za vaše poslovanje'),
    p('hero_dugme_tekst', 'Pregledaj katalog'),
    p('hero_dugme_url', '/'),
    p('hero_slika_url', ''),
    p('hero_overlay_opacity', '0.4'),
    p('hero_tekst_pozicija', 'center'),
    p('hero_visina', '400'),
    p('hero_boja_pozadine', '#0F6E56'),
    p('hero_tekst_boja', '#ffffff'),
    p('hero_font_naslov', '42'),
    // Sidebar
    p('sidebar_sirina', '240'),
    p('sidebar_boja_pozadine', '#F8FAFA'),
    p('sidebar_visina_kategorije', '52'),
    p('sidebar_pozicija', 'lijevo'),
    // Katalog
    p('per_page', '24'),
    p('default_view', 'table'),
    p('default_sort', 'naziv'),
    // Artikli
    p('artikal_prikaz_dvije_cijene', 'false'),
    p('artikal_velep_label', 'Veleprodajna cijena'),
    p('artikal_malop_label', 'Maloprodajna cijena'),
    p('artikal_prikaz_pdv', 'false'),
    p('artikal_prikaz_sifra', 'true'),
    p('artikal_prikaz_kategorija', 'true'),
    p('artikal_prikaz_barcode', 'false'),
    p('artikal_dugme_tekst', 'Dodaj'),
    p('artikal_badge_stanje', 'pill'),
    // Korpa i narudžbe
    p('nacini_placanja', 'Virman,Gotovina'),
    p('korpa_napomena', 'true'),
    p('korpa_pdv_prikaz', 'true'),
    p('min_narudzba', '0'),
    // Footer
    p('theme_footer_boja', '#ffffff'),
    p('theme_footer_tekst', naziv + ' · B2B webshop'),
    p('theme_footer_logo_url', ''),
    p('theme_footer_bg_slika', ''),
    p('footer_kolone_aktivan', 'false'),
    p('footer_kolona1_naslov', 'Kontakt'),
    p('footer_kolona1_sadrzaj', ''),
    p('footer_kolona2_naslov', 'Linkovi'),
    p('footer_kolona2_sadrzaj', ''),
    p('footer_kolona3_naslov', 'Radno vrijeme'),
    p('footer_kolona3_sadrzaj', ''),
    // Social
    p('footer_social_facebook', ''),
    p('footer_social_instagram', ''),
    p('footer_social_linkedin', ''),
    p('footer_social_twitter', ''),
    p('footer_social_youtube', ''),
    p('footer_social_whatsapp', ''),
    p('footer_social_viber', ''),
    // Registracija
    p('registracija_otvorena', 'true'),
    p('registracija_poruka', 'Vaš zahtjev je primljen. Kontaktirat ćemo vas u roku od 24h.'),
    p('email_potvrda_narudzba', 'true'),
    p('email_admin_narudzba', 'true'),
    p('email_admin_registracija', 'true'),
    // Ostalo
    p('shop_template', 'default'),
    p('shop_watermark', 'true'),
    p('theme_custom_css', ''),
    p('page_sekcije', JSON.stringify([
      { id: 'hero', aktivan: true, instanceId: 'hero-1' },
      { id: 'akcije', aktivan: true, instanceId: 'akcije-1' },
      { id: 'katalog', aktivan: true, instanceId: 'katalog-1' },
    ])),
  ]
}

// GET — lista shopova (SAMO klijentski, ne glavni shop)
export async function GET(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('shopovi')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — kreiraj shop s kompletnim postavkama
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
    .insert({
      naziv, slug,
      domena: domena || null,
      plan,
      admin_email,
      nibis_api_url: nibis_api_url || null,
      nibis_api_key: nibis_api_key || null,
      status: 'aktivan',
    })
    .select()
    .single()

  if (shopErr) return NextResponse.json({ error: shopErr.message }, { status: 500 })

  // Upiši kompletan set default postavki — izolovano od glavnog shopa
  const { error: postavkeErr } = await supabaseAdmin
    .from('postavke')
    .insert(defaultPostavke(shop.id, naziv, admin_email))

  if (postavkeErr) {
    // Shop je kreiran ali postavke nisu — obriši shop i vrati grešku
    await supabaseAdmin.from('shopovi').delete().eq('id', shop.id)
    return NextResponse.json({ error: 'Greška pri kreiranju postavki: ' + postavkeErr.message }, { status: 500 })
  }

  return NextResponse.json(shop)
}

// PATCH — update shop
export async function PATCH(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status, nibis_api_url, nibis_api_key, domena } = await req.json()
  const updates: any = { updated_at: new Date().toISOString() }
  if (status !== undefined) updates.status = status
  if (nibis_api_url !== undefined) updates.nibis_api_url = nibis_api_url
  if (nibis_api_key !== undefined) updates.nibis_api_key = nibis_api_key
  if (domena !== undefined) updates.domena = domena || null

  const { error } = await supabaseAdmin.from('shopovi').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE — obriši shop i sve postavke
export async function DELETE(req: NextRequest) {
  if (!isAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()

  // Obriši postavke prvo (cascade bi trebao ali sigurnost)
  await supabaseAdmin.from('postavke').delete().eq('shop_id', id)
  await supabaseAdmin.from('stranice').delete().eq('shop_id', id)

  const { error } = await supabaseAdmin.from('shopovi').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

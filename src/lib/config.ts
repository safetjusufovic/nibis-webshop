// ─── Konfiguracija webshopa ──────────────────────────────────────────────────
// Sve vrijednosti se mogu mijenjati u .env.local ili Vercel Environment Variables

export const siteConfig = {
  // Naziv webshopa — mijenja se u NEXT_PUBLIC_SHOP_NAME env varijabli
  name: process.env.NEXT_PUBLIC_SHOP_NAME || 'WebShop',

  // Kratki opis (meta description, footer)
  description: process.env.NEXT_PUBLIC_SHOP_DESCRIPTION || 'Online narudžba robe',

  // Kontakt email u footeru
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',

  // Valuta
  currency: process.env.NEXT_PUBLIC_CURRENCY || 'KM',

  // Organizaciona jedinica ID (default — može se overrideati)
  orgJedId: parseInt(process.env.NEXT_PUBLIC_ORG_JED_ID || '1'),

  // Naziv org. jedinice (za prikaz)
  orgJedNaziv: process.env.NEXT_PUBLIC_ORG_JED_NAZIV || '',

  // Tip cijene koji se prikazuje kupcima
  // 'mpcijena' = maloprodajna | 'vpcijena' = veleprodajna
  tipCijene: (process.env.NEXT_PUBLIC_TIP_CIJENE || 'mpcijena') as 'mpcijena' | 'vpcijena',

  // Broj artikala po stranici
  perPage: parseInt(process.env.NEXT_PUBLIC_PER_PAGE || '24'),

  // Cloudinary cloud name za slike (opcionalno)
  cloudinaryCloud: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD || '',

  // Da li prikazivati artikle bez stanja
  prikaziNemaStanja: process.env.NEXT_PUBLIC_PRIKAZI_NEMA_STANJA !== 'false',

  // Logotip URL (stavi u /public/logo.png ili URL)
  logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || '',
  minNarudzba: parseFloat(process.env.NEXT_PUBLIC_MIN_NARUDZBA ?? '0'),
} as const

export type SiteConfig = typeof siteConfig

// Helper za formatiranje cijene
export function formatCijena(iznos: number | null | undefined, currency = siteConfig.currency): string {
  if (iznos == null || isNaN(iznos as number)) return `0.00 ${currency}`
  return `${iznos.toFixed(2)} ${currency}`
}

// Helper za PDV kalkulaciju
// vpcijena = cijena BEZ PDV-a (osnovica), PDV se dodaje na nju
// mpcijena = cijena SA PDV-om, PDV se izvlači iz nje
export function calculateTotals(stavke: Array<{ cijena: number; qty: number; procPoreza: number }>, tipCijeneParam?: 'vpcijena' | 'mpcijena') {
  const tipCijene = tipCijeneParam ?? process.env.NEXT_PUBLIC_TIP_CIJENE ?? 'vpcijena'
  let ukupnoBezPoreza = 0
  let ukupnoPorez = 0

  stavke.forEach(({ cijena, qty, procPoreza }) => {
    const total = cijena * qty
    if (tipCijene === 'vpcijena') {
      // VP cijena je bez PDV-a — dodajemo PDV
      ukupnoBezPoreza += total
      ukupnoPorez += total * (procPoreza / 100)
    } else {
      // MP cijena je sa PDV-om — izvlačimo PDV
      const bezPdv = total / (1 + procPoreza / 100)
      ukupnoBezPoreza += bezPdv
      ukupnoPorez += total - bezPdv
    }
  })

  return {
    ukupnoBezPoreza: Math.round(ukupnoBezPoreza * 100) / 100,
    ukupnoPorez: Math.round(ukupnoPorez * 100) / 100,
    ukupnoSaPorezom: Math.round((ukupnoBezPoreza + ukupnoPorez) * 100) / 100,
  }
}

// ─── Slike: optimizacija i proxy ──────────────────────────────────────────────
// Vraća URL spreman za prikaz. ERP slike (vanjske domene) idu kroz proxy
// (rješava autentifikaciju + Next Image domain restrikciju).
// Supabase/Cloudinary slike idu direktno (već optimizovane).
export function slikaSrc(url: string | null | undefined, shopSlug = '', useProxy = false): string | null {
  if (!url) return null

  // Supabase Storage — dodaj transform za optimizaciju (resize + WebP + quality)
  if (url.includes('.supabase.co/storage')) {
    // Pretvori public URL u render URL s transformacijom
    if (url.includes('/object/public/')) {
      const transformed = url.replace('/object/public/', '/render/image/public/')
      return transformed + (transformed.includes('?') ? '&' : '?') + 'width=600&quality=75'
    }
    return url
  }

  // Cloudinary — već se servira optimizovano
  if (url.includes('res.cloudinary.com')) return url

  // Vanjska ERP slika — kroz proxy (auth + domain)
  if (useProxy && /^https?:\/\//.test(url)) {
    return '/api/slika-proxy?url=' + encodeURIComponent(url) + (shopSlug ? '&shop=' + shopSlug : '')
  }

  return url
}

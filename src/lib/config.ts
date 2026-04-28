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
} as const

export type SiteConfig = typeof siteConfig

// Helper za formatiranje cijene
export function formatCijena(iznos: number, currency = siteConfig.currency): string {
  return `${iznos.toFixed(2)} ${currency}`
}

// Helper za PDV kalkulaciju (cijena je već sa PDV-om po NIBIS modelu)
export function calculateTotals(stavke: Array<{ cijena: number; qty: number; procPoreza: number }>) {
  let ukupnoSaPorezom = 0
  let ukupnoPorez = 0
  stavke.forEach(({ cijena, qty, procPoreza }) => {
    const total = cijena * qty
    ukupnoSaPorezom += total
    ukupnoPorez += total - total / (1 + procPoreza / 100)
  })
  return {
    ukupnoSaPorezom,
    ukupnoPorez,
    ukupnoBezPoreza: ukupnoSaPorezom - ukupnoPorez,
  }
}

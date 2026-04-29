// Jednostavan prijevodni sistem
// Prijevodi se čitaju iz cookie 'locale' (bs ili en)

export const prijevodi = {
  bs: {
    katalog: 'Katalog',
    narudzbe: 'Narudžbe',
    admin: 'Admin',
    prijava: 'Prijava',
    odjava: 'Odjava',
    korpa: 'Korpa',
    favoriti: 'Favoriti',
    moje_narudzbe: 'Moje narudžbe',
    pretrazi: 'Pretraži artikle, šifre, barkodove...',
    dodaj_u_korpu: 'Dodaj u korpu',
    nema_na_stanju: 'Nema na stanju',
    na_stanju: 'Na stanju',
    bez_pdv: 'Bez PDV-a',
    pdv: 'PDV',
    ukupno: 'Ukupno',
    posalji_narudzbu: 'Pošalji narudžbu u ERP',
    nacin_placanja: 'Način plaćanja',
    napomena: 'Napomena',
    sve_kategorije: 'Sve kategorije',
    samo_na_stanju: 'Samo na stanju',
    artikala: 'artikala',
    rok_placanja: 'Rok plaćanja',
    dana: 'dana',
    kreditni_limit: 'kreditni limit',
  },
  en: {
    katalog: 'Catalogue',
    narudzbe: 'Orders',
    admin: 'Admin',
    prijava: 'Login',
    odjava: 'Logout',
    korpa: 'Cart',
    favoriti: 'Favourites',
    moje_narudzbe: 'My Orders',
    pretrazi: 'Search products, codes, barcodes...',
    dodaj_u_korpu: 'Add to cart',
    nema_na_stanju: 'Out of stock',
    na_stanju: 'In stock',
    bez_pdv: 'Excl. VAT',
    pdv: 'VAT',
    ukupno: 'Total',
    posalji_narudzbu: 'Submit order to ERP',
    nacin_placanja: 'Payment method',
    napomena: 'Note',
    sve_kategorije: 'All categories',
    samo_na_stanju: 'In stock only',
    artikala: 'products',
    rok_placanja: 'Payment terms',
    dana: 'days',
    kreditni_limit: 'credit limit',
  }
}

export type Lang = 'bs' | 'en'
export type TranslationKey = keyof typeof prijevodi.bs

export function t(key: TranslationKey, lang: Lang = 'bs'): string {
  return prijevodi[lang]?.[key] ?? prijevodi.bs[key] ?? key
}

// Hook za čitanje locale iz cookie na klientu
export function getLang(): Lang {
  if (typeof document === 'undefined') return 'bs'
  const match = document.cookie.match(/locale=([^;]+)/)
  return (match?.[1] as Lang) ?? 'bs'
}

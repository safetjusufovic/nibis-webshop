// ─── Paginiran odgovor ───────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  total: number
  filtered: number
  page: number
  perPage: number
  items: T[]
}

// ─── Artikli ─────────────────────────────────────────────────────────────────
export interface Artikal {
  id: number
  sifra: string
  barkod: string | null
  kataloskiBroj: string | null
  naziv: string
  naziv2: string | null
  naziv3: string | null
  opis: string | null
  napomena: string | null
  roba: boolean
  proizvod: boolean
  aktivan: boolean
  vanUpotrebe: boolean
  planskaCijenaDobavljaca: number
  planskaMarza: number
  planskaVeleprodajnaCijena: number
  dilerskaCijena1: number
  dilerskaCijena2: number
  planskaMaloprodajnaCijena: number
  procPoreza: number
  grupaId: number | null
  artikalParentId: number | null
  dateCreated: string
  dateModified: string | null
  grupa: { id: number; sifra: string; naziv: string } | null
  artikalRoditelj: { id: number; sifra: string; naziv: string } | null
  dobavljac: { id: number; sifra: string; naziv: string } | null
  proizvodjac: { id: number; sifra: string; naziv: string } | null
}

// ─── Artikli grupe ───────────────────────────────────────────────────────────
export interface ArtikalGrupa {
  id: number
  sifra: string
  naziv: string
  opis: string | null
  prefix: string | null
  nivo: number
  dateCreated: string
  dateModified: string | null
  parentId: number | null
  parent: { id: number; sifra: string; naziv: string } | null
  boja: string | null
  ikonaUrl: string | null
}

// ─── Stanje skladišta ────────────────────────────────────────────────────────
export interface StanjeSkladista {
  id: number
  artikalId: number
  orgJedId: number
  skladisnoMjesto: string | null
  raspolozivaKolicina: number
  nabavnaCijena: number
  vpcijena: number
  mpcijena: number
  dateCreated: string
  dateModified: string
}

// ─── Narudžba ────────────────────────────────────────────────────────────────
export interface NarudzbaStavka {
  rbr: number | null
  tip: 'Artikal'
  artikalId: number
  naziv: string
  kolicina: number
  jedinicnaCijena: number
  rabat1Procenat: number | null
  rabat2Procenat: number | null
  rabat3Procenat: number | null
  poreskaStopa: number
  opis: string | null
}

export interface NarudzbaCreate {
  orgJedId: number
  datum: string
  rbrAuto: boolean
  rbr: number | null
  partnerId: number | null
  knjigaFakturaId: number | null
  externalId: string | null
  datumVazenja: string | null
  rokPlacanja: number | null
  valutaId: number | null
  nacinIsporukeId: number | null
  datumIsporukeOd: string | null
  datumIsporukeDo: string | null
  nacinPlacanja: 'Virman' | 'Gotovina' | 'Kartica' | 'Cek'
  sredstvoPlacanjaId: number | null
  nacinOdredjivanjaCijene: 'StandardnaProdaja'
  nacinObracunaPoreza: 'SaPorezom' | 'OslobodjenoPDV' | 'OslobodjenoPDVBezOdbitka'
  komercijalistId: number | null
  opis1: string | null
  opis2: string | null
  opis3: string | null
  napomena: string | null
  stavke: NarudzbaStavka[]
}

export interface NarudzbaResponse {
  id: number
  externalId: string | null
  rbr: number | null
  oznakaDokumenta: string
  orgJedId: number
  partnerId: number | null
  datum: string
  nacinPlacanja: string
  ukupnoBezPoreza: number
  ukupnoPorez: number
  ukupnoSaPorezom: number
  stavke: NarudzbaStavka[]
}

// ─── Korpa (lokalni state) ────────────────────────────────────────────────────
export interface CartItem {
  artikal: Artikal
  qty: number
  cijena: number
  stanje: StanjeSkladista | null
}

export type Cart = Record<number, CartItem>

// ─── Partner ──────────────────────────────────────────────────────────────────
export interface Partner {
  id: number
  sifra: string
  aktivan: boolean
  naziv: string
  adresa: string | null
  postanskiBroj: string | null
  grad: string | null
  pdvBroj: string | null
  idBroj: string | null
  tel: string | null
  fax: string | null
  email: string | null
  pdvObveznik: boolean
  rokPlacanja: number | null
  opis: string | null
  webSite: string | null
  rabat: number
  limitFin: number
  limitFin2: number
  napomena: string | null
  dateCreated: string
  dateModified: string | null
  grupa: { id: number; naziv: string; sifra: string } | null
  komercijalista: { id: number; naziv: string; sifra: string } | null
}

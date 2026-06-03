// ─── Standardni ERP adapter interfejs ────────────────────────────────────────
// Svaki ERP (NIBIS, Pantheon, ...) implementira ovaj interfejs.
// Ostatak aplikacije zna SAMO za ovaj interfejs, ne za konkretan ERP.

export interface ErpConfig {
  tip: 'nibis' | 'pantheon' | 'custom_rest'
  baseUrl: string
  apiKey: string
  companyYear?: string
  orgJedId?: number
  // Pantheon-specifično (opcionalno)
  username?: string
  password?: string
  database?: string
}

export interface ErpArtikal {
  id: number | string
  sifra: string
  barkod?: string | null
  naziv: string
  naziv2?: string | null
  opis?: string | null
  aktivan: boolean
  vanUpotrebe?: boolean
  procPoreza: number
  planskaMaloprodajnaCijena?: number
  planskaVeleprodajnaCijena?: number
  grupaId?: number | string | null
  dobavljac?: { naziv: string } | null
  proizvodjac?: { naziv: string } | null
  dateCreated?: string
  dateModified?: string | null
}

export interface ErpGrupa {
  id: number | string
  sifra: string
  naziv: string
  opis?: string | null
  prefix?: string | null
  nivo?: number
  parentId?: number | string | null
  dateCreated?: string
  dateModified?: string | null
}

export interface ErpStanje {
  id: number | string
  artikalId: number | string
  orgJedId: number
  raspolozivaKolicina: number
  nabavnaCijena?: number
  vpcijena?: number
  mpcijena?: number
  dateCreated?: string
  dateModified?: string | null
}

export interface ErpPartner {
  id: number | string
  sifra: string
  naziv: string
  pdvBroj?: string | null
  grad?: string | null
  rabat?: number
  aktivan?: boolean
}

export interface ErpListResult<T> {
  items: T[]
  total: number
}

export interface ErpListParams {
  page?: number
  perPage?: number
  search?: string
  since?: string
}

export interface ErpNarudzbaStavka {
  artikalId: number | string
  naziv: string
  kolicina: number
  jedinicnaCijena: number
  poreskaStopa: number
  sifra?: string
}

export interface ErpNarudzba {
  partnerId: number | string | null
  orgJedId: number
  externalId: string
  nacinPlacanja: string
  napomena?: string | null
  stavke: ErpNarudzbaStavka[]
}

export interface ErpNarudzbaResult {
  id: number | string
  oznakaDokumenta: string
  ukupnoSaPorezom?: number
}

// ─── Adapter interfejs ────────────────────────────────────────────────────────
export interface ErpAdapter {
  tip: string
  getArtikli(params: ErpListParams): Promise<ErpListResult<ErpArtikal>>
  getGrupe(params: ErpListParams): Promise<ErpListResult<ErpGrupa>>
  getStanje(page: number, orgJedId?: number, since?: string): Promise<ErpListResult<ErpStanje>>
  getPartneri(params: ErpListParams): Promise<ErpListResult<ErpPartner>>
  createNarudzba(narudzba: ErpNarudzba): Promise<ErpNarudzbaResult>
  testConnection(): Promise<{ ok: boolean; error?: string }>
}

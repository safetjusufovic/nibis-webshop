// ─── Konfiguracija za Custom REST adapter ─────────────────────────────────────
// Ova struktura opisuje BILO KOJI JSON REST/OData ERP kroz GUI, bez pisanja koda.

export type AuthType = 'none' | 'basic' | 'bearer' | 'apikey_header' | 'custom_header'

export interface RestAuthConfig {
  type: AuthType
  // basic
  username?: string
  password?: string
  // bearer / apikey
  token?: string
  // apikey_header / custom_header
  headerName?: string   // npr. 'X-API-Key', 'Authorization'
  headerValue?: string  // npr. 'erp_xxx' ili 'Bearer xxx'
  // dodatni statički headeri (npr. company year)
  extraHeaders?: { name: string; value: string }[]
}

// Kako se čita lista iz odgovora i paginacija
export interface RestEndpointConfig {
  path: string                    // npr. '/artikli' ili '/api/v1/Items'
  method?: 'GET' | 'POST'         // default GET
  // Gdje su podaci u odgovoru: npr. 'items', 'value' (OData), 'data.rows', '' (root array)
  itemsPath?: string
  // Gdje je ukupan broj: npr. 'total', '@odata.count', 'meta.total'
  totalPath?: string
  // Paginacija
  pageParam?: string              // npr. 'page', '$skip', 'offset'
  perPageParam?: string           // npr. 'perPage', '$top', 'limit'
  perPageValue?: number           // default 100
  pageStyle?: 'page' | 'offset'   // page=broj stranice, offset=preskoči N
  // Pretraga (za partnere)
  searchParam?: string            // npr. 'search', '$filter', 'q'
  // Dodatni query parametri (statički)
  extraParams?: { name: string; value: string }[]
}

// Mapiranje jednog polja: standardno ime ← putanja u ERP odgovoru
export interface FieldMap {
  [standardField: string]: string  // npr. { naziv: 'ItemName', sifra: 'ItemCode' }
}

export interface RestErpConfig {
  baseUrl: string
  auth: RestAuthConfig
  endpoints: {
    artikli?: RestEndpointConfig
    grupe?: RestEndpointConfig
    stanje?: RestEndpointConfig
    partneri?: RestEndpointConfig
    narudzba?: RestEndpointConfig
  }
  mapping: {
    artikli?: FieldMap
    grupe?: FieldMap
    stanje?: FieldMap
    partneri?: FieldMap
  }
  // Mapiranje za slanje narudžbe (standardno → ERP format)
  narudzbaTemplate?: {
    // JSON template s placeholder-ima {{partnerId}}, {{externalId}}, itd.
    // i {{#stavke}} za listu stavki
    bodyTemplate?: string
    stavkaTemplate?: string
    responseIdPath?: string       // gdje je ID u odgovoru
    responseOznakaPath?: string   // gdje je broj dokumenta
  }
}

// Standardna polja koja se mogu mapirati (za GUI)
export const STANDARD_FIELDS = {
  artikli: ['id', 'sifra', 'barkod', 'naziv', 'naziv2', 'opis', 'aktivan', 'procPoreza', 'planskaMaloprodajnaCijena', 'planskaVeleprodajnaCijena', 'grupaId'],
  grupe: ['id', 'sifra', 'naziv', 'parentId'],
  stanje: ['id', 'artikalId', 'raspolozivaKolicina', 'vpcijena', 'mpcijena', 'nabavnaCijena'],
  partneri: ['id', 'sifra', 'naziv', 'pdvBroj', 'grad', 'rabat'],
} as const

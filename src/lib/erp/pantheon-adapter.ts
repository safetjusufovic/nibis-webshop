import type {
  ErpAdapter, ErpConfig, ErpListParams, ErpListResult,
  ErpArtikal, ErpGrupa, ErpStanje, ErpPartner, ErpNarudzba, ErpNarudzbaResult
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// PANTHEON ADAPTER (Datalab Pantheon)
// ─────────────────────────────────────────────────────────────────────────────
// VAŽNO: Pantheon NEMA standardizovan javni REST API kao NIBIS.
// Integracija ovisi o konkretnoj instalaciji klijenta — obično preko:
//   a) Pantheon REST API modula (licenca + konfiguracija na strani klijenta), ili
//   b) Custom REST sloja iznad MsSQL baze (stored procedure)
//
// Ovaj adapter je KOSTUR koji implementira standardni interfejs.
// Endpointe i mapiranje polja popunjavaš kad dobiješ pristup konkretnoj
// Pantheon instalaciji. Mjesta označena s [POPUNI] treba prilagoditi.
// ─────────────────────────────────────────────────────────────────────────────

export class PantheonAdapter implements ErpAdapter {
  tip = 'pantheon'
  private config: ErpConfig

  constructor(config: ErpConfig) {
    this.config = config
  }

  private headers(): Record<string, string> {
    // [POPUNI] Pantheon autentifikacija — obično Basic Auth ili Bearer token
    // ovisno o tome kako je REST sloj postavljen kod klijenta
    const auth = this.config.username && this.config.password
      ? 'Basic ' + Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')
      : `Bearer ${this.config.apiKey}`
    return {
      'Content-Type': 'application/json',
      'Authorization': auth,
      ...(this.config.database && { 'X-Database': this.config.database }),
    }
  }

  async getArtikli(params: ErpListParams): Promise<ErpListResult<ErpArtikal>> {
    // [POPUNI] Pantheon endpoint za artikle (npr. /api/items ili stored proc)
    const url = `${this.config.baseUrl}/items?page=${params.page ?? 1}&pageSize=${params.perPage ?? 100}`
    const res = await fetch(url, { headers: this.headers() })
    if (!res.ok) throw new Error(`Pantheon getArtikli ${res.status}`)
    const data = await res.json()

    // [POPUNI] Mapiranje Pantheon polja → standardni ErpArtikal
    // Pantheon koristi drugačija imena (npr. acIdent, acName, anVATPercent...)
    const items: ErpArtikal[] = (data.items ?? data.rows ?? []).map((p: any) => ({
      id: p.acIdent ?? p.id,
      sifra: p.acIdent ?? p.code,
      barkod: p.acBarcode ?? null,
      naziv: p.acName ?? p.name,
      aktivan: p.acActive !== 'F',
      procPoreza: p.anVATPercent ?? 17,
      planskaMaloprodajnaCijena: p.anRetailPrice,
      planskaVeleprodajnaCijena: p.anWholesalePrice,
      grupaId: p.acClassif ?? null,
    }))
    return { items, total: data.total ?? items.length }
  }

  async getGrupe(params: ErpListParams): Promise<ErpListResult<ErpGrupa>> {
    // [POPUNI] Pantheon endpoint za grupe/klasifikacije
    const url = `${this.config.baseUrl}/classifications`
    const res = await fetch(url, { headers: this.headers() })
    if (!res.ok) throw new Error(`Pantheon getGrupe ${res.status}`)
    const data = await res.json()
    const items: ErpGrupa[] = (data.items ?? []).map((p: any) => ({
      id: p.acClassif ?? p.id,
      sifra: p.acClassif ?? p.code,
      naziv: p.acName ?? p.name,
      parentId: p.acParentClassif ?? null,
    }))
    return { items, total: data.total ?? items.length }
  }

  async getStanje(page: number, orgJedId?: number, since?: string): Promise<ErpListResult<ErpStanje>> {
    // [POPUNI] Pantheon endpoint za stanje skladišta
    const url = `${this.config.baseUrl}/stock?warehouse=${orgJedId ?? ''}&page=${page}`
    const res = await fetch(url, { headers: this.headers() })
    if (!res.ok) throw new Error(`Pantheon getStanje ${res.status}`)
    const data = await res.json()
    const items: ErpStanje[] = (data.items ?? []).map((p: any) => ({
      id: p.id ?? `${p.acIdent}-${p.acWarehouse}`,
      artikalId: p.acIdent,
      orgJedId: orgJedId ?? 1,
      raspolozivaKolicina: p.anStock ?? 0,
      vpcijena: p.anWholesalePrice,
      mpcijena: p.anRetailPrice,
    }))
    return { items, total: data.total ?? items.length }
  }

  async getPartneri(params: ErpListParams): Promise<ErpListResult<ErpPartner>> {
    // [POPUNI] Pantheon endpoint za partnere/subjekte
    const url = `${this.config.baseUrl}/subjects?search=${encodeURIComponent(params.search ?? '')}`
    const res = await fetch(url, { headers: this.headers() })
    if (!res.ok) throw new Error(`Pantheon getPartneri ${res.status}`)
    const data = await res.json()
    const items: ErpPartner[] = (data.items ?? []).map((p: any) => ({
      id: p.acSubject ?? p.id,
      sifra: p.acSubject ?? p.code,
      naziv: p.acName ?? p.name,
      pdvBroj: p.acTaxNo ?? null,
      grad: p.acCity ?? null,
    }))
    return { items, total: data.total ?? items.length }
  }

  async createNarudzba(narudzba: ErpNarudzba): Promise<ErpNarudzbaResult> {
    // [POPUNI] Pantheon endpoint za kreiranje narudžbe/dokumenta
    // Pantheon dokumenti idu kroz the_Move / the_MoveItem strukturu
    const url = `${this.config.baseUrl}/orders`
    const body = {
      // [POPUNI] mapiranje na Pantheon format dokumenta
      acSubject: narudzba.partnerId,
      acWarehouse: narudzba.orgJedId,
      acExternalId: narudzba.externalId,
      items: narudzba.stavke.map(s => ({
        acIdent: s.artikalId,
        anQty: s.kolicina,
        anPrice: s.jedinicnaCijena,
        anVATPercent: s.poreskaStopa,
      })),
    }
    const res = await fetch(url, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) })
    if (!res.ok) throw new Error(`Pantheon narudzba ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return {
      id: data.acKey ?? data.id,
      oznakaDokumenta: data.acDocNo ?? data.documentNumber ?? String(data.id),
    }
  }

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      // [POPUNI] lagani endpoint za provjeru konekcije (npr. ping ili 1 artikl)
      const res = await fetch(`${this.config.baseUrl}/items?pageSize=1`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(5000),
      })
      return { ok: res.ok, ...(!res.ok && { error: `HTTP ${res.status} — provjeri Pantheon endpoint i pristup` }) }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  }
}

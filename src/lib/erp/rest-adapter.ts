import type {
  ErpAdapter, ErpListParams, ErpListResult,
  ErpArtikal, ErpGrupa, ErpStanje, ErpPartner, ErpNarudzba, ErpNarudzbaResult
} from './types'
import type { RestErpConfig, RestEndpointConfig } from './rest-config-types'
import { getByPath, buildAuthHeaders, applyMapping, toNum, toBool, renderTemplate } from './rest-helpers'

// ─── Configurable REST Adapter ────────────────────────────────────────────────
// Generički adapter koji čita konfiguraciju (iz GUI-ja) i radi s bilo kojim
// JSON REST / OData ERP-om. Nema hardkodiranih endpointa ni polja.

export class RestAdapter implements ErpAdapter {
  tip = 'custom_rest'
  private config: RestErpConfig

  constructor(config: RestErpConfig) {
    this.config = config
  }

  private buildUrl(ep: RestEndpointConfig, params: ErpListParams): string {
    const url = new URL(ep.path.startsWith('http') ? ep.path : this.config.baseUrl + ep.path)

    // Paginacija
    if (ep.pageParam && params.page) {
      const val = ep.pageStyle === 'offset'
        ? String((params.page - 1) * (ep.perPageValue ?? params.perPage ?? 100))
        : String(params.page)
      url.searchParams.set(ep.pageParam, val)
    }
    if (ep.perPageParam) {
      url.searchParams.set(ep.perPageParam, String(ep.perPageValue ?? params.perPage ?? 100))
    }
    // Pretraga
    if (ep.searchParam && params.search) {
      url.searchParams.set(ep.searchParam, params.search)
    }
    // Statički extra parametri
    ep.extraParams?.forEach(p => { if (p.name) url.searchParams.set(p.name, p.value) })

    return url.toString()
  }

  private async fetchList(ep: RestEndpointConfig | undefined, params: ErpListParams): Promise<{ rows: any[]; total: number }> {
    if (!ep?.path) return { rows: [], total: 0 }
    const url = this.buildUrl(ep, params)
    const res = await fetch(url, {
      method: ep.method ?? 'GET',
      headers: buildAuthHeaders(this.config.auth),
    })
    if (!res.ok) throw new Error(`REST ${ep.path} → HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const data = await res.json()

    const rows = ep.itemsPath ? (getByPath(data, ep.itemsPath) ?? []) : (Array.isArray(data) ? data : (data.items ?? data.value ?? []))
    const total = ep.totalPath ? toNum(getByPath(data, ep.totalPath)) : (Array.isArray(rows) ? rows.length : 0)
    return { rows: Array.isArray(rows) ? rows : [], total: total || (Array.isArray(rows) ? rows.length : 0) }
  }

  async getArtikli(params: ErpListParams): Promise<ErpListResult<ErpArtikal>> {
    const { rows, total } = await this.fetchList(this.config.endpoints.artikli, params)
    const m = this.config.mapping.artikli
    const items: ErpArtikal[] = rows.map(r => {
      const x = applyMapping(r, m)
      return {
        id: x.id ?? r.id,
        sifra: String(x.sifra ?? ''),
        barkod: x.barkod ?? null,
        naziv: String(x.naziv ?? ''),
        naziv2: x.naziv2 ?? null,
        opis: x.opis ?? null,
        aktivan: toBool(x.aktivan, true),
        procPoreza: toNum(x.procPoreza),
        planskaMaloprodajnaCijena: toNum(x.planskaMaloprodajnaCijena),
        planskaVeleprodajnaCijena: toNum(x.planskaVeleprodajnaCijena),
        grupaId: x.grupaId ?? null,
        slikaUrl: x.slikaUrl ?? null,
      }
    })
    return { items, total }
  }

  async getGrupe(params: ErpListParams): Promise<ErpListResult<ErpGrupa>> {
    const { rows, total } = await this.fetchList(this.config.endpoints.grupe, params)
    const m = this.config.mapping.grupe
    const items: ErpGrupa[] = rows.map(r => {
      const x = applyMapping(r, m)
      return {
        id: x.id ?? r.id,
        sifra: String(x.sifra ?? ''),
        naziv: String(x.naziv ?? ''),
        parentId: x.parentId ?? null,
      }
    })
    return { items, total }
  }

  async getStanje(page: number, _orgJedId?: number, _since?: string): Promise<ErpListResult<ErpStanje>> {
    const { rows, total } = await this.fetchList(this.config.endpoints.stanje, { page, perPage: 100 })
    const m = this.config.mapping.stanje
    const items: ErpStanje[] = rows.map(r => {
      const x = applyMapping(r, m)
      return {
        id: x.id ?? r.id,
        artikalId: x.artikalId ?? r.artikalId,
        orgJedId: _orgJedId ?? 1,
        raspolozivaKolicina: toNum(x.raspolozivaKolicina),
        vpcijena: toNum(x.vpcijena),
        mpcijena: toNum(x.mpcijena),
        nabavnaCijena: toNum(x.nabavnaCijena),
      }
    })
    return { items, total }
  }

  async getPartneri(params: ErpListParams): Promise<ErpListResult<ErpPartner>> {
    const { rows, total } = await this.fetchList(this.config.endpoints.partneri, params)
    const m = this.config.mapping.partneri
    const items: ErpPartner[] = rows.map(r => {
      const x = applyMapping(r, m)
      return {
        id: x.id ?? r.id,
        sifra: String(x.sifra ?? ''),
        naziv: String(x.naziv ?? ''),
        pdvBroj: x.pdvBroj ?? null,
        grad: x.grad ?? null,
        rabat: toNum(x.rabat),
      }
    })
    return { items, total }
  }

  async createNarudzba(narudzba: ErpNarudzba): Promise<ErpNarudzbaResult> {
    const ep = this.config.endpoints.narudzba
    const tpl = this.config.narudzbaTemplate
    if (!ep?.path || !tpl?.bodyTemplate) {
      throw new Error('Narudžba nije konfigurisana za ovaj ERP')
    }

    const body = renderTemplate(
      tpl.bodyTemplate,
      {
        partnerId: narudzba.partnerId ?? '',
        orgJedId: narudzba.orgJedId,
        externalId: narudzba.externalId,
        nacinPlacanja: narudzba.nacinPlacanja,
        napomena: narudzba.napomena ?? '',
      },
      narudzba.stavke,
      tpl.stavkaTemplate
    )

    const res = await fetch(ep.path.startsWith('http') ? ep.path : this.config.baseUrl + ep.path, {
      method: 'POST',
      headers: buildAuthHeaders(this.config.auth),
      body,
    })
    if (!res.ok) throw new Error(`REST narudžba → HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const data = await res.json()
    return {
      id: tpl.responseIdPath ? getByPath(data, tpl.responseIdPath) : (data.id ?? data.Key),
      oznakaDokumenta: tpl.responseOznakaPath ? String(getByPath(data, tpl.responseOznakaPath)) : String(data.oznakaDokumenta ?? data.docNo ?? data.id ?? ''),
    }
  }

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      const ep = this.config.endpoints.artikli
      if (!ep?.path) return { ok: false, error: 'Endpoint za artikle nije postavljen' }
      const url = this.buildUrl(ep, { page: 1, perPage: 1 })
      const res = await fetch(url, { headers: buildAuthHeaders(this.config.auth), signal: AbortSignal.timeout(8000) })
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
      // Probaj parsirati i prebrojati
      const data = await res.json()
      const rows = ep.itemsPath ? getByPath(data, ep.itemsPath) : (Array.isArray(data) ? data : (data.items ?? data.value ?? []))
      return { ok: true, error: undefined }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  }

  // Pomoćno za GUI test — vrati sirovi odgovor da korisnik vidi strukturu
  async rawSample(resource: 'artikli' | 'grupe' | 'stanje' | 'partneri'): Promise<any> {
    const ep = this.config.endpoints[resource]
    if (!ep?.path) throw new Error('Endpoint nije postavljen')
    const url = this.buildUrl(ep, { page: 1, perPage: 2 })
    const res = await fetch(url, { headers: buildAuthHeaders(this.config.auth), signal: AbortSignal.timeout(8000) })
    const text = await res.text()
    try { return JSON.parse(text) } catch { return { _raw: text.slice(0, 1000) } }
  }
}

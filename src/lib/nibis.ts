import type {
  PaginatedResponse, Artikal, ArtikalGrupa,
  StanjeSkladista, NarudzbaCreate, NarudzbaResponse, Partner,
} from '@/types/nibis'

// ─── Per-shop konfiguracija ───────────────────────────────────────────────────
export interface NibisConfig {
  baseUrl: string
  apiKey: string
  companyYear?: string
  orgJedId?: number
}

// Default (iz .env) — koristi se kad nema shop-specific konfiguracije
export const defaultConfig: NibisConfig = {
  baseUrl: process.env.NIBIS_API_URL || 'https://api.nextvision.ba/integration/robno-materijalno',
  apiKey: process.env.NIBIS_API_KEY || '',
  companyYear: process.env.NIBIS_COMPANY_YEAR || new Date().getFullYear().toString(),
  orgJedId: parseInt(process.env.ORG_JED_ID || '1'),
}

function nibisHeaders(config: NibisConfig): HeadersInit {
  return {
    ApiKey: config.apiKey,
    'Company-Year': config.companyYear || new Date().getFullYear().toString(),
    'Accept-Language': 'bs-BA',
    'Content-Type': 'application/json',
  }
}

export interface ListParams {
  page?: number
  perPage?: number
  search?: string
  sortName?: string
  sortDirection?: 'ASC' | 'DESC'
  filters?: Array<{ name: string; operator: string; value: string }>
  since?: string
}

function buildUrl(baseUrl: string, path: string, params: ListParams = {}): string {
  const url = new URL(`${baseUrl}${path}`)
  url.searchParams.set('page', String(params.page ?? 1))
  url.searchParams.set('perPage', String(params.perPage ?? 50))
  if (params.search) url.searchParams.set('search', params.search)
  if (params.sortName) url.searchParams.set('sort.name', params.sortName)
  if (params.sortDirection) url.searchParams.set('sort.direction', params.sortDirection)
  if (params.since) url.searchParams.set('dateModifiedFrom', params.since)
  params.filters?.forEach((f, i) => {
    url.searchParams.set(`filters[${i}].name`, f.name)
    url.searchParams.set(`filters[${i}].operator`, f.operator)
    url.searchParams.set(`filters[${i}].value`, f.value)
  })
  return url.toString()
}

async function nibisGet<T>(config: NibisConfig, path: string, params: ListParams = {}): Promise<PaginatedResponse<T>> {
  const url = buildUrl(config.baseUrl, path, params)
  const res = await fetch(url, { headers: nibisHeaders(config), cache: 'no-store' })
  if (!res.ok) throw new Error(`NIBIS ${path} ${res.status}: ${await res.text()}`)
  return res.json()
}

// ─── API funkcije — sve primaju config ────────────────────────────────────────

export function getArtikli(params: ListParams = {}, config = defaultConfig) {
  return nibisGet<Artikal>(config, '/artikli', params)
}

export function getGrupe(params: ListParams = {}, config = defaultConfig) {
  return nibisGet<ArtikalGrupa>(config, '/grupe', params)
}

export function getStanje(orgJedId: number, page = 1, since?: string, config = defaultConfig) {
  return nibisGet<StanjeSkladista>(config, `/stanje-skladista/${orgJedId}`, { page, perPage: 500, ...(since && { since }) })
}

export function getPartneri(params: ListParams = {}, config = defaultConfig) {
  return nibisGet<Partner>(config, '/partneri', params)
}

export async function createNarudzba(narudzba: NarudzbaCreate, config = defaultConfig): Promise<NarudzbaResponse> {
  const res = await fetch(`${config.baseUrl}/narudzbe`, {
    method: 'POST',
    headers: nibisHeaders(config),
    body: JSON.stringify(narudzba),
  })
  if (!res.ok) throw new Error(`NIBIS narudzba ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function testConnection(config: NibisConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(buildUrl(config.baseUrl, '/grupe', { page: 1, perPage: 1 }), {
      headers: nibisHeaders(config), signal: AbortSignal.timeout(5000)
    })
    return { ok: res.ok, ...(!res.ok && { error: `HTTP ${res.status}` }) }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

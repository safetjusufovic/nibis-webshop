import type {
  PaginatedResponse, Artikal, ArtikalGrupa,
  StanjeSkladista, NarudzbaCreate, NarudzbaResponse, Partner,
} from '@/types/nibis'

// Direktno iz env — kao originalno
const BASE_URL = process.env.NIBIS_API_URL ?? ''
const API_KEY = process.env.NIBIS_API_KEY ?? ''
const COMPANY_YEAR = process.env.NIBIS_COMPANY_YEAR ?? new Date().getFullYear().toString()
const ORG_JED_ID = parseInt(process.env.ORG_JED_ID ?? process.env.NEXT_PUBLIC_ORG_JED_ID ?? '1')

// Za multi-tenant sync — prima config po shopu
export interface NibisConfig {
  baseUrl: string
  apiKey: string
  companyYear?: string
  orgJedId?: number
}

export const defaultConfig: NibisConfig = {
  baseUrl: BASE_URL,
  apiKey: API_KEY,
  companyYear: COMPANY_YEAR,
  orgJedId: ORG_JED_ID,
}

function headers(apiKey: string, companyYear: string): HeadersInit {
  return {
    ApiKey: apiKey,
    'Company-Year': companyYear,
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
  const res = await fetch(url, {
    headers: headers(config.apiKey, config.companyYear ?? COMPANY_YEAR),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`NIBIS ${path} ${res.status}: ${await res.text()}`)
  return res.json()
}

export function getArtikli(params: ListParams = {}, config = defaultConfig) {
  return nibisGet<Artikal>(config, '/artikli', params)
}

export function getGrupe(params: ListParams = {}, config = defaultConfig) {
  return nibisGet<ArtikalGrupa>(config, '/artikli-grupe', params)
}

export function getStanje(page = 1, orgJedId?: number, since?: string, config = defaultConfig) {
  const filters = orgJedId ? [{ name: 'orgJedId', operator: 'eq', value: String(orgJedId) }] : []
  return nibisGet<StanjeSkladista>(config, '/stanje-skladista', {
    page, perPage: 100,
    ...(since && { since }),
    ...(filters.length && { filters }),
  })
}

export function getPartneri(params: ListParams = {}, config = defaultConfig) {
  return nibisGet<Partner>(config, '/partneri', params)
}

// Narudžbe — koristi direktno BASE_URL iz env, bez ikakve konfiguracije
export async function createNarudzba(narudzba: NarudzbaCreate): Promise<NarudzbaResponse> {
  const url = `${BASE_URL}/dokumenti/narudzba`
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(API_KEY, COMPANY_YEAR),
    body: JSON.stringify(narudzba),
  })
  if (!res.ok) throw new Error(`NIBIS narudzba ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function testConnection(config: NibisConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      buildUrl(config.baseUrl, '/grupe', { page: 1, perPage: 1 }),
      { headers: headers(config.apiKey, config.companyYear ?? COMPANY_YEAR), signal: AbortSignal.timeout(5000) }
    )
    return { ok: res.ok, ...(!res.ok && { error: `HTTP ${res.status}` }) }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

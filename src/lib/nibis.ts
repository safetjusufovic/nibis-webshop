import type {
  PaginatedResponse,
  Artikal,
  ArtikalGrupa,
  StanjeSkladista,
  NarudzbaCreate,
  NarudzbaResponse,
  Partner,
} from '@/types/nibis'

const BASE_URL = process.env.NIBIS_API_URL || 'https://api.nextvision.ba/integration/robno-materijalno'
const API_KEY = process.env.NIBIS_API_KEY || ''
const COMPANY_YEAR = process.env.NIBIS_COMPANY_YEAR || new Date().getFullYear().toString()

function nibisHeaders(): HeadersInit {
  return {
    ApiKey: API_KEY,
    'Company-Year': COMPANY_YEAR,
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
}

function buildUrl(path: string, params: ListParams = {}): string {
  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('page', String(params.page ?? 1))
  url.searchParams.set('perPage', String(params.perPage ?? 50))
  if (params.search) url.searchParams.set('search', params.search)
  if (params.sortName) url.searchParams.set('sort.name', params.sortName)
  if (params.sortDirection) url.searchParams.set('sort.direction', params.sortDirection)
  params.filters?.forEach((f, i) => {
    url.searchParams.set(`filters[${i}].name`, f.name)
    url.searchParams.set(`filters[${i}].operator`, f.operator)
    url.searchParams.set(`filters[${i}].value`, f.value)
  })
  return url.toString()
}

async function nibisGet<T>(path: string, params?: ListParams): Promise<T> {
  const url = buildUrl(path, params)
  const res = await fetch(url, {
    headers: nibisHeaders(),
    next: { revalidate: 60 }, // Next.js ISR cache — 60s
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`NIBIS API ${res.status}: ${body}`)
  }
  return res.json()
}

// ─── Artikli ─────────────────────────────────────────────────────────────────
export async function getArtikli(params: ListParams & { grupaId?: number; aktivni?: boolean; since?: string } = {}) {
  const filters: Array<{ name: string; operator: string; value: string }> = [
    ...(params.filters ?? []),
  ]
  if (params.grupaId) filters.push({ name: 'grupaId', operator: 'eq', value: String(params.grupaId) })
  if (params.aktivni !== undefined) filters.push({ name: 'aktivan', operator: 'eq', value: String(params.aktivni) })
  if (params.since) filters.push({ name: 'dateModified', operator: 'gte', value: params.since })
  return nibisGet<PaginatedResponse<Artikal>>('/artikli', { ...params, filters, sortName: params.sortName ?? 'naziv' })
}

export async function getArtikalById(id: number): Promise<Artikal | null> {
  const data = await getArtikli({ filters: [{ name: 'id', operator: 'eq', value: String(id) }], perPage: 1 })
  return data.items[0] ?? null
}

// ─── Grupe ───────────────────────────────────────────────────────────────────
export async function getGrupe(params: ListParams = {}) {
  return nibisGet<PaginatedResponse<ArtikalGrupa>>('/artikli-grupe', {
    ...params,
    perPage: params.perPage ?? 100,
    sortName: 'naziv',
  })
}

// ─── Stanje skladišta ────────────────────────────────────────────────────────
export async function getStanje(orgJedId: number, page: number = 1, since?: string) {
  const filters: Array<{ name: string; operator: string; value: string }> = [
    { name: 'orgJedId', operator: 'eq', value: String(orgJedId) },
  ]
  if (since) filters.push({ name: 'dateModified', operator: 'gte', value: since })
  return nibisGet<PaginatedResponse<StanjeSkladista>>('/stanje-skladista', {
    filters,
    page,
    perPage: 100,
  })
}

// ─── Narudžba ────────────────────────────────────────────────────────────────
export async function createNarudzba(payload: NarudzbaCreate): Promise<NarudzbaResponse> {
  const res = await fetch(`${BASE_URL}/dokumenti/narudzba`, {
    method: 'POST',
    headers: nibisHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`NIBIS narudžba ${res.status}: ${body}`)
  }
  return res.json()
}

// ─── Partneri ─────────────────────────────────────────────────────────────────
export async function getPartneri(params: ListParams = {}) {
  return nibisGet<PaginatedResponse<Partner>>('/partner', {
    ...params,
    perPage: params.perPage ?? 100,
    sortName: 'naziv',
  })
}

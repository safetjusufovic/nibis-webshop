import type { RestAuthConfig, FieldMap } from './rest-config-types'

// Čita vrijednost iz objekta po putanji: 'data.rows', '@odata.count', 'meta.total'
export function getByPath(obj: any, path: string): any {
  if (!path) return obj
  // Podrži ključeve s tačkom u imenu (npr. @odata.count) — probaj prvo direktno
  if (obj && typeof obj === 'object' && path in obj) return obj[path]
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

// Gradi auth + extra headere iz konfiguracije
export function buildAuthHeaders(auth: RestAuthConfig): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  switch (auth.type) {
    case 'basic':
      if (auth.username != null) h['Authorization'] = 'Basic ' + Buffer.from(`${auth.username}:${auth.password ?? ''}`).toString('base64')
      break
    case 'bearer':
      if (auth.token) h['Authorization'] = 'Bearer ' + auth.token
      break
    case 'apikey_header':
    case 'custom_header':
      if (auth.headerName) h[auth.headerName] = auth.headerValue ?? ''
      break
  }
  auth.extraHeaders?.forEach(eh => { if (eh.name) h[eh.name] = eh.value })
  return h
}

// Primijeni field mapping na jedan red ERP odgovora → standardni objekt
export function applyMapping(row: any, mapping: FieldMap | undefined): Record<string, any> {
  if (!mapping) return row
  const out: Record<string, any> = {}
  for (const [standardField, erpPath] of Object.entries(mapping)) {
    if (!erpPath) continue
    out[standardField] = getByPath(row, erpPath)
  }
  return out
}

// Konvertuj vrijednost u broj (za cijene/količine)
export function toNum(v: any): number {
  if (v == null) return 0
  const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : Number(v)
  return isNaN(n) ? 0 : n
}

// Konvertuj u boolean (ERP-ovi koriste 'T'/'F', 1/0, true/false, 'Y'/'N')
export function toBool(v: any, defaultVal = true): boolean {
  if (v == null) return defaultVal
  if (typeof v === 'boolean') return v
  const s = String(v).toLowerCase()
  if (['t', 'true', '1', 'y', 'yes', 'da'].includes(s)) return true
  if (['f', 'false', '0', 'n', 'no', 'ne'].includes(s)) return false
  return defaultVal
}

// Jednostavan template engine za narudžbu: {{field}} i {{#stavke}}...{{/stavke}}
export function renderTemplate(template: string, data: Record<string, any>, stavke?: any[], stavkaTemplate?: string): string {
  let result = template

  // Render stavke listu
  if (stavke && stavkaTemplate) {
    const stavkeJson = stavke.map(st => {
      let s = stavkaTemplate
      for (const [k, v] of Object.entries(st)) {
        s = s.replace(new RegExp(`{{${k}}}`, 'g'), JSON.stringify(v).replace(/^"|"$/g, ''))
      }
      return s
    }).join(',')
    result = result.replace(/{{#stavke}}[\s\S]*?{{\/stavke}}/g, stavkeJson)
  }

  // Render obična polja
  for (const [k, v] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${k}}}`, 'g'), v == null ? '' : String(v))
  }
  return result
}

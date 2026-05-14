/**
 * Central admin fetch utility
 * Reads shopSlug from URL pathname and adds ?shop= to all API calls
 */

export function getAdminShopSlug(): string {
  if (typeof window === 'undefined') return ''
  const segments = window.location.pathname.split('/').filter(Boolean)
  const adminIdx = segments.indexOf('admin')
  // /novishop/admin/* -> novishop
  // /admin/* -> main (main shop slug)
  return adminIdx > 0 ? segments[adminIdx - 1] : 'main'
}

export function adminApiUrl(path: string): string {
  const slug = getAdminShopSlug()
  const sep = path.includes('?') ? '&' : '?'
  return path + sep + 'shop=' + slug
}

export async function adminFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(adminApiUrl(path), options)
}

export async function getAdminShopId(): Promise<string | null> {
  const slug = getAdminShopSlug()
  const res = await fetch('/api/super-admin/shop-id?slug=' + slug, {
    headers: { 'x-super-admin-secret': 'nibis-super-2025' }
  })
  const d = await res.json()
  return d.id || null
}

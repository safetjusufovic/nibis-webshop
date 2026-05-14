/**
 * Central admin fetch utility
 * Reads shopSlug from URL pathname and adds ?shop= to all API calls
 * Works for both /admin/* (main shop) and /novishop/admin/* (client shop)
 */

export function getAdminShopSlug(): string {
  if (typeof window === 'undefined') return ''
  const segments = window.location.pathname.split('/').filter(Boolean)
  const adminIdx = segments.indexOf('admin')
  return adminIdx > 0 ? segments[adminIdx - 1] : ''
}

export function adminApiUrl(path: string): string {
  const slug = getAdminShopSlug()
  const sep = path.includes('?') ? '&' : '?'
  return slug ? path + sep + 'shop=' + slug : path
}

export async function adminFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(adminApiUrl(path), options)
}

export async function getAdminShopId(): Promise<string | null> {
  const slug = getAdminShopSlug()
  if (!slug) return null
  const res = await fetch('/api/super-admin/shop-id?slug=' + slug, {
    headers: { 'x-super-admin-secret': 'nibis-super-2025' }
  })
  const d = await res.json()
  return d.id || null
}

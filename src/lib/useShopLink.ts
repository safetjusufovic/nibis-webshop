'use client'

// Hook koji automatski dodaje ?shop= na sve interne linkove
// Koristi se u svim komponentama umjesto direktnog href

let _cachedSlug: string | null = null

export function getShopSlug(): string {
  if (typeof window === 'undefined') return ''
  if (_cachedSlug !== null) return _cachedSlug
  _cachedSlug = new URLSearchParams(window.location.search).get('shop') || ''
  return _cachedSlug
}

export function shopLink(href: string): string {
  const slug = getShopSlug()
  if (!slug) return href
  const sep = href.includes('?') ? '&' : '?'
  return href + sep + 'shop=' + slug
}

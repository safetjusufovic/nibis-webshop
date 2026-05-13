'use client'

// Hook koji automatski dodaje ?shop= na sve interne linkove
// Koristi se u svim komponentama umjesto direktnog href

export function getShopSlug(): string {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('shop') || ''
}

export function shopLink(href: string): string {
  const slug = getShopSlug()
  if (!slug) return href
  const sep = href.includes('?') ? '&' : '?'
  return href + sep + 'shop=' + slug
}

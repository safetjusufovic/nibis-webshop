// Centralna fetch funkcija koja automatski dodaje ?shop= iz URL-a
// Koristi se u svim komponentama umjesto direktnog fetch('/api/postavke...')

function getShopSlug(): string {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('shop') || ''
}

export function shopUrl(url: string): string {
  const slug = getShopSlug()
  if (!slug) return url
  const sep = url.includes('?') ? '&' : '?'
  return url + sep + 'shop=' + slug
}

export function shopFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(shopUrl(url), options)
}

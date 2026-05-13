'use client'

import { useEffect, useState } from 'react'

interface ShopContext {
  shopSlug: string       // '' = glavni shop
  shopId: string | null  // null = glavni shop
  shopParam: string      // '?shop=slug' ili ''
  shopParamAmp: string   // '&shop=slug' ili ''
  isMainShop: boolean
}

// Cache shop_id po slug-u da ne fetchujemo svaki put
const slugToIdCache: Record<string, string> = {}

export function useShopContext(): ShopContext {
  const [shopId, setShopId] = useState<string | null>(null)
  const [shopSlug, setShopSlug] = useState('')

  useEffect(() => {
    // Čitaj slug iz URL-a
    const slug = new URLSearchParams(window.location.search).get('shop') || ''
    setShopSlug(slug)

    if (!slug) return

    // Dohvati shop_id za ovaj slug
    if (slugToIdCache[slug]) {
      setShopId(slugToIdCache[slug])
      return
    }

    fetch('/api/super-admin/shop-id?slug=' + slug, {
      headers: { 'x-super-admin-secret': process.env.NEXT_PUBLIC_SUPER_ADMIN_SECRET || 'nibis-super-2025' }
    })
      .then(r => r.json())
      .then(d => {
        if (d.id) {
          slugToIdCache[slug] = d.id
          setShopId(d.id)
        }
      })
      .catch(() => {})
  }, [])

  const shopParam = shopSlug ? '?shop=' + shopSlug : ''
  const shopParamAmp = shopSlug ? '&shop=' + shopSlug : ''

  return {
    shopSlug,
    shopId,
    shopParam,
    shopParamAmp,
    isMainShop: !shopSlug,
  }
}

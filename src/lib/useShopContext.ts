'use client'

import { useState, useEffect } from 'react'

interface ShopContext {
  shopSlug: string
  shopId: string | null
  shopParam: string
  shopParamAmp: string
  isMainShop: boolean
}

const slugToIdCache: Record<string, string> = {}

export function useShopContext(): ShopContext {
  const [shopId, setShopId] = useState<string | null>(null)
  const [shopSlug, setShopSlug] = useState('')

  useEffect(() => {
    // 1. Čitaj iz ?shop= query param
    let slug = new URLSearchParams(window.location.search).get('shop') || ''

    // 2. Ako nema query param, čitaj iz path-a
    // Npr. /novishop/admin/izgled -> slug = novishop
    // Npr. /novishop/ -> slug = novishop
    if (!slug) {
      const segments = window.location.pathname.split('/').filter(Boolean)
      const adminIdx = segments.indexOf('admin')
      if (adminIdx > 0) {
        // /novishop/admin/... -> segments[0] = novishop
        slug = segments[0]
      } else if (segments.length > 0 && !['login', 'register', 'admin', 'super-admin', 'vijesti', 'stranica', 'proizvod', 'favoriti', 'moje-narudzbe'].includes(segments[0])) {
        // /novishop/ -> segments[0] = novishop
        slug = segments[0]
      }
    }

    setShopSlug(slug)
    if (!slug) return

    if (slugToIdCache[slug]) {
      setShopId(slugToIdCache[slug])
      return
    }

    fetch('/api/super-admin/shop-id?slug=' + slug, {
      headers: { 'x-super-admin-secret': 'nibis-super-2025' }
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

  return { shopSlug, shopId, shopParam, shopParamAmp, isMainShop: !shopSlug }
}

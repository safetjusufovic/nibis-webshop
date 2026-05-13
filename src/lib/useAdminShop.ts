'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface AdminShop {
  shopSlug: string
  shopId: string | null
  isMainShop: boolean
  loaded: boolean
}

const cache: Record<string, string> = {}

export function useAdminShop(): AdminShop {
  const pathname = usePathname()
  const [shopId, setShopId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Izvuci shopSlug iz URL path-a
  // /admin -> glavni shop
  // /novishop/admin -> klijentski shop
  const segments = pathname.split('/').filter(Boolean)
  const adminIdx = segments.indexOf('admin')
  const shopSlug = adminIdx > 0 ? segments[adminIdx - 1] : ''

  useEffect(() => {
    if (!shopSlug) {
      setShopId(null)
      setLoaded(true)
      return
    }
    if (cache[shopSlug]) {
      setShopId(cache[shopSlug])
      setLoaded(true)
      return
    }
    fetch('/api/super-admin/shop-id?slug=' + shopSlug, {
      headers: { 'x-super-admin-secret': 'nibis-super-2025' }
    })
      .then(r => r.json())
      .then(d => {
        if (d.id) cache[shopSlug] = d.id
        setShopId(d.id || null)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [shopSlug])

  return {
    shopSlug,
    shopId,
    isMainShop: !shopSlug,
    loaded,
  }
}

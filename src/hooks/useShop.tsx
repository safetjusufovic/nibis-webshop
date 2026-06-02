'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface ShopContextType {
  shopSlug: string      // '' za main shop, 'novishop' za klijentske
  shopId: string | null // UUID iz baze
  isMain: boolean
  loaded: boolean
  apiUrl: (path: string) => string  // dodaje ?shop= automatski
}

const ShopContext = createContext<ShopContextType>({
  shopSlug: '',
  shopId: null,
  isMain: true,
  loaded: false,
  apiUrl: (p) => p,
})

const slugCache: Record<string, string> = {}

export function ShopProvider({ children, slug }: { children: React.ReactNode; slug?: string }) {
  const pathname = usePathname()

  // Odredi shopSlug: prop > path segment > ''
  const detectedSlug = slug ?? (() => {
    const segs = pathname.split('/').filter(Boolean)
    // Prva ruta nakon root je shopSlug ako nije rezervisana
    const reserved = ['admin', 'login', 'register', 'super-admin', 'api', 'blog', 'editor-preview', 'templates', 'proizvod', 'stranica', 'vijesti', 'moje-narudzbe', 'favoriti']
    if (segs.length > 0 && !reserved.includes(segs[0])) return segs[0]
    return ''
  })()

  const [shopId, setShopId] = useState<string | null>(slugCache[detectedSlug || 'main'] ?? null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const lookupSlug = detectedSlug || 'main'
    if (slugCache[lookupSlug]) {
      setShopId(slugCache[lookupSlug])
      setLoaded(true)
      return
    }
    fetch('/api/super-admin/shop-id?slug=' + lookupSlug, {
      headers: { 'x-super-admin-secret': 'nibis-super-2025' }
    })
      .then(r => r.json())
      .then(d => {
        if (d.id) slugCache[lookupSlug] = d.id
        setShopId(d.id || null)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [detectedSlug])

  const apiUrl = (path: string) => {
    const slug = detectedSlug || 'main'
    const sep = path.includes('?') ? '&' : '?'
    return path + sep + 'shop=' + slug
  }

  return (
    <ShopContext.Provider value={{
      shopSlug: detectedSlug,
      shopId,
      isMain: !detectedSlug,
      loaded,
      apiUrl,
    }}>
      {children}
    </ShopContext.Provider>
  )
}

export function useShop() {
  return useContext(ShopContext)
}

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePathname } from 'next/navigation'

interface Notifikacije {
  noveNarudzbe: number
  noveRegistracije: number
}

export function useAdminNotifikacije() {
  const { isAdmin } = useAuth()
  const pathname = usePathname()
  const [notifikacije, setNotifikacije] = useState<Notifikacije>({ noveNarudzbe: 0, noveRegistracije: 0 })

  // Čitaj shopSlug iz path-a
  const segs = pathname.split('/').filter(Boolean)
  const adminIdx = segs.indexOf('admin')
  const shopSlug = adminIdx > 0 ? segs[adminIdx - 1] : 'main'

  async function load(slug: string) {
    if (!isAdmin) return

    // Dohvati shop_id
    const shopRes = await fetch('/api/super-admin/shop-id?slug=' + slug, {
      headers: { 'x-super-admin-secret': 'nibis-super-2025' }
    })
    const shopData = await shopRes.json()
    const shopId = shopData.id
    if (!shopId) return

    const zadnjih24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const [{ count: narudzbe }, { count: registracije }] = await Promise.all([
      supabase.from('narudzbe').select('id', { count: 'exact', head: true })
        .gte('created_at', zadnjih24h).eq('status', 'poslana').eq('shop_id', shopId),
      supabase.from('registracija_zahtjevi').select('id', { count: 'exact', head: true })
        .is('odobren', null).eq('shop_id', shopId),
    ])

    setNotifikacije({
      noveNarudzbe: narudzbe ?? 0,
      noveRegistracije: registracije ?? 0,
    })
  }

  useEffect(() => {
    if (!isAdmin) return
    load(shopSlug)

    const channel = supabase
      .channel('admin-notifikacije-' + shopSlug)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'narudzbe' }, () => load(shopSlug))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registracija_zahtjevi' }, () => load(shopSlug))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isAdmin, shopSlug])

  return notifikacije
}

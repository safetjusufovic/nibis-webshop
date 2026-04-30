'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Notifikacije {
  noveNarudzbe: number
  noveRegistracije: number
}

export function useAdminNotifikacije() {
  const { isAdmin } = useAuth()
  const [notifikacije, setNotifikacije] = useState<Notifikacije>({ noveNarudzbe: 0, noveRegistracije: 0 })

  async function load() {
    if (!isAdmin) return

    const zadnjih24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const [{ count: narudzbe }, { count: registracije }] = await Promise.all([
      supabase.from('narudzbe').select('id', { count: 'exact', head: true })
        .gte('created_at', zadnjih24h).eq('status', 'poslana'),
      supabase.from('registracija_zahtjevi').select('id', { count: 'exact', head: true })
        .is('odobren', null),
    ])

    setNotifikacije({
      noveNarudzbe: narudzbe ?? 0,
      noveRegistracije: registracije ?? 0,
    })
  }

  useEffect(() => {
    if (!isAdmin) return
    load()

    // Real-time subscription
    const channel = supabase
      .channel('admin-notifikacije')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'narudzbe' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registracija_zahtjevi' }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isAdmin])

  return notifikacije
}

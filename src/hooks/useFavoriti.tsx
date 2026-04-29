'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface FavoritiContext {
  favoriti: Set<number>
  toggle: (artikalId: number) => Promise<void>
  loading: boolean
}

const Ctx = createContext<FavoritiContext>({ favoriti: new Set(), toggle: async () => {}, loading: false })

export function FavoritiProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [favoriti, setFavoriti] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { setFavoriti(new Set()); return }
    supabase
      .from('favoriti')
      .select('artikal_id')
      .eq('korisnik_id', user.id)
      .then(({ data }) => {
        setFavoriti(new Set(data?.map(f => f.artikal_id) ?? []))
      })
  }, [user])

  async function toggle(artikalId: number) {
    if (!user) return
    if (favoriti.has(artikalId)) {
      await supabase.from('favoriti').delete().eq('korisnik_id', user.id).eq('artikal_id', artikalId)
      setFavoriti(prev => { const next = new Set(prev); next.delete(artikalId); return next })
    } else {
      await supabase.from('favoriti').insert({ korisnik_id: user.id, artikal_id: artikalId })
      setFavoriti(prev => new Set([...prev, artikalId]))
    }
  }

  return <Ctx.Provider value={{ favoriti, toggle, loading }}>{children}</Ctx.Provider>
}

export function useFavoriti() { return useContext(Ctx) }

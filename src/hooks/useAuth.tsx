'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface KorisnikProfil {
  id: string
  partner_id: number | null
  ime: string | null
  prezime: string | null
  telefon: string | null
  role: 'admin' | 'kupac'
  odobren: boolean
  // Iz join-a sa partneri tabelom
  partner?: {
    id: number
    naziv: string
    rabat: number
    rok_placanja: number | null
    pdv_broj: string | null
    limit_fin: number | null
    limit_fin2: number | null
  } | null
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  profil: KorisnikProfil | null
  loading: boolean
  isAdmin: boolean
  isOdobren: boolean
  rabat: number // 0-100, rabat partnera ili 0
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profil, setProfil] = useState<KorisnikProfil | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfil(userId: string) {
    // Join sa partneri tabelom da dobijemo rabat i ostale info
    const { data } = await supabase
      .from('korisnici')
      .select(`
        id, partner_id, ime, prezime, telefon, role, odobren,
        partner:partneri (
          id, naziv, rabat, rok_placanja, pdv_broj, limit_fin, limit_fin2
        )
      `)
      .eq('id', userId)
      .single()
    setProfil(data ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) loadProfil(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) loadProfil(session.user.id)
      else { setProfil(null) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfil(null)
  }

  const isAdmin = profil?.role === 'admin'
  const isOdobren = profil?.odobren === true
  const rabat = (profil?.partner as any)?.rabat ?? 0

  return (
    <AuthContext.Provider value={{ user, session, profil, loading, isAdmin, isOdobren, rabat, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

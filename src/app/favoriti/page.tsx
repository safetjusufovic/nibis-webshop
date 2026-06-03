'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import AuthGuard from '@/components/auth/AuthGuard'
import ProductCard from '@/components/shop/ProductCard'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Heart } from 'lucide-react'
import type { Artikal, StanjeSkladista } from '@/types/nibis'
import { siteConfig } from '@/lib/config'

export default function FavoritiPage() {
  const shopSlug = ''  // main shop
  const { user } = useAuth()
  const [artikli, setArtikli] = useState<Artikal[]>([])
  const [stanje, setStanje] = useState<Record<number, StanjeSkladista>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      // Dohvati favorite (samo artikal_id)
      const { data: favData } = await supabase
        .from('favoriti')
        .select('artikal_id')
        .eq('korisnik_id', user!.id)
        .order('created_at', { ascending: false })

      const favIds = (favData ?? []).map((f: any) => f.artikal_id)
      if (favIds.length === 0) { setArtikli([]); setLoading(false); return }

      // Dohvati korisnikov shop_id
      const { data: korisnik } = await supabase
        .from('korisnici').select('shop_id').eq('id', user!.id).single()

      // Dohvati artikle za te ID-eve unutar shopa
      let artQ = supabase.from('artikli').select('*').in('id', favIds)
      if (korisnik?.shop_id) artQ = artQ.eq('shop_id', korisnik.shop_id)
      const { data: artData } = await artQ

      const items = artData ?? []
      setArtikli(items)

      if (items.length > 0) {
        const ids = items.map((a: any) => a.id).join(',')
        let stQ = supabase
          .from('stanje_skladista')
          .select('*')
          .in('artikal_id', items.map((a: any) => a.id))
        if (korisnik?.shop_id) stQ = stQ.eq('shop_id', korisnik.shop_id)
        const { data: sd } = await stQ
        const map: Record<number, StanjeSkladista> = {}
        sd?.forEach((s: any) => { map[s.artikal_id] = { ...s, artikalId: s.artikal_id, orgJedId: s.org_jed_id, raspolozivaKolicina: s.raspoloziva_kolicina, nabavnaCijena: s.nabavna_cijena, skladisnoMjesto: null, dateCreated: '', dateModified: '' } })
        setStanje(map)
      }
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
        <Header />
        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 64px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Heart size={22} style={{ color: '#DC2626' }} fill="#DC2626" />
              Moji favoriti
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Artikli koje ste spasili za brži pristup
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ height: '280px', background: 'white', border: '1px solid var(--border)', borderRadius: '14px', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : artikli.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
              <Heart size={40} style={{ margin: '0 auto 16px', opacity: 0.2, display: 'block' }} />
              <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>Nemate još favorita</p>
              <p style={{ fontSize: '14px', marginBottom: '20px' }}>Kliknite srce na artiklima koje želite spasiti</p>
              <Link href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                Pregledaj katalog
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {artikli.map((a: any) => (
                <ProductCard
                  shopSlug={shopSlug}
                  key={a.id}
                  artikal={{
                    ...a,
                    vanUpotrebe: a.van_upotrebe,
                    procPoreza: a.proc_poreza,
                    planskaMaloprodajnaCijena: a.planska_maloprodajna_cijena,
                    grupaId: a.grupa_id,
                    grupa: a.grupe,
                  }}
                  stanje={stanje[a.id] ?? null}
                  slika={a.slika_url}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}

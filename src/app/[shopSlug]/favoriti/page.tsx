'use client'
import { usePathname } from 'next/navigation'

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
  const pathname = usePathname()
  const shopSlug = (() => { const s = pathname.split('/').filter(Boolean); const i = s.indexOf('favoriti'); return i > 0 ? s[i-1] : '' })()

  const { user } = useAuth()
  const [artikli, setArtikli] = useState<Artikal[]>([])
  const [stanje, setStanje] = useState<Record<number, StanjeSkladista>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('favoriti')
        .select('artikal_id, artikli(*, grupe:grupa_id(id, sifra, naziv))')
        .eq('korisnik_id', user!.id)
        .order('created_at', { ascending: false })

      const items = (data ?? []).map((f: any) => f.artikli).filter(Boolean)
      setArtikli(items)

      if (items.length > 0) {
        const ids = items.map((a: any) => a.id).join(',')
        const { data: sd } = await supabase
          .from('stanje_skladista')
          .select('*')
          .in('artikal_id', items.map((a: any) => a.id))
          .eq('org_jed_id', siteConfig.orgJedId)
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

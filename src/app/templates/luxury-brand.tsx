'use client'
// LUXURY BRAND — inspirisan premium B2B brandovima
// Full-width hero, masonry grid, editorial kartice, minimalan bijeli

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useFavoriti } from '@/hooks/useFavoriti'
import { formatCijena, siteConfig } from '@/lib/config'
import { ShoppingCart, Heart, Package, Search, ArrowRight, Plus } from 'lucide-react'
import type { Artikal, ArtikalGrupa, StanjeSkladista, PaginatedResponse } from '@/types/nibis'

export default function LuxuryBrand() {
  const [artikli, setArtikli] = useState<Artikal[]>([])
  const [stanje, setStanje] = useState<Record<number, StanjeSkladista>>({})
  const [grupe, setGrupe] = useState<ArtikalGrupa[]>([])
  const [activeGrupa, setActiveGrupa] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [shopNaziv, setShopNaziv] = useState('NIBIS')
  const perPage = 18
  const { cart, add } = useCart()
  const { user, rabat } = useAuth()
  const { favoriti, toggle: toggleFavorit } = useFavoriti()
  const [showLogin, setShowLogin] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const searchTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/grupe').then(r => r.json()).then(d => setGrupe(d.items ?? [])).catch(() => {})
    fetch('/api/postavke?kljuci=shop_naziv').then(r => r.json()).then(d => { if (d.shop_naziv) setShopNaziv(d.shop_naziv) }).catch(() => {})
    const gid = new URLSearchParams(window.location.search).get('grupaId')
    if (gid) setActiveGrupa(parseInt(gid))
    function sync() { const g = new URLSearchParams(window.location.search).get('grupaId'); setActiveGrupa(g ? parseInt(g) : null); setPage(1) }
    window.addEventListener('grupaChanged', sync)
    return () => window.removeEventListener('grupaChanged', sync)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ page: String(page), perPage: String(perPage), ...(search && { search }), ...(activeGrupa && { grupaId: String(activeGrupa) }) })
    const data: PaginatedResponse<Artikal> = await fetch('/api/artikli?' + p).then(r => r.json())
    setArtikli(data.items ?? []); setTotal(data.total ?? 0)
    if (data.items?.length) {
      const sd = await fetch('/api/stanje?ids=' + data.items.map(a => a.id).join(',')).then(r => r.json())
      const map: Record<number, StanjeSkladista> = {}
      sd.items?.forEach((s: StanjeSkladista) => { map[s.artikalId] = s })
      setStanje(map)
    }
    setLoading(false)
  }, [page, search, activeGrupa])

  useEffect(() => { load() }, [load])

  function selectGrupa(id: number | null) {
    setActiveGrupa(id); setPage(1)
    const url = new URL(window.location.href)
    id ? url.searchParams.set('grupaId', String(id)) : url.searchParams.delete('grupaId')
    window.history.pushState({}, '', url.toString())
  }

  const roots = grupe.filter(g => !g.parentId)
  const totalPages = Math.ceil(total / perPage)
  const activeGrupaObj = grupe.find(g => g.id === activeGrupa)

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Header />

      {/* Full-width editorial hero */}
      {!activeGrupa && !search && (
        <div style={{ borderBottom: '1px solid #e5e7eb', padding: '48px 0 0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', marginBottom: '0' }}>
              <div style={{ padding: '0 48px 48px 0', borderRight: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '20px' }}>
                  B2B Webshop · {total.toLocaleString()} artikala
                </div>
                <h1 style={{ fontSize: '52px', fontWeight: 800, color: '#111827', margin: '0 0 20px', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
                  {shopNaziv}
                </h1>
                <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.7, margin: '0 0 32px', maxWidth: '380px' }}>
                  Profesionalna B2B narudžba. Brza isporuka, konkurentne cijene, provjerena kvaliteta.
                </p>
                <div style={{ position: 'relative', maxWidth: '360px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input placeholder="Pretraži artikle ili šifre..."
                    onChange={e => { if (searchTimer.current) clearTimeout(searchTimer.current); searchTimer.current = setTimeout(() => { setSearch(e.target.value); setPage(1) }, 350) }}
                    style={{ width: '100%', paddingLeft: '42px', paddingRight: '14px', height: '48px', fontSize: '14px', border: '2px solid #111827', borderRadius: '4px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, color: '#111827' }}
                    onFocus={e => e.target.style.borderColor = '#111827'}
                  />
                </div>
              </div>
              <div style={{ paddingLeft: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: '48px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>
                  Kategorije
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {roots.slice(0, 8).map((g, i) => (
                    <button key={g.id} onClick={() => selectGrupa(g.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', border: 'none', borderBottom: '1px solid #e5e7eb', background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.1s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.paddingLeft = '8px' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.paddingLeft = '0' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {g.ikonaUrl ? <img src={g.ikonaUrl} alt="" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '4px' }} /> : <div style={{ width: '24px', height: '24px', background: g.boja || '#f3f4f6', borderRadius: '4px' }} />}
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{g.naziv}</span>
                      </div>
                      <ArrowRight size={14} style={{ color: '#9ca3af' }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter bar when category active */}
      {(activeGrupa || search) && (
        <div style={{ borderBottom: '1px solid #e5e7eb', padding: '12px 0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => selectGrupa(null)} style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', padding: '5px 12px', fontFamily: 'inherit' }}>← Sve kategorije</button>
            {activeGrupaObj && <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{activeGrupaObj.naziv}</span>}
            <div style={{ position: 'relative', marginLeft: 'auto' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input placeholder="Pretraži..." onChange={e => { if (searchTimer.current) clearTimeout(searchTimer.current); searchTimer.current = setTimeout(() => { setSearch(e.target.value); setPage(1) }, 350) }}
                style={{ paddingLeft: '30px', paddingRight: '10px', height: '34px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '4px', outline: 'none', fontFamily: 'inherit', width: '220px' }} />
            </div>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>{total.toLocaleString()} artikala</span>
          </div>
        </div>
      )}

      {/* Horizontal category scroll when no category selected */}
      {!activeGrupa && !search && roots.length > 8 && (
        <div style={{ borderBottom: '1px solid #e5e7eb', padding: '0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' as const, gap: '0' }}>
            {roots.slice(8).map(g => (
              <button key={g.id} onClick={() => selectGrupa(g.id)}
                style={{ padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#374151', fontFamily: 'inherit', whiteSpace: 'nowrap', borderBottom: '2px solid transparent', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderBottomColor = '#111827'; (e.currentTarget as HTMLElement).style.color = '#111827' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderBottomColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#374151' }}
              >{g.naziv}</button>
            ))}
          </div>
        </div>
      )}

      {/* Product grid */}
      <div style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '48px 32px' }}>
        {!activeGrupa && !search && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '32px', paddingBottom: '20px', borderBottom: '2px solid #111827' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Svi artikli</h2>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>{total.toLocaleString()} artikala</span>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#e5e7eb' }}>
            {Array(9).fill(0).map((_, i) => <div key={i} style={{ height: '320px', background: 'white', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#e5e7eb' }}>
            {artikli.map((a, idx) => {
              const s = stanje[a.id]
              const cijena = s ? s[siteConfig.tipCijene] || 0 : 0
              const cijenaKupca = rabat > 0 && cijena > 0 ? cijena * (1 - rabat / 100) : cijena
              const naStanju = s && s.raspolozivaKolicina > 0
              const isFav = favoriti.has(a.id)
              const isHovered = hoveredCard === a.id
              return (
                <div key={a.id} style={{ background: 'white', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={() => setHoveredCard(a.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <Link href={'/proizvod/' + a.id} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: idx % 3 === 1 ? '#fafafa' : 'white', transition: 'background 0.2s' }}>
                      {a.slika_url ? <img src={a.slika_url} alt="" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain', transform: isHovered ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.3s' }} /> : <Package size={48} style={{ color: '#e5e7eb' }} />}
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 4px', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{a.sifra}</p>
                      <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#111827', margin: '0 0 8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{a.naziv}</h3>
                    </div>
                  </Link>
                  <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{cijenaKupca > 0 ? formatCijena(cijenaKupca) : '—'}</div>
                      <div style={{ fontSize: '11px', color: naStanju ? '#16a34a' : '#dc2626', marginTop: '2px', fontWeight: 500 }}>{naStanju ? '• Na stanju' : '• Nema na stanju'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => toggleFavorit(a.id)}
                        style={{ width: '36px', height: '36px', border: '1px solid #e5e7eb', borderRadius: '4px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Heart size={15} style={{ color: isFav ? '#dc2626' : '#9ca3af' }} fill={isFav ? '#dc2626' : 'none'} />
                      </button>
                      <button onClick={() => { if (!user) { setShowLogin(true); return }; if (naStanju) add(a, cijena, s!) }} disabled={!naStanju}
                        style={{ padding: '8px 14px', background: naStanju ? '#111827' : '#f3f4f6', color: naStanju ? 'white' : '#9ca3af', border: 'none', borderRadius: '4px', cursor: naStanju ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', transition: 'background 0.15s' }}
                        onMouseEnter={e => { if (naStanju) (e.currentTarget as HTMLElement).style.background = '#374151' }}
                        onMouseLeave={e => { if (naStanju) (e.currentTarget as HTMLElement).style.background = '#111827' }}
                      >
                        <Plus size={13} /> Dodaj
                      </button>
                    </div>
                  </div>
                  {/* Hover overlay */}
                  {isHovered && (a.akcija_popust || 0) > 0 && (
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#111827', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 10px', letterSpacing: '0.05em' }}>
                      -{a.akcija_popust}%
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '0', justifyContent: 'center', marginTop: '48px', border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden', width: 'fit-content', margin: '48px auto 0' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '10px 18px', border: 'none', borderRight: '1px solid #e5e7eb', background: 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '13px', color: '#374151', opacity: page <= 1 ? 0.4 : 1, fontFamily: 'inherit' }}>←</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ padding: '10px 16px', border: 'none', borderRight: '1px solid #e5e7eb', background: page === p ? '#111827' : 'white', color: page === p ? 'white' : '#374151', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: page === p ? 700 : 400 }}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: '10px 18px', border: 'none', background: 'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', color: '#374151', opacity: page >= totalPages ? 0.4 : 1, fontFamily: 'inherit' }}>→</button>
          </div>
        )}
      </div>

      <Footer />

      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLogin(false)}>
          <div style={{ background: 'white', padding: '40px', maxWidth: '380px', width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em' }}>Prijava potrebna</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px', lineHeight: 1.6 }}>Za dodavanje u korpu potrebna je B2B prijava.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLogin(false)} style={{ flex: 1, padding: '12px', background: 'white', border: '2px solid #111827', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600 }}>Zatvori</button>
              <a href="/login" style={{ flex: 1, padding: '12px', background: '#111827', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Prijava →</a>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

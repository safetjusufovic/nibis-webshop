'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useFavoriti } from '@/hooks/useFavoriti'
import { formatCijena, siteConfig } from '@/lib/config'
import { ShoppingCart, Heart, Package, Search, Zap, ChevronRight } from 'lucide-react'
import type { Artikal, ArtikalGrupa, StanjeSkladista, PaginatedResponse } from '@/types/nibis'

export default function ObsidianDark() {
  const [artikli, setArtikli] = useState<Artikal[]>([])
  const [stanje, setStanje] = useState<Record<number, StanjeSkladista>>({})
  const [grupe, setGrupe] = useState<ArtikalGrupa[]>([])
  const [activeGrupa, setActiveGrupa] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const perPage = 24
  const { add } = useCart()
  const { user, rabat } = useAuth()
  const { favoriti, toggle: toggleFavorit } = useFavoriti()
  const [showLogin, setShowLogin] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const searchTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/grupe').then(r => r.json()).then(d => setGrupe(d.items ?? [])).catch(() => {})
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

  const totalPages = Math.ceil(total / perPage)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a12', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", color: '#e2e8f0' }}>
      <Header />

      {/* Category nav */}
      <div style={{ background: '#0d0d1a', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' as const, gap: '2px' }}>
          <button onClick={() => selectGrupa(null)} style={{ padding: '10px 16px', background: activeGrupa === null ? 'rgba(99,102,241,0.2)' : 'transparent', color: activeGrupa === null ? '#818cf8' : '#64748b', border: 'none', borderBottom: activeGrupa === null ? '2px solid #6366f1' : '2px solid transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.15s' }}>
            Sve kategorije
          </button>
          {grupe.filter(g => !g.parentId).slice(0, 12).map(g => (
            <button key={g.id} onClick={() => selectGrupa(g.id)} style={{ padding: '10px 16px', background: activeGrupa === g.id ? 'rgba(99,102,241,0.15)' : 'transparent', color: activeGrupa === g.id ? '#818cf8' : '#64748b', border: 'none', borderBottom: activeGrupa === g.id ? '2px solid #6366f1' : '2px solid transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.15s' }}>
              {g.naziv}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div style={{ background: '#0d0d1a', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
            <input value={searchInput} onChange={e => { setSearchInput(e.target.value); if (searchTimer.current) clearTimeout(searchTimer.current); searchTimer.current = setTimeout(() => { setSearch(e.target.value); setPage(1) }, 350) }}
              placeholder="Pretraži artikle, šifre..."
              style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', height: '38px', fontSize: '13px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          <span style={{ fontSize: '12px', color: '#475569', marginLeft: 'auto' }}>{total.toLocaleString()} artikala</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '24px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {Array(12).fill(0).map((_, i) => <div key={i} style={{ height: '240px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {artikli.map(a => {
              const s = stanje[a.id]
              const cijena = s ? s[siteConfig.tipCijene] || 0 : 0
              const cijenaKupca = rabat > 0 && cijena > 0 ? cijena * (1 - rabat / 100) : cijena
              const naStanju = s && s.raspolozivaKolicina > 0
              const isHovered = hoveredCard === a.id
              const isFav = favoriti.has(a.id)
              const akcijaAktivna = (a.akcija_popust || 0) > 0
              return (
                <div key={a.id}
                  style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', overflow: 'hidden', border: '1px solid ' + (isHovered ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'), transition: 'all 0.2s', boxShadow: isHovered ? '0 0 24px rgba(99,102,241,0.2), 0 0 0 1px rgba(99,102,241,0.3)' : 'none', display: 'flex', flexDirection: 'column' }}
                  onMouseEnter={() => setHoveredCard(a.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <Link href={'/proizvod/' + a.id} style={{ textDecoration: 'none', flex: 1 }}>
                    <div style={{ height: '140px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {a.slika_url ? <img src={a.slika_url} alt="" style={{ maxWidth: '75%', maxHeight: '75%', objectFit: 'contain' }} /> : <Package size={32} style={{ color: 'rgba(255,255,255,0.12)' }} />}
                      {akcijaAktivna && <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px' }}>-{a.akcija_popust}%</div>}
                      <button onClick={e => { e.preventDefault(); toggleFavorit(a.id) }}
                        style={{ position: 'absolute', top: '8px', right: '8px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Heart size={11} style={{ color: isFav ? '#ef4444' : 'rgba(255,255,255,0.5)' }} fill={isFav ? '#ef4444' : 'none'} />
                      </button>
                    </div>
                    <div style={{ padding: '12px 14px 8px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: '#cbd5e1', margin: '0 0 3px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{a.naziv}</p>
                      <p style={{ fontSize: '10px', color: '#475569', margin: 0, fontFamily: 'monospace' }}>{a.sifra}</p>
                    </div>
                  </Link>
                  <div style={{ padding: '8px 14px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#818cf8' }}>{cijenaKupca > 0 ? formatCijena(cijenaKupca) : '—'}</div>
                      {!naStanju && <div style={{ fontSize: '10px', color: '#ef4444' }}>Nema</div>}
                    </div>
                    <button onClick={() => { if (!user) { setShowLogin(true); return }; if (naStanju) add(a, cijena, s!) }} disabled={!naStanju}
                      style={{ width: '32px', height: '32px', borderRadius: '8px', background: naStanju ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', color: naStanju ? '#818cf8' : '#475569', border: '1px solid ' + (naStanju ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'), cursor: naStanju ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                      <ShoppingCart size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '32px' }}>
            {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ width: '34px', height: '34px', border: '1px solid ' + (page === p ? '#6366f1' : 'rgba(255,255,255,0.1)'), borderRadius: '8px', background: page === p ? 'rgba(99,102,241,0.3)' : 'transparent', color: page === p ? '#818cf8' : '#475569', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>{p}</button>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLogin(false)}>
          <div style={{ background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px', padding: '32px', maxWidth: '360px', width: '90%', textAlign: 'center', boxShadow: '0 0 60px rgba(99,102,241,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '52px', height: '52px', background: 'rgba(99,102,241,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(99,102,241,0.3)' }}>
              <Zap size={22} style={{ color: '#818cf8' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: '#e2e8f0' }}>Prijava potrebna</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Za narudžbu je potrebna B2B prijava.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLogin(false)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8', fontFamily: 'inherit', fontSize: '13px' }}>Zatvori</button>
              <a href="/login" style={{ flex: 1, padding: '10px', background: 'rgba(99,102,241,0.4)', color: '#e2e8f0', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px', border: '1px solid rgba(99,102,241,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Prijava →</a>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

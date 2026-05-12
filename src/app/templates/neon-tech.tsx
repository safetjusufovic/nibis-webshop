'use client'
// NEON TECH — futuristic dark with animated gradients, glassmorphism cards
// Completely different from everything else

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useFavoriti } from '@/hooks/useFavoriti'
import { formatCijena, siteConfig } from '@/lib/config'
import { ShoppingCart, Heart, Package, Search, Zap, ChevronRight, Star } from 'lucide-react'
import type { Artikal, ArtikalGrupa, StanjeSkladista, PaginatedResponse } from '@/types/nibis'

export default function NeonTech() {
  const [artikli, setArtikli] = useState<Artikal[]>([])
  const [stanje, setStanje] = useState<Record<number, StanjeSkladista>>({})
  const [grupe, setGrupe] = useState<ArtikalGrupa[]>([])
  const [activeGrupa, setActiveGrupa] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [shopNaziv, setShopNaziv] = useState('B2B Shop')
  const perPage = 20
  const { add } = useCart()
  const { user, rabat } = useAuth()
  const { favoriti, toggle: toggleFavorit } = useFavoriti()
  const [showLogin, setShowLogin] = useState(false)
  const [hovered, setHovered] = useState<number | null>(null)
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
  const NEON_COLORS = ['#00d2ff','#7c3aed','#f43f5e','#10b981','#f59e0b','#6366f1','#ec4899','#06b6d4']

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", color: '#e2e8f0' }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.3)}50%{box-shadow:0 0 40px rgba(99,102,241,0.6)}}
        @keyframes gradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        .nt-card:hover{transform:translateY(-4px)!important}
      `}</style>

      <Header />

      {/* Animated hero */}
      <div style={{ background: 'linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #0f0c29)', backgroundSize: '400% 400%', animation: 'gradient 8s ease infinite', padding: '48px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: '-20px', left: '10%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', right: '15%', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(244,63,94,0.1)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '100px', padding: '6px 16px', fontSize: '12px', color: '#a5b4fc', fontWeight: 600, marginBottom: '16px', backdropFilter: 'blur(10px)' }}>
            <Zap size={12} /> {total.toLocaleString()} artikala dostupno
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #e2e8f0 0%, #a5b4fc 50%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {shopNaziv}
          </h1>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: '480px', margin: '24px auto 0' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1', pointerEvents: 'none' }} />
            <input value={inputVal}
              onChange={e => { setInputVal(e.target.value); if (searchTimer.current) clearTimeout(searchTimer.current); searchTimer.current = setTimeout(() => { setSearch(e.target.value); setPage(1) }, 300) }}
              placeholder="Pretraži artikle..."
              style={{ width: '100%', paddingLeft: '44px', paddingRight: '14px', height: '50px', fontSize: '15px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '100px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, color: 'white', backdropFilter: 'blur(10px)', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' as const, gap: '2px' }}>
          <button onClick={() => selectGrupa(null)}
            style={{ padding: '12px 18px', border: 'none', background: 'none', borderBottom: '2px solid ' + (!activeGrupa ? '#6366f1' : 'transparent'), color: !activeGrupa ? '#a5b4fc' : '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: !activeGrupa ? 600 : 400, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}>
            Sve kategorije
          </button>
          {roots.slice(0, 14).map((g, idx) => (
            <button key={g.id} onClick={() => selectGrupa(g.id)}
              style={{ padding: '12px 18px', border: 'none', background: 'none', borderBottom: '2px solid ' + (activeGrupa === g.id ? NEON_COLORS[idx % NEON_COLORS.length] : 'transparent'), color: activeGrupa === g.id ? NEON_COLORS[idx % NEON_COLORS.length] : '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: activeGrupa === g.id ? 600 : 400, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}
              onMouseEnter={e => { if (activeGrupa !== g.id) (e.currentTarget as HTMLElement).style.color = '#94a3b8' }}
              onMouseLeave={e => { if (activeGrupa !== g.id) (e.currentTarget as HTMLElement).style.color = '#64748b' }}
            >{g.naziv}</button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '28px 24px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {Array(10).fill(0).map((_, i) => <div key={i} style={{ height: '280px', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {artikli.map((a, idx) => {
              const s = stanje[a.id]
              const cijena = s ? s[siteConfig.tipCijene] || 0 : 0
              const cijenaKupca = rabat > 0 && cijena > 0 ? cijena * (1 - rabat / 100) : cijena
              const naStanju = s && s.raspolozivaKolicina > 0
              const isFav = favoriti.has(a.id)
              const neon = NEON_COLORS[idx % NEON_COLORS.length]
              const isHov = hovered === a.id
              return (
                <div key={a.id} className="nt-card"
                  style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', border: '1px solid ' + (isHov ? neon + '60' : 'rgba(255,255,255,0.07)'), overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', boxShadow: isHov ? '0 0 20px ' + neon + '25' : 'none', position: 'relative' }}
                  onMouseEnter={() => setHovered(a.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Neon top line */}
                  <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, ' + neon + ', transparent)', opacity: isHov ? 1 : 0, transition: 'opacity 0.2s' }} />

                  <Link href={'/proizvod/' + a.id} style={{ textDecoration: 'none', flex: 1 }}>
                    <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', background: 'rgba(255,255,255,0.02)' }}>
                      {a.slika_url ? <img src={a.slika_url} alt="" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} /> : <Package size={36} style={{ color: neon, opacity: 0.4 }} />}
                      {(a.akcija_popust || 0) > 0 && <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#f43f5e', color: 'white', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '100px' }}>-{a.akcija_popust}%</div>}
                      <button onClick={e => { e.preventDefault(); toggleFavorit(a.id) }}
                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Heart size={12} style={{ color: isFav ? '#f43f5e' : 'rgba(255,255,255,0.5)' }} fill={isFav ? '#f43f5e' : 'none'} />
                      </button>
                    </div>
                    <div style={{ padding: '12px 14px 8px' }}>
                      <p style={{ fontSize: '10px', color: '#475569', margin: '0 0 4px', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{a.sifra}</p>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: '#cbd5e1', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{a.naziv}</p>
                    </div>
                  </Link>

                  <div style={{ padding: '8px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: isHov ? neon : '#e2e8f0', transition: 'color 0.2s' }}>{cijenaKupca > 0 ? formatCijena(cijenaKupca) : '—'}</div>
                      <div style={{ fontSize: '10px', marginTop: '1px', color: naStanju ? '#10b981' : '#475569', fontWeight: 500 }}>{naStanju ? '● Na stanju' : '○ Nema'}</div>
                    </div>
                    <button onClick={() => { if (!user) { setShowLogin(true); return }; if (naStanju) add(a, cijena, s!) }} disabled={!naStanju}
                      style={{ width: '36px', height: '36px', borderRadius: '10px', background: naStanju ? neon + '20' : 'rgba(255,255,255,0.04)', color: naStanju ? neon : '#475569', border: '1px solid ' + (naStanju ? neon + '50' : 'rgba(255,255,255,0.07)'), cursor: naStanju ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                      onMouseEnter={e => { if (naStanju) { (e.currentTarget as HTMLElement).style.background = neon + '35'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px ' + neon + '40' } }}
                      onMouseLeave={e => { if (naStanju) { (e.currentTarget as HTMLElement).style.background = neon + '20'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' } }}
                    >
                      <ShoppingCart size={15} />
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
              <button key={p} onClick={() => setPage(p)} style={{ width: '36px', height: '36px', border: '1px solid ' + (page === p ? '#6366f1' : 'rgba(255,255,255,0.1)'), borderRadius: '10px', background: page === p ? 'rgba(99,102,241,0.3)' : 'transparent', color: page === p ? '#a5b4fc' : '#475569', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: page === p ? 700 : 400, boxShadow: page === p ? '0 0 12px rgba(99,102,241,0.3)' : 'none' }}>{p}</button>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setShowLogin(false)}>
          <div style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '32px', maxWidth: '360px', width: '90%', textAlign: 'center', boxShadow: '0 0 60px rgba(99,102,241,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '52px', height: '52px', background: 'rgba(99,102,241,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(99,102,241,0.4)' }}>
              <Zap size={22} style={{ color: '#a5b4fc' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: '#e2e8f0' }}>Prijava potrebna</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Za narudžbu je potrebna B2B prijava.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLogin(false)} style={{ flex: 1, padding: '11px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', color: '#94a3b8', fontFamily: 'inherit', fontSize: '14px' }}>Zatvori</button>
              <a href="/login" style={{ flex: 1, padding: '11px', background: 'rgba(99,102,241,0.4)', color: '#e2e8f0', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '14px', border: '1px solid rgba(99,102,241,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Prijava →</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

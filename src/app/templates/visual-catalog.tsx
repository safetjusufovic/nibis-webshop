'use client'
// VISUAL CATALOG — ris.ba inspired
// Category image grid with colour overlay on hover, then dense product catalog

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useFavoriti } from '@/hooks/useFavoriti'
import { formatCijena, siteConfig } from '@/lib/config'
import { ShoppingCart, Heart, Package, Search, ChevronLeft, ArrowRight } from 'lucide-react'
import type { Artikal, ArtikalGrupa, StanjeSkladista, PaginatedResponse } from '@/types/nibis'

export default function VisualCatalog() {
  const [artikli, setArtikli] = useState<Artikal[]>([])
  const [stanje, setStanje] = useState<Record<number, StanjeSkladista>>({})
  const [grupe, setGrupe] = useState<ArtikalGrupa[]>([])
  const [activeGrupa, setActiveGrupa] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hoveredKat, setHoveredKat] = useState<number | null>(null)
  const perPage = 24
  const { add } = useCart()
  const { user, rabat } = useAuth()
  const { favoriti, toggle: toggleFavorit } = useFavoriti()
  const [showLogin, setShowLogin] = useState(false)
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
    if (!activeGrupa && !search) return
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
  const activeGrupaObj = grupe.find(g => g.id === activeGrupa)
  const totalPages = Math.ceil(total / perPage)

  // Palette of colours for categories without custom colour
  const PALETTE = ['#0ea5e9','#f97316','#8b5cf6','#10b981','#ef4444','#f59e0b','#06b6d4','#ec4899','#84cc16','#6366f1','#14b8a6','#f43f5e']

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Header />

      {/* Category grid view — shown when no category selected */}
      {!activeGrupa && !search && (
        <div style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '32px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Odaberite kategoriju</h1>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{roots.length} kategorija · {' '}
                <button onClick={() => { setSearch('_all'); setActiveGrupa(null) }} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', padding: 0, textDecoration: 'underline' }}>
                  Prikaži sve artikle →
                </button>
              </p>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input placeholder="Pretraži artikle..."
                onChange={e => { const v = e.target.value; if (searchTimer.current) clearTimeout(searchTimer.current); searchTimer.current = setTimeout(() => { if (v) setSearch(v); setPage(1) }, 300) }}
                style={{ paddingLeft: '32px', paddingRight: '12px', height: '38px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', width: '240px' }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          {/* Category grid — ris.ba style */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {roots.map((g, idx) => {
              const boja = g.boja || PALETTE[idx % PALETTE.length]
              const isHov = hoveredKat === g.id
              return (
                <button key={g.id}
                  onClick={() => selectGrupa(g.id)}
                  onMouseEnter={() => setHoveredKat(g.id)}
                  onMouseLeave={() => setHoveredKat(null)}
                  style={{ border: 'none', padding: 0, cursor: 'pointer', borderRadius: '12px', overflow: 'hidden', background: 'white', boxShadow: isHov ? '0 12px 32px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.06)', transform: isHov ? 'translateY(-4px)' : 'none', transition: 'all 0.2s', textAlign: 'left', fontFamily: 'inherit' }}
                >
                  {/* Image area */}
                  <div style={{ height: '130px', position: 'relative', overflow: 'hidden', background: g.ikonaUrl ? 'none' : boja + '18' }}>
                    {g.ikonaUrl
                      ? <img src={g.ikonaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isHov ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.3s' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                          {idx % 8 === 0 ? '🔧' : idx % 8 === 1 ? '⚡' : idx % 8 === 2 ? '🔩' : idx % 8 === 3 ? '🛡️' : idx % 8 === 4 ? '🏭' : idx % 8 === 5 ? '🔬' : idx % 8 === 6 ? '🚛' : '📦'}
                        </div>
                    }
                    {/* Colour overlay on hover */}
                    <div style={{ position: 'absolute', inset: 0, background: boja, opacity: isHov ? 0.55 : 0, transition: 'opacity 0.25s', mixBlendMode: 'multiply' }} />
                    {/* Category name overlay on hover */}
                    {isHov && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '14px', textShadow: '0 2px 8px rgba(0,0,0,0.4)', padding: '0 12px', textAlign: 'center', lineHeight: 1.3 }}>Pregledaj →</span>
                      </div>
                    )}
                  </div>
                  {/* Label */}
                  <div style={{ padding: '10px 14px 12px', borderTop: '3px solid ' + boja }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>{g.naziv}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Product catalog view — shown when category selected */}
      {(activeGrupa || search) && (
        <div style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '20px 24px' }}>
          {/* Back + breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => { selectGrupa(null); setSearch('') }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px', color: '#374151', fontFamily: 'inherit', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLElement).style.color = '#6366f1' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.color = '#374151' }}
            >
              <ChevronLeft size={14} /> Kategorije
            </button>
            {activeGrupaObj && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {activeGrupaObj.ikonaUrl && <img src={activeGrupaObj.ikonaUrl} alt="" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '4px' }} />}
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{activeGrupaObj.naziv}</span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>· {total.toLocaleString()} artikala</span>
              </div>
            )}
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={inputVal} placeholder="Pretraži u kategoriji..."
                onChange={e => { setInputVal(e.target.value); if (searchTimer.current) clearTimeout(searchTimer.current); searchTimer.current = setTimeout(() => { setSearch(e.target.value); setPage(1) }, 300) }}
                style={{ paddingLeft: '30px', paddingRight: '10px', height: '34px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', width: '200px' }}
              />
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '10px' }}>
              {Array(12).fill(0).map((_, i) => <div key={i} style={{ height: '240px', background: 'white', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />)}
            </div>
          ) : artikli.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              <Package size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: '16px', color: '#374151', margin: '0 0 6px' }}>Nema artikala</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '10px' }}>
              {artikli.map(a => {
                const s = stanje[a.id]
                const cijena = s ? s[siteConfig.tipCijene] || 0 : 0
                const cijenaKupca = rabat > 0 && cijena > 0 ? cijena * (1 - rabat / 100) : cijena
                const naStanju = s && s.raspolozivaKolicina > 0
                const isFav = favoriti.has(a.id)
                const boja = activeGrupaObj?.boja || '#6366f1'
                return (
                  <div key={a.id} style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; el.style.borderColor = boja + '80'; el.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'none'; el.style.borderColor = '#e2e8f0'; el.style.transform = 'none' }}
                  >
                    <Link href={'/proizvod/' + a.id} style={{ textDecoration: 'none', flex: 1 }}>
                      <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '10px', position: 'relative' }}>
                        {a.slika_url ? <img src={a.slika_url} alt="" style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} /> : <Package size={32} style={{ color: '#cbd5e1' }} />}
                        {!naStanju && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Nema na stanju</span></div>}
                        {(a.akcija_popust || 0) > 0 && <div style={{ position: 'absolute', top: '6px', left: '6px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px' }}>-{a.akcija_popust}%</div>}
                      </div>
                      <div style={{ padding: '10px 12px 6px' }}>
                        <p style={{ fontSize: '10px', color: '#94a3b8', margin: '0 0 3px', fontFamily: 'monospace' }}>{a.sifra}</p>
                        <p style={{ fontSize: '12px', fontWeight: 500, color: '#0f172a', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{a.naziv}</p>
                      </div>
                    </Link>
                    <div style={{ padding: '6px 12px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', marginTop: '4px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{cijenaKupca > 0 ? formatCijena(cijenaKupca) : '—'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => toggleFavorit(a.id)} style={{ width: '28px', height: '28px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Heart size={12} style={{ color: isFav ? '#ef4444' : '#94a3b8' }} fill={isFav ? '#ef4444' : 'none'} />
                        </button>
                        <button onClick={() => { if (!user) { setShowLogin(true); return }; if (naStanju) add(a, cijena, s!) }} disabled={!naStanju}
                          style={{ width: '28px', height: '28px', borderRadius: '6px', background: naStanju ? boja : '#f1f5f9', color: naStanju ? 'white' : '#94a3b8', border: 'none', cursor: naStanju ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s' }}>
                          <ShoppingCart size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '28px' }}>
              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ width: '34px', height: '34px', border: '1px solid ' + (page === p ? '#6366f1' : '#e2e8f0'), borderRadius: '8px', background: page === p ? '#6366f1' : 'white', color: page === p ? 'white' : '#374151', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: page === p ? 700 : 400 }}>{p}</button>
              ))}
            </div>
          )}
        </div>
      )}

      <Footer />

      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLogin(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '360px', width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>Prijava potrebna</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Za narudžbu je potrebna B2B prijava.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLogin(false)} style={{ flex: 1, padding: '11px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}>Zatvori</button>
              <a href="/login" style={{ flex: 1, padding: '11px', background: '#6366f1', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Prijava →</a>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

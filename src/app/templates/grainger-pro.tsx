'use client'
// Grainger Pro — procurement-focused B2B, quantity pricing, stock indicators, split layout

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useFavoriti } from '@/hooks/useFavoriti'
import { formatCijena, siteConfig } from '@/lib/config'
import { Search, ShoppingCart, Heart, Package, ChevronDown, Filter, Grid, AlignJustify, Star, Truck, Shield, Clock } from 'lucide-react'
import type { Artikal, ArtikalGrupa, StanjeSkladista, PaginatedResponse } from '@/types/nibis'

export default function GraingerPro() {
  const [artikli, setArtikli] = useState<Artikal[]>([])
  const [stanje, setStanje] = useState<Record<number, StanjeSkladista>>({})
  const [grupe, setGrupe] = useState<ArtikalGrupa[]>([])
  const [activeGrupa, setActiveGrupa] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState('naziv_asc')
  const [filterStock, setFilterStock] = useState(false)
  const [qty, setQty] = useState<Record<number, number>>({})
  const perPage = 20
  const { cart, add } = useCart()
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
    setLoading(true)
    const p = new URLSearchParams({ page: String(page), perPage: String(perPage), sortBy, ...(search && { search }), ...(activeGrupa && { grupaId: String(activeGrupa) }) })
    const data: PaginatedResponse<Artikal> = await fetch('/api/artikli?' + p).then(r => r.json())
    setArtikli(data.items ?? []); setTotal(data.total ?? 0)
    if (data.items?.length) {
      const sd = await fetch('/api/stanje?ids=' + data.items.map(a => a.id).join(',')).then(r => r.json())
      const map: Record<number, StanjeSkladista> = {}
      sd.items?.forEach((s: StanjeSkladista) => { map[s.artikalId] = s })
      setStanje(map)
    }
    setLoading(false)
  }, [page, search, activeGrupa, sortBy])

  useEffect(() => { load() }, [load])

  function handleSearch(v: string) {
    setInputVal(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setSearch(v); setPage(1) }, 300)
  }

  function selectGrupa(id: number | null) {
    setActiveGrupa(id); setPage(1)
    const url = new URL(window.location.href)
    id ? url.searchParams.set('grupaId', String(id)) : url.searchParams.delete('grupaId')
    window.history.pushState({}, '', url.toString())
  }

  const roots = grupe.filter(g => !g.parentId)
  const totalPages = Math.ceil(total / perPage)
  const displayed = filterStock ? artikli.filter(a => { const s = stanje[a.id]; return s && s.raspolozivaKolicina > 0 }) : artikli

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Header />

      {/* Trust bar */}
      <div style={{ background: '#1a3a5c', padding: '8px 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '32px', justifyContent: 'center' }}>
          {[{ icon: Truck, text: 'Brza isporuka' }, { icon: Shield, text: 'Provjerena kvaliteta' }, { icon: Clock, text: 'B2B podrška' }].map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
              <Icon size={13} /> {text}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#1a3a5c', padding: '12px 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
            <input value={inputVal} onChange={e => handleSearch(e.target.value)} placeholder="Pretraži po nazivu, šifri, barkodu..."
              style={{ width: '100%', paddingLeft: '38px', paddingRight: '12px', height: '40px', fontSize: '14px', border: 'none', borderRadius: '4px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
              onKeyDown={e => { if (e.key === 'Enter') { setSearch(inputVal); setPage(1) } }}
            />
          </div>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>{total.toLocaleString()} artikala</span>
        </div>
      </div>

      {/* Category pills */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '0', overflowX: 'auto', scrollbarWidth: 'none' as const }}>
          <button onClick={() => selectGrupa(null)} style={{ padding: '11px 16px', border: 'none', borderBottom: '3px solid ' + (!activeGrupa ? '#1a3a5c' : 'transparent'), background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: !activeGrupa ? 600 : 400, color: !activeGrupa ? '#1a3a5c' : '#6b7280', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}>
            Sve kategorije
          </button>
          {roots.slice(0, 12).map(g => (
            <button key={g.id} onClick={() => selectGrupa(g.id)} style={{ padding: '11px 16px', border: 'none', borderBottom: '3px solid ' + (activeGrupa === g.id ? '#1a3a5c' : 'transparent'), background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: activeGrupa === g.id ? 600 : 400, color: activeGrupa === g.id ? '#1a3a5c' : '#6b7280', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}
              onMouseEnter={e => { if (activeGrupa !== g.id) (e.currentTarget as HTMLElement).style.color = '#1a3a5c' }}
              onMouseLeave={e => { if (activeGrupa !== g.id) (e.currentTarget as HTMLElement).style.color = '#6b7280' }}
            >{g.naziv}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '16px 20px' }}>
        {/* Toolbar */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px 16px', marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
            <input type="checkbox" checked={filterStock} onChange={e => setFilterStock(e.target.checked)} style={{ accentColor: '#1a3a5c', width: '14px', height: '14px' }} />
            Samo na stanju
          </label>
          <div style={{ height: '16px', width: '1px', background: '#e5e7eb' }} />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '5px 10px', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', background: 'white', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
            <option value="naziv_asc">Naziv A-Z</option>
            <option value="naziv_desc">Naziv Z-A</option>
            <option value="cijena_asc">Cijena ↑</option>
            <option value="cijena_desc">Cijena ↓</option>
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            {(['list', 'grid'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: '5px 10px', border: 'none', background: viewMode === m ? '#1a3a5c' : 'white', color: viewMode === m ? 'white' : '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                {m === 'list' ? <AlignJustify size={13} /> : <Grid size={13} />}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr', gap: '8px' }}>
            {Array(8).fill(0).map((_, i) => <div key={i} style={{ height: viewMode === 'grid' ? '280px' : '100px', background: 'white', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : viewMode === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {displayed.map(a => {
              const s = stanje[a.id]
              const cijena = s ? s[siteConfig.tipCijene] || 0 : 0
              const cijenaKupca = rabat > 0 && cijena > 0 ? cijena * (1 - rabat / 100) : cijena
              const naStanju = s && s.raspolozivaKolicina > 0
              const isFav = favoriti.has(a.id)
              const q = qty[a.id] || 1
              return (
                <div key={a.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', display: 'grid', gridTemplateColumns: '80px 1fr 180px 200px', alignItems: 'center', overflow: 'hidden', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(26,58,92,0.1)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
                >
                  <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRight: '1px solid #f3f4f6' }}>
                    {a.slika_url ? <img src={a.slika_url} alt="" style={{ maxWidth: '60px', maxHeight: '60px', objectFit: 'contain' }} /> : <Package size={24} style={{ color: '#d1d5db' }} />}
                  </div>
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>{a.sifra}</span>
                      {(a.akcija_popust || 0) > 0 && <span style={{ fontSize: '10px', background: '#1a3a5c', color: 'white', padding: '1px 6px', borderRadius: '3px', fontWeight: 700 }}>-{a.akcija_popust}%</span>}
                    </div>
                    <Link href={'/proizvod/' + a.id} style={{ fontSize: '14px', color: '#111827', textDecoration: 'none', fontWeight: 500, lineHeight: 1.4, display: 'block', marginBottom: '6px' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#1a3a5c'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#111827'}
                    >{a.naziv}</Link>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{a.jedinicaMjere || 'kom'}</div>
                  </div>
                  <div style={{ padding: '12px 16px', borderLeft: '1px solid #f3f4f6', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: naStanju ? '#16a34a' : '#dc2626', marginBottom: '2px' }}>
                      {naStanju ? '● Na stanju' : '○ Nema'}
                    </div>
                    {naStanju && s && <div style={{ fontSize: '11px', color: '#6b7280' }}>{s.raspolozivaKolicina} {a.jedinicaMjere || 'kom'}</div>}
                    <button onClick={() => toggleFavorit(a.id)} style={{ marginTop: '6px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6b7280', fontFamily: 'inherit', margin: '6px auto 0' }}>
                      <Heart size={12} style={{ color: isFav ? '#dc2626' : '#9ca3af' }} fill={isFav ? '#dc2626' : 'none'} />
                      {isFav ? 'Sačuvano' : 'Sačuvaj'}
                    </button>
                  </div>
                  <div style={{ padding: '12px 16px', borderLeft: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{cijenaKupca > 0 ? formatCijena(cijenaKupca) : '—'}</div>
                    {a.procPoreza && <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '8px' }}>+ PDV {a.procPoreza}%</div>}
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input type="number" min={1} value={q} onChange={e => setQty(prev => ({ ...prev, [a.id]: parseInt(e.target.value) || 1 }))}
                        style={{ width: '44px', height: '32px', textAlign: 'center', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#1a3a5c'}
                        onBlur={e => e.target.style.borderColor = '#d1d5db'}
                      />
                      <button onClick={() => { if (!user) { setShowLogin(true); return }; if (naStanju) for (let i = 0; i < q; i++) add(a, cijena, s!) }} disabled={!naStanju}
                        style={{ flex: 1, padding: '6px', background: naStanju ? '#1a3a5c' : '#f3f4f6', color: naStanju ? 'white' : '#9ca3af', border: 'none', borderRadius: '4px', cursor: naStanju ? 'pointer' : 'not-allowed', fontSize: '11px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'background 0.15s' }}
                        onMouseEnter={e => { if (naStanju) (e.currentTarget as HTMLElement).style.background = '#122a42' }}
                        onMouseLeave={e => { if (naStanju) (e.currentTarget as HTMLElement).style.background = '#1a3a5c' }}
                      >
                        <ShoppingCart size={12} /> Dodaj
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
            {displayed.map(a => {
              const s = stanje[a.id]
              const cijena = s ? s[siteConfig.tipCijene] || 0 : 0
              const cijenaKupca = rabat > 0 && cijena > 0 ? cijena * (1 - rabat / 100) : cijena
              const naStanju = s && s.raspolozivaKolicina > 0
              const isFav = favoriti.has(a.id)
              return (
                <div key={a.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(26,58,92,0.12)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
                >
                  <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: '#f9fafb', position: 'relative' }}>
                    {a.slika_url ? <img src={a.slika_url} alt="" style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} /> : <Package size={32} style={{ color: '#d1d5db' }} />}
                    {!naStanju && <div style={{ position: 'absolute', bottom: '6px', left: '6px', right: '6px', background: 'rgba(220,38,38,0.1)', color: '#dc2626', fontSize: '10px', fontWeight: 600, textAlign: 'center', padding: '2px', borderRadius: '3px' }}>Nema na stanju</div>}
                    <button onClick={() => toggleFavorit(a.id)} style={{ position: 'absolute', top: '6px', right: '6px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '3px', cursor: 'pointer', display: 'flex' }}>
                      <Heart size={12} style={{ color: isFav ? '#dc2626' : '#9ca3af' }} fill={isFav ? '#dc2626' : 'none'} />
                    </button>
                  </div>
                  <Link href={'/proizvod/' + a.id} style={{ padding: '10px 12px', textDecoration: 'none', flex: 1 }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace', marginBottom: '3px' }}>{a.sifra}</div>
                    <div style={{ fontSize: '13px', color: '#111827', fontWeight: 500, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{a.naziv}</div>
                  </Link>
                  <div style={{ padding: '8px 12px', borderTop: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>{cijenaKupca > 0 ? formatCijena(cijenaKupca) : '—'}</div>
                    <button onClick={() => { if (!user) { setShowLogin(true); return }; if (naStanju) add(a, cijena, s!) }} disabled={!naStanju}
                      style={{ width: '100%', padding: '7px', background: naStanju ? '#1a3a5c' : '#f3f4f6', color: naStanju ? 'white' : '#9ca3af', border: 'none', borderRadius: '4px', cursor: naStanju ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      <ShoppingCart size={13} /> Dodaj u korpu
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '20px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '4px', background: 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '13px', color: '#374151', opacity: page <= 1 ? 0.4 : 1, fontFamily: 'inherit' }}>← Prethodna</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ width: '36px', height: '36px', border: '1px solid ' + (page === p ? '#1a3a5c' : '#e5e7eb'), borderRadius: '4px', background: page === p ? '#1a3a5c' : 'white', color: page === p ? 'white' : '#374151', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: page === p ? 700 : 400 }}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '4px', background: 'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', color: '#374151', opacity: page >= totalPages ? 0.4 : 1, fontFamily: 'inherit' }}>Sljedeća →</button>
          </div>
        )}
      </div>

      <Footer />

      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLogin(false)}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '28px', maxWidth: '360px', width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Prijava potrebna</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Za narudžbu je potrebna B2B prijava.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowLogin(false)} style={{ flex: 1, padding: '9px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Zatvori</button>
              <a href="/login" style={{ flex: 1, padding: '9px', background: '#1a3a5c', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Prijava →</a>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

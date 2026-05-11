'use client'
// MEGA CATALOG — inspirisan Würth BA, RS Components
// Megamenu kategorija, sticky sidebar filtri, dense grid s hover zoom

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useFavoriti } from '@/hooks/useFavoriti'
import { formatCijena, siteConfig } from '@/lib/config'
import { ShoppingCart, Heart, Package, Search, SlidersHorizontal, ChevronDown, Grid, List, Star, Zap } from 'lucide-react'
import type { Artikal, ArtikalGrupa, StanjeSkladista, PaginatedResponse } from '@/types/nibis'

export default function MegaCatalog() {
  const [artikli, setArtikli] = useState<Artikal[]>([])
  const [stanje, setStanje] = useState<Record<number, StanjeSkladista>>({})
  const [grupe, setGrupe] = useState<ArtikalGrupa[]>([])
  const [activeGrupa, setActiveGrupa] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('naziv_asc')
  const [filterStock, setFilterStock] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [openKat, setOpenKat] = useState<number | null>(null)
  const perPage = 24
  const { cart, add } = useCart()
  const { user, rabat } = useAuth()
  const { favoriti, toggle: toggleFavorit } = useFavoriti()
  const [showLogin, setShowLogin] = useState(false)
  const searchTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/grupe').then(r => r.json()).then(d => setGrupe(d.items ?? [])).catch(() => {})
    const gid = new URLSearchParams(window.location.search).get('grupaId')
    if (gid) setActiveGrupa(parseInt(gid))
    function sync() {
      const g = new URLSearchParams(window.location.search).get('grupaId')
      setActiveGrupa(g ? parseInt(g) : null); setPage(1)
    }
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
    setSearchInput(v)
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
  const activeGrupaObj = grupe.find(g => g.id === activeGrupa)
  const displayed = filterStock ? artikli.filter(a => { const s = stanje[a.id]; return s && s.raspolozivaKolicina > 0 }) : artikli

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", fontSize: '14px' }}>
      <Header />

      {/* Top bar - breadcrumb + stats */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '8px 0' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
            <span onClick={() => selectGrupa(null)} style={{ cursor: 'pointer', color: '#2563eb' }}>Katalog</span>
            {activeGrupaObj && <><span>/</span><span style={{ color: '#111827', fontWeight: 500 }}>{activeGrupaObj.naziv}</span></>}
            {search && <><span>/</span><span style={{ color: '#111827' }}>"{search}"</span></>}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280' }}>{total.toLocaleString()} artikala</span>
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '16px 20px', display: 'grid', gridTemplateColumns: showFilters ? '240px 1fr' : '0 1fr', gap: '16px', transition: 'grid-template-columns 0.2s' }}>

        {/* LEFT SIDEBAR */}
        {showFilters && (
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Search */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input value={searchInput} onChange={e => handleSearch(e.target.value)} placeholder="Pretraži artikle..."
                  style={{ width: '100%', paddingLeft: '28px', paddingRight: '8px', height: '32px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            {/* Filters */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SlidersHorizontal size={12} /> Filteri
              </div>
              <div style={{ padding: '10px 12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151', padding: '4px 0' }}>
                  <input type="checkbox" checked={filterStock} onChange={e => setFilterStock(e.target.checked)} style={{ accentColor: '#2563eb', width: '14px', height: '14px' }} />
                  Samo na stanju
                </label>
              </div>
            </div>

            {/* Kategorije */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', position: 'sticky', top: '80px' }}>
              <div style={{ padding: '10px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Kategorije
              </div>
              <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                <button onClick={() => selectGrupa(null)}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: activeGrupa === null ? '#eff6ff' : 'white', color: activeGrupa === null ? '#1d4ed8' : '#374151', cursor: 'pointer', fontSize: '13px', fontWeight: activeGrupa === null ? 600 : 400, borderLeft: '3px solid ' + (activeGrupa === null ? '#2563eb' : 'transparent'), fontFamily: 'inherit', transition: 'all 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Sve kategorije</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>{total}</span>
                </button>
                {roots.map(g => (
                  <div key={g.id}>
                    <button onClick={() => selectGrupa(g.id)}
                      style={{ width: '100%', textAlign: 'left', padding: '7px 12px', border: 'none', background: activeGrupa === g.id ? '#eff6ff' : 'white', color: activeGrupa === g.id ? '#1d4ed8' : '#374151', cursor: 'pointer', fontSize: '13px', fontWeight: activeGrupa === g.id ? 600 : 400, borderLeft: '3px solid ' + (activeGrupa === g.id ? '#2563eb' : 'transparent'), fontFamily: 'inherit', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.1s' }}
                      onMouseEnter={e => { if (activeGrupa !== g.id) (e.currentTarget as HTMLElement).style.background = '#f9fafb' }}
                      onMouseLeave={e => { if (activeGrupa !== g.id) (e.currentTarget as HTMLElement).style.background = 'white' }}
                    >
                      {g.ikonaUrl
                        ? <img src={g.ikonaUrl} alt="" style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                        : <div style={{ width: '20px', height: '20px', background: g.boja || '#e5e7eb', borderRadius: '4px', flexShrink: 0 }} />
                      }
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.naziv}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* MAIN */}
        <main>
          {/* Toolbar */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', background: showFilters ? '#eff6ff' : 'white', color: showFilters ? '#1d4ed8' : '#374151', cursor: 'pointer', fontSize: '12px', fontWeight: 500, fontFamily: 'inherit' }}>
              <SlidersHorizontal size={13} /> {showFilters ? 'Sakrij filtere' : 'Prikaži filtere'}
            </button>
            <div style={{ height: '20px', width: '1px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '12px', color: '#6b7280' }}><strong style={{ color: '#111827' }}>{total.toLocaleString()}</strong> artikala</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '5px 10px', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', fontFamily: 'inherit', cursor: 'pointer', outline: 'none', color: '#374151' }}>
                <option value="naziv_asc">Naziv A-Z</option>
                <option value="naziv_desc">Naziv Z-A</option>
                <option value="cijena_asc">Cijena ↑</option>
                <option value="cijena_desc">Cijena ↓</option>
              </select>
              <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                {(['grid', 'list'] as const).map(m => (
                  <button key={m} onClick={() => setViewMode(m)} style={{ padding: '5px 10px', border: 'none', background: viewMode === m ? '#2563eb' : 'white', color: viewMode === m ? 'white' : '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {m === 'grid' ? <Grid size={13} /> : <List size={13} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Products */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(170px, 1fr))' : '1fr', gap: '8px' }}>
              {Array(12).fill(0).map((_, i) => <div key={i} style={{ height: viewMode === 'grid' ? '260px' : '80px', background: 'white', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />)}
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '8px' }}>
              {displayed.map(a => {
                const s = stanje[a.id]
                const cijena = s ? s[siteConfig.tipCijene] || 0 : 0
                const cijenaKupca = rabat > 0 && cijena > 0 ? cijena * (1 - rabat / 100) : cijena
                const naStanju = s && s.raspolozivaKolicina > 0
                const isFav = favoriti.has(a.id)
                const akcijaAktivna = (a.akcija_popust || 0) > 0
                return (
                  <div key={a.id} className="product-card"
                    style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.15s', position: 'relative' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2563eb'; el.style.boxShadow = '0 4px 16px rgba(37,99,235,0.12)'; el.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#e5e7eb'; el.style.boxShadow = 'none'; el.style.transform = 'none' }}
                  >
                    {akcijaAktivna && <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#dc2626', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', zIndex: 1 }}>-{a.akcija_popust}%</div>}
                    {!naStanju && <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#f3f4f6', color: '#9ca3af', fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', zIndex: 1 }}>NEMA</div>}
                    <Link href={'/proizvod/' + a.id} style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                        {a.slika_url ? <img src={a.slika_url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <Package size={32} style={{ color: '#d1d5db' }} />}
                      </div>
                      <div style={{ padding: '10px 12px', flex: 1 }}>
                        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 4px', fontFamily: 'monospace' }}>{a.sifra}</p>
                        <p style={{ fontSize: '12px', color: '#111827', fontWeight: 500, margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{a.naziv}</p>
                      </div>
                    </Link>
                    <div style={{ padding: '8px 12px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: cijenaKupca > 0 ? '#111827' : '#9ca3af' }}>{cijenaKupca > 0 ? formatCijena(cijenaKupca) : '—'}</div>
                        {a.procPoreza && cijenaKupca > 0 && <div style={{ fontSize: '10px', color: '#9ca3af' }}>+ PDV {a.procPoreza}%</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => toggleFavorit(a.id)} style={{ width: '28px', height: '28px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Heart size={12} style={{ color: isFav ? '#dc2626' : '#9ca3af' }} fill={isFav ? '#dc2626' : 'none'} />
                        </button>
                        <button onClick={() => { if (!user) { setShowLogin(true); return }; if (naStanju) add(a, cijena, s!) }} disabled={!naStanju}
                          style={{ flex: 1, padding: '5px 10px', background: naStanju ? '#2563eb' : '#f3f4f6', color: naStanju ? 'white' : '#9ca3af', border: 'none', borderRadius: '6px', cursor: naStanju ? 'pointer' : 'not-allowed', fontSize: '11px', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                          <ShoppingCart size={11} />{cart[a.id]?.qty > 0 ? '+' + cart[a.id].qty : 'Dodaj'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {displayed.map(a => {
                const s = stanje[a.id]
                const cijena = s ? s[siteConfig.tipCijene] || 0 : 0
                const cijenaKupca = rabat > 0 && cijena > 0 ? cijena * (1 - rabat / 100) : cijena
                const naStanju = s && s.raspolozivaKolicina > 0
                return (
                  <div key={a.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'grid', gridTemplateColumns: '72px 1fr auto', alignItems: 'center', gap: '0', overflow: 'hidden', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#2563eb'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'}
                  >
                    <div style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRight: '1px solid #f3f4f6' }}>
                      {a.slika_url ? <img src={a.slika_url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <Package size={24} style={{ color: '#d1d5db' }} />}
                    </div>
                    <div style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>{a.sifra}</span>
                        {(a.akcija_popust || 0) > 0 && <span style={{ fontSize: '10px', background: '#fef2f2', color: '#dc2626', padding: '1px 6px', borderRadius: '3px', fontWeight: 700 }}>-{a.akcija_popust}%</span>}
                      </div>
                      <Link href={'/proizvod/' + a.id} style={{ textDecoration: 'none' }}>
                        <div style={{ fontSize: '13px', color: '#111827', fontWeight: 500, lineHeight: 1.4 }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#2563eb'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#111827'}
                        >{a.naziv}</div>
                      </Link>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>{a.jedinicaMjere || 'kom'} · {naStanju ? <span style={{ color: '#16a34a' }}>Na stanju {s?.raspolozivaKolicina}</span> : <span style={{ color: '#dc2626' }}>Nema na stanju</span>}</div>
                    </div>
                    <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', borderLeft: '1px solid #f3f4f6' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', textAlign: 'right' }}>{cijenaKupca > 0 ? formatCijena(cijenaKupca) : '—'}</div>
                      <button onClick={() => { if (!user) { setShowLogin(true); return }; if (naStanju) add(a, cijena, s!) }} disabled={!naStanju}
                        style={{ padding: '6px 16px', background: naStanju ? '#2563eb' : '#f3f4f6', color: naStanju ? 'white' : '#9ca3af', border: 'none', borderRadius: '6px', cursor: naStanju ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                        <ShoppingCart size={12} /> Dodaj
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '20px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '12px', color: '#374151', opacity: page <= 1 ? 0.4 : 1, fontFamily: 'inherit' }}>← Prethodna</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 3, totalPages - 6)) + i
                return <button key={p} onClick={() => setPage(p)} style={{ width: '34px', height: '34px', border: '1px solid ' + (page === p ? '#2563eb' : '#e5e7eb'), borderRadius: '6px', background: page === p ? '#2563eb' : 'white', color: page === p ? 'white' : '#374151', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: page === p ? 700 : 400 }}>{p}</button>
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', color: '#374151', opacity: page >= totalPages ? 0.4 : 1, fontFamily: 'inherit' }}>Sljedeća →</button>
            </div>
          )}
        </main>
      </div>

      <Footer />

      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLogin(false)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', maxWidth: '360px', width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <ShoppingCart size={32} style={{ color: '#2563eb', margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Prijava potrebna</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Za narudžbu potrebna je B2B prijava.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => setShowLogin(false)} style={{ padding: '9px 18px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>Zatvori</button>
              <a href="/login" style={{ padding: '9px 20px', background: '#2563eb', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>Prijava →</a>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

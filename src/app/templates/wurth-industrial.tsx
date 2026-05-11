'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useFavoriti } from '@/hooks/useFavoriti'
import { formatCijena, siteConfig } from '@/lib/config'
import { Search, Grid, List, ShoppingCart, Heart, Package, ChevronRight } from 'lucide-react'
import type { Artikal, ArtikalGrupa, StanjeSkladista, PaginatedResponse } from '@/types/nibis'

export default function WurthIndustrial() {
  const [artikli, setArtikli] = useState<Artikal[]>([])
  const [stanje, setStanje] = useState<Record<number, StanjeSkladista>>({})
  const [grupe, setGrupe] = useState<ArtikalGrupa[]>([])
  const [activeGrupa, setActiveGrupa] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [sortBy, setSortBy] = useState('naziv_asc')
  const [filterStock, setFilterStock] = useState(false)
  const perPage = 30
  const { cart, add } = useCart()
  const { user, rabat } = useAuth()
  const { favoriti, toggle: toggleFavorit } = useFavoriti()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const searchTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/grupe').then(r => r.json()).then(d => setGrupe(d.items ?? [])).catch(() => {})
    const gid = new URLSearchParams(window.location.search).get('grupaId')
    if (gid) setActiveGrupa(parseInt(gid))
    function syncGrupa() {
      const gid = new URLSearchParams(window.location.search).get('grupaId')
      setActiveGrupa(gid ? parseInt(gid) : null); setPage(1)
    }
    window.addEventListener('grupaChanged', syncGrupa)
    return () => window.removeEventListener('grupaChanged', syncGrupa)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ page: String(page), perPage: String(perPage), sortBy, ...(search && { search }), ...(activeGrupa && { grupaId: String(activeGrupa) }) })
    const res = await fetch('/api/artikli?' + p)
    const data: PaginatedResponse<Artikal> = await res.json()
    setArtikli(data.items ?? []); setTotal(data.total ?? 0)
    if (data.items?.length) {
      const ids = data.items.map(a => a.id).join(',')
      const sd = await fetch('/api/stanje?ids=' + ids).then(r => r.json())
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
    searchTimer.current = setTimeout(() => { setSearch(v); setPage(1) }, 350)
  }

  function selectGrupa(id: number | null) {
    setActiveGrupa(id); setPage(1)
    const url = new URL(window.location.href)
    id ? url.searchParams.set('grupaId', String(id)) : url.searchParams.delete('grupaId')
    window.history.pushState({}, '', url.toString())
  }

  const displayed = filterStock ? artikli.filter(a => { const s = stanje[a.id]; return s && s.raspolozivaKolicina > 0 }) : artikli
  const totalPages = Math.ceil(total / perPage)

  return (
    <div style={{ minHeight: '100vh', background: '#F1F3F5', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Category bar */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #0f172a' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' as const }}>
          <button onClick={() => selectGrupa(null)} style={{ padding: '10px 16px', background: activeGrupa === null ? '#3b82f6' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}>
            SVE KATEGORIJE
          </button>
          {grupe.filter(g => !g.parentId).slice(0, 14).map(g => (
            <button key={g.id} onClick={() => selectGrupa(g.id)} style={{ padding: '10px 16px', background: activeGrupa === g.id ? '#3b82f6' : 'transparent', color: activeGrupa === g.id ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.15s' }}>
              {g.naziv.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background: '#1e293b', borderBottom: '3px solid #3b82f6' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '10px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input value={searchInput} onChange={e => handleSearch(e.target.value)} placeholder="Pretraži artikle, šifre, barkodove..."
              style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px', height: '34px', fontSize: '13px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: 'white', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={filterStock} onChange={e => setFilterStock(e.target.checked)} style={{ accentColor: '#3b82f6' }} />
            Samo na stanju
          </label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 10px', fontSize: '12px', background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', borderRadius: '4px', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
            <option value="naziv_asc">Naziv A-Z</option>
            <option value="naziv_desc">Naziv Z-A</option>
            <option value="cijena_asc">Cijena ↑</option>
            <option value="cijena_desc">Cijena ↓</option>
          </select>
          <div style={{ display: 'flex', border: '1px solid #334155', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
            {(['table', 'grid'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: '6px 10px', background: viewMode === m ? '#3b82f6' : 'transparent', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
                {m === 'table' ? <List size={14} /> : <Grid size={14} />}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', marginLeft: 'auto' }}>{total.toLocaleString()} artikala</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '16px' }}>
        {loading ? (
          <div style={{ display: viewMode === 'table' ? 'flex' : 'grid', flexDirection: 'column', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(150px, 1fr))' : undefined, gap: '6px' }}>
            {Array(12).fill(0).map((_, i) => <div key={i} style={{ height: viewMode === 'grid' ? '200px' : '44px', background: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : viewMode === 'table' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Šifra', 'Naziv artikla', 'J.M.', 'Stanje', 'Cijena', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((a, idx) => {
                const s = stanje[a.id]
                const cijena = s ? s[siteConfig.tipCijene] || 0 : 0
                const cijenaKupca = rabat > 0 && cijena > 0 ? cijena * (1 - rabat / 100) : cijena
                const naStanju = s && s.raspolozivaKolicina > 0
                const inCart = cart[a.id]?.qty ?? 0
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa', cursor: 'default' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#eff6ff'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? 'white' : '#fafafa'}
                  >
                    <td style={{ padding: '8px 12px', fontSize: '12px', fontFamily: 'monospace', color: '#64748b', whiteSpace: 'nowrap' }}>{a.sifra}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <Link href={'/proizvod/' + a.id} style={{ fontSize: '13px', color: '#1e293b', textDecoration: 'none', fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#3b82f6'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#1e293b'}
                      >{a.naziv}</Link>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', color: '#94a3b8' }}>{a.jedinicaMjere || 'kom'}</td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      {s ? <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px', background: naStanju ? '#dcfce7' : '#fee2e2', color: naStanju ? '#166534' : '#991b1b' }}>{naStanju ? s.raspolozivaKolicina + ' kom' : 'Nema'}</span>
                        : <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      {cijenaKupca > 0 ? <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{formatCijena(cijenaKupca)}</span> : <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => { if (!user) { setShowLoginPrompt(true); return }; if (naStanju) add(a, cijena, s!) }} disabled={!naStanju}
                          style={{ padding: '5px 12px', background: naStanju ? '#3b82f6' : '#e2e8f0', color: naStanju ? 'white' : '#94a3b8', border: 'none', borderRadius: '4px', cursor: naStanju ? 'pointer' : 'not-allowed', fontSize: '11px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShoppingCart size={11} />{inCart > 0 ? '+' + inCart : 'Dodaj'}
                        </button>
                        <button onClick={() => toggleFavorit(a.id)} style={{ padding: '5px 7px', border: '1px solid #e2e8f0', borderRadius: '4px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Heart size={11} style={{ color: favoriti.has(a.id) ? '#ef4444' : '#94a3b8' }} fill={favoriti.has(a.id) ? '#ef4444' : 'none'} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '8px' }}>
            {displayed.map(a => {
              const s = stanje[a.id]; const cijena = s ? s[siteConfig.tipCijene] || 0 : 0
              const cijenaKupca = rabat > 0 && cijena > 0 ? cijena * (1 - rabat / 100) : cijena
              const naStanju = s && s.raspolozivaKolicina > 0
              return (
                <div key={a.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Link href={'/proizvod/' + a.id} style={{ textDecoration: 'none', padding: '12px', flex: 1, display: 'block' }}>
                    <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                      {a.slika_url ? <img src={a.slika_url} alt="" style={{ maxHeight: '85%', maxWidth: '85%', objectFit: 'contain' }} /> : <Package size={28} style={{ color: '#cbd5e1' }} />}
                    </div>
                    <p style={{ fontSize: '11px', color: '#1e293b', fontWeight: 500, margin: '0 0 3px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{a.naziv}</p>
                    <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, fontFamily: 'monospace' }}>{a.sifra}</p>
                  </Link>
                  <div style={{ padding: '8px 12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{cijenaKupca > 0 ? formatCijena(cijenaKupca) : '—'}</span>
                    <button onClick={() => { if (!user) { setShowLoginPrompt(true); return }; if (naStanju) add(a, cijena, s!) }} disabled={!naStanju}
                      style={{ padding: '4px 10px', background: naStanju ? '#3b82f6' : '#e2e8f0', color: naStanju ? 'white' : '#94a3b8', border: 'none', borderRadius: '4px', cursor: naStanju ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit' }}>+</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '20px' }}>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ width: '32px', height: '32px', border: '1px solid ' + (page === p ? '#3b82f6' : '#e2e8f0'), borderRadius: '4px', background: page === p ? '#3b82f6' : 'white', color: page === p ? 'white' : '#64748b', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>{p}</button>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {showLoginPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLoginPrompt(false)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', maxWidth: '360px', width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Prijava potrebna</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Za dodavanje u korpu potrebna je prijava.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => setShowLoginPrompt(false)} style={{ padding: '9px 18px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>Zatvori</button>
              <a href="/login" style={{ padding: '9px 20px', background: '#3b82f6', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>Prijava →</a>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

'use client'
// McMaster-Carr inspired — search is everything, dense results, instant filtering

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { formatCijena, siteConfig } from '@/lib/config'
import { Search, X, ShoppingCart, Package, ChevronRight, Zap } from 'lucide-react'
import type { Artikal, ArtikalGrupa, StanjeSkladista, PaginatedResponse } from '@/types/nibis'

export default function McMasterSearch() {
  const [artikli, setArtikli] = useState<Artikal[]>([])
  const [stanje, setStanje] = useState<Record<number, StanjeSkladista>>({})
  const [grupe, setGrupe] = useState<ArtikalGrupa[]>([])
  const [activeGrupa, setActiveGrupa] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [qty, setQty] = useState<Record<number, number>>({})
  const perPage = 40
  const { add } = useCart()
  const { user, rabat } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/grupe').then(r => r.json()).then(d => setGrupe(d.items ?? [])).catch(() => {})
    inputRef.current?.focus()
    const gid = new URLSearchParams(window.location.search).get('grupaId')
    if (gid) { setActiveGrupa(parseInt(gid)); setHasSearched(true) }
    function sync() {
      const g = new URLSearchParams(window.location.search).get('grupaId')
      if (g) { setActiveGrupa(parseInt(g)); setHasSearched(true) }
      else setActiveGrupa(null)
      setPage(1)
    }
    window.addEventListener('grupaChanged', sync)
    return () => window.removeEventListener('grupaChanged', sync)
  }, [])

  const load = useCallback(async () => {
    if (!search && !activeGrupa) return
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
    setHasSearched(true)
  }, [page, search, activeGrupa])

  useEffect(() => { load() }, [load])

  function doSearch(v: string) {
    setSearch(v); setPage(1)
    if (v.length > 1) setHasSearched(true)
  }

  function selectGrupa(id: number | null) {
    setActiveGrupa(id); setPage(1); setSearch(''); setInputVal('')
    const url = new URL(window.location.href)
    id ? url.searchParams.set('grupaId', String(id)) : url.searchParams.delete('grupaId')
    window.history.pushState({}, '', url.toString())
  }

  const roots = grupe.filter(g => !g.parentId)
  const totalPages = Math.ceil(total / perPage)

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Header />

      {/* HERO SEARCH — everything */}
      <div style={{ background: '#cc0000', padding: hasSearched ? '12px 0' : '64px 0' , transition: 'padding 0.3s' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px' }}>
          {!hasSearched && (
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'white', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Pronađite što vam treba</h1>
              <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{total > 0 ? total.toLocaleString() + ' artikala' : ''} · Pretraži po nazivu ili šifri</p>
            </div>
          )}
          <div style={{ position: 'relative', display: 'flex', gap: '0' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
              <input
                ref={inputRef}
                value={inputVal}
                onChange={e => {
                  setInputVal(e.target.value)
                  if (searchTimer.current) clearTimeout(searchTimer.current)
                  searchTimer.current = setTimeout(() => doSearch(e.target.value), 300)
                }}
                onKeyDown={e => { if (e.key === 'Enter') doSearch(inputVal) }}
                placeholder="Unesite naziv, šifru ili barkod artikla..."
                style={{ width: '100%', paddingLeft: '46px', paddingRight: inputVal ? '40px' : '14px', height: '52px', fontSize: '16px', border: 'none', borderRadius: '6px 0 0 6px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, color: '#111827' }}
              />
              {inputVal && (
                <button onClick={() => { setInputVal(''); setSearch(''); setHasSearched(false) }} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
                  <X size={16} />
                </button>
              )}
            </div>
            <button onClick={() => doSearch(inputVal)}
              style={{ padding: '0 28px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '0 6px 6px 0', cursor: 'pointer', fontSize: '15px', fontWeight: 700, fontFamily: 'inherit', height: '52px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <Search size={16} /> Traži
            </button>
          </div>
          {hasSearched && search && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{total.toLocaleString()} rezultata za <strong>"{search}"</strong></span>
              <button onClick={() => { setSearch(''); setInputVal(''); setHasSearched(false) }} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', background: 'none', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontFamily: 'inherit' }}>× Obriši</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex' }}>
        {/* Category sidebar — always visible */}
        <aside style={{ width: '220px', flexShrink: 0, borderRight: '1px solid #e5e7eb', padding: '20px 0', background: '#fafafa' }}>
          <div style={{ padding: '0 16px 12px', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kategorije</div>
          <button onClick={() => selectGrupa(null)}
            style={{ width: '100%', textAlign: 'left', padding: '8px 16px', border: 'none', background: !activeGrupa ? '#fff3f3' : 'transparent', color: !activeGrupa ? '#cc0000' : '#374151', cursor: 'pointer', fontSize: '13px', fontWeight: !activeGrupa ? 600 : 400, borderLeft: '3px solid ' + (!activeGrupa ? '#cc0000' : 'transparent'), fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Svi artikli</span>
            {!activeGrupa && <ChevronRight size={12} />}
          </button>
          {roots.map(g => (
            <button key={g.id} onClick={() => selectGrupa(g.id)}
              style={{ width: '100%', textAlign: 'left', padding: '8px 16px', border: 'none', borderTop: '1px solid #f3f4f6', background: activeGrupa === g.id ? '#fff3f3' : 'transparent', color: activeGrupa === g.id ? '#cc0000' : '#374151', cursor: 'pointer', fontSize: '13px', fontWeight: activeGrupa === g.id ? 600 : 400, borderLeft: '3px solid ' + (activeGrupa === g.id ? '#cc0000' : 'transparent'), fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.1s' }}
              onMouseEnter={e => { if (activeGrupa !== g.id) (e.currentTarget as HTMLElement).style.background = '#f9fafb' }}
              onMouseLeave={e => { if (activeGrupa !== g.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {g.ikonaUrl ? <img src={g.ikonaUrl} alt="" style={{ width: '18px', height: '18px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} /> : <div style={{ width: '18px', height: '18px', background: g.boja || '#e5e7eb', borderRadius: '3px', flexShrink: 0 }} />}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.naziv}</span>
            </button>
          ))}
        </aside>

        {/* Main results */}
        <main style={{ flex: 1, padding: '0' }}>
          {!hasSearched ? (
            <div style={{ padding: '60px 40px', textAlign: 'center', color: '#9ca3af' }}>
              <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: '16px', margin: '0 0 8px', color: '#374151' }}>Unesite pojam za pretragu</p>
              <p style={{ fontSize: '13px' }}>Ili odaberite kategoriju lijevo</p>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e5e7eb' }}>
              {Array(10).fill(0).map((_, i) => <div key={i} style={{ height: '56px', background: 'white', animation: 'pulse 1.5s infinite' }} />)}
            </div>
          ) : artikli.length === 0 ? (
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', color: '#374151', margin: '0 0 8px' }}>Nema rezultata za "{search}"</p>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>Provjerite pravopis ili pokušajte s drugom šifrom</p>
            </div>
          ) : (
            <>
              {/* Results info bar */}
              <div style={{ padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
                <span><strong style={{ color: '#111827' }}>{total.toLocaleString()}</strong> artikala {activeGrupa ? 'u kategoriji' : ''} {search ? 'za "' + search + '"' : ''}</span>
                <span>Stranica {page} od {totalPages}</span>
              </div>

              {/* Dense table results */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', width: '60px' }}></th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Šifra / Naziv</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', width: '80px' }}>Stanje</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', width: '100px' }}>Cijena</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', width: '160px' }}>Naruči</th>
                  </tr>
                </thead>
                <tbody>
                  {artikli.map((a, idx) => {
                    const s = stanje[a.id]
                    const cijena = s ? s[siteConfig.tipCijene] || 0 : 0
                    const cijenaKupca = rabat > 0 && cijena > 0 ? cijena * (1 - rabat / 100) : cijena
                    const naStanju = s && s.raspolozivaKolicina > 0
                    const q = qty[a.id] || 1
                    return (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 0 ? 'white' : '#fafafa' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fff8f8'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? 'white' : '#fafafa'}
                      >
                        <td style={{ padding: '6px 12px' }}>
                          <div style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: '4px' }}>
                            {a.slika_url ? <img src={a.slika_url} alt="" style={{ maxWidth: '38px', maxHeight: '38px', objectFit: 'contain' }} /> : <Package size={18} style={{ color: '#d1d5db' }} />}
                          </div>
                        </td>
                        <td style={{ padding: '6px 12px' }}>
                          <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace', marginBottom: '2px' }}>{a.sifra}</div>
                          <Link href={'/proizvod/' + a.id} style={{ fontSize: '13px', color: '#111827', textDecoration: 'none', fontWeight: 500, lineHeight: 1.4 }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#cc0000'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#111827'}
                          >{a.naziv}</Link>
                          {(a.akcija_popust || 0) > 0 && <span style={{ marginLeft: '6px', fontSize: '10px', background: '#cc0000', color: 'white', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>-{a.akcija_popust}%</span>}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: naStanju ? '#16a34a' : '#9ca3af' }}>
                            {s ? (naStanju ? s.raspolozivaKolicina + ' ' + (a.jedinicaMjere || 'kom') : '—') : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{cijenaKupca > 0 ? formatCijena(cijenaKupca) : '—'}</div>
                          {a.procPoreza && <div style={{ fontSize: '10px', color: '#9ca3af' }}>+ PDV {a.procPoreza}%</div>}
                        </td>
                        <td style={{ padding: '6px 12px' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <input type="number" min={1} value={q} onChange={e => setQty(prev => ({ ...prev, [a.id]: parseInt(e.target.value) || 1 }))}
                              style={{ width: '48px', height: '30px', textAlign: 'center', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }}
                              onFocus={e => e.target.style.borderColor = '#cc0000'}
                              onBlur={e => e.target.style.borderColor = '#d1d5db'}
                            />
                            <button onClick={() => {
                              if (!user) { setShowLogin(true); return }
                              if (naStanju) for (let i = 0; i < q; i++) add(a, cijena, s!)
                            }} disabled={!naStanju}
                              style={{ padding: '5px 12px', height: '30px', background: naStanju ? '#cc0000' : '#e5e7eb', color: naStanju ? 'white' : '#9ca3af', border: 'none', borderRadius: '4px', cursor: naStanju ? 'pointer' : 'not-allowed', fontSize: '11px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', transition: 'background 0.15s', whiteSpace: 'nowrap' }}
                              onMouseEnter={e => { if (naStanju) (e.currentTarget as HTMLElement).style.background = '#aa0000' }}
                              onMouseLeave={e => { if (naStanju) (e.currentTarget as HTMLElement).style.background = '#cc0000' }}
                            >
                              <ShoppingCart size={11} /> Dodaj
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', padding: '20px' }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: '4px', background: 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '12px', color: '#374151', opacity: page <= 1 ? 0.4 : 1, fontFamily: 'inherit' }}>← Prethodna</button>
                  {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)} style={{ width: '34px', height: '34px', border: '1px solid ' + (page === p ? '#cc0000' : '#e5e7eb'), borderRadius: '4px', background: page === p ? '#cc0000' : 'white', color: page === p ? 'white' : '#374151', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: page === p ? 700 : 400 }}>{p}</button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: '4px', background: 'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', color: '#374151', opacity: page >= totalPages ? 0.4 : 1, fontFamily: 'inherit' }}>Sljedeća →</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <Footer />

      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLogin(false)}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '28px', maxWidth: '360px', width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <Zap size={32} style={{ color: '#cc0000', margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Prijava potrebna</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Za narudžbu je potrebna B2B prijava.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowLogin(false)} style={{ flex: 1, padding: '9px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Zatvori</button>
              <a href="/login" style={{ flex: 1, padding: '9px', background: '#cc0000', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Prijava →</a>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

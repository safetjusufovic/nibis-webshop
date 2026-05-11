'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useFavoriti } from '@/hooks/useFavoriti'
import { formatCijena, siteConfig } from '@/lib/config'
import { ShoppingCart, Heart, Package, Search, ChevronRight, Tag } from 'lucide-react'
import type { Artikal, ArtikalGrupa, StanjeSkladista, PaginatedResponse } from '@/types/nibis'

export default function WarmEditorial() {
  const [artikli, setArtikli] = useState<Artikal[]>([])
  const [stanje, setStanje] = useState<Record<number, StanjeSkladista>>({})
  const [grupe, setGrupe] = useState<ArtikalGrupa[]>([])
  const [activeGrupa, setActiveGrupa] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const perPage = 16
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

  const totalPages = Math.ceil(total / perPage)
  const roots = grupe.filter(g => !g.parentId)
  const activeGrupaObj = grupe.find(g => g.id === activeGrupa)

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', display: 'flex', flexDirection: 'column', fontFamily: "'Georgia', serif" }}>
      <Header />

      <div style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '40px' }}>

        {/* LEFT SIDEBAR */}
        <aside>
          <div style={{ position: 'sticky', top: '80px' }}>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a8a29e' }} />
              <input value={searchInput} onChange={e => handleSearch(e.target.value)} placeholder="Pretraži..."
                style={{ width: '100%', paddingLeft: '32px', paddingRight: '10px', height: '36px', fontSize: '13px', background: 'white', border: '1px solid #e7e5e4', borderRadius: '6px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
                onFocus={e => e.target.style.borderColor = '#92400e'}
                onBlur={e => e.target.style.borderColor = '#e7e5e4'}
              />
            </div>

            {/* Categories */}
            <div style={{ marginBottom: '8px', fontSize: '10px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Inter, sans-serif' }}>
              Kategorije
            </div>
            <button onClick={() => selectGrupa(null)}
              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: '2px', border: 'none', background: activeGrupa === null ? '#fef3c7' : 'transparent', cursor: 'pointer', fontSize: '13px', color: activeGrupa === null ? '#92400e' : '#57534e', borderRadius: '6px', fontFamily: 'Georgia, serif', fontWeight: activeGrupa === null ? 600 : 400, borderLeft: activeGrupa === null ? '3px solid #92400e' : '3px solid transparent', transition: 'all 0.15s' }}>
              Svi artikli <span style={{ float: 'right', fontSize: '11px', color: '#a8a29e', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>{total}</span>
            </button>
            {roots.map(g => (
              <button key={g.id} onClick={() => selectGrupa(g.id)}
                style={{ width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: '2px', border: 'none', background: activeGrupa === g.id ? '#fef3c7' : 'transparent', cursor: 'pointer', fontSize: '13px', color: activeGrupa === g.id ? '#92400e' : '#57534e', borderRadius: '6px', fontFamily: 'Georgia, serif', fontWeight: activeGrupa === g.id ? 600 : 400, borderLeft: activeGrupa === g.id ? '3px solid #92400e' : '3px solid transparent', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {g.ikonaUrl && <img src={g.ikonaUrl} alt="" style={{ width: '18px', height: '18px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.naziv}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main>
          {/* Breadcrumb + title */}
          <div style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '2px solid #1c1917' }}>
            <div style={{ fontSize: '11px', color: '#a8a29e', fontFamily: 'Inter, sans-serif', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span onClick={() => selectGrupa(null)} style={{ cursor: 'pointer', color: '#92400e' }}>Katalog</span>
              {activeGrupaObj && <><ChevronRight size={10} /><span>{activeGrupaObj.naziv}</span></>}
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1c1917', margin: 0, letterSpacing: '-0.02em' }}>
              {activeGrupaObj ? activeGrupaObj.naziv : search ? `"${search}"` : 'Svi artikli'}
            </h1>
            <p style={{ fontSize: '13px', color: '#a8a29e', margin: '4px 0 0', fontFamily: 'Inter, sans-serif' }}>{total.toLocaleString()} artikala</p>
          </div>

          {/* List layout */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {Array(8).fill(0).map((_, i) => <div key={i} style={{ height: '100px', background: '#f5f5f4', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e7e5e4' }}>
              {artikli.map((a, idx) => {
                const s = stanje[a.id]
                const cijena = s ? s[siteConfig.tipCijene] || 0 : 0
                const cijenaKupca = rabat > 0 && cijena > 0 ? cijena * (1 - rabat / 100) : cijena
                const naStanju = s && s.raspolozivaKolicina > 0
                const isFav = favoriti.has(a.id)
                const akcijaAktivna = (a.akcija_popust || 0) > 0
                return (
                  <div key={a.id} style={{ background: 'white', display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fefce8'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}
                  >
                    {/* Slika */}
                    <div style={{ height: '100px', background: '#f5f5f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {a.slika_url ? <img src={a.slika_url} alt="" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} /> : <Package size={28} style={{ color: '#d6d3d1' }} />}
                    </div>
                    {/* Info */}
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {akcijaAktivna && <span style={{ fontSize: '10px', background: '#dc2626', color: 'white', padding: '1px 6px', borderRadius: '3px', fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>-{a.akcija_popust}%</span>}
                        <span style={{ fontSize: '10px', color: '#a8a29e', fontFamily: 'monospace' }}>{a.sifra}</span>
                      </div>
                      <Link href={'/proizvod/' + a.id} style={{ textDecoration: 'none' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1c1917', margin: '0 0 6px', lineHeight: 1.35 }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#92400e'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#1c1917'}
                        >{a.naziv}</h3>
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: naStanju ? '#dcfce7' : '#fee2e2', color: naStanju ? '#166534' : '#991b1b', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                          {naStanju ? 'Na stanju' : 'Nema'}
                        </span>
                        {naStanju && s && <span style={{ fontSize: '11px', color: '#a8a29e', fontFamily: 'Inter, sans-serif' }}>{s.raspolozivaKolicina} {a.jedinicaMjere || 'kom'}</span>}
                      </div>
                    </div>
                    {/* Cijena + dugme */}
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', minWidth: '130px' }}>
                      {cijenaKupca > 0 ? (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.02em' }}>{formatCijena(cijenaKupca)}</div>
                          {rabat > 0 && cijena > 0 && <div style={{ fontSize: '11px', color: '#a8a29e', textDecoration: 'line-through', fontFamily: 'Inter, sans-serif' }}>{formatCijena(cijena)}</div>}
                        </div>
                      ) : <span style={{ color: '#a8a29e', fontSize: '13px' }}>—</span>}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => toggleFavorit(a.id)} style={{ width: '32px', height: '32px', border: '1px solid #e7e5e4', borderRadius: '6px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Heart size={13} style={{ color: isFav ? '#dc2626' : '#a8a29e' }} fill={isFav ? '#dc2626' : 'none'} />
                        </button>
                        <button onClick={() => { if (!user) { setShowLogin(true); return }; if (naStanju) add(a, cijena, s!) }} disabled={!naStanju}
                          style={{ padding: '6px 14px', background: naStanju ? '#92400e' : '#e7e5e4', color: naStanju ? 'white' : '#a8a29e', border: 'none', borderRadius: '6px', cursor: naStanju ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShoppingCart size={12} /> Dodaj
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '32px' }}>
              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ width: '36px', height: '36px', border: '1px solid ' + (page === p ? '#92400e' : '#e7e5e4'), borderRadius: '6px', background: page === p ? '#92400e' : 'white', color: page === p ? 'white' : '#57534e', cursor: 'pointer', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>{p}</button>
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />

      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLogin(false)}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '32px', maxWidth: '360px', width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '22px', margin: '0 0 10px', color: '#1c1917' }}>Prijava potrebna</h2>
            <p style={{ fontSize: '14px', color: '#78716c', marginBottom: '24px', fontFamily: 'Inter, sans-serif' }}>Za narudžbu je potrebna B2B prijava.</p>
            <div style={{ display: 'flex', gap: '10px', fontFamily: 'Inter, sans-serif' }}>
              <button onClick={() => setShowLogin(false)} style={{ flex: 1, padding: '10px', background: '#f5f5f4', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Zatvori</button>
              <a href="/login" style={{ flex: 1, padding: '10px', background: '#92400e', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Prijava →</a>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

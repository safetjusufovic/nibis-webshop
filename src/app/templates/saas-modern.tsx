'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useFavoriti } from '@/hooks/useFavoriti'
import { formatCijena, siteConfig } from '@/lib/config'
import { ShoppingCart, Heart, Package, Search, Sparkles, Tag, ChevronRight, X } from 'lucide-react'
import type { Artikal, ArtikalGrupa, StanjeSkladista, PaginatedResponse } from '@/types/nibis'

export default function SaasModern() {
  const [artikli, setArtikli] = useState<Artikal[]>([])
  const [stanje, setStanje] = useState<Record<number, StanjeSkladista>>({})
  const [grupe, setGrupe] = useState<ArtikalGrupa[]>([])
  const [activeGrupa, setActiveGrupa] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [perPage] = useState(20)
  const { cart, add } = useCart()
  const { user, rabat } = useAuth()
  const { favoriti, toggle: toggleFavorit } = useFavoriti()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const searchTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/grupe').then(r => r.json()).then(d => setGrupe(d.items ?? [])).catch(() => {})
    const gid = new URLSearchParams(window.location.search).get('grupaId')
    if (gid) setActiveGrupa(parseInt(gid))
    window.addEventListener('grupaChanged', syncGrupa)
    return () => window.removeEventListener('grupaChanged', syncGrupa)
  }, [])

  function syncGrupa() {
    const gid = new URLSearchParams(window.location.search).get('grupaId')
    setActiveGrupa(gid ? parseInt(gid) : null); setPage(1)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ page: String(page), perPage: String(perPage), ...(search && { search }), ...(activeGrupa && { grupaId: String(activeGrupa) }) })
    const res = await fetch('/api/artikli?' + p)
    const data: PaginatedResponse<Artikal> = await res.json()
    setArtikli(data.items ?? []); setTotal(data.total ?? 0)
    if (data.items?.length) {
      const ids = data.items.map(a => a.id).join(',')
      const sr = await fetch('/api/stanje?ids=' + ids)
      const sd = await sr.json()
      const map: Record<number, StanjeSkladista> = {}
      sd.items?.forEach((s: StanjeSkladista) => { map[s.artikalId] = s })
      setStanje(map)
    }
    setLoading(false)
  }, [page, perPage, search, activeGrupa])

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
  const activeGrupaObj = grupe.find(g => g.id === activeGrupa)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Glassmorphism Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/" style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', textDecoration: 'none', letterSpacing: '-0.03em', flexShrink: 0 }}>
            NIBIS <span style={{ color: '#6366f1' }}>Shop</span>
          </Link>
          <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={searchInput} onChange={e => handleSearch(e.target.value)} placeholder="Pretraži artikle..."
              style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', height: '38px', fontSize: '14px', background: '#f1f5f9', border: '1px solid transparent', borderRadius: '100px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, transition: 'all 0.15s' }}
              onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)' }}
              onBlur={e => { e.target.style.background = '#f1f5f9'; e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <nav style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
            {grupe.filter(g => !g.parentId).slice(0, 5).map(g => (
              <button key={g.id} onClick={() => selectGrupa(g.id)} style={{ padding: '6px 12px', border: 'none', background: activeGrupa === g.id ? '#6366f1' : 'transparent', color: activeGrupa === g.id ? 'white' : '#64748b', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.15s' }}>
                {g.naziv}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero — samo kad nije filtriranje */}
      {!activeGrupa && !search && (
        <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)', padding: '48px 24px 56px', textAlign: 'center' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '100px', padding: '6px 14px', fontSize: '12px', color: 'white', fontWeight: 600, marginBottom: '16px', backdropFilter: 'blur(10px)' }}>
              <Sparkles size={12} /> B2B webshop · {total.toLocaleString()} artikala
            </div>
            <h1 style={{ fontSize: '42px', fontWeight: 800, color: 'white', margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.2 }}>Profesionalna roba</h1>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>Brzo naručite, brzo primite</p>
          </div>
        </div>
      )}

      {/* Category pills */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: activeGrupa || search ? '20px 24px 0' : '-28px 24px 0', position: 'relative', zIndex: 10, marginTop: !activeGrupa && !search ? '-28px' : '0' }}>
        {!activeGrupa && !search && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            {grupe.filter(g => !g.parentId).slice(0, 8).map(g => (
              <button key={g.id} onClick={() => selectGrupa(g.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '100px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#374151', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(99,102,241,0.2)'; (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLElement).style.color = '#6366f1' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.color = '#374151' }}
              >
                {g.ikonaUrl && <img src={g.ikonaUrl} alt="" style={{ width: '18px', height: '18px', objectFit: 'cover', borderRadius: '4px' }} />}
                {g.naziv}
                <ChevronRight size={12} style={{ opacity: 0.4 }} />
              </button>
            ))}
          </div>
        )}

        {/* Breadcrumb kad je aktivan filter */}
        {(activeGrupa || search) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <button onClick={() => selectGrupa(null)} style={{ fontSize: '13px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Sve kategorije</button>
            {activeGrupaObj && <><ChevronRight size={12} style={{ color: '#94a3b8' }} /><span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{activeGrupaObj.naziv}</span></>}
            {search && <><ChevronRight size={12} style={{ color: '#94a3b8' }} /><span style={{ fontSize: '13px', color: '#374151' }}>Pretraga: "{search}"</span></>}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>{total.toLocaleString()} rezultata</span>
          </div>
        )}

        {/* Product grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
            {Array(8).fill(0).map((_, i) => <div key={i} style={{ height: '280px', background: 'white', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
            {artikli.map(a => {
              const s = stanje[a.id]
              const cijena = s ? s[siteConfig.tipCijene] || 0 : 0
              const cijenaKupca = rabat > 0 && cijena > 0 ? cijena * (1 - rabat / 100) : cijena
              const naStanju = s && s.raspolozivaKolicina > 0
              const akcijaAktivna = (a.akcija_popust || 0) > 0
              const isHovered = hoveredCard === a.id
              const isFav = favoriti.has(a.id)
              const inCart = cart[a.id]?.qty ?? 0
              return (
                <div key={a.id}
                  style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid ' + (isHovered ? '#c7d2fe' : 'rgba(0,0,0,0.06)'), transition: 'all 0.2s', transform: isHovered ? 'translateY(-4px)' : 'none', boxShadow: isHovered ? '0 20px 40px rgba(99,102,241,0.15)' : '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}
                  onMouseEnter={() => setHoveredCard(a.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <Link href={'/proizvod/' + a.id} style={{ textDecoration: 'none', display: 'block', flex: 1 }}>
                    <div style={{ height: '160px', background: '#f8fafc', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {a.slika_url ? <img src={a.slika_url} alt="" style={{ maxWidth: '75%', maxHeight: '75%', objectFit: 'contain' }} /> : <Package size={36} style={{ color: '#cbd5e1' }} />}
                      {akcijaAktivna && <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px' }}>-{a.akcija_popust}%</div>}
                      <button onClick={e => { e.preventDefault(); toggleFavorit(a.id) }}
                        style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                        <Heart size={13} style={{ color: isFav ? '#ef4444' : '#94a3b8' }} fill={isFav ? '#ef4444' : 'none'} />
                      </button>
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{a.naziv}</p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontFamily: 'monospace' }}>{a.sifra}</p>
                    </div>
                  </Link>
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#6366f1' }}>{cijenaKupca > 0 ? formatCijena(cijenaKupca) : '—'}</div>
                      {!naStanju && <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 500 }}>Nema na stanju</div>}
                    </div>
                    <button onClick={() => { if (!user) { setShowLoginPrompt(true); return }; if (naStanju) add(a, cijena, s!) }} disabled={!naStanju}
                      style={{ width: '36px', height: '36px', borderRadius: '10px', background: naStanju ? '#6366f1' : '#f1f5f9', color: naStanju ? 'white' : '#94a3b8', border: 'none', cursor: naStanju ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
                      onMouseEnter={e => { if (naStanju) (e.currentTarget as HTMLElement).style.background = '#4f46e5' }}
                      onMouseLeave={e => { if (naStanju) (e.currentTarget as HTMLElement).style.background = '#6366f1' }}
                    >
                      <ShoppingCart size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', margin: '32px 0' }}>
            {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ width: '36px', height: '36px', border: '1px solid ' + (page === p ? '#6366f1' : '#e2e8f0'), borderRadius: '10px', background: page === p ? '#6366f1' : 'white', color: page === p ? 'white' : '#64748b', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: page === p ? 600 : 400 }}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {showLoginPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLoginPrompt(false)}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', maxWidth: '360px', width: '90%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '56px', height: '56px', background: '#ede9fe', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ShoppingCart size={24} style={{ color: '#6366f1' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>Prijava potrebna</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>Za dodavanje u korpu potrebna je prijava na vaš B2B račun.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLoginPrompt(false)} style={{ flex: 1, padding: '11px', background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}>Zatvori</button>
              <a href="/login" style={{ flex: 1, padding: '11px', background: '#6366f1', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Prijava →</a>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

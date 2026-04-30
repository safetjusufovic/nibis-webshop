'use client'

import { useState, useEffect, useCallback } from 'react'
import { SlidersHorizontal, ChevronRight, Package } from 'lucide-react'
import Header from '@/components/layout/Header'
import AuthGuard from '@/components/auth/AuthGuard'
import ProductCard from '@/components/shop/ProductCard'
import AkcijeSlider from '@/components/shop/AkcijeSlider'
import HeroBanner from '@/components/shop/HeroBanner'
import type { Artikal, ArtikalGrupa, StanjeSkladista, PaginatedResponse } from '@/types/nibis'
import { siteConfig } from '@/lib/config'

// ─── Category Sidebar ─────────────────────────────────────────────────────────
function CategorySidebar({ grupe, activeId, onSelect }: {
  grupe: ArtikalGrupa[]
  activeId: number | null
  onSelect: (id: number | null) => void
}) {
  const roots = grupe.filter(g => !g.parentId)

  return (
    <aside style={{ width: '220px', flexShrink: 0 }}>
      <div style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        overflow: 'hidden',
        position: 'sticky',
        top: '76px',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Kategorije
          </span>
        </div>
        <div style={{ padding: '8px' }}>
          <button
            onClick={() => onSelect(null)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px 10px',
              fontSize: '14px',
              fontFamily: 'inherit',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.1s',
              fontWeight: activeId === null ? 500 : 400,
              color: activeId === null ? 'var(--brand)' : 'var(--text)',
              background: activeId === null ? 'var(--brand-pale)' : 'transparent',
            }}
          >
            Sve kategorije
          </button>

          {roots.map(root => {
            const children = grupe.filter(g => g.parentId === root.id)
            const isActive = activeId === root.id || children.some(c => c.id === activeId)

            return (
              <div key={root.id}>
                <button
                  onClick={() => onSelect(root.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    fontWeight: isActive ? 500 : 400,
                    color: activeId === root.id ? 'var(--brand)' : 'var(--text)',
                    background: activeId === root.id ? 'var(--brand-pale)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => { if (activeId !== root.id) (e.currentTarget as HTMLElement).style.background = 'var(--surface)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = activeId === root.id ? 'var(--brand-pale)' : 'transparent' }}
                >
                  <span>{root.naziv}</span>
                  {children.length > 0 && <ChevronRight size={12} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />}
                </button>

                {(isActive || children.some(c => c.id === activeId)) && children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => onSelect(child.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 10px 6px 24px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                      color: activeId === child.id ? 'var(--brand)' : 'var(--text-muted)',
                      fontWeight: activeId === child.id ? 500 : 400,
                      background: activeId === child.id ? 'var(--brand-pale)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (activeId !== child.id) (e.currentTarget as HTMLElement).style.background = 'var(--surface)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = activeId === child.id ? 'var(--brand-pale)' : 'transparent' }}
                  >
                    {child.naziv}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      overflow: 'hidden',
    }}>
      <div style={{ paddingTop: '72%', background: 'var(--surface)', position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }} />
      </div>
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ height: '10px', borderRadius: '6px', background: 'var(--surface)', width: '40%' }} />
        <div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface)', width: '85%' }} />
        <div style={{ height: '12px', borderRadius: '6px', background: 'var(--surface)', width: '60%' }} />
        <div style={{ height: '38px', borderRadius: '9px', background: 'var(--surface)', marginTop: '4px' }} />
      </div>
      <style>{`@keyframes shimmer { 0% { backgroundPosition: -200% 0 } 100% { backgroundPosition: 200% 0 } }`}</style>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [grupe, setGrupe] = useState<ArtikalGrupa[]>([])
  const [artikli, setArtikli] = useState<Artikal[]>([])
  const [stanje, setStanje] = useState<Record<number, StanjeSkladista>>({})
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [activeGrupa, setActiveGrupa] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterStock, setFilterStock] = useState(false)
  const [mobileFilters, setMobileFilters] = useState(false)
  const [sortBy, setSortBy] = useState('naziv')
  const [cijenaDo, setCijenaDo] = useState('')
  const [cijenaOd, setCijenaOd] = useState('')

  const perPage = siteConfig.perPage

  useEffect(() => {
    fetch('/api/grupe')
      .then(r => r.json())
      .then((d: PaginatedResponse<ArtikalGrupa>) => setGrupe(d.items ?? []))
      .catch(console.error)
  }, [])

  const loadArtikli = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      ...(search && { search }),
      ...(activeGrupa && { grupaId: String(activeGrupa) }),
      ...(sortBy && { sortBy }),
      ...(cijenaOd && { cijenaOd }),
      ...(cijenaDo && { cijenaDo }),
    })
    try {
      const res = await fetch(`/api/artikli?${params}`)
      const data: PaginatedResponse<Artikal> = await res.json()
      setArtikli(data.items ?? [])
      setTotal(data.total ?? 0)
      if (data.items?.length) {
        const ids = data.items.map(a => a.id).join(',')
        const sr = await fetch(`/api/stanje?ids=${ids}`)
        const sd: PaginatedResponse<StanjeSkladista> = await sr.json()
        const map: Record<number, StanjeSkladista> = {}
        sd.items?.forEach(s => { map[s.artikalId] = s })
        setStanje(map)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [page, perPage, search, activeGrupa, sortBy, cijenaOd, cijenaDo])

  useEffect(() => { loadArtikli() }, [loadArtikli])

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  function onGrupaSelect(id: number | null) {
    setActiveGrupa(id)
    setPage(1)
    setMobileFilters(false)
  }

  const displayed = filterStock
    ? artikli.filter(a => { const s = stanje[a.id]; return s && s.raspolozivaKolicina > 0 })
    : artikli

  const totalPages = Math.ceil(total / perPage)

  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
        <Header onSearch={q => setSearchInput(q)} />

        <HeroBanner />
        <AkcijeSlider />
        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 24px 64px' }}>

          {/* Toolbar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {activeGrupa ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                  <button
                    onClick={() => onGrupaSelect(null)}
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', padding: 0 }}
                  >
                    Sve kategorije
                  </button>
                  <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                    {grupe.find(g => g.id === activeGrupa)?.naziv}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  {search ? `Rezultati za "${search}"` : 'Svi artikli'}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '13px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                userSelect: 'none',
              }}>
                <input
                  type="checkbox"
                  checked={filterStock}
                  onChange={e => setFilterStock(e.target.checked)}
                  style={{ accentColor: 'var(--brand)', width: '15px', height: '15px' }}
                />
                Samo na stanju
              </label>

              <button
                className="mobile-filters-btn"
                style={{
                  display: 'none',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  padding: '7px 14px',
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'var(--text)',
                }}
                onClick={() => setMobileFilters(!mobileFilters)}
              >
                <SlidersHorizontal size={13} /> Kategorije
              </button>

              {/* Sortiranje */}
              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setPage(1) }}
                style={{ height: '36px', fontSize: '13px', background: 'white', border: '1px solid var(--border)', borderRadius: '9px', padding: '0 10px', fontFamily: 'inherit', cursor: 'pointer', color: 'var(--text)', outline: 'none' }}
              >
                <option value="naziv">Naziv A-Z</option>
                <option value="naziv_desc">Naziv Z-A</option>
                <option value="cijena_asc">Cijena ↑</option>
                <option value="cijena_desc">Cijena ↓</option>
              </select>

              {/* Filter cijene */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  placeholder="Od KM"
                  value={cijenaOd}
                  onChange={e => { setCijenaOd(e.target.value); setPage(1) }}
                  style={{ width: '70px', height: '36px', fontSize: '12px', padding: '0 8px', border: '1px solid var(--border)', borderRadius: '9px', outline: 'none', fontFamily: 'inherit' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                <input
                  type="number"
                  placeholder="Do KM"
                  value={cijenaDo}
                  onChange={e => { setCijenaDo(e.target.value); setPage(1) }}
                  style={{ width: '70px', height: '36px', fontSize: '12px', padding: '0 8px', border: '1px solid var(--border)', borderRadius: '9px', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                background: 'white',
                border: '1px solid var(--border)',
                padding: '7px 14px',
                borderRadius: '9px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}>
                {total.toLocaleString()} artikala
              </div>
            </div>
          </div>

          {/* Mobile filters */}
          {mobileFilters && (
            <div style={{ marginBottom: '16px' }} className="mobile-filters">
              <CategorySidebar grupe={grupe} activeId={activeGrupa} onSelect={onGrupaSelect} />
            </div>
          )}

          {/* Layout */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            {/* Sidebar — desktop only */}
            <div className="desktop-sidebar" style={{ display: 'block' }}>
              <CategorySidebar grupe={grupe} activeId={activeGrupa} onSelect={onGrupaSelect} />
            </div>

            {/* Grid */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px',
              }}>
                {loading
                  ? Array(perPage).fill(0).map((_, i) => <SkeletonCard key={i} />)
                  : displayed.length === 0
                  ? (
                    <div style={{
                      gridColumn: '1 / -1',
                      textAlign: 'center',
                      padding: '64px 24px',
                      color: 'var(--text-muted)',
                    }}>
                      <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                      <p style={{ fontSize: '15px', margin: 0 }}>Nema artikala za odabrane kriterije</p>
                      <button
                        onClick={() => { onGrupaSelect(null); setFilterStock(false) }}
                        style={{ marginTop: '12px', color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
                      >
                        Prikaži sve
                      </button>
                    </div>
                  )
                  : displayed.map(a => (
                    <ProductCard key={a.id} artikal={a} stanje={stanje[a.id]} slika={(a as any).slika_url} />
                  ))
                }
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '40px',
                  flexWrap: 'wrap',
                }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    ← Prethodna
                  </button>

                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center',
                  }}>
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let p: number
                      if (totalPages <= 7) p = i + 1
                      else if (page <= 4) p = i + 1
                      else if (page >= totalPages - 3) p = totalPages - 6 + i
                      else p = page - 3 + i
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          style={{
                            width: '36px',
                            height: '36px',
                            border: p === page ? 'none' : '1px solid var(--border)',
                            borderRadius: '9px',
                            background: p === page ? 'var(--brand)' : 'white',
                            color: p === page ? 'white' : 'var(--text)',
                            fontFamily: 'inherit',
                            fontSize: '13px',
                            fontWeight: p === page ? 600 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {p}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Sljedeća →
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid var(--border)',
          background: 'white',
          padding: '32px 24px',
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                {siteConfig.name}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                B2B webshop · Powered by NIBIS ERP
              </div>
            </div>
            <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>Pon–Pet 08:00–16:00</span>
              {siteConfig.contactEmail && (
                <a href={`mailto:${siteConfig.contactEmail}`} style={{ color: 'var(--brand)', textDecoration: 'none' }}>
                  {siteConfig.contactEmail}
                </a>
              )}
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-filters-btn { display: flex !important; }
        }
      `}</style>
    </AuthGuard>
  )
}

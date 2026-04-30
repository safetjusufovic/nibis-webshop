'use client'

import { useState, useEffect, useCallback } from 'react'
import { SlidersHorizontal, ChevronRight, ChevronDown, Package, ShoppingCart, Plus } from 'lucide-react'
import Header from '@/components/layout/Header'
import AuthGuard from '@/components/auth/AuthGuard'
import AkcijeSlider from '@/components/shop/AkcijeSlider'
import HeroBanner from '@/components/shop/HeroBanner'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useFavoriti } from '@/hooks/useFavoriti'
import type { Artikal, ArtikalGrupa, StanjeSkladista, PaginatedResponse } from '@/types/nibis'
import { formatCijena, siteConfig } from '@/lib/config'
import Link from 'next/link'

// ─── Collapsible Category Sidebar ─────────────────────────────────────────────
function CategorySidebar({ grupe, activeId, onSelect }: {
  grupe: ArtikalGrupa[]
  activeId: number | null
  onSelect: (id: number | null) => void
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const roots = grupe.filter(g => !g.parentId)

  function toggleOpen(id: number) {
    setOpen(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <aside className="w-52 flex-shrink-0 hidden md:block">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden sticky top-20">
        <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Kategorije</span>
        </div>
        <div className="py-1">
          <button
            onClick={() => onSelect(null)}
            className={`w-full text-left px-3 py-2 text-[13px] rounded transition-colors ${
              activeId === null
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Sve kategorije
          </button>

          {roots.map(root => {
            const children = grupe.filter(g => g.parentId === root.id)
            const isActive = activeId === root.id || children.some(c => c.id === activeId)
            const isOpen = open[root.id] ?? isActive

            return (
              <div key={root.id}>
                <div className="flex items-center">
                  <button
                    onClick={() => onSelect(root.id)}
                    className={`flex-1 text-left px-3 py-2 text-[13px] rounded transition-colors ${
                      activeId === root.id
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : isActive ? 'text-gray-800 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {root.naziv}
                  </button>
                  {children.length > 0 && (
                    <button
                      onClick={() => toggleOpen(root.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600"
                    >
                      {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  )}
                </div>

                {isOpen && children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => onSelect(child.id)}
                    className={`w-full text-left pl-6 pr-3 py-1.5 text-[12px] rounded transition-colors ${
                      activeId === child.id
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
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

// ─── Product Table Row ─────────────────────────────────────────────────────────
function ProductRow({ artikal, stanje }: { artikal: Artikal; stanje: StanjeSkladista | null | undefined }) {
  const { cart, add } = useCart()
  const { rabat } = useAuth()
  const { favoriti, toggle: toggleFavorit } = useFavoriti()
  const inCart = cart[artikal.id]?.qty ?? 0

  const cijenaBase = stanje ? stanje[siteConfig.tipCijene] : artikal.planskaMaloprodajnaCijena ?? 0
  const akcijaPopust = (artikal as any).akcija_popust ?? 0
  const akcijaAktivna = akcijaPopust > 0 && (!(artikal as any).akcija_do || new Date((artikal as any).akcija_do) > new Date())
  const popust = akcijaAktivna ? akcijaPopust : rabat
  const cijena = popust > 0 ? Math.round(cijenaBase * (1 - popust / 100) * 100) / 100 : cijenaBase

  const canAdd = stanje ? stanje.raspolozivaKolicina > 0 : false
  const atMax = stanje ? inCart >= stanje.raspolozivaKolicina : false
  const isFav = favoriti.has(artikal.id)

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
      {/* Naziv */}
      <td className="py-2.5 pl-4 pr-2">
        <Link href={`/proizvod/${artikal.id}`} className="text-[13px] font-medium text-gray-800 hover:text-emerald-700 transition-colors leading-snug block">
          {artikal.naziv}
        </Link>
        {artikal.naziv2 && <span className="text-[11px] text-gray-400">{artikal.naziv2}</span>}
      </td>
      {/* Šifra */}
      <td className="py-2.5 px-2 whitespace-nowrap">
        <span className="text-[11px] font-mono text-gray-400">{artikal.sifra}</span>
      </td>
      {/* Grupa */}
      <td className="py-2.5 px-2 hidden lg:table-cell">
        <span className="text-[11px] text-gray-400">{artikal.grupa?.naziv ?? '—'}</span>
      </td>
      {/* Stanje */}
      <td className="py-2.5 px-2 whitespace-nowrap">
        {stanje === undefined ? (
          <span className="text-[11px] text-gray-300">...</span>
        ) : !stanje || stanje.raspolozivaKolicina <= 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
            Nema
          </span>
        ) : stanje.raspolozivaKolicina <= 3 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            {stanje.raspolozivaKolicina} kom
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Na stanju
          </span>
        )}
      </td>
      {/* Cijena */}
      <td className="py-2.5 px-2 whitespace-nowrap text-right">
        <div className="text-[14px] font-bold text-gray-900">{formatCijena(cijena)}</div>
        {popust > 0 && (
          <div className="text-[11px] text-gray-400 line-through">{formatCijena(cijenaBase)}</div>
        )}
      </td>
      {/* Akcije */}
      <td className="py-2.5 pl-2 pr-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5 justify-end">
          {/* Favorit */}
          <button
            onClick={() => toggleFavorit(artikal.id)}
            className={`p-1.5 rounded transition-colors ${isFav ? 'text-red-500 bg-red-50' : 'text-gray-300 hover:text-gray-400 hover:bg-gray-100 opacity-0 group-hover:opacity-100'}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          {/* Dodaj u korpu */}
          {inCart > 0 ? (
            <button
              onClick={() => !atMax && add(artikal, cijenaBase, stanje ?? null)}
              disabled={atMax}
              className="flex items-center gap-1 text-[12px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              <Plus size={11} />
              {inCart}
            </button>
          ) : (
            <button
              onClick={() => canAdd && add(artikal, cijenaBase, stanje ?? null)}
              disabled={!canAdd}
              className={`flex items-center gap-1 text-[12px] font-medium px-2.5 py-1.5 rounded transition-colors ${
                canAdd
                  ? 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ShoppingCart size={11} />
              Dodaj
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-3 pl-4 pr-2"><div className="h-3.5 bg-gray-100 rounded w-3/4 animate-pulse" /></td>
      <td className="py-3 px-2"><div className="h-3 bg-gray-100 rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-2 hidden lg:table-cell"><div className="h-3 bg-gray-100 rounded w-20 animate-pulse" /></td>
      <td className="py-3 px-2"><div className="h-5 bg-gray-100 rounded-full w-16 animate-pulse" /></td>
      <td className="py-3 px-2"><div className="h-4 bg-gray-100 rounded w-20 ml-auto animate-pulse" /></td>
      <td className="py-3 pl-2 pr-4"><div className="h-7 bg-gray-100 rounded w-16 ml-auto animate-pulse" /></td>
    </tr>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
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
      <div className="min-h-screen bg-gray-50">
        <Header onSearch={q => setSearchInput(q)} />
        <HeroBanner />
        <AkcijeSlider />

        <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-5 pb-16">
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* Breadcrumb */}
            <div className="flex-1 min-w-0 flex items-center gap-1.5 text-[13px]">
              {activeGrupa ? (
                <>
                  <button onClick={() => onGrupaSelect(null)} className="text-gray-400 hover:text-emerald-700 transition-colors">
                    Sve kategorije
                  </button>
                  <ChevronRight size={12} className="text-gray-300" />
                  <span className="text-gray-700 font-medium truncate">
                    {grupe.find(g => g.id === activeGrupa)?.naziv}
                  </span>
                </>
              ) : (
                <span className="text-gray-400">
                  {search ? `Pretraga: "${search}"` : 'Svi artikli'}
                </span>
              )}
            </div>

            {/* Controls */}
            <label className="flex items-center gap-1.5 text-[12px] text-gray-500 cursor-pointer select-none">
              <input type="checkbox" checked={filterStock} onChange={e => setFilterStock(e.target.checked)} className="accent-emerald-700 w-3.5 h-3.5" />
              Samo na stanju
            </label>

            <button
              className="md:hidden flex items-center gap-1 text-[12px] px-3 py-1.5 bg-white border border-gray-200 rounded text-gray-600"
              onClick={() => setMobileFilters(!mobileFilters)}
            >
              <SlidersHorizontal size={12} /> Kategorije
            </button>

            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setPage(1) }}
              className="h-8 text-[12px] bg-white border border-gray-200 rounded px-2 text-gray-600 outline-none cursor-pointer"
            >
              <option value="naziv">Naziv A-Z</option>
              <option value="naziv_desc">Naziv Z-A</option>
              <option value="cijena_asc">Cijena ↑</option>
              <option value="cijena_desc">Cijena ↓</option>
            </select>

            <div className="flex items-center gap-1">
              <input type="number" placeholder="Od" value={cijenaOd}
                onChange={e => { setCijenaOd(e.target.value); setPage(1) }}
                className="w-16 h-8 text-[12px] px-2 bg-white border border-gray-200 rounded outline-none" />
              <span className="text-gray-300 text-xs">–</span>
              <input type="number" placeholder="Do KM" value={cijenaDo}
                onChange={e => { setCijenaDo(e.target.value); setPage(1) }}
                className="w-20 h-8 text-[12px] px-2 bg-white border border-gray-200 rounded outline-none" />
            </div>

            <span className="text-[12px] text-gray-400 bg-white border border-gray-200 px-3 py-1.5 rounded whitespace-nowrap">
              {total.toLocaleString()} artikala
            </span>
          </div>

          {/* Mobile filters */}
          {mobileFilters && (
            <div className="md:hidden mb-4">
              <CategorySidebar grupe={grupe} activeId={activeGrupa} onSelect={onGrupaSelect} />
            </div>
          )}

          {/* Layout */}
          <div className="flex gap-5 items-start">
            <CategorySidebar grupe={grupe} activeId={activeGrupa} onSelect={onGrupaSelect} />

            {/* Table */}
            <div className="flex-1 min-w-0">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-2.5 pl-4 pr-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Naziv</th>
                      <th className="py-2.5 px-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Šifra</th>
                      <th className="py-2.5 px-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Kategorija</th>
                      <th className="py-2.5 px-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Stanje</th>
                      <th className="py-2.5 px-2 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Cijena</th>
                      <th className="py-2.5 pl-2 pr-4 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array(perPage).fill(0).map((_, i) => <SkeletonRow key={i} />)
                      : displayed.length === 0
                      ? (
                        <tr><td colSpan={6} className="py-16 text-center text-gray-400 text-[13px]">
                          <Package size={28} className="mx-auto mb-2 opacity-30" />
                          Nema artikala za odabrane kriterije
                          <br />
                          <button onClick={() => { onGrupaSelect(null); setFilterStock(false) }}
                            className="mt-2 text-emerald-700 underline text-[12px]">
                            Prikaži sve
                          </button>
                        </td></tr>
                      )
                      : displayed.map(a => (
                        <ProductRow key={a.id} artikal={a} stanje={stanje[a.id]} />
                      ))
                    }
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-6 flex-wrap">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="px-3 py-1.5 text-[12px] bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                    ← Prethodna
                  </button>
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let p: number
                    if (totalPages <= 7) p = i + 1
                    else if (page <= 4) p = i + 1
                    else if (page >= totalPages - 3) p = totalPages - 6 + i
                    else p = page - 3 + i
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 text-[12px] rounded border transition-colors ${
                          p === page
                            ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}>
                        {p}
                      </button>
                    )
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                    className="px-3 py-1.5 text-[12px] bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                    Sljedeća →
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="border-t border-gray-200 bg-white py-6 px-6">
          <div className="max-w-[1280px] mx-auto flex justify-between items-center flex-wrap gap-4 text-[12px] text-gray-400">
            <div>
              <span className="font-semibold text-gray-600">{siteConfig.name}</span>
              <span className="mx-2">·</span>
              B2B webshop · Powered by NIBIS ERP
            </div>
            <div className="flex gap-5">
              <span>Pon–Pet 08:00–16:00</span>
              {siteConfig.contactEmail && (
                <a href={`mailto:${siteConfig.contactEmail}`} className="text-emerald-700 hover:underline">
                  {siteConfig.contactEmail}
                </a>
              )}
            </div>
          </div>
        </footer>
      </div>
    </AuthGuard>
  )
}

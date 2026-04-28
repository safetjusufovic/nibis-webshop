'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import Header from '@/components/layout/Header'
import AuthGuard from '@/components/auth/AuthGuard'
import ProductCard from '@/components/shop/ProductCard'
import type { Artikal, ArtikalGrupa, StanjeSkladista, PaginatedResponse } from '@/types/nibis'
import { siteConfig } from '@/lib/config'

function CategorySidebar({
  grupe, activeId, onSelect
}: {
  grupe: ArtikalGrupa[]
  activeId: number | null
  onSelect: (id: number | null) => void
}) {
  const roots = grupe.filter(g => !g.parentId)
  return (
    <aside className="w-48 shrink-0 hidden md:block">
      <div className="card p-3 sticky top-20">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-2">Kategorije</p>
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${activeId === null ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Sve kategorije
        </button>
        {roots.map(root => {
          const children = grupe.filter(g => g.parentId === root.id)
          return (
            <div key={root.id}>
              <button
                onClick={() => onSelect(root.id)}
                className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${activeId === root.id ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {root.naziv}
              </button>
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => onSelect(child.id)}
                  className={`w-full text-left text-xs pl-5 pr-2 py-1 rounded-lg transition-colors ${activeId === child.id ? 'text-teal-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  ↳ {child.naziv}
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-7 bg-gray-100 rounded mt-3" />
      </div>
    </div>
  )
}

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
  }, [page, perPage, search, activeGrupa])

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
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pretraži artikle..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="input pl-9"
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input type="checkbox" checked={filterStock} onChange={e => setFilterStock(e.target.checked)} className="accent-teal-600" />
              <span className="hidden sm:inline">Samo na stanju</span>
            </label>
            <button className="md:hidden btn-secondary flex items-center gap-1 text-sm" onClick={() => setMobileFilters(!mobileFilters)}>
              <SlidersHorizontal size={14} /> Kategorije
            </button>
            <span className="ml-auto text-sm text-gray-400">{total} artikala</span>
          </div>

          {mobileFilters && (
            <div className="md:hidden card p-3 mb-4">
              <CategorySidebar grupe={grupe} activeId={activeGrupa} onSelect={onGrupaSelect} />
            </div>
          )}

          <div className="flex gap-6">
            <CategorySidebar grupe={grupe} activeId={activeGrupa} onSelect={onGrupaSelect} />
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {loading
                  ? Array(perPage).fill(0).map((_, i) => <SkeletonCard key={i} />)
                  : displayed.length === 0
                  ? <div className="col-span-full text-center py-16 text-gray-400 text-sm">Nema artikala za odabrane kriterije</div>
                  : displayed.map(a => (
                      <ProductCard key={a.id} artikal={a} stanje={stanje[a.id]} slika={(a as any).slika_url} />
                    ))
                }
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8 text-sm">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary disabled:opacity-40">← Preth.</button>
                  <span className="text-gray-500">Stranica {page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-secondary disabled:opacity-40">Sljed. →</button>
                </div>
              )}
            </div>
          </div>
        </main>
        <footer className="border-t border-gray-100 mt-16 py-6 text-center text-xs text-gray-400">
          {siteConfig.name} · Powered by NIBIS ERP
          {siteConfig.contactEmail && <> · <a href={`mailto:${siteConfig.contactEmail}`} className="hover:text-teal-600">{siteConfig.contactEmail}</a></>}
        </footer>
      </div>
    </AuthGuard>
  )
}

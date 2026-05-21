'use client'
import { usePathname } from 'next/navigation'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Upload, Package, Search, X, Link as LinkIcon, CheckCircle, AlertCircle, Grid, List } from 'lucide-react'

export default function AdminSlikePage() {
  const pathname = usePathname()
  const shopSlug = (() => {
    const segs = pathname.split('/').filter(Boolean)
    const idx = segs.indexOf('admin')
    const slug = idx > 0 ? segs[idx - 1] : ''
    console.log('[SLIKE] pathname:', pathname, 'segs:', segs, 'idx:', idx, 'shopSlug:', slug)
    return slug
  })()


  const [artikli, setArtikli] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState<number | null>(null)
  const [urlInput, setUrlInput] = useState<Record<number, string>>({})
  const [showUrl, setShowUrl] = useState<Record<number, boolean>>({})
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<'sve' | 'sa_slikom' | 'bez_slike'>('sve')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchModal, setSearchModal] = useState<{ artikalId: number; naziv: string } | null>(null)
  const [googleResults, setGoogleResults] = useState<string[]>([])
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleQuery, setGoogleQuery] = useState('')
  const PER = 24

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function searchGoogle(query: string) {
    if (!query.trim()) return
    setGoogleLoading(true)
    setGoogleResults([])
    try {
      // Koristimo Google Custom Search API ili fallback na scraping
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
      const cx = process.env.NEXT_PUBLIC_GOOGLE_CX
      if (apiKey && cx) {
        const res = await fetch(
          'https://www.googleapis.com/customsearch/v1?key=' + apiKey +
          '&cx=' + cx +
          '&q=' + encodeURIComponent(query) +
          '&searchType=image&num=10&imgSize=medium&imgType=photo&safe=active'
        )
        const data = await res.json()
        const urls = (data.items || []).map((item: any) => item.link).filter(Boolean)
        setGoogleResults(urls)
      } else {
        // Fallback: Bing Image Search scraping kroz API rute
        const res = await fetch('/api/image-search?q=' + encodeURIComponent(query))
        if (res.ok) {
          const data = await res.json()
          setGoogleResults(data.images || [])
        } else {
          // Drugi fallback: predloži DuckDuckGo URL-ove
          const duckUrl = 'https://duckduckgo.com/?q=' + encodeURIComponent(query + ' product') + '&iax=images&ia=images'
          setGoogleResults(['__manual__' + duckUrl])
        }
      }
    } catch {
      setGoogleResults([])
    }
    setGoogleLoading(false)
  }

  async function load(slug?: string) {
    const activeSlug = slug !== undefined ? slug : shopSlug
    const sp = new URLSearchParams({ page: String(page), perPage: String(PER) })
    if (search) sp.set('search', search)
    if (activeSlug) sp.set('shop', activeSlug)
    const res = await fetch('/api/artikli?' + sp.toString())
    const d = await res.json()
    // filter sa/bez slike client-side
    let items = d.items ?? []
    if (filter === 'sa_slikom') items = items.filter((a: any) => a.slika_url)
    if (filter === 'bez_slike') items = items.filter((a: any) => !a.slika_url)
    setArtikli(items)
    setTotal(d.total ?? 0)
  }

  useEffect(() => {
    setArtikli([])
    setTotal(0)
    load(shopSlug)
  }, [page, search, filter, shopSlug])

  async function uploadFile(artikalId: number, file: File) {
    if (file.size > 8 * 1024 * 1024) { showToast('Slika je prevelika (max 8MB)', false); return }
    setUploading(artikalId)
    try {
      // Pokušaj Supabase Storage
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = 'artikli/' + artikalId + '_' + Date.now() + '.' + ext
      const { error: uploadErr } = await supabase.storage.from('slike').upload(path, file, {
        upsert: true, contentType: file.type
      })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('slike').getPublicUrl(path)
        await saveUrl(artikalId, urlData.publicUrl)
        showToast('Slika uploadovana!')
      } else {
        // Fallback: spremi kao base64 direktno u bazu
        const reader = new FileReader()
        reader.onload = async ev => {
          const dataUrl = ev.target?.result as string
          await saveUrl(artikalId, dataUrl)
          showToast('Slika sačuvana!')
        }
        reader.readAsDataURL(file)
      }
    } catch {
      showToast('Greška pri uploadu', false)
    }
    setUploading(null)
  }

  async function saveUrl(artikalId: number, url: string) {
    await supabase.from('artikli').update({ slika_url: url }).eq('id', artikalId)
    setArtikli(prev => prev.map(a => a.id === artikalId ? { ...a, slika_url: url } : a))
  }

  async function removeSlika(artikalId: number) {
    await supabase.from('artikli').update({ slika_url: null }).eq('id', artikalId)
    setArtikli(prev => prev.map(a => a.id === artikalId ? { ...a, slika_url: null } : a))
    showToast('Slika uklonjena')
  }

  async function saveUrlInput(artikalId: number) {
    const url = urlInput[artikalId]?.trim()
    if (!url) return
    await saveUrl(artikalId, url)
    setShowUrl(prev => ({ ...prev, [artikalId]: false }))
    setUrlInput(prev => ({ ...prev, [artikalId]: '' }))
    showToast('URL sačuvan!')
  }

  const totalPages = Math.ceil(total / PER)
  const saSlikom = artikli.filter(a => a.slika_url).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 16px', borderRadius: '10px',
          background: toast.ok ? '#F0FDF4' : '#FEF2F2',
          border: '1px solid ' + (toast.ok ? '#BBF7D0' : '#FECACA'),
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          fontSize: '13px', fontWeight: 500,
          color: toast.ok ? '#065F46' : '#991B1B',
          animation: 'slideIn 0.2s ease',
        }}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>Slike artikala</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>
            {saSlikom} od {artikli.length} prikazanih ima sliku
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setViewMode('grid')} style={{ padding: '7px', border: '1px solid ' + (viewMode === 'grid' ? 'var(--brand)' : '#E5E7EB'), borderRadius: '8px', background: viewMode === 'grid' ? 'var(--brand-pale)' : 'white', cursor: 'pointer', color: viewMode === 'grid' ? 'var(--brand)' : '#6B7280', display: 'flex' }}>
            <Grid size={15} />
          </button>
          <button onClick={() => setViewMode('list')} style={{ padding: '7px', border: '1px solid ' + (viewMode === 'list' ? 'var(--brand)' : '#E5E7EB'), borderRadius: '8px', background: viewMode === 'list' ? 'var(--brand-pale)' : 'white', cursor: 'pointer', color: viewMode === 'list' ? 'var(--brand)' : '#6B7280', display: 'flex' }}>
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '360px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
          <input type="text" placeholder="Pretraži artikle po nazivu ili šifri..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', height: '38px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            onFocus={e => { e.target.style.borderColor = 'var(--brand)' }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {([['sve', 'Svi'], ['bez_slike', 'Bez slike'], ['sa_slikom', 'Sa slikom']] as const).map(([v, l]) => (
            <button key={v} onClick={() => { setFilter(v); setPage(1) }}
              style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, border: '1px solid ' + (filter === v ? 'var(--brand)' : '#E5E7EB'), borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', background: filter === v ? 'var(--brand-pale)' : 'white', color: filter === v ? 'var(--brand)' : '#6B7280', transition: 'all 0.15s' }}>
              {l}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: 'auto' }}>{total.toLocaleString()} artikala</span>
      </div>

      {/* Grid prikaz */}
      {viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {artikli.map(a => (
            <div key={a.id} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
            >
              {/* Slika */}
              <div style={{ position: 'relative', height: '120px', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {a.slika_url ? (
                  <>
                    <img src={a.slika_url} alt={a.naziv} style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} />
                    <button onClick={() => removeSlika(a.id)} title="Ukloni sliku"
                      style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '50%', background: '#EF4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                      className="delete-btn"
                    >
                      <X size={11} style={{ color: 'white' }} />
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#D1D5DB' }}>
                    <Package size={28} />
                    <span style={{ fontSize: '10px', color: '#D1D5DB' }}>Nema slike</span>
                  </div>
                )}
                {uploading === a.id && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--brand)', fontWeight: 600 }}>
                    <span style={{ width: '18px', height: '18px', border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block', marginRight: '6px' }} />
                    Upload...
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '10px 10px 8px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.naziv}>{a.naziv}</p>
                <p style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'monospace', margin: '0 0 8px' }}>{a.sifra}</p>

                {/* URL input toggle */}
                {showUrl[a.id] ? (
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    <input type="text" value={urlInput[a.id] || ''} placeholder="https://..."
                      onChange={e => setUrlInput(prev => ({ ...prev, [a.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') saveUrlInput(a.id) }}
                      style={{ flex: 1, padding: '4px 6px', fontSize: '10px', border: '1px solid #E5E7EB', borderRadius: '5px', outline: 'none', minWidth: 0 }}
                      autoFocus
                    />
                    <button onClick={() => saveUrlInput(a.id)} style={{ padding: '4px 6px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '10px', flexShrink: 0 }}>✓</button>
                    <button onClick={() => setShowUrl(prev => ({ ...prev, [a.id]: false }))} style={{ padding: '4px 5px', background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '10px', flexShrink: 0 }}>✕</button>
                  </div>
                ) : null}

                <div style={{ display: 'flex', gap: '4px' }}>
                  {/* Upload s računara */}
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '5px', fontSize: '10px', fontWeight: 600, background: 'var(--brand-pale)', color: 'var(--brand)', border: '1px solid', borderColor: 'var(--brand-pale)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--brand-pale)'}
                  >
                    <Upload size={10} />
                    {a.slika_url ? 'Zamijeni' : 'Upload'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading === a.id}
                      onChange={e => { if (e.target.files?.[0]) uploadFile(a.id, e.target.files[0]); e.target.value = '' }}
                    />
                  </label>
                  {/* URL unos */}
                  <button onClick={() => setShowUrl(prev => ({ ...prev, [a.id]: !prev[a.id] }))}
                    title="Unesi URL slike"
                    style={{ padding: '5px 7px', background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <LinkIcon size={10} />
                  </button>
                  {/* Google pretraga */}
                  <button onClick={() => { setSearchModal({ artikalId: a.id, naziv: a.naziv }); setGoogleQuery(a.naziv); setGoogleResults([]); }}
                    title="Pretraži sliku na Google"
                    style={{ padding: '5px 7px', background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px' }}>🔍</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List prikaz */}
      {viewMode === 'list' && (
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Artikal</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>Slika</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: '220px' }}>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {artikli.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < artikli.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{a.naziv}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>{a.sifra}</div>
                  </td>
                  <td style={{ padding: '8px 14px' }}>
                    <div style={{ width: '48px', height: '48px', background: '#F9FAFB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                      {a.slika_url
                        ? <img src={a.slika_url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        : <Package size={18} style={{ color: '#D1D5DB' }} />
                      }
                    </div>
                  </td>
                  <td style={{ padding: '8px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {showUrl[a.id] && (
                        <input type="text" value={urlInput[a.id] || ''} placeholder="https://..."
                          onChange={e => setUrlInput(prev => ({ ...prev, [a.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') saveUrlInput(a.id) }}
                          style={{ width: '160px', padding: '5px 8px', fontSize: '12px', border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none' }}
                          autoFocus
                        />
                      )}
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--brand-pale)', color: 'var(--brand)', border: '1px solid var(--brand-pale)', borderRadius: '6px', cursor: 'pointer' }}>
                        <Upload size={11} />
                        {uploading === a.id ? 'Upload...' : a.slika_url ? 'Zamijeni' : 'Upload'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading === a.id}
                          onChange={e => { if (e.target.files?.[0]) uploadFile(a.id, e.target.files[0]); e.target.value = '' }}
                        />
                      </label>
                      <button onClick={() => setShowUrl(prev => ({ ...prev, [a.id]: !prev[a.id] }))} title="Unesi URL"
                        style={{ padding: '5px 8px', background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                        <LinkIcon size={11} /> URL
                      </button>
                      {a.slika_url && (
                        <button onClick={() => removeSlika(a.id)} title="Ukloni"
                          style={{ padding: '5px 7px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginacija */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            style={{ padding: '7px 14px', fontSize: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: '#374151', opacity: page <= 1 ? 0.4 : 1 }}>
            ← Prethodna
          </button>
          <span style={{ fontSize: '12px', color: '#6B7280', padding: '0 8px' }}>
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            style={{ padding: '7px 14px', fontSize: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: '#374151', opacity: page >= totalPages ? 0.4 : 1 }}>
            Sljedeća →
          </button>
        </div>
      )}

      {/* Google Image Search Modal */}
      {searchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setSearchModal(null) }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '720px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            {/* Modal header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <span style={{ fontSize: '16px' }}>🔍</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Pretraga slike</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{searchModal.naziv}</div>
              </div>
              <button onClick={() => setSearchModal(null)} style={{ padding: '6px', background: '#F3F4F6', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}>
                <X size={14} style={{ color: '#6B7280' }} />
              </button>
            </div>

            {/* Search input */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={googleQuery}
                  onChange={e => setGoogleQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') searchGoogle(googleQuery) }}
                  placeholder="Naziv artikla za pretragu..."
                  style={{ flex: 1, padding: '9px 14px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
                  autoFocus
                  onFocus={e => { e.target.style.borderColor = 'var(--brand)' }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB' }}
                />
                <button onClick={() => searchGoogle(googleQuery)} disabled={googleLoading}
                  style={{ padding: '9px 18px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {googleLoading ? (
                    <><span style={{ width: '14px', height: '14px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Tražim...</>
                  ) : '🔍 Traži'}
                </button>
              </div>
              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '6px 0 0' }}>
                Klikni na sliku da je odabereš za artikal
              </p>
            </div>

            {/* Results */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
              {googleLoading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} style={{ aspectRatio: '1', background: '#F3F4F6', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
                  ))}
                </div>
              )}

              {!googleLoading && googleResults.length === 0 && googleQuery && (
                <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                  <div style={{ fontSize: '14px' }}>Klikni Traži da pretražiš slike</div>
                </div>
              )}

              {!googleLoading && googleResults.some(r => r.startsWith('__manual__')) && (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <div style={{ fontSize: '14px', color: '#374151', marginBottom: '12px', fontWeight: 500 }}>Google API nije konfigurisan</div>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px', lineHeight: 1.6 }}>
                    Otvori Google pretragu, pronadi sliku, desni klik → Kopiraj adresu slike, pa je uneси u URL polje.
                  </p>
                  <a href={googleResults[0].replace('__manual__', '')} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#4285F4', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                    🌐 Otvori Google pretragu
                  </a>
                  <div style={{ marginTop: '20px' }}>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Ili unesi URL direktno:</p>
                    <div style={{ display: 'flex', gap: '8px', maxWidth: '400px', margin: '0 auto' }}>
                      <input type="text" value={urlInput[searchModal.artikalId] || ''} placeholder="https://..."
                        onChange={e => setUrlInput(prev => ({ ...prev, [searchModal.artikalId]: e.target.value }))}
                        style={{ flex: 1, padding: '8px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
                        onKeyDown={async e => {
                          if (e.key === 'Enter') {
                            await saveUrlInput(searchModal.artikalId)
                            setSearchModal(null)
                          }
                        }}
                      />
                      <button onClick={async () => { await saveUrlInput(searchModal.artikalId); setSearchModal(null) }}
                        style={{ padding: '8px 16px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>
                        Sačuvaj
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!googleLoading && googleResults.filter(r => !r.startsWith('__manual__')).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {googleResults.filter(r => !r.startsWith('__manual__')).map((url, i) => (
                    <button key={i} onClick={async () => {
                      await saveUrl(searchModal.artikalId, url)
                      showToast('Slika sačuvana!')
                      setSearchModal(null)
                    }}
                      style={{ padding: 0, border: '2px solid #E5E7EB', borderRadius: '10px', cursor: 'pointer', overflow: 'hidden', background: '#F9FAFB', aspectRatio: '1', transition: 'all 0.15s', position: 'relative' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand)'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
                    >
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                        onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,110,86,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(15,110,86,0.15)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(15,110,86,0)'}
                      >
                        <span style={{ background: 'var(--brand)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', opacity: 0, transition: 'opacity 0.15s' }}
                          className="select-label"
                        >Odaberi</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(10px) } to { opacity: 1; transform: none } }
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
        .delete-btn { opacity: 0 !important; }
        div:hover > .delete-btn { opacity: 1 !important; }
        button:hover .select-label { opacity: 1 !important; }
      `}</style>
    </div>
  )
}

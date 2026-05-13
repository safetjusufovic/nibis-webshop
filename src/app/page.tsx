'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SlidersHorizontal, ChevronRight, ChevronDown, Package, ShoppingCart, Plus, LayoutGrid, LayoutList } from 'lucide-react'
import Header from '@/components/layout/Header'
import AkcijeSlider from '@/components/shop/AkcijeSlider'
import dynamic from 'next/dynamic'

const WurthTemplate = dynamic(() => import('@/app/templates/wurth-industrial'), { ssr: false })
const SaasTemplate = dynamic(() => import('@/app/templates/saas-modern'), { ssr: false })
const WarmTemplate = dynamic(() => import('@/app/templates/warm-editorial'), { ssr: false })
const DarkTemplate = dynamic(() => import('@/app/templates/obsidian-dark'), { ssr: false })
const MegaTemplate = dynamic(() => import('@/app/templates/mega-catalog'), { ssr: false })
const LuxuryTemplate = dynamic(() => import('@/app/templates/luxury-brand'), { ssr: false })
const McMasterTemplate = dynamic(() => import('@/app/templates/mcmaster-search'), { ssr: false })
const GraingerTemplate = dynamic(() => import('@/app/templates/grainger-pro'), { ssr: false })
const VisualTemplate = dynamic(() => import('@/app/templates/visual-catalog'), { ssr: false })
const NeonTemplate = dynamic(() => import('@/app/templates/neon-tech'), { ssr: false })
import HeroBanner from '@/components/shop/HeroBanner'
import HeroSlider from '@/components/shop/HeroSlider'
import FooterComponent from '@/components/layout/Footer'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useFavoriti } from '@/hooks/useFavoriti'
import type { Artikal, ArtikalGrupa, StanjeSkladista, PaginatedResponse } from '@/types/nibis'
import { formatCijena, siteConfig } from '@/lib/config'
import ProductCard from '@/components/shop/ProductCard'
import Link from 'next/link'

// ─── Collapsible Category Sidebar ─────────────────────────────────────────────
function CategorySidebar({ grupe, activeId, onSelect, sirina = 240, sidebarConfig }: {
  grupe: ArtikalGrupa[]
  activeId: number | null
  onSelect: (id: number | null) => void
  sirina?: number
  sidebarConfig?: { bojaPozadine: string; visinaKategorije: number }
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const roots = grupe.filter(g => !g.parentId)
  const visinaKat = sidebarConfig?.visinaKategorije ?? 52
  const ikonaSize = Math.round(Math.min(visinaKat * 0.84, sirina * 0.38))
  const ikonaImgSize = Math.round(ikonaSize * 0.60)
  const ikonaRadius = Math.round(ikonaSize * 0.22)
  const fontSize = sirina > 300 ? '13px' : sirina > 220 ? '12px' : '11px'
  const hasBgSlika = false
  const bgStyle = { background: sidebarConfig?.bojaPozadine || '#F8FAFA' }

  function toggleOpen(id: number) {
    setOpen(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <aside style={{ width: sirina + 'px', flexShrink: 0 }} className="hidden md:block">
      <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden', position: 'sticky', top: '76px', ...bgStyle }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.08)', background: hasBgSlika ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: hasBgSlika ? 'white' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Kategorije</span>
        </div>
        <div style={{ padding: '6px' }}>
          <button
            onClick={() => onSelect(null)}
            className="w-full text-left px-3 py-2 text-[12px] rounded-md mb-1 transition-all duration-150 flex items-center gap-2"
            style={{
              background: activeId === null ? 'var(--brand)' : 'transparent',
              color: activeId === null ? 'white' : '#4B5563',
              fontWeight: activeId === null ? 600 : 400,
            }}
          >
            <span style={{
              width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
              background: activeId === null ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            </span>
            Sve kategorije
          </button>

          {roots.map(root => {
            const children = grupe.filter(g => g.parentId === root.id)
            const isActive = activeId === root.id || children.some(c => c.id === activeId)
            const isOpen = open[root.id] ?? isActive
            const boja = root.boja || '#6B7280'
            const isSelected = activeId === root.id

            return (
              <div key={root.id} style={{ marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button
                    onClick={() => { onSelect(root.id); if (children.length > 0) setOpen(prev => ({ ...prev, [root.id]: true })) }}
                    style={{
                      flex: 1,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      height: visinaKat + 'px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                      background: isSelected
                        ? boja
                        : hasBgSlika
                        ? 'rgba(255,255,255,0.12)'
                        : isActive
                        ? boja + '18'
                        : 'transparent',
                      color: isSelected ? 'white' : hasBgSlika ? 'white' : '#374151',
                      boxShadow: isSelected ? `0 2px 8px ${boja}40` : 'none',
                      backdropFilter: hasBgSlika ? 'blur(4px)' : 'none',
                    }}
                  >
                    <span style={{
                      width: ikonaSize + 'px',
                      height: ikonaSize + 'px',
                      borderRadius: ikonaRadius + 'px',
                      flexShrink: 0,
                      background: isSelected ? 'rgba(255,255,255,0.22)' : boja,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxShadow: isSelected ? 'none' : '0 2px 6px ' + boja + '50',
                    }}>
                      {root.ikonaUrl ? (
                        <img
                          src={root.ikonaUrl}
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <svg width={ikonaImgSize} height={ikonaImgSize} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                        </svg>
                      )}
                    </span>
                    <span style={{ fontSize: fontSize, fontWeight: isSelected || isActive ? 600 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {root.naziv}
                    </span>
                  </button>
                  {children.length > 0 && (
                    <button
                      onClick={() => toggleOpen(root.id)}
                      style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', borderRadius: '6px' }}
                    >
                      {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  )}
                </div>

                {isOpen && children.length > 0 && (
                  <div style={{ marginLeft: '12px', marginTop: '2px', borderLeft: `2px solid ${boja}40`, paddingLeft: '8px' }}>
                    {children.map(child => (
                      <button
                        key={child.id}
                        onClick={() => onSelect(child.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          display: 'block',
                          padding: '5px 8px',
                          fontSize: '11px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.1s',
                          color: activeId === child.id ? boja : '#6B7280',
                          background: activeId === child.id ? boja + '12' : 'transparent',
                          fontWeight: activeId === child.id ? 600 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {child.naziv}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

// ─── Product Table Row ─────────────────────────────────────────────────────────
function ProductRow({ artikal, stanje, dugmeTekst = 'Dodaj', onLoginRequired }: { artikal: Artikal; stanje: StanjeSkladista | null | undefined; dugmeTekst?: string; onLoginRequired?: () => void }) {
  const { cart, add } = useCart()
  const { rabat, user } = useAuth()
  const { favoriti, toggle: toggleFavorit } = useFavoriti()
  const [qty, setQty] = useState(1)
  const inCart = cart[artikal.id]?.qty ?? 0

  const cijenaBase = stanje ? stanje[siteConfig.tipCijene] : artikal.planskaMaloprodajnaCijena ?? 0
  const akcijaPopust = (artikal as any).akcija_popust ?? 0
  const akcijaAktivna = akcijaPopust > 0 && (!(artikal as any).akcija_do || new Date((artikal as any).akcija_do) > new Date())
  const popust = akcijaAktivna ? akcijaPopust : rabat
  const cijena = popust > 0 ? Math.round(cijenaBase * (1 - popust / 100) * 100) / 100 : cijenaBase

  const maxQty = stanje?.raspolozivaKolicina ?? 0
  const canAdd = maxQty > 0
  const isFav = favoriti.has(artikal.id)

  function handleAdd() {
    if (!canAdd) return
    if (!user) { onLoginRequired?.(); return }
    const toAdd = Math.min(qty, maxQty - inCart)
    if (toAdd <= 0) return
    for (let i = 0; i < toAdd; i++) add(artikal, cijenaBase, stanje ?? null)
    setQty(1)
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-slate-50/60 transition-all duration-150 group">
      <td className="py-2.5 pl-4 pr-2">
        <Link href={`${shopSlug ? `/${shopSlug}` : ``}/proizvod/${artikal.id}`} className="text-[13px] font-medium text-gray-800 transition-colors leading-snug block" style={{ color: "var(--text)" }} onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--brand)"} onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"}>
          {artikal.naziv}
        </Link>
        {artikal.naziv2 && <span className="text-[11px] text-gray-400">{artikal.naziv2}</span>}
      </td>
      <td className="py-2.5 px-2 whitespace-nowrap">
        <span className="text-[11px] font-mono text-gray-400">{artikal.sifra}</span>
      </td>
      <td className="py-2.5 px-2 hidden lg:table-cell">
        <span className="text-[11px] text-gray-400">{artikal.grupa?.naziv ?? '—'}</span>
      </td>
      <td className="py-2.5 px-2 whitespace-nowrap">
        {stanje === undefined ? (
          <span className="text-[11px] text-gray-300">...</span>
        ) : !stanje || stanje.raspolozivaKolicina <= 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />Nema
          </span>
        ) : stanje.raspolozivaKolicina <= 3 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />{stanje.raspolozivaKolicina} kom
          </span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 500, color: "var(--brand)", background: "var(--brand-pale)", padding: "2px 8px", borderRadius: "100px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--brand)", display: "inline-block" }} />Na stanju
          </span>
        )}
      </td>
      <td className="py-2.5 px-2 whitespace-nowrap text-right">
        <div className="text-[14px] font-bold text-gray-900">{formatCijena(cijena)}</div>
        {popust > 0 && <div className="text-[11px] text-gray-400 line-through">{formatCijena(cijenaBase)}</div>}
        {inCart > 0 && <div className="text-[10px] font-medium">{inCart} u korpi</div>}
      </td>
      <td className="py-2 pl-2 pr-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => toggleFavorit(artikal.id)}
            className={`p-1.5 rounded-lg transition-all duration-200 ${isFav ? 'text-red-500 bg-red-50 ring-1 ring-red-200' : 'text-gray-300 hover:text-gray-400 hover:bg-gray-100 opacity-0 group-hover:opacity-100'}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <input
            type="number"
            min={1}
            max={maxQty}
            value={qty}
            onChange={e => setQty(Math.max(1, Math.min(maxQty, parseInt(e.target.value) || 1)))}
            disabled={!canAdd}
            className="w-14 h-7 text-center text-[12px] font-medium bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--brand-pale)] focus:border-[var(--brand)] transition-all duration-200 disabled:opacity-40 shadow-sm"
          />
          <button
            onClick={handleAdd}
            disabled={!canAdd || inCart + qty > maxQty}
            style={{
            background: canAdd && inCart + qty <= maxQty ? 'var(--brand)' : '#F3F4F6',
            color: canAdd && inCart + qty <= maxQty ? 'white' : '#D1D5DB',
            cursor: canAdd && inCart + qty <= maxQty ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', fontWeight: 600, padding: '6px 12px',
            borderRadius: '8px', border: 'none', fontFamily: 'inherit',
            transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
          >
            <ShoppingCart size={11} />
            {inCart > 0 ? dugmeTekst + ' još' : dugmeTekst}
          </button>
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

// ─── Features sekcija ────────────────────────────────────────────────────────
function FeaturesSekcija() {
  const [naslov, setNaslov] = useState('Zašto mi?')
  const [items, setItems] = useState([
    { ikona: '🚀', naslov: 'Brza isporuka', opis: 'Naredni radni dan' },
    { ikona: '💎', naslov: 'Kvalitet', opis: 'Provjereni dobavljači' },
    { ikona: '🔒', naslov: 'Sigurnost', opis: 'Zaštićene transakcije' },
  ])

  useEffect(() => {
    fetch('/api/postavke?kljuci=sekcija_features_naslov,sekcija_features_items')
      .then(r => r.json()).then(d => {
        if (d.sekcija_features_naslov) setNaslov(d.sekcija_features_naslov)
        if (d.sekcija_features_items) {
          try { setItems(JSON.parse(d.sekcija_features_items)) } catch {}
        }
      }).catch(() => {})
  }, [])

  return (
    <div style={{ background: 'white', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '48px 24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {naslov && <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: '32px' }}>{naslov}</h2>}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: '24px' }}>
          {items.map((item, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>{item.ikona}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>{item.naslov}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{item.opis}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Promo Banner sekcija ──────────────────────────────────────────────────────
function PromoBanner() {
  const [cfg, setCfg] = useState({ tekst: '', podnaslov: '', dugme: '', boja: 'var(--brand)' })

  useEffect(() => {
    fetch('/api/postavke?kljuci=sekcija_banner_tekst,sekcija_banner_podnaslov,sekcija_banner_dugme,sekcija_banner_boja')
      .then(r => r.json()).then(d => {
        setCfg({ tekst: d.sekcija_banner_tekst || '', podnaslov: d.sekcija_banner_podnaslov || '', dugme: d.sekcija_banner_dugme || '', boja: d.sekcija_banner_boja || 'var(--brand)' })
      }).catch(() => {})
  }, [])

  if (!cfg.tekst) return null

  return (
    <div style={{ background: cfg.boja, padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>{cfg.tekst}</h2>
        {cfg.podnaslov && <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', marginBottom: '20px' }}>{cfg.podnaslov}</p>}
        {cfg.dugme && (
          <button style={{ background: 'white', color: cfg.boja, border: 'none', padding: '12px 28px', borderRadius: 'var(--radius)', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {cfg.dugme}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Newsletter sekcija ────────────────────────────────────────────────────────
function NewsletterSekcija() {
  const [cfg, setCfg] = useState({ naslov: '', podnaslov: '' })
  const [email, setEmail] = useState('')

  useEffect(() => {
    fetch('/api/postavke?kljuci=sekcija_newsletter_naslov,sekcija_newsletter_podnaslov')
      .then(r => r.json()).then(d => {
        setCfg({ naslov: d.sekcija_newsletter_naslov || '', podnaslov: d.sekcija_newsletter_podnaslov || '' })
      }).catch(() => {})
  }, [])

  if (!cfg.naslov) return null

  return (
    <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>{cfg.naslov}</h2>
        {cfg.podnaslov && <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>{cfg.podnaslov}</p>}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vas@email.ba"
            style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
          <button style={{ padding: '10px 20px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            Prijavi se
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Block renderer (isti renderBlock kao u page-builder) ──────────────────────
function renderBlockHTML(block: any, device: string = 'desktop'): string {
  const p = block.props || {}
  const isMobile = device === 'mobile'
  const isTablet = device === 'tablet'
  switch (block.type) {
    case 'hero': {
      const h = parseInt(p.visina) || 400
      const bg = p.bgSlika
        ? `linear-gradient(rgba(0,0,0,${p.overlay||0.3}),rgba(0,0,0,${p.overlay||0.3})),url(${p.bgSlika}) center/cover no-repeat`
        : (p.bgBoja || 'var(--brand)')
      const align = p.tekstPozicija === 'left' ? 'flex-start' : p.tekstPozicija === 'right' ? 'flex-end' : 'center'
      return `<section style="background:${bg};min-height:${h}px;display:flex;flex-direction:column;justify-content:center;align-items:${align};padding:48px 40px;color:${p.tekstBoja||'#fff'};text-align:${p.tekstPozicija||'center'}">
        <h1 style="font-size:${parseInt(p.fontSize)||42}px;font-weight:800;margin:0 0 12px;line-height:1.15;max-width:700px">${p.naslov||''}</h1>
        ${p.podnaslov ? `<p style="font-size:${parseInt(p.podnaslovSize)||18}px;opacity:0.85;margin:0 0 24px;max-width:560px">${p.podnaslov}</p>` : ''}
        ${p.dugmeTekst ? `<a href="${p.dugmeUrl||'/'}" style="display:inline-block;background:rgba(255,255,255,0.95);color:${p.bgBoja||'var(--brand)'};padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:15px">${p.dugmeTekst} →</a>` : ''}
      </section>`
    }
    case 'features': {
      const cols = isMobile ? 1 : Math.min(parseInt(p.kolone)||3, isTablet ? 2 : 3)
      const items = [1,2,3].slice(0,parseInt(p.kolone)||3).map(i => `
        <div style="text-align:center;padding:28px 16px;background:${p.kartBoja||'#fff'};border-radius:${p.radius||14}px;box-shadow:${p.shadow!=='false'?'0 2px 12px rgba(0,0,0,0.06)':'none'}">
          <div style="font-size:40px;margin-bottom:12px">${p[`item${i}Ikona`]||'⭐'}</div>
          <h3 style="font-size:16px;font-weight:700;margin:0 0 8px;color:#0d1f1a">${p[`item${i}Naslov`]||''}</h3>
          <p style="font-size:14px;color:#6b8279;margin:0">${p[`item${i}Opis`]||''}</p>
        </div>`).join('')
      return `<section style="padding:${p.paddingV||64}px ${isMobile?20:parseInt(p.paddingH)||40}px;background:${p.bgBoja||'#f8fafa'}">
        ${p.naslov ? `<h2 style="text-align:center;font-size:28px;font-weight:700;margin:0 0 32px;color:#0d1f1a">${p.naslov}</h2>` : ''}
        <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:20px;max-width:900px;margin:0 auto">${items}</div>
      </section>`
    }
    case 'promo':
      return `<section style="background:${p.bgBoja||'var(--brand)'};padding:${p.paddingV||48}px 40px;text-align:center;color:${p.tekstBoja||'#fff'}">
        <h2 style="font-size:28px;font-weight:800;margin:0 0 10px">${p.naslov||''}</h2>
        ${p.podnaslov ? `<p style="font-size:16px;opacity:0.85;margin:0 0 22px">${p.podnaslov}</p>` : ''}
        ${p.dugmeTekst ? `<a href="${p.dugmeUrl||'#'}" style="display:inline-block;background:${p.dugmeBgBoja||'#fff'};color:${p.dugmeTekstBoja||'var(--brand)'};padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none">${p.dugmeTekst}</a>` : ''}
      </section>`
    case 'newsletter':
      return `<section style="padding:${p.paddingV||64}px 40px;background:${p.bgBoja||'#fff'};text-align:center">
        <h2 style="font-size:24px;font-weight:700;margin:0 0 8px;color:#0d1f1a">${p.naslov||''}</h2>
        ${p.podnaslov ? `<p style="font-size:14px;color:#6b8279;margin:0 0 24px">${p.podnaslov}</p>` : ''}
        <div style="display:flex;gap:8px;max-width:400px;margin:0 auto">
          <input type="email" placeholder="${p.placeholder||'vas@email.ba'}" style="flex:1;padding:10px 14px;border:1px solid #e8edeb;border-radius:8px;font-size:14px"/>
          <button style="padding:10px 20px;background:${p.dugmeBoja||'var(--brand)'};color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap">${p.dugmeTekst||'Prijavi se'}</button>
        </div>
      </section>`
    case 'tekst_slika': {
      const imgEl = p.slikaUrl
        ? `<img src="${p.slikaUrl}" alt="${p.slikaAlt||''}" style="width:100%;height:300px;object-fit:cover;border-radius:16px"/>`
        : `<div style="background:#f0fdf4;border-radius:16px;height:300px;display:flex;align-items:center;justify-content:center;font-size:64px">${p.slikaEmoji||'🏭'}</div>`
      const textEl = `<div><h2 style="font-size:${parseInt(p.naslovSize)||32}px;font-weight:800;color:#0d1f1a;margin:0 0 16px;line-height:1.2">${p.naslov||''}</h2><p style="font-size:${parseInt(p.tekstSize)||16}px;color:${p.tekstBoja||'#6b8279'};line-height:1.7;margin:0 0 24px">${p.tekst||''}</p>${p.dugmeTekst?`<a href="${p.dugmeUrl||'#'}" style="display:inline-block;background:var(--brand);color:white;padding:12px 24px;border-radius:8px;font-weight:700;text-decoration:none">${p.dugmeTekst}</a>`:''}</div>`
      const reversed = p.slikaPozicija === 'lijevo'
      return `<section style="padding:${p.paddingV||64}px 40px;background:${p.bgBoja||'#fff'}">
        <div style="display:grid;grid-template-columns:${isMobile?'1fr':'1fr 1fr'};gap:48px;align-items:center;max-width:1200px;margin:0 auto">
          ${reversed ? imgEl + textEl : textEl + imgEl}
        </div>
      </section>`
    }
    case 'statistike': {
      const stats = [[p.stat1Broj,p.stat1Label],[p.stat2Broj,p.stat2Label],[p.stat3Broj,p.stat3Label],[p.stat4Broj,p.stat4Label]]
      return `<section style="padding:${p.paddingV||48}px 40px;background:${p.bgBoja||'var(--brand)'};color:${p.tekstBoja||'#fff'}">
        <div style="display:grid;grid-template-columns:repeat(${isMobile?2:4},1fr);gap:24px;max-width:900px;margin:0 auto;text-align:center">
          ${stats.map(([n,l]) => `<div><div style="font-size:${parseInt(p.brojSize)||40}px;font-weight:800;margin-bottom:6px">${n||''}</div><div style="font-size:${parseInt(p.labelSize)||14}px;opacity:0.8">${l||''}</div></div>`).join('')}
        </div>
      </section>`
    }
    case 'tekst':
      return `<div style="padding:${p.paddingV||16}px ${isMobile?20:parseInt(p.paddingH)||40}px"><p style="font-size:${parseInt(p.fontSize)||16}px;font-weight:${p.fontWeight||400};color:${p.boja||'#111827'};text-align:${p.align||'left'};line-height:${p.lineHeight||1.7};margin:0">${p.sadrzaj||''}</p></div>`
    case 'slika':
      return p.url ? `<div style="text-align:${p.align||'center'};padding:0 40px"><img src="${p.url}" alt="${p.alt||''}" style="width:${p.sirina||100}%;height:${p.visina||300}px;object-fit:${p.objectFit||'cover'};border-radius:${p.radius||0}px"/></div>` : ''
    case 'dugme': {
      const shadow = p.shadow !== 'false' ? `box-shadow:0 4px 14px ${p.bgBoja||'var(--brand)'}40` : ''
      return `<div style="text-align:${p.align||'center'};padding:${p.paddingV||12}px ${p.paddingH||24}px"><a href="${p.url||'#'}" style="display:inline-block;background:${p.bgBoja||'var(--brand)'};color:${p.tekstBoja||'#fff'};padding:${p.paddingV||12}px ${p.paddingH||24}px;border-radius:${p.radius||8}px;font-size:${parseInt(p.fontSize)||15}px;font-weight:${p.fontWeight||600};text-decoration:none;${shadow}">${p.tekst||'Klikni'}</a></div>`
    }
    case 'separator':
      return `<div style="padding:${p.marginV||32}px 40px"><hr style="border:none;border-top:${p.visina||1}px ${p.stil||'solid'} ${p.boja||'#e8edeb'};margin:0"/></div>`
    case 'spacer':
      return `<div style="height:${p.visina||40}px"></div>`
    case 'kategorije_grid': {
      const cols = isMobile ? 2 : Math.min(parseInt(p.kolone)||4, 4)
      const cats = ['Alati','Elektro','Hidraulika','Pneumatika','Maziva','Sigurnost','Vijci','Ostalo']
      return `<section style="padding:${p.paddingV||48}px ${isMobile?20:parseInt(p.paddingH)||40}px;background:${p.bgBoja||'#f8fafa'}">
        ${p.naslov ? `<h2 style="font-size:24px;font-weight:700;margin:0 0 28px;color:#0d1f1a">${p.naslov}</h2>` : ''}
        <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:12px">
          ${cats.slice(0,Math.min(8,parseInt(p.kolone||4)*2)).map(k => `<a href={shopLink("/?q=${k}")} style="display:flex;flex-direction:column;align-items:center;padding:16px 12px;background:${p.katBoja||'#fff'};border-radius:${p.katRadius||12}px;border:1px solid ${p.katBorder||'#e8edeb'};text-decoration:none"><div style="width:44px;height:44px;background:var(--brand);border-radius:10px;margin-bottom:8px"></div><span style="font-size:13px;font-weight:600;color:#0d1f1a">${k}</span></a>`).join('')}
        </div>
      </section>`
    }
    case 'kartica':
      return `<div style="background:${p.bgBoja||'#fff'};border-radius:${p.radius||14}px;padding:${p.padding||24}px;box-shadow:${p.shadow!=='false'?'0 2px 12px rgba(0,0,0,0.08)':'none'}"><h3 style="font-size:18px;font-weight:700;color:${p.naslovBoja||'#0d1f1a'};margin:0 0 10px">${p.naslov||''}</h3><p style="font-size:14px;color:${p.tekstBoja||'#6b8279'};margin:0;line-height:1.6">${p.tekst||''}</p></div>`
    case 'video':
      if (!p.url) return ''
      let embedUrl = p.url
      if (p.tip === 'youtube' || !p.tip) { const id = p.url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1]; if (id) embedUrl = `https://www.youtube.com/embed/${id}` }
      else if (p.tip === 'vimeo') { const id = p.url.match(/vimeo\.com\/(\d+)/)?.[1]; if (id) embedUrl = `https://player.vimeo.com/video/${id}` }
      return `<div style="padding:${p.paddingV||32}px ${isMobile?20:parseInt(p.paddingH)||40}px"><iframe src="${embedUrl}" style="width:100%;height:${p.visina||400}px;border-radius:${p.radius||12}px;border:none" allowfullscreen></iframe></div>`
    case 'html':
      return p.sadrzaj || ''
    default:
      return ''
  }
}

// ─── Page Builder Output (čita craft_builder_json) ────────────────────────────
function PageBuilderOutput({ pozicija }: { pozicija: 'gore' | 'dole' }) {
  const [blocks, setBlocks] = useState<any[]>([])
  const [pozicijaConfig, setPozicijaConfig] = useState('dole')

  useEffect(() => {
    fetch('/api/postavke?kljuci=craft_builder_json,craft_builder_pozicija')
      .then(r => r.json()).then(d => {
        if (d.craft_builder_json) {
          try { setBlocks(JSON.parse(d.craft_builder_json)) } catch {}
        }
        if (d.craft_builder_pozicija) setPozicijaConfig(d.craft_builder_pozicija)
      }).catch(() => {})
  }, [])

  if (!blocks.length) return null
  if (pozicijaConfig !== pozicija) return null

  const html = blocks.map(b => renderBlockHTML(b, 'desktop')).join('\n')

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const [p, setP] = useState<Record<string, string>>({})
  const [grupe, setGrupe] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/postavke?kljuci=shop_naziv,shop_email,shop_telefon,shop_adresa,shop_grad,shop_web,theme_footer_tekst,theme_footer_boja,theme_footer_bg_slika,theme_footer_logo_url,footer_kolone_aktivan,footer_kolona1_naslov,footer_kolona1_sadrzaj,footer_kolona2_naslov,footer_kolona2_sadrzaj,footer_kolona3_naslov,footer_kolona3_sadrzaj,footer_social_facebook,footer_social_instagram,footer_social_linkedin,footer_social_twitter,footer_social_youtube,footer_social_tiktok,footer_social_whatsapp,footer_social_viber,shop_watermark')
      .then(r => r.json()).then(setP).catch(() => {})
    fetch('/api/grupe')
      .then(r => r.json()).then(d => setGrupe((d.items || []).filter((g: any) => !g.parentId).slice(0, 8)))
      .catch(() => {})
  }, [])

  const socials = [
    { key: 'footer_social_facebook', label: 'Facebook', icon: '📘' },
    { key: 'footer_social_instagram', label: 'Instagram', icon: '📷' },
    { key: 'footer_social_linkedin', label: 'LinkedIn', icon: '💼' },
    { key: 'footer_social_twitter', label: 'X / Twitter', icon: '✖' },
    { key: 'footer_social_youtube', label: 'YouTube', icon: '▶' },
    { key: 'footer_social_tiktok', label: 'TikTok', icon: '♪' },
    { key: 'footer_social_whatsapp', label: 'WhatsApp', icon: '💬' },
    { key: 'footer_social_viber', label: 'Viber', icon: '📞' },
  ].filter(s => p[s.key])

  const bgStyle: React.CSSProperties = {
    background: p.theme_footer_bg_slika
      ? 'url(' + p.theme_footer_bg_slika + ') center/cover no-repeat'
      : (p.theme_footer_boja || '#f5f5f3'),
    borderTop: '1px solid #e5e7eb',
  }

  const col1Lines = (p.footer_kolona1_sadrzaj || '').split('\n').filter(Boolean)
  const col2Lines = (p.footer_kolona2_sadrzaj || '').split('\n').filter(Boolean)
  const col3Lines = (p.footer_kolona3_sadrzaj || '').split('\n').filter(Boolean)

  return (
    <footer style={bgStyle}>
      {/* Gornji dio — 4 kolone */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px 32px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px' }}>

        {/* Kolona 1 — Kategorije */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {grupe.length > 0 ? 'Kategorije' : (p.footer_kolona1_naslov || 'Kategorije')}
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(grupe.length > 0 ? grupe.map(g => ({ href: '/?grupaId=' + g.id, label: g.naziv })) : col1Lines.map(l => ({ href: '#', label: l }))).map((item, i) => (
              <li key={i}>
                <a href={item.href} style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Kolona 2 — Custom (iz postavki) */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {p.footer_kolona2_naslov || 'Informacije'}
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {col2Lines.length > 0 ? col2Lines.map((line, i) => (
              <li key={i}><a href="#" style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}
              >{line}</a></li>
            )) : [{ label: 'O nama', href: '/stranica/o-nama' }, { label: 'Vijesti', href: '/vijesti' }, { label: 'Dostava i plaćanje', href: '/stranica/dostava-i-placanje' }, { label: 'Uvjeti korištenja', href: '/stranica/uvjeti-koristenja' }, { label: 'Kontakt', href: '/stranica/kontakt' }].map((item, i) => (
              <li key={i}><a href={item.href || '#'} style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}
              >{item.label}</a></li>
            ))}
          </ul>
        </div>

        {/* Kolona 3 — Pratite nas */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Pratite nas
          </h4>
          {socials.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {socials.map(s => (
                <li key={s.key}>
                  <a href={p[s.key]} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#6B7280', textDecoration: 'none', paddingBottom: '10px', borderBottom: '1px solid #f0f0f0' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}
                  >
                    <span style={{ width: '28px', height: '28px', background: '#f3f4f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
                      {s.icon}
                    </span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.6 }}>
              Dodajte linkove društvenih mreža u Admin → Izgled → Logo i identitet.
            </p>
          )}
        </div>

        {/* Kolona 4 — Kontakt */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {p.footer_kolona3_naslov || 'Kontakt'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(p.shop_naziv || siteConfig.name) && (
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{p.shop_naziv || siteConfig.name}</div>
            )}
            {(p.shop_adresa || p.shop_grad) && (
              <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6 }}>
                {p.shop_adresa && <div>{p.shop_adresa}</div>}
                {p.shop_grad && <div>{p.shop_grad}</div>}
              </div>
            )}
            {col3Lines.length > 0 && (
              <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{p.footer_kolona3_sadrzaj}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
              {p.shop_telefon && (
                <a href={'tel:' + p.shop_telefon} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}
                >
                  <span style={{ fontSize: '14px' }}>📞</span> {p.shop_telefon}
                </a>
              )}
              {p.shop_email && (
                <a href={'mailto:' + p.shop_email} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--brand)', textDecoration: 'none', fontWeight: 500 }}>
                  <span style={{ fontSize: '14px' }}>✉</span> {p.shop_email}
                </a>
              )}
              {p.shop_web && (
                <a href={'https://' + p.shop_web.replace('https://', '')} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}
                >
                  <span style={{ fontSize: '14px' }}>🌐</span> {p.shop_web}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Donji bar — copyright */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {p.theme_footer_logo_url && (
              <img src={p.theme_footer_logo_url} alt="" style={{ height: '24px', objectFit: 'contain' }} />
            )}
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
              © {new Date().getFullYear()} {p.shop_naziv || siteConfig.name}
              {p.shop_watermark !== 'false' && <span style={{ opacity: 0.6 }}> · Powered by NIBIS</span>}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Impressum', 'Izjava o kolačićima', 'Pravila o privatnosti', 'Opći uslovi'].map(link => (
              <a key={link} href="#" style={{ fontSize: '11px', color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#9CA3AF'}
              >{link}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}


// ─── Scroll to top ─────────────────────────────────────────────────────────────
function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!visible) return null
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 50,
        width: '44px', height: '44px', borderRadius: '50%',
        background: 'var(--brand)', color: 'white', border: 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        fontSize: '18px',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)' }}
      title="Na vrh"
    >
      ↑
    </button>
  )
}


// ─── Main Page ─────────────────────────────────────────────────────────────────
export function ShopPage({ shopSlug = '' }: { shopSlug?: string }) {
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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [pageSekcije, setPageSekcije] = useState<{ id: string; aktivan: boolean; instanceId?: string }[]>([
    { id: 'hero', aktivan: true },
    { id: 'akcije', aktivan: true },
    { id: 'katalog', aktivan: true },
  ])
  const [sortBy, setSortBy] = useState('naziv')
  const [sidebarSirina, setSidebarSirina] = useState(240)
  const [sidebarConfig, setSidebarConfig] = useState<{
    bojaPozadine: string
    visinaKategorije: number
  }>({ bojaPozadine: '#F8FAFA', visinaKategorije: 52 })



  const [cijenaDo, setCijenaDo] = useState('')
  const [cijenaOd, setCijenaOd] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid')
  const [perPage, setPerPage] = useState(siteConfig.perPage)
  const [shopTemplate, setShopTemplate] = useState('default')
  const [dugmeTekst, setDugmeTekst] = useState('Dodaj')
  const [searchSuggestions, setSearchSuggestions] = useState<{id: number; naziv: string; sifra: string}[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const suggestTimer = useRef<NodeJS.Timeout | null>(null)

  // Učitaj dinamičke postavke iz baze
  // BATCH LOAD — sve postavke + grupe u jednom Promise.all
  useEffect(() => {
    Promise.all([
      fetch('/api/postavke?kljuci=default_view,per_page,artikal_dugme_tekst,shop_template,sidebar_sirina,sidebar_boja_pozadine,sidebar_visina_kategorije,sekcija_features_naslov,sekcija_features_items,sekcija_banner_tekst,sekcija_banner_podnaslov,sekcija_banner_dugme,sekcija_banner_boja,sekcija_newsletter_naslov,sekcija_newsletter_podnaslov,page_sekcije' + (shopSlug ? '&shop=' + shopSlug : '')).then(r => r.json()),
      fetch('/api/grupe' + (shopSlug ? '?shop=' + shopSlug : '')).then(r => r.json()),
    ]).then(([d, grupeData]) => {
      // Postavke
      if (d.default_view === 'table' || d.default_view === 'grid') setViewMode(d.default_view)
      if (d.per_page) setPerPage(parseInt(d.per_page) || siteConfig.perPage)
      if (d.artikal_dugme_tekst) setDugmeTekst(d.artikal_dugme_tekst)
      if (d.shop_template) setShopTemplate(d.shop_template)
      if (d.sidebar_sirina) setSidebarSirina(parseInt(d.sidebar_sirina))
      if (d.sidebar_boja_pozadine || d.sidebar_visina_kategorije) {
        setSidebarConfig(prev => ({
          bojaPozadine: d.sidebar_boja_pozadine || prev.bojaPozadine,
          visinaKategorije: parseInt(d.sidebar_visina_kategorije || '52'),
        }))
      }
      // Sekcije
      if (d.page_sekcije) { try { setPageSekcije(JSON.parse(d.page_sekcije)) } catch {} }
      if (d.sekcija_features_naslov) setSekcijaFeatureNaslov?.(d.sekcija_features_naslov)
      if (d.sekcija_features_items) { try { setSekcijaFeatureItems?.(JSON.parse(d.sekcija_features_items)) } catch {} }
      if (d.sekcija_banner_tekst) setSekcijabannerTekst?.(d.sekcija_banner_tekst)
      if (d.sekcija_banner_podnaslov) setSekcijaBannerPodnaslov?.(d.sekcija_banner_podnaslov)
      if (d.sekcija_banner_dugme) setSekcijaBannerDugme?.(d.sekcija_banner_dugme)
      if (d.sekcija_banner_boja) setSekcijaBannerBoja?.(d.sekcija_banner_boja)
      if (d.sekcija_newsletter_naslov) setSekcijaNewsletterNaslov?.(d.sekcija_newsletter_naslov)
      if (d.sekcija_newsletter_podnaslov) setSekcijaNewsletterPodnaslov?.(d.sekcija_newsletter_podnaslov)
      // Grupe
      setGrupe(grupeData.items ?? [])
    }).catch(() => {})
  }, [])

  // grupe loaded in batch fetch below

  // Čitaj grupaId i shop iz URL-a pri mount i pri navigaciji
  useEffect(() => {
    function syncFromUrl() {
      const p = new URLSearchParams(window.location.search)
      const gid = p.get('grupaId')
      const id = gid ? parseInt(gid) : null
      setActiveGrupa(prev => {
        if (prev !== id) { setPage(1); return id }
        return prev
      })
    }
    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)
    window.addEventListener('grupaChanged', syncFromUrl)
    return () => {
      window.removeEventListener('popstate', syncFromUrl)
      window.removeEventListener('grupaChanged', syncFromUrl)
    }
  }, [])

  const loadArtikli = useCallback(async () => {
    setLoading(true)
    // Čitaj shop slug svaki put fresh iz URL-a
    const shopSlug = new URLSearchParams(window.location.search).get('shop') || ''
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
      if (shopSlug) params.set('shop', shopSlug)
      const data: PaginatedResponse<Artikal> = await fetch(`/api/artikli?${params}`).then(r => r.json())
      setArtikli(data.items ?? [])
      setTotal(data.total ?? 0)
      if (data.items?.length) {
        // Fetch stanje paralelno dok se artikli renderuju
        fetch(`/api/stanje?ids=${data.items.map(a => a.id).join(',')}${shopSlug ? '&shop=' + shopSlug : ''}`)
          .then(r => r.json())
          .then((sd: PaginatedResponse<StanjeSkladista>) => {
            const map: Record<number, StanjeSkladista> = {}
            sd.items?.forEach(s => { map[s.artikalId] = s })
            setStanje(map)
          })
          .catch(() => {})
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [page, perPage, search, activeGrupa, sortBy, cijenaOd, cijenaDo])

  useEffect(() => { loadArtikli() }, [loadArtikli])

  useEffect(() => {
    fetch('/api/postavke?kljuci=page_sekcije')
      .then(r => r.json()).then(d => {
        if (d.page_sekcije) {
          try { setPageSekcije(JSON.parse(d.page_sekcije)) } catch {}
        }
      }).catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  function onGrupaSelect(id: number | null) {
    setActiveGrupa(id)
    setPage(1)
    setMobileFilters(false)
    const url = new URL(window.location.href)
    if (id) url.searchParams.set('grupaId', String(id))
    else url.searchParams.delete('grupaId')
    window.history.pushState({}, '', url.toString())
  }

  const displayed = filterStock
    ? artikli.filter(a => { const s = stanje[a.id]; return s && s.raspolozivaKolicina > 0 })
    : artikli

  const totalPages = Math.ceil(total / perPage)

  // Template switcher
  if (shopTemplate === 'wurth') return <WurthTemplate />
  if (shopTemplate === 'saas') return <SaasTemplate />
  if (shopTemplate === 'warm') return <WarmTemplate />
  if (shopTemplate === 'dark') return <DarkTemplate />
  if (shopTemplate === 'mega') return <MegaTemplate />
  if (shopTemplate === 'luxury') return <LuxuryTemplate />
  if (shopTemplate === 'mcmaster') return <McMasterTemplate />
  if (shopTemplate === 'grainger') return <GraingerTemplate />
  if (shopTemplate === 'visual') return <VisualTemplate />
  if (shopTemplate === 'neon') return <NeonTemplate />

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
        <Header onSearch={q => setSearchInput(q)} />

        {/* Hero Slider */}
        {pageSekcije.find(s => s.id === 'hero')?.aktivan !== false && <HeroSlider />}


        {/* Akcije slider */}
        {pageSekcije.find(s => s.id === 'akcije')?.aktivan !== false && <AkcijeSlider />}

        {/* Ostale sekcije */}
        {pageSekcije.filter(s => s.aktivan && !['hero','akcije','katalog'].includes(s.id)).map(s => {
          if (s.id === 'features') return <FeaturesSekcija key={s.id} />
          if (s.id === 'banner') return <PromoBanner key={s.id} />
          if (s.id === 'newsletter') return <NewsletterSekcija key={s.id} />
          return null
        })}

        {/* Katalog sekcija */}
        {pageSekcije.find(s => s.id === 'katalog')?.aktivan !== false && (
          <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-5 pb-16">
            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {/* Breadcrumb */}
              <div className="flex-1 min-w-0 flex items-center gap-1.5 text-[13px]">
                {activeGrupa ? (
                  <>
                    <button onClick={() => onGrupaSelect(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#9CA3AF", fontFamily: "inherit" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--brand)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9CA3AF"}>
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
                <input type="checkbox" checked={filterStock} onChange={e => setFilterStock(e.target.checked)} style={{ accentColor: "var(--brand)", width: "14px", height: "14px" }} />
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

              {/* View switcher */}
              <div className="flex border border-gray-200 rounded overflow-hidden bg-white">
                <button
                  onClick={() => setViewMode('table')}
                  title="Tabelarni prikaz"
                  style={{ background: viewMode === 'table' ? 'var(--brand)' : 'transparent', color: viewMode === 'table' ? 'white' : '#9CA3AF', padding: '6px', transition: 'all 0.15s', cursor: 'pointer', border: 'none' }}
                >
                  <LayoutList size={15} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid prikaz"
                  style={{ background: viewMode === 'grid' ? 'var(--brand)' : 'transparent', color: viewMode === 'grid' ? 'white' : '#9CA3AF', padding: '6px', transition: 'all 0.15s', cursor: 'pointer', border: 'none' }}
                >
                  <LayoutGrid size={15} />
                </button>
              </div>
            </div>



            {/* Layout */}
            <div className="flex gap-5 items-start">

              {/* Table / Grid */}
              <div className="flex-1 min-w-0">
                {viewMode === 'table' ? (
                  <div style={{ background: "var(--bg-kartica)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
                    <table className="w-full" style={{ borderCollapse: "collapse" as const }}>
                      <thead>
                        <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
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
                              Nema artikala
                              <br />
                              <button onClick={() => { onGrupaSelect(null); setFilterStock(false) }}
                                className="mt-2 underline text-[12px]">
                                Prikaži sve
                              </button>
                            </td></tr>
                          )
                          : displayed.map(a => (
                            <ProductRow key={a.id} artikal={a} stanje={stanje[a.id]} dugmeTekst={dugmeTekst} onLoginRequired={() => setShowLoginPrompt(true)} />
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(172px, 1fr))", gap: "12px" }}>
                    {loading
                      ? Array(perPage).fill(0).map((_, i) => (
                        <div key={i} className="rounded-lg overflow-hidden" style={{ background: "var(--bg-kartica)", border: "1px solid var(--border)" }}>
                          <div className="pt-[72%]" style={{ background: "var(--border)" }} />
                          <div className="p-3 space-y-2">
                            <div className="h-3 rounded w-2/3" style={{ background: "var(--border)" }} />
                            <div className="h-3 rounded w-1/2" style={{ background: "var(--border)" }} />
                            <div className="h-8 rounded mt-2" style={{ background: "var(--border)" }} />
                          </div>
                        </div>
                      ))
                      : displayed.length === 0
                      ? (
                        <div className="col-span-full py-16 text-center text-gray-400 text-[13px]">
                          <Package size={28} className="mx-auto mb-2 opacity-30" />
                          Nema artikala
                          <br />
                          <button onClick={() => { onGrupaSelect(null); setFilterStock(false) }}
                            className="mt-2 underline text-[12px]">
                            Prikaži sve
                          </button>
                        </div>
                      )
                      : displayed.map(a => (
                        <ProductCard key={a.id} artikal={a} stanje={stanje[a.id]} slika={(a as any).slika_url} />
                      ))
                    }
                  </div>
                )}

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
                              ? 'text-white border-transparent font-semibold'
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
        )}

        {/* Login prompt modal za goste */}
        {showLoginPrompt && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setShowLoginPrompt(false)}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛒</div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Prijava potrebna</h2>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px', lineHeight: 1.6 }}>
                Za dodavanje artikala u korpu i finaliziranje narudžbe potrebna je prijava.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button onClick={() => setShowLoginPrompt(false)}
                  style={{ padding: '10px 20px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, fontFamily: 'inherit' }}>
                  Zatvori
                </button>
                <a href={shopSlug ? `/${shopSlug}/login` : "/login"}
                  style={{ padding: '10px 24px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                  Prijava →
                </a>
              </div>
              <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '16px 0 0' }}>
                Nemate račun? <a href={shopSlug ? `/${shopSlug}/register` : "/register"} style={{ color: 'var(--brand)', textDecoration: 'none' }}>Registrujte se</a>
              </p>
            </div>
          </div>
        )}

        {/* Scroll to top */}
        <ScrollToTop />

        <FooterComponent />

      </div>
  )
}


export default function HomePage() {
  return <ShopPage shopSlug="" />
}

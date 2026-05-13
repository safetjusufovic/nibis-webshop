'use client'

import { useEffect, useState, useRef } from 'react'
import { ChevronDown, ChevronRight, Grid } from 'lucide-react'

interface Grupa {
  id: number
  naziv: string
  boja?: string
  ikonaUrl?: string
  ikona_emoji?: string
  children?: Grupa[]
}

interface FeaturedKat {
  id: string
  naziv: string
  slika_url: string
  boja: string
  tekst_boja: string
  url: string
}

interface Props {
  activeId: number | null
  onSelect: (id: number | null) => void
}

export default function NavKategorija({ activeId, onSelect }: Props, shopSlug = '') {
  const [grupe, setGrupe] = useState<Grupa[]>([])
  const [featured, setFeatured] = useState<FeaturedKat[]>([])
  const [config, setConfig] = useState({
    boja: '#1e3a5f', tekst_boja: '#ffffff', visina: '48',
    akcijski_dugme: 'false', akcijski_tekst: 'Akcijski proizvodi', akcijski_boja: '#DC2626',
  })
  const [open, setOpen] = useState(false)
  const [hoverGrupa, setHoverGrupa] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const h = 48



  const _shopParam = shopSlug ? '&shop=' + shopSlug : ''

  useEffect(() => {
    fetch('/api/grupe' + (_shopParam ? '?' + _shopParam.slice(1) : ''))
      .then(r => r.json())
      .then(d => setGrupe(d.items || []))
      .catch(() => {})

    fetch('/api/postavke?kljuci=navkat_boja,navkat_tekst_boja,navkat_visina,navkat_akcijski_dugme,navkat_akcijski_tekst,navkat_akcijski_boja,navkat_featured' + _shopParam)
      .then(r => r.json())
      .then(d => {
        if (d.navkat_boja) setConfig(prev => ({ ...prev, boja: d.navkat_boja }))
        if (d.navkat_tekst_boja) setConfig(prev => ({ ...prev, tekst_boja: d.navkat_tekst_boja }))
        if (d.navkat_visina) setConfig(prev => ({ ...prev, visina: d.navkat_visina }))
        if (d.navkat_akcijski_dugme) setConfig(prev => ({ ...prev, akcijski_dugme: d.navkat_akcijski_dugme }))
        if (d.navkat_akcijski_tekst) setConfig(prev => ({ ...prev, akcijski_tekst: d.navkat_akcijski_tekst }))
        if (d.navkat_akcijski_boja) setConfig(prev => ({ ...prev, akcijski_boja: d.navkat_akcijski_boja }))
        if (d.navkat_featured) {
          try { setFeatured(JSON.parse(d.navkat_featured)) } catch {}
        }
      })
      .catch(() => {})

    // Close on outside click
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const navH = parseInt(config.visina) || h

  return (
    <nav style={{ background: config.boja, position: 'relative', zIndex: 100, borderBottom: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '2px', padding: '0 16px', height: navH + 'px' }} ref={dropdownRef}>

        {/* Akcijsko dugme */}
        {config.akcijski_dugme === 'true' && (
          <button onClick={() => { onSelect(null); setOpen(false) }}
            style={{ height: '32px', padding: '0 16px', background: config.akcijski_boja, color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, borderRadius: '6px', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            🔥 {config.akcijski_tekst}
          </button>
        )}

        {/* Sve kategorije — dropdown trigger */}
        <button
          onClick={() => setOpen(!open)}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', height: navH + 'px', padding: '0 16px', background: open ? 'rgba(255,255,255,0.15)' : 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: config.tekst_boja, transition: 'background 0.15s', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.1)' }}
          onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)' }}
          onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <Grid size={15} />
          Sve kategorije
          <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', opacity: 0.7 }} />
        </button>

        {/* Aktivna kategorija label */}
        {activeId && grupe.find(g => g.id === activeId) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 14px', color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
            <ChevronRight size={12} style={{ opacity: 0.5 }} />
            <span style={{ fontWeight: 500 }}>{grupe.find(g => g.id === activeId)?.naziv}</span>
            <button onClick={() => onSelect(null)} style={{ marginLeft: '4px', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px', padding: '1px 7px', fontSize: '11px', fontFamily: 'inherit' }}>✕</button>
          </div>
        )}

        {/* Dropdown */}
        {open && (
          <div style={{ position: 'absolute', top: navH + 'px', left: 0, right: 0, background: 'white', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', zIndex: 200, display: 'flex', maxHeight: '70vh' }}>

            {/* Lista kategorija — lijevo */}
            <div style={{ width: '260px', borderRight: '1px solid #F3F4F6', overflowY: 'auto', flexShrink: 0 }}>
              {/* Sve */}
              <button
                onClick={() => { onSelect(null); setOpen(false) }}
                style={{ width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', background: activeId === null ? '#F0FDF4' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, color: activeId === null ? 'var(--brand)' : '#111827', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F9FAFB' }}
                onMouseEnter={e => { if (activeId !== null) (e.currentTarget as HTMLElement).style.background = '#F9FAFB' }}
                onMouseLeave={e => { if (activeId !== null) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span style={{ width: '28px', height: '28px', background: '#F3F4F6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🏪</span>
                Svi artikli
              </button>

              {grupe.map(g => (
                <button key={g.id}
                  onClick={() => { onSelect(g.id); setOpen(false) }}
                  onMouseEnter={() => setHoverGrupa(g.id)}
                  onMouseLeave={() => setHoverGrupa(null)}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none', background: activeId === g.id ? '#F0FDF4' : hoverGrupa === g.id ? '#F9FAFB' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: activeId === g.id ? 600 : 400, color: activeId === g.id ? 'var(--brand)' : '#374151', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.1s' }}
                >
                  <span style={{ width: '28px', height: '28px', background: g.boja || '#F3F4F6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0, overflow: 'hidden' }}>
                    {g.ikonaUrl
                      ? <img src={g.ikonaUrl} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                      : (g.ikona_emoji || '📦')
                    }
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.naziv}</span>
                  {activeId === g.id && <span style={{ fontSize: '11px', color: 'var(--brand)', fontWeight: 700 }}>✓</span>}
                </button>
              ))}
            </div>

            {/* Featured kartice — desno (s karticama i slikama) */}
            {featured.length > 0 && (
              <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                  Istaknute kategorije
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                  {featured.map((f, i) => (
                    <button key={i}
                      onClick={() => {
                        if (f.url.startsWith('/?grupaId=')) {
                          const id = parseInt(f.url.replace('/?grupaId=', ''))
                          if (!isNaN(id)) onSelect(id)
                        }
                        setOpen(false)
                      }}
                      style={{ padding: '0', border: 'none', borderRadius: '12px', cursor: 'pointer', overflow: 'hidden', background: 'white', transition: 'transform 0.15s, box-shadow 0.15s', textAlign: 'left', fontFamily: 'inherit' }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.transform = 'translateY(-3px)'
                        el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
                        const overlay = el.querySelector('.kat-overlay') as HTMLElement
                        if (overlay) overlay.style.opacity = '1'
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.transform = 'none'
                        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                        const overlay = el.querySelector('.kat-overlay') as HTMLElement
                        if (overlay) overlay.style.opacity = '0'
                      }}
                    >
                      {/* Slika */}
                      <div style={{ height: '90px', background: f.slika_url ? 'none' : f.boja, backgroundImage: f.slika_url ? 'url(' + f.slika_url + ')' : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', overflow: 'hidden' }}>
                        {/* Colour overlay na hover */}
                        <div className="kat-overlay" style={{ position: 'absolute', inset: 0, background: f.boja, opacity: 0, transition: 'opacity 0.2s', mixBlendMode: 'multiply' }} />
                      </div>
                      {/* Label */}
                      <div style={{ padding: '8px 10px', background: 'white', borderTop: '2px solid ' + f.boja }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.naziv}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {featured.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '32px' }}>📁</span>
                <span>Dodaj istaknute kategorije u Admin → Izgled → Navigacija kategorija</span>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

'use client'

import { useEffect, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

interface Grupa {
  id: number
  naziv: string
  boja?: string
  ikona_url?: string
  ikona_emoji?: string
}

interface Props {
  activeId: number | null
  onSelect: (id: number | null) => void
}

export default function NavKategorija({ activeId, onSelect }: Props) {
  const [grupe, setGrupe] = useState<Grupa[]>([])
  const [config, setConfig] = useState({
    boja: '#1e3a5f', tekst_boja: '#ffffff',
    visina: '48', stil: 'flat',
    akcijski_dugme: 'false', akcijski_tekst: 'Akcijski proizvodi', akcijski_boja: '#DC2626',
  })
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/grupe')
      .then(r => r.json())
      .then(d => setGrupe((d.items || []).slice(0, 30)))
      .catch(() => {})

    fetch('/api/postavke?kljuci=navkat_boja,navkat_tekst_boja,navkat_visina,navkat_stil,navkat_akcijski_dugme,navkat_akcijski_tekst,navkat_akcijski_boja')
      .then(r => r.json())
      .then(d => setConfig(prev => ({ ...prev, ...Object.fromEntries(Object.entries(d).filter(([, v]) => v)) })))
      .catch(() => {})
  }, [])

  function checkScroll() {
    const t = trackRef.current
    if (!t) return
    setCanScrollLeft(t.scrollLeft > 10)
    setCanScrollRight(t.scrollLeft < t.scrollWidth - t.clientWidth - 10)
  }

  useEffect(() => {
    const t = trackRef.current
    if (!t) return
    checkScroll()
    t.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)
    return () => { t.removeEventListener('scroll', checkScroll); window.removeEventListener('resize', checkScroll) }
  }, [grupe])

  function scroll(dir: 'left' | 'right') {
    trackRef.current?.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' })
  }

  const h = parseInt(config.visina) || 48

  const itemStyle = (id: number | null): React.CSSProperties => {
    const isActive = activeId === id
    if (config.stil === 'pills') return {
      padding: '5px 16px', borderRadius: '100px', whiteSpace: 'nowrap',
      fontSize: '13px', fontWeight: isActive ? 600 : 400, cursor: 'pointer',
      fontFamily: 'inherit', border: 'none', transition: 'all 0.15s',
      background: isActive ? 'white' : 'rgba(255,255,255,0.12)',
      color: isActive ? config.boja : config.tekst_boja,
    }
    if (config.stil === 'underline') return {
      padding: '0 14px', height: h + 'px', borderRadius: 0, whiteSpace: 'nowrap',
      fontSize: '13px', fontWeight: isActive ? 600 : 400, cursor: 'pointer',
      fontFamily: 'inherit', border: 'none', borderBottom: isActive ? '3px solid white' : '3px solid transparent',
      background: 'transparent', color: isActive ? 'white' : 'rgba(255,255,255,0.75)',
      transition: 'all 0.15s', display: 'flex', alignItems: 'center',
    }
    // flat (default)
    return {
      padding: '6px 14px', borderRadius: '6px', whiteSpace: 'nowrap',
      fontSize: '13px', fontWeight: isActive ? 600 : 400, cursor: 'pointer',
      fontFamily: 'inherit', border: 'none', transition: 'all 0.15s',
      background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
      color: config.tekst_boja,
    }
  }

  if (!grupe.length) return null

  return (
    <nav style={{
      background: config.boja, position: 'relative',
      borderBottom: '1px solid rgba(0,0,0,0.1)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Akcijsko dugme */}
        {config.akcijski_dugme === 'true' && (
          <button style={{
            height: h + 'px', padding: '0 18px', background: config.akcijski_boja,
            color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '13px', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px',
            letterSpacing: '-0.01em',
          }}>
            🔥 {config.akcijski_tekst}
          </button>
        )}

        {/* Left fade + scroll arrow */}
        {canScrollLeft && (
          <>
            <div style={{ position: 'absolute', left: config.akcijski_dugme === 'true' ? '140px' : '0', top: 0, bottom: 0, width: '40px', background: `linear-gradient(to right, ${config.boja}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
            <button onClick={() => scroll('left')} style={{
              position: 'absolute', left: config.akcijski_dugme === 'true' ? '148px' : '8px', zIndex: 3,
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronLeft size={14} />
            </button>
          </>
        )}

        {/* Scrollable track */}
        <div ref={trackRef} style={{
          display: 'flex', alignItems: 'center', gap: '2px',
          overflowX: 'auto', scrollbarWidth: 'none', flex: 1,
          height: h + 'px', padding: '0 8px',
        }}>
          {/* Sve kategorije */}
          <button onClick={() => onSelect(null)} style={itemStyle(null)}>
            Sve kategorije
          </button>

          {grupe.map(g => (
            <button key={g.id} onClick={() => onSelect(g.id)} style={{
              ...itemStyle(g.id),
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              {g.ikona_url && <img src={g.ikona_url} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain', opacity: 0.85 }} />}
              {g.ikona_emoji && !g.ikona_url && <span style={{ fontSize: '15px' }}>{g.ikona_emoji}</span>}
              {g.naziv}
            </button>
          ))}
        </div>

        {/* Right fade + scroll arrow */}
        {canScrollRight && (
          <>
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px', background: `linear-gradient(to left, ${config.boja}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
            <button onClick={() => scroll('right')} style={{
              position: 'absolute', right: '8px', zIndex: 3,
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronRight size={14} />
            </button>
          </>
        )}
      </div>
      <style>{`::-webkit-scrollbar{display:none}`}</style>
    </nav>
  )
}

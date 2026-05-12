'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Package, ChevronLeft, ChevronRight, Tag, Pause, Play } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { formatCijena } from '@/lib/config'

interface ArtikalAkcija {
  id: number
  sifra: string
  naziv: string
  planskaMaloprodajnaCijena: number
  planska_maloprodajna_cijena?: number
  slika_url: string | null
  akcija_popust: number
  akcija_do: string | null
}

export default function AkcijeSlider() {
  const [artikli, setArtikli] = useState<ArtikalAkcija[]>([])
  const [loading, setLoading] = useState(true)
  const [paused, setPaused] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const { rabat } = useAuth()
  const trackRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number | null>(null)
  const posRef = useRef(0)
  const pausedRef = useRef(false)
  const speedRef = useRef(0.5) // px per frame



  const _shopParam = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('shop') ? '&shop=' + new URLSearchParams(window.location.search).get('shop') : '') : ''

  useEffect(() => {
    fetch('/api/artikli?akcija=true&perPage=24&page=1' + _shopParam)
      .then(r => r.json())
      .then(async d => {
        const items = (d.items ?? []).filter((a: any) => a.akcija_popust > 0)
        if (items.length === 0) { setLoading(false); return }
        // Fetch stanje za cijene - isto kao ProductCard
        const ids = items.map((a: any) => a.id).join(',')
        try {
          const sr = await fetch('/api/stanje?ids=' + ids)
          const stanjeData = sr.ok ? await sr.json() : { items: [] }
          const stanjeByArtikalId: Record<number, any> = {}
          ;(stanjeData.items || []).forEach((s: any) => { stanjeByArtikalId[s.artikalId] = s })
          const withPrices = items.map((a: any) => ({ ...a, _stanje: stanjeByArtikalId[a.id] || null }))
          setArtikli(withPrices)
        } catch {
          setArtikli(items)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Infinite scroll animation
  useEffect(() => {
    if (loading || artikli.length === 0) return
    const track = trackRef.current
    if (!track) return

    // Duplicate items for seamless loop
    const CARD_W = 194 // card width + gap
    const totalW = artikli.length * CARD_W

    function animate() {
      if (!pausedRef.current) {
        posRef.current += speedRef.current
        if (posRef.current >= totalW) {
          posRef.current = 0
        }
        if (track) {
          track.style.transform = 'translateX(-' + posRef.current + 'px)'
        }
      }
      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [loading, artikli])

  function togglePause() {
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)
  }

  function scrollBy(dir: 'left' | 'right') {
    const CARD_W = 194
    const step = CARD_W * 3
    posRef.current = Math.max(0, posRef.current + (dir === 'right' ? step : -step))
  }

  if (!loading && artikli.length === 0) return null

  // Triplicate for seamless infinite loop
  const displayItems = loading ? [] : [...artikli, ...artikli, ...artikli]

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--brand-dark, var(--brand)) 0%, var(--brand) 100%)',
      padding: '28px 0',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative dots */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px', display: 'flex' }}>
              <Tag size={16} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'white', margin: 0 }}>Akcije</h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                {loading ? '...' : artikli.length + ' artikala na popustu'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* Speed kontrola */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Brzina</span>
              <input type="range" min={0.2} max={3} step={0.1}
                defaultValue={0.5}
                onChange={e => { speedRef.current = parseFloat(e.target.value) }}
                style={{ width: '60px', accentColor: 'white', cursor: 'pointer' }}
              />
            </div>

            <button onClick={() => scrollBy('left')} style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.28)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'}
            >
              <ChevronLeft size={15} />
            </button>

            <button onClick={togglePause} title={paused ? 'Pokreni' : 'Pauziraj'} style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: paused ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {paused ? <Play size={13} /> : <Pause size={13} />}
            </button>

            <button onClick={() => scrollBy('right')} style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.28)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Track container */}
        <div style={{ overflow: 'hidden', position: 'relative' }}
          onMouseEnter={() => { pausedRef.current = true }}
          onMouseLeave={() => { if (!paused) pausedRef.current = false }}
        >
          {/* Fade edges */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px', background: 'linear-gradient(to right, var(--brand-dark, var(--brand)), transparent)', zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px', background: 'linear-gradient(to left, var(--brand), transparent)', zIndex: 2, pointerEvents: 'none' }} />

          {/* Scrolling track */}
          <div
            ref={trackRef}
            style={{
              display: 'flex',
              gap: '14px',
              willChange: 'transform',
              paddingBottom: '4px',
            }}
          >
            {loading
              ? Array(8).fill(0).map((_, i) => (
                <div key={i} style={{ flexShrink: 0, width: '180px', height: '240px', background: 'rgba(255,255,255,0.1)', borderRadius: '14px' }} />
              ))
              : displayItems.map((a, idx) => {
                const s = (a as any)._stanje
                const cijenaBase = s ? (s.mpcijena || s.vpcijena || 0) : 0
                const cijena = cijenaBase > 0 ? cijenaBase * (1 - a.akcija_popust / 100) : 0
                const cijenaKupca = (rabat > 0 && cijena > 0) ? cijena * (1 - rabat / 100) : cijena

                return (
                  <Link key={idx} href={'/proizvod/' + a.id} style={{ textDecoration: 'none', flexShrink: 0 }}>
                    <div style={{
                      width: '180px',
                      background: 'rgba(255,255,255,0.96)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer',
                    }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.transform = 'translateY(-5px)'
                        el.style.boxShadow = '0 20px 40px rgba(0,0,0,0.25)'
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.transform = 'none'
                        el.style.boxShadow = 'none'
                      }}
                    >
                      {/* Slika */}
                      <div style={{ position: 'relative', paddingTop: '70%', background: '#F8FAFA' }}>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {a.slika_url
                            ? <img src={a.slika_url} alt={a.naziv} style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                            : <Package size={28} style={{ color: '#D1DDD9' }} />
                          }
                        </div>
                        <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#DC2626', color: 'white', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '100px' }}>
                          -{a.akcija_popust}%
                        </div>
                        {a.akcija_do && (
                          <div style={{ position: 'absolute', bottom: '6px', left: '6px', right: '6px', background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: '9px', padding: '2px 5px', borderRadius: '5px', textAlign: 'center' }}>
                            do {new Date(a.akcija_do).toLocaleDateString('bs-BA')}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ padding: '10px 12px 12px' }}>
                        <p style={{ fontSize: '12px', color: '#374151', fontWeight: 500, lineHeight: 1.35, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                          {a.naziv}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand)' }}>
                            {formatCijena(cijenaKupca)}
                          </span>
                          <span style={{ fontSize: '11px', color: '#9CACA6', textDecoration: 'line-through' }}>
                            {formatCijena(cijenaBase)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            }
          </div>
        </div>
      </div>
    </div>
  )
}

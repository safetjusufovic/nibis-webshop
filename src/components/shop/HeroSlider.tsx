'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Slide {
  slika_url: string
  naslov?: string
  podnaslov?: string
  dugme_tekst?: string
  dugme_url?: string
  tekst_boja?: string
  pozicija?: string // 'left' | 'center' | 'right'
  overlay?: string
}

export default function HeroSlider({ shopSlug = '' }: { shopSlug?: string }) {
  const [slides, setSlides] = useState<Slide[]>([])
  const [current, setCurrent] = useState(0)
  const [visina, setVisina] = useState(480)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [paused, setPaused] = useState(false)



  const _shopParam = shopSlug ? '&shop=' + shopSlug : ''

  useEffect(() => {
    fetch('/api/postavke?kljuci=hero_slides,hero_visina,hero_aktivan' + _shopParam)
      .then(r => r.json())
      .then(d => {
        if (d.hero_visina) setVisina(parseInt(d.hero_visina) || 480)
        if (d.hero_slides) {
          try { setSlides(JSON.parse(d.hero_slides)) } catch {}
        }
        // Fallback — stari HeroBanner format
        if (!d.hero_slides || d.hero_slides === '[]') {
          fetch('/api/postavke?kljuci=hero_naslov,hero_podnaslov,hero_dugme_tekst,hero_dugme_url,hero_slika_url,hero_boja_pozadine,hero_tekst_boja,hero_tekst_pozicija,hero_overlay_opacity' + _shopParam)
            .then(r => r.json())
            .then(h => {
              setSlides([{
                slika_url: h.hero_slika_url || '',
                naslov: h.hero_naslov || '',
                podnaslov: h.hero_podnaslov || '',
                dugme_tekst: h.hero_dugme_tekst || '',
                dugme_url: h.hero_dugme_url || '/',
                tekst_boja: h.hero_tekst_boja || '#ffffff',
                pozicija: h.hero_tekst_pozicija || 'center',
                overlay: h.hero_overlay_opacity || '0.4',
              }])
            })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const next = useCallback(() => setCurrent(c => (c + 1) % Math.max(1, slides.length)), [slides.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (slides.length <= 1 || paused) return
    timerRef.current = setInterval(next, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [slides.length, paused, next])

  if (loading) return (
    <div style={{ width: '100%', height: visina + 'px', background: 'linear-gradient(135deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
  )

  if (!slides.length) return null

  const slide = slides[current]
  const align = slide.pozicija === 'left' ? 'flex-start' : slide.pozicija === 'right' ? 'flex-end' : 'center'
  const textAlign = slide.pozicija === 'left' ? 'left' : slide.pozicija === 'right' ? 'right' : 'center'

  const bg = slide.slika_url
    ? `linear-gradient(rgba(0,0,0,${slide.overlay||'0.4'}),rgba(0,0,0,${slide.overlay||'0.4'})),url(${slide.slika_url}) center/cover no-repeat`
    : 'linear-gradient(135deg, var(--brand-dark), var(--brand))'

  return (
    <div
      style={{ position: 'relative', width: '100%', height: visina + 'px', overflow: 'hidden', userSelect: 'none' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {slides.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0,
          background: s.slika_url
            ? `linear-gradient(rgba(0,0,0,${s.overlay||'0.4'}),rgba(0,0,0,${s.overlay||'0.4'})),url(${s.slika_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, var(--brand-dark), var(--brand))',
          opacity: i === current ? 1 : 0,
          transition: 'opacity 0.7s ease',
          display: 'flex', alignItems: 'center',
          justifyContent: s.pozicija === 'left' ? 'flex-start' : s.pozicija === 'right' ? 'flex-end' : 'center',
        }}>
          {(s.naslov || s.podnaslov || s.dugme_tekst) && (
            <div style={{
              padding: '0 64px', maxWidth: '700px',
              textAlign: s.pozicija === 'left' ? 'left' : s.pozicija === 'right' ? 'right' : 'center',
              color: s.tekst_boja || '#ffffff',
            }}>
              {s.naslov && (
                <h1 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, margin: '0 0 14px', lineHeight: 1.15, letterSpacing: '-0.02em', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                  {s.naslov}
                </h1>
              )}
              {s.podnaslov && (
                <p style={{ fontSize: 'clamp(14px, 1.8vw, 20px)', opacity: 0.88, margin: '0 0 28px', lineHeight: 1.6, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                  {s.podnaslov}
                </p>
              )}
              {s.dugme_tekst && (
                <Link href={s.dugme_url || '/'} style={{
                  display: 'inline-block', padding: '14px 32px',
                  background: 'white', color: 'var(--brand)',
                  borderRadius: '8px', fontWeight: 700, textDecoration: 'none',
                  fontSize: '15px', letterSpacing: '-0.01em',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.25)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)' }}
                >
                  {s.dugme_tekst} →
                </Link>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Prev/Next arrows */}
      {slides.length > 1 && (
        <>
          <button onClick={prev} style={{
            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.25)',
            color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s', zIndex: 10,
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.6)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.35)'}
          >
            <ChevronLeft size={20} />
          </button>
          <button onClick={next} style={{
            position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.25)',
            color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s', zIndex: 10,
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.6)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.35)'}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div style={{
          position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '8px', zIndex: 10,
        }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              width: i === current ? '28px' : '8px', height: '8px',
              borderRadius: '100px', border: 'none', cursor: 'pointer',
              background: i === current ? 'white' : 'rgba(255,255,255,0.45)',
              transition: 'all 0.3s', padding: 0,
            }} />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {slides.length > 1 && !paused && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', background: 'rgba(255,255,255,0.3)', width: '100%', zIndex: 10 }}>
          <div key={current} style={{
            height: '100%', background: 'white',
            animation: 'progress 5s linear',
            transformOrigin: 'left',
          }} />
        </div>
      )}

      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        @keyframes progress { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  )
}

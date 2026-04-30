'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Package, ChevronLeft, ChevronRight, Tag } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { formatCijena, siteConfig } from '@/lib/config'

interface ArtikalAkcija {
  id: number
  sifra: string
  naziv: string
  planska_maloprodajna_cijena: number
  slika_url: string | null
  akcija_popust: number
  akcija_do: string | null
  stanje?: { vpcijena: number; mpcijena: number; raspoloziva_kolicina: number }
}

export default function AkcijeSlider() {
  const [artikli, setArtikli] = useState<ArtikalAkcija[]>([])
  const [loading, setLoading] = useState(true)
  const { rabat } = useAuth()
  const { add } = useCart()
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/artikli?akcija=true&perPage=20&page=1')
      .then(r => r.json())
      .then(d => {
        const items = (d.items ?? []).filter((a: any) => a.akcija_popust > 0)
        setArtikli(items)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function scroll(dir: 'left' | 'right') {
    if (!sliderRef.current) return
    sliderRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  if (!loading && artikli.length === 0) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--brand-dark) 0%, var(--brand) 100%)',
      padding: '28px 0',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative bg */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px', display: 'flex' }}>
              <Tag size={16} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: 0, letterSpacing: '-0.01em' }}>
                Akcije
              </h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                {artikli.length} artikala na popustu
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => scroll('left')} style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'}
            >
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => scroll('right')} style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Slider */}
        <div
          ref={sliderRef}
          style={{
            display: 'flex',
            gap: '14px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            paddingBottom: '4px',
          }}
        >
          <style>{`.akcije-slider::-webkit-scrollbar { display: none; }`}</style>

          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} style={{
                flexShrink: 0, width: '180px', height: '240px',
                background: 'rgba(255,255,255,0.1)', borderRadius: '14px',
                animation: 'pulse 1.5s infinite',
              }} />
            ))
          ) : artikli.map(a => {
            const cijenaBase = a.planska_maloprodajna_cijena
            const cijena = cijenaBase * (1 - a.akcija_popust / 100)
            const cijenaKupca = rabat > 0 ? cijena * (1 - rabat / 100) : cijena

            return (
              <Link key={a.id} href={`/proizvod/${a.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div style={{
                  width: '180px',
                  background: 'rgba(255,255,255,0.95)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.2)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', paddingTop: '70%', background: '#F8FAFA' }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {a.slika_url ? (
                        <img src={a.slika_url} alt={a.naziv} style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                      ) : (
                        <Package size={28} style={{ color: '#D1DDD9' }} />
                      )}
                    </div>
                    {/* Akcija badge */}
                    <div style={{
                      position: 'absolute', top: '8px', left: '8px',
                      background: '#DC2626', color: 'white', fontSize: '11px', fontWeight: 800,
                      padding: '3px 8px', borderRadius: '100px',
                    }}>
                      -{a.akcija_popust}%
                    </div>
                    {a.akcija_do && (
                      <div style={{
                        position: 'absolute', bottom: '8px', left: '8px', right: '8px',
                        background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px',
                        padding: '3px 6px', borderRadius: '6px', textAlign: 'center',
                      }}>
                        do {new Date(a.akcija_do).toLocaleDateString('bs-BA')}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '10px 12px 12px' }}>
                    <p style={{
                      fontSize: '12px', color: '#374151', fontWeight: 500, lineHeight: 1.3, margin: '0 0 8px',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {a.naziv}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
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
          })}
        </div>
      </div>
    </div>
  )
}

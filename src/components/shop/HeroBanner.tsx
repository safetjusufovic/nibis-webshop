'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowRight } from 'lucide-react'

interface HeroConfig {
  hero_aktivan: string
  hero_naslov: string
  hero_podnaslov: string
  hero_dugme_tekst: string
  hero_boja_pozadine: string
  hero_url_slike: string
}

export default function HeroBanner() {
  const [config, setConfig] = useState<HeroConfig | null>(null)

  useEffect(() => {
    supabase.from('postavke')
      .select('kljuc, vrijednost')
      .in('kljuc', ['hero_aktivan', 'hero_naslov', 'hero_podnaslov', 'hero_dugme_tekst', 'hero_boja_pozadine', 'hero_url_slike'])
      .then(({ data }) => {
        if (!data) return
        const map: any = {}
        data.forEach(p => { map[p.kljuc] = p.vrijednost })
        setConfig(map)
      })
  }, [])

  if (!config || config.hero_aktivan !== 'true') return null

  const bgColor = config.hero_boja_pozadine || '#0F6E56'
  const hasSlika = config.hero_url_slike?.trim()

  return (
    <div
      data-sekcija="hero"
      data-hero-section="true"
      data-hero-boja={bgColor}
      data-hero-slika={config.hero_url_slike || ''}
      data-hero-overlay="0.35"
      style={{
        background: hasSlika
          ? `linear-gradient(to right, ${bgColor}ee, ${bgColor}99), url(${config.hero_url_slike}) center/cover no-repeat`
          : `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}cc 100%)`,
        padding: '48px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
      {/* Decorative elements */}
      <div style={{
        position: 'absolute', right: '-80px', top: '-80px',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
      }} />
      <div style={{
        position: 'absolute', right: '40px', bottom: '-60px',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative' }}>
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{
            fontSize: 'clamp(24px, 4vw, 40px)',
            fontWeight: 800,
            color: 'white',
            margin: '0 0 12px',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }} data-hero-naslov="true">
            {config.hero_naslov}
          </h1>
          {config.hero_podnaslov && (
            <p style={{
              fontSize: 'clamp(14px, 2vw, 17px)',
              color: 'rgba(255,255,255,0.8)',
              margin: '0 0 28px',
              lineHeight: 1.6,
            }} data-hero-podnaslov="true">
              {config.hero_podnaslov}
            </p>
          )}
          {config.hero_dugme_tekst && (
            <Link href="/#katalog" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'white',
              color: bgColor,
              fontWeight: 700,
              fontSize: '15px',
              padding: '12px 24px',
              borderRadius: '10px',
              textDecoration: 'none',
              transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            }}
              data-hero-dugme="true"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)' }}
            >
              {config.hero_dugme_tekst}
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

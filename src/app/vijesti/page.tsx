'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { Calendar, Tag, ArrowRight } from 'lucide-react'

interface Clanak {
  id: string; slug: string; naslov: string; podnaslov?: string
  slika_url?: string; kategorija?: string; tagovi?: string
  objavljen: boolean; istaknuto?: boolean; autor_naziv?: string
  created_at: string
}

export default function VijestiPage() {
  const [clanci, setClanci] = useState<Clanak[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const shopSlug = new URLSearchParams(window.location.search).get('shop') || ''
    const shopParam = shopSlug ? '&shop=' + shopSlug : ''
    fetch('/api/stranice?tip=clanak' + shopParam)
      .then(r => r.json())
      .then(d => { setClanci(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const istaknuti = clanci.find(c => c.istaknuto)
  const ostali = clanci.filter(c => !c.istaknuto)
  const shopSlug = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('shop') || '' : ''
  const shopParam = shopSlug ? '?shop=' + shopSlug : ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text)', margin: '0 0 32px', letterSpacing: '-0.02em' }}>Vijesti</h1>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1,2,3].map(i => <div key={i} style={{ height: '120px', background: 'var(--border)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : clanci.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📰</div>
            <p>Nema objavljenih vijesti.</p>
          </div>
        ) : (
          <>
            {/* Istaknuti */}
            {istaknuti && (
              <Link href={'/vijesti/' + istaknuti.slug + shopParam} style={{ textDecoration: 'none', display: 'grid', gridTemplateColumns: istaknuti.slika_url ? '1fr 1fr' : '1fr', gap: '0', background: 'white', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '28px', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
              >
                {istaknuti.slika_url && (
                  <div style={{ height: '280px', overflow: 'hidden' }}>
                    <img src={istaknuti.slika_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', background: 'var(--brand)', color: 'white', borderRadius: '100px' }}>★ Istaknuto</span>
                    {istaknuti.kategorija && <span style={{ fontSize: '11px', padding: '3px 10px', background: 'var(--brand-pale)', color: 'var(--brand)', borderRadius: '100px' }}>{istaknuti.kategorija}</span>}
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{istaknuti.naslov}</h2>
                  {istaknuti.podnaslov && <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.6 }}>{istaknuti.podnaslov}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} />{new Date(istaknuti.created_at).toLocaleDateString('bs-BA')}</span>
                    {istaknuti.autor_naziv && <span>· {istaknuti.autor_naziv}</span>}
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {ostali.map(c => (
                <Link key={c.id} href={'/vijesti/' + c.slug + shopParam} style={{ textDecoration: 'none', background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; el.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'none'; el.style.transform = 'none' }}
                >
                  {c.slika_url && <div style={{ height: '160px', overflow: 'hidden' }}><img src={c.slika_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
                  <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {c.kategorija && <span style={{ fontSize: '11px', color: 'var(--brand)', fontWeight: 600, marginBottom: '6px' }}>{c.kategorija}</span>}
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', lineHeight: 1.35 }}>{c.naslov}</h3>
                    {c.podnaslov && <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5, flex: 1 }}>{c.podnaslov.slice(0, 120)}{c.podnaslov.length > 120 ? '...' : ''}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} />{new Date(c.created_at).toLocaleDateString('bs-BA')}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--brand)', fontWeight: 600 }}>Čitaj <ArrowRight size={11} /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { Calendar, User, Tag, ArrowRight } from 'lucide-react'

interface Clanak {
  id: string; slug: string; naslov: string; podnaslov?: string
  slika_url?: string; kategorija?: string; tagovi?: string
  autor_naziv?: string; created_at: string; istaknuto: boolean
}

export default function BlogPage() {
  const [clanci, setClanci] = useState<Clanak[]>([])
  const [loading, setLoading] = useState(true)
  const [activeKat, setActiveKat] = useState('')

  useEffect(() => {
    fetch('/api/stranice?tip=clanak')
      .then(r => r.json())
      .then(d => { setClanci(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const kategorije = [...new Set(clanci.map(c => c.kategorija).filter(Boolean))] as string[]
  const filtered = activeKat ? clanci.filter(c => c.kategorija === activeKat) : clanci
  const istaknuti = filtered.filter(c => c.istaknuto)
  const ostali = filtered.filter(c => !c.istaknuto)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>Vijesti i članci</h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', margin: 0 }}>Novosti, savjeti i aktualnosti iz naše ponude</p>
        </div>

        {/* Kategorije filter */}
        {kategorije.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveKat('')} style={{ padding: '6px 16px', border: '1px solid ' + (!activeKat ? 'var(--brand)' : 'var(--border)'), borderRadius: '100px', background: !activeKat ? 'var(--brand-pale)' : 'white', color: !activeKat ? 'var(--brand)' : 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              Sve
            </button>
            {kategorije.map(k => (
              <button key={k} onClick={() => setActiveKat(k)} style={{ padding: '6px 16px', border: '1px solid ' + (activeKat === k ? 'var(--brand)' : 'var(--border)'), borderRadius: '100px', background: activeKat === k ? 'var(--brand-pale)' : 'white', color: activeKat === k ? 'var(--brand)' : 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                {k}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[1,2,3].map(i => <div key={i} style={{ height: '300px', background: '#F3F4F6', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <h2 style={{ fontSize: '20px', color: 'var(--text)', marginBottom: '8px' }}>Još nema članaka</h2>
            <p style={{ color: 'var(--text-muted)' }}>Dodaj prvi članak u Admin → Stranice i članci</p>
          </div>
        )}

        {/* Istaknuti članak */}
        {istaknuti.length > 0 && (
          <Link href={'/stranica/' + istaknuti[0].slug} style={{ textDecoration: 'none', display: 'block', marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', background: 'white', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
            >
              <div style={{ background: istaknuti[0].slika_url ? 'none' : 'linear-gradient(135deg, var(--brand-pale), var(--border))', minHeight: '280px', overflow: 'hidden' }}>
                {istaknuti[0].slika_url
                  ? <img src={istaknuti[0].slika_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px' }}>📰</div>
                }
              </div>
              <div style={{ padding: '36px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                  <span style={{ padding: '3px 10px', background: 'var(--brand)', color: 'white', borderRadius: '100px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Istaknuto</span>
                  {istaknuti[0].kategorija && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{istaknuti[0].kategorija}</span>}
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', margin: '0 0 10px', lineHeight: 1.3 }}>{istaknuti[0].naslov}</h2>
                {istaknuti[0].podnaslov && <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.6 }}>{istaknuti[0].podnaslov}</p>}
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  {istaknuti[0].autor_naziv && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={11} />{istaknuti[0].autor_naziv}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} />{new Date(istaknuti[0].created_at).toLocaleDateString('bs-BA')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand)', fontSize: '13px', fontWeight: 600 }}>
                  Čitaj više <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Grid ostalih */}
        {ostali.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {ostali.map(c => (
              <Link key={c.id} href={'/stranica/' + c.slug} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', height: '100%', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  <div style={{ height: '180px', background: c.slika_url ? 'none' : 'linear-gradient(135deg, var(--brand-pale), var(--border))', overflow: 'hidden', flexShrink: 0 }}>
                    {c.slika_url
                      ? <img src={c.slika_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>📰</div>
                    }
                  </div>
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {c.kategorija && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
                        {c.kategorija}
                      </span>
                    )}
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', lineHeight: 1.4 }}>{c.naslov}</h3>
                    {c.podnaslov && <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5, flex: 1 }}>{c.podnaslov}</p>}
                    <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                      {c.autor_naziv && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><User size={10} />{c.autor_naziv}</span>}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Calendar size={10} />{new Date(c.created_at).toLocaleDateString('bs-BA')}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  )
}

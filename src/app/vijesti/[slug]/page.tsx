'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { ChevronRight, Calendar, User, Tag } from 'lucide-react'

interface Stranica {
  id: string; slug: string; tip: string; naslov: string; podnaslov?: string
  sadrzaj?: string; slika_url?: string; kategorija?: string; tagovi?: string
  autor_naziv?: string; created_at: string; meta_naslov?: string; meta_opis?: string
}

export default function StranicaPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [stranica, setStranica] = useState<Stranica | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch('/api/stranice?slug=' + slug)
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json() })
      .then(d => { setStranica(d); setLoading(false) })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [slug])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ height: '40px', background: '#F3F4F6', borderRadius: '8px', width: '60%', marginBottom: '16px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '20px', background: '#F3F4F6', borderRadius: '6px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '20px', background: '#F3F4F6', borderRadius: '6px', width: '80%', animation: 'pulse 1.5s infinite' }} />
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header />
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>Stranica nije pronađena</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>Stranica "{slug}" ne postoji ili nije objavljena.</p>
        <Link href="/" style={{ padding: '10px 24px', background: 'var(--brand)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
          ← Nazad na shop
        </Link>
      </div>
    </div>
  )

  if (!stranica) return null

  const isClanak = stranica.tip === 'clanak'
  const tagList = stranica.tagovi ? stranica.tagovi.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header />

      {/* Hero slika ako postoji */}
      {stranica.slika_url && (
        <div style={{ width: '100%', height: '320px', position: 'relative', overflow: 'hidden' }}>
          <img src={stranica.slika_url} alt={stranica.naslov} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
        </div>
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Početna</Link>
          <ChevronRight size={12} />
          {isClanak && <><Link href="/vijesti" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Blog</Link><ChevronRight size={12} /></>}
          <span style={{ color: 'var(--text)' }}>{stranica.naslov}</span>
        </div>

        {/* Header članka */}
        {stranica.kategorija && (
          <div style={{ display: 'inline-block', padding: '4px 12px', background: 'var(--brand-pale)', color: 'var(--brand)', fontSize: '11px', fontWeight: 700, borderRadius: '100px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {stranica.kategorija}
          </div>
        )}

        <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text)', margin: '0 0 12px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          {stranica.naslov}
        </h1>

        {stranica.podnaslov && (
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
            {stranica.podnaslov}
          </p>
        )}

        {isClanak && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '24px', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
            {stranica.autor_naziv && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <User size={13} /> {stranica.autor_naziv}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <Calendar size={13} />
              {new Date(stranica.created_at).toLocaleDateString('bs-BA', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        )}

        {/* Sadržaj */}
        <div
          dangerouslySetInnerHTML={{ __html: stranica.sadrzaj || '' }}
          style={{ lineHeight: 1.8, color: 'var(--text)', fontSize: '16px' }}
          className="page-content"
        />

        {/* Tagovi */}
        {tagList.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <Tag size={14} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
            {tagList.map(tag => (
              <span key={tag} style={{ padding: '4px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '100px', fontSize: '12px', color: 'var(--text-muted)' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .page-content h1, .page-content h2, .page-content h3 { color: var(--text); font-weight: 700; margin: 2rem 0 1rem; line-height: 1.3; }
        .page-content h1 { font-size: 28px; } .page-content h2 { font-size: 22px; } .page-content h3 { font-size: 18px; }
        .page-content p { margin: 0 0 1.2rem; }
        .page-content ul, .page-content ol { padding-left: 24px; margin: 0 0 1.2rem; }
        .page-content li { margin-bottom: 6px; }
        .page-content a { color: var(--brand); }
        .page-content strong { font-weight: 700; color: var(--text); }
        .page-content blockquote { border-left: 3px solid var(--brand); padding-left: 16px; margin: 24px 0; color: var(--text-muted); font-style: italic; }
        .page-content hr { border: none; border-top: 1px solid var(--border); margin: 32px 0; }
        .page-content img { max-width: 100%; border-radius: 10px; margin: 16px 0; }
        .page-content table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .page-content th { background: var(--surface); padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 600; border-bottom: 2px solid var(--border); }
        .page-content td { padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 14px; }
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
      `}</style>
    </div>
  )
}

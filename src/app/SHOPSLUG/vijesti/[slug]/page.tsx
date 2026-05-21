'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { ChevronLeft, Calendar, User, Tag } from 'lucide-react'

interface Clanak {
  id: string; slug: string; naslov: string; podnaslov?: string
  sadrzaj?: string; slika_url?: string; kategorija?: string
  tagovi?: string; autor_naziv?: string; created_at: string
}

export default function ClanakPage() {
  const params = useParams()
  const shopSlug = params?.shopSlug as string || ''
  const slug = params?.slug as string || ''
  const [clanak, setClanak] = useState<Clanak | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/stranice?slug=${slug}&shop=${shopSlug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setClanak(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug, shopSlug])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header shopSlug={shopSlug} />
    </div>
  )

  if (!clanak) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header shopSlug={shopSlug} />
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Članak nije pronađen.</p>
        <Link href={`/${shopSlug}/vijesti`} style={{ color: 'var(--brand)', textDecoration: 'none' }}>← Vijesti</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <Header shopSlug={shopSlug} />
      <article style={{ flex: 1, maxWidth: '800px', width: '100%', margin: '0 auto', padding: '32px 24px 64px' }}>
        <Link href={`/${shopSlug}/vijesti`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '24px' }}>
          <ChevronLeft size={14} /> Vijesti
        </Link>
        {clanak.kategorija && <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{clanak.kategorija}</div>}
        <h1 style={{ fontSize: '36px', fontWeight: 900, color: 'var(--text)', margin: '0 0 14px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>{clanak.naslov}</h1>
        {clanak.podnaslov && <p style={{ fontSize: '18px', color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.6 }}>{clanak.podnaslov}</p>}
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={13} />{new Date(clanak.created_at).toLocaleDateString('bs-BA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          {clanak.autor_naziv && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><User size={13} />{clanak.autor_naziv}</span>}
          {clanak.tagovi && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Tag size={13} />{clanak.tagovi}</span>}
        </div>
        {clanak.slika_url && <img src={clanak.slika_url} alt={clanak.naslov} style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', borderRadius: '12px', marginBottom: '32px' }} />}
        {clanak.sadrzaj && <div style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text)' }} dangerouslySetInnerHTML={{ __html: clanak.sadrzaj }} />}
      </article>
      <Footer shopSlug={shopSlug} />
      <style>{`article img{max-width:100%;border-radius:8px;margin:16px 0} article h2{font-size:22px;font-weight:700;margin:28px 0 12px} article p{margin:0 0 16px} article ul,article ol{padding-left:24px;margin:0 0 16px}`}</style>
    </div>
  )
}

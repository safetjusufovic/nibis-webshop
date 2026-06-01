'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Stranica {
  id: string; slug: string; naslov: string; podnaslov?: string
  sadrzaj?: string; slika_url?: string
}

export default function StranicaPage() {
  const params = useParams()
  const shopSlug = params?.shopSlug as string || ''
  const slug = params?.slug as string || ''
  const [stranica, setStranica] = useState<Stranica | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/stranice?slug=${slug}&shop=${shopSlug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setStranica(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug, shopSlug])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header shopSlug={shopSlug} />
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px' }}>
        {[1,2,3].map(i => <div key={i} style={{ height: '20px', background: 'var(--border)', borderRadius: '4px', marginBottom: '10px', animation: 'pulse 1.5s infinite', width: i === 1 ? '50%' : '100%' }} />)}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )

  if (!stranica) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header shopSlug={shopSlug} />
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: 'var(--text-muted)' }}>Stranica nije pronađena.</p>
        <Link href={`/${shopSlug}`} style={{ color: 'var(--brand)', textDecoration: 'none' }}>← Nazad</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <Header shopSlug={shopSlug} />
      <article style={{ flex: 1, maxWidth: '860px', width: '100%', margin: '0 auto', padding: '40px 24px 64px' }}>
        <Link href={`/${shopSlug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '28px' }}>
          <ChevronLeft size={14} /> Nazad
        </Link>
        <h1 style={{ fontSize: '38px', fontWeight: 900, color: 'var(--text)', margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{stranica.naslov}</h1>
        {stranica.podnaslov && <p style={{ fontSize: '18px', color: 'var(--text-muted)', margin: '0 0 28px', lineHeight: 1.6, paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>{stranica.podnaslov}</p>}
        {stranica.slika_url && <img src={stranica.slika_url} alt={stranica.naslov} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '12px', marginBottom: '32px' }} />}
        {stranica.sadrzaj && <div style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--text)' }} dangerouslySetInnerHTML={{ __html: stranica.sadrzaj }} />}
      </article>
      <Footer shopSlug={shopSlug} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}} article img{max-width:100%;border-radius:8px;margin:16px 0} article h2{font-size:22px;font-weight:700;margin:28px 0 12px} article p{margin:0 0 16px} article ul,article ol{padding-left:24px;margin:0 0 16px}`}</style>
    </div>
  )
}

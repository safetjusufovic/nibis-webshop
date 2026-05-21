'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { ShoppingCart, Heart, ChevronLeft, Package, Tag, Barcode, Check, X } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useFavoriti } from '@/hooks/useFavoriti'
import { formatCijena, siteConfig } from '@/lib/config'

export default function ProizvodPage() {
  const params = useParams()
  const shopSlug = params?.shopSlug as string || ''
  const id = params?.id as string
  const [artikal, setArtikal] = useState<any>(null)
  const [stanje, setStanje] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [addedAnim, setAddedAnim] = useState(false)
  const { add } = useCart()
  const { rabat, user } = useAuth()
  const { favoriti, toggle: toggleFavorit } = useFavoriti()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const shopParam = shopSlug ? '?shop=' + shopSlug : ''
  const shopParamAmp = shopSlug ? '&shop=' + shopSlug : ''

  useEffect(() => {
    if (!id) return
    fetch('/api/artikli/' + id + shopParam)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setArtikal(d)
        setLoading(false)
        if (d?.id) {
          fetch(`/api/stanje?ids=${d.id}${shopParamAmp}`)
            .then(r => r.json())
            .then(sd => setStanje(sd.items?.[0] || null))
            .catch(() => {})
        }
      })
      .catch(() => setLoading(false))
  }, [id, shopSlug])

  const cijena = stanje?.mpcijena || artikal?.planskaMaloprodajnaCijena || 0
  const cijenaVP = stanje?.vpcijena || artikal?.planskaVeleprodajnaCijena || 0
  const cijenaRabat = rabat && cijenaVP ? cijenaVP * (1 - rabat / 100) : null
  const finalCijena = cijenaRabat || cijena
  const kolicina = stanje?.raspolozivaKolicina ?? 0
  const uFavoritima = favoriti.some((f: any) => f.id === artikal?.id)

  function handleDodaj() {
    if (!user) { setShowLoginPrompt(true); return }
    if (!artikal) return
    add({ ...artikal, cijena: finalCijena }, qty)
    setAddedAnim(true)
    setTimeout(() => setAddedAnim(false), 2000)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header shopSlug={shopSlug} />
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {[1,2].map(i => <div key={i} style={{ height: '400px', background: 'var(--border)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />)}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )

  if (!artikal) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header shopSlug={shopSlug} />
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>Artikal nije pronađen.</p>
        <Link href={`/${shopSlug}`} style={{ color: 'var(--brand)', textDecoration: 'none' }}>← Nazad na katalog</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <Header shopSlug={shopSlug} />
      <div style={{ flex: 1, maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <Link href={`/${shopSlug}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Katalog</Link>
          {artikal.grupaId && <><span>›</span><Link href={`/${shopSlug}/?grupaId=${artikal.grupaId}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{artikal.grupa?.naziv || 'Kategorija'}</Link></>}
          <span>›</span><span style={{ color: 'var(--text)' }}>{artikal.naziv}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>
          {/* Slika */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '320px' }}>
            {artikal.slika_url
              ? <img src={artikal.slika_url} alt={artikal.naziv} style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain' }} />
              : <div style={{ fontSize: '64px', opacity: 0.2 }}>📦</div>
            }
          </div>

          {/* Info */}
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', margin: '0 0 8px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>{artikal.naziv}</h1>
            {artikal.naziv2 && <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 16px' }}>{artikal.naziv2}</p>}

            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {artikal.sifra && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}><Tag size={12} /> {artikal.sifra}</span>}
              {artikal.barkod && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}><Barcode size={12} /> {artikal.barkod}</span>}
            </div>

            {/* Cijena */}
            <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--brand)', letterSpacing: '-0.02em' }}>{formatCijena(finalCijena)}</div>
              {cijenaRabat && <div style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatCijena(cijena)}</div>}
              {rabat && <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Vaš rabat: {rabat}%</div>}
            </div>

            {/* Stanje */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '14px' }}>
              {kolicina > 0
                ? <><Check size={16} style={{ color: '#10b981' }} /><span style={{ color: '#10b981', fontWeight: 600 }}>Na stanju ({kolicina} {artikal.jedinicaMjere || 'kom'})</span></>
                : <><X size={16} style={{ color: '#ef4444' }} /><span style={{ color: '#ef4444', fontWeight: 600 }}>Nije na stanju</span></>
              }
            </div>

            {/* Qty + Dodaj */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'white' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: '40px', height: '48px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text)' }}>−</button>
                <span style={{ width: '40px', textAlign: 'center', fontSize: '15px', fontWeight: 600 }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} style={{ width: '40px', height: '48px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text)' }}>+</button>
              </div>
              <button onClick={handleDodaj} style={{ flex: 1, height: '48px', background: addedAnim ? '#10b981' : 'var(--brand)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}>
                {addedAnim ? <><Check size={16} /> Dodano!</> : <><ShoppingCart size={16} /> Dodaj u korpu</>}
              </button>
              <button onClick={() => artikal && toggleFavorit(artikal)} style={{ width: '48px', height: '48px', border: '1px solid var(--border)', borderRadius: '10px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={18} style={{ color: uFavoritima ? '#ef4444' : 'var(--text-muted)', fill: uFavoritima ? '#ef4444' : 'none' }} />
              </button>
            </div>

            {showLoginPrompt && (
              <div style={{ padding: '12px 16px', background: '#FEF3C7', borderRadius: '10px', fontSize: '13px', color: '#92400E' }}>
                <Link href={`/${shopSlug}/login`} style={{ color: 'var(--brand)', fontWeight: 600 }}>Prijavite se</Link> da biste dodali artikal u korpu.
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer shopSlug={shopSlug} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

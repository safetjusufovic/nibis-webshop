'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { shopLink } from '@/lib/useShopLink'
import { ShoppingCart, Heart, ChevronLeft, Package, Tag, Barcode, Layers, Check, X } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useFavoriti } from '@/hooks/useFavoriti'
import { formatCijena, siteConfig } from '@/lib/config'

export default function ProizvodPage() {
  const params = useParams()
  const id = params?.id as string
  const [artikal, setArtikal] = useState<any>(null)
  const [stanje, setStanje] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [addedAnim, setAddedAnim] = useState(false)
  const { cart, add } = useCart()
  const { rabat, user } = useAuth()
  const { favoriti, toggle: toggleFavorit } = useFavoriti()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch('/api/artikli/' + id)
      .then(r => r.ok ? r.json() : null)
      .then(a => {
        if (!a || a.error) { setLoading(false); return }
        setArtikal(a)
        return fetch('/api/stanje?ids=' + id).then(r => r.ok ? r.json() : null)
      })
      .then(s => {
        if (s?.items) {
          const found = s.items.find((x: any) => x.artikalId === parseInt(id))
          setStanje(found || null)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
        {[0,1].map(i => <div key={i} style={{ height: '400px', background: 'var(--border)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />)}
      </div>
    </div>
  )

  if (!artikal) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header />
      <div style={{ maxWidth: '500px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <Package size={48} style={{ color: 'var(--border)', marginBottom: '16px' }} />
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>Artikal nije pronađen</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Artikal #{id} ne postoji ili je uklonjen iz sistema.</p>
        <Link href={shopLink("/")} style={{ padding: '10px 24px', background: 'var(--brand)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Nazad na katalog</Link>
      </div>
    </div>
  )

  const akcijaPopust = artikal.akcija_popust ?? 0
  const akcijaDo = artikal.akcija_do
  const akcijaAktivna = akcijaPopust > 0 && (!akcijaDo || new Date(akcijaDo) > new Date())
  const cijenaBase = stanje ? stanje[siteConfig.tipCijene] ?? stanje.planMalCijena ?? 0 : artikal.planskaMaloprodajnaCijena ?? 0
  const popust = akcijaAktivna ? akcijaPopust : rabat
  const cijena = popust > 0 ? Math.round(cijenaBase * (1 - popust / 100) * 100) / 100 : cijenaBase
  const maxQty = stanje?.raspolozivaKolicina ?? 0
  const naStanju = maxQty > 0
  const inCart = cart[artikal.id]?.qty ?? 0
  const isFav = favoriti.has(artikal.id)

  function handleAdd() {
    if (!naStanju) return
    if (!user) { setShowLoginPrompt(true); return }
    const toAdd = Math.min(qty, maxQty - inCart)
    if (toAdd <= 0) return
    for (let i = 0; i < toAdd; i++) add(artikal, cijenaBase, stanje)
    setAddedAnim(true)
    setTimeout(() => setAddedAnim(false), 1500)
    setQty(1)
  }

  const slika = artikal.slika_url || null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Header />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 24px 64px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          <Link href={shopLink("/")} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
            Katalog
          </Link>
          <ChevronLeft size={12} style={{ transform: 'rotate(180deg)' }} />
          {artikal.grupa?.naziv && (
            <>
              <Link href={shopLink('/?grupaId=' + artikal.grupaId)} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
                {artikal.grupa.naziv}
              </Link>
              <ChevronLeft size={12} style={{ transform: 'rotate(180deg)' }} />
            </>
          )}
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{artikal.naziv}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>

          {/* Slika */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border)', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '32px', position: 'relative' }}>
              {slika ? (
                <img src={slika} alt={artikal.naziv} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--border)' }}>
                  <Package size={64} />
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Slika nije dostupna</span>
                </div>
              )}
              {akcijaAktivna && (
                <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'var(--akcija, #DC2626)', color: 'white', fontSize: '13px', fontWeight: 800, padding: '5px 12px', borderRadius: '100px' }}>
                  AKCIJA -{akcijaPopust}%
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Naziv i šifra */}
            <div>
              {artikal.grupa?.naziv && (
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  {artikal.grupa.naziv}
                </div>
              )}
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text)', margin: '0 0 12px', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
                {artikal.naziv}
              </h1>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <Barcode size={13} /> Šifra: <strong style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{artikal.sifra}</strong>
                </span>
                {artikal.barcode && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <Tag size={13} /> Barcode: <strong style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{artikal.barcode}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Cijena */}
            <div style={{ padding: '20px 24px', background: 'white', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
                <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  {formatCijena(cijena)}
                </span>
                {popust > 0 && (
                  <span style={{ fontSize: '18px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    {formatCijena(cijenaBase)}
                  </span>
                )}
                {popust > 0 && (
                  <span style={{ fontSize: '13px', fontWeight: 700, background: akcijaAktivna ? '#FEE2E2' : 'var(--brand-pale)', color: akcijaAktivna ? '#DC2626' : 'var(--brand)', padding: '3px 10px', borderRadius: '100px' }}>
                    -{popust}%
                  </span>
                )}
              </div>
              {artikal.procPoreza > 0 && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px' }}>
                  + PDV {artikal.procPoreza}% = {formatCijena(cijena * (1 + artikal.procPoreza / 100))}
                </p>
              )}
              {/* Stanje */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                {stanje === undefined ? null : naStanju ? (
                  <>
                    <Check size={14} style={{ color: 'var(--brand)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--brand)' }}>Na stanju</span>
                    {maxQty <= 5 && <span style={{ fontSize: '11px', color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: '100px' }}>Zadnje {maxQty} kom</span>}
                  </>
                ) : (
                  <>
                    <X size={14} style={{ color: '#EF4444' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#EF4444' }}>Nema na stanju</span>
                  </>
                )}
              </div>
            </div>

            {/* Qty + Dodaj */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'white' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: '40px', height: '48px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <input type="number" min={1} max={maxQty} value={qty} onChange={e => setQty(Math.max(1, Math.min(maxQty, parseInt(e.target.value) || 1)))}
                  style={{ width: '52px', height: '48px', textAlign: 'center', border: 'none', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', fontSize: '15px', fontWeight: 600, fontFamily: 'inherit', outline: 'none', background: 'white', color: 'var(--text)' }} />
                <button onClick={() => setQty(q => Math.min(maxQty, q + 1))} style={{ width: '40px', height: '48px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>

              <button onClick={handleAdd} disabled={!naStanju}
                style={{ flex: 1, height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, fontFamily: 'inherit', border: 'none', borderRadius: '10px', cursor: naStanju ? 'pointer' : 'not-allowed', background: addedAnim ? '#059669' : naStanju ? 'var(--brand)' : '#F1F5F9', color: naStanju ? 'white' : '#94A3B8', transition: 'all 0.2s', boxShadow: naStanju ? '0 4px 16px var(--brand-pale)' : 'none' }}>
                {addedAnim ? <><Check size={16} /> Dodano!</> : !naStanju ? 'Nema na stanju' : <><ShoppingCart size={16} /> Dodaj u korpu{inCart > 0 ? ' (' + inCart + ')' : ''}</>}
              </button>

              <button onClick={() => toggleFavorit(artikal.id)}
                style={{ width: '48px', height: '48px', border: '1px solid var(--border)', borderRadius: '10px', background: isFav ? '#FEF2F2' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
                <Heart size={18} style={{ color: isFav ? '#DC2626' : 'var(--text-muted)' }} fill={isFav ? '#DC2626' : 'none'} />
              </button>
            </div>

            {/* Specifikacije */}
            {(artikal.jedinicaMjere || artikal.procPoreza || artikal.tarBroj) && (
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={13} /> Specifikacije
                </div>
                <div style={{ padding: '4px 0' }}>
                  {[
                    { label: 'Šifra', value: artikal.sifra },
                    { label: 'Jedinica mjere', value: artikal.jedinicaMjere },
                    { label: 'Porezna stopa', value: artikal.procPoreza ? artikal.procPoreza + '%' : null },
                    { label: 'Tarifni broj', value: artikal.tarBroj },
                    { label: 'Kategorija', value: artikal.grupa?.naziv },
                  ].filter(r => r.value).map((row, i) => (
                    <div key={i} style={{ display: 'flex', padding: '10px 20px', borderBottom: '1px solid var(--border)', gap: '16px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', width: '140px', flexShrink: 0 }}>{row.label}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login modal */}
      {showLoginPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLoginPrompt(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '380px', width: '100%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛒</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>Prijava potrebna</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>Za narudžbu je potrebna prijava ili registracija.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setShowLoginPrompt(false)} style={{ padding: '10px 20px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>Zatvori</button>
              <a href={shopLink("/login")} style={{ padding: '10px 24px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Prijava →</a>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )
}

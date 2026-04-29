'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Package, ArrowLeft, ShoppingCart, Plus, Minus, Truck, Shield, RotateCcw, Info } from 'lucide-react'
import Header from '@/components/layout/Header'
import AuthGuard from '@/components/auth/AuthGuard'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { formatCijena, siteConfig } from '@/lib/config'

interface ArtikalDB {
  id: number; sifra: string; barkod: string | null; naziv: string; naziv2: string | null
  opis: string | null; aktivan: boolean; van_upotrebe: boolean; proc_poreza: number
  planska_maloprodajna_cijena: number; planska_veleprodajna_cijena: number
  slika_url: string | null; grupa_id: number | null
  dobavljac_naziv: string | null; proizvodjac_naziv: string | null
  grupe: { id: number; sifra: string; naziv: string } | null
}

interface StanjeDB {
  id: number; artikal_id: number; org_jed_id: number; raspoloziva_kolicina: number
  nabavna_cijena: number; vpcijena: number; mpcijena: number
}

export default function ProizvodPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { cart, add } = useCart()
  const { rabat } = useAuth()

  const [artikal, setArtikal] = useState<ArtikalDB | null>(null)
  const [stanje, setStanje] = useState<StanjeDB | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    async function load() {
      const { data: a } = await supabase
        .from('artikli')
        .select('*, grupe:grupa_id(id, sifra, naziv)')
        .eq('id', id)
        .single()
      if (!a) { router.replace('/'); return }
      setArtikal(a as ArtikalDB)
      const { data: s } = await supabase
        .from('stanje_skladista')
        .select('*')
        .eq('artikal_id', id)
        .eq('org_jed_id', siteConfig.orgJedId)
        .single()
      setStanje(s as StanjeDB | null)
      setLoading(false)
    }
    load()
  }, [id, router])

  if (loading) return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
        <Header />
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ height: '16px', background: 'var(--border)', borderRadius: '8px', width: '120px', marginBottom: '24px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div style={{ paddingTop: '100%', background: 'var(--border)', borderRadius: '14px', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'var(--surface)', borderRadius: '14px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[60, 40, 80, 30].map((w, i) => (
                <div key={i} style={{ height: i === 0 ? '28px' : '16px', background: 'var(--border)', borderRadius: '8px', width: `${w}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )

  if (!artikal) return null

  const cijenaOriginal = stanje
    ? (siteConfig.tipCijene === 'mpcijena' ? stanje.mpcijena : stanje.vpcijena)
    : artikal.planska_maloprodajna_cijena ?? 0
  const cijena = rabat > 0 ? cijenaOriginal * (1 - rabat / 100) : cijenaOriginal

  const canAdd = stanje ? stanje.raspoloziva_kolicina > 0 : false
  const inCart = cart[artikal.id]?.qty ?? 0
  const maxQty = stanje?.raspoloziva_kolicina ?? 0

  function handleAdd() {
    if (!canAdd) return
    const artikalNorm = {
      id: artikal!.id, sifra: artikal!.sifra, naziv: artikal!.naziv, naziv2: artikal!.naziv2,
      barkod: artikal!.barkod, opis: artikal!.opis, aktivan: artikal!.aktivan,
      vanUpotrebe: artikal!.van_upotrebe, procPoreza: artikal!.proc_poreza,
      planskaMaloprodajnaCijena: artikal!.planska_maloprodajna_cijena,
      grupaId: artikal!.grupa_id, grupa: artikal!.grupe, kataloskiBroj: null, napomena: null,
    }
    const stanjeNorm = stanje ? {
      id: stanje.id, artikalId: stanje.artikal_id, orgJedId: stanje.org_jed_id,
      raspolozivaKolicina: stanje.raspoloziva_kolicina, nabavnaCijena: stanje.nabavna_cijena,
      vpcijena: stanje.vpcijena, mpcijena: stanje.mpcijena,
      skladisnoMjesto: null, dateCreated: '', dateModified: '',
    } : null
    // Add qty times
    for (let i = 0; i < Math.min(qty, maxQty - inCart); i++) {
      add(artikalNorm as any, cijenaOriginal, stanjeNorm)
    }
  }

  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
        <Header />

        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 64px' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '13px' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeft size={13} /> Katalog
            </Link>
            {artikal.grupe && (
              <>
                <span style={{ color: 'var(--border)' }}>/</span>
                <span style={{ color: 'var(--text-muted)' }}>{artikal.grupe.naziv}</span>
              </>
            )}
            <span style={{ color: 'var(--border)' }}>/</span>
            <span style={{ color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {artikal.naziv}
            </span>
          </div>

          {/* Product layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }} className="product-grid">

            {/* Image */}
            <div style={{
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              overflow: 'hidden',
              position: 'relative',
              paddingTop: '85%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                {artikal.slika_url ? (
                  <Image src={artikal.slika_url} alt={artikal.naziv} fill style={{ objectFit: 'contain', padding: '20px' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#D1DDD9' }}>
                    <Package size={56} />
                    <span style={{ fontSize: '13px', color: '#9CACA6' }}>{artikal.grupe?.naziv ?? 'Artikal'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Header info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', padding: '3px 9px', borderRadius: '6px' }}>
                    {artikal.sifra}
                  </span>
                  {artikal.grupe && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--brand-pale)', padding: '3px 9px', borderRadius: '6px', color: 'var(--brand)' }}>
                      {artikal.grupe.naziv}
                    </span>
                  )}
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, margin: 0 }}>
                  {artikal.naziv}
                </h1>
                {artikal.naziv2 && (
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
                    {artikal.naziv2}
                  </p>
                )}
              </div>

              {/* Price */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '18px',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                    {formatCijena(cijena)}
                  </span>
                  {rabat > 0 && (
                    <span style={{ fontSize: '18px', color: '#9CACA6', textDecoration: 'line-through' }}>
                      {formatCijena(cijenaOriginal)}
                    </span>
                  )}
                  {rabat > 0 && (
                    <span style={{ background: '#DC2626', color: 'white', fontSize: '12px', fontWeight: 700, padding: '3px 9px', borderRadius: '100px' }}>
                      -{rabat}%
                    </span>
                  )}
                </div>
                {artikal.proc_poreza > 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                    Cijena uključuje PDV {artikal.proc_poreza}%
                  </p>
                )}

                {/* Stock */}
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!stanje || stanje.raspoloziva_kolicina <= 0 ? (
                    <span className="badge-out-stock">Nema na stanju</span>
                  ) : stanje.raspoloziva_kolicina <= 3 ? (
                    <span className="badge-low-stock">Zadnje {stanje.raspoloziva_kolicina} kom</span>
                  ) : (
                    <span className="badge-in-stock">Na stanju — {stanje.raspoloziva_kolicina} kom</span>
                  )}
                </div>
              </div>

              {/* Qty + Add */}
              {canAdd && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: 'white',
                  }}>
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      style={{ padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1 }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ padding: '10px 16px', fontSize: '15px', fontWeight: 600, minWidth: '50px', textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(q => Math.min(maxQty - inCart, q + 1))}
                      disabled={qty >= maxQty - inCart}
                      style={{ padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1 }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={handleAdd}
                    disabled={inCart + qty > maxQty}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      background: inCart + qty > maxQty ? 'var(--surface)' : 'var(--brand)',
                      color: inCart + qty > maxQty ? 'var(--text-muted)' : 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 500,
                      fontFamily: 'inherit',
                      cursor: inCart + qty > maxQty ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (inCart + qty <= maxQty) (e.currentTarget as HTMLElement).style.background = 'var(--brand-dark)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = inCart + qty > maxQty ? 'var(--surface)' : 'var(--brand)' }}
                  >
                    <ShoppingCart size={16} />
                    {inCart > 0 ? `Dodaj još (${inCart} u korpi)` : 'Dodaj u korpu'}
                  </button>
                </div>
              )}

              {!canAdd && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 16px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#991B1B',
                }}>
                  <Info size={15} />
                  Ovaj artikal trenutno nije dostupan
                </div>
              )}

              {/* Info badges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { icon: <Truck size={16} />, label: 'Isporuka', value: 'Naredni radni dan' },
                  { icon: <Shield size={16} />, label: 'Jamstvo', value: 'Garancija proizvođača' },
                  { icon: <RotateCcw size={16} />, label: 'Povrat', value: '14 dana' },
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '14px 10px',
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <span style={{ color: 'var(--brand)' }}>{item.icon}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Specs */}
              <div style={{
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Detalji
                  </span>
                </div>
                <div>
                  {[
                    artikal.barkod && { label: 'Barkod', value: artikal.barkod },
                    artikal.dobavljac_naziv && { label: 'Dobavljač', value: artikal.dobavljac_naziv },
                    artikal.proizvodjac_naziv && { label: 'Proizvođač', value: artikal.proizvodjac_naziv },
                    artikal.grupe && { label: 'Kategorija', value: artikal.grupe.naziv },
                  ].filter(Boolean).map((item: any) => (
                    <div key={item.label} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '11px 16px',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '14px',
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                      <span style={{ color: 'var(--text)', fontWeight: 500, fontFamily: item.label === 'Barkod' ? 'DM Mono, monospace' : 'inherit', fontSize: item.label === 'Barkod' ? '13px' : '14px' }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {artikal.opis && (
            <div style={{
              marginTop: '40px',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Opis artikla</span>
              </div>
              <div style={{ padding: '24px', fontSize: '15px', color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {artikal.opis}
              </div>
            </div>
          )}
        </main>

        <style>{`
          @media (max-width: 768px) {
            .product-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </AuthGuard>
  )
}

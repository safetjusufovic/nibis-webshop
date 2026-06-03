'use client'

import { useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Package, Plus, Heart } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useFavoriti } from '@/hooks/useFavoriti'
import { useAuth } from '@/hooks/useAuth'
import { formatCijena, siteConfig } from '@/lib/config'
import type { Artikal, StanjeSkladista } from '@/types/nibis'

function buildHref(shopSlug: string, path: string): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    const isCustom = !['nibis-webshop.vercel.app', 'localhost', '127.0.0.1'].includes(host) && !host.endsWith('.vercel.app')
    if (isCustom) return path
  }
  if (!shopSlug) return path
  return '/' + shopSlug + (path === '/' ? '' : path)
}


interface Props {
  shopSlug?: string
  artikal: Artikal
  stanje: StanjeSkladista | null | undefined
  slika?: string
}

function StockBadge({ stanje }: { stanje: StanjeSkladista | null | undefined }) {
  if (stanje === undefined) return null
  if (!stanje || stanje.raspolozivaKolicina <= 0)
    return <span className="badge-out-stock">Nema na stanju</span>
  if (stanje.raspolozivaKolicina <= 3)
    return <span className="badge-low-stock">Zadnje {stanje.raspolozivaKolicina} kom</span>
  return <span className="badge-in-stock">Na stanju</span>
}

export default function ProductCard({ artikal, stanje, slika, shopSlug = '' }: Props) {
  const { cart, add } = useCart()
  const { favoriti, toggle: toggleFavorit } = useFavoriti()
  const { rabat } = useAuth()
  const inCart = cart[artikal.id]?.qty ?? 0
  const [qty, setQty] = useState(1)

  const cijenaBase = stanje
    ? stanje[siteConfig.tipCijene]
    : artikal.planskaMaloprodajnaCijena ?? 0

  // Akcija popust (iz admina) ima prioritet nad partner rabatom
  const akcijaPopust = (artikal as any).akcija_popust ?? 0
  const akcijaDo = (artikal as any).akcija_do
  const akcijaAktivna = akcijaPopust > 0 && (!akcijaDo || new Date(akcijaDo) > new Date())

  const popust = akcijaAktivna ? akcijaPopust : rabat
  const cijenaOriginal = cijenaBase
  const cijena = popust > 0 ? Math.round(cijenaOriginal * (1 - popust / 100) * 100) / 100 : cijenaOriginal

  const maxQty = stanje?.raspolozivaKolicina ?? 0
  const canAdd = maxQty > 0
  const unavailable = stanje !== undefined && maxQty <= 0

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    if (!canAdd) return
    const toAdd = Math.min(qty, maxQty - inCart)
    if (toAdd <= 0) return
    for (let i = 0; i < toAdd; i++) add(artikal, cijenaOriginal, stanje ?? null)
    setQty(1)
  }

  return (
    <Link
      href={buildHref(shopSlug, `/proizvod/${artikal.id}`)}
      style={{ textDecoration: 'none' }}
    >
      <article style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        cursor: 'pointer',
        opacity: unavailable ? 0.65 : 1,
      }}
        onMouseEnter={e => {
          if (unavailable) return
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(-3px)'
          el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'
          el.style.borderColor = '#B8D4CB'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'none'
          el.style.boxShadow = 'none'
          el.style.borderColor = 'var(--border)'
        }}
      >
        {/* Image */}
        <div style={{
          position: 'relative',
          background: 'var(--surface)',
          paddingTop: '72%',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {slika ? (
              <Image
                src={slika}
                alt={artikal.naziv}
                fill
                style={{ objectFit: 'contain', padding: '12px', transition: 'transform 0.3s ease' }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#D1DDD9' }}>
                <Package size={28} />
                {artikal.grupa?.naziv && (
                  <span style={{ fontSize: '10px', color: '#9CACA6', textAlign: 'center', padding: '0 8px' }}>
                    {artikal.grupa.naziv}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Badges */}
          {/* Favorit dugme */}
          <button
            onClick={e => { e.preventDefault(); toggleFavorit(artikal.id) }}
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: favoriti.has(artikal.id) ? '#FEF2F2' : 'rgba(255,255,255,0.9)',
              border: favoriti.has(artikal.id) ? '1px solid #FECACA' : '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s',
              zIndex: 1,
            }}
          >
            <Heart
              size={13}
              style={{ color: favoriti.has(artikal.id) ? '#DC2626' : '#9CACA6' }}
              fill={favoriti.has(artikal.id) ? '#DC2626' : 'none'}
            />
          </button>

          {inCart > 0 && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'var(--brand)',
              color: 'white',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '100px',
              minWidth: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 6px',
              boxShadow: '0 2px 6px var(--brand-pale)',
            }}>
              {inCart}
            </div>
          )}
          {popust > 0 && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: akcijaAktivna ? 'var(--akcija, #DC2626)' : 'var(--brand)',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '100px',
            }}>
              {akcijaAktivna ? 'AKCIJA' : ''} -{popust}%
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#9CACA6', fontFamily: 'DM Mono, monospace', marginBottom: '4px' }}>
              {artikal.sifra}
            </div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text)',
              lineHeight: 1.4,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {artikal.naziv}
            </h3>
          </div>

          {/* Price row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                {formatCijena(cijena)}
              </div>
              {popust > 0 && (
                <div style={{ fontSize: '12px', color: '#9CACA6', textDecoration: 'line-through', marginTop: '2px' }}>
                  {formatCijena(cijenaOriginal)}
                </div>
              )}
              {artikal.procPoreza > 0 && (
                <div style={{ fontSize: '11px', color: '#9CACA6', marginTop: '1px' }}>
                  + PDV {artikal.procPoreza}%
                </div>
              )}
            </div>
            <StockBadge stanje={stanje} />
          </div>

          {/* Qty + Add button */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="number"
              min={1}
              max={maxQty}
              value={qty}
              onClick={e => e.preventDefault()}
              onChange={e => setQty(Math.max(1, Math.min(maxQty, parseInt(e.target.value) || 1)))}
              disabled={!canAdd}
              style={{
                width: '52px',
                height: '36px',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'inherit',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                outline: 'none',
                background: 'white',
                color: '#1a202c',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                opacity: canAdd ? 1 : 0.4,
              }}
            />
            <button
              onClick={handleAdd}
              disabled={!canAdd || inCart + qty > maxQty}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                height: '36px',
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: 'inherit',
                border: 'none',
                borderRadius: '8px',
                cursor: (!canAdd || inCart + qty > maxQty) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                background: canAdd && inCart + qty <= maxQty
                  ? 'var(--brand)'
                  : '#F1F5F9',
                color: canAdd && inCart + qty <= maxQty ? 'white' : '#94a3b8',
                boxShadow: canAdd && inCart + qty <= maxQty
                  ? '0 2px 8px var(--brand-pale)'
                  : 'none',
              }}
              onMouseEnter={e => {
                if (!canAdd || inCart + qty > maxQty) return
                const el = e.currentTarget as HTMLElement
                el.style.filter = 'brightness(1.1)'
                el.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.filter = ''
                el.style.transform = 'none'
              }}
            >
              {!canAdd ? (
                <>Nema na stanju</>
              ) : inCart + qty > maxQty ? (
                <>Maks. kol.</>
              ) : (
                <><ShoppingCart size={12} /> {inCart > 0 ? 'Dodaj još' : 'Dodaj'}</>
              )}
            </button>
          </div>
        </div>
      </article>
    </Link>
  )
}

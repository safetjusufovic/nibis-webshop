'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Package, Plus } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { formatCijena, siteConfig } from '@/lib/config'
import type { Artikal, StanjeSkladista } from '@/types/nibis'

interface Props {
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

export default function ProductCard({ artikal, stanje, slika }: Props) {
  const { cart, add } = useCart()
  const { rabat } = useAuth()
  const inCart = cart[artikal.id]?.qty ?? 0

  const cijenaOriginal = stanje
    ? stanje[siteConfig.tipCijene]
    : artikal.planskaMaloprodajnaCijena ?? 0
  const cijena = rabat > 0 ? cijenaOriginal * (1 - rabat / 100) : cijenaOriginal

  const canAdd = stanje ? stanje.raspolozivaKolicina > 0 : false
  const atMax = stanje ? inCart >= stanje.raspolozivaKolicina : false
  const unavailable = stanje !== undefined && (!stanje || stanje.raspolozivaKolicina <= 0)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    if (!canAdd || atMax) return
    add(artikal, cijenaOriginal, stanje ?? null)
  }

  return (
    <Link
      href={`/proizvod/${artikal.id}`}
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
              boxShadow: '0 2px 6px rgba(15,110,86,0.3)',
            }}>
              {inCart}
            </div>
          )}
          {rabat > 0 && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: '#DC2626',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '100px',
            }}>
              -{rabat}%
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
              {rabat > 0 && (
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

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={!canAdd || atMax}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              padding: '9px',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'inherit',
              border: 'none',
              borderRadius: '9px',
              cursor: (!canAdd || atMax) ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              background: inCart > 0
                ? 'var(--brand-pale)'
                : canAdd && !atMax
                ? 'var(--brand)'
                : 'var(--surface)',
              color: inCart > 0
                ? 'var(--brand)'
                : canAdd && !atMax
                ? 'white'
                : '#9CACA6',
              boxShadow: (canAdd && !atMax && inCart === 0) ? '0 1px 3px rgba(15,110,86,0.2)' : 'none',
            }}
            onMouseEnter={e => {
              if (!canAdd || atMax) return
              const el = e.currentTarget as HTMLElement
              el.style.background = inCart > 0 ? '#D4EDE6' : 'var(--brand-dark)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = inCart > 0 ? 'var(--brand-pale)' : canAdd && !atMax ? 'var(--brand)' : 'var(--surface)'
            }}
          >
            {atMax ? (
              <>Maks. kol.</>
            ) : inCart > 0 ? (
              <><Plus size={13} /> Dodaj još ({inCart} u korpi)</>
            ) : canAdd ? (
              <><ShoppingCart size={13} /> Dodaj u korpu</>
            ) : (
              <>Nema na stanju</>
            )}
          </button>
        </div>
      </article>
    </Link>
  )
}

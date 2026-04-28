'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Package } from 'lucide-react'
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
  if (stanje === undefined) return <span className="badge-in-stock">Učitavam...</span>
  if (!stanje || stanje.raspolozivaKolicina <= 0) return <span className="badge-out-stock">Nema</span>
  if (stanje.raspolozivaKolicina <= 3) return <span className="badge-low-stock">{stanje.raspolozivaKolicina} kom</span>
  return <span className="badge-in-stock">{stanje.raspolozivaKolicina} kom</span>
}

export default function ProductCard({ artikal, stanje, slika }: Props) {
  const { cart, add } = useCart()
  const { rabat } = useAuth()
  const inCart = cart[artikal.id]?.qty ?? 0

  const cijenaOriginal = stanje
    ? stanje[siteConfig.tipCijene]
    : artikal.planskaMaloprodajnaCijena ?? 0

  const cijenaKupca = rabat > 0
    ? cijenaOriginal * (1 - rabat / 100)
    : cijenaOriginal

  const canAdd = stanje ? stanje.raspolozivaKolicina > 0 : false
  const atMax = stanje ? inCart >= stanje.raspolozivaKolicina : false

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault() // ne idi na detalj pri klik na dugme
    if (!canAdd || atMax) return
    add(artikal, cijenaOriginal, stanje ?? null)
  }

  return (
    <Link href={`/proizvod/${artikal.id}`} className="card flex flex-col overflow-hidden hover:border-gray-200 transition-colors group">
      {/* Slika */}
      <div className="relative h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
        {slika ? (
          <Image src={slika} alt={artikal.naziv} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-300">
            <Package size={28} />
            <span className="text-xs">{artikal.grupa?.naziv ?? 'Artikal'}</span>
          </div>
        )}
        {inCart > 0 && (
          <div className="absolute top-2 right-2 bg-teal-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {inCart}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{artikal.naziv}</h3>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{artikal.sifra}</p>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-sm font-semibold text-gray-900">{formatCijena(cijenaKupca)}</span>
            {rabat > 0 && (
              <span className="text-xs text-gray-400 line-through ml-1">{formatCijena(cijenaOriginal)}</span>
            )}
          </div>
          <StockBadge stanje={stanje} />
        </div>

        {artikal.procPoreza > 0 && (
          <p className="text-xs text-gray-400">PDV {artikal.procPoreza}% uključen</p>
        )}

        <button
          onClick={handleAdd}
          disabled={!canAdd || atMax}
          className={`flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border ${
            inCart > 0
              ? 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
              : canAdd && !atMax
              ? 'border-teal-500 text-teal-600 hover:bg-teal-50'
              : 'border-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          {atMax ? 'Maks. kol.' : inCart > 0 ? `U korpi (${inCart})` : canAdd ? '+ Dodaj' : 'Nema'}
        </button>
      </div>
    </Link>
  )
}

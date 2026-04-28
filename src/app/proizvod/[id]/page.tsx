'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Package, ArrowLeft } from 'lucide-react'
import Header from '@/components/layout/Header'
import AuthGuard from '@/components/auth/AuthGuard'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { formatCijena, siteConfig } from '@/lib/config'

// Lokalni tip za artikal iz Supabase (snake_case kolone)
interface ArtikalDB {
  id: number
  sifra: string
  barkod: string | null
  naziv: string
  naziv2: string | null
  opis: string | null
  aktivan: boolean
  van_upotrebe: boolean
  proc_poreza: number
  planska_maloprodajna_cijena: number
  planska_veleprodajna_cijena: number
  slika_url: string | null
  grupa_id: number | null
  dobavljac_naziv: string | null
  proizvodjac_naziv: string | null
  grupe: { id: number; sifra: string; naziv: string } | null
}

interface StanjeDB {
  id: number
  artikal_id: number
  org_jed_id: number
  raspoloziva_kolicina: number
  nabavna_cijena: number
  vpcijena: number
  mpcijena: number
}

export default function ProizvodPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { cart, add } = useCart()
  const { rabat } = useAuth()

  const [artikal, setArtikal] = useState<ArtikalDB | null>(null)
  const [stanje, setStanje] = useState<StanjeDB | null>(null)
  const [loading, setLoading] = useState(true)

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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-32 mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-80 bg-gray-100 rounded-xl" />
            <div className="space-y-4">
              <div className="h-6 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )

  if (!artikal) return null

  // Cijena ovisno o tipu (mp/vp) i rabatu
  const cijenaOriginal = stanje
    ? (siteConfig.tipCijene === 'mpcijena' ? stanje.mpcijena : stanje.vpcijena)
    : artikal.planska_maloprodajna_cijena ?? 0
  const cijenaKupca = rabat > 0 ? cijenaOriginal * (1 - rabat / 100) : cijenaOriginal

  const canAdd = stanje ? stanje.raspoloziva_kolicina > 0 : false
  const inCart = cart[artikal.id]?.qty ?? 0
  const atMax = stanje ? inCart >= stanje.raspoloziva_kolicina : false

  function handleAdd() {
    if (!canAdd || atMax) return
    // Normaliziramo DB objekat (snake_case) u camelCase za korpu
    const artikalNorm = {
      id: artikal!.id,
      sifra: artikal!.sifra,
      naziv: artikal!.naziv,
      naziv2: artikal!.naziv2,
      barkod: artikal!.barkod,
      opis: artikal!.opis,
      aktivan: artikal!.aktivan,
      vanUpotrebe: artikal!.van_upotrebe,
      procPoreza: artikal!.proc_poreza,
      planskaMaloprodajnaCijena: artikal!.planska_maloprodajna_cijena,
      grupaId: artikal!.grupa_id,
      grupa: artikal!.grupe,
    }
    const stanjeNorm = stanje ? {
      id: stanje.id,
      artikalId: stanje.artikal_id,
      orgJedId: stanje.org_jed_id,
      raspolozivaKolicina: stanje.raspoloziva_kolicina,
      nabavnaCijena: stanje.nabavna_cijena,
      vpcijena: stanje.vpcijena,
      mpcijena: stanje.mpcijena,
      skladisnoMjesto: null,
      dateCreated: '',
      dateModified: '',
    } : null
    add(artikalNorm, cijenaOriginal, stanjeNorm)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 mb-6 transition-colors">
            <ArrowLeft size={14} /> Nazad na katalog
          </Link>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Slika */}
            <div className="relative h-80 bg-white border border-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
              {artikal.slika_url ? (
                <Image src={artikal.slika_url} alt={artikal.naziv} fill className="object-contain p-4" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-200">
                  <Package size={48} />
                  <span className="text-sm text-gray-400">{artikal.grupe?.naziv ?? 'Artikal'}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-gray-400 font-mono mb-1">{artikal.sifra}</p>
                <h1 className="text-xl font-semibold text-gray-900 leading-snug">{artikal.naziv}</h1>
                {artikal.naziv2 && <p className="text-sm text-gray-500 mt-1">{artikal.naziv2}</p>}
              </div>

              {/* Cijena i stanje */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl font-semibold text-gray-900">{formatCijena(cijenaKupca)}</span>
                {rabat > 0 && <span className="text-sm text-gray-400 line-through">{formatCijena(cijenaOriginal)}</span>}
                {stanje ? (
                  stanje.raspoloziva_kolicina <= 0
                    ? <span className="badge-out-stock">Nema na stanju</span>
                    : stanje.raspoloziva_kolicina <= 3
                    ? <span className="badge-low-stock">{stanje.raspoloziva_kolicina} kom</span>
                    : <span className="badge-in-stock">{stanje.raspoloziva_kolicina} kom</span>
                ) : <span className="badge-out-stock">Nema na stanju</span>}
              </div>

              {artikal.proc_poreza > 0 && (
                <p className="text-xs text-gray-400">PDV {artikal.proc_poreza}% uključen u cijenu</p>
              )}

              {/* Detalji */}
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
                {artikal.grupe && (
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-gray-500">Grupa</span>
                    <span className="text-gray-700">{artikal.grupe.naziv}</span>
                  </div>
                )}
                {artikal.barkod && (
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-gray-500">Barkod</span>
                    <span className="font-mono text-gray-700">{artikal.barkod}</span>
                  </div>
                )}
                {artikal.dobavljac_naziv && (
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-gray-500">Dobavljač</span>
                    <span className="text-gray-700">{artikal.dobavljac_naziv}</span>
                  </div>
                )}
                {artikal.proizvodjac_naziv && (
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-gray-500">Proizvođač</span>
                    <span className="text-gray-700">{artikal.proizvodjac_naziv}</span>
                  </div>
                )}
              </div>

              {artikal.opis && (
                <p className="text-sm text-gray-600 leading-relaxed">{artikal.opis}</p>
              )}

              <button
                onClick={handleAdd}
                disabled={!canAdd || atMax}
                className={`btn-primary flex items-center justify-center gap-2 ${!canAdd || atMax ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {atMax ? 'Maksimalna količina u korpi' : inCart > 0 ? `U korpi (${inCart}) — dodaj još` : canAdd ? 'Dodaj u korpu' : 'Nema na stanju'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}

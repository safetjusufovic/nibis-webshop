'use client'

import { X, Trash2, Plus, Minus, ShoppingBag, Tag } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { siteConfig, formatCijena, calculateTotals } from '@/lib/config'
import { useEffect, useState } from 'react'
import type { NarudzbaStavka } from '@/types/nibis'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

type OrderStatus = 'idle' | 'loading' | 'success' | 'error'

export default function CartDrawer({ open, onClose , shopSlug = '' }: CartDrawerProps) {
  const { items, totalQty, setQty, remove, clear } = useCart()
  const { profil, rabat } = useAuth()
  const [status, setStatus] = useState<OrderStatus>('idle')
  const [orderRef, setOrderRef] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [napomena, setNapomena] = useState('')
  const [nacinPlacanja, setNacinPlacanja] = useState<'Virman' | 'Gotovina' | 'Kartica'>('Virman')

  // Primijeni rabat partnera na cijenu
  function cijenaZaKupca(originalCijena: number): number {
    if (!rabat || rabat <= 0) return originalCijena
    return originalCijena * (1 - rabat / 100)
  }

  const totals = calculateTotals(
    items.map(i => ({
      cijena: cijenaZaKupca(i.cijena),
      qty: i.qty,
      procPoreza: i.artikal.procPoreza ?? 0,
    }))
  )

  async function handleSubmit() {
    if (!items.length) return
    setStatus('loading')
    setErrorMsg('')

    const stavke: NarudzbaStavka[] = items.map(item => ({
      rbr: null,
      tip: 'Artikal',
      artikalId: item.artikal.id,
      naziv: item.artikal.naziv,
      kolicina: item.qty,
      jedinicnaCijena: cijenaZaKupca(item.cijena), // cijena sa rabatom
      poreskaStopa: item.artikal.procPoreza ?? 0,
      rabat1Procenat: rabat > 0 ? rabat : null,     // proslijedi rabat NIBIS-u
      rabat2Procenat: null,
      rabat3Procenat: null,
      opis: null,
    }))

    try {
      // Uzmi JWT token za server-side autentikaciju
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''

      const shopParam = shopSlug ? '?shop=' + shopSlug : ''
      const res = await fetch('/api/narudzba' + shopParam, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ stavke, nacinPlacanja, napomena }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setOrderRef(data.oznakaDokumenta || `ID: ${data.id}`)
      setStatus('success')
      clear()
    } catch (e) {
      setErrorMsg(String(e))
      setStatus('error')
    }
  }

  function handleClose() {
    if (status === 'success') { setStatus('idle'); setOrderRef(''); setNapomena('') }
    onClose()
  }

  const partnerNaziv = (profil?.partner as any)?.naziv

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/20 z-40" onClick={handleClose} />}

      <div className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-white border-l border-gray-100 z-50 flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h2 className="font-medium text-gray-900">Korpa {totalQty > 0 && <span className="text-sm text-gray-400 ml-1">({totalQty})</span>}</h2>
            {partnerNaziv && <p className="text-xs text-gray-400">{partnerNaziv}</p>}
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
        </div>

        {/* Rabat banner */}
        {rabat > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--brand-pale)] border-b border-[var(--brand-pale)]">
            <Tag size={13} className="text-[var(--brand)]" />
            <span className="text-xs text-[var(--brand)] font-medium">Vaš rabat: {rabat}% — cijene su već umanjene</span>
          </div>
        )}

        {/* Success state */}
        {status === 'success' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--brand-pale)] flex items-center justify-center">
              <ShoppingBag size={24} className="text-[var(--brand)]" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Narudžba kreirana!</h3>
              <p className="text-sm text-gray-500 mb-3">Uspješno poslana u ERP sistem.</p>
              <span className="font-mono text-xs bg-[var(--brand-pale)] text-[var(--brand)] px-3 py-1.5 rounded-lg">{orderRef}</span>
            </div>
            <button className="btn-secondary mt-2" onClick={handleClose}>Nastavi kupovinu</button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto py-2">
              {items.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">Korpa je prazna</div>
              ) : (
                items.map(item => {
                  const cijenaOriginal = item.cijena
                  const cijenaKupac = cijenaZaKupca(item.cijena)
                  const imaRabat = rabat > 0
                  return (
                    <div key={item.artikal.id} className="flex gap-3 px-4 py-3 border-b border-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.artikal.naziv}</p>
                        <p className="text-xs text-gray-400 font-mono">{item.artikal.sifra}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-700 font-medium">{formatCijena(cijenaKupac)}/kom</p>
                          {imaRabat && (
                            <p className="text-xs text-gray-400 line-through">{formatCijena(cijenaOriginal)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button onClick={() => setQty(item.artikal.id, item.qty - 1)} className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Minus size={12} /></button>
                          <span className="text-sm w-6 text-center">{item.qty}</span>
                          <button onClick={() => setQty(item.artikal.id, item.qty + 1)} className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Plus size={12} /></button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button onClick={() => remove(item.artikal.id)} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        <span className="text-sm font-medium text-gray-900">{formatCijena(cijenaKupac * item.qty)}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-4 space-y-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Bez PDV-a</span><span>{formatCijena(totals.ukupnoBezPoreza)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>PDV</span><span>{formatCijena(totals.ukupnoPorez)}</span>
                  </div>
                  {rabat > 0 && (
                    <div className="flex justify-between text-[var(--brand)] text-xs">
                      <span>Ušteda (rabat {rabat}%)</span>
                      <span>-{formatCijena(
                        items.reduce((s, i) => s + i.cijena * i.qty, 0) -
                        items.reduce((s, i) => s + cijenaZaKupca(i.cijena) * i.qty, 0)
                      )}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-gray-900 pt-1 border-t border-gray-100">
                    <span>Ukupno</span><span>{formatCijena(totals.ukupnoSaPorezom)}</span>
                  </div>
                </div>

                {/* Minimum narudžbe */}
                {(() => {
                  const minNarudzba = siteConfig.minNarudzba ?? 0
                  if (minNarudzba > 0 && totals.ukupnoSaPorezom < minNarudzba && totals.ukupnoSaPorezom > 0) {
                    return (
                      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#92400E' }}>
                        Minimalni iznos narudžbe je {formatCijena(minNarudzba)}. Nedostaje još {formatCijena(minNarudzba - totals.ukupnoSaPorezom)}.
                      </div>
                    )
                  }
                  return null
                })()}

                {/* Kreditni limit upozorenje */}
                {(() => {
                  const limitFin = (profil?.partner as any)?.limit_fin ?? 0
                  const rokPlacanja = (profil?.partner as any)?.rok_placanja ?? 0
                  if (limitFin > 0 && totals.ukupnoSaPorezom > limitFin) {
                    return (
                      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#991B1B' }}>
                        ⚠ Narudžba ({formatCijena(totals.ukupnoSaPorezom)}) prelazi vaš kreditni limit ({formatCijena(limitFin)})
                      </div>
                    )
                  }
                  if (rokPlacanja > 0) {
                    return (
                      <div style={{ background: 'var(--brand-pale)', border: '1px solid #B8D4CB', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: 'var(--brand)' }}>
                        Rok plaćanja: <strong>{rokPlacanja} dana</strong>
                      </div>
                    )
                  }
                  return null
                })()}

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Način plaćanja</label>
                  <select value={nacinPlacanja} onChange={e => setNacinPlacanja(e.target.value as any)} className="input text-sm">
                    <option value="Virman">Virman</option>
                    <option value="Gotovina">Gotovina</option>
                    <option value="Kartica">Kartica</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Napomena (opcionalno)</label>
                  <textarea value={napomena} onChange={e => setNapomena(e.target.value)} placeholder="Napomena za narudžbu..." className="input text-sm resize-none" rows={2} />
                </div>

                {status === 'error' && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorMsg}</p>
                )}

                {(() => {
                  const limitFin = (profil?.partner as any)?.limit_fin ?? 0
                  const minNarudzba = siteConfig.minNarudzba ?? 0
                  const ispodMinimuma = minNarudzba > 0 && totals.ukupnoSaPorezom < minNarudzba && totals.ukupnoSaPorezom > 0
                  const prekoracen = limitFin > 0 && totals.ukupnoSaPorezom > limitFin
                  return (
                    <button onClick={handleSubmit} disabled={status === 'loading' || prekoracen || ispodMinimuma} className="btn-primary w-full" style={(prekoracen || ispodMinimuma) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                  {status === 'loading' ? 'Slanje...' : 'Pošalji narudžbu u ERP'}
                    </button>
                  )
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

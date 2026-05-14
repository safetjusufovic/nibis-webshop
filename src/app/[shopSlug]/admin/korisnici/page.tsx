'use client'
import { useParams } from 'next/navigation'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Zahtjev {
  id: string; user_id: string; email: string; ime: string
  prezime: string; naziv_firme: string; pdv_broj: string | null
  telefon: string | null; created_at: string
}

interface Partner {
  id: number; naziv: string; sifra: string
  pdv_broj: string | null; grad: string | null; rabat: number
}

interface Korisnik {
  id: string; ime: string | null; prezime: string | null
  role: string; odobren: boolean; partner_id: number | null
  created_at: string; partner?: { naziv: string } | null
}

export default function AdminKorisniciPage() {
  const params = useParams()
  const shopSlug = params?.shopSlug as string || ''
  const [shopId, setShopId] = useState<string | null>(null)

  useEffect(() => {
    if (!shopSlug) return
    fetch('/api/super-admin/shop-id?slug=' + shopSlug, { headers: { 'x-super-admin-secret': 'nibis-super-2025' } })
      .then(r => r.json()).then(d => setShopId(d.id || null))
  }, [shopSlug])


  const [zahtjevi, setZahtjevi] = useState<Zahtjev[]>([])
  const [korisnici, setKorisnici] = useState<Korisnik[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modal za odabir partnera
  const [partnerModal, setPartnerModal] = useState<{ korisnikId: string, zahtjev?: Zahtjev } | null>(null)
  const [partnerSearch, setPartnerSearch] = useState('')
  const [partnerResults, setPartnerResults] = useState<Partner[]>([])
  const [partnerLoading, setPartnerLoading] = useState(false)
  const [odabraniPartner, setOdabraniPartner] = useState<Partner | null>(null)

  async function load() {
    const [z, k] = await Promise.all([
      supabase.from('registracija_zahtjevi').select('*').is('odobren', null).order('created_at').eq('shop_id', shopId || '00000000-0000-0000-0000-000000000000'),
      supabase.from('korisnici').select('*, partner:partneri(naziv)').order('created_at', { ascending: false }).eq('shop_id', shopId || '00000000-0000-0000-0000-000000000000'),
    ])
    setZahtjevi(z.data ?? [])
    setKorisnici(k.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function traziPartnere() {
    if (partnerSearch.length < 2) { setPartnerResults([]); return }
    setPartnerLoading(true)
    const { data } = await supabase
      .from('partneri')
      .select('id, naziv, sifra, pdv_broj, grad, rabat')
      .ilike('naziv', `%${partnerSearch}%`)
      .order('naziv')
      .limit(15)
    setPartnerResults(data ?? [])
    setPartnerLoading(false)
  }

  async function primijeniPartnera() {
    if (!partnerModal) return
    setSaving(true)
    
    if (partnerModal.zahtjev) {
      // Odobravanje novog korisnika
      await fetch('/api/admin/odobri-korisnika', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zahtjevId: partnerModal.zahtjev.id,
          userId: partnerModal.zahtjev.user_id,
          email: partnerModal.zahtjev.email,
          ime: partnerModal.zahtjev.ime,
          prezime: partnerModal.zahtjev.prezime,
          partnerId: odabraniPartner?.id ?? null,
        }),
      })
    } else {
      // Promjena partnera postojećem korisniku
      await supabase
        .from('korisnici')
        .update({ partner_id: odabraniPartner?.id ?? null })
        .eq('id', partnerModal.korisnikId)
    }

    setSaving(false)
    setPartnerModal(null)
    setOdabraniPartner(null)
    setPartnerSearch('')
    setPartnerResults([])
    load()
  }

  async function odbij(zahtjevId: string) {
    await supabase.from('registracija_zahtjevi').update({ odobren: false }).eq('id', zahtjevId)
    load()
  }

  async function toggleOdobren(korisnikId: string, trenutno: boolean) {
    await supabase.from('korisnici').update({ odobren: !trenutno }).eq('id', korisnikId)
    load()
  }

  function otvoriPartnerModal(korisnikId: string, zahtjev?: Zahtjev) {
    setOdabraniPartner(null)
    setPartnerSearch('')
    setPartnerResults([])
    setPartnerModal({ korisnikId, zahtjev })
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-gray-900">Korisnici</h1>

      {/* Zahtjevi */}
      {zahtjevi.length > 0 && (
        <div>
          <div className="text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            ⚠ {zahtjevi.length} zahtjev(a) čeka odobrenje
          </div>
          <div className="space-y-2">
            {zahtjevi.map(z => (
              <div key={z.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{z.ime} {z.prezime}</p>
                  <p className="text-xs text-gray-500">{z.email} · {z.naziv_firme}</p>
                  {z.pdv_broj && <p className="text-xs text-gray-400">PDV: {z.pdv_broj}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => odbij(z.id)} className="btn-secondary text-xs py-1 px-3 text-red-500 border-red-200">Odbij</button>
                  <button onClick={() => otvoriPartnerModal(z.user_id, z)} className="btn-primary text-xs py-1 px-3">Odobri →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista korisnika */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-3">Svi korisnici ({korisnici.length})</h2>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Korisnik</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Partner</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Uloga</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {korisnici.map(k => (
                  <tr key={k.id}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-900">{k.ime ?? ''} {k.prezime ?? ''}</p>
                      <p className="text-xs text-gray-400 font-mono">{k.id.slice(0, 8)}...</p>
                    </td>
                    <td className="px-4 py-2.5">
                      {k.partner_id ? (
                        <div>
                          <p className="text-xs text-teal-700 font-medium">{(k.partner as any)?.naziv ?? '—'}</p>
                          <p className="text-xs text-gray-400">ID: {k.partner_id}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Nije vezan</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${k.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-600'}`}>{k.role}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${k.odobren ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-600'}`}>
                        {k.odobren ? 'Aktivan' : 'Neaktivan'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => otvoriPartnerModal(k.id)}
                          className="text-xs text-teal-600 hover:underline"
                        >
                          {k.partner_id ? 'Promijeni partnera' : 'Dodaj partnera'}
                        </button>
                        <button onClick={() => toggleOdobren(k.id, k.odobren)} className="text-xs text-gray-400 hover:text-gray-600 underline whitespace-nowrap">
                          {k.odobren ? 'Deaktiviraj' : 'Aktiviraj'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Partner Modal */}
      {partnerModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">
                {partnerModal.zahtjev ? 'Odobri korisnika i veži partnera' : 'Odaberi partnera'}
              </h3>
              {partnerModal.zahtjev && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {partnerModal.zahtjev.ime} {partnerModal.zahtjev.prezime} · {partnerModal.zahtjev.naziv_firme}
                </p>
              )}
            </div>

            <div className="p-6 space-y-4">
              {/* Pretraga */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Upišite naziv partnera..."
                  value={partnerSearch}
                  onChange={e => setPartnerSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && traziPartnere()}
                  className="input flex-1"
                  autoFocus
                />
                <button
                  onClick={traziPartnere}
                  className="btn-primary px-4"
                  disabled={partnerSearch.length < 2}
                >
                  Traži
                </button>
              </div>

              {/* Odabrani partner */}
              {odabraniPartner && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
                  <p className="text-sm font-medium text-teal-700">✓ Odabran: {odabraniPartner.naziv}</p>
                  <p className="text-xs text-teal-600">{odabraniPartner.sifra} · {odabraniPartner.pdv_broj}</p>
                </div>
              )}

              {/* Rezultati */}
              {partnerLoading && <p className="text-sm text-gray-400 text-center py-4">Učitavam...</p>}
              {!partnerLoading && partnerResults.length > 0 && (
                <div className="border border-gray-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  {partnerResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setOdabraniPartner(p)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${odabraniPartner?.id === p.id ? 'bg-teal-50' : ''}`}
                    >
                      <p className={`text-sm font-medium ${odabraniPartner?.id === p.id ? 'text-teal-700' : 'text-gray-800'}`}>{p.naziv}</p>
                      <p className="text-xs text-gray-400">{p.sifra}{p.pdv_broj ? ` · ${p.pdv_broj}` : ''}{p.grad ? ` · ${p.grad}` : ''}{p.rabat > 0 ? ` · Rabat: ${p.rabat}%` : ''}</p>
                    </button>
                  ))}
                </div>
              )}
              {!partnerLoading && partnerSearch.length >= 2 && partnerResults.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Nema rezultata za "{partnerSearch}"</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end">
              <button onClick={() => { setPartnerModal(null); setOdabraniPartner(null); setPartnerSearch(''); setPartnerResults([]) }} className="btn-secondary">
                Odustani
              </button>
              <button onClick={primijeniPartnera} disabled={saving} className="btn-primary">
                {saving ? 'Čuvanje...' : partnerModal.zahtjev ? 'Odobri korisnika' : 'Spremi partnera'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

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
  const [zahtjevi, setZahtjevi] = useState<Zahtjev[]>([])
  const [korisnici, setKorisnici] = useState<Korisnik[]>([])
  const [partneri, setPartneri] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [odabirModal, setOdabirModal] = useState<{ zahtjev: Zahtjev } | null>(null)
  const [odabraniPartner, setOdabraniPartner] = useState<number | null>(null)
  const [partnerSearch, setPartnerSearch] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const [z, k, p] = await Promise.all([
      supabase.from('registracija_zahtjevi').select('*').is('odobren', null).order('created_at'),
      supabase.from('korisnici').select('*, partner:partneri(naziv)').order('created_at', { ascending: false }),
      supabase.from('partneri').select('id, naziv, sifra, pdv_broj, grad, rabat').eq('aktivan', true).order('naziv').limit(500),
    ])
    setZahtjevi(z.data ?? [])
    setKorisnici(k.data ?? [])
    setPartneri(p.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function otvoriModal(zahtjev: Zahtjev) {
    const match = zahtjev.pdv_broj
      ? partneri.find(p => p.pdv_broj?.replace(/\s/g, '') === zahtjev.pdv_broj?.replace(/\s/g, ''))
      : null
    setOdabraniPartner(match?.id ?? null)
    setPartnerSearch(zahtjev.naziv_firme ?? '')
    setOdabirModal({ zahtjev })
  }

  async function odobriSaPartnerom() {
    if (!odabirModal) return
    setSaving(true)
    const { zahtjev } = odabirModal
    // Koristi API rutu — ne supabaseAdmin direktno iz browsera
    await fetch('/api/admin/odobri-korisnika', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zahtjevId: zahtjev.id,
        userId: zahtjev.user_id,
        email: zahtjev.email,
        ime: zahtjev.ime,
        prezime: zahtjev.prezime,
        partnerId: odabraniPartner,
      }),
    })
    setSaving(false)
    setOdabirModal(null)
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

  async function promijeniPartnera(korisnikId: string, partnerId: number | null) {
    await supabase.from('korisnici').update({ partner_id: partnerId }).eq('id', korisnikId)
    load()
  }

  const filtriranPartneri = partneri.filter(p =>
    p.naziv.toLowerCase().includes(partnerSearch.toLowerCase()) ||
    p.sifra.toLowerCase().includes(partnerSearch.toLowerCase()) ||
    (p.pdv_broj ?? '').toLowerCase().includes(partnerSearch.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-gray-900">Korisnici</h1>

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
                  <p className="text-xs text-gray-500">{z.email}</p>
                  <p className="text-xs text-gray-500">{z.naziv_firme}{z.pdv_broj ? ` · PDV: ${z.pdv_broj}` : ''}</p>
                  {z.telefon && <p className="text-xs text-gray-400">{z.telefon}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => odbij(z.id)} className="btn-secondary text-xs py-1 px-3 text-red-500 border-red-200">Odbij</button>
                  <button onClick={() => otvoriModal(z)} className="btn-primary text-xs py-1 px-3">Odobri →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Partner (NIBIS)</th>
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
                        <select
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 max-w-[140px]"
                          value={k.partner_id ?? ''}
                          onChange={e => promijeniPartnera(k.id, e.target.value ? parseInt(e.target.value) : null)}
                        >
                          <option value="">— bez partnera —</option>
                          {partneri.map(p => <option key={p.id} value={p.id}>{p.naziv}</option>)}
                        </select>
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

      {/* Modal odabira partnera */}
      {odabirModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-100 w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">Odobri korisnika</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {odabirModal.zahtjev.ime} {odabirModal.zahtjev.prezime} · {odabirModal.zahtjev.naziv_firme}
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Veži za partnera iz NIBIS-a</label>
                <input
                  type="text"
                  placeholder="Pretraži po nazivu, šifri ili PDV broju..."
                  value={partnerSearch}
                  onChange={e => setPartnerSearch(e.target.value)}
                  className="input text-sm mb-2"
                />
                <div className="border border-gray-100 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                  <button
                    onClick={() => setOdabraniPartner(null)}
                    className={`w-full text-left px-3 py-2 text-sm border-b border-gray-50 transition-colors ${odabraniPartner === null ? 'bg-gray-50 text-gray-500' : 'hover:bg-gray-50 text-gray-400'}`}
                  >
                    — Bez partnera
                  </button>
                  {filtriranPartneri.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setOdabraniPartner(p.id)}
                      className={`w-full text-left px-3 py-2 border-b border-gray-50 last:border-0 transition-colors ${odabraniPartner === p.id ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
                    >
                      <p className={`text-sm font-medium ${odabraniPartner === p.id ? 'text-teal-700' : 'text-gray-800'}`}>{p.naziv}</p>
                      <p className="text-xs text-gray-400">{p.sifra}{p.pdv_broj ? ` · PDV: ${p.pdv_broj}` : ''}{p.grad ? ` · ${p.grad}` : ''}{p.rabat > 0 ? ` · Rabat: ${p.rabat}%` : ''}</p>
                    </button>
                  ))}
                  {filtriranPartneri.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Nema rezultata</p>}
                </div>
              </div>
              {odabraniPartner && (
                <div className="bg-teal-50 border border-teal-100 rounded-lg px-3 py-2 text-xs text-teal-700">
                  ✓ Odabran: {partneri.find(p => p.id === odabraniPartner)?.naziv}
                  {(partneri.find(p => p.id === odabraniPartner)?.rabat ?? 0) > 0 &&
                    ` — rabat ${partneri.find(p => p.id === odabraniPartner)?.rabat}%`}
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end">
              <button onClick={() => setOdabirModal(null)} className="btn-secondary text-sm">Odustani</button>
              <button onClick={odobriSaPartnerom} disabled={saving} className="btn-primary text-sm">
                {saving ? 'Čuvanje...' : 'Odobri korisnika'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useRef } from 'react'
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

// ─── Searchable Partner Select ────────────────────────────────────────────────
function PartnerSelect({ value, onChange }: { value: number | null, onChange: (id: number | null) => void }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Partner[]>([])
  const [selected, setSelected] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value) {
      supabase.from('partneri').select('id, naziv, sifra').eq('id', value).single()
        .then(({ data }) => setSelected(data ?? null))
    } else {
      setSelected(null)
    }
  }, [value])

  useEffect(() => {
    if (search.length < 2) { setResults([]); return }
    setLoading(true)
    supabase.from('partneri')
      .select('id, naziv, sifra, pdv_broj, grad, rabat')
      .ilike('naziv', `%${search}%`)
      .order('naziv').limit(10)
      .then(({ data }) => { setResults(data ?? []); setLoading(false) })
  }, [search])

  function select(p: Partner | null) {
    setSelected(p)
    onChange(p?.id ?? null)
    setOpen(false)
    setSearch('')
    setResults([])
  }

  return (
    <div style={{position:'relative', display:'inline-block'}}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 50) }}
        style={{fontSize:'12px', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'6px 10px', background:'white', cursor:'pointer', minWidth:'180px', textAlign:'left', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px'}}
      >
        <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{selected?.naziv ?? '— odaberi partnera —'}</span>
        <span style={{color:'#9ca3af', flexShrink:0}}>▾</span>
      </button>

      {open && (
        <>
          <div style={{position:'fixed', inset:0, zIndex:9998}} onClick={() => { setOpen(false); setSearch('') }} />
          <div style={{position:'absolute', right:0, top:'38px', zIndex:9999, background:'white', border:'1px solid #e5e7eb', borderRadius:'12px', boxShadow:'0 20px 40px rgba(0,0,0,0.2)', width:'320px', overflow:'hidden'}}>
            <div style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Upišite naziv partnera..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{width:'100%', fontSize:'12px', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:'6px', outline:'none', boxSizing:'border-box'}}
              />
            </div>
            <div style={{maxHeight:'280px', overflowY:'auto'}}>
              <button type="button" onClick={() => select(null)}
                style={{width:'100%', textAlign:'left', padding:'8px 12px', fontSize:'12px', color:'#9ca3af', background:'none', border:'none', borderBottom:'1px solid #f9fafb', cursor:'pointer', display:'block'}}>
                — bez partnera —
              </button>
              {loading && <p style={{padding:'12px', fontSize:'12px', color:'#9ca3af', textAlign:'center'}}>Učitavam...</p>}
              {!loading && search.length < 2 && <p style={{padding:'12px', fontSize:'12px', color:'#9ca3af', textAlign:'center'}}>Upišite min. 2 slova</p>}
              {!loading && search.length >= 2 && results.length === 0 && <p style={{padding:'12px', fontSize:'12px', color:'#9ca3af', textAlign:'center'}}>Nema rezultata</p>}
              {!loading && results.map(p => (
                <button type="button" key={p.id} onClick={() => select(p)}
                  style={{width:'100%', textAlign:'left', padding:'8px 12px', fontSize:'12px', background: value === p.id ? '#f0fdf4' : 'white', border:'none', borderBottom:'1px solid #f9fafb', cursor:'pointer', display:'block'}}>
                  <div style={{fontWeight:500, color: value === p.id ? '#0f6e56' : '#1f2937'}}>{p.naziv}</div>
                  <div style={{color:'#9ca3af', fontSize:'11px', marginTop:'2px'}}>{p.sifra}{p.pdv_broj ? ` · PDV: ${p.pdv_broj}` : ''}{p.grad ? ` · ${p.grad}` : ''}{p.rabat > 0 ? ` · Rabat: ${p.rabat}%` : ''}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminKorisniciPage() {
  const [zahtjevi, setZahtjevi] = useState<Zahtjev[]>([])
  const [korisnici, setKorisnici] = useState<Korisnik[]>([])
  const [loading, setLoading] = useState(true)
  const [odabirModal, setOdabirModal] = useState<{ zahtjev: Zahtjev } | null>(null)
  const [odabraniPartnerId, setOdabraniPartnerId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const [z, k] = await Promise.all([
      supabase.from('registracija_zahtjevi').select('*').is('odobren', null).order('created_at'),
      supabase.from('korisnici').select('*, partner:partneri(naziv)').order('created_at', { ascending: false }),
    ])
    setZahtjevi(z.data ?? [])
    setKorisnici(k.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function otvoriModal(zahtjev: Zahtjev) {
    setOdabraniPartnerId(null)
    setOdabirModal({ zahtjev })
  }

  async function odobriSaPartnerom() {
    if (!odabirModal) return
    setSaving(true)
    await fetch('/api/admin/odobri-korisnika', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zahtjevId: odabirModal.zahtjev.id,
        userId: odabirModal.zahtjev.user_id,
        email: odabirModal.zahtjev.email,
        ime: odabirModal.zahtjev.ime,
        prezime: odabirModal.zahtjev.prezime,
        partnerId: odabraniPartnerId,
      }),
    })
    setSaving(false)
    setOdabirModal(null)
    setOdabraniPartnerId(null)
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
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2 justify-end">
                        <PartnerSelect
                          value={k.partner_id}
                          onChange={(id) => promijeniPartnera(k.id, id)}
                        />
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

      {/* Modal odobravanje */}
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
                <PartnerSelect value={odabraniPartnerId} onChange={setOdabraniPartnerId} />
              </div>
              {odabraniPartnerId && (
                <div className="bg-teal-50 border border-teal-100 rounded-lg px-3 py-2 text-xs text-teal-700">
                  ✓ Partner odabran (ID: {odabraniPartnerId})
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

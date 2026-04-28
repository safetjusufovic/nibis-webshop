'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCijena } from '@/lib/config'

interface Narudzba {
  id: string
  nibis_oznaka: string | null
  nibis_id: number | null
  ukupno_sa_porezom: number
  nacin_placanja: string
  napomena: string | null
  status: string
  created_at: string
  partner: { naziv: string } | null
  korisnik: { ime: string | null; prezime: string | null } | null
  stavke: { naziv: string; kolicina: number; jedinicna_cijena: number; poreska_stopa: number }[]
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { poslana: 'bg-teal-50 text-teal-700', kreirana: 'bg-blue-50 text-blue-700', greska: 'bg-red-50 text-red-600' }
  const labels: Record<string, string> = { poslana: 'Poslana', kreirana: 'Kreirana', greska: 'Greška' }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-50 text-gray-600'}`}>{labels[status] ?? status}</span>
}

const PER_PAGE = 25

export default function AdminNarudzbePage() {
  const [narudzbe, setNarudzbe] = useState<Narudzba[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    let q = supabase
      .from('narudzbe')
      .select(`id, nibis_oznaka, nibis_id, ukupno_sa_porezom, nacin_placanja, napomena, status, created_at, partner:partneri(naziv), korisnik:korisnici(ime, prezime), stavke:narudzba_stavke(naziv, kolicina, jedinicna_cijena, poreska_stopa)`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
    if (search) q = q.ilike('nibis_oznaka', `%${search}%`)
    const { data, count } = await q
    setNarudzbe((data ?? []).map((n: any) => ({ ...n, stavke: n.stavke ?? [], partner: n.partner ?? null, korisnik: n.korisnik ?? null })))
    setTotal(count ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [page, search])
  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Narudžbe ({total})</h1>
        <input type="text" placeholder="Pretraži po oznaci..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="input text-sm w-56" />
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-white border border-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : narudzbe.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Nema narudžbi</div>
      ) : (
        <div className="space-y-2">
          {narudzbe.map(n => (
            <div key={n.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors" onClick={() => setExpanded(expanded === n.id ? null : n.id)}>
                <StatusBadge status={n.status} />
                <span className="font-mono text-sm text-gray-700 font-medium">{n.nibis_oznaka ?? `ID:${n.nibis_id ?? n.id.slice(0,8)}`}</span>
                <span className="text-xs text-gray-400 hidden sm:inline truncate max-w-xs">{n.partner?.naziv ?? '—'} · {n.korisnik ? `${n.korisnik.ime ?? ''} ${n.korisnik.prezime ?? ''}`.trim() : '—'}</span>
                <span className="text-xs text-gray-400 ml-auto">{n.stavke.length} st.</span>
                <span className="text-sm font-medium text-gray-900 w-24 text-right">{formatCijena(n.ukupno_sa_porezom)}</span>
                <span className="text-xs text-gray-400 w-20 text-right hidden sm:block">{new Date(n.created_at).toLocaleDateString('bs-BA')}</span>
                <span className="text-gray-300 text-xs">{expanded === n.id ? '▲' : '▼'}</span>
              </button>

              {expanded === n.id && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
                    <div><p className="text-gray-400">Partner</p><p className="font-medium text-gray-700">{n.partner?.naziv ?? '—'}</p></div>
                    <div><p className="text-gray-400">Korisnik</p><p className="font-medium text-gray-700">{n.korisnik ? `${n.korisnik.ime ?? ''} ${n.korisnik.prezime ?? ''}`.trim() || '—' : '—'}</p></div>
                    <div><p className="text-gray-400">Plaćanje</p><p className="font-medium text-gray-700">{n.nacin_placanja}</p></div>
                    <div><p className="text-gray-400">Datum</p><p className="font-medium text-gray-700">{new Date(n.created_at).toLocaleString('bs-BA')}</p></div>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2 font-medium">Naziv</th>
                      <th className="text-right pb-2 font-medium">Kol.</th>
                      <th className="text-right pb-2 font-medium">Cijena</th>
                      <th className="text-right pb-2 font-medium">PDV%</th>
                      <th className="text-right pb-2 font-medium">Ukupno</th>
                    </tr></thead>
                    <tbody>
                      {n.stavke.map((s, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0">
                          <td className="py-1.5 text-gray-700">{s.naziv}</td>
                          <td className="py-1.5 text-right text-gray-500">{s.kolicina}</td>
                          <td className="py-1.5 text-right text-gray-500">{formatCijena(s.jedinicna_cijena)}</td>
                          <td className="py-1.5 text-right text-gray-400">{s.poreska_stopa}%</td>
                          <td className="py-1.5 text-right font-medium text-gray-900">{formatCijena(s.kolicina * s.jedinicna_cijena)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {n.napomena && <p className="text-xs text-gray-400 mt-3 italic">Napomena: {n.napomena}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1} className="btn-secondary disabled:opacity-40">← Preth.</button>
          <span className="text-gray-500">Stranica {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages} className="btn-secondary disabled:opacity-40">Sljed. →</button>
        </div>
      )}
    </div>
  )
}

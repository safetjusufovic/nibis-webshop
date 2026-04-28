'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { formatCijena } from '@/lib/config'
import Header from '@/components/layout/Header'
import AuthGuard from '@/components/auth/AuthGuard'

interface Narudzba {
  id: string
  nibis_oznaka: string | null
  ukupno_sa_porezom: number
  nacin_placanja: string
  napomena: string | null
  status: string
  created_at: string
  stavke: { naziv: string; kolicina: number; jedinicna_cijena: number }[]
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    poslana: 'bg-teal-50 text-teal-700',
    kreirana: 'bg-blue-50 text-blue-700',
    greska: 'bg-red-50 text-red-600',
  }
  const labels: Record<string, string> = { poslana: 'Poslana', kreirana: 'Kreirana', greska: 'Greška' }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-50 text-gray-600'}`}>{labels[status] ?? status}</span>
}

export default function MojeNarudzbePage() {
  const { user } = useAuth()
  const [narudzbe, setNarudzbe] = useState<Narudzba[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('narudzbe')
      .select('id, nibis_oznaka, ukupno_sa_porezom, nacin_placanja, napomena, status, created_at, narudzba_stavke(naziv, kolicina, jedinicna_cijena)')
      .eq('korisnik_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setNarudzbe((data ?? []).map((n: any) => ({ ...n, stavke: n.narudzba_stavke ?? [] })))
        setLoading(false)
      })
  }, [user])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Moje narudžbe</h1>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-white border border-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : narudzbe.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="mb-4">Nemate još narudžbi.</p>
              <Link href="/" className="btn-primary">Idi na katalog</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {narudzbe.map(n => (
                <div key={n.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setExpanded(expanded === n.id ? null : n.id)}
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge status={n.status} />
                      <span className="font-mono text-sm text-gray-700 font-medium">{n.nibis_oznaka ?? '—'}</span>
                      <span className="text-xs text-gray-400">{n.stavke.length} stavki</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-900">{formatCijena(n.ukupno_sa_porezom)}</span>
                      <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString('bs-BA')}</span>
                      <span className="text-gray-400 text-xs">{expanded === n.id ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {expanded === n.id && (
                    <div className="border-t border-gray-100 px-4 py-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-400 border-b border-gray-100">
                            <th className="text-left pb-2 font-medium">Naziv</th>
                            <th className="text-right pb-2 font-medium">Kol.</th>
                            <th className="text-right pb-2 font-medium">Cijena</th>
                            <th className="text-right pb-2 font-medium">Ukupno</th>
                          </tr>
                        </thead>
                        <tbody>
                          {n.stavke.map((s, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="py-1.5 text-gray-700">{s.naziv}</td>
                              <td className="py-1.5 text-right text-gray-500">{s.kolicina}</td>
                              <td className="py-1.5 text-right text-gray-500">{formatCijena(s.jedinicna_cijena)}</td>
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
        </main>
      </div>
    </AuthGuard>
  )
}

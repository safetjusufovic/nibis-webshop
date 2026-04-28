'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Stats { artikli: number; partneri: number; korisnici: number; narudzbe: number; pendingKorisnici: number }

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [lastSync, setLastSync] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const [a, p, k, n, pending, sync] = await Promise.all([
        supabase.from('artikli').select('id', { count: 'exact', head: true }),
        supabase.from('partneri').select('id', { count: 'exact', head: true }),
        supabase.from('korisnici').select('id', { count: 'exact', head: true }),
        supabase.from('narudzbe').select('id', { count: 'exact', head: true }),
        supabase.from('korisnici').select('id', { count: 'exact', head: true }).eq('odobren', false),
        supabase.from('sync_log').select('*').order('started_at', { ascending: false }).limit(1).single(),
      ])
      setStats({ artikli: a.count ?? 0, partneri: p.count ?? 0, korisnici: k.count ?? 0, narudzbe: n.count ?? 0, pendingKorisnici: pending.count ?? 0 })
      setLastSync(sync.data)
    }
    load()
  }, [])

  const tiles = [
    { label: 'Artikala', value: stats?.artikli, color: 'teal' },
    { label: 'Partnera', value: stats?.partneri, color: 'blue' },
    { label: 'Korisnika', value: stats?.korisnici, color: 'purple' },
    { label: 'Narudžbi', value: stats?.narudzbe, color: 'amber' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Admin panel</h1>

      {stats?.pendingKorisnici ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center justify-between">
          <span>⚠ {stats.pendingKorisnici} korisnik(a) čeka odobrenje</span>
          <a href="/admin/korisnici" className="font-medium underline">Pregledaj</a>
        </div>
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {tiles.map(t => (
          <div key={t.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{t.value ?? '—'}</p>
          </div>
        ))}
      </div>

      {lastSync && (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Zadnja sinhronizacija</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lastSync.status === 'success' ? 'bg-teal-50 text-teal-700' : lastSync.status === 'error' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{lastSync.status}</span>
            <span className="text-gray-500">{new Date(lastSync.started_at).toLocaleString('bs-BA')}</span>
            {lastSync.status === 'success' && (
              <>
                <span className="text-gray-500">{lastSync.artikli_synced} artikala</span>
                <span className="text-gray-500">{lastSync.grupe_synced} grupa</span>
                <span className="text-gray-500">{lastSync.partneri_synced} partnera</span>
              </>
            )}
            {lastSync.error_message && <span className="text-red-500">{lastSync.error_message}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

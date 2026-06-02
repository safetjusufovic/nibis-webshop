'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { siteConfig } from '@/lib/config'
import { RefreshCw } from 'lucide-react'

export default function AdminSyncPage({ shopSlug = 'main' }: { shopSlug?: string }) {
  const [logs, setLogs] = useState<any[]>([])
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function loadLogs() {
    const { data } = await supabase
      .from('sync_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20)
    setLogs(data ?? [])
  }

  useEffect(() => { loadLogs() }, [])

  async function pokreniSync() {
    setSyncing(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: shopSlug }),
      })
      const data = await res.json()
      setResult(data)
      loadLogs()
    } catch (e) {
      setResult({ ok: false, error: String(e) })
    }
    setSyncing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Sinhronizacija</h1>
        <button onClick={pokreniSync} disabled={syncing} className="btn-primary flex items-center gap-2">
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sinhronizacija...' : 'Pokreni sync odmah'}
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4 text-sm space-y-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Konfiguracija</p>
        <div className="flex justify-between"><span className="text-gray-500">Raspored</span><span className="font-mono text-gray-700">Svakih 5 minuta (*/5 * * * *)</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Org. jedinica</span><span className="font-mono text-gray-700">{siteConfig.orgJedId} — {siteConfig.orgJedNaziv}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Tip cijene</span><span className="font-mono text-gray-700">{siteConfig.tipCijene}</span></div>
      </div>

      {result && (
        <div className={`rounded-xl px-4 py-3 text-sm ${result.ok ? 'bg-teal-50 border border-teal-200 text-teal-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {result.ok ? (
            <span>✓ Uspješno — {result.artikliCount} artikala, {result.grupeCount} grupa, {result.partneriCount} partnera, {result.stanjeCount} stanja ({result.durationMs}ms)</span>
          ) : (
            <span>✗ Greška: {result.error}</span>
          )}
        </div>
      )}

      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Historija sinhronizacija (zadnjih 20)</p>
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Datum</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Artikli</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Partneri</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Trajanje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map(log => {
                const dur = log.finished_at
                  ? Math.round((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000)
                  : null
                return (
                  <tr key={log.id}>
                    <td className="px-4 py-2.5 text-gray-600">{new Date(log.started_at).toLocaleString('bs-BA')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${log.status === 'success' ? 'bg-teal-50 text-teal-700' : log.status === 'error' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                        {log.status}
                      </span>
                      {log.error_message && <p className="text-xs text-red-500 mt-0.5 truncate max-w-xs">{log.error_message}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{log.artikli_synced ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{log.partneri_synced ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{dur != null ? `${dur}s` : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

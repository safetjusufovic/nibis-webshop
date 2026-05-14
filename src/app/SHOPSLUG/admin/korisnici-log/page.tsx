'use client'
import { useParams } from 'next/navigation'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Monitor } from 'lucide-react'

interface LoginLog {
  id: string
  created_at: string
  ip_adresa: string | null
  user_agent: string | null
  korisnik: { ime: string | null; prezime: string | null } | null
  auth_user: { email: string } | null
}

const PER_PAGE = 30

export default function KorisniciLogPage() {
  const params = useParams()
  const shopSlug = params?.shopSlug as string || ''

  const [logs, setLogs] = useState<LoginLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    load()
  }, [page, search])

  async function load() {
    setLoading(true)
    
    let q = supabase
      .from('login_log')
      .select(`
        id, created_at, ip_adresa, user_agent,
        korisnik:korisnici!korisnik_id(ime, prezime)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

    const { data, count } = await q
    setLogs((data ?? []) as any)
    setTotal(count ?? 0)
    setLoading(false)
  }

  function parseUserAgent(ua: string | null) {
    if (!ua) return '—'
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return ua.slice(0, 30) + '...'
  }

  function parseOS(ua: string | null) {
    if (!ua) return ''
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac')) return 'macOS'
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
    return ''
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text)' }}>Historija prijava</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{total} ukupno prijava</p>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              {['Korisnik', 'Browser / OS', 'IP adresa', 'Datum i vrijeme'].map((h, i) => (
                <th key={h} style={{
                  padding: '10px 16px', fontSize: '11px', fontWeight: 600,
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.05em', textAlign: 'left',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1,2,3,4,5].map(i => (
                <tr key={i}>
                  <td colSpan={4} style={{ padding: '12px 16px' }}>
                    <div style={{ height: '20px', background: 'var(--border)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <Monitor size={28} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }} />
                  Nema logova prijava
                </td>
              </tr>
            ) : logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                    {(log.korisnik as any)?.ime
                      ? `${(log.korisnik as any).ime} ${(log.korisnik as any).prezime ?? ''}`
                      : '—'}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text)' }}>{parseUserAgent(log.user_agent)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{parseOS(log.user_agent)}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                    {log.ip_adresa ?? '—'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text)' }}>
                    {new Date(log.created_at).toLocaleDateString('bs-BA')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1} className="btn-secondary" style={{ padding: '7px 14px', fontSize: '13px' }}>← Preth.</button>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Stranica {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages} className="btn-secondary" style={{ padding: '7px 14px', fontSize: '13px' }}>Sljed. →</button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCijena, siteConfig } from '@/lib/config'
import { Search, Download, Filter, ChevronDown, ChevronUp, FileText, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'

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

const STATUSI = {
  kreirana:    { label: 'Kreirana',     bg: '#EFF6FF', color: '#1D4ED8', icon: <Clock size={11} /> },
  poslana:     { label: 'Poslana',      bg: '#F0FDF4', color: '#166534', icon: <CheckCircle size={11} /> },
  u_obradi:   { label: 'U obradi',     bg: '#FFFBEB', color: '#92400E', icon: <Clock size={11} /> },
  isporucena: { label: 'Isporučena',   bg: '#F0FDF4', color: '#166534', icon: <CheckCircle size={11} /> },
  otkazana:   { label: 'Otkazana',     bg: '#FEF2F2', color: '#991B1B', icon: <XCircle size={11} /> },
  greska:     { label: 'Greška',       bg: '#FEF2F2', color: '#991B1B', icon: <AlertCircle size={11} /> },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUSI[status as keyof typeof STATUSI] ?? { label: status, bg: '#F9FAFB', color: '#374151', icon: null }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px',
      background: s.bg, color: s.color,
    }}>
      {s.icon} {s.label}
    </span>
  )
}

function printNarudzba(n: Narudzba) {
  const stavkeRows = n.stavke.map((s, i) => `
    <tr style="border-bottom: 1px solid #f3f4f6">
      <td style="padding: 8px 0; font-size: 13px; color: #374151">${i + 1}. ${s.naziv}</td>
      <td style="padding: 8px 0; text-align: right; font-size: 13px; color: #6b7280">${s.kolicina}</td>
      <td style="padding: 8px 0; text-align: right; font-size: 13px; color: #6b7280">${formatCijena(s.jedinicna_cijena)}</td>
      <td style="padding: 8px 0; text-align: right; font-size: 13px; color: #6b7280">${s.poreska_stopa}%</td>
      <td style="padding: 8px 0; text-align: right; font-size: 13px; font-weight: 600; color: #111827">${formatCijena(s.kolicina * s.jedinicna_cijena)}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Narudžba ${n.nibis_oznaka ?? n.id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #111827; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #0F6E56; }
        .logo { font-size: 22px; font-weight: 700; color: #0F6E56; }
        .oznaka { font-size: 28px; font-weight: 700; color: #111827; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
        .meta-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
        .meta-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .meta-value { font-size: 14px; font-weight: 500; color: #111827; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { text-align: left; padding: 10px 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; font-weight: 600; }
        th:not(:first-child) { text-align: right; }
        .total { text-align: right; padding: 16px 0; border-top: 2px solid #111827; font-size: 18px; font-weight: 700; color: #111827; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">${siteConfig.name}</div>
          <div style="font-size: 13px; color: #6b7280; margin-top: 4px">${siteConfig.orgJedNaziv}</div>
        </div>
        <div style="text-align: right">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px">NARUDŽBA</div>
          <div class="oznaka">${n.nibis_oznaka ?? n.id.slice(0, 8)}</div>
          <div style="font-size: 13px; color: #6b7280; margin-top: 4px">${new Date(n.created_at).toLocaleDateString('bs-BA', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
        </div>
      </div>

      <div class="meta">
        <div class="meta-box">
          <div class="meta-label">Partner / Kupac</div>
          <div class="meta-value">${n.partner?.naziv ?? '—'}</div>
          ${n.korisnik ? `<div style="font-size: 13px; color: #6b7280; margin-top: 2px">${`${n.korisnik.ime ?? ''} ${n.korisnik.prezime ?? ''}`.trim()}</div>` : ''}
        </div>
        <div class="meta-box">
          <div class="meta-label">Detalji narudžbe</div>
          <div class="meta-value">Način plaćanja: ${n.nacin_placanja}</div>
          <div style="font-size: 13px; color: #6b7280; margin-top: 2px">Status: ${STATUSI[n.status as keyof typeof STATUSI]?.label ?? n.status}</div>
          ${n.napomena ? `<div style="font-size: 13px; color: #6b7280; margin-top: 2px">Napomena: ${n.napomena}</div>` : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Naziv artikla</th>
            <th style="text-align: right">Kol.</th>
            <th style="text-align: right">Jed. cijena</th>
            <th style="text-align: right">PDV</th>
            <th style="text-align: right">Ukupno</th>
          </tr>
        </thead>
        <tbody>${stavkeRows}</tbody>
      </table>

      <div class="total">Ukupno sa PDV: ${formatCijena(n.ukupno_sa_porezom)}</div>

      <div class="footer">
        ${siteConfig.name} · ${siteConfig.orgJedNaziv} · ${new Date().getFullYear()}
      </div>
    </body>
    </html>
  `

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }
}

const PER_PAGE = 25

export default function AdminNarudzbePage() {
  const [narudzbe, setNarudzbe] = useState<Narudzba[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    let q = supabase
      .from('narudzbe')
      .select(`id, nibis_oznaka, nibis_id, ukupno_sa_porezom, nacin_placanja, napomena, status, created_at,
        partner:partneri(naziv), korisnik:korisnici(ime, prezime),
        stavke:narudzba_stavke(naziv, kolicina, jedinicna_cijena, poreska_stopa)`,
        { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
    if (search) q = q.ilike('nibis_oznaka', `%${search}%`)
    if (filterStatus) q = q.eq('status', filterStatus)
    const { data, count } = await q
    setNarudzbe((data ?? []).map((n: any) => ({ ...n, stavke: n.stavke ?? [], partner: n.partner ?? null, korisnik: n.korisnik ?? null })))
    setTotal(count ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [page, search, filterStatus])
  const totalPages = Math.ceil(total / PER_PAGE)

  async function promijeniStatus(id: string, status: string) {
    setUpdatingStatus(id)
    await supabase.from('narudzbe').update({ status }).eq('id', id)
    setNarudzbe(prev => prev.map(n => n.id === id ? { ...n, status } : n))
    setUpdatingStatus(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text)' }}>Narudžbe</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{total} ukupno</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9CACA6', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Pretraži po oznaci..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ paddingLeft: '34px', paddingRight: '12px', height: '38px', fontSize: '13px', background: 'white', border: '1px solid var(--border)', borderRadius: '9px', outline: 'none', fontFamily: 'inherit', width: '200px' }}
            />
          </div>
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            style={{ height: '38px', fontSize: '13px', background: 'white', border: '1px solid var(--border)', borderRadius: '9px', outline: 'none', fontFamily: 'inherit', padding: '0 12px', color: 'var(--text)', cursor: 'pointer' }}
          >
            <option value="">Svi statusi</option>
            {Object.entries(STATUSI).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3,4,5].map(i => <div key={i} style={{ height: '56px', background: 'white', border: '1px solid var(--border)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : narudzbe.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)', fontSize: '14px' }}>
          <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ margin: 0 }}>Nema narudžbi</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {narudzbe.map(n => (
            <div key={n.id} style={{
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              {/* Row */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'background 0.1s' }}
                onClick={() => setExpanded(expanded === n.id ? null : n.id)}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <StatusBadge status={n.status} />
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                  {n.nibis_oznaka ?? `#${n.id.slice(0, 8)}`}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {n.partner?.naziv ?? '—'}
                  {n.korisnik && ` · ${`${n.korisnik.ime ?? ''} ${n.korisnik.prezime ?? ''}`.trim()}`}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {n.stavke.length} st.
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', minWidth: '90px', textAlign: 'right' }}>
                  {formatCijena(n.ukupno_sa_porezom)}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', minWidth: '80px', textAlign: 'right' }}>
                  {new Date(n.created_at).toLocaleDateString('bs-BA')}
                </span>
                <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>
                  {expanded === n.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </div>

              {/* Expanded */}
              {expanded === n.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px' }}>
                  {/* Meta */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    {[
                      { label: 'Partner', value: n.partner?.naziv ?? '—' },
                      { label: 'Korisnik', value: n.korisnik ? `${n.korisnik.ime ?? ''} ${n.korisnik.prezime ?? ''}`.trim() || '—' : '—' },
                      { label: 'Plaćanje', value: n.nacin_placanja },
                      { label: 'Datum', value: new Date(n.created_at).toLocaleString('bs-BA') },
                    ].map(item => (
                      <div key={item.label} style={{ background: 'var(--surface)', borderRadius: '8px', padding: '10px 12px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{item.label}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Stavke */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Naziv', 'Kol.', 'Jed. cijena', 'PDV', 'Ukupno'].map((h, i) => (
                          <th key={h} style={{ padding: '6px 0', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {n.stavke.map((s, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px 0', fontSize: '13px', color: 'var(--text)' }}>{s.naziv}</td>
                          <td style={{ padding: '8px 0', textAlign: 'right', fontSize: '13px', color: 'var(--text-muted)' }}>{s.kolicina}</td>
                          <td style={{ padding: '8px 0', textAlign: 'right', fontSize: '13px', color: 'var(--text-muted)' }}>{formatCijena(s.jedinicna_cijena)}</td>
                          <td style={{ padding: '8px 0', textAlign: 'right', fontSize: '13px', color: 'var(--text-muted)' }}>{s.poreska_stopa}%</td>
                          <td style={{ padding: '8px 0', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{formatCijena(s.kolicina * s.jedinicna_cijena)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} style={{ padding: '12px 0 0', fontSize: '14px', fontWeight: 700, color: 'var(--text)', textAlign: 'right', paddingRight: '16px' }}>Ukupno sa PDV:</td>
                        <td style={{ padding: '12px 0 0', textAlign: 'right', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>{formatCijena(n.ukupno_sa_porezom)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {n.napomena && (
                    <div style={{ padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '13px', color: '#92400E', marginBottom: '14px' }}>
                      <strong>Napomena:</strong> {n.napomena}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Status:</span>
                      <select
                        value={n.status}
                        onChange={e => promijeniStatus(n.id, e.target.value)}
                        disabled={updatingStatus === n.id}
                        style={{
                          fontSize: '13px',
                          background: 'white',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                          color: 'var(--text)',
                          outline: 'none',
                        }}
                      >
                        {Object.entries(STATUSI).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => printNarudzba(n)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        fontSize: '13px',
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        color: 'var(--text)',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white' }}
                    >
                      <FileText size={13} /> Štampaj / PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
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

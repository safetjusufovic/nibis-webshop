'use client'
import { usePathname } from 'next/navigation'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { formatCijena, siteConfig } from '@/lib/config'
import Header from '@/components/layout/Header'
import AuthGuard from '@/components/auth/AuthGuard'
import { ShoppingBag, ChevronDown, ChevronUp, FileText, Package } from 'lucide-react'

interface Narudzba {
  id: string
  nibis_oznaka: string | null
  ukupno_bez_poreza: number
  ukupno_porez: number
  ukupno_sa_porezom: number
  nacin_placanja: string
  napomena: string | null
  status: string
  created_at: string
  stavke: { naziv: string; kolicina: number; jedinicna_cijena: number; poreska_stopa: number }[]
}

const STATUSI: Record<string, { label: string; bg: string; color: string }> = {
  kreirana:   { label: 'Kreirana',    bg: '#EFF6FF', color: '#1D4ED8' },
  poslana:    { label: 'Poslana',     bg: '#F0FDF4', color: '#166534' },
  u_obradi:  { label: 'U obradi',    bg: '#FFFBEB', color: '#92400E' },
  isporucena: { label: 'Isporučena', bg: '#F0FDF4', color: '#166534' },
  otkazana:  { label: 'Otkazana',    bg: '#FEF2F2', color: '#991B1B' },
  greska:    { label: 'Greška',      bg: '#FEF2F2', color: '#991B1B' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUSI[status] ?? { label: status, bg: '#F9FAFB', color: '#374151' }
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px',
      background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

function printNarudzba(n: Narudzba, imeKupca: string) {
  const stavkeRows = n.stavke.map((s, i) => `
    <tr style="border-bottom: 1px solid #f3f4f6">
      <td style="padding: 8px 0; font-size: 13px; color: #374151">${i + 1}. ${s.naziv}</td>
      <td style="padding: 8px 0; text-align: right; font-size: 13px; color: #6b7280">${s.kolicina}</td>
      <td style="padding: 8px 0; text-align: right; font-size: 13px; color: #6b7280">${formatCijena(s.jedinicna_cijena)}</td>
      <td style="padding: 8px 0; text-align: right; font-size: 13px; font-weight: 600; color: #111827">${formatCijena(s.kolicina * s.jedinicna_cijena)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
    <html><head><meta charset="utf-8">
    <title>Narudžba ${n.nibis_oznaka ?? n.id}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; color: #111827; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #0F6E56; }
      .logo { font-size: 20px; font-weight: 700; color: #0F6E56; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th { text-align: left; padding: 8px 0; font-size: 11px; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
      th:not(:first-child) { text-align: right; }
      .totals { margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
      .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
      .total-final { font-size: 18px; font-weight: 700; border-top: 2px solid #111827; padding-top: 8px; margin-top: 4px; }
      @media print { body { padding: 20px; } }
    </style></head>
    <body>
      <div class="header">
        <div>
          <div class="logo">${siteConfig.name}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px">${siteConfig.orgJedNaziv}</div>
        </div>
        <div style="text-align: right">
          <div style="font-size: 11px; color: #6b7280">NARUDŽBA</div>
          <div style="font-size: 24px; font-weight: 700; font-family: monospace">${n.nibis_oznaka ?? n.id.slice(0,8)}</div>
          <div style="font-size: 12px; color: #6b7280">${new Date(n.created_at).toLocaleDateString('bs-BA')}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div style="background: #f9fafb; border-radius: 8px; padding: 12px;">
          <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Kupac</div>
          <div style="font-size: 14px; font-weight: 500;">${imeKupca}</div>
        </div>
        <div style="background: #f9fafb; border-radius: 8px; padding: 12px;">
          <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Detalji</div>
          <div style="font-size: 13px;">Plaćanje: ${n.nacin_placanja}</div>
          <div style="font-size: 13px; color: #6b7280;">Status: ${STATUSI[n.status]?.label ?? n.status}</div>
        </div>
      </div>

      <table>
        <thead><tr>
          <th>Naziv artikla</th>
          <th style="text-align:right">Kol.</th>
          <th style="text-align:right">Jed. cijena</th>
          <th style="text-align:right">Ukupno</th>
        </tr></thead>
        <tbody>${stavkeRows}</tbody>
      </table>

      <div class="totals">
        <div class="total-row"><span style="color: #6b7280;">Bez PDV-a</span><span>${formatCijena(n.ukupno_bez_poreza)}</span></div>
        <div class="total-row"><span style="color: #6b7280;">PDV</span><span>${formatCijena(n.ukupno_porez)}</span></div>
        <div class="total-row total-final"><span>Ukupno sa PDV</span><span>${formatCijena(n.ukupno_sa_porezom)}</span></div>
      </div>

      ${n.napomena ? `<p style="margin-top: 20px; padding: 10px; background: #fffbeb; border-radius: 6px; font-size: 13px; color: #92400e;"><strong>Napomena:</strong> ${n.napomena}</p>` : ''}
    </body></html>`

  const win = window.open('', '_blank')
  if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500) }
}

export default function MojeNarudzbePage() {
  const pathname = usePathname()
  const shopSlug = (() => { const s = pathname.split('/').filter(Boolean); const i = s.indexOf('moje-narudzbe'); return i > 0 ? s[i-1] : '' })()

  const { user, profil } = useAuth()
  const [narudzbe, setNarudzbe] = useState<Narudzba[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('narudzbe')
      .select('id, nibis_oznaka, ukupno_bez_poreza, ukupno_porez, ukupno_sa_porezom, nacin_placanja, napomena, status, created_at, narudzba_stavke(naziv, kolicina, jedinicna_cijena, poreska_stopa)')
      .eq('korisnik_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setNarudzbe((data ?? []).map((n: any) => ({ ...n, stavke: n.narudzba_stavke ?? [] })))
        setLoading(false)
      })
  }, [user])

  const imeKupca = profil ? (`${profil.ime ?? ''} ${profil.prezime ?? ''}`.trim() || (user?.email ?? '')) : (user?.email ?? '')

  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
        <Header />
        <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 64px' }}>

          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Moje narudžbe</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Pregled vaših narudžbi i statusa isporuke
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3].map(i => <div key={i} style={{ height: '64px', background: 'white', border: '1px solid var(--border)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />)}
            </div>
          ) : narudzbe.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
              <ShoppingBag size={40} style={{ margin: '0 auto 16px', opacity: 0.25, display: 'block' }} />
              <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>Nemate još narudžbi</p>
              <p style={{ fontSize: '14px', marginBottom: '20px' }}>Pregledajte naš katalog i napravite prvu narudžbu</p>
              <Link href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                Idi na katalog
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {narudzbe.map(n => (
                <div key={n.id} style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                }}>
                  {/* Header row */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', cursor: 'pointer', transition: 'background 0.1s' }}
                    onClick={() => setExpanded(expanded === n.id ? null : n.id)}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <StatusBadge status={n.status} />
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                      {n.nibis_oznaka ?? `#${n.id.slice(0, 8)}`}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {n.stavke.length} {n.stavke.length === 1 ? 'stavka' : 'stavki'}
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{formatCijena(n.ukupno_sa_porezom)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleDateString('bs-BA', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {expanded === n.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </div>
                  </div>

                  {/* Expanded */}
                  {expanded === n.id && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '16px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {['Naziv', 'Kol.', 'Jed. cijena', 'Ukupno'].map((h, i) => (
                              <th key={h} style={{ padding: '6px 0', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {n.stavke.map((s, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '9px 0', fontSize: '14px', color: 'var(--text)' }}>{s.naziv}</td>
                              <td style={{ padding: '9px 0', textAlign: 'right', fontSize: '13px', color: 'var(--text-muted)' }}>{s.kolicina}</td>
                              <td style={{ padding: '9px 0', textAlign: 'right', fontSize: '13px', color: 'var(--text-muted)' }}>{formatCijena(s.jedinicna_cijena)}</td>
                              <td style={{ padding: '9px 0', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{formatCijena(s.kolicina * s.jedinicna_cijena)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Totals */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ minWidth: '220px' }}>
                          {[
                            { label: 'Bez PDV-a', value: formatCijena(n.ukupno_bez_poreza) },
                            { label: 'PDV', value: formatCijena(n.ukupno_porez) },
                          ].map(row => (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                              <span>{row.label}</span><span>{row.value}</span>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: '4px', borderTop: '2px solid var(--text)', fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                            <span>Ukupno sa PDV</span><span>{formatCijena(n.ukupno_sa_porezom)}</span>
                          </div>
                        </div>
                      </div>

                      {n.napomena && (
                        <div style={{ marginTop: '12px', padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '13px', color: '#92400E' }}>
                          <strong>Napomena:</strong> {n.napomena}
                        </div>
                      )}

                      <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => printNarudzba(n, imeKupca)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '7px 14px', fontSize: '13px',
                            background: 'white', border: '1px solid var(--border)',
                            borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text)',
                          }}
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
        </main>
      </div>
    </AuthGuard>
  )
}

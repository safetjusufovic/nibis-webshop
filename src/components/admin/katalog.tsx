'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Eye, EyeOff, Tag, X, Package } from 'lucide-react'
import { formatCijena } from '@/lib/config'

interface Artikal {
  id: number
  sifra: string
  naziv: string
  planska_maloprodajna_cijena: number
  webshop_aktivan: boolean
  akcija_popust: number
  akcija_do: string | null
  grupa_id: number | null
  grupe: { naziv: string } | null
}

interface AkcijaModal {
  artikal: Artikal
}

const PER_PAGE = 30

export default function AdminKatalogPage({ shopSlug = 'main' }: { shopSlug?: string }) {
  async function getShopId(): Promise<string | null> {
    const r = await fetch('/api/super-admin/shop-id?slug=' + shopSlug, { headers: { 'x-super-admin-secret': 'nibis-super-2025' } })
    const d = await r.json()
    return d.id || null
  }
  const [artikli, setArtikli] = useState<Artikal[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAktivan, setFilterAktivan] = useState<string>('')
  const [filterAkcija, setFilterAkcija] = useState(false)
  const [akcijaModal, setAkcijaModal] = useState<AkcijaModal | null>(null)
  const [akcijaPopust, setAkcijaPopust] = useState('')
  const [akcijaDo, setAkcijaDo] = useState('')
  const [opisModal, setOpisModal] = useState<any>(null)
  const [opisTekst, setOpisTekst] = useState('')
  const [saving, setSaving] = useState(false)

  async function spremiOpis() {
    if (!opisModal) return
    setSaving(true)
    const sid = await getShopId()
    await supabase.from('artikli').update({ opis: opisTekst }).eq('id', opisModal.id).eq('shop_id', sid)
    setArtikli(prev => prev.map(a => a.id === opisModal.id ? { ...a, opis: opisTekst } : a))
    setSaving(false)
    setOpisModal(null)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const sp = new URLSearchParams({ page: String(page), perPage: String(PER_PAGE) })
    if (search) sp.set('search', search)
    if (filterAkcija) sp.set('akcija', 'true')
    sp.set('shop', shopSlug) // uvijek pošalji, prazan string = glavni shop
    const res = await fetch('/api/artikli?' + sp.toString())
    const d = await res.json()
    setArtikli((d.items ?? []) as Artikal[])
    setTotal(d.total ?? 0)
    setLoading(false)
  }, [page, search, filterAktivan, filterAkcija, shopSlug])

  useEffect(() => { load() }, [load])

  async function toggleAktivan(id: number, trenutno: boolean) {
    const sid = await getShopId()
    await supabase.from('artikli').update({ webshop_aktivan: !trenutno }).eq('id', id).eq('shop_id', sid)
    setArtikli(prev => prev.map(a => a.id === id ? { ...a, webshop_aktivan: !trenutno } : a))
  }

  function otvoriAkcijaModal(artikal: Artikal) {
    setAkcijaPopust(artikal.akcija_popust > 0 ? String(artikal.akcija_popust) : '')
    setAkcijaDo(artikal.akcija_do ? artikal.akcija_do.slice(0, 10) : '')
    setAkcijaModal({ artikal })
  }

  async function sacuvajAkciju() {
    if (!akcijaModal) return
    setSaving(true)
    const popust = parseFloat(akcijaPopust) || 0
    const do_datum = akcijaDo ? new Date(akcijaDo + 'T23:59:59').toISOString() : null
    const sid = await getShopId()
    await supabase.from('artikli').update({
      akcija_popust: popust,
      akcija_do: do_datum,
    }).eq('id', akcijaModal.artikal.id).eq('shop_id', sid)
    setArtikli(prev => prev.map(a =>
      a.id === akcijaModal.artikal.id
        ? { ...a, akcija_popust: popust, akcija_do: do_datum }
        : a
    ))
    setSaving(false)
    setAkcijaModal(null)
  }

  async function ukloniAkciju() {
    if (!akcijaModal) return
    const sid = await getShopId()
    await supabase.from('artikli').update({ akcija_popust: 0, akcija_do: null }).eq('id', akcijaModal.artikal.id).eq('shop_id', sid)
    setArtikli(prev => prev.map(a =>
      a.id === akcijaModal.artikal.id ? { ...a, akcija_popust: 0, akcija_do: null } : a
    ))
    setAkcijaModal(null)
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text)' }}>Katalog</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {total} artikala · Upravljanje vidljivošću i akcijama
          </p>
        </div>
      </div>

      {/* Filteri */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '340px' }}>
          <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9CACA6', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Pretraži artikle..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ paddingLeft: '34px', paddingRight: '12px', height: '38px', fontSize: '13px', background: 'white', border: '1px solid var(--border)', borderRadius: '9px', outline: 'none', fontFamily: 'inherit', width: '100%' }}
          />
        </div>

        <select
          value={filterAktivan}
          onChange={e => { setFilterAktivan(e.target.value); setPage(1) }}
          style={{ height: '38px', fontSize: '13px', background: 'white', border: '1px solid var(--border)', borderRadius: '9px', padding: '0 12px', fontFamily: 'inherit', cursor: 'pointer', color: 'var(--text)', outline: 'none' }}
        >
          <option value="">Svi artikli</option>
          <option value="aktivan">Aktivni</option>
          <option value="neaktivan">Skriveni</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={filterAkcija}
            onChange={e => { setFilterAkcija(e.target.checked); setPage(1) }}
            style={{ accentColor: 'var(--brand)', width: '15px', height: '15px' }}
          />
          Samo na akciji
        </label>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} style={{ height: '52px', background: 'white', border: '1px solid var(--border)', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                {['Artikal', 'Kategorija', 'Cijena', 'Akcija', 'Vidljiv', 'Akcije'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 14px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: i < 2 ? 'left' : 'center',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {artikli.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <Package size={28} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }} />
                    Nema artikala
                  </td>
                </tr>
              ) : artikli.map(a => {
                const akcijaAktivna = a.akcija_popust > 0 && (!a.akcija_do || new Date(a.akcija_do) > new Date())
                return (
                  <tr key={a.id} style={{
                    borderBottom: '1px solid var(--border)',
                    background: !a.webshop_aktivan ? '#FAFAFA' : 'white',
                    opacity: !a.webshop_aktivan ? 0.7 : 1,
                    transition: 'background 0.1s',
                  }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{a.naziv}</div>
                      <div style={{ fontSize: '11px', color: '#9CACA6', fontFamily: 'DM Mono, monospace', marginTop: '2px' }}>{a.sifra}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(a.grupe as any)?.naziv ?? '—'}</span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
                        {formatCijena(a.planska_maloprodajna_cijena)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {akcijaAktivna ? (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '3px 9px', borderRadius: '100px' }}>
                          -{a.akcija_popust}%
                          {a.akcija_do && (
                            <span style={{ fontSize: '10px', fontWeight: 400, marginLeft: '4px' }}>
                              do {new Date(a.akcija_do).toLocaleDateString('bs-BA')}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#D1DDD9' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleAktivan(a.id, a.webshop_aktivan)}
                        title={a.webshop_aktivan ? 'Sakrij artikal' : 'Prikaži artikal'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          background: a.webshop_aktivan ? 'var(--brand-pale)' : 'var(--surface)',
                          color: a.webshop_aktivan ? 'var(--brand)' : '#9CACA6',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {a.webshop_aktivan ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        onClick={() => otvoriAkcijaModal(a)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          background: akcijaAktivna ? '#FEF2F2' : 'var(--surface)',
                          color: akcijaAktivna ? '#DC2626' : 'var(--text-muted)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontWeight: 500,
                          transition: 'all 0.15s',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Tag size={11} />
                        {akcijaAktivna ? 'Uredi akciju' : 'Dodaj akciju'}
                      </button>
                      <button
                        onClick={() => { setOpisModal(a); setOpisTekst(a.opis || '') }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px', marginLeft: '6px',
                          padding: '6px 12px', fontSize: '12px',
                          background: a.opis ? '#EFF6FF' : 'var(--surface)',
                          color: a.opis ? '#1D4ED8' : 'var(--text-muted)',
                          border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
                          fontFamily: 'inherit', fontWeight: 500, whiteSpace: 'nowrap',
                        }}
                      >
                        ✎ {a.opis ? 'Uredi opis' : 'Dodaj opis'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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

      {/* Akcija Modal */}
      {opisModal && (
        <div onClick={() => setOpisModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>Opis artikla</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' }}>{opisModal.naziv}</p>
            <textarea
              value={opisTekst}
              onChange={e => setOpisTekst(e.target.value)}
              rows={6}
              placeholder="Unesite opis artikla koji će se prikazati na stranici proizvoda..."
              style={{ width: '100%', padding: '12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5 }}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '6px 0 16px' }}>
              Ručni opis ima prioritet i prikazuje se na detalju proizvoda. Korisno za artikle koje ERP nema opis.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setOpisModal(null)} style={{ padding: '9px 18px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>Otkaži</button>
              <button onClick={spremiOpis} disabled={saving} style={{ padding: '9px 20px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                {saving ? 'Snimam...' : 'Sačuvaj opis'}
              </button>
            </div>
          </div>
        </div>
      )}

      {akcijaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Postavi akciju</h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{akcijaModal.artikal.naziv}</p>
              </div>
              <button onClick={() => setAkcijaModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
                  Popust (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={akcijaPopust}
                  onChange={e => setAkcijaPopust(e.target.value)}
                  placeholder="Npr. 15"
                  autoFocus
                  style={{ width: '100%', padding: '10px 14px', fontSize: '15px', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--brand-light)'; e.target.style.boxShadow = '0 0 0 3px rgba(29,158,117,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                />
                {akcijaPopust && akcijaModal.artikal.planska_maloprodajna_cijena > 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--brand)', marginTop: '6px' }}>
                    Cijena sa popustom: {formatCijena(akcijaModal.artikal.planska_maloprodajna_cijena * (1 - parseFloat(akcijaPopust) / 100))}
                    {' '}(bilo: {formatCijena(akcijaModal.artikal.planska_maloprodajna_cijena)})
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
                  Akcija vrijedi do (opcionalno)
                </label>
                <input
                  type="date"
                  value={akcijaDo}
                  onChange={e => setAkcijaDo(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--brand-light)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Ako se ne postavi, akcija traje neograničeno
                </p>
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
              <button
                onClick={ukloniAkciju}
                style={{ fontSize: '13px', color: '#991B1B', background: 'none', border: '1px solid #FECACA', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Ukloni akciju
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setAkcijaModal(null)} className="btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                  Odustani
                </button>
                <button onClick={sacuvajAkciju} disabled={saving} className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                  {saving ? 'Čuvam...' : 'Sačuvaj'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

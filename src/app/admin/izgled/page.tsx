'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Monitor, Palette, Type, Layout, ChevronDown } from 'lucide-react'

// ─── Tipovi ───────────────────────────────────────────────────────────────────
interface Theme {
  theme_primary_boja: string
  theme_header_boja: string
  theme_header_tekst_boja: string
  theme_footer_boja: string
  theme_footer_tekst: string
  theme_border_radius: string
  theme_font: string
  theme_dugme_stil: string
  announcement_bar: string
  baner_boja_pozadine: string
  baner_boja_teksta: string
  shop_naziv: string
  shop_email: string
  shop_telefon: string
  shop_adresa: string
}

const DEFAULT_THEME: Theme = {
  theme_primary_boja: '#0F6E56',
  theme_header_boja: '#ffffff',
  theme_header_tekst_boja: '#0D1F1A',
  theme_footer_boja: '#ffffff',
  theme_footer_tekst: 'B2B webshop · Powered by NIBIS ERP',
  theme_border_radius: '10',
  theme_font: 'DM Sans',
  theme_dugme_stil: 'gradient',
  announcement_bar: 'Narudžbe do 14h — isporuka narednog radnog dana',
  baner_boja_pozadine: '#085041',
  baner_boja_teksta: '#ffffff',
  shop_naziv: '',
  shop_email: '',
  shop_telefon: '',
  shop_adresa: '',
}

const FONTS = ['DM Sans', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Nunito', 'Source Sans 3']
const PRESET_BOJE = [
  '#0F6E56', '#065F46', '#1D4ED8', '#1E40AF', '#7C3AED', '#6D28D9',
  '#DC2626', '#B91C1C', '#D97706', '#B45309', '#0891B2', '#0E7490',
  '#374151', '#1F2937', '#6B7280', '#9CA3AF', '#F8FAFA', '#ffffff',
]

// ─── Color Picker ─────────────────────────────────────────────────────────────
function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', background: 'white', border: '1px solid var(--border)',
            borderRadius: '9px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#B8D4CB'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
        >
          <span style={{
            width: '20px', height: '20px', borderRadius: '5px', background: value,
            border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0, display: 'inline-block',
          }} />
          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text)' }}>{value}</span>
          <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
        </button>

        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
              background: 'white', border: '1px solid var(--border)', borderRadius: '12px',
              padding: '14px', boxShadow: '0 12px 32px rgba(0,0,0,0.15)', width: '220px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Brzi odabir
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                {PRESET_BOJE.map(c => (
                  <button key={c} onClick={() => { onChange(c); setOpen(false) }}
                    style={{
                      width: '26px', height: '26px', borderRadius: '6px', background: c, cursor: 'pointer',
                      border: value === c ? '2px solid #0F6E56' : '1px solid rgba(0,0,0,0.1)',
                      transition: 'transform 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
                  />
                ))}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Prilagođena boja
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" value={value} onChange={e => onChange(e.target.value)}
                  style={{ width: '36px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                <input type="text" value={value}
                  onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
                  style={{ flex: 1, padding: '6px 8px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--brand)' }}>{icon}</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{title}</span>
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>{children}</div>
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '9px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: 'var(--text)' }}
        onFocus={e => { e.target.style.borderColor = 'var(--brand-light)'; e.target.style.boxShadow = '0 0 0 3px rgba(29,158,117,0.1)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}

// ─── Live Preview ─────────────────────────────────────────────────────────────
function LivePreview({ theme }: { theme: Theme }) {
  const r = parseInt(theme.theme_border_radius) || 10
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: theme.theme_font + ', sans-serif',
    }}>
      {/* Announcement */}
      <div style={{ background: theme.baner_boja_pozadine, color: theme.baner_boja_teksta, fontSize: '11px', textAlign: 'center', padding: '5px 12px' }}>
        {theme.announcement_bar || 'Announcement bar'}
      </div>
      {/* Header */}
      <div style={{ background: theme.theme_header_boja, borderBottom: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: theme.theme_header_tekst_boja }}>
          {theme.shop_naziv || 'WebShop'}
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: '#F1F5F9', borderRadius: r / 2 + 'px', padding: '5px 10px', fontSize: '11px', color: '#6B7280' }}>Pretraži...</div>
          <div style={{
            background: theme.theme_dugme_stil === 'gradient'
              ? `linear-gradient(135deg, ${theme.theme_primary_boja}, ${theme.theme_primary_boja}cc)`
              : theme.theme_primary_boja,
            color: 'white', fontSize: '11px', fontWeight: 600,
            padding: '5px 12px', borderRadius: r / 1.5 + 'px',
            boxShadow: theme.theme_dugme_stil === 'gradient' ? `0 2px 8px ${theme.theme_primary_boja}40` : 'none',
          }}>
            Korpa
          </div>
        </div>
      </div>
      {/* Body */}
      <div style={{ background: '#F8FAFA', padding: '12px', display: 'flex', gap: '8px' }}>
        {/* Sidebar */}
        <div style={{ width: '70px', background: 'white', borderRadius: r / 2 + 'px', border: '1px solid #E5E7EB', padding: '6px', flexShrink: 0 }}>
          {['Roba', 'Usluge', 'Oprema'].map((k, i) => (
            <div key={k} style={{
              padding: '4px 6px', borderRadius: r / 3 + 'px', fontSize: '9px', marginBottom: '3px',
              background: i === 0 ? theme.theme_primary_boja : 'transparent',
              color: i === 0 ? 'white' : '#374151', fontWeight: i === 0 ? 600 : 400,
            }}>{k}</div>
          ))}
        </div>
        {/* Table */}
        <div style={{ flex: 1, background: 'white', borderRadius: r / 2 + 'px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          {['Artikal A', 'Artikal B', 'Artikal C'].map((a, i) => (
            <div key={a} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '5px 8px', borderBottom: i < 2 ? '1px solid #F3F4F6' : 'none',
            }}>
              <span style={{ fontSize: '9px', color: '#374151' }}>{a}</span>
              <div style={{
                background: theme.theme_dugme_stil === 'gradient'
                  ? `linear-gradient(135deg, ${theme.theme_primary_boja}, ${theme.theme_primary_boja}cc)`
                  : theme.theme_primary_boja,
                color: 'white', fontSize: '8px', fontWeight: 600,
                padding: '2px 7px', borderRadius: r / 3 + 'px',
                boxShadow: theme.theme_dugme_stil === 'gradient' ? `0 1px 4px ${theme.theme_primary_boja}40` : 'none',
              }}>
                Dodaj
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Footer */}
      <div style={{ background: theme.theme_footer_boja, borderTop: '1px solid #E5E7EB', padding: '8px 16px', fontSize: '10px', color: '#6B7280', textAlign: 'center' }}>
        {theme.theme_footer_tekst}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminIzgledPage() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changed, setChanged] = useState(false)

  useEffect(() => {
    const keys = Object.keys(DEFAULT_THEME)
    supabase.from('postavke').select('kljuc, vrijednost').in('kljuc', keys)
      .then(({ data }) => {
        const map = { ...DEFAULT_THEME }
        data?.forEach(p => { if (p.kljuc in map) (map as any)[p.kljuc] = p.vrijednost })
        setTheme(map)
        setLoading(false)
      })
  }, [])

  function update(key: keyof Theme, value: string) {
    setTheme(prev => ({ ...prev, [key]: value }))
    setChanged(true)
  }

  async function save() {
    setSaving(true)
    const rows = Object.entries(theme).map(([kljuc, vrijednost]) => ({ kljuc, vrijednost }))
    await supabase.from('postavke').upsert(rows, { onConflict: 'kljuc' })
    setSaving(false)
    setSaved(true)
    setChanged(false)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[1,2,3].map(i => <div key={i} style={{ height: '160px', background: 'var(--border)', borderRadius: '14px', animation: 'pulse 1.5s infinite' }} />)}
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      {/* Settings */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Save button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text)' }}>Izgled i brendiranje</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Sve promjene se odmah vide u previewu desno</p>
          </div>
          <button onClick={save} disabled={saving || !changed}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              fontSize: '14px', fontWeight: 500, border: 'none', borderRadius: '10px',
              cursor: (saving || !changed) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              background: saved ? '#059669' : changed ? 'var(--brand)' : '#E5E7EB',
              color: (saved || changed) ? 'white' : '#9CA3AF',
              transition: 'all 0.2s',
            }}>
            <Save size={15} />
            {saving ? 'Čuvam...' : saved ? 'Sačuvano ✓' : 'Sačuvaj promjene'}
          </button>
        </div>

        {/* Boje */}
        <Section title="Boje" icon={<Palette size={15} />}>
          <Row>
            <ColorPicker label="Primarna boja" value={theme.theme_primary_boja} onChange={v => update('theme_primary_boja', v)} />
            <ColorPicker label="Header pozadina" value={theme.theme_header_boja} onChange={v => update('theme_header_boja', v)} />
            <ColorPicker label="Header tekst" value={theme.theme_header_tekst_boja} onChange={v => update('theme_header_tekst_boja', v)} />
          </Row>
          <Row>
            <ColorPicker label="Announcement pozadina" value={theme.baner_boja_pozadine} onChange={v => update('baner_boja_pozadine', v)} />
            <ColorPicker label="Announcement tekst" value={theme.baner_boja_teksta} onChange={v => update('baner_boja_teksta', v)} />
          </Row>
        </Section>

        {/* Font i dugmad */}
        <Section title="Font i dugmad" icon={<Type size={15} />}>
          <Row>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Font</label>
              <select value={theme.theme_font} onChange={e => update('theme_font', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '9px', outline: 'none', fontFamily: 'inherit', background: 'white', cursor: 'pointer', color: 'var(--text)' }}>
                {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Border radius — {theme.theme_border_radius}px
              </label>
              <input type="range" min={0} max={20} step={1} value={theme.theme_border_radius}
                onChange={e => update('theme_border_radius', e.target.value)}
                style={{ width: '100%', accentColor: 'var(--brand)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Uglato</span><span>Zaobljeno</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Stil dugmadi</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'solid', label: 'Solid' },
                  { value: 'gradient', label: 'Gradient' },
                  { value: 'outline', label: 'Outline' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => update('theme_dugme_stil', opt.value)}
                    style={{
                      flex: 1, padding: '8px', fontSize: '12px', fontWeight: 500, fontFamily: 'inherit',
                      border: theme.theme_dugme_stil === opt.value ? `2px solid var(--brand)` : '1px solid var(--border)',
                      borderRadius: '8px', cursor: 'pointer',
                      background: theme.theme_dugme_stil === opt.value ? 'var(--brand-pale)' : 'white',
                      color: theme.theme_dugme_stil === opt.value ? 'var(--brand)' : 'var(--text-muted)',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Row>
        </Section>

        {/* Header i Footer */}
        <Section title="Header i Footer" icon={<Layout size={15} />}>
          <Row>
            <TextInput label="Announcement bar tekst" value={theme.announcement_bar} onChange={v => update('announcement_bar', v)} placeholder="Npr. Dostava naredni dan..." />
            <TextInput label="Footer tekst" value={theme.theme_footer_tekst} onChange={v => update('theme_footer_tekst', v)} />
            <ColorPicker label="Footer pozadina" value={theme.theme_footer_boja} onChange={v => update('theme_footer_boja', v)} />
          </Row>
        </Section>

        {/* Kontakt informacije */}
        <Section title="Kontakt informacije" icon={<Monitor size={15} />}>
          <Row>
            <TextInput label="Naziv webshopa" value={theme.shop_naziv} onChange={v => update('shop_naziv', v)} placeholder="Firma d.o.o." />
            <TextInput label="Email" value={theme.shop_email} onChange={v => update('shop_email', v)} placeholder="info@firma.ba" />
            <TextInput label="Telefon" value={theme.shop_telefon} onChange={v => update('shop_telefon', v)} placeholder="+387 33 000 000" />
            <TextInput label="Adresa" value={theme.shop_adresa} onChange={v => update('shop_adresa', v)} placeholder="Ulica bb, Sarajevo" />
          </Row>
        </Section>
      </div>

      {/* Live preview */}
      <div style={{ width: '320px', flexShrink: 0, position: 'sticky', top: '76px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Monitor size={12} /> Live preview
        </div>
        <LivePreview theme={theme} />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
          Preview se ažurira u realnom vremenu
        </p>
      </div>
    </div>
  )
}

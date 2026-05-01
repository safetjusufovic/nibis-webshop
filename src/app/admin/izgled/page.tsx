'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Monitor, Palette, Type, Layout, ChevronDown } from 'lucide-react'

// ─── Ključevi moraju biti isti kao u bazi ─────────────────────────────────────
interface Theme {
  theme_primary_boja: string
  theme_header_boja: string
  theme_header_tekst_boja: string
  theme_footer_boja: string
  theme_font: string
  theme_border_radius: string
  theme_dugme_stil: string
  announcement_bar: string
  baner_boja_pozadine: string
  baner_boja_teksta: string
  shop_naziv: string
  shop_email: string
  shop_telefon: string
  shop_adresa: string
  theme_footer_tekst: string
}

const DEFAULT_THEME: Theme = {
  theme_primary_boja: '#0F6E56',
  theme_header_boja: '#ffffff',
  theme_header_tekst_boja: '#0D1F1A',
  theme_footer_boja: '#ffffff',
  theme_font: 'DM Sans',
  theme_border_radius: '10',
  theme_dugme_stil: 'gradient',
  announcement_bar: '',
  baner_boja_pozadine: '#085041',
  baner_boja_teksta: '#ffffff',
  shop_naziv: '',
  shop_email: '',
  shop_telefon: '',
  shop_adresa: '',
  theme_footer_tekst: 'B2B webshop · Powered by NIBIS ERP',
}

const FONTS = ['DM Sans', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Nunito']

const PRESET_BOJE = [
  '#0F6E56', '#065F46', '#059669', '#0891B2',
  '#1D4ED8', '#1E40AF', '#7C3AED', '#6D28D9',
  '#DC2626', '#B91C1C', '#D97706', '#B45309',
  '#374151', '#1F2937', '#6B7280', '#000000',
  '#F8FAFA', '#F1F5F9', '#E5E7EB', '#ffffff',
]

// ─── Inline Color Picker (kao na kategorijama) ────────────────────────────────
function BojaInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <button onClick={() => setOpen(!open)} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 12px', background: 'white', border: '1px solid var(--border)',
          borderRadius: '9px', cursor: 'pointer', fontFamily: 'inherit', width: '100%',
          transition: 'border-color 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#B8D4CB'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
        >
          <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: value, border: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text)', flex: 1, textAlign: 'left' }}>{value}</span>
          <ChevronDown size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </button>

        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
              background: 'white', border: '1px solid var(--border)', borderRadius: '12px',
              padding: '14px', boxShadow: '0 12px 32px rgba(0,0,0,0.15)', width: '230px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Brzi odabir
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', marginBottom: '12px' }}>
                {PRESET_BOJE.map(c => (
                  <button key={c} onClick={() => { onChange(c); setOpen(false) }}
                    style={{
                      width: '100%', aspectRatio: '1', borderRadius: '6px', background: c, cursor: 'pointer',
                      border: value === c ? '2px solid var(--brand)' : '1px solid rgba(0,0,0,0.1)',
                      transition: 'transform 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
                  />
                ))}
              </div>
              <div style={{ height: '1px', background: 'var(--border)', marginBottom: '12px' }} />
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Prilagođena
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" value={value} onChange={e => onChange(e.target.value)}
                  style={{ width: '38px', height: '34px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '2px', flexShrink: 0 }} />
                <input type="text" value={value}
                  onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
                  style={{ flex: 1, padding: '7px 8px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '9px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: 'var(--text)', background: 'white' }}
        onFocus={e => { e.target.style.borderColor = 'var(--brand-light)'; e.target.style.boxShadow = '0 0 0 3px rgba(29,158,117,0.1)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
      <div style={{ padding: '13px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--brand)' }}>{icon}</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{title}</span>
      </div>
      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '20px' }}>
        {children}
      </div>
    </div>
  )
}

// ─── Live Preview ─────────────────────────────────────────────────────────────
function LivePreview({ theme }: { theme: Theme }) {
  const r = Math.min(16, parseInt(theme.theme_border_radius) || 10)
  const isGradient = theme.theme_dugme_stil === 'gradient'
  const isOutline = theme.theme_dugme_stil === 'outline'
  const btnBg = isOutline ? 'transparent' : isGradient
    ? `linear-gradient(135deg, ${theme.theme_primary_boja}, ${theme.theme_primary_boja}bb)`
    : theme.theme_primary_boja
  const btnColor = isOutline ? theme.theme_primary_boja : 'white'
  const btnBorder = isOutline ? `1.5px solid ${theme.theme_primary_boja}` : 'none'

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: theme.theme_font + ', sans-serif', fontSize: '12px' }}>
      {/* Announcement */}
      {theme.announcement_bar && (
        <div style={{ background: theme.baner_boja_pozadine, color: theme.baner_boja_teksta, fontSize: '10px', textAlign: 'center', padding: '5px 10px' }}>
          {theme.announcement_bar}
        </div>
      )}
      {/* Header */}
      <div style={{ background: theme.theme_header_boja, borderBottom: '1px solid #E5E7EB', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: theme.theme_header_tekst_boja }}>{theme.shop_naziv || 'WebShop'}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ background: '#F1F5F9', borderRadius: r / 2 + 'px', padding: '4px 8px', fontSize: '10px', color: '#6B7280' }}>Pretraži...</div>
          <div style={{ background: btnBg, color: btnColor, border: btnBorder, fontSize: '10px', fontWeight: 600, padding: '4px 10px', borderRadius: r / 1.5 + 'px', boxShadow: isGradient ? `0 2px 6px ${theme.theme_primary_boja}40` : 'none' }}>
            Korpa
          </div>
        </div>
      </div>
      {/* Content */}
      <div style={{ background: '#F8FAFA', padding: '10px', display: 'flex', gap: '8px', minHeight: '100px' }}>
        <div style={{ width: '60px', background: 'white', borderRadius: r / 2 + 'px', border: '1px solid #E5E7EB', padding: '5px', flexShrink: 0 }}>
          {['Roba', 'Usluge', 'Oprema'].map((k, i) => (
            <div key={k} style={{ padding: '3px 5px', borderRadius: r / 3 + 'px', fontSize: '8px', marginBottom: '2px', background: i === 0 ? theme.theme_primary_boja : 'transparent', color: i === 0 ? 'white' : '#374151', fontWeight: i === 0 ? 600 : 400 }}>{k}</div>
          ))}
        </div>
        <div style={{ flex: 1, background: 'white', borderRadius: r / 2 + 'px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          {['Artikal A — 12.50 KM', 'Artikal B — 8.00 KM', 'Artikal C — 45.00 KM'].map((a, i) => (
            <div key={a} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderBottom: i < 2 ? '1px solid #F3F4F6' : 'none' }}>
              <span style={{ fontSize: '9px', color: '#374151' }}>{a}</span>
              <div style={{ background: btnBg, color: btnColor, border: btnBorder, fontSize: '8px', fontWeight: 600, padding: '2px 7px', borderRadius: r / 3 + 'px' }}>Dodaj</div>
            </div>
          ))}
        </div>
      </div>
      {/* Footer */}
      <div style={{ background: theme.theme_footer_boja, borderTop: '1px solid #E5E7EB', padding: '7px 14px', fontSize: '9px', color: '#6B7280', textAlign: 'center' }}>
        {theme.theme_footer_tekst || (theme.shop_naziv || 'WebShop') + ' · ' + (theme.shop_email || 'info@firma.ba')}
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
        if (data && data.length > 0) {
          const map = { ...DEFAULT_THEME }
          data.forEach(p => { if (p.kljuc in map) (map as any)[p.kljuc] = p.vrijednost ?? (DEFAULT_THEME as any)[p.kljuc] })
          setTheme(map)
        }
        setLoading(false)
      })
  }, [])

  function update(key: keyof Theme, value: string) {
    setTheme(prev => ({ ...prev, [key]: value }))
    setChanged(true)
  }

  async function save() {
    setSaving(true)
    const rows = Object.entries(theme).map(([kljuc, vrijednost]) => ({ kljuc, vrijednost: vrijednost || '' }))
    await supabase.from('postavke').upsert(rows, { onConflict: 'kljuc' })
    setSaving(false); setSaved(true); setChanged(false)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[1,2,3].map(i => <div key={i} style={{ height: '140px', background: 'var(--border)', borderRadius: '14px', animation: 'pulse 1.5s infinite' }} />)}
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      {/* Settings */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text)' }}>Izgled i brendiranje</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Sve promjene se odmah vide u previewu</p>
          </div>
          <button onClick={save} disabled={saving || !changed} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            fontSize: '14px', fontWeight: 500, border: 'none', borderRadius: '10px',
            cursor: (saving || !changed) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            background: saved ? '#059669' : changed ? 'var(--brand)' : '#E5E7EB',
            color: (saved || changed) ? 'white' : '#9CA3AF', transition: 'all 0.2s',
          }}>
            <Save size={15} />{saving ? 'Čuvam...' : saved ? 'Sačuvano ✓' : 'Sačuvaj promjene'}
          </button>
        </div>

        {/* Boje */}
        <Section title="Boje" icon={<Palette size={15} />}>
          <BojaInput label="Primarna boja" value={theme.theme_primary_boja} onChange={v => update('theme_primary_boja', v)} />
          <BojaInput label="Header pozadina" value={theme.theme_header_boja} onChange={v => update('theme_header_boja', v)} />
          <BojaInput label="Header tekst" value={theme.theme_header_tekst_boja} onChange={v => update('theme_header_tekst_boja', v)} />
          <BojaInput label="Footer pozadina" value={theme.theme_footer_boja} onChange={v => update('theme_footer_boja', v)} />
          <BojaInput label="Announcement pozadina" value={theme.baner_boja_pozadine} onChange={v => update('baner_boja_pozadine', v)} />
          <BojaInput label="Announcement tekst" value={theme.baner_boja_teksta} onChange={v => update('baner_boja_teksta', v)} />
        </Section>

        {/* Font i stil */}
        <Section title="Font i stil dugmadi" icon={<Type size={15} />}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Font</label>
            <select value={theme.theme_font} onChange={e => update('theme_font', e.target.value)}
              style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '9px', outline: 'none', fontFamily: 'inherit', background: 'white', cursor: 'pointer', color: 'var(--text)' }}>
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Zaobljenost — {theme.theme_border_radius}px
            </label>
            <input type="range" min={0} max={20} step={1} value={theme.theme_border_radius}
              onChange={e => update('theme_border_radius', e.target.value)}
              style={{ width: '100%', accentColor: 'var(--brand)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
              <span>Uglato</span><span>Zaobljeno</span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Stil dugmadi</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[{ v: 'solid', l: 'Solid' }, { v: 'gradient', l: 'Gradient' }, { v: 'outline', l: 'Outline' }].map(o => (
                <button key={o.v} onClick={() => update('theme_dugme_stil', o.v)} style={{
                  flex: 1, padding: '8px 4px', fontSize: '12px', fontWeight: 500, fontFamily: 'inherit',
                  border: theme.theme_dugme_stil === o.v ? '2px solid var(--brand)' : '1px solid var(--border)',
                  borderRadius: '8px', cursor: 'pointer',
                  background: theme.theme_dugme_stil === o.v ? 'var(--brand-pale)' : 'white',
                  color: theme.theme_dugme_stil === o.v ? 'var(--brand)' : 'var(--text-muted)',
                }}>{o.l}</button>
              ))}
            </div>
          </div>
        </Section>

        {/* Tekstovi */}
        <Section title="Tekstovi i sadržaj" icon={<Layout size={15} />}>
          <TextInput label="Announcement bar" value={theme.announcement_bar} onChange={v => update('announcement_bar', v)} placeholder="Narudžbe do 14h..." />
          <TextInput label="Footer tekst" value={theme.theme_footer_tekst} onChange={v => update('theme_footer_tekst', v)} placeholder="B2B webshop · ..." />
        </Section>

        {/* Kontakt */}
        <Section title="Kontakt i firma" icon={<Monitor size={15} />}>
          <TextInput label="Naziv webshopa" value={theme.shop_naziv} onChange={v => update('shop_naziv', v)} placeholder="Firma d.o.o." />
          <TextInput label="Email" value={theme.shop_email} onChange={v => update('shop_email', v)} placeholder="info@firma.ba" />
          <TextInput label="Telefon" value={theme.shop_telefon} onChange={v => update('shop_telefon', v)} placeholder="+387 33 000 000" />
          <TextInput label="Adresa" value={theme.shop_adresa} onChange={v => update('shop_adresa', v)} placeholder="Ulica bb, Sarajevo" />
        </Section>
      </div>

      {/* Live preview */}
      <div style={{ width: '300px', flexShrink: 0, position: 'sticky', top: '76px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Monitor size={12} /> Live preview
        </div>
        <LivePreview theme={theme} />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
          Ažurira se u realnom vremenu
        </p>
      </div>
    </div>
  )
}

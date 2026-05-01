'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Monitor, Palette, Type, Layout, Image, Sliders, Square, AlignLeft } from 'lucide-react'

// ─── Sve postavke ─────────────────────────────────────────────────────────────
interface Theme {
  // Identitet
  shop_naziv: string
  shop_email: string
  shop_telefon: string
  shop_adresa: string
  theme_logo_url: string
  // Boje
  theme_primary_boja: string
  theme_bg_stranica: string
  theme_bg_kartica: string
  theme_border_boja: string
  theme_tekst_boja: string
  theme_tekst_muted: string
  theme_cijena_boja: string
  theme_akcija_boja: string
  // Header
  theme_header_boja: string
  theme_header_tekst_boja: string
  theme_header_visina: string
  theme_header_shadow: string
  // Announcement
  announcement_bar: string
  baner_boja_pozadine: string
  baner_boja_teksta: string
  // Footer
  theme_footer_boja: string
  theme_footer_tekst: string
  // Tipografija
  theme_font: string
  theme_font_naslov_size: string
  theme_font_body_size: string
  theme_font_cijena_size: string
  // Dugmad
  theme_border_radius: string
  theme_dugme_stil: string
  theme_dugme_visina: string
  theme_dugme_shadow: string
  // Kartice
  theme_kartica_radius: string
  theme_kartica_shadow: string
  // Sidebar
  theme_sidebar_tekst_boja: string
  // Spacing
  theme_spacing: string
  // Hero
  theme_hero_aktivan: string
}

const DEFAULTS: Theme = {
  shop_naziv: '', shop_email: '', shop_telefon: '', shop_adresa: '',
  theme_logo_url: '',
  theme_primary_boja: '#0F6E56',
  theme_bg_stranica: '#F8FAFA', theme_bg_kartica: '#ffffff',
  theme_border_boja: '#E8EDEB', theme_tekst_boja: '#0D1F1A',
  theme_tekst_muted: '#6B8279', theme_cijena_boja: '#0D1F1A',
  theme_akcija_boja: '#DC2626',
  theme_header_boja: '#ffffff', theme_header_tekst_boja: '#0D1F1A',
  theme_header_visina: '64', theme_header_shadow: 'true',
  announcement_bar: '', baner_boja_pozadine: '#085041', baner_boja_teksta: '#ffffff',
  theme_footer_boja: '#ffffff', theme_footer_tekst: 'B2B webshop · Powered by NIBIS ERP',
  theme_font: 'DM Sans', theme_font_naslov_size: '22',
  theme_font_body_size: '14', theme_font_cijena_size: '16',
  theme_border_radius: '10', theme_dugme_stil: 'gradient',
  theme_dugme_visina: '36', theme_dugme_shadow: 'true',
  theme_kartica_radius: '14', theme_kartica_shadow: 'true',
  theme_sidebar_tekst_boja: '#374151',
  theme_spacing: 'normal', theme_hero_aktivan: 'true',
}

const FONTS = ['DM Sans', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Nunito', 'Source Sans 3', 'Raleway', 'Montserrat']

const BOJE_PRIMARNE = [
  '#0F6E56','#065F46','#059669','#0891B2','#1D4ED8','#4F46E5',
  '#7C3AED','#9333EA','#C026D3','#DB2777','#DC2626','#EA580C',
  '#D97706','#CA8A04','#374151','#1F2937','#000000',
]
const BOJE_SVJETLE = [
  '#F0FDF4','#ECFDF5','#E0F2FE','#EFF6FF','#F5F3FF','#FDF4FF',
  '#FFF7ED','#FFFBEB','#FEF2F2','#F9FAFB','#F1F5F9','#ffffff',
]

// ─── Komponente ───────────────────────────────────────────────────────────────
function BojaInput({ label, value, onChange, svjetle }: {
  label: string; value: string; onChange: (v: string) => void; svjetle?: boolean
}) {
  const boje = svjetle ? BOJE_SVJETLE : BOJE_PRIMARNE
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${boje.length > 10 ? 6 : 6}, 1fr)`, gap: '4px' }}>
          {boje.map(c => (
            <button key={c} onClick={() => onChange(c)} title={c} style={{
              width: '100%', aspectRatio: '1', borderRadius: '5px', background: c,
              border: value === c ? '2px solid #0F6E56' : '1px solid rgba(0,0,0,0.12)',
              cursor: 'pointer', padding: 0, transition: 'transform 0.1s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.18)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input type="color" value={value} onChange={e => onChange(e.target.value)}
            style={{ width: '36px', height: '30px', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', padding: '1px', flexShrink: 0 }} />
          <input type="text" value={value}
            onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
            style={{ flex: 1, padding: '5px 7px', fontSize: '11px', fontFamily: 'monospace', border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none', background: 'white' }} />
          <span style={{ width: '24px', height: '24px', borderRadius: '5px', background: value, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
        </div>
      </div>
    </div>
  )
}

function SliderInput({ label, value, onChange, min, max, unit }: {
  label: string; value: string; onChange: (v: string) => void; min: number; max: number; unit?: string
}) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'flex', justifyContent: 'space-between', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <span>{label}</span>
        <span style={{ color: '#0F6E56', fontWeight: 700 }}>{value}{unit}</span>
      </label>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', accentColor: '#0F6E56' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  )
}

function TextInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: 'white' }}
        onFocus={e => { e.target.style.borderColor = '#0F6E56'; e.target.style.boxShadow = '0 0 0 2px rgba(15,110,86,0.1)' }}
        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}

function Toggle({ label, value, onChange, description }: {
  label: string; value: string; onChange: (v: string) => void; description?: string
}) {
  const on = value === 'true'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#1F2937' }}>{label}</div>
        {description && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{description}</div>}
      </div>
      <button onClick={() => onChange(on ? 'false' : 'true')} style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
        background: on ? '#0F6E56' : '#D1D5DB', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute', top: '2px', left: on ? '22px' : '2px',
          width: '20px', height: '20px', borderRadius: '50%', background: 'white',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#0F6E56' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
      </div>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {children}
      </div>
    </div>
  )
}

function Grid({ cols, children }: { cols?: number; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols ?? 2}, 1fr)`, gap: '14px' }}>{children}</div>
}

// ─── Live Preview ─────────────────────────────────────────────────────────────
function LivePreview({ t }: { t: Theme }) {
  const r = parseInt(t.theme_border_radius) || 10
  const kr = parseInt(t.theme_kartica_radius) || 14
  const hv = parseInt(t.theme_header_visina) || 64
  const dv = parseInt(t.theme_dugme_visina) || 36
  const isGrad = t.theme_dugme_stil === 'gradient'
  const isOut = t.theme_dugme_stil === 'outline'
  const btnBg = isOut ? 'transparent' : isGrad
    ? `linear-gradient(135deg, ${t.theme_primary_boja} 0%, ${t.theme_primary_boja}cc 100%)`
    : t.theme_primary_boja
  const btnColor = isOut ? t.theme_primary_boja : 'white'
  const btnBorder = isOut ? `1.5px solid ${t.theme_primary_boja}` : 'none'
  const btnShadow = t.theme_dugme_shadow === 'true' && !isOut ? `0 2px 8px ${t.theme_primary_boja}40` : 'none'
  const spacing = t.theme_spacing === 'compact' ? 0.75 : t.theme_spacing === 'spacious' ? 1.4 : 1

  return (
    <div style={{
      border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontFamily: t.theme_font + ', sans-serif',
      fontSize: parseInt(t.theme_font_body_size) * 0.7 + 'px',
    }}>
      {/* Announcement */}
      {t.announcement_bar && (
        <div style={{ background: t.baner_boja_pozadine, color: t.baner_boja_teksta, fontSize: '8px', textAlign: 'center', padding: '4px 8px' }}>
          {t.announcement_bar}
        </div>
      )}
      {/* Header */}
      <div style={{
        background: t.theme_header_boja,
        borderBottom: `1px solid ${t.theme_border_boja}`,
        padding: `0 12px`,
        height: hv * 0.6 + 'px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: t.theme_header_shadow === 'true' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
      }}>
        {t.theme_logo_url ? (
          <img src={t.theme_logo_url} alt="Logo" style={{ height: hv * 0.35 + 'px', objectFit: 'contain' }} />
        ) : (
          <span style={{ fontSize: parseInt(t.theme_font_naslov_size) * 0.55 + 'px', fontWeight: 700, color: t.theme_header_tekst_boja }}>{t.shop_naziv || 'WebShop'}</span>
        )}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <div style={{ background: t.theme_bg_stranica, borderRadius: r * 0.5 + 'px', padding: '3px 7px', fontSize: '8px', color: t.theme_tekst_muted, border: `1px solid ${t.theme_border_boja}` }}>
            Pretraži...
          </div>
          <div style={{
            background: btnBg, color: btnColor, border: btnBorder, fontSize: '8px', fontWeight: 600,
            padding: `0 8px`, height: dv * 0.55 + 'px', borderRadius: r * 0.6 + 'px',
            display: 'flex', alignItems: 'center', boxShadow: btnShadow,
          }}>
            🛒 Korpa
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: t.theme_bg_stranica, padding: '8px', display: 'flex', gap: '6px' }}>
        {/* Sidebar */}
        <div style={{ width: '55px', background: t.theme_bg_kartica, borderRadius: kr * 0.5 + 'px', border: `1px solid ${t.theme_border_boja}`, padding: '5px', flexShrink: 0, boxShadow: t.theme_kartica_shadow === 'true' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none' }}>
          <div style={{ fontSize: '7px', fontWeight: 700, color: t.theme_tekst_muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', padding: '0 2px' }}>Kategorije</div>
          {[{ n: 'Roba', active: true }, { n: 'Usluge', active: false }, { n: 'Oprema', active: false }].map(k => (
            <div key={k.n} style={{
              padding: '3px 4px', borderRadius: r * 0.3 + 'px', fontSize: '7px', marginBottom: '2px',
              display: 'flex', alignItems: 'center', gap: '3px',
              background: k.active ? t.theme_primary_boja : 'transparent',
              color: k.active ? 'white' : t.theme_sidebar_tekst_boja,
              fontWeight: k.active ? 600 : 400,
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: k.active ? 'rgba(255,255,255,0.3)' : t.theme_primary_boja, flexShrink: 0 }} />
              {k.n}
            </div>
          ))}
        </div>

        {/* Product table */}
        <div style={{ flex: 1, background: t.theme_bg_kartica, borderRadius: kr * 0.5 + 'px', border: `1px solid ${t.theme_border_boja}`, overflow: 'hidden', boxShadow: t.theme_kartica_shadow === 'true' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none' }}>
          <div style={{ padding: '3px 6px', background: t.theme_bg_stranica, borderBottom: `1px solid ${t.theme_border_boja}`, display: 'flex', gap: '8px', fontSize: '6px', color: t.theme_tekst_muted, fontWeight: 700, textTransform: 'uppercase' }}>
            <span style={{ flex: 2 }}>Naziv</span><span>Stanje</span><span>Cijena</span><span />
          </div>
          {[
            { n: 'Akumulator 12V 55Ah', s: '✓', c: '110.00' },
            { n: 'Motor starter 24V', s: '✓', c: '245.00' },
            { n: 'Relej napajanja', s: '!', c: '18.50' },
          ].map((a, i) => (
            <div key={a.n} style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: `${4 * spacing}px 6px`,
              borderBottom: i < 2 ? `1px solid ${t.theme_border_boja}` : 'none',
            }}>
              <span style={{ flex: 2, fontSize: '7px', color: t.theme_tekst_boja, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.n}</span>
              <span style={{ fontSize: '7px', color: a.s === '✓' ? '#059669' : '#D97706', fontWeight: 600 }}>{a.s}</span>
              <span style={{ fontSize: '7px', fontWeight: 700, color: t.theme_cijena_boja, whiteSpace: 'nowrap' }}>{a.c} KM</span>
              <div style={{
                background: btnBg, color: btnColor, border: btnBorder, fontSize: '6px', fontWeight: 700,
                padding: '2px 5px', borderRadius: r * 0.4 + 'px', boxShadow: btnShadow, whiteSpace: 'nowrap',
              }}>+ Dodaj</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: t.theme_footer_boja, borderTop: `1px solid ${t.theme_border_boja}`, padding: '5px 12px', fontSize: '7px', color: t.theme_tekst_muted, textAlign: 'center' }}>
        {t.theme_footer_tekst || t.shop_naziv + ' · ' + t.shop_email}
      </div>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'identitet', label: 'Identitet', icon: <Image size={14} /> },
  { id: 'boje', label: 'Boje', icon: <Palette size={14} /> },
  { id: 'tipografija', label: 'Tipografija', icon: <Type size={14} /> },
  { id: 'header', label: 'Header', icon: <AlignLeft size={14} /> },
  { id: 'layout', label: 'Layout', icon: <Layout size={14} /> },
  { id: 'dugmad', label: 'Dugmad', icon: <Square size={14} /> },
  { id: 'spacing', label: 'Spacing', icon: <Sliders size={14} /> },
]

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminIzgledPage() {
  const [theme, setTheme] = useState<Theme>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changed, setChanged] = useState(false)
  const [tab, setTab] = useState('identitet')

  useEffect(() => {
    supabase.from('postavke').select('kljuc, vrijednost').in('kljuc', Object.keys(DEFAULTS))
      .then(({ data }) => {
        if (data?.length) {
          const map = { ...DEFAULTS }
          data.forEach(p => { if (p.kljuc in map) (map as any)[p.kljuc] = p.vrijednost || (DEFAULTS as any)[p.kljuc] })
          setTheme(map)
        }
        setLoading(false)
      })
  }, [])

  function set(key: keyof Theme, value: string) {
    setTheme(prev => ({ ...prev, [key]: value }))
    setChanged(true)
  }

  async function save() {
    setSaving(true)
    await supabase.from('postavke').upsert(
      Object.entries(theme).map(([kljuc, vrijednost]) => ({ kljuc, vrijednost: vrijednost || '' })),
      { onConflict: 'kljuc' }
    )
    setSaving(false); setSaved(true); setChanged(false)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1,2,3].map(i => <div key={i} style={{ height: '120px', background: '#F3F4F6', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />)}
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

      {/* Left: tabs + settings */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#111827' }}>Izgled i brendiranje</h1>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 0' }}>Prilagodi svaki aspekt webshopa</p>
          </div>
          <button onClick={save} disabled={saving || !changed} style={{
            display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px',
            fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '9px',
            cursor: (saving || !changed) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            background: saved ? '#059669' : changed ? '#0F6E56' : '#E5E7EB',
            color: (saved || changed) ? 'white' : '#9CA3AF', transition: 'all 0.2s',
            boxShadow: changed ? '0 2px 8px rgba(15,110,86,0.3)' : 'none',
          }}>
            <Save size={14} />{saving ? 'Čuvam...' : saved ? '✓ Sačuvano' : 'Sačuvaj'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: '#F3F4F6', padding: '4px', borderRadius: '10px', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px',
              fontSize: '12px', fontWeight: tab === t.id ? 600 : 400, fontFamily: 'inherit',
              border: 'none', borderRadius: '7px', cursor: 'pointer', transition: 'all 0.15s',
              background: tab === t.id ? 'white' : 'transparent',
              color: tab === t.id ? '#0F6E56' : '#6B7280',
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'identitet' && (
          <Section title="Identitet i firma" icon={<Image size={14} />}>
            <Grid>
              <TextInput label="Naziv webshopa" value={theme.shop_naziv} onChange={v => set('shop_naziv', v)} placeholder="Firma d.o.o." />
              <TextInput label="URL loga" value={theme.theme_logo_url} onChange={v => set('theme_logo_url', v)} placeholder="https://..." />
              <TextInput label="Email" value={theme.shop_email} onChange={v => set('shop_email', v)} placeholder="info@firma.ba" />
              <TextInput label="Telefon" value={theme.shop_telefon} onChange={v => set('shop_telefon', v)} placeholder="+387 33 000 000" />
              <TextInput label="Adresa" value={theme.shop_adresa} onChange={v => set('shop_adresa', v)} placeholder="Ulica bb, Sarajevo" />
              <TextInput label="Footer tekst" value={theme.theme_footer_tekst} onChange={v => set('theme_footer_tekst', v)} placeholder="B2B webshop · ..." />
            </Grid>
          </Section>
        )}

        {tab === 'boje' && (
          <Section title="Boje" icon={<Palette size={14} />}>
            <Grid>
              <BojaInput label="Primarna boja" value={theme.theme_primary_boja} onChange={v => set('theme_primary_boja', v)} />
              <BojaInput label="Boja akcija/sniženja" value={theme.theme_akcija_boja} onChange={v => set('theme_akcija_boja', v)} />
              <BojaInput label="Pozadina stranice" value={theme.theme_bg_stranica} onChange={v => set('theme_bg_stranica', v)} svjetle />
              <BojaInput label="Pozadina kartica" value={theme.theme_bg_kartica} onChange={v => set('theme_bg_kartica', v)} svjetle />
              <BojaInput label="Boja bordera" value={theme.theme_border_boja} onChange={v => set('theme_border_boja', v)} svjetle />
              <BojaInput label="Boja teksta" value={theme.theme_tekst_boja} onChange={v => set('theme_tekst_boja', v)} />
              <BojaInput label="Muted tekst" value={theme.theme_tekst_muted} onChange={v => set('theme_tekst_muted', v)} />
              <BojaInput label="Boja cijene" value={theme.theme_cijena_boja} onChange={v => set('theme_cijena_boja', v)} />
            </Grid>
          </Section>
        )}

        {tab === 'tipografija' && (
          <Section title="Tipografija" icon={<Type size={14} />}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Font</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {FONTS.map(f => (
                  <button key={f} onClick={() => set('theme_font', f)} style={{
                    padding: '8px 12px', border: theme.theme_font === f ? '2px solid #0F6E56' : '1px solid #E5E7EB',
                    borderRadius: '8px', cursor: 'pointer', fontFamily: f + ', sans-serif',
                    fontSize: '13px', background: theme.theme_font === f ? '#F0FDF4' : 'white',
                    color: theme.theme_font === f ? '#0F6E56' : '#374151', fontWeight: theme.theme_font === f ? 600 : 400,
                    transition: 'all 0.15s',
                  }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <Grid>
              <SliderInput label="Naslov" value={theme.theme_font_naslov_size} onChange={v => set('theme_font_naslov_size', v)} min={16} max={36} unit="px" />
              <SliderInput label="Tijelo" value={theme.theme_font_body_size} onChange={v => set('theme_font_body_size', v)} min={11} max={18} unit="px" />
              <SliderInput label="Cijena" value={theme.theme_font_cijena_size} onChange={v => set('theme_font_cijena_size', v)} min={12} max={24} unit="px" />
            </Grid>
          </Section>
        )}

        {tab === 'header' && (
          <Section title="Header i Announcement" icon={<AlignLeft size={14} />}>
            <Grid>
              <BojaInput label="Pozadina headera" value={theme.theme_header_boja} onChange={v => set('theme_header_boja', v)} svjetle />
              <BojaInput label="Tekst headera" value={theme.theme_header_tekst_boja} onChange={v => set('theme_header_tekst_boja', v)} />
            </Grid>
            <SliderInput label="Visina headera" value={theme.theme_header_visina} onChange={v => set('theme_header_visina', v)} min={44} max={100} unit="px" />
            <Toggle label="Shadow ispod headera" value={theme.theme_header_shadow} onChange={v => set('theme_header_shadow', v)} />
            <div style={{ height: '1px', background: '#F3F4F6' }} />
            <TextInput label="Announcement bar tekst" value={theme.announcement_bar} onChange={v => set('announcement_bar', v)} placeholder="Narudžbe do 14h — isporuka narednog radnog dana" />
            <Grid>
              <BojaInput label="Announcement pozadina" value={theme.baner_boja_pozadine} onChange={v => set('baner_boja_pozadine', v)} />
              <BojaInput label="Announcement tekst" value={theme.baner_boja_teksta} onChange={v => set('baner_boja_teksta', v)} svjetle />
            </Grid>
            <div style={{ height: '1px', background: '#F3F4F6' }} />
            <Grid>
              <BojaInput label="Footer pozadina" value={theme.theme_footer_boja} onChange={v => set('theme_footer_boja', v)} svjetle />
            </Grid>
          </Section>
        )}

        {tab === 'layout' && (
          <Section title="Kartice i layout" icon={<Layout size={14} />}>
            <SliderInput label="Zaobljenost kartica" value={theme.theme_kartica_radius} onChange={v => set('theme_kartica_radius', v)} min={0} max={24} unit="px" />
            <Toggle label="Shadow na karticama" value={theme.theme_kartica_shadow} onChange={v => set('theme_kartica_shadow', v)} description="Blagi drop shadow ispod kartica artikala" />
            <div style={{ height: '1px', background: '#F3F4F6' }} />
            <BojaInput label="Tekst u sidebaru" value={theme.theme_sidebar_tekst_boja} onChange={v => set('theme_sidebar_tekst_boja', v)} />
            <Toggle label="Hero banner aktivan" value={theme.theme_hero_aktivan} onChange={v => set('theme_hero_aktivan', v)} description="Prikazuje hero banner na vrhu kataloga" />
          </Section>
        )}

        {tab === 'dugmad' && (
          <Section title="Dugmad" icon={<Square size={14} />}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stil dugmadi</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { v: 'solid', l: 'Solid', desc: 'Jednobojno' },
                  { v: 'gradient', l: 'Gradient', desc: 'Gradijent' },
                  { v: 'outline', l: 'Outline', desc: 'Obrub' },
                ].map(o => (
                  <button key={o.v} onClick={() => set('theme_dugme_stil', o.v)} style={{
                    padding: '10px 8px', border: theme.theme_dugme_stil === o.v ? '2px solid #0F6E56' : '1px solid #E5E7EB',
                    borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                    background: theme.theme_dugme_stil === o.v ? '#F0FDF4' : 'white', transition: 'all 0.15s',
                  }}>
                    <div style={{
                      margin: '0 auto 6px',
                      width: '60px', height: '24px', borderRadius: '6px',
                      background: o.v === 'outline' ? 'transparent' : o.v === 'gradient'
                        ? `linear-gradient(135deg, #0F6E56, #059669)`
                        : '#0F6E56',
                      border: o.v === 'outline' ? '2px solid #0F6E56' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '9px', fontWeight: 700,
                      color: o.v === 'outline' ? '#0F6E56' : 'white',
                    }}>Dodaj</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: theme.theme_dugme_stil === o.v ? '#0F6E56' : '#374151' }}>{o.l}</div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{o.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <SliderInput label="Visina dugmadi" value={theme.theme_dugme_visina} onChange={v => set('theme_dugme_visina', v)} min={28} max={52} unit="px" />
            <SliderInput label="Zaobljenost dugmadi" value={theme.theme_border_radius} onChange={v => set('theme_border_radius', v)} min={0} max={26} unit="px" />
            <Toggle label="Shadow na dugmadima" value={theme.theme_dugme_shadow} onChange={v => set('theme_dugme_shadow', v)} description="Glow efekat u boji dugmeta" />
          </Section>
        )}

        {tab === 'spacing' && (
          <Section title="Spacing i gustoća" icon={<Sliders size={14} />}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gustoća sadržaja</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { v: 'compact', l: 'Kompaktno', desc: 'Više artikala, manji razmaci' },
                  { v: 'normal', l: 'Normalno', desc: 'Balansiran prikaz' },
                  { v: 'spacious', l: 'Prostrano', desc: 'Veći razmaci, lakše čitanje' },
                ].map(o => (
                  <button key={o.v} onClick={() => set('theme_spacing', o.v)} style={{
                    padding: '12px 8px', border: theme.theme_spacing === o.v ? '2px solid #0F6E56' : '1px solid #E5E7EB',
                    borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                    background: theme.theme_spacing === o.v ? '#F0FDF4' : 'white', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>
                      {o.v === 'compact' ? '▤' : o.v === 'normal' ? '▦' : '▧'}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: theme.theme_spacing === o.v ? '#0F6E56' : '#374151' }}>{o.l}</div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px', lineHeight: 1.3 }}>{o.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </Section>
        )}
      </div>

      {/* Right: Live preview */}
      <div style={{ width: '280px', flexShrink: 0, position: 'sticky', top: '76px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Monitor size={11} /> Live preview
        </div>
        <LivePreview t={theme} />
        <div style={{ marginTop: '8px', padding: '8px 10px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', fontSize: '11px', color: '#065F46', lineHeight: 1.5 }}>
          Preview se ažurira u realnom vremenu. Klikni <strong>Sačuvaj</strong> da se promjene primijene na sajtu.
        </div>
      </div>
    </div>
  )
}

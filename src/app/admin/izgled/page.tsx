'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Save, Undo2, Download, Upload, RefreshCw, Eye, EyeOff,
  ChevronRight, ChevronDown, Check, X, Plus, Trash2,
  Image as ImgIcon, Type, Layout, Palette, Settings,
  ShoppingBag, Globe, Phone, Mail, MapPin, Clock,
  AlignLeft, AlignCenter, AlignRight, Monitor, Smartphone,
} from 'lucide-react'

// ─── Sve postavke ──────────────────────────────────────────────────────────────
interface Postavke { [key: string]: string }

const DEFAULTS: Postavke = {
  // Firma
  shop_naziv: '', shop_email: '', shop_telefon: '', shop_adresa: '', shop_grad: '',
  shop_pib: '', shop_pdv_broj: '', shop_web: '',
  theme_logo_url: '', theme_favicon_url: '',
  seo_naslov: '', seo_opis: '', seo_og_slika: '',
  footer_social_facebook: '', footer_social_instagram: '', footer_social_linkedin: '',
  // Boje
  theme_primary_boja: '#0F6E56', theme_bg_stranica: '#F8FAFA',
  theme_bg_kartica: '#ffffff', theme_border_boja: '#E8EDEB',
  theme_tekst_boja: '#0D1F1A', theme_tekst_muted: '#6B8279',
  theme_cijena_boja: '#0F6E56', theme_akcija_boja: '#DC2626',
  theme_gradient_primary: 'false', theme_gradient_boja2: '#059669', theme_gradient_ugao: '135',
  // Fontovi
  theme_font: 'DM Sans', theme_google_font_naslov: '', theme_google_font_tijelo: '',
  theme_font_body_size: '14', theme_font_naslov_size: '22', theme_font_cijena_size: '16',
  // Header
  header_layout: 'minimal', header_boja: '#ffffff', header_tekst_boja: '#111827',
  header_visina_nova: '64', header_shadow_nova: 'true', header_sticky: 'true',
  header_blur: 'true', header_logo_pozicija: 'left', header_search_stil: 'inline',
  header_search_sirina: '520', header_search_placeholder: 'Pretraži artikle, šifre, barkodove...',
  header_korpa_stil: 'button', header_korpa_boja: '', header_border_bottom: 'true',
  // Top bar
  topbar_aktivan: 'false', topbar_boja: '#1F2937', topbar_tekst_boja: '#9CA3AF',
  topbar_telefon: '', topbar_email: '', topbar_radno_vrijeme: '',
  topbar_adresa: '', topbar_jezik_switcher: 'true', topbar_custom_tekst: '',
  // Announcement bar
  announcement_bar: '', baner_boja_pozadine: '#085041', baner_boja_teksta: '#ffffff',
  // Nav kategorija
  navkat_aktivan: 'false', navkat_boja: '#1e3a5f', navkat_tekst_boja: '#ffffff',
  navkat_visina: '44', navkat_stil: 'flat', navkat_akcijski_dugme: 'false',
  navkat_akcijski_tekst: 'Akcijski proizvodi', navkat_akcijski_boja: '#DC2626',
  // Hero
  hero_aktivan: 'true', hero_naslov: 'Dobrodošli u naš webshop',
  hero_podnaslov: 'Profesionalna roba za vaše poslovanje',
  hero_dugme_tekst: 'Pregledaj katalog', hero_dugme_url: '/',
  hero_slika_url: '', hero_slika_pozadina_url: '',
  hero_overlay_opacity: '0.4', hero_tekst_pozicija: 'center',
  hero_visina: '400', hero_boja_pozadine: '#0F6E56', hero_tekst_boja: '#ffffff',
  hero_font_naslov: '42', hero_font_podnaslov: '18',
  // Sekcije stranice
  page_sekcije: JSON.stringify([
    { id: 'hero', aktivan: true, instanceId: 'hero-1' },
    { id: 'akcije', aktivan: true, instanceId: 'akcije-1' },
    { id: 'katalog', aktivan: true, instanceId: 'katalog-1' },
  ]),
  // Katalog / sidebar
  sidebar_sirina: '240', sidebar_boja_pozadine: '#F8FAFA', sidebar_visina_kategorije: '52',
  sidebar_pozicija: 'lijevo', // lijevo | vrh | skriveno
  per_page: '24', default_view: 'table', default_sort: 'naziv', prikazi_bez_stanja: 'true',
  // Artikli
  artikal_prikaz_dvije_cijene: 'false', artikal_velep_label: 'Veleprodajna cijena',
  artikal_malop_label: 'Maloprodajna cijena', artikal_prikaz_pdv: 'false',
  artikal_prikaz_sifra: 'true', artikal_prikaz_kategorija: 'true',
  artikal_prikaz_barcode: 'false', artikal_dugme_tekst: 'Dodaj',
  artikal_badge_stanje: 'pill',
  // Dugmad & forme
  theme_border_radius: '10', theme_dugme_stil: 'gradient',
  theme_dugme_visina: '36', theme_dugme_shadow: 'true',
  theme_kartica_radius: '14', theme_kartica_shadow: 'true',
  theme_input_stil: 'border', theme_badge_stil: 'pill',
  // Korpa & narudžbe
  nacini_placanja: 'Virman,Gotovina,Kartica', korpa_napomena: 'true',
  korpa_pdv_prikaz: 'true', min_narudzba: '0',
  // Footer
  theme_footer_boja: '#ffffff', theme_footer_tekst: 'B2B webshop · Powered by NIBIS ERP',
  theme_footer_logo_url: '', theme_footer_bg_slika: '',
  footer_kolone_aktivan: 'false',
  footer_kolona1_naslov: 'Kontakt', footer_kolona1_sadrzaj: '',
  footer_kolona2_naslov: 'Linkovi', footer_kolona2_sadrzaj: '',
  footer_kolona3_naslov: 'Radno vrijeme', footer_kolona3_sadrzaj: '',
  // Custom CSS
  theme_custom_css: '',
}

const PRESET_TEME = [
  { naziv: 'Emerald', emoji: '🟢', boje: { theme_primary_boja: '#0F6E56', theme_bg_stranica: '#F8FAFA', theme_bg_kartica: '#ffffff', theme_border_boja: '#E8EDEB', theme_tekst_boja: '#0D1F1A', header_boja: '#ffffff', baner_boja_pozadine: '#085041', hero_boja_pozadine: '#0F6E56' } },
  { naziv: 'Ocean', emoji: '🔵', boje: { theme_primary_boja: '#0369A1', theme_bg_stranica: '#F0F9FF', theme_bg_kartica: '#ffffff', theme_border_boja: '#BAE6FD', theme_tekst_boja: '#0C4A6E', header_boja: '#ffffff', baner_boja_pozadine: '#0C4A6E', hero_boja_pozadine: '#0369A1' } },
  { naziv: 'Dark', emoji: '⚫', boje: { theme_primary_boja: '#10B981', theme_bg_stranica: '#111827', theme_bg_kartica: '#1F2937', theme_border_boja: '#374151', theme_tekst_boja: '#F9FAFB', header_boja: '#1F2937', baner_boja_pozadine: '#064E3B', hero_boja_pozadine: '#064E3B' } },
  { naziv: 'Violet', emoji: '🟣', boje: { theme_primary_boja: '#7C3AED', theme_bg_stranica: '#FAF5FF', theme_bg_kartica: '#ffffff', theme_border_boja: '#E9D5FF', theme_tekst_boja: '#2E1065', header_boja: '#ffffff', baner_boja_pozadine: '#4C1D95', hero_boja_pozadine: '#7C3AED' } },
  { naziv: 'Corporate', emoji: '🔷', boje: { theme_primary_boja: '#1e3a5f', theme_bg_stranica: '#F8FAFC', theme_bg_kartica: '#ffffff', theme_border_boja: '#E2E8F0', theme_tekst_boja: '#0F172A', header_boja: '#1e3a5f', baner_boja_pozadine: '#0f2340', hero_boja_pozadine: '#1e3a5f' } },
  { naziv: 'Rose', emoji: '🔴', boje: { theme_primary_boja: '#E11D48', theme_bg_stranica: '#FFF1F2', theme_bg_kartica: '#ffffff', theme_border_boja: '#FECDD3', theme_tekst_boja: '#881337', header_boja: '#ffffff', baner_boja_pozadine: '#9F1239', hero_boja_pozadine: '#E11D48' } },
]

const GOOGLE_FONTS = ['DM Sans', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Nunito', 'Montserrat', 'Raleway', 'Merriweather', 'Playfair Display', 'Source Sans 3']

// ─── UI Helpers ────────────────────────────────────────────────────────────────
function Sec({ title, children, desc }: { title: string; children: React.ReactNode; desc?: string }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ marginBottom: '14px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h3>
        {desc && <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 0' }}>{desc}</p>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>{children}</div>
}

function Row3({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>{children}</div>
}

function Txt({ label, k, p, type = 'text', hint }: { label: string; k: string; p?: Postavke; type?: string; hint?: string }) {
  return null // placeholder — real impl below
}

function Divider() {
  return <div style={{ height: '1px', background: '#F3F4F6', margin: '4px 0' }} />
}

function Toggle({ label, value, onChange, desc }: { label: string; value: string; onChange: (v: string) => void; desc?: string }) {
  const on = value === 'true'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: on ? '#F0FDF4' : '#F9FAFB', borderRadius: '10px', border: `1px solid ${on ? '#BBF7D0' : '#E5E7EB'}`, gap: '10px' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{label}</div>
        {desc && <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(on ? 'false' : 'true')} style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', flexShrink: 0,
        background: on ? '#0F6E56' : '#D1D5DB', position: 'relative', transition: 'background 0.2s',
      }}>
        <span style={{ position: 'absolute', top: '2px', left: on ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  )
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px', background: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
        <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
          style={{ width: '40px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0, background: 'none' }} />
        <input type="text" value={value} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
          style={{ flex: 1, padding: '6px 8px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none', background: 'white' }} />
        <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: value, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
      </div>
    </div>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text', hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: 'white', color: '#111827' }}
        onFocus={e => { e.target.style.borderColor = '#0F6E56'; e.target.style.boxShadow = '0 0 0 2px rgba(15,110,86,0.1)' }}
        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }} />
      {hint && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>{hint}</div>}
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder, rows = 3, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; hint?: string }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: 'white', color: '#111827', resize: 'vertical', lineHeight: 1.5 }}
        onFocus={e => { e.target.style.borderColor = '#0F6E56' }}
        onBlur={e => { e.target.style.borderColor = '#E5E7EB' }} />
      {hint && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>{hint}</div>}
    </div>
  )
}

function Slider({ label, value, onChange, min, max, unit = 'px' }: { label: string; value: string; onChange: (v: string) => void; min: number; max: number; unit?: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F6E56' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value || min} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', accentColor: '#0F6E56', height: '4px' }} />
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', background: 'white', color: '#111827', cursor: 'pointer' }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )
}

function ImageInput({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {value ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <ImgIcon size={20} style={{ color: '#D1D5DB' }} />}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="https://..."
            style={{ width: '100%', padding: '8px 10px', fontSize: '12px', border: '1px solid #E5E7EB', borderRadius: '7px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: 'white' }}
            onFocus={e => e.target.style.borderColor = '#0F6E56'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
          {hint && <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{hint}</div>}
        </div>
      </div>
    </div>
  )
}

function ChoiceGroup({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string; icon?: string }[] }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {options.map(o => (
          <button key={o.v} onClick={() => onChange(o.v)}
            style={{ padding: '7px 14px', fontSize: '12px', fontWeight: 500, border: `1.5px solid ${value === o.v ? '#0F6E56' : '#E5E7EB'}`, borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', background: value === o.v ? '#F0FDF4' : 'white', color: value === o.v ? '#0F6E56' : '#374151', transition: 'all 0.15s' }}>
            {o.icon && <span style={{ marginRight: '5px' }}>{o.icon}</span>}{o.l}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Accordion sekcija ─────────────────────────────────────────────────────────
function AccordionSec({ title, icon, children, defaultOpen = false, badge }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; badge?: string }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: open ? '#F0FDF4' : 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderBottom: open ? '1px solid #E5E7EB' : 'none' }}>
        <span style={{ color: open ? '#0F6E56' : '#6B7280', display: 'flex', flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 600, color: open ? '#0F6E56' : '#111827' }}>{title}</span>
        {badge && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: '#FEF3C7', color: '#92400E' }}>{badge}</span>}
        {open ? <ChevronDown size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} />}
      </button>
      {open && <div style={{ padding: '20px 16px', background: 'white', display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</div>}
    </div>
  )
}

// ─── Glavni Composer ───────────────────────────────────────────────────────────
export default function IzgledPage() {
  const [p, setP] = useState<Postavke>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changed, setChanged] = useState(false)
  const [history, setHistory] = useState<Postavke[]>([])
  const [preview, setPreview] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const allKeys = Object.keys(DEFAULTS)

  useEffect(() => {
    supabase.from('postavke').select('kljuc, vrijednost').in('kljuc', allKeys)
      .then(({ data }) => {
        const m: Postavke = { ...DEFAULTS }
        data?.forEach(row => { m[row.kljuc] = row.vrijednost })
        setP(m)
        setLoading(false)
      })
  }, [])

  function set(key: string, value: string) {
    setHistory(h => [...h.slice(-30), p])
    setP(prev => ({ ...prev, [key]: value }))
    setChanged(true)
    // Live update u iframeu
    iframeRef.current?.contentWindow?.postMessage({ type: 'THEME_UPDATE', key, value }, '*')
  }

  function undo() {
    if (!history.length) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setP(prev)
    setChanged(true)
    iframeRef.current?.contentWindow?.postMessage({ type: 'THEME_FULL_RELOAD' }, '*')
  }

  function applyPreset(preset: typeof PRESET_TEME[0]) {
    setHistory(h => [...h.slice(-30), p])
    setP(prev => ({ ...prev, ...preset.boje }))
    setChanged(true)
    Object.entries(preset.boje).forEach(([k, v]) => {
      iframeRef.current?.contentWindow?.postMessage({ type: 'THEME_UPDATE', key: k, value: v }, '*')
    })
  }

  async function save() {
    setSaving(true)
    await supabase.from('postavke').upsert(
      Object.entries(p).map(([kljuc, vrijednost]) => ({ kljuc, vrijednost: vrijednost || '' })),
      { onConflict: 'kljuc' }
    )
    setSaving(false); setSaved(true); setChanged(false)
    setTimeout(() => setSaved(false), 2500)
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'nibis-theme.json'; a.click()
    URL.revokeObjectURL(url)
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        setHistory(h => [...h.slice(-30), p])
        setP(prev => ({ ...prev, ...data }))
        setChanged(true)
      } catch {}
    }
    reader.readAsText(file)
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[1,2,3,4,5].map(i => <div key={i} style={{ height: '56px', background: '#F3F4F6', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />)}
    </div>
  )

  const Panel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* ── IZGLED STRANICE ─────────────────────────────────────── */}
      <AccordionSec title="Izgled stranice" icon={<Palette size={18} />} defaultOpen={true}>

        <Sec title="Brze teme" desc="Klikni za trenutnu primjenu cijelog izgleda">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {PRESET_TEME.map(t => (
              <button key={t.naziv} onClick={() => applyPreset(t)}
                style={{ padding: '12px 8px', border: `2px solid ${p.theme_primary_boja === t.boje.theme_primary_boja ? '#0F6E56' : '#E5E7EB'}`, borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', background: p.theme_primary_boja === t.boje.theme_primary_boja ? '#F0FDF4' : 'white', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[t.boje.theme_primary_boja, t.boje.theme_bg_kartica, t.boje.header_boja].map((c, i) => (
                    <div key={i} style={{ width: '14px', height: '14px', borderRadius: '3px', background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                  ))}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>{t.naziv}</span>
              </button>
            ))}
          </div>
        </Sec>

        <Sec title="Primarne boje">
          <Row>
            <ColorPicker label="Glavna boja (dugmad, linkovi)" value={p.theme_primary_boja} onChange={v => set('theme_primary_boja', v)} />
            <ColorPicker label="Pozadina stranice" value={p.theme_bg_stranica} onChange={v => set('theme_bg_stranica', v)} />
          </Row>
          <Row>
            <ColorPicker label="Pozadina kartica" value={p.theme_bg_kartica} onChange={v => set('theme_bg_kartica', v)} />
            <ColorPicker label="Boja bordera" value={p.theme_border_boja} onChange={v => set('theme_border_boja', v)} />
          </Row>
          <Row>
            <ColorPicker label="Boja teksta" value={p.theme_tekst_boja} onChange={v => set('theme_tekst_boja', v)} />
            <ColorPicker label="Sekundarni tekst" value={p.theme_tekst_muted} onChange={v => set('theme_tekst_muted', v)} />
          </Row>
          <Row>
            <ColorPicker label="Boja cijena" value={p.theme_cijena_boja} onChange={v => set('theme_cijena_boja', v)} />
            <ColorPicker label="Boja akcija/popusta" value={p.theme_akcija_boja} onChange={v => set('theme_akcija_boja', v)} />
          </Row>
        </Sec>

        <Sec title="Font">
          <Select label="Font cijelog sajta" value={p.theme_font} onChange={v => set('theme_font', v)}
            options={GOOGLE_FONTS.map(f => ({ v: f, l: f }))} />
          <Row>
            <Input label="Google Font — naslovi (npr. Playfair Display)" value={p.theme_google_font_naslov} onChange={v => set('theme_google_font_naslov', v)} placeholder="Playfair Display" hint="Ostavite prazno ako koristite isti font" />
            <Input label="Google Font — tijelo teksta" value={p.theme_google_font_tijelo} onChange={v => set('theme_google_font_tijelo', v)} placeholder="Inter" />
          </Row>
          <Row>
            <Slider label="Veličina teksta" value={p.theme_font_body_size} onChange={v => set('theme_font_body_size', v)} min={11} max={18} />
            <Slider label="Veličina naslova" value={p.theme_font_naslov_size} onChange={v => set('theme_font_naslov_size', v)} min={14} max={36} />
          </Row>
        </Sec>

        <Sec title="Zaobljenost i stil">
          <Slider label="Zaobljenost (kartice, dugmad)" value={p.theme_border_radius} onChange={v => set('theme_border_radius', v)} min={0} max={28} />
          <Row>
            <ChoiceGroup label="Stil dugmadi" value={p.theme_dugme_stil}
              onChange={v => set('theme_dugme_stil', v)}
              options={[{ v: 'solid', l: 'Puno' }, { v: 'gradient', l: 'Gradijent' }, { v: 'outline', l: 'Outline' }]} />
            <Toggle label="Sjena na dugmadima" value={p.theme_dugme_shadow} onChange={v => set('theme_dugme_shadow', v)} />
          </Row>
        </Sec>

      </AccordionSec>

      {/* ── ZAGLAVLJE (HEADER) ───────────────────────────────────── */}
      <AccordionSec title="Zaglavlje (Header)" icon={<AlignLeft size={18} />} defaultOpen={false}>

        <Sec title="Layout zaglavlja" desc="Kako je organizovano zaglavlje">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { v: 'minimal', l: 'Minimalni', desc: 'Logo lijevo, search u sredini', emoji: '◫' },
              { v: 'rs_stil', l: 'R&S stil', desc: 'Logo + search + korpa u redu', emoji: '⊞' },
              { v: 'centered', l: 'Centrirani', desc: 'Logo centar, search ispod', emoji: '⊟' },
            ].map(o => (
              <button key={o.v} onClick={() => set('header_layout', o.v)}
                style={{ padding: '12px', border: `2px solid ${p.header_layout === o.v ? '#0F6E56' : '#E5E7EB'}`, borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', background: p.header_layout === o.v ? '#F0FDF4' : 'white', textAlign: 'center', transition: 'all 0.15s' }}>
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>{o.emoji}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: p.header_layout === o.v ? '#0F6E56' : '#374151' }}>{o.l}</div>
                <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>{o.desc}</div>
              </button>
            ))}
          </div>
        </Sec>

        <Sec title="Boje zaglavlja">
          <Row>
            <ColorPicker label="Pozadina" value={p.header_boja} onChange={v => set('header_boja', v)} />
            <ColorPicker label="Boja teksta i ikona" value={p.header_tekst_boja} onChange={v => set('header_tekst_boja', v)} />
          </Row>
        </Sec>

        <Sec title="Postavke">
          <Slider label="Visina zaglavlja" value={p.header_visina_nova || '64'} onChange={v => set('header_visina_nova', v)} min={44} max={120} />
          <Row>
            <Toggle label="Fiksirano zaglavlje (sticky)" value={p.header_sticky || 'true'} onChange={v => set('header_sticky', v)} desc="Ostaje vidljivo dok scrollaš" />
            <Toggle label="Efekt mutnog stakla (blur)" value={p.header_blur || 'true'} onChange={v => set('header_blur', v)} />
          </Row>
          <Row>
            <Toggle label="Sjena ispod zaglavlja" value={p.header_shadow_nova || 'true'} onChange={v => set('header_shadow_nova', v)} />
            <Toggle label="Linija ispod zaglavlja" value={p.header_border_bottom || 'true'} onChange={v => set('header_border_bottom', v)} />
          </Row>
        </Sec>

        <Sec title="Search polje">
          <ChoiceGroup label="Pozicija searcha" value={p.header_search_stil || 'inline'}
            onChange={v => set('header_search_stil', v)}
            options={[{ v: 'inline', l: 'U zaglavlju' }, { v: 'bar', l: 'Ispod zaglavlja' }, { v: 'hidden', l: 'Sakrij' }]} />
          <Slider label="Širina search polja" value={p.header_search_sirina || '520'} onChange={v => set('header_search_sirina', v)} min={200} max={900} />
          <Input label="Placeholder tekst" value={p.header_search_placeholder || ''} onChange={v => set('header_search_placeholder', v)} placeholder="Pretraži artikle, šifre..." />
        </Sec>

        <Sec title="Dugme korpe">
          <ChoiceGroup label="Stil dugmeta korpe" value={p.header_korpa_stil || 'button'}
            onChange={v => set('header_korpa_stil', v)}
            options={[{ v: 'button', l: 'Dugme s tekstom' }, { v: 'pill', l: 'Zaobljeno' }, { v: 'icon', l: 'Samo ikona' }]} />
          <ColorPicker label="Boja dugmeta (prazno = primarna)" value={p.header_korpa_boja || ''} onChange={v => set('header_korpa_boja', v)} />
        </Sec>

        <Sec title="Info traka iznad zaglavlja">
          <Toggle label="Prikazati info traku" value={p.topbar_aktivan || 'false'} onChange={v => set('topbar_aktivan', v)} desc="Tanka traka s kontaktima na vrhu stranice" />
          {p.topbar_aktivan === 'true' && (
            <>
              <Row>
                <Input label="Telefon" value={p.topbar_telefon || ''} onChange={v => set('topbar_telefon', v)} placeholder="+387 33 000 000" />
                <Input label="Email" value={p.topbar_email || ''} onChange={v => set('topbar_email', v)} placeholder="info@firma.ba" />
              </Row>
              <Row>
                <Input label="Radno vrijeme" value={p.topbar_radno_vrijeme || ''} onChange={v => set('topbar_radno_vrijeme', v)} placeholder="Pon–Pet 08–16h" />
                <Input label="Adresa" value={p.topbar_adresa || ''} onChange={v => set('topbar_adresa', v)} placeholder="Ulica bb, Sarajevo" />
              </Row>
              <Input label="Vlastiti tekst (opcionalno)" value={p.topbar_custom_tekst || ''} onChange={v => set('topbar_custom_tekst', v)} placeholder="Besplatna dostava za narudžbe iznad 200 KM" />
              <Row>
                <ColorPicker label="Pozadina trake" value={p.topbar_boja || '#1F2937'} onChange={v => set('topbar_boja', v)} />
                <ColorPicker label="Boja teksta" value={p.topbar_tekst_boja || '#9CA3AF'} onChange={v => set('topbar_tekst_boja', v)} />
              </Row>
            </>
          )}
        </Sec>

        <Sec title="Obavijest (announcement bar)">
          <Input label="Tekst obavijesti" value={p.announcement_bar || ''} onChange={v => set('announcement_bar', v)} placeholder="Narudžbe do 14h — isporuka narednog radnog dana" hint="Ostavite prazno da sakrijete" />
          <Row>
            <ColorPicker label="Pozadina" value={p.baner_boja_pozadine || '#085041'} onChange={v => set('baner_boja_pozadine', v)} />
            <ColorPicker label="Boja teksta" value={p.baner_boja_teksta || '#ffffff'} onChange={v => set('baner_boja_teksta', v)} />
          </Row>
        </Sec>

      </AccordionSec>

      {/* ── LOGO I IDENTITET ─────────────────────────────────────── */}
      <AccordionSec title="Logo i identitet firme" icon={<Globe size={18} />} defaultOpen={false}>

        <Sec title="Logo">
          <ImageInput label="Logo URL (preporučeno: PNG transparentna pozadina, 200×60px)" value={p.theme_logo_url || ''} onChange={v => set('theme_logo_url', v)} hint="Npr: https://vasafirma.ba/logo.png ili uploadajte na Imgur/Cloudinary" />
          <ImageInput label="Favicon (ikonica u tabu browsera, 32×32px)" value={p.theme_favicon_url || ''} onChange={v => set('theme_favicon_url', v)} />
          <ImageInput label="Logo u footeru (opcionalno, ostavite prazno za isti)" value={p.theme_footer_logo_url || ''} onChange={v => set('theme_footer_logo_url', v)} />
        </Sec>

        <Sec title="Podaci firme">
          <Row>
            <Input label="Naziv firme" value={p.shop_naziv || ''} onChange={v => set('shop_naziv', v)} placeholder="Vaša firma d.o.o." />
            <Input label="Web stranica" value={p.shop_web || ''} onChange={v => set('shop_web', v)} placeholder="www.vasafirma.ba" />
          </Row>
          <Row>
            <Input label="Email" value={p.shop_email || ''} onChange={v => set('shop_email', v)} placeholder="info@vasafirma.ba" />
            <Input label="Telefon" value={p.shop_telefon || ''} onChange={v => set('shop_telefon', v)} placeholder="+387 33 000 000" />
          </Row>
          <Input label="Adresa" value={p.shop_adresa || ''} onChange={v => set('shop_adresa', v)} placeholder="Ulica bb, 71000 Sarajevo" />
          <Row>
            <Input label="PIB / ID broj" value={p.shop_pib || ''} onChange={v => set('shop_pib', v)} placeholder="4201234560001" />
            <Input label="PDV broj" value={p.shop_pdv_broj || ''} onChange={v => set('shop_pdv_broj', v)} placeholder="200123456789" />
          </Row>
        </Sec>

        <Sec title="SEO i dijeljenje na društvenim mrežama">
          <Input label="Naslov stranice (tab u browseru)" value={p.seo_naslov || ''} onChange={v => set('seo_naslov', v)} placeholder="Vaša firma — B2B webshop" />
          <Textarea label="Opis stranice" value={p.seo_opis || ''} onChange={v => set('seo_opis', v)} placeholder="Kratki opis koji se prikazuje u Google pretrazi..." rows={2} />
          <ImageInput label="Slika za dijeljenje (OG slika, 1200×630px)" value={p.seo_og_slika || ''} onChange={v => set('seo_og_slika', v)} hint="Prikazuje se kad dijelite link na Viber, Facebook..." />
        </Sec>

        <Sec title="Društvene mreže">
          <Row>
            <Input label="Facebook" value={p.footer_social_facebook || ''} onChange={v => set('footer_social_facebook', v)} placeholder="https://facebook.com/vasafirma" />
            <Input label="Instagram" value={p.footer_social_instagram || ''} onChange={v => set('footer_social_instagram', v)} placeholder="https://instagram.com/vasafirma" />
          </Row>
          <Input label="LinkedIn" value={p.footer_social_linkedin || ''} onChange={v => set('footer_social_linkedin', v)} placeholder="https://linkedin.com/company/vasafirma" />
        </Sec>

      </AccordionSec>

      {/* ── HERO BANNER ──────────────────────────────────────────── */}
      <AccordionSec title="Hero banner (glavni baner)" icon={<ImgIcon size={18} />} defaultOpen={false}>

        <Toggle label="Prikazati hero banner" value={p.hero_aktivan || 'true'} onChange={v => set('hero_aktivan', v)} />

        {p.hero_aktivan !== 'false' && (
          <>
            <Sec title="Sadržaj">
              <Input label="Naslov" value={p.hero_naslov || ''} onChange={v => set('hero_naslov', v)} placeholder="Dobrodošli u naš webshop" />
              <Input label="Podnaslov" value={p.hero_podnaslov || ''} onChange={v => set('hero_podnaslov', v)} placeholder="Profesionalna roba za vaše poslovanje" />
              <Row>
                <Input label="Tekst dugmeta" value={p.hero_dugme_tekst || ''} onChange={v => set('hero_dugme_tekst', v)} placeholder="Pregledaj katalog" />
                <Input label="URL dugmeta" value={p.hero_dugme_url || '/'} onChange={v => set('hero_dugme_url', v)} placeholder="/" />
              </Row>
            </Sec>

            <Sec title="Pozadina" desc="Slika ima prioritet nad bojom">
              <ImageInput label="Slika pozadine" value={p.hero_slika_url || ''} onChange={v => set('hero_slika_url', v)} hint="Preporučeno: min 1920×600px, WebP format" />
              <ColorPicker label="Boja pozadine (ako nema slike)" value={p.hero_boja_pozadine || '#0F6E56'} onChange={v => set('hero_boja_pozadine', v)} />
              {p.hero_slika_url && (
                <Slider label="Zatamnjenje slike (overlay)" value={p.hero_overlay_opacity || '0.4'} onChange={v => set('hero_overlay_opacity', v)} min={0} max={1} unit="" />
              )}
            </Sec>

            <Sec title="Izgled teksta">
              <ColorPicker label="Boja teksta na baneru" value={p.hero_tekst_boja || '#ffffff'} onChange={v => set('hero_tekst_boja', v)} />
              <ChoiceGroup label="Pozicija teksta" value={p.hero_tekst_pozicija || 'center'}
                onChange={v => set('hero_tekst_pozicija', v)}
                options={[{ v: 'left', l: '← Lijevo' }, { v: 'center', l: '☰ Centar' }, { v: 'right', l: 'Desno →' }]} />
              <Row>
                <Slider label="Veličina naslova" value={p.hero_font_naslov || '42'} onChange={v => set('hero_font_naslov', v)} min={20} max={72} />
                <Slider label="Visina banera" value={p.hero_visina || '400'} onChange={v => set('hero_visina', v)} min={150} max={700} />
              </Row>
            </Sec>
          </>
        )}

      </AccordionSec>

      {/* ── NAVIGACIJA KATEGORIJA ─────────────────────────────────── */}
      <AccordionSec title="Navigacija kategorija" icon={<Layout size={18} />} defaultOpen={false}>

        <Toggle label="Horizontalni nav kategorija ispod zaglavlja" value={p.navkat_aktivan || 'false'} onChange={v => set('navkat_aktivan', v)} desc="Prikazuje kategorije kao meni — kao na ris.ba" />

        {p.navkat_aktivan === 'true' && (
          <>
            <Row>
              <ColorPicker label="Pozadina nava" value={p.navkat_boja || '#1e3a5f'} onChange={v => set('navkat_boja', v)} />
              <ColorPicker label="Boja teksta" value={p.navkat_tekst_boja || '#ffffff'} onChange={v => set('navkat_tekst_boja', v)} />
            </Row>
            <Slider label="Visina nava" value={p.navkat_visina || '44'} onChange={v => set('navkat_visina', v)} min={32} max={72} />
            <ChoiceGroup label="Stil kategorija u navu" value={p.navkat_stil || 'flat'}
              onChange={v => set('navkat_stil', v)}
              options={[
                { v: 'flat', l: 'Flat' },
                { v: 'pills', l: 'Pills' },
                { v: 'underline', l: 'Podvučeno' },
                { v: 'boje_kategorija', l: 'Boje (kao R&S)' },
              ]} />
            <Divider />
            <Toggle label="Akcijsko dugme s lijeve strane" value={p.navkat_akcijski_dugme || 'false'} onChange={v => set('navkat_akcijski_dugme', v)} />
            {p.navkat_akcijski_dugme === 'true' && (
              <Row>
                <Input label="Tekst dugmeta" value={p.navkat_akcijski_tekst || 'Akcijski proizvodi'} onChange={v => set('navkat_akcijski_tekst', v)} />
                <ColorPicker label="Boja dugmeta" value={p.navkat_akcijski_boja || '#DC2626'} onChange={v => set('navkat_akcijski_boja', v)} />
              </Row>
            )}
          </>
        )}

        <Sec title="Sidebar kategorija">
          <ChoiceGroup label="Pozicija kategorija" value={p.sidebar_pozicija || 'lijevo'}
            onChange={v => set('sidebar_pozicija', v)}
            options={[{ v: 'lijevo', l: '◧ S lijeva' }, { v: 'vrh', l: '▤ Na vrhu' }, { v: 'skriveno', l: '✕ Sakrij' }]} />
          <Row>
            <Slider label="Širina sidebara" value={p.sidebar_sirina || '240'} onChange={v => set('sidebar_sirina', v)} min={160} max={360} />
            <Slider label="Visina reda kategorije" value={p.sidebar_visina_kategorije || '52'} onChange={v => set('sidebar_visina_kategorije', v)} min={36} max={80} />
          </Row>
          <ColorPicker label="Pozadina sidebara" value={p.sidebar_boja_pozadine || '#F8FAFA'} onChange={v => set('sidebar_boja_pozadine', v)} />
        </Sec>

      </AccordionSec>

      {/* ── ARTIKLI I KATALOG ──────────────────────────────────────── */}
      <AccordionSec title="Artikli i katalog" icon={<ShoppingBag size={18} />} defaultOpen={false}>

        <Sec title="Prikaz cijena">
          <Toggle label="Prikazati dvije cijene (veleprodajna + maloprodajna)" value={p.artikal_prikaz_dvije_cijene || 'false'} onChange={v => set('artikal_prikaz_dvije_cijene', v)} desc="Kao na ris.ba — vidljive obje cijene" />
          {p.artikal_prikaz_dvije_cijene === 'true' && (
            <Row>
              <Input label="Naziv veleprodajne" value={p.artikal_velep_label || 'Veleprodajna cijena'} onChange={v => set('artikal_velep_label', v)} />
              <Input label="Naziv maloprodajne" value={p.artikal_malop_label || 'Maloprodajna cijena'} onChange={v => set('artikal_malop_label', v)} />
            </Row>
          )}
          <Toggle label="Prikazati +PDV uz cijenu" value={p.artikal_prikaz_pdv || 'false'} onChange={v => set('artikal_prikaz_pdv', v)} />
        </Sec>

        <Sec title="Kolone u tabeli">
          <Toggle label="Prikazati šifru artikla" value={p.artikal_prikaz_sifra || 'true'} onChange={v => set('artikal_prikaz_sifra', v)} />
          <Toggle label="Prikazati kategoriju" value={p.artikal_prikaz_kategorija || 'true'} onChange={v => set('artikal_prikaz_kategorija', v)} />
          <Toggle label="Prikazati barcode" value={p.artikal_prikaz_barcode || 'false'} onChange={v => set('artikal_prikaz_barcode', v)} />
        </Sec>

        <Sec title="Pregled kataloga">
          <Row>
            <Select label="Artikala po stranici" value={p.per_page || '24'} onChange={v => set('per_page', v)}
              options={[{ v: '12', l: '12' }, { v: '24', l: '24' }, { v: '36', l: '36' }, { v: '48', l: '48' }]} />
            <ChoiceGroup label="Zadani prikaz" value={p.default_view || 'table'}
              onChange={v => set('default_view', v)}
              options={[{ v: 'table', l: '≡ Tabela' }, { v: 'grid', l: '⊞ Grid' }]} />
          </Row>
          <Input label="Tekst dugmeta za dodavanje u korpu" value={p.artikal_dugme_tekst || 'Dodaj'} onChange={v => set('artikal_dugme_tekst', v)} />
        </Sec>

        <Sec title="Narudžbe i korpa">
          <Input label="Načini plaćanja (odvojeni zarezom)" value={p.nacini_placanja || 'Virman,Gotovina'} onChange={v => set('nacini_placanja', v)} placeholder="Virman,Gotovina,Kartica" />
          <Input label="Minimalna narudžba (KM, 0 = bez limita)" value={p.min_narudzba || '0'} onChange={v => set('min_narudzba', v)} type="number" />
          <Toggle label="Napomena uz narudžbu" value={p.korpa_napomena || 'true'} onChange={v => set('korpa_napomena', v)} desc="Kupac može upisati napomenu" />
          <Toggle label="Prikazati PDV u korpi" value={p.korpa_pdv_prikaz || 'true'} onChange={v => set('korpa_pdv_prikaz', v)} />
        </Sec>

      </AccordionSec>

      {/* ── PODNOŽJE (FOOTER) ─────────────────────────────────────── */}
      <AccordionSec title="Podnožje (Footer)" icon={<Settings size={18} />} defaultOpen={false}>

        <Sec title="Izgled footera">
          <ColorPicker label="Pozadina footera" value={p.theme_footer_boja || '#ffffff'} onChange={v => set('theme_footer_boja', v)} />
          <ImageInput label="Slika pozadine footera (opcionalno)" value={p.theme_footer_bg_slika || ''} onChange={v => set('theme_footer_bg_slika', v)} />
          <Input label="Copyright tekst" value={p.theme_footer_tekst || ''} onChange={v => set('theme_footer_tekst', v)} placeholder="B2B webshop · Powered by NIBIS ERP" />
        </Sec>

        <Sec title="Kolone u footeru">
          <Toggle label="Prikazati kolone s informacijama" value={p.footer_kolone_aktivan || 'false'} onChange={v => set('footer_kolone_aktivan', v)} desc="Dodaje 3 kolone iznad copyright linije" />
          {p.footer_kolone_aktivan === 'true' && (
            <>
              <Row>
                <Input label="Naslov kolone 1" value={p.footer_kolona1_naslov || 'Kontakt'} onChange={v => set('footer_kolona1_naslov', v)} />
                <Textarea label="Sadržaj kolone 1" value={p.footer_kolona1_sadrzaj || ''} onChange={v => set('footer_kolona1_sadrzaj', v)} placeholder="Tel: +387 33...\nEmail: info@..." rows={3} />
              </Row>
              <Row>
                <Input label="Naslov kolone 2" value={p.footer_kolona2_naslov || 'Linkovi'} onChange={v => set('footer_kolona2_naslov', v)} />
                <Textarea label="Sadržaj kolone 2" value={p.footer_kolona2_sadrzaj || ''} onChange={v => set('footer_kolona2_sadrzaj', v)} placeholder="O nama\nKontakt\nDostava..." rows={3} />
              </Row>
              <Row>
                <Input label="Naslov kolone 3" value={p.footer_kolona3_naslov || 'Radno vrijeme'} onChange={v => set('footer_kolona3_naslov', v)} />
                <Textarea label="Sadržaj kolone 3" value={p.footer_kolona3_sadrzaj || ''} onChange={v => set('footer_kolona3_sadrzaj', v)} placeholder="Pon–Pet: 08–16h\nSub: 08–13h" rows={3} />
              </Row>
            </>
          )}
        </Sec>

      </AccordionSec>

      {/* ── REGISTRACIJA ─────────────────────────────────────────── */}
      <AccordionSec title="Registracija i pristup" icon={<Globe size={18} />} defaultOpen={false}>
        <Toggle label="Otvorena registracija" value={p.registracija_otvorena || 'true'} onChange={v => set('registracija_otvorena', v)} desc="Novi kupci se mogu sami registrovati" />
        <Input label="Poruka pri registraciji" value={p.registracija_poruka || ''} onChange={v => set('registracija_poruka', v)} placeholder="Vaš zahtjev je primljen. Kontaktirat ćemo vas..." />
        <Toggle label="Email potvrda narudžbe kupcu" value={p.email_potvrda_narudzba || 'true'} onChange={v => set('email_potvrda_narudzba', v)} />
        <Toggle label="Email obavijest adminu — nova narudžba" value={p.email_admin_narudzba || 'true'} onChange={v => set('email_admin_narudzba', v)} />
        <Toggle label="Email obavijest adminu — nova registracija" value={p.email_admin_registracija || 'true'} onChange={v => set('email_admin_registracija', v)} />
      </AccordionSec>

      {/* ── CUSTOM CSS ───────────────────────────────────────────── */}
      <AccordionSec title="Napredne postavke (Custom CSS)" icon={<Type size={18} />} defaultOpen={false} badge="Za developere">
        <div style={{ padding: '10px', background: '#FEF3C7', borderRadius: '8px', fontSize: '12px', color: '#92400E' }}>
          ⚠️ Ove postavke su namijenjene developerima. Pogrešan CSS može pokvariti izgled sajta.
        </div>
        <Textarea label="Custom CSS kod" value={p.theme_custom_css || ''} onChange={v => set('theme_custom_css', v)} rows={10} placeholder="/* Ovdje unesite vlastiti CSS */\n\n.header { ... }" />
      </AccordionSec>

    </div>
  )

  return (
    <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>

      {/* ── LIJEVA KOLONA — PANEL ─────────────────────────────────── */}
      <div style={{ width: preview ? '380px' : '100%', maxWidth: preview ? '380px' : '780px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', borderRight: preview ? '1px solid #E5E7EB' : 'none' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px', borderBottom: '1px solid #E5E7EB', flexShrink: 0, background: 'white' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827' }}>🎨 Podešavanja izgleda</h1>
            {changed && <p style={{ fontSize: '11px', color: '#D97706', margin: '2px 0 0', fontWeight: 500 }}>● Ima nesačuvanih promjena</p>}
          </div>
          <button onClick={undo} disabled={!history.length} title="Poništi promjenu"
            style={{ padding: '7px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: history.length ? 'pointer' : 'not-allowed', opacity: history.length ? 1 : 0.35, display: 'flex' }}>
            <Undo2 size={14} style={{ color: '#374151' }} />
          </button>
          <button onClick={exportJSON} title="Eksportuj temu"
            style={{ padding: '7px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: 'pointer', display: 'flex' }}>
            <Download size={14} style={{ color: '#374151' }} />
          </button>
          <label title="Uvezi temu"
            style={{ padding: '7px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: 'pointer', display: 'flex' }}>
            <Upload size={14} style={{ color: '#374151' }} />
            <input type="file" accept=".json" onChange={importJSON} style={{ display: 'none' }} />
          </label>
          <button onClick={() => setPreview(!preview)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', border: `1px solid ${preview ? '#0F6E56' : '#E5E7EB'}`, borderRadius: '8px', background: preview ? '#F0FDF4' : 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: preview ? '#0F6E56' : '#374151', fontFamily: 'inherit' }}>
            {preview ? <EyeOff size={13} /> : <Eye size={13} />}
            {preview ? 'Sakrij' : 'Preview'}
          </button>
          <button onClick={save} disabled={saving || !changed}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: (saving || !changed) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', background: saved ? '#059669' : changed ? '#0F6E56' : '#E5E7EB', color: (saved || changed) ? 'white' : '#9CA3AF', boxShadow: changed ? '0 2px 8px rgba(15,110,86,0.3)' : 'none', transition: 'all 0.2s' }}>
            <Save size={13} />{saving ? 'Čuvam...' : saved ? '✓ Sačuvano' : 'Sačuvaj'}
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <Panel />
        </div>
      </div>

      {/* ── DESNA KOLONA — PREVIEW ────────────────────────────────── */}
      {preview && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F1F5F9', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #E5E7EB', background: 'white', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Live preview</span>
            <div style={{ display: 'flex', gap: '4px', background: '#F3F4F6', padding: '2px', borderRadius: '6px' }}>
              <button style={{ padding: '4px 8px', background: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>🖥️</button>
              <button style={{ padding: '4px 8px', background: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>📱</button>
            </div>
            <button onClick={() => iframeRef.current && (iframeRef.current.src = iframeRef.current.src)}
              style={{ padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: '6px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6B7280', fontFamily: 'inherit' }}>
              <RefreshCw size={11} /> Osvježi
            </button>
            <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 'auto' }}>nibis-webshop.vercel.app</span>
          </div>
          <div style={{ flex: 1, padding: '12px', overflow: 'hidden' }}>
            <iframe ref={iframeRef} src="/" style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px', background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} title="Preview" />
          </div>
        </div>
      )}
    </div>
  )
}

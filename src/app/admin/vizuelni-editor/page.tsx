'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Monitor, Smartphone, Tablet, Eye, EyeOff, Undo2, ChevronLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const SEKCIJE = {
  announcement: {
    naziv: 'Announcement Bar', ikona: '📢',
    polja: [
      { key: 'announcement_bar', label: 'Tekst', type: 'text', placeholder: 'Narudžbe do 14h...' },
      { key: 'baner_boja_pozadine', label: 'Pozadina', type: 'color' },
      { key: 'baner_boja_teksta', label: 'Tekst boja', type: 'color' },
    ]
  },
  header: {
    naziv: 'Header', ikona: '🔝',
    polja: [
      { key: 'shop_naziv', label: 'Naziv', type: 'text' },
      { key: 'theme_logo_url', label: 'Logo URL', type: 'text' },
      { key: 'theme_header_boja', label: 'Pozadina', type: 'color' },
      { key: 'theme_header_tekst_boja', label: 'Tekst boja', type: 'color' },
      { key: 'theme_header_visina', label: 'Visina', type: 'range', min: 44, max: 100 },
      { key: 'theme_header_shadow', label: 'Shadow', type: 'toggle' },
    ]
  },
  hero: {
    naziv: 'Hero Banner', ikona: '🖼️',
    polja: [
      { key: 'hero_aktivan', label: 'Prikaži', type: 'toggle' },
      { key: 'hero_naslov', label: 'Naslov', type: 'text' },
      { key: 'hero_podnaslov', label: 'Podnaslov', type: 'text' },
      { key: 'hero_dugme_tekst', label: 'Tekst dugmeta', type: 'text' },
      { key: 'hero_slika_url', label: 'URL slike', type: 'text' },
      { key: 'hero_boja_pozadine', label: 'Boja pozadine', type: 'color' },
      { key: 'hero_overlay_boja', label: 'Overlay', type: 'color' },
      { key: 'hero_overlay_opacity', label: 'Opacity', type: 'range', min: 0, max: 1, step: 0.05 },
      { key: 'hero_visina', label: 'Visina', type: 'range', min: 150, max: 600 },
      { key: 'hero_tekst_pozicija', label: 'Pozicija', type: 'select', options: ['left', 'center', 'right'] },
    ]
  },
  boje: {
    naziv: 'Boje', ikona: '🎨',
    polja: [
      { key: 'theme_primary_boja', label: 'Primarna', type: 'color' },
      { key: 'theme_bg_stranica', label: 'Pozadina', type: 'color' },
      { key: 'theme_bg_kartica', label: 'Kartice', type: 'color' },
      { key: 'theme_border_boja', label: 'Borderi', type: 'color' },
      { key: 'theme_tekst_boja', label: 'Tekst', type: 'color' },
      { key: 'theme_akcija_boja', label: 'Akcije', type: 'color' },
    ]
  },
  tipografija: {
    naziv: 'Tipografija', ikona: '📝',
    polja: [
      { key: 'theme_font', label: 'Font', type: 'select', options: ['DM Sans','Inter','Roboto','Poppins','Montserrat','Nunito','Lato'] },
      { key: 'theme_font_body_size', label: 'Veličina teksta', type: 'range', min: 11, max: 18 },
      { key: 'theme_font_cijena_size', label: 'Veličina cijene', type: 'range', min: 12, max: 28 },
      { key: 'theme_border_radius', label: 'Zaobljenost', type: 'range', min: 0, max: 28 },
    ]
  },
  dugmad: {
    naziv: 'Dugmad', ikona: '🔘',
    polja: [
      { key: 'theme_dugme_stil', label: 'Stil', type: 'select', options: ['solid','gradient','outline'] },
      { key: 'theme_dugme_visina', label: 'Visina', type: 'range', min: 28, max: 56 },
      { key: 'theme_dugme_shadow', label: 'Glow', type: 'toggle' },
    ]
  },
  footer: {
    naziv: 'Footer', ikona: '🔚',
    polja: [
      { key: 'theme_footer_tekst', label: 'Tekst', type: 'text' },
      { key: 'theme_footer_boja', label: 'Pozadina', type: 'color' },
      { key: 'shop_email', label: 'Email', type: 'text' },
      { key: 'shop_adresa', label: 'Adresa', type: 'text' },
    ]
  },
  css: {
    naziv: 'Custom CSS', ikona: '💻',
    polja: [
      { key: 'theme_custom_css', label: 'CSS', type: 'code' },
    ]
  },
}

type SK = keyof typeof SEKCIJE
type DV = 'desktop' | 'tablet' | 'mobile'

const BOJE_PRESET = ['#0F6E56','#065F46','#059669','#0891B2','#1D4ED8','#7C3AED','#DC2626','#D97706','#374151','#1F2937','#000000','#F8FAFA','#F1F5F9','#ffffff']

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <button onClick={() => setOpen(!open)} style={{ width: '30px', height: '30px', borderRadius: '6px', background: value || '#ffffff', border: '2px solid #374151', cursor: 'pointer', flexShrink: 0 }} />
        <input type="text" value={value} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
          style={{ flex: 1, padding: '5px 7px', fontSize: '11px', fontFamily: 'monospace', border: '1px solid #374151', borderRadius: '5px', background: '#111827', color: '#E2E8F0', outline: 'none' }} />
        <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
          style={{ width: '30px', height: '30px', border: 'none', background: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
      </div>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: '36px', left: 0, zIndex: 20, background: '#1F2937', border: '1px solid #374151', borderRadius: '10px', padding: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', width: '200px' }}>
            {BOJE_PRESET.map(c => (
              <button key={c} onClick={() => { onChange(c); setOpen(false) }} style={{ width: '22px', height: '22px', borderRadius: '4px', background: c, cursor: 'pointer', border: value === c ? '2px solid #0F6E56' : '1px solid rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Field({ field, value, onChange }: { field: any; value: string; onChange: (v: string) => void }) {
  const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#9CA3AF', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 9px', fontSize: '12px', border: '1px solid #374151', borderRadius: '6px', background: '#111827', color: '#E2E8F0', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

  if (field.type === 'color') return (
    <div><label style={labelStyle}>{field.label}</label><ColorInput value={value || '#000000'} onChange={onChange} /></div>
  )

  if (field.type === 'toggle') {
    const on = value === 'true'
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>{field.label}</label>
        <button onClick={() => onChange(on ? 'false' : 'true')} style={{ width: '38px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: on ? '#0F6E56' : '#4B5563', position: 'relative', flexShrink: 0 }}>
          <span style={{ position: 'absolute', top: '2px', left: on ? '20px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.15s' }} />
        </button>
      </div>
    )
  }

  if (field.type === 'range') return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>{field.label}</label>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F6E56' }}>{value}{field.step ? '' : 'px'}</span>
      </div>
      <input type="range" min={field.min} max={field.max} step={field.step || 1} value={value || field.min}
        onChange={e => onChange(e.target.value)} style={{ width: '100%', accentColor: '#0F6E56' }} />
    </div>
  )

  if (field.type === 'select') return (
    <div>
      <label style={labelStyle}>{field.label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, cursor: 'pointer' }}>
        {field.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  if (field.type === 'code') return (
    <div>
      <label style={labelStyle}>{field.label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={12} spellCheck={false}
        placeholder="/* Custom CSS */"
        style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '11px', resize: 'vertical', lineHeight: 1.6 }} />
    </div>
  )

  return (
    <div>
      <label style={labelStyle}>{field.label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = '#0F6E56'}
        onBlur={e => e.target.style.borderColor = '#374151'} />
    </div>
  )
}

export default function VizuelniEditorPage() {
  const [postavke, setPostavke] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changed, setChanged] = useState(false)
  const [history, setHistory] = useState<Record<string, string>[]>([])
  const [sekcija, setSekcija] = useState<SK>('hero')
  const [device, setDevice] = useState<DV>('desktop')
  const [panelOpen, setPanelOpen] = useState(true)
  const [iframeKey, setIframeKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const allKeys = Object.values(SEKCIJE).flatMap(s => s.polja.map((p: any) => p.key))

  useEffect(() => {
    supabase.from('postavke').select('kljuc, vrijednost').in('kljuc', allKeys)
      .then(({ data }) => {
        const m: Record<string, string> = {}
        data?.forEach(p => { m[p.kljuc] = p.vrijednost })
        setPostavke(m)
        setLoading(false)
      })
  }, [])

  function update(key: string, value: string) {
    setHistory(h => [...h.slice(-30), { ...postavke }])
    setPostavke(prev => ({ ...prev, [key]: value }))
    setChanged(true)
    // Pošalji u iframe
    iframeRef.current?.contentWindow?.postMessage({ type: 'THEME_UPDATE', key, value }, '*')
  }

  function undo() {
    if (!history.length) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setPostavke(prev)
    setChanged(true)
    setIframeKey(k => k + 1)
  }

  async function save() {
    setSaving(true)
    const rows = Object.entries(postavke).map(([kljuc, vrijednost]) => ({ kljuc, vrijednost: vrijednost || '' }))
    await supabase.from('postavke').upsert(rows, { onConflict: 'kljuc' })
    setSaving(false); setSaved(true); setChanged(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const activeSek = SEKCIJE[sekcija]
  const deviceWidth = device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '390px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0B0F19', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', height: '50px', background: '#161B27', borderBottom: '1px solid #252D3D', flexShrink: 0 }}>
        <Link href="/admin/izgled" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6B7280', textDecoration: 'none', fontSize: '12px' }}>
          <ChevronLeft size={15} /> Nazad
        </Link>
        <div style={{ width: '1px', height: '18px', background: '#252D3D' }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.01em' }}>
          🎨 Visual Editor
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Device */}
          <div style={{ display: 'flex', background: '#252D3D', borderRadius: '7px', padding: '2px', gap: '1px' }}>
            {([['desktop', '🖥️', 'Desktop'], ['tablet', '📱', 'Tablet'], ['mobile', '📲', 'Mobile']] as const).map(([d, emoji, label]) => (
              <button key={d} onClick={() => setDevice(d)} title={label} style={{
                padding: '4px 8px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '13px',
                background: device === d ? '#0F6E56' : 'transparent',
              }}>{emoji}</button>
            ))}
          </div>
          <button onClick={undo} disabled={!history.length} title="Undo" style={{ padding: '5px', border: '1px solid #252D3D', borderRadius: '6px', background: 'transparent', cursor: history.length ? 'pointer' : 'not-allowed', opacity: history.length ? 1 : 0.4, color: '#9CA3AF', display: 'flex' }}>
            <Undo2 size={13} />
          </button>
          <button onClick={() => setIframeKey(k => k + 1)} title="Refresh preview" style={{ padding: '5px', border: '1px solid #252D3D', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
            <RefreshCw size={13} />
          </button>
          <button onClick={() => setPanelOpen(!panelOpen)} style={{ padding: '5px 9px', border: '1px solid #252D3D', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {panelOpen ? <EyeOff size={12} /> : <Eye size={12} />}
            {panelOpen ? 'Sakrij' : 'Panel'}
          </button>
          <button onClick={save} disabled={saving || !changed} style={{
            display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px',
            fontSize: '12px', fontWeight: 700, border: 'none', borderRadius: '7px',
            cursor: (saving || !changed) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            background: saved ? '#059669' : changed ? '#0F6E56' : '#252D3D',
            color: (saved || changed) ? 'white' : '#4B5563',
            boxShadow: changed ? '0 0 12px rgba(15,110,86,0.4)' : 'none',
          }}>
            <Save size={12} />{saving ? 'Čuvam...' : saved ? '✓' : 'Sačuvaj'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sekcije ikone */}
        <div style={{ width: '48px', background: '#161B27', borderRight: '1px solid #252D3D', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0', gap: '3px', flexShrink: 0 }}>
          {(Object.entries(SEKCIJE) as [SK, any][]).map(([key, s]) => (
            <button key={key} onClick={() => { setSekcija(key); setPanelOpen(true) }} title={s.naziv}
              style={{
                width: '38px', height: '38px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: sekcija === key ? '#0F6E56' : 'transparent',
                fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => { if (sekcija !== key) (e.currentTarget as HTMLElement).style.background = '#252D3D' }}
              onMouseLeave={e => { if (sekcija !== key) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {s.ikona}
            </button>
          ))}
        </div>

        {/* Editor panel */}
        {panelOpen && (
          <div style={{ width: '270px', background: '#161B27', borderRight: '1px solid #252D3D', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #252D3D' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9' }}>{activeSek.ikona} {activeSek.naziv}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loading ? (
                [1,2,3,4].map(i => <div key={i} style={{ height: '44px', background: '#252D3D', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />)
              ) : (
                activeSek.polja.map((field: any) => (
                  <Field key={field.key} field={field} value={postavke[field.key] || ''} onChange={v => update(field.key, v)} />
                ))
              )}
            </div>
            {changed && (
              <div style={{ padding: '10px 12px', borderTop: '1px solid #252D3D', background: 'rgba(15,110,86,0.15)' }}>
                <button onClick={save} disabled={saving} style={{ width: '100%', padding: '8px', background: '#0F6E56', color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 12px rgba(15,110,86,0.4)' }}>
                  {saving ? 'Čuvam...' : '💾 Sačuvaj promjene'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* iframe */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: device === 'desktop' ? 'stretch' : 'flex-start', background: '#0B0F19', padding: device === 'desktop' ? '0' : '20px', overflow: 'auto' }}>
          {device !== 'desktop' && (
            <div style={{ marginBottom: '10px', fontSize: '11px', color: '#4B5563', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {device === 'tablet' ? '📱 768px — Tablet' : '📲 390px — Mobile'}
            </div>
          )}
          <div style={{
            width: deviceWidth, flex: device === 'desktop' ? 1 : 'none',
            height: device === 'desktop' ? '100%' : '700px',
            border: device !== 'desktop' ? '2px solid #252D3D' : 'none',
            borderRadius: device !== 'desktop' ? '20px' : '0',
            overflow: 'hidden',
            boxShadow: device !== 'desktop' ? '0 24px 60px rgba(0,0,0,0.6)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <iframe key={iframeKey} ref={iframeRef} src="/"
              style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
              title="Webshop preview" />
          </div>
        </div>
      </div>
    </div>
  )
}

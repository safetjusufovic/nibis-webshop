'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Monitor, Smartphone, Tablet, Eye, EyeOff, Undo2, ChevronLeft, RefreshCw, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Settings, MousePointer, X } from 'lucide-react'
import Link from 'next/link'

// ─── Sekcije ──────────────────────────────────────────────────────────────────
const SEKCIJE_DEF: Record<string, { naziv: string; ikona: string; opis: string; polja: any[] }> = {
  announcement: {
    naziv: 'Announcement Bar', ikona: '📢', opis: 'Traka na vrhu stranice',
    polja: [
      { key: 'announcement_bar', label: 'Tekst', type: 'text' },
      { key: 'baner_boja_pozadine', label: 'Pozadina', type: 'color' },
      { key: 'baner_boja_teksta', label: 'Tekst boja', type: 'color' },
    ]
  },
  header: {
    naziv: 'Header', ikona: '🔝', opis: 'Navigacija i logo',
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
    naziv: 'Hero Banner', ikona: '🖼️', opis: 'Glavni banner',
    polja: [
      { key: 'hero_aktivan', label: 'Prikaži', type: 'toggle' },
      { key: 'hero_naslov', label: 'Naslov', type: 'text' },
      { key: 'hero_podnaslov', label: 'Podnaslov', type: 'text' },
      { key: 'hero_dugme_tekst', label: 'Tekst dugmeta', type: 'text' },
      { key: 'hero_slika_url', label: 'URL slike', type: 'text' },
      { key: 'hero_boja_pozadine', label: 'Boja pozadine', type: 'color' },
      { key: 'hero_overlay_opacity', label: 'Overlay', type: 'range', min: 0, max: 1, step: 0.05 },
      { key: 'hero_visina', label: 'Visina (px)', type: 'range', min: 150, max: 600 },
      { key: 'hero_tekst_pozicija', label: 'Pozicija', type: 'select', options: ['left', 'center', 'right'] },
    ]
  },
  boje: {
    naziv: 'Boje', ikona: '🎨', opis: 'Primarne boje sajta',
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
    naziv: 'Tipografija', ikona: '📝', opis: 'Fontovi i veličine',
    polja: [
      { key: 'theme_font', label: 'Font', type: 'select', options: ['DM Sans','Inter','Roboto','Poppins','Montserrat','Nunito','Lato'] },
      { key: 'theme_font_body_size', label: 'Veličina teksta', type: 'range', min: 11, max: 18 },
      { key: 'theme_border_radius', label: 'Zaobljenost', type: 'range', min: 0, max: 28 },
    ]
  },
  dugmad: {
    naziv: 'Dugmad', ikona: '🔘', opis: 'Stil dugmadi',
    polja: [
      { key: 'theme_dugme_stil', label: 'Stil', type: 'select', options: ['solid','gradient','outline'] },
      { key: 'theme_dugme_visina', label: 'Visina', type: 'range', min: 28, max: 56 },
      { key: 'theme_dugme_shadow', label: 'Glow', type: 'toggle' },
    ]
  },
  footer: {
    naziv: 'Footer', ikona: '🔚', opis: 'Dno stranice',
    polja: [
      { key: 'theme_footer_tekst', label: 'Tekst', type: 'text' },
      { key: 'theme_footer_boja', label: 'Pozadina', type: 'color' },
      { key: 'shop_email', label: 'Email', type: 'text' },
      { key: 'shop_adresa', label: 'Adresa', type: 'text' },
    ]
  },
  css: {
    naziv: 'Custom CSS', ikona: '💻', opis: 'Vlastiti CSS kod',
    polja: [
      { key: 'theme_custom_css', label: 'CSS', type: 'code' },
    ]
  },
}

// Mapiranje element→sekcija za Fazu 3 (klik na element)
const ELEMENT_MAP: Record<string, string> = {
  'header': 'header',
  'announcement': 'announcement',
  'hero': 'hero',
  'footer': 'footer',
  'button': 'dugmad',
  'h1': 'tipografija',
  'h2': 'tipografija',
  'p': 'tipografija',
}

interface PageSek { id: string; aktivan: boolean; instanceId: string }

const BOJE = ['#0F6E56','#065F46','#059669','#0891B2','#1D4ED8','#7C3AED','#DC2626','#D97706','#374151','#1F2937','#000000','#F8FAFA','#ffffff']

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ field, value, onChange }: { field: any; value: string; onChange: (v: string) => void }) {
  const [colorOpen, setColorOpen] = useState(false)
  const L = <label style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{field.label}</label>
  const I: React.CSSProperties = { width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #374151', borderRadius: '6px', background: '#111827', color: '#E2E8F0', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

  if (field.type === 'color') return (
    <div>
      {L}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <button onClick={() => setColorOpen(!colorOpen)} style={{ width: '28px', height: '28px', borderRadius: '5px', background: value || '#fff', border: '1px solid #374151', cursor: 'pointer', flexShrink: 0 }} />
          <input type="text" value={value} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
            style={{ ...I, fontFamily: 'monospace', fontSize: '11px' }} />
          <input type="color" value={value || '#000'} onChange={e => onChange(e.target.value)}
            style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
        </div>
        {colorOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setColorOpen(false)} />
            <div style={{ position: 'absolute', top: '34px', left: 0, zIndex: 20, background: '#1F2937', border: '1px solid #374151', borderRadius: '8px', padding: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', width: '190px' }}>
              {BOJE.map(c => <button key={c} onClick={() => { onChange(c); setColorOpen(false) }} style={{ width: '20px', height: '20px', borderRadius: '3px', background: c, cursor: 'pointer', border: value === c ? '2px solid #0F6E56' : '1px solid rgba(255,255,255,0.1)' }} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )

  if (field.type === 'toggle') {
    const on = value === 'true'
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{field.label}</label>
        <button onClick={() => onChange(on ? 'false' : 'true')} style={{ width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: on ? '#0F6E56' : '#4B5563', position: 'relative', flexShrink: 0 }}>
          <span style={{ position: 'absolute', top: '2px', left: on ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.15s' }} />
        </button>
      </div>
    )
  }

  if (field.type === 'range') return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <label style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{field.label}</label>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#0F6E56' }}>{value}</span>
      </div>
      <input type="range" min={field.min} max={field.max} step={field.step || 1} value={value || field.min} onChange={e => onChange(e.target.value)} style={{ width: '100%', accentColor: '#0F6E56' }} />
    </div>
  )

  if (field.type === 'select') return (
    <div>{L}<select value={value} onChange={e => onChange(e.target.value)} style={{ ...I, cursor: 'pointer' }}>
      {field.options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select></div>
  )

  if (field.type === 'code') return (
    <div>{L}<textarea value={value} onChange={e => onChange(e.target.value)} rows={10} spellCheck={false} style={{ ...I, fontFamily: 'monospace', fontSize: '11px', resize: 'vertical', lineHeight: 1.5 }} /></div>
  )

  return <div>{L}<input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} style={I} onFocus={e => e.target.style.borderColor = '#0F6E56'} onBlur={e => e.target.style.borderColor = '#374151'} /></div>
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function VizuelniEditorPage() {
  const [postavke, setPostavke] = useState<Record<string, string>>({})
  const [pageSekcije, setPageSekcije] = useState<PageSek[]>([
    { id: 'announcement', aktivan: true, instanceId: 'announcement-1' },
    { id: 'hero', aktivan: true, instanceId: 'hero-1' },
    { id: 'akcije', aktivan: true, instanceId: 'akcije-1' },
    { id: 'katalog', aktivan: true, instanceId: 'katalog-1' },
  ])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changed, setChanged] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [aktivnaSekcija, setAktivnaSekcija] = useState<string>('hero')
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [mode, setMode] = useState<'sections' | 'click'>('sections')
  const [clickedElement, setClickedElement] = useState<{ tag: string; text: string; sekcija: string } | null>(null)
  const [iframeKey, setIframeKey] = useState(0)
  const [panelOpen, setPanelOpen] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const allKeys = Object.values(SEKCIJE_DEF).flatMap(s => s.polja.map((p: any) => p.key))

  useEffect(() => {
    supabase.from('postavke').select('kljuc, vrijednost')
      .in('kljuc', [...allKeys, 'page_sekcije'])
      .then(({ data }) => {
        const m: Record<string, string> = {}
        data?.forEach(p => { m[p.kljuc] = p.vrijednost })
        setPostavke(m)
        if (m.page_sekcije) try { setPageSekcije(JSON.parse(m.page_sekcije)) } catch {}
        setLoading(false)
      })
  }, [])

  // Slušaj poruke iz iframe-a (Faza 3 — click to edit)
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'ELEMENT_CLICKED') {
        const { tag, text, elementType } = e.data
        const sekcija = ELEMENT_MAP[elementType] || ELEMENT_MAP[tag] || 'boje'
        setClickedElement({ tag, text, sekcija })
        setAktivnaSekcija(sekcija)
        setMode('click')
        setPanelOpen(true)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Pošalji mode u iframe
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'SET_EDIT_MODE', active: mode === 'click' }, '*')
  }, [mode, iframeKey])

  function snapshot() {
    setHistory(h => [...h.slice(-20), { postavke: { ...postavke }, sekcije: [...pageSekcije] }])
  }

  function update(key: string, value: string) {
    snapshot()
    setPostavke(prev => ({ ...prev, [key]: value }))
    setChanged(true)
    iframeRef.current?.contentWindow?.postMessage({ type: 'THEME_UPDATE', key, value }, '*')
  }

  function undo() {
    if (!history.length) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setPostavke(prev.postavke)
    setPageSekcije(prev.sekcije)
    setChanged(true)
    setIframeKey(k => k + 1)
  }

  function updateSekcije(next: PageSek[]) {
    snapshot()
    setPageSekcije(next)
    setChanged(true)
    const json = JSON.stringify(next)
    setPostavke(prev => ({ ...prev, page_sekcije: json }))
    iframeRef.current?.contentWindow?.postMessage({ type: 'THEME_UPDATE', key: 'page_sekcije', value: json }, '*')
  }

  async function save() {
    setSaving(true)
    await supabase.from('postavke').upsert(
      Object.entries(postavke).map(([kljuc, vrijednost]) => ({ kljuc, vrijednost: vrijednost || '' })),
      { onConflict: 'kljuc' }
    )
    setSaving(false); setSaved(true); setChanged(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const activeDef = SEKCIJE_DEF[aktivnaSekcija]
  const deviceWidth = device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '390px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0B0F19', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px', height: '50px', background: '#161B27', borderBottom: '1px solid #252D3D', flexShrink: 0 }}>
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280', textDecoration: 'none', fontSize: '12px' }}>
          <ChevronLeft size={14} /> Admin
        </Link>
        <div style={{ width: '1px', height: '16px', background: '#252D3D' }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9' }}>🎨 Visual Editor</span>

        {/* Mode switcher */}
        <div style={{ display: 'flex', background: '#252D3D', borderRadius: '7px', padding: '2px', gap: '2px' }}>
          <button onClick={() => { setMode('sections'); setClickedElement(null) }} style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px',
            borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: 'inherit',
            background: mode === 'sections' ? '#0F6E56' : 'transparent',
            color: mode === 'sections' ? 'white' : '#6B7280',
          }}>
            <Settings size={12} /> Sekcije
          </button>
          <button onClick={() => setMode('click')} style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px',
            borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: 'inherit',
            background: mode === 'click' ? '#7C3AED' : 'transparent',
            color: mode === 'click' ? 'white' : '#6B7280',
          }}>
            <MousePointer size={12} /> Klikni element
          </button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', background: '#252D3D', borderRadius: '6px', padding: '2px', gap: '1px' }}>
            {(['desktop', 'tablet', 'mobile'] as const).map((d, i) => (
              <button key={d} onClick={() => setDevice(d)} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px', background: device === d ? '#0F6E56' : 'transparent' }}>
                {['🖥️', '📱', '📲'][i]}
              </button>
            ))}
          </div>
          <button onClick={undo} disabled={!history.length} style={{ padding: '5px', border: '1px solid #252D3D', borderRadius: '6px', background: 'transparent', cursor: history.length ? 'pointer' : 'not-allowed', opacity: history.length ? 1 : 0.4, color: '#9CA3AF', display: 'flex' }}>
            <Undo2 size={13} />
          </button>
          <button onClick={() => setIframeKey(k => k + 1)} style={{ padding: '5px', border: '1px solid #252D3D', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
            <RefreshCw size={13} />
          </button>
          <button onClick={() => setPanelOpen(!panelOpen)} style={{ padding: '5px 8px', border: '1px solid #252D3D', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {panelOpen ? <EyeOff size={12} /> : <Eye size={12} />}
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

        {/* Left panel */}
        {panelOpen && (
          <div style={{ width: '280px', background: '#161B27', borderRight: '1px solid #252D3D', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>

            {/* Click mode — prikaz kliknutog elementa */}
            {mode === 'click' && (
              <div style={{ padding: '12px', borderBottom: '1px solid #252D3D', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <MousePointer size={12} style={{ color: '#A78BFA' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#A78BFA' }}>CLICK TO EDIT</span>
                  <button onClick={() => { setMode('sections'); setClickedElement(null) }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex' }}>
                    <X size={13} />
                  </button>
                </div>
                {clickedElement ? (
                  <div style={{ background: '#0B0F19', borderRadius: '6px', padding: '8px' }}>
                    <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '3px' }}>Kliknuti element:</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0' }}>&lt;{clickedElement.tag}&gt;</div>
                    {clickedElement.text && <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{clickedElement.text}"</div>}
                    <div style={{ fontSize: '10px', color: '#34D399', marginTop: '4px' }}>→ Edituj: {SEKCIJE_DEF[clickedElement.sekcija]?.naziv}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#6B7280', padding: '6px 0' }}>
                    Klikni na element na stranici desno da ga editiraš
                  </div>
                )}
              </div>
            )}

            {/* Sections mode — lista sekcija */}
            {mode === 'sections' && (
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #252D3D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sekcije stranice</span>
                <button onClick={() => setShowAdd(!showAdd)} style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 8px', border: '1px solid #0F6E56', borderRadius: '6px', background: 'rgba(15,110,86,0.1)', color: '#34D399', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' }}>
                  <Plus size={11} /> Dodaj
                </button>
              </div>
            )}

            {/* Add panel */}
            {showAdd && mode === 'sections' && (
              <div style={{ background: '#0B0F19', borderBottom: '1px solid #252D3D', padding: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {Object.entries(SEKCIJE_DEF).map(([id, def]) => (
                  <button key={id} onClick={() => {
                    const instanceId = id + '-' + Date.now()
                    updateSekcije([...pageSekcije, { id, aktivan: true, instanceId }])
                    setShowAdd(false)
                    setExpandedId(instanceId)
                  }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px',
                    border: '1px solid #252D3D', borderRadius: '6px', background: '#161B27', cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left', marginBottom: '4px',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#0F6E56'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#252D3D'}
                  >
                    <span style={{ fontSize: '14px' }}>{def.ikona}</span>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#E2E8F0' }}>{def.naziv}</div>
                      <div style={{ fontSize: '10px', color: '#4B5563' }}>{def.opis}</div>
                    </div>
                    <Plus size={11} style={{ marginLeft: 'auto', color: '#0F6E56' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Sekcije lista */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {/* Sekcije navigacija (uvijek vidljiva) */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', padding: '0 4px' }}>Brzi pristup</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {Object.entries(SEKCIJE_DEF).map(([id, def]) => (
                    <button key={id} onClick={() => setAktivnaSekcija(id)} style={{
                      display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 8px',
                      border: `1px solid ${aktivnaSekcija === id ? '#0F6E56' : '#252D3D'}`,
                      borderRadius: '7px', background: aktivnaSekcija === id ? 'rgba(15,110,86,0.15)' : 'transparent',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px',
                      color: aktivnaSekcija === id ? '#34D399' : '#6B7280', fontWeight: aktivnaSekcija === id ? 600 : 400,
                    }}>
                      <span>{def.ikona}</span> {def.naziv.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Polja aktivne sekcije */}
              {activeDef && (
                <div style={{ background: '#0B0F19', border: '1px solid #252D3D', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid #252D3D', background: '#161B27' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#F1F5F9' }}>{activeDef.ikona} {activeDef.naziv}</span>
                  </div>
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {loading ? [1,2,3].map(i => <div key={i} style={{ height: '40px', background: '#252D3D', borderRadius: '5px' }} />) :
                      activeDef.polja.map((f: any) => (
                        <Field key={f.key} field={f} value={postavke[f.key] || ''} onChange={v => update(f.key, v)} />
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Redosljed sekcija */}
              {mode === 'sections' && pageSekcije.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', padding: '0 4px' }}>Redosljed i vidljivost</div>
                  {pageSekcije.map((s, idx) => {
                    const def = SEKCIJE_DEF[s.id]
                    if (!def) return null
                    return (
                      <div key={s.instanceId} style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px',
                        background: '#0B0F19', border: '1px solid #252D3D', borderRadius: '7px', marginBottom: '4px',
                      }}>
                        <GripVertical size={12} style={{ color: '#374151', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px' }}>{def.ikona}</span>
                        <span style={{ flex: 1, fontSize: '11px', color: s.aktivan ? '#E2E8F0' : '#4B5563', fontWeight: 500 }}>{def.naziv}</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <button onClick={() => {
                            if (idx === 0) return
                            const next = [...pageSekcije]
                            ;[next[idx-1], next[idx]] = [next[idx], next[idx-1]]
                            updateSekcije(next)
                          }} disabled={idx === 0} style={{ padding: '2px', border: 'none', background: 'none', cursor: idx > 0 ? 'pointer' : 'not-allowed', opacity: idx > 0 ? 1 : 0.3, color: '#6B7280', display: 'flex' }}>
                            <ChevronUp size={11} />
                          </button>
                          <button onClick={() => {
                            if (idx === pageSekcije.length - 1) return
                            const next = [...pageSekcije]
                            ;[next[idx], next[idx+1]] = [next[idx+1], next[idx]]
                            updateSekcije(next)
                          }} disabled={idx === pageSekcije.length - 1} style={{ padding: '2px', border: 'none', background: 'none', cursor: idx < pageSekcije.length - 1 ? 'pointer' : 'not-allowed', opacity: idx < pageSekcije.length - 1 ? 1 : 0.3, color: '#6B7280', display: 'flex' }}>
                            <ChevronDown size={11} />
                          </button>
                          <button onClick={() => updateSekcije(pageSekcije.map(x => x.instanceId === s.instanceId ? { ...x, aktivan: !x.aktivan } : x))}
                            style={{ padding: '2px 5px', border: `1px solid ${s.aktivan ? '#059669' : '#374151'}`, borderRadius: '4px', background: 'transparent', cursor: 'pointer', fontSize: '9px', fontWeight: 700, color: s.aktivan ? '#34D399' : '#4B5563', fontFamily: 'inherit' }}>
                            {s.aktivan ? 'ON' : 'OFF'}
                          </button>
                          <button onClick={() => updateSekcije(pageSekcije.filter(x => x.instanceId !== s.instanceId))}
                            style={{ padding: '2px', border: 'none', background: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex' }}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {changed && (
              <div style={{ padding: '8px', borderTop: '1px solid #252D3D' }}>
                <button onClick={save} disabled={saving} style={{ width: '100%', padding: '8px', background: '#0F6E56', color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 12px rgba(15,110,86,0.4)' }}>
                  {saving ? 'Čuvam...' : '💾 Sačuvaj promjene'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* iframe */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: device === 'desktop' ? 'stretch' : 'flex-start', background: '#0B0F19', padding: device === 'desktop' ? '0' : '20px', overflow: 'auto', position: 'relative' }}>
          {mode === 'click' && (
            <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(124,58,237,0.9)', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, zIndex: 10, display: 'flex', alignItems: 'center', gap: '5px', backdropFilter: 'blur(8px)' }}>
              <MousePointer size={12} /> Klikni na bilo koji element na stranici
            </div>
          )}
          {device !== 'desktop' && (
            <div style={{ marginBottom: '10px', fontSize: '11px', color: '#4B5563', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: mode === 'click' ? '40px' : '0' }}>
              {device === 'tablet' ? '📱 768px' : '📲 390px'}
            </div>
          )}
          <div style={{
            width: deviceWidth, flex: device === 'desktop' ? 1 : 'none',
            height: device === 'desktop' ? '100%' : '700px',
            border: device !== 'desktop' ? '2px solid #252D3D' : 'none',
            borderRadius: device !== 'desktop' ? '20px' : '0',
            overflow: 'hidden',
            boxShadow: device !== 'desktop' ? '0 24px 60px rgba(0,0,0,0.6)' : 'none',
            outline: mode === 'click' ? '2px solid rgba(124,58,237,0.5)' : 'none',
            transition: 'all 0.3s ease',
          }}>
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src="/editor-preview"
              style={{ width: '100%', height: '100%', border: 'none', background: 'white', cursor: mode === 'click' ? 'crosshair' : 'default' }}
              title="Webshop preview"
              onLoad={() => {
                // Pošalji mode nakon učitavanja
                setTimeout(() => {
                  iframeRef.current?.contentWindow?.postMessage({ type: 'SET_EDIT_MODE', active: mode === 'click' }, '*')
                }, 500)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

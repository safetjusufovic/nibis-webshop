'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Monitor, Smartphone, Tablet, Eye, EyeOff, Undo2, ChevronLeft, RefreshCw, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import Link from 'next/link'

// ─── Definicija sekcija ───────────────────────────────────────────────────────
interface SekcijaDefinicija {
  id: string
  naziv: string
  ikona: string
  opis: string
  polja: PoljeDefinicija[]
}

interface PoljeDefinicija {
  key: string
  label: string
  type: 'text' | 'color' | 'toggle' | 'range' | 'select' | 'textarea' | 'code' | 'items'
  placeholder?: string
  min?: number
  max?: number
  step?: number
  options?: string[]
}

interface PageSekcija {
  id: string
  aktivan: boolean
  instanceId: string
}

const SVE_SEKCIJE: SekcijaDefinicija[] = [
  {
    id: 'hero', naziv: 'Hero Banner', ikona: '🖼️', opis: 'Veliki banner sa slikom i tekstom',
    polja: [
      { key: 'hero_naslov', label: 'Naslov', type: 'text', placeholder: 'Dobrodošli' },
      { key: 'hero_podnaslov', label: 'Podnaslov', type: 'text', placeholder: 'Profesionalna roba...' },
      { key: 'hero_dugme_tekst', label: 'Tekst dugmeta', type: 'text', placeholder: 'Pregledaj katalog' },
      { key: 'hero_slika_url', label: 'URL pozadinske slike', type: 'text', placeholder: 'https://...' },
      { key: 'hero_boja_pozadine', label: 'Boja (bez slike)', type: 'color' },
      { key: 'hero_overlay_opacity', label: 'Overlay', type: 'range', min: 0, max: 1, step: 0.05 },
      { key: 'hero_visina', label: 'Visina (px)', type: 'range', min: 150, max: 600 },
      { key: 'hero_tekst_pozicija', label: 'Pozicija teksta', type: 'select', options: ['left', 'center', 'right'] },
    ]
  },
  {
    id: 'announcement', naziv: 'Announcement Bar', ikona: '📢', opis: 'Traka sa porukom na vrhu',
    polja: [
      { key: 'announcement_bar', label: 'Tekst', type: 'text', placeholder: 'Narudžbe do 14h...' },
      { key: 'baner_boja_pozadine', label: 'Pozadina', type: 'color' },
      { key: 'baner_boja_teksta', label: 'Boja teksta', type: 'color' },
    ]
  },
  {
    id: 'akcije', naziv: 'Akcije Slider', ikona: '🏷️', opis: 'Horizontalni slider artikala na akciji',
    polja: [
      { key: 'akcije_slider_naslov', label: 'Naslov sekcije', type: 'text', placeholder: 'Akcije' },
      { key: 'theme_primary_boja', label: 'Boja pozadine slidera', type: 'color' },
    ]
  },
  {
    id: 'features', naziv: 'Features / Prednosti', ikona: '⭐', opis: '3 istaknute prednosti firme',
    polja: [
      { key: 'sekcija_features_naslov', label: 'Naslov sekcije', type: 'text', placeholder: 'Zašto mi?' },
      { key: 'sekcija_features_items', label: 'Stavke (JSON)', type: 'items' },
    ]
  },
  {
    id: 'banner', naziv: 'Promo Banner', ikona: '📣', opis: 'Promotivni banner sa pozivom na akciju',
    polja: [
      { key: 'sekcija_banner_tekst', label: 'Naslov', type: 'text', placeholder: 'Posebna ponuda' },
      { key: 'sekcija_banner_podnaslov', label: 'Podnaslov', type: 'text', placeholder: 'Kontaktirajte nas...' },
      { key: 'sekcija_banner_dugme', label: 'Tekst dugmeta', type: 'text', placeholder: 'Saznaj više' },
      { key: 'sekcija_banner_boja', label: 'Boja pozadine', type: 'color' },
    ]
  },
  {
    id: 'katalog', naziv: 'Katalog Artikala', ikona: '📦', opis: 'Glavna lista artikala sa filterima',
    polja: [
      { key: 'per_page', label: 'Artikala po stranici', type: 'select', options: ['12','24','36','48','60'] },
      { key: 'default_view', label: 'Default prikaz', type: 'select', options: ['table','grid'] },
      { key: 'default_sort', label: 'Sortiranje', type: 'select', options: ['naziv','naziv_desc','cijena_asc','cijena_desc'] },
    ]
  },
  {
    id: 'newsletter', naziv: 'Newsletter', ikona: '📧', opis: 'Forma za pretplatu na novosti',
    polja: [
      { key: 'sekcija_newsletter_naslov', label: 'Naslov', type: 'text', placeholder: 'Ostanite informisani' },
      { key: 'sekcija_newsletter_podnaslov', label: 'Podnaslov', type: 'text', placeholder: 'Primajte obavijesti...' },
    ]
  },
]

const BOJE_PRESET = ['#0F6E56','#065F46','#059669','#0891B2','#1D4ED8','#7C3AED','#DC2626','#D97706','#374151','#1F2937','#000000','#F8FAFA','#ffffff']

// ─── Color Input ──────────────────────────────────────────────────────────────
function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <button onClick={() => setOpen(!open)} style={{ width: '28px', height: '28px', borderRadius: '5px', background: value || '#ffffff', border: '1px solid #374151', cursor: 'pointer', flexShrink: 0 }} />
        <input type="text" value={value} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
          style={{ flex: 1, padding: '5px 7px', fontSize: '11px', fontFamily: 'monospace', border: '1px solid #374151', borderRadius: '5px', background: '#111827', color: '#E2E8F0', outline: 'none' }} />
        <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
          style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
      </div>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: '34px', left: 0, zIndex: 20, background: '#1F2937', border: '1px solid #374151', borderRadius: '8px', padding: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
            {BOJE_PRESET.map(c => (
              <button key={c} onClick={() => { onChange(c); setOpen(false) }} style={{ width: '20px', height: '20px', borderRadius: '3px', background: c, cursor: 'pointer', border: value === c ? '2px solid #0F6E56' : '1px solid rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Items editor (za features) ───────────────────────────────────────────────
function ItemsEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  let items: { ikona: string; naslov: string; opis: string }[] = []
  try { items = JSON.parse(value) } catch { items = [] }

  function updateItem(i: number, field: string, val: string) {
    const next = [...items]
    next[i] = { ...next[i], [field]: val }
    onChange(JSON.stringify(next))
  }

  function addItem() {
    onChange(JSON.stringify([...items, { ikona: '⭐', naslov: 'Nova stavka', opis: 'Opis stavke' }]))
  }

  function removeItem(i: number) {
    onChange(JSON.stringify(items.filter((_, idx) => idx !== i)))
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #374151', borderRadius: '4px', background: '#111827', color: '#E2E8F0', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: '#0B0F19', border: '1px solid #252D3D', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280' }}>Stavka {i + 1}</span>
            <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '2px' }}><Trash2 size={12} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: '5px' }}>
            <input value={item.ikona} onChange={e => updateItem(i, 'ikona', e.target.value)} style={{ ...inputStyle, textAlign: 'center', fontSize: '16px' }} />
            <input value={item.naslov} onChange={e => updateItem(i, 'naslov', e.target.value)} placeholder="Naslov" style={inputStyle} />
          </div>
          <input value={item.opis} onChange={e => updateItem(i, 'opis', e.target.value)} placeholder="Opis" style={inputStyle} />
        </div>
      ))}
      <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px', border: '1px dashed #374151', borderRadius: '7px', background: 'transparent', color: '#6B7280', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
        <Plus size={13} /> Dodaj stavku
      </button>
    </div>
  )
}

// ─── Field renderer ───────────────────────────────────────────────────────────
function Field({ field, value, onChange }: { field: PoljeDefinicija; value: string; onChange: (v: string) => void }) {
  const L = <label style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{field.label}</label>
  const I: React.CSSProperties = { width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #374151', borderRadius: '6px', background: '#111827', color: '#E2E8F0', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

  if (field.type === 'color') return <div>{L}<ColorInput value={value} onChange={onChange} /></div>

  if (field.type === 'items') return <div>{L}<ItemsEditor value={value} onChange={onChange} /></div>

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
      <input type="range" min={field.min} max={field.max} step={field.step || 1} value={value || field.min}
        onChange={e => onChange(e.target.value)} style={{ width: '100%', accentColor: '#0F6E56' }} />
    </div>
  )

  if (field.type === 'select') return (
    <div>{L}
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...I, cursor: 'pointer' }}>
        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  if (field.type === 'textarea' || field.type === 'code') return (
    <div>{L}
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={field.type === 'code' ? 10 : 3} spellCheck={false}
        style={{ ...I, fontFamily: field.type === 'code' ? 'monospace' : 'inherit', fontSize: field.type === 'code' ? '11px' : '12px', resize: 'vertical', lineHeight: 1.5 }} />
    </div>
  )

  return (
    <div>{L}
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder}
        style={I}
        onFocus={e => e.target.style.borderColor = '#0F6E56'}
        onBlur={e => e.target.style.borderColor = '#374151'} />
    </div>
  )
}

// ─── Section Block u section builder ─────────────────────────────────────────
function SectionBlock({
  sekcija, def, aktivna, expanded, postavke,
  onSelect, onToggle, onExpand, onMoveUp, onMoveDown, onDelete, onUpdate,
  canMoveUp, canMoveDown
}: {
  sekcija: PageSekcija
  def: SekcijaDefinicija
  aktivna: boolean
  expanded: boolean
  postavke: Record<string, string>
  onSelect: () => void
  onToggle: () => void
  onExpand: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onUpdate: (key: string, value: string) => void
  canMoveUp: boolean
  canMoveDown: boolean
}) {
  return (
    <div style={{
      background: aktivna ? '#0B2218' : '#161B27',
      border: `1px solid ${aktivna ? '#0F6E56' : '#252D3D'}`,
      borderRadius: '10px',
      overflow: 'hidden',
      transition: 'all 0.15s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', cursor: 'pointer' }} onClick={onSelect}>
        {/* Drag handle */}
        <GripVertical size={14} style={{ color: '#4B5563', flexShrink: 0, cursor: 'grab' }} />

        {/* Ikona */}
        <span style={{ fontSize: '16px', flexShrink: 0 }}>{def.ikona}</span>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: aktivna ? '#34D399' : '#F1F5F9' }}>{def.naziv}</div>
          <div style={{ fontSize: '10px', color: '#4B5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{def.opis}</div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {/* Toggle vidljivost */}
          <button onClick={e => { e.stopPropagation(); onToggle() }}
            style={{ padding: '3px 7px', border: '1px solid #374151', borderRadius: '5px', background: 'transparent', cursor: 'pointer', fontSize: '10px', fontWeight: 600, color: sekcija.aktivan ? '#34D399' : '#4B5563', fontFamily: 'inherit' }}>
            {sekcija.aktivan ? 'Vidljivo' : 'Skriveno'}
          </button>

          {/* Move */}
          <button onClick={e => { e.stopPropagation(); onMoveUp() }} disabled={!canMoveUp}
            style={{ padding: '3px', border: '1px solid #374151', borderRadius: '4px', background: 'transparent', cursor: canMoveUp ? 'pointer' : 'not-allowed', opacity: canMoveUp ? 1 : 0.3, color: '#9CA3AF', display: 'flex' }}>
            <ChevronUp size={11} />
          </button>
          <button onClick={e => { e.stopPropagation(); onMoveDown() }} disabled={!canMoveDown}
            style={{ padding: '3px', border: '1px solid #374151', borderRadius: '4px', background: 'transparent', cursor: canMoveDown ? 'pointer' : 'not-allowed', opacity: canMoveDown ? 1 : 0.3, color: '#9CA3AF', display: 'flex' }}>
            <ChevronDown size={11} />
          </button>

          {/* Expand settings */}
          <button onClick={e => { e.stopPropagation(); onExpand() }}
            style={{ padding: '3px', border: `1px solid ${expanded ? '#0F6E56' : '#374151'}`, borderRadius: '4px', background: expanded ? 'rgba(15,110,86,0.2)' : 'transparent', cursor: 'pointer', color: expanded ? '#34D399' : '#6B7280', display: 'flex' }}>
            <Settings size={11} />
          </button>
        </div>
      </div>

      {/* Expanded polja */}
      {expanded && def.polja.length > 0 && (
        <div style={{ borderTop: '1px solid #252D3D', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#0B0F19' }}>
          {def.polja.map(f => (
            <Field key={f.key} field={f} value={postavke[f.key] || ''} onChange={v => onUpdate(f.key, v)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function VizuelniEditorPage() {
  const [postavke, setPostavke] = useState<Record<string, string>>({})
  const [pageSekcije, setPageSekcije] = useState<PageSekcija[]>([
    { id: 'announcement', aktivan: true, instanceId: 'announcement-1' },
    { id: 'hero', aktivan: true, instanceId: 'hero-1' },
    { id: 'akcije', aktivan: true, instanceId: 'akcije-1' },
    { id: 'katalog', aktivan: true, instanceId: 'katalog-1' },
  ])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changed, setChanged] = useState(false)
  const [history, setHistory] = useState<{ postavke: Record<string, string>; sekcije: PageSekcija[] }[]>([])
  const [aktivnaSekcija, setAktivnaSekcija] = useState<string | null>(null)
  const [expandedSekcija, setExpandedSekcija] = useState<string | null>(null)
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [panelOpen, setPanelOpen] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const allKeys = SVE_SEKCIJE.flatMap(s => s.polja.map(p => p.key))

  useEffect(() => {
    supabase.from('postavke').select('kljuc, vrijednost')
      .in('kljuc', [...allKeys, 'page_sekcije'])
      .then(({ data }) => {
        const m: Record<string, string> = {}
        data?.forEach(p => { m[p.kljuc] = p.vrijednost })
        setPostavke(m)
        if (m.page_sekcije) {
          try { setPageSekcije(JSON.parse(m.page_sekcije)) } catch {}
        }
        setLoading(false)
      })
  }, [])

  function snapshot() {
    setHistory(h => [...h.slice(-20), { postavke: { ...postavke }, sekcije: [...pageSekcije] }])
  }

  function update(key: string, value: string) {
    snapshot()
    setPostavke(prev => ({ ...prev, [key]: value }))
    setChanged(true)
    iframeRef.current?.contentWindow?.postMessage({ type: 'THEME_UPDATE', key, value }, '*')
  }

  function updateSekcije(next: PageSekcija[]) {
    snapshot()
    setPageSekcije(next)
    setChanged(true)
    const json = JSON.stringify(next)
    setPostavke(prev => ({ ...prev, page_sekcije: json }))
    iframeRef.current?.contentWindow?.postMessage({ type: 'THEME_UPDATE', key: 'page_sekcije', value: json }, '*')
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

  function toggleSekcija(instanceId: string) {
    updateSekcije(pageSekcije.map(s => s.instanceId === instanceId ? { ...s, aktivan: !s.aktivan } : s))
  }

  function moveSekcija(instanceId: string, dir: 'up' | 'down') {
    const idx = pageSekcije.findIndex(s => s.instanceId === instanceId)
    if (idx === -1) return
    const next = [...pageSekcije]
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    updateSekcije(next)
  }

  function deleteSekcija(instanceId: string) {
    updateSekcije(pageSekcije.filter(s => s.instanceId !== instanceId))
  }

  function addSekcija(sekcijaId: string) {
    const instanceId = sekcijaId + '-' + Date.now()
    updateSekcije([...pageSekcije, { id: sekcijaId, aktivan: true, instanceId }])
    setShowAddPanel(false)
    setExpandedSekcija(instanceId)
  }

  async function save() {
    setSaving(true)
    const rows = Object.entries(postavke).map(([kljuc, vrijednost]) => ({ kljuc, vrijednost: vrijednost || '' }))
    await supabase.from('postavke').upsert(rows, { onConflict: 'kljuc' })
    setSaving(false); setSaved(true); setChanged(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const deviceWidth = device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '390px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0B0F19', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', height: '50px', background: '#161B27', borderBottom: '1px solid #252D3D', flexShrink: 0 }}>
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6B7280', textDecoration: 'none', fontSize: '12px' }}>
          <ChevronLeft size={15} /> Admin
        </Link>
        <div style={{ width: '1px', height: '18px', background: '#252D3D' }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9' }}>🎨 Visual Editor <span style={{ fontSize: '10px', fontWeight: 400, color: '#4B5563', marginLeft: '4px' }}>Faza 2 — Section Builder</span></span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', background: '#252D3D', borderRadius: '7px', padding: '2px', gap: '1px' }}>
            {([['desktop', '🖥️'], ['tablet', '📱'], ['mobile', '📲']] as const).map(([d, e]) => (
              <button key={d} onClick={() => setDevice(d)} title={d} style={{ padding: '4px 8px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '13px', background: device === d ? '#0F6E56' : 'transparent' }}>{e}</button>
            ))}
          </div>
          <button onClick={undo} disabled={!history.length} style={{ padding: '5px', border: '1px solid #252D3D', borderRadius: '6px', background: 'transparent', cursor: history.length ? 'pointer' : 'not-allowed', opacity: history.length ? 1 : 0.4, color: '#9CA3AF', display: 'flex' }}>
            <Undo2 size={13} />
          </button>
          <button onClick={() => setIframeKey(k => k + 1)} style={{ padding: '5px', border: '1px solid #252D3D', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
            <RefreshCw size={13} />
          </button>
          <button onClick={() => setPanelOpen(!panelOpen)} style={{ padding: '5px 9px', border: '1px solid #252D3D', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
            <Save size={12} />{saving ? 'Čuvam...' : saved ? '✓ Sačuvano' : 'Sačuvaj'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left Panel — Section Builder */}
        {panelOpen && (
          <div style={{ width: '300px', background: '#161B27', borderRight: '1px solid #252D3D', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>

            {/* Panel header */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #252D3D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9' }}>📐 Sekcije stranice</div>
                <div style={{ fontSize: '10px', color: '#4B5563', marginTop: '2px' }}>Sortiraj, dodaj, sakrij sekcije</div>
              </div>
              <button onClick={() => setShowAddPanel(!showAddPanel)} style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px',
                border: '1px solid #0F6E56', borderRadius: '7px', background: 'rgba(15,110,86,0.15)',
                color: '#34D399', cursor: 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: 'inherit',
              }}>
                <Plus size={12} /> Dodaj
              </button>
            </div>

            {/* Add section panel */}
            {showAddPanel && (
              <div style={{ padding: '10px', borderBottom: '1px solid #252D3D', background: '#0B0F19' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Dostupne sekcije</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {SVE_SEKCIJE.map(def => (
                    <button key={def.id} onClick={() => addSekcija(def.id)} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                      border: '1px solid #252D3D', borderRadius: '7px', background: '#161B27',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.1s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#0F6E56'; (e.currentTarget as HTMLElement).style.background = '#0B2218' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#252D3D'; (e.currentTarget as HTMLElement).style.background = '#161B27' }}
                    >
                      <span style={{ fontSize: '16px' }}>{def.ikona}</span>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#F1F5F9' }}>{def.naziv}</div>
                        <div style={{ fontSize: '10px', color: '#4B5563' }}>{def.opis}</div>
                      </div>
                      <Plus size={12} style={{ marginLeft: 'auto', color: '#0F6E56' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sekcije lista */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {loading ? (
                [1,2,3,4].map(i => <div key={i} style={{ height: '52px', background: '#252D3D', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />)
              ) : pageSekcije.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#4B5563' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                  <div style={{ fontSize: '12px' }}>Nema sekcija. Dodaj neku!</div>
                </div>
              ) : (
                pageSekcije.map((s, idx) => {
                  const def = SVE_SEKCIJE.find(d => d.id === s.id)
                  if (!def) return null
                  return (
                    <SectionBlock
                      key={s.instanceId}
                      sekcija={s}
                      def={def}
                      aktivna={aktivnaSekcija === s.instanceId}
                      expanded={expandedSekcija === s.instanceId}
                      postavke={postavke}
                      onSelect={() => setAktivnaSekcija(s.instanceId)}
                      onToggle={() => toggleSekcija(s.instanceId)}
                      onExpand={() => setExpandedSekcija(expandedSekcija === s.instanceId ? null : s.instanceId)}
                      onMoveUp={() => moveSekcija(s.instanceId, 'up')}
                      onMoveDown={() => moveSekcija(s.instanceId, 'down')}
                      onDelete={() => deleteSekcija(s.instanceId)}
                      onUpdate={update}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < pageSekcije.length - 1}
                    />
                  )
                })
              )}
            </div>

            {/* Save footer */}
            {changed && (
              <div style={{ padding: '10px', borderTop: '1px solid #252D3D' }}>
                <button onClick={save} disabled={saving} style={{ width: '100%', padding: '9px', background: '#0F6E56', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 16px rgba(15,110,86,0.4)' }}>
                  {saving ? 'Čuvam...' : '💾 Sačuvaj promjene'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* iframe preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: device === 'desktop' ? 'stretch' : 'flex-start', background: '#0B0F19', padding: device === 'desktop' ? '0' : '20px', overflow: 'auto' }}>
          {device !== 'desktop' && (
            <div style={{ marginBottom: '10px', fontSize: '11px', color: '#4B5563', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
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

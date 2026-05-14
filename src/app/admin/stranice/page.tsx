'use client'
import { adminFetch, adminApiUrl, getAdminShopId } from '@/lib/adminFetch'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useShopContext } from '@/lib/useShopContext'
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff,
  ExternalLink, Save, ChevronLeft, Upload, Bold, Italic,
  Heading2, Heading3, List, ListOrdered, Quote, Minus,
  Link as LinkIcon, Image as ImageIcon, Table, AlignLeft,
  AlignCenter, AlignRight, Maximize2, Minimize2, MoveUp, MoveDown, X
} from 'lucide-react'

interface Stranica {
  id?: string; slug: string; tip: string; naslov: string; podnaslov?: string
  sadrzaj?: string; slika_url?: string; kategorija?: string; tagovi?: string
  objavljen: boolean; istaknuto?: boolean; autor_naziv?: string
  meta_naslov?: string; meta_opis?: string; redoslijed?: number
}

const EMPTY: Stranica = {
  slug: '', tip: 'stranica', naslov: '', podnaslov: '', sadrzaj: '',
  slika_url: '', kategorija: '', tagovi: '', objavljen: true,
  istaknuto: false, autor_naziv: '', meta_naslov: '', meta_opis: '', redoslijed: 0,
}

// ─── Rich Text Editor ──────────────────────────────────────────────────────────
function RichEditor({ value, onChange, editorId }: {
  value: string
  onChange: (v: string) => void
  editorId: string
}) {
  const [fullscreen, setFullscreen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const lastSelRef = useRef<Range | null>(null)

  // Save selection before toolbar button clicks lose focus
  function saveSelection() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      lastSelRef.current = sel.getRangeAt(0).cloneRange()
    }
  }

  function restoreSelection() {
    const sel = window.getSelection()
    if (lastSelRef.current && sel) {
      sel.removeAllRanges()
      sel.addRange(lastSelRef.current)
    }
  }

  function execCmd(cmd: string, value?: string) {
    restoreSelection()
    document.execCommand(cmd, false, value)
    editorRef.current?.focus()
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  function insertHTML(html: string) {
    restoreSelection()
    document.execCommand('insertHTML', false, html)
    editorRef.current?.focus()
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  async function handleImageUpload(file: File) {
    if (file.size > 8 * 1024 * 1024) { alert('Max 8MB'); return }
    setUploading(true)

    function insertImg(src: string) {
      const img = '<img src="' + src + '" alt="" style="max-width:100%;border-radius:8px;margin:12px 0 12px;display:block"/>'
      // Focus editor first
      editorRef.current?.focus()
      // Try to restore saved selection, otherwise append at end
      const sel = window.getSelection()
      if (lastSelRef.current && sel) {
        try {
          sel.removeAllRanges()
          sel.addRange(lastSelRef.current)
          document.execCommand('insertHTML', false, img)
        } catch {
          // Fallback — append at end
          if (editorRef.current) editorRef.current.innerHTML += img
        }
      } else {
        if (editorRef.current) editorRef.current.innerHTML += img
      }
      if (editorRef.current) onChange(editorRef.current.innerHTML)
    }

    try {
      const { error } = await supabase.storage.from('slike').upload(
        'clanci/' + Date.now() + '.' + (file.name.split('.').pop() || 'jpg'),
        file, { upsert: true }
      )
      if (!error) {
        // Shouldn't happen without bucket, but handle it
        const { data } = supabase.storage.from('slike').getPublicUrl('clanci/' + Date.now())
        insertImg(data.publicUrl)
      } else {
        throw error
      }
    } catch {
      // Base64 fallback — always works
      const reader = new FileReader()
      reader.onload = ev => {
        if (ev.target?.result) insertImg(ev.target.result as string)
      }
      reader.readAsDataURL(file)
    }
    setUploading(false)
  }

  const TB: React.CSSProperties = {
    padding: '5px 9px', border: '1px solid #E5E7EB', borderRadius: '5px',
    background: 'white', cursor: 'pointer', fontSize: '12px',
    fontFamily: 'inherit', color: '#374151', display: 'flex', alignItems: 'center',
    gap: '3px', flexShrink: 0,
  }

  const containerStyle: React.CSSProperties = fullscreen ? {
    position: 'fixed', inset: 0, zIndex: 9999, background: 'white',
    display: 'flex', flexDirection: 'column',
  } : { position: 'relative' }

  // Set initial HTML once — never via dangerouslySetInnerHTML (causes cursor jump)
  const initializedRef = useRef(false)
  useEffect(() => {
    if (!initializedRef.current && editorRef.current) {
      editorRef.current.innerHTML = value || ''
      initializedRef.current = true
    }
  }, [])

  // When editing a different article, reset
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || ''
      initializedRef.current = true
    }
  }, [editorId])

  return (
    <div style={containerStyle}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', padding: '8px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: fullscreen ? '0' : '8px 8px 0 0', position: 'sticky', top: 0, zIndex: 10 }}>
        {/* Text format */}
        <button onMouseDown={e => { e.preventDefault(); saveSelection(); execCmd('bold') }} style={TB} title="Bold"><Bold size={13} /></button>
        <button onMouseDown={e => { e.preventDefault(); saveSelection(); execCmd('italic') }} style={TB} title="Italic"><Italic size={13} /></button>
        <div style={{ width: '1px', background: '#E5E7EB', margin: '0 2px' }} />
        <button onMouseDown={e => { e.preventDefault(); saveSelection(); insertHTML('<h2 style="font-size:22px;font-weight:700;margin:20px 0 10px">Naslov sekcije</h2>') }} style={TB}><Heading2 size={13} /></button>
        <button onMouseDown={e => { e.preventDefault(); saveSelection(); insertHTML('<h3 style="font-size:17px;font-weight:600;margin:16px 0 8px">Podnaslov</h3>') }} style={TB}><Heading3 size={13} /></button>
        <div style={{ width: '1px', background: '#E5E7EB', margin: '0 2px' }} />
        <button onMouseDown={e => { e.preventDefault(); saveSelection(); execCmd('insertUnorderedList') }} style={TB}><List size={13} /></button>
        <button onMouseDown={e => { e.preventDefault(); saveSelection(); execCmd('insertOrderedList') }} style={TB}><ListOrdered size={13} /></button>
        <div style={{ width: '1px', background: '#E5E7EB', margin: '0 2px' }} />
        <button onMouseDown={e => { e.preventDefault(); saveSelection(); insertHTML('<blockquote style="border-left:3px solid var(--brand,#0F6E56);padding:8px 16px;margin:12px 0;color:#6B7280;font-style:italic;background:#F9FAFB;border-radius:0 6px 6px 0">Citat</blockquote>') }} style={TB}><Quote size={13} /></button>
        <button onMouseDown={e => { e.preventDefault(); saveSelection(); insertHTML('<hr style="border:none;border-top:2px solid #E5E7EB;margin:24px 0"/>') }} style={TB}><Minus size={13} /></button>
        <div style={{ width: '1px', background: '#E5E7EB', margin: '0 2px' }} />
        <button onMouseDown={e => {
          e.preventDefault(); saveSelection()
          const url = prompt('URL linka:')
          if (url) execCmd('createLink', url)
        }} style={TB}><LinkIcon size={13} /></button>
        <button onMouseDown={e => {
          e.preventDefault(); saveSelection()
          const url = prompt('URL slike (ili uploadaj ispod):')
          if (url) insertHTML('<img src="' + url + '" alt="" style="max-width:100%;border-radius:8px;margin:12px 0"/>')
        }} style={TB} title="Slika URL"><ImageIcon size={13} /></button>
        <label style={{ ...TB, cursor: uploading ? 'not-allowed' : 'pointer' }} title="Upload sliku s računara">
          <Upload size={13} style={{ opacity: uploading ? 0.5 : 1 }} />
          <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading}
            onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); e.target.value = '' }}
          />
        </label>
        <div style={{ width: '1px', background: '#E5E7EB', margin: '0 2px' }} />
        <button onMouseDown={e => { e.preventDefault(); saveSelection(); insertHTML('<table style="width:100%;border-collapse:collapse;margin:16px 0"><thead><tr><th style="border:1px solid #E5E7EB;padding:10px;background:#F9FAFB;text-align:left">Kolona 1</th><th style="border:1px solid #E5E7EB;padding:10px;background:#F9FAFB;text-align:left">Kolona 2</th></tr></thead><tbody><tr><td style="border:1px solid #E5E7EB;padding:10px">Ćelija</td><td style="border:1px solid #E5E7EB;padding:10px">Ćelija</td></tr></tbody></table>') }} style={TB}><Table size={13} /></button>
        <div style={{ width: '1px', background: '#E5E7EB', margin: '0 2px' }} />
        <button onMouseDown={e => { e.preventDefault(); saveSelection(); execCmd('justifyLeft') }} style={TB}><AlignLeft size={13} /></button>
        <button onMouseDown={e => { e.preventDefault(); saveSelection(); execCmd('justifyCenter') }} style={TB}><AlignCenter size={13} /></button>
        <button onMouseDown={e => { e.preventDefault(); saveSelection(); execCmd('justifyRight') }} style={TB}><AlignRight size={13} /></button>
        <div style={{ width: '1px', background: '#E5E7EB', margin: '0 2px' }} />
        {/* Colour */}
        <select onMouseDown={e => e.stopPropagation()} onChange={e => { saveSelection(); execCmd('foreColor', e.target.value); e.target.value = '' }}
          style={{ ...TB, padding: '4px 6px' }} defaultValue="">
          <option value="" disabled>🎨 Boja</option>
          {['#111827','#DC2626','#2563EB','#059669','#D97706','#7C3AED','#DB2777','#64748B'].map(c => (
            <option key={c} value={c} style={{ background: c, color: 'white' }}>{c}</option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto' }} />
        <button onClick={() => setFullscreen(!fullscreen)} style={{ ...TB, marginLeft: '4px', background: fullscreen ? '#EDE9FE' : 'white', color: fullscreen ? '#7C3AED' : '#374151' }}>
          {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          {fullscreen ? 'Zatvori' : 'Fullscreen'}
        </button>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        dir="ltr"
        lang="hr"
        onInput={e => onChange((e.target as HTMLDivElement).innerHTML)}
        onSelect={saveSelection}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        style={{
          minHeight: fullscreen ? 'calc(100vh - 60px)' : '380px',
          padding: '20px 24px',
          fontSize: '15px',
          border: '1px solid #E5E7EB',
          borderTop: 'none',
          borderRadius: fullscreen ? 0 : '0 0 8px 8px',
          outline: 'none',
          fontFamily: "'Georgia', serif",
          lineHeight: 1.8,
          color: '#111827',
          background: 'white',
          overflowY: 'auto',
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'isolate',
          flex: fullscreen ? 1 : undefined,
        }}
      />
      <style>{`
        [contenteditable] { direction: ltr !important; text-align: left !important; }
        [contenteditable] h1 { font-size: 28px; font-weight: 800; margin: 24px 0 12px; color: #111827; letter-spacing: -0.02em; }
        [contenteditable] h2 { font-size: 22px; font-weight: 700; margin: 20px 0 10px; color: #111827; }
        [contenteditable] h3 { font-size: 17px; font-weight: 600; margin: 16px 0 8px; color: #374151; }
        [contenteditable] p { margin: 0 0 14px; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 24px; margin: 0 0 14px; }
        [contenteditable] li { margin-bottom: 5px; }
        [contenteditable] blockquote { border-left: 3px solid #0F6E56; padding: 8px 16px; margin: 16px 0; color: #6B7280; font-style: italic; background: #F9FAFB; }
        [contenteditable] a { color: var(--brand, #0F6E56); }
        [contenteditable] img { max-width: 100%; border-radius: 8px; margin: 12px 0; }
        [contenteditable] table { width: 100%; border-collapse: collapse; }
        [contenteditable] td, [contenteditable] th { border: 1px solid #E5E7EB; padding: 10px; }
        [contenteditable] th { background: #F9FAFB; font-weight: 600; }
        [contenteditable] hr { border: none; border-top: 2px solid #E5E7EB; margin: 24px 0; }
        [contenteditable]:focus { border-color: var(--brand, #0F6E56) !important; box-shadow: 0 0 0 3px rgba(15,110,86,0.1) !important; }
      `}</style>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminStranicePage() {
  const { shopId, shopSlug } = useShopContext()
  const [items, setItems] = useState<Stranica[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Stranica | null>(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'stranica' | 'clanak'>('stranica')
  const [toast, setToast] = useState('')
  const [uploadingSlika, setUploadingSlika] = useState(false)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function load() {
    setLoading(true)
    let q = supabase.from('stranice').select('*').order('redoslijed').order('created_at', { ascending: false })
    if (shopId) {
      q = q.eq('shop_id', shopId)
    } else {
      q = q.is('shop_id', null)
    }
    const { data } = await q
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [shopId])

  function slugify(s: string) {
    return s.toLowerCase()
      .replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/đ/g, 'd').replace(/ž/g, 'z')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()
  }

  async function save() {
    if (!editing) return
    if (!editing.naslov.trim()) { showToast('Naslov je obavezan!'); return }
    setSaving(true)
    const payload = {
      ...editing,
      slug: editing.slug || slugify(editing.naslov),
      updated_at: new Date().toISOString(),
      ...(shopId ? { shop_id: shopId } : { shop_id: null }),
    }
    if (editing.id) {
      const { error } = await supabase.from('stranice').update(payload).eq('id', editing.id)
      if (error) { showToast('Greška: ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('stranice').insert(payload)
      if (error) { showToast('Greška: ' + error.message); setSaving(false); return }
    }
    setSaving(false); showToast('Sačuvano ✓')
    setEditing(null); load()
  }

  async function toggleField(id: string, field: 'objavljen' | 'istaknuto', current: boolean) {
    await supabase.from('stranice').update({ [field]: !current }).eq('id', id)
    setItems(prev => prev.map(s => s.id === id ? { ...s, [field]: !current } : s))
  }

  async function moveItem(id: string, dir: 'up' | 'down') {
    const list = items.filter(s => s.tip === tab)
    const idx = list.findIndex(s => s.id === id)
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === list.length - 1)) return
    const other = list[dir === 'up' ? idx - 1 : idx + 1]
    const aRed = list[idx].redoslijed ?? idx
    const bRed = other.redoslijed ?? (dir === 'up' ? idx - 1 : idx + 1)
    await supabase.from('stranice').update({ redoslijed: bRed }).eq('id', id)
    await supabase.from('stranice').update({ redoslijed: aRed }).eq('id', other.id!)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Obrisati?')) return
    await supabase.from('stranice').delete().eq('id', id)
    setItems(prev => prev.filter(s => s.id !== id))
    showToast('Obrisano')
  }

  async function uploadSlika(file: File) {
    if (!editing) return
    setUploadingSlika(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = 'stranice/' + Date.now() + '.' + ext
      const { error } = await supabase.storage.from('slike').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('slike').getPublicUrl(path)
        setEditing(prev => prev ? { ...prev, slika_url: data.publicUrl } : null)
      } else {
        const reader = new FileReader()
        reader.onload = ev => setEditing(prev => prev ? { ...prev, slika_url: ev.target?.result as string } : null)
        reader.readAsDataURL(file)
      }
    } catch {}
    setUploadingSlika(false)
  }

  const Inp = ({ label, k, placeholder, type = 'text' }: { label: string; k: keyof Stranica; placeholder?: string; type?: string }) => (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input type={type} value={(editing as any)?.[k] || ''} placeholder={placeholder}
        onChange={e => setEditing(prev => prev ? { ...prev, [k]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value } : null)}
        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
        onFocus={e => e.target.style.borderColor = 'var(--brand)'}
        onBlur={e => e.target.style.borderColor = '#E5E7EB'}
      />
    </div>
  )

  // ── Editor view ──────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        {toast && <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 9000, padding: '10px 18px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#065F46', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>{toast}</div>}

        {/* Top bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50 }}>
          <button onClick={() => setEditing(null)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', color: '#374151' }}>
            <ChevronLeft size={14} /> Nazad
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{editing.id ? 'Uređivanje' : 'Nova'}: {editing.tip === 'clanak' ? '📰 Članak' : '📄 Stranica'}</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>/{editing.tip === 'clanak' ? 'vijesti' : 'stranica'}/{editing.slug || 'slug-se-automatski-generiše'}</div>
          </div>
          <a href={'/' + (editing.tip === 'clanak' ? 'vijesti' : 'stranica') + '/' + (editing.slug || '')} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px', color: '#6B7280', textDecoration: 'none' }}>
            <ExternalLink size={12} /> Preview
          </a>
          <button onClick={save} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 22px', background: saving ? '#9CA3AF' : 'var(--brand)', color: 'white', border: 'none', borderRadius: '9px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit' }}>
            <Save size={14} /> {saving ? 'Čuvam...' : 'Sačuvaj'}
          </button>
        </div>

        {/* Layout */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>

          {/* Left — sadržaj */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Naslov */}
            <input
              value={editing.naslov}
              onChange={e => setEditing(prev => prev ? { ...prev, naslov: e.target.value, ...(!editing.id && { slug: slugify(e.target.value) }) } : null)}
              placeholder="Naslov stranice ili članka..."
              style={{ width: '100%', padding: '14px 16px', fontSize: '26px', fontWeight: 800, border: '1px solid #E5E7EB', borderRadius: '10px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, color: '#111827', letterSpacing: '-0.02em' }}
              onFocus={e => e.target.style.borderColor = 'var(--brand)'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
            <input
              value={editing.podnaslov || ''}
              onChange={e => setEditing(prev => prev ? { ...prev, podnaslov: e.target.value } : null)}
              placeholder="Kratki podnaslov / uvod (prikazuje se u listama i ispod naslova)..."
              style={{ width: '100%', padding: '10px 16px', fontSize: '16px', border: '1px solid #E5E7EB', borderRadius: '10px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, color: '#374151' }}
              onFocus={e => e.target.style.borderColor = 'var(--brand)'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
            {/* Rich editor */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sadržaj</label>
              <RichEditor
                editorId={editing.id || 'new'}
                value={editing.sadrzaj || ''}
                onChange={v => setEditing(prev => prev ? { ...prev, sadrzaj: v } : null)}
              />
            </div>
          </div>

          {/* Right — settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '70px' }}>

            {/* Tip i slug */}
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Postavke</div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tip</label>
                <select value={editing.tip} onChange={e => setEditing(prev => prev ? { ...prev, tip: e.target.value } : null)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', fontFamily: 'inherit', background: 'white', outline: 'none', cursor: 'pointer' }}>
                  <option value="stranica">📄 Stranica</option>
                  <option value="clanak">📰 Članak / Blog</option>
                </select>
              </div>
              <Inp label="URL slug" k="slug" placeholder="o-nama" />
              {editing.tip === 'clanak' && <Inp label="Kategorija" k="kategorija" placeholder="Vijesti, Akcije..." />}
              {editing.tip === 'clanak' && <Inp label="Autor" k="autor_naziv" placeholder="Vaše ime" />}
              {editing.tip === 'clanak' && <Inp label="Tagovi (zarezom)" k="tagovi" placeholder="novost, akcija" />}
              <Inp label="Redoslijed (manji = gore)" k="redoslijed" type="number" placeholder="0" />
              {/* Toggles */}
              {[
                { label: 'Objavljeno', k: 'objavljen' as keyof Stranica },
                { label: 'Istaknuto (featured)', k: 'istaknuto' as keyof Stranica },
              ].map(item => (
                <div key={item.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '13px', color: '#374151' }}>{item.label}</span>
                  <button onClick={() => setEditing(prev => prev ? { ...prev, [item.k]: !(prev as any)[item.k] } : null)}
                    style={{ width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', background: (editing as any)[item.k] ? 'var(--brand)' : '#D1D5DB', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', top: '2px', left: (editing as any)[item.k] ? '20px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
              ))}
            </div>

            {/* Naslovna slika */}
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Naslovna slika</div>
              {editing.slika_url && (
                <div style={{ position: 'relative' }}>
                  <img src={editing.slika_url} alt="" style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '8px' }} />
                  <button onClick={() => setEditing(prev => prev ? { ...prev, slika_url: '' } : null)}
                    style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' }}>✕</button>
                </div>
              )}
              <input type="text" value={editing.slika_url || ''} onChange={e => setEditing(prev => prev ? { ...prev, slika_url: e.target.value } : null)}
                placeholder="https://..." style={{ width: '100%', padding: '8px 10px', fontSize: '12px', border: '1px solid #E5E7EB', borderRadius: '7px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--brand-pale)', color: 'var(--brand)', border: '1px solid var(--brand-pale)', borderRadius: '8px', cursor: uploadingSlika ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, justifyContent: 'center' }}>
                <Upload size={13} /> {uploadingSlika ? 'Upload...' : 'Upload sliku s računara'}
                <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingSlika}
                  onChange={e => { if (e.target.files?.[0]) uploadSlika(e.target.files[0]); e.target.value = '' }} />
              </label>
            </div>

            {/* SEO */}
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SEO</div>
              <Inp label="SEO naslov" k="meta_naslov" placeholder="Ostavi prazno = naslov stranice" />
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SEO opis</label>
                <textarea value={editing.meta_opis || ''} onChange={e => setEditing(prev => prev ? { ...prev, meta_opis: e.target.value } : null)}
                  placeholder="Kratki opis za Google..." rows={3}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '12px', border: '1px solid #E5E7EB', borderRadius: '7px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' as const }} />
              </div>
              <div style={{ padding: '8px 10px', background: '#F9FAFB', borderRadius: '7px', fontSize: '11px', color: '#6B7280', wordBreak: 'break-all' }}>
                URL: <strong>/{editing.tip === 'clanak' ? 'vijesti' : 'stranica'}/{editing.slug || 'auto-slug'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Lista ─────────────────────────────────────────────────────────────────────
  const filtered = items.filter(s => s.tip === tab)

  return (
    <div>
      {toast && <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 1000, padding: '10px 18px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#065F46', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>{toast}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Stranice i članci</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>
            Stranice na <strong>/stranica/slug</strong> · Članci na <strong>/vijesti/slug</strong>
          </p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY, tip: tab })}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit' }}>
          <Plus size={14} /> Dodaj {tab === 'clanak' ? 'članak' : 'stranicu'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: '16px' }}>
        {([['stranica', '📄 Stranice'], ['clanak', '📰 Vijesti / Blog']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab === v ? 700 : 400, color: tab === v ? 'var(--brand)' : '#6B7280', fontFamily: 'inherit', borderBottom: '2px solid ' + (tab === v ? 'var(--brand)' : 'transparent'), marginBottom: '-1px' }}>
            {l} <span style={{ opacity: 0.6, fontSize: '11px' }}>({items.filter(s => s.tip === v).length})</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[1,2,3].map(i => <div key={i} style={{ height: '60px', background: '#F3F4F6', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>{tab === 'clanak' ? '📰' : '📄'}</div>
          <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>Nema {tab === 'clanak' ? 'članaka' : 'stranica'}</div>
          <button onClick={() => setEditing({ ...EMPTY, tip: tab })} style={{ padding: '8px 18px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
            + Dodaj
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {filtered.map((s, idx) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '10px', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
            >
              {s.slika_url
                ? <img src={s.slika_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: '44px', height: '44px', borderRadius: '6px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{s.tip === 'clanak' ? '📰' : '📄'}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.naslov}</span>
                  {s.istaknuto && <span style={{ fontSize: '10px', padding: '2px 7px', background: '#FEF3C7', color: '#92400E', borderRadius: '100px', fontWeight: 600, flexShrink: 0 }}>★ Istaknuto</span>}
                  {!s.objavljen && <span style={{ fontSize: '10px', padding: '2px 7px', background: '#F3F4F6', color: '#6B7280', borderRadius: '100px', fontWeight: 600, flexShrink: 0 }}>Draft</span>}
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                  /{s.tip === 'clanak' ? 'vijesti' : 'stranica'}/{s.slug}
                  {s.kategorija && <span style={{ color: 'var(--brand)', marginLeft: '8px' }}>· {s.kategorija}</span>}
                  <span style={{ marginLeft: '8px', opacity: 0.6 }}>red. {s.redoslijed ?? idx}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                <button onClick={() => moveItem(s.id!, 'up')} disabled={idx === 0} title="Pomjeri gore"
                  style={{ padding: '5px', border: '1px solid #E5E7EB', borderRadius: '6px', background: 'white', cursor: idx === 0 ? 'not-allowed' : 'pointer', display: 'flex', opacity: idx === 0 ? 0.3 : 1 }}>
                  <MoveUp size={12} style={{ color: '#6B7280' }} />
                </button>
                <button onClick={() => moveItem(s.id!, 'down')} disabled={idx === filtered.length - 1} title="Pomjeri dolje"
                  style={{ padding: '5px', border: '1px solid #E5E7EB', borderRadius: '6px', background: 'white', cursor: idx === filtered.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', opacity: idx === filtered.length - 1 ? 0.3 : 1 }}>
                  <MoveDown size={12} style={{ color: '#6B7280' }} />
                </button>
                <a href={'/' + (s.tip === 'clanak' ? 'vijesti' : 'stranica') + '/' + s.slug} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '5px', border: '1px solid #E5E7EB', borderRadius: '6px', background: 'white', display: 'flex', color: '#6B7280' }}>
                  <ExternalLink size={12} />
                </a>
                <button onClick={() => s.id && toggleField(s.id, 'istaknuto', !!s.istaknuto)} title="Istakni"
                  style={{ padding: '5px', border: '1px solid #E5E7EB', borderRadius: '6px', background: s.istaknuto ? '#FEF3C7' : 'white', color: s.istaknuto ? '#D97706' : '#6B7280', cursor: 'pointer', display: 'flex' }}>
                  {s.istaknuto ? <Star size={12} /> : <StarOff size={12} />}
                </button>
                <button onClick={() => s.id && toggleField(s.id, 'objavljen', s.objavljen)} title={s.objavljen ? 'Sakrij' : 'Objavi'}
                  style={{ padding: '5px', border: '1px solid #E5E7EB', borderRadius: '6px', background: s.objavljen ? '#F0FDF4' : 'white', color: s.objavljen ? 'var(--brand)' : '#6B7280', cursor: 'pointer', display: 'flex' }}>
                  {s.objavljen ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button onClick={() => setEditing(s)} title="Uredi"
                  style={{ padding: '5px', border: '1px solid #E5E7EB', borderRadius: '6px', background: 'white', color: '#374151', cursor: 'pointer', display: 'flex' }}>
                  <Edit2 size={12} />
                </button>
                <button onClick={() => s.id && remove(s.id)} title="Obriši"
                  style={{ padding: '5px', border: '1px solid #FECACA', borderRadius: '6px', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', display: 'flex' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

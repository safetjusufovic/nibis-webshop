'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit2, Trash2, Eye, EyeOff, Globe, FileText, Star, StarOff, ExternalLink, X, Save, ChevronLeft } from 'lucide-react'

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

// Jednostavan rich text editor
function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorStyle: React.CSSProperties = {
    width: '100%', minHeight: '400px', padding: '16px', fontSize: '14px',
    border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none',
    fontFamily: 'inherit', lineHeight: 1.7, color: '#111827', background: 'white',
    resize: 'vertical',
  }

  function wrap(tag: string, attrs = '') {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    const selectedText = range.toString()
    if (!selectedText) return
    const el = document.createElement(tag)
    if (attrs) el.setAttribute('style', attrs)
    range.surroundContents(el)
    const div = document.getElementById('rich-editor')
    if (div) onChange(div.innerHTML)
  }

  function insertBlock(html: string) {
    const div = document.getElementById('rich-editor')
    if (!div) return
    const sel = window.getSelection()
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0)
      const fragment = range.createContextualFragment(html)
      range.insertNode(fragment)
    } else {
      div.innerHTML += html
    }
    onChange(div.innerHTML)
  }

  const toolbarBtnStyle: React.CSSProperties = {
    padding: '5px 10px', border: '1px solid #E5E7EB', borderRadius: '6px',
    background: 'white', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
    color: '#374151', display: 'flex', alignItems: 'center', gap: '4px',
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px', padding: '8px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px 8px 0 0' }}>
        {[
          { label: 'B', action: () => wrap('strong') },
          { label: 'I', action: () => wrap('em') },
          { label: 'H2', action: () => insertBlock('<h2>Naslov</h2>') },
          { label: 'H3', action: () => insertBlock('<h3>Podnaslov</h3>') },
          { label: '• Lista', action: () => insertBlock('<ul><li>Stavka</li><li>Stavka</li></ul>') },
          { label: '1. Lista', action: () => insertBlock('<ol><li>Stavka</li><li>Stavka</li></ol>') },
          { label: '"', action: () => insertBlock('<blockquote>Citat ovdje</blockquote>') },
          { label: '―', action: () => insertBlock('<hr>') },
          { label: 'Link', action: () => { const url = prompt('URL:'); if (url) wrap('a', 'color:var(--brand)') } },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} style={{ ...toolbarBtnStyle, fontWeight: btn.label === 'B' ? 700 : 400, fontStyle: btn.label === 'I' ? 'italic' : 'normal' }}>
            {btn.label}
          </button>
        ))}
        <div style={{ width: '1px', background: '#E5E7EB', margin: '0 4px' }} />
        <button onClick={() => { const url = prompt('URL slike:'); if (url) insertBlock('<img src="' + url + '" alt="" style="max-width:100%;border-radius:8px;margin:8px 0">') }} style={toolbarBtnStyle}>
          🖼 Slika
        </button>
        <button onClick={() => insertBlock('<table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb">Kolona 1</th><th style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb">Kolona 2</th></tr></thead><tbody><tr><td style="padding:8px;border:1px solid #e5e7eb">Ćelija</td><td style="padding:8px;border:1px solid #e5e7eb">Ćelija</td></tr></tbody></table>')} style={toolbarBtnStyle}>
          Tabela
        </button>
      </div>
      {/* Editable content */}
      <div
        id="rich-editor"
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={e => onChange((e.target as HTMLDivElement).innerHTML)}
        style={{ ...editorStyle, borderRadius: '0 0 8px 8px', borderTop: 'none' }}
        onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = '0 0 0 2px var(--brand-pale)' }}
        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
      />
      <style>{`
        #rich-editor h1 { font-size: 24px; font-weight: 700; margin: 16px 0 8px; }
        #rich-editor h2 { font-size: 20px; font-weight: 700; margin: 14px 0 6px; }
        #rich-editor h3 { font-size: 16px; font-weight: 600; margin: 12px 0 6px; }
        #rich-editor blockquote { border-left: 3px solid var(--brand); padding-left: 12px; color: #6B7280; font-style: italic; margin: 12px 0; }
        #rich-editor ul, #rich-editor ol { padding-left: 20px; margin: 8px 0; }
        #rich-editor li { margin: 4px 0; }
        #rich-editor hr { border: none; border-top: 1px solid #E5E7EB; margin: 16px 0; }
        #rich-editor a { color: var(--brand); }
        #rich-editor table { border-collapse: collapse; width: 100%; margin: 8px 0; }
        #rich-editor td, #rich-editor th { border: 1px solid #E5E7EB; padding: 8px; }
        #rich-editor th { background: #F9FAFB; font-weight: 600; }
      `}</style>
    </div>
  )
}

export default function AdminStranicePage() {
  const [items, setItems] = useState<Stranica[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Stranica | null>(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'stranica' | 'clanak'>('stranica')
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('stranice').select('*').order('redoslijed').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    if (!editing) return
    setSaving(true)
    if (!editing.slug) {
      editing.slug = editing.naslov.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()
    }
    if (editing.id) {
      const { error } = await supabase.from('stranice').update({ ...editing, updated_at: new Date().toISOString() }).eq('id', editing.id)
      if (error) { showToast('Greška: ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('stranice').insert({ ...editing, updated_at: new Date().toISOString() })
      if (error) { showToast('Greška: ' + error.message); setSaving(false); return }
    }
    setSaving(false)
    showToast('Sačuvano!')
    setEditing(null)
    load()
  }

  async function toggleObjavljen(id: string, current: boolean) {
    await supabase.from('stranice').update({ objavljen: !current }).eq('id', id)
    setItems(prev => prev.map(s => s.id === id ? { ...s, objavljen: !current } : s))
  }

  async function toggleIstaknuto(id: string, current: boolean) {
    await supabase.from('stranice').update({ istaknuto: !current }).eq('id', id)
    setItems(prev => prev.map(s => s.id === id ? { ...s, istaknuto: !current } : s))
  }

  async function remove(id: string) {
    if (!confirm('Obrisati ovu stranicu?')) return
    await supabase.from('stranice').delete().eq('id', id)
    setItems(prev => prev.filter(s => s.id !== id))
    showToast('Obrisano')
  }

  const F = ({ label, k, placeholder, type = 'text' }: { label: string; k: keyof Stranica; placeholder?: string; type?: string }) => (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input type={type} value={(editing as any)?.[k] || ''} placeholder={placeholder}
        onChange={e => setEditing(prev => prev ? { ...prev, [k]: e.target.value } : null)}
        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
        onFocus={e => { e.target.style.borderColor = 'var(--brand)' }}
        onBlur={e => { e.target.style.borderColor = '#E5E7EB' }}
      />
    </div>
  )

  // Editor view
  if (editing) {
    return (
      <div>
        {toast && <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000, padding: '12px 20px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', fontSize: '13px', fontWeight: 500, color: '#065F46', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>{toast}</div>}

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
          <button onClick={() => setEditing(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px', color: '#374151', fontFamily: 'inherit' }}>
            <ChevronLeft size={14} /> Nazad
          </button>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, flex: 1 }}>{editing.id ? 'Uredi' : 'Nova'} {editing.tip === 'clanak' ? 'članak' : 'stranicu'}</h2>
          <a href={'/' + (editing.tip === 'clanak' ? 'vijesti' : 'stranica') + '/' + (editing.slug || '')} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', fontSize: '12px', color: '#6B7280', textDecoration: 'none', fontFamily: 'inherit' }}>
            <ExternalLink size={12} /> Preview
          </a>
          <button onClick={save} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit' }}>
            <Save size={13} /> {saving ? 'Čuvam...' : 'Sačuvaj'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>
          {/* Lijevo — sadržaj */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Naslov</label>
              <input value={editing.naslov} onChange={e => {
                const naslov = e.target.value
                const slug = editing.id ? editing.slug : naslov.toLowerCase().replace(/[^a-z0-9\s-čćšđž]/gi, '').replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/đ/g, 'd').replace(/ž/g, 'z').replace(/\s+/g, '-').trim()
                setEditing(prev => prev ? { ...prev, naslov, ...(!editing.id && { slug }) } : null)
              }}
                placeholder="Naslov stranice ili članka"
                style={{ width: '100%', padding: '12px', fontSize: '20px', fontWeight: 700, border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Podnaslov / Kratki opis</label>
              <input value={editing.podnaslov || ''} onChange={e => setEditing(prev => prev ? { ...prev, podnaslov: e.target.value } : null)}
                placeholder="Kratki opis koji se prikazuje u listama i ispod naslova"
                style={{ width: '100%', padding: '9px 12px', fontSize: '14px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sadržaj</label>
              <RichEditor value={editing.sadrzaj || ''} onChange={v => setEditing(prev => prev ? { ...prev, sadrzaj: v } : null)} />
            </div>
          </div>

          {/* Desno — meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Postavke</h3>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tip</label>
                <select value={editing.tip} onChange={e => setEditing(prev => prev ? { ...prev, tip: e.target.value } : null)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none', fontFamily: 'inherit', background: 'white' }}>
                  <option value="stranica">📄 Stranica</option>
                  <option value="clanak">📰 Članak/Blog</option>
                </select>
              </div>
              <F label="URL (slug)" k="slug" placeholder="o-nama" />
              {editing.tip === 'clanak' && <F label="Kategorija" k="kategorija" placeholder="Vijesti" />}
              {editing.tip === 'clanak' && <F label="Autor" k="autor_naziv" placeholder="Vaše ime" />}
              {editing.tip === 'clanak' && <F label="Tagovi (zarezom)" k="tagovi" placeholder="novost, akcija" />}
              <F label="Redoslijed" k="redoslijed" type="number" placeholder="0" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Objavljen', k: 'objavljen' as keyof Stranica },
                  { label: 'Istaknut (featured)', k: 'istaknuto' as keyof Stranica },
                ].map(item => (
                  <div key={item.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <span style={{ fontSize: '13px', color: '#374151' }}>{item.label}</span>
                    <button onClick={() => setEditing(prev => prev ? { ...prev, [item.k]: !prev[item.k] } : null)}
                      style={{ width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', background: editing[item.k] ? 'var(--brand)' : '#D1D5DB', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <span style={{ position: 'absolute', top: '2px', left: editing[item.k] ? '20px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Slika i SEO</h3>
              <F label="URL naslovne slike" k="slika_url" placeholder="https://..." />
              <F label="SEO naslov" k="meta_naslov" placeholder="Ostavi prazno = naslov stranice" />
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SEO opis</label>
                <textarea value={editing.meta_opis || ''} onChange={e => setEditing(prev => prev ? { ...prev, meta_opis: e.target.value } : null)}
                  placeholder="Kratki opis za Google..." rows={3}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '12px', border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' as const }}
                />
              </div>
              <div style={{ padding: '8px', background: '#F9FAFB', borderRadius: '6px', fontSize: '11px', color: '#6B7280' }}>
                URL: <strong>/stranica/{editing.slug || 'slug'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Lista
  const filtered = items.filter(s => s.tip === tab)

  return (
    <div>
      {toast && <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000, padding: '12px 20px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', fontSize: '13px', fontWeight: 500, color: '#065F46', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>{toast}</div>}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Stranice i članci</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>Upravljaj sadržajem i blog postovima</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY, tip: tab })}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 2px 8px var(--brand-pale)' }}>
          <Plus size={14} /> Dodaj {tab === 'clanak' ? 'članak' : 'stranicu'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #E5E7EB', marginBottom: '20px' }}>
        {([['stranica', '📄 Stranice'], ['clanak', '📰 Članci / Blog']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab === v ? 700 : 400, color: tab === v ? 'var(--brand)' : '#6B7280', fontFamily: 'inherit', borderBottom: tab === v ? '2px solid var(--brand)' : '2px solid transparent', marginBottom: '-1px', transition: 'all 0.15s' }}>
            {l} <span style={{ fontSize: '11px', opacity: 0.7 }}>({items.filter(s => s.tip === v).length})</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3].map(i => <div key={i} style={{ height: '60px', background: '#F3F4F6', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>{tab === 'clanak' ? '📰' : '📄'}</div>
          <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Nema {tab === 'clanak' ? 'članaka' : 'stranica'}</div>
          <button onClick={() => setEditing({ ...EMPTY, tip: tab })} style={{ marginTop: '12px', padding: '8px 18px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>
            + Dodaj prvu
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
            >
              {s.slika_url
                ? <img src={s.slika_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{s.tip === 'clanak' ? '📰' : '📄'}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.naslov}</span>
                  {s.istaknuto && <span style={{ fontSize: '10px', padding: '2px 7px', background: '#FEF3C7', color: '#92400E', borderRadius: '100px', fontWeight: 600, flexShrink: 0 }}>★ Istaknuto</span>}
                  {!s.objavljen && <span style={{ fontSize: '10px', padding: '2px 7px', background: '#F3F4F6', color: '#6B7280', borderRadius: '100px', fontWeight: 600, flexShrink: 0 }}>Draft</span>}
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                  /stranica/{s.slug}
                  {s.kategorija && <span style={{ marginLeft: '8px', color: 'var(--brand)' }}>• {s.kategorija}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <a href={'/' + (s.tip === 'clanak' ? 'vijesti' : 'stranica') + '/' + s.slug} target="_blank" rel="noopener noreferrer" title="Pregledaj"
                  style={{ padding: '6px', border: '1px solid #E5E7EB', borderRadius: '7px', background: 'white', display: 'flex', color: '#6B7280' }}>
                  <ExternalLink size={13} />
                </a>
                <button onClick={() => s.id && toggleIstaknuto(s.id, !!s.istaknuto)} title={s.istaknuto ? 'Ukloni istaknutost' : 'Istakni'}
                  style={{ padding: '6px', border: '1px solid #E5E7EB', borderRadius: '7px', background: s.istaknuto ? '#FEF3C7' : 'white', color: s.istaknuto ? '#D97706' : '#6B7280', cursor: 'pointer', display: 'flex' }}>
                  {s.istaknuto ? <Star size={13} /> : <StarOff size={13} />}
                </button>
                <button onClick={() => s.id && toggleObjavljen(s.id, s.objavljen)} title={s.objavljen ? 'Sakrij' : 'Objavi'}
                  style={{ padding: '6px', border: '1px solid #E5E7EB', borderRadius: '7px', background: s.objavljen ? '#F0FDF4' : 'white', color: s.objavljen ? 'var(--brand)' : '#6B7280', cursor: 'pointer', display: 'flex' }}>
                  {s.objavljen ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button onClick={() => setEditing(s)} title="Uredi"
                  style={{ padding: '6px', border: '1px solid #E5E7EB', borderRadius: '7px', background: 'white', color: '#374151', cursor: 'pointer', display: 'flex' }}>
                  <Edit2 size={13} />
                </button>
                <button onClick={() => s.id && remove(s.id)} title="Obriši"
                  style={{ padding: '6px', border: '1px solid #FECACA', borderRadius: '7px', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', display: 'flex' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  )
}

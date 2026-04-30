'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Save, Palette } from 'lucide-react'

interface Grupa {
  id: number
  sifra: string
  naziv: string
  parent_id: number | null
  boja: string | null
  ikona_url: string | null
}

const PRESET_BOJE = [
  '#0F6E56', '#1D4ED8', '#7C3AED', '#DC2626', '#D97706',
  '#059669', '#0891B2', '#9333EA', '#E11D48', '#CA8A04',
  '#374151', '#6B7280', '#1E40AF', '#065F46', '#92400E',
]

export default function AdminKategorijePage() {
  const [grupe, setGrupe] = useState<Grupa[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved] = useState<number | null>(null)
  const [izmjene, setIzmjene] = useState<Record<number, { boja?: string; ikona_url?: string }>>({})

  useEffect(() => {
    supabase.from('grupe').select('*').order('naziv').then(({ data }) => {
      setGrupe((data ?? []) as Grupa[])
      setLoading(false)
    })
  }, [])

  function update(id: number, field: 'boja' | 'ikona_url', value: string) {
    setIzmjene(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
    setGrupe(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g))
  }

  async function sacuvaj(id: number) {
    const izmjena = izmjene[id]
    if (!izmjena) return
    setSaving(id)
    await supabase.from('grupe').update(izmjena).eq('id', id)
    setSaving(null)
    setSaved(id)
    setTimeout(() => setSaved(null), 2000)
    setIzmjene(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  const filtered = grupe.filter(g =>
    !search || g.naziv.toLowerCase().includes(search.toLowerCase())
  )
  const roots = filtered.filter(g => !g.parent_id)
  const children = (parentId: number) => filtered.filter(g => g.parent_id === parentId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text)' }}>Kategorije</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Postavi boje i ikone za kategorije artikala
        </p>
      </div>

      <div style={{ position: 'relative', maxWidth: '320px' }}>
        <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9CACA6', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Pretraži kategorije..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '34px', paddingRight: '12px', height: '38px', fontSize: '13px', background: 'white', border: '1px solid var(--border)', borderRadius: '9px', outline: 'none', fontFamily: 'inherit', width: '100%' }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: '72px', background: 'white', border: '1px solid var(--border)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {roots.map(root => (
            <div key={root.id}>
              <GrupaRow
                grupa={root}
                onUpdate={update}
                onSave={sacuvaj}
                saving={saving === root.id}
                saved={saved === root.id}
                hasChanges={!!izmjene[root.id]}
                presetBoje={PRESET_BOJE}
              />
              {children(root.id).map(child => (
                <div key={child.id} style={{ marginLeft: '24px', marginTop: '4px' }}>
                  <GrupaRow
                    grupa={child}
                    onUpdate={update}
                    onSave={sacuvaj}
                    saving={saving === child.id}
                    saved={saved === child.id}
                    hasChanges={!!izmjene[child.id]}
                    presetBoje={PRESET_BOJE}
                    isChild
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function GrupaRow({ grupa, onUpdate, onSave, saving, saved, hasChanges, presetBoje, isChild }: {
  grupa: Grupa
  onUpdate: (id: number, field: 'boja' | 'ikona_url', value: string) => void
  onSave: (id: number) => void
  saving: boolean
  saved: boolean
  hasChanges: boolean
  presetBoje: string[]
  isChild?: boolean
}) {
  const [showPicker, setShowPicker] = useState(false)
  const boja = grupa.boja || '#0F6E56'

  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      flexWrap: 'wrap',
    }}>
      {/* Preview */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '9px',
        background: boja,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 2px 8px ${boja}40`,
      }}>
        {grupa.ikona_url ? (
          <img src={grupa.ikona_url} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        ) : (
          <Palette size={14} style={{ color: 'white', opacity: 0.8 }} />
        )}
      </div>

      {/* Naziv */}
      <div style={{ flex: 1, minWidth: '120px' }}>
        <div style={{ fontSize: isChild ? '13px' : '14px', fontWeight: 500, color: 'var(--text)' }}>{grupa.naziv}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{grupa.sifra}</div>
      </div>

      {/* Boja picker */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Boja:</span>
          <button
            onClick={() => setShowPicker(!showPicker)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: boja,
              border: '2px solid white',
              boxShadow: '0 0 0 1px var(--border)',
              cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{boja}</span>
        </div>

        {showPicker && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowPicker(false)} />
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              zIndex: 20,
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              width: '220px',
            }}>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Brzi odabir
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {presetBoje.map(c => (
                    <button
                      key={c}
                      onClick={() => { onUpdate(grupa.id, 'boja', c); setShowPicker(false) }}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: c,
                        border: boja === c ? '2px solid #1a202c' : '2px solid transparent',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Prilagođena boja
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={boja}
                    onChange={e => onUpdate(grupa.id, 'boja', e.target.value)}
                    style={{ width: '36px', height: '32px', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '6px' }}
                  />
                  <input
                    type="text"
                    value={boja}
                    onChange={e => {
                      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                        onUpdate(grupa.id, 'boja', e.target.value)
                      }
                    }}
                    style={{ flex: 1, padding: '6px 8px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Ikona URL */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Ikona URL:</span>
        <input
          type="text"
          value={grupa.ikona_url || ''}
          onChange={e => onUpdate(grupa.id, 'ikona_url', e.target.value)}
          placeholder="https://..."
          style={{
            width: '180px',
            padding: '6px 10px',
            fontSize: '12px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--brand-light)'; e.target.style.boxShadow = '0 0 0 3px rgba(29,158,117,0.1)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {/* Save */}
      {hasChanges && (
        <button
          onClick={() => onSave(grupa.id)}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', fontSize: '12px', fontWeight: 500,
            background: saved ? '#059669' : 'var(--brand)',
            color: 'white', border: 'none', borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            transition: 'background 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          <Save size={12} />
          {saving ? 'Čuvam...' : saved ? 'Sačuvano ✓' : 'Sačuvaj'}
        </button>
      )}
    </div>
  )
}

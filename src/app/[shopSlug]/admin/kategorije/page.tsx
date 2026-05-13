'use client'
// Klijentski shop admin — izolacija po shop_id
import { useAdminShop } from '@/lib/useAdminShop'

import { useEffect, useState } from 'react'
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

  // Sidebar konfiguracija
  const [sirina, setSirina] = useState(240)
  const [visina, setVisina] = useState(52)
  const [bojaPozadine, setBojaPozadine] = useState('#F8FAFA')
  const [configChanged, setConfigChanged] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

  useEffect(() => {
    supabase.from('grupe').select('id, sifra, naziv, parent_id, boja, ikona_url').order('naziv')
      .then(({ data }) => { setGrupe((data ?? []) as Grupa[]); setLoading(false) })

    supabase.from('postavke').select('kljuc, vrijednost')
      .in('kljuc', ['sidebar_sirina', 'sidebar_visina_kategorije', 'sidebar_boja_pozadine'])
      .then(({ data }) => {
        data?.forEach(p => {
          if (p.kljuc === 'sidebar_sirina') setSirina(parseInt(p.vrijednost) || 240)
          if (p.kljuc === 'sidebar_visina_kategorije') setVisina(parseInt(p.vrijednost) || 52)
          if (p.kljuc === 'sidebar_boja_pozadine') setBojaPozadine(p.vrijednost || '#F8FAFA')
        })
      })
  }, [])

  function update(id: number, field: 'boja' | 'ikona_url', value: string) {
    setIzmjene(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
    setGrupe(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g))
  }

  async function sacuvajGrupu(id: number) {
    const izmjena = izmjene[id]
    if (!izmjena) return
    setSaving(id)
    await supabase.from('grupe').update(izmjena).eq('id', id)
    setSaving(null)
    setSaved(id)
    setTimeout(() => setSaved(null), 2000)
    setIzmjene(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  async function sacuvajConfig() {
    await supabase.from('postavke').upsert([
      { kljuc: 'sidebar_sirina', vrijednost: String(sirina) },
      { kljuc: 'sidebar_visina_kategorije', vrijednost: String(visina) },
      { kljuc: 'sidebar_boja_pozadine', vrijednost: bojaPozadine },
    ], { onConflict: 'kljuc' })
    setConfigChanged(false)
    setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 2000)
  }

  const roots = grupe.filter(g => !g.parent_id).filter(g => !search || g.naziv.toLowerCase().includes(search.toLowerCase()))
  const getChildren = (parentId: number) => grupe.filter(g => g.parent_id === parentId)

  // Mora biti identično kao u page.tsx CategorySidebar
  const ikonaSize = Math.round(Math.min(visina * 0.84, sirina * 0.38))
  const ikonaRadius = Math.round(ikonaSize * 0.22)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text)' }}>Kategorije</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Postavi boje, ikone i izgled sidebara
        </p>
      </div>

      {/* ── Sidebar konfiguracija ── */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Izgled sidebara</span>
          {configChanged && (
            <button onClick={sacuvajConfig} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px',
              fontSize: '13px', fontWeight: 500, background: configSaved ? '#059669' : 'var(--brand)',
              color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Save size={13} />{configSaved ? 'Sačuvano ✓' : 'Sačuvaj'}
            </button>
          )}
        </div>

        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Širina */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Širina — {sirina}px
            </label>
            <input type="range" min={180} max={420} step={10} value={sirina}
              onChange={e => { setSirina(parseInt(e.target.value)); setConfigChanged(true) }}
              style={{ width: '100%', accentColor: 'var(--brand)' }} />
          </div>

          {/* Visina reda */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Visina reda — {visina}px
            </label>
            <input type="range" min={36} max={90} step={2} value={visina}
              onChange={e => { setVisina(parseInt(e.target.value)); setConfigChanged(true) }}
              style={{ width: '100%', accentColor: 'var(--brand)' }} />
          </div>

          {/* Boja pozadine */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Boja pozadine sidebara
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="color" value={bojaPozadine}
                onChange={e => { setBojaPozadine(e.target.value); setConfigChanged(true); setSlikaUrl('') }}
                style={{ width: '40px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{bojaPozadine}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>— ili dodaj sliku ispod</span>
            </div>
          </div>


        </div>

        {/* Live preview */}
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Preview
          </div>
          <div style={{
            width: sirina + 'px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: bojaPozadine,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxWidth: '100%',
          }}>
            {/* Header */}
            <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Kategorije</span>
            </div>
            {/* Sample rows */}
            {roots.slice(0, 4).map(root => {
              const boja = root.boja || '#6B7280'
              return (
                <div key={root.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 6px', height: visina + 'px' }}>
                  <div style={{
                    width: ikonaSize + 'px', height: ikonaSize + 'px', borderRadius: ikonaRadius + 'px', flexShrink: 0,
                    background: boja, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 2px 6px ${boja}50`,
                  }}>
                    {root.ikona_url ? (
                      <img src={root.ikona_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: Math.round(ikonaSize * 0.5) + 'px', opacity: 0.7 }}>📁</span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {root.naziv}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Pretraga ── */}
      <div style={{ position: 'relative', maxWidth: '320px' }}>
        <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9CACA6', pointerEvents: 'none' }} />
        <input type="text" placeholder="Pretraži kategorije..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '34px', paddingRight: '12px', height: '38px', fontSize: '13px', background: 'white', border: '1px solid var(--border)', borderRadius: '9px', outline: 'none', fontFamily: 'inherit', width: '100%' }} />
      </div>

      {/* ── Lista kategorija ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: '72px', background: 'white', border: '1px solid var(--border)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {roots.map(root => (
            <div key={root.id}>
              <GrupaRow grupa={root} onUpdate={update} onSave={sacuvajGrupu}
                saving={saving === root.id} saved={saved === root.id} hasChanges={!!izmjene[root.id]} presetBoje={PRESET_BOJE} />
              {getChildren(root.id).map(child => (
                <div key={child.id} style={{ marginLeft: '20px', marginTop: '4px' }}>
                  <GrupaRow grupa={child} onUpdate={update} onSave={sacuvajGrupu}
                    saving={saving === child.id} saved={saved === child.id} hasChanges={!!izmjene[child.id]} presetBoje={PRESET_BOJE} isChild />
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
  saving: boolean; saved: boolean; hasChanges: boolean
  presetBoje: string[]; isChild?: boolean
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const boja = grupa.boja || '#0F6E56'

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Max 2MB za ikonu'); return }
    setUploading(true)
    try {
      const path = 'kategorije/' + grupa.id + '_' + Date.now() + '.' + (file.name.split('.').pop() || 'png')
      const { error } = await supabase.storage.from('slike').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('slike').getPublicUrl(path)
        onUpdate(grupa.id, 'ikona_url', data.publicUrl)
      } else {
        // Fallback base64
        const reader = new FileReader()
        reader.onload = ev => onUpdate(grupa.id, 'ikona_url', ev.target?.result as string)
        reader.readAsDataURL(file)
      }
    } catch {
      const reader = new FileReader()
      reader.onload = ev => onUpdate(grupa.id, 'ikona_url', ev.target?.result as string)
      reader.readAsDataURL(file)
    }
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: '12px',
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
    }}>
      {/* Preview ikone — klikabilna za upload */}
      <label style={{ cursor: 'pointer', flexShrink: 0, position: 'relative' as const }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px', background: boja,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px ' + boja + '60', overflow: 'hidden',
          transition: 'filter 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter = 'brightness(0.85)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = 'none'}
        >
          {uploading ? (
            <span style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
          ) : grupa.ikona_url ? (
            <img src={grupa.ikona_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '18px', opacity: 0.7 }}>📁</span>
          )}
        </div>
        <div style={{ position: 'absolute' as const, bottom: '-3px', right: '-3px', width: '16px', height: '16px', background: 'var(--brand)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', fontSize: '8px', color: 'white', fontWeight: 700 }}>+</div>
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
      </label>

      {/* Naziv */}
      <div style={{ flex: 1, minWidth: '100px' }}>
        <div style={{ fontSize: isChild ? '13px' : '14px', fontWeight: 500, color: 'var(--text)' }}>{grupa.naziv}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{grupa.sifra}</div>
      </div>

      {/* Boja */}
      <div style={{ position: 'relative' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Boja</span>
          <button onClick={() => setShowPicker(!showPicker)} style={{
            width: '26px', height: '26px', borderRadius: '6px', background: boja,
            border: '2px solid white', boxShadow: '0 0 0 1px var(--border)', cursor: 'pointer',
          }} />
        </div>
        {showPicker && (
          <>
            <div style={{ position: 'fixed' as const, inset: 0, zIndex: 10 }} onClick={() => setShowPicker(false)} />
            <div style={{ position: 'absolute' as const, top: 'calc(100% + 8px)', left: 0, zIndex: 20, background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: '200px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '8px' }}>Brzi odabir</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '12px' }}>
                {presetBoje.map(c => (
                  <button key={c} onClick={() => { onUpdate(grupa.id, 'boja', c); setShowPicker(false) }}
                    style={{ width: '24px', height: '24px', borderRadius: '6px', background: c, cursor: 'pointer', border: boja === c ? '2px solid #1a202c' : '2px solid transparent', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" value={boja} onChange={e => onUpdate(grupa.id, 'boja', e.target.value)}
                  style={{ width: '36px', height: '32px', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '6px' }} />
                <input type="text" value={boja}
                  onChange={e => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) onUpdate(grupa.id, 'boja', e.target.value) }}
                  style={{ flex: 1, padding: '6px 8px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Ikona — URL input + upload dugme */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ikona</span>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <input type="text" value={grupa.ikona_url || ''} onChange={e => onUpdate(grupa.id, 'ikona_url', e.target.value)}
            placeholder="URL ili uploadaj sliku →"
            style={{ width: '170px', padding: '5px 9px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '7px', outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = 'var(--brand)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'var(--brand-pale)', color: 'var(--brand)', border: '1px solid var(--brand-pale)', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' as const }}>
            {uploading ? '...' : '📁 Odaberi'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
          </label>
          {grupa.ikona_url && (
            <button onClick={() => onUpdate(grupa.id, 'ikona_url', '')}
              title="Ukloni ikonu"
              style={{ padding: '5px 7px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Sačuvaj */}
      {hasChanges && (
        <button onClick={() => onSave(grupa.id)} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 500, background: saved ? '#059669' : 'var(--brand)', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>
          <Save size={12} />{saving ? 'Čuvam...' : saved ? 'Sačuvano ✓' : 'Sačuvaj'}
        </button>
      )}
    </div>
  )
}

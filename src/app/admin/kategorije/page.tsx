'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Save, Palette, X } from 'lucide-react'

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
  const [slikaUrl, setSlikaUrl] = useState('')
  const [configChanged, setConfigChanged] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

  useEffect(() => {
    supabase.from('grupe').select('id, sifra, naziv, parent_id, boja, ikona_url').order('naziv')
      .then(({ data }) => { setGrupe((data ?? []) as Grupa[]); setLoading(false) })

    supabase.from('postavke').select('kljuc, vrijednost')
      .in('kljuc', ['sidebar_sirina', 'sidebar_visina_kategorije', 'sidebar_boja_pozadine', 'sidebar_slika_url'])
      .then(({ data }) => {
        data?.forEach(p => {
          if (p.kljuc === 'sidebar_sirina') setSirina(parseInt(p.vrijednost) || 240)
          if (p.kljuc === 'sidebar_visina_kategorije') setVisina(parseInt(p.vrijednost) || 52)
          if (p.kljuc === 'sidebar_boja_pozadine') setBojaPozadine(p.vrijednost || '#F8FAFA')
          if (p.kljuc === 'sidebar_slika_url') setSlikaUrl(p.vrijednost || '')
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
      { kljuc: 'sidebar_slika_url', vrijednost: slikaUrl },
    ], { onConflict: 'kljuc' })
    setConfigChanged(false)
    setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 2000)
  }

  const roots = grupe.filter(g => !g.parent_id).filter(g => !search || g.naziv.toLowerCase().includes(search.toLowerCase()))
  const getChildren = (parentId: number) => grupe.filter(g => g.parent_id === parentId)

  // Sidebar preview ikona veličina
  const ikonaSize = Math.round(Math.min(visina * 0.80, sirina * 0.32))

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

          {/* Slika pozadine */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Slika pozadine (URL) — preuzima prioritet
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" value={slikaUrl} placeholder="https://..."
                onChange={e => { setSlikaUrl(e.target.value); setConfigChanged(true) }}
                style={{ flex: 1, padding: '8px 10px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }} />
              {slikaUrl && (
                <button onClick={() => { setSlikaUrl(''); setConfigChanged(true) }}
                  style={{ padding: '8px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center' }}>
                  <X size={14} />
                </button>
              )}
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
            background: slikaUrl ? `url(${slikaUrl}) center/cover` : bojaPozadine,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxWidth: '100%',
          }}>
            {/* Header */}
            <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: slikaUrl ? 'white' : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Kategorije</span>
            </div>
            {/* Sample rows */}
            {roots.slice(0, 4).map(root => {
              const boja = root.boja || '#6B7280'
              return (
                <div key={root.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 6px', height: visina + 'px' }}>
                  <div style={{
                    width: ikonaSize + 'px', height: ikonaSize + 'px', borderRadius: '7px', flexShrink: 0,
                    background: boja, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 2px 6px ${boja}50`,
                  }}>
                    {root.ikona_url ? (
                      <img src={root.ikona_url} alt="" style={{ width: Math.round(ikonaSize * 0.58) + 'px', height: Math.round(ikonaSize * 0.58) + 'px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                    ) : (
                      <div style={{ width: Math.round(ikonaSize * 0.38) + 'px', height: Math.round(ikonaSize * 0.38) + 'px', borderRadius: '3px', background: 'rgba(255,255,255,0.8)' }} />
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: slikaUrl ? 'white' : '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
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
  const boja = grupa.boja || '#0F6E56'

  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: '12px',
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
    }}>
      {/* Preview ikone */}
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px', background: boja, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${boja}40`,
      }}>
        {grupa.ikona_url ? (
          <img src={grupa.ikona_url} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        ) : (
          <Palette size={16} style={{ color: 'white', opacity: 0.8 }} />
        )}
      </div>

      {/* Naziv */}
      <div style={{ flex: 1, minWidth: '100px' }}>
        <div style={{ fontSize: isChild ? '13px' : '14px', fontWeight: 500, color: 'var(--text)' }}>{grupa.naziv}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{grupa.sifra}</div>
      </div>

      {/* Boja */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Boja</span>
          <button onClick={() => setShowPicker(!showPicker)} style={{
            width: '26px', height: '26px', borderRadius: '6px', background: boja,
            border: '2px solid white', boxShadow: '0 0 0 1px var(--border)', cursor: 'pointer',
            transition: 'transform 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
          />
        </div>

        {showPicker && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowPicker(false)} />
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 20,
              background: 'white', border: '1px solid var(--border)', borderRadius: '12px',
              padding: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: '200px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Brzi odabir</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                {presetBoje.map(c => (
                  <button key={c} onClick={() => { onUpdate(grupa.id, 'boja', c); setShowPicker(false) }}
                    style={{
                      width: '24px', height: '24px', borderRadius: '6px', background: c, cursor: 'pointer',
                      border: boja === c ? '2px solid #1a202c' : '2px solid transparent',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'transform 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
                  />
                ))}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Prilagođena</div>
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

      {/* Ikona URL */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Ikona URL</span>
        <input type="text" value={grupa.ikona_url || ''} onChange={e => onUpdate(grupa.id, 'ikona_url', e.target.value)}
          placeholder="https://..."
          style={{ width: '160px', padding: '6px 10px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
          onFocus={e => { e.target.style.borderColor = 'var(--brand-light)'; e.target.style.boxShadow = '0 0 0 3px rgba(29,158,117,0.1)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
        />
        {grupa.ikona_url && (
          <img src={grupa.ikona_url} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border)' }} />
        )}
      </div>

      {/* Sačuvaj */}
      {hasChanges && (
        <button onClick={() => onSave(grupa.id)} disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 500,
            background: saved ? '#059669' : 'var(--brand)', color: 'white', border: 'none', borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}>
          <Save size={12} />{saving ? 'Čuvam...' : saved ? 'Sačuvano ✓' : 'Sačuvaj'}
        </button>
      )}
    </div>
  )
}

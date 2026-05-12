'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Eye, EyeOff, Globe, ShoppingBag, TrendingUp, ExternalLink, RefreshCw } from 'lucide-react'

interface Shop {
  id: string; naziv: string; slug: string; domena?: string
  plan: string; status: string; admin_email: string
  created_at: string; nibis_api_url?: string; nibis_api_key?: string
}

interface NewShop {
  naziv: string; slug: string; domena: string; plan: string
  admin_email: string; nibis_api_url: string; nibis_api_key: string
}

const EMPTY: NewShop = { naziv: '', slug: '', domena: '', plan: 'starter', admin_email: '', nibis_api_url: '', nibis_api_key: '' }
const SECRET = process.env.NEXT_PUBLIC_SUPER_ADMIN_SECRET || 'nibis-super-2025'
const HEADERS = { 'Content-Type': 'application/json', 'x-super-admin-secret': SECRET }

export default function SuperAdminPage() {
  const [shopovi, setShopovi] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newShop, setNewShop] = useState<NewShop>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [editingApi, setEditingApi] = useState<string | null>(null)
  const [editApiData, setEditApiData] = useState({ nibis_api_url: '', nibis_api_key: '' })
  const [syncResults, setSyncResults] = useState<Record<string, string>>({})
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  async function load() {
    setLoading(true)
    const res = await fetch('/api/super-admin', { headers: HEADERS })
    const data = await res.json()
    setShopovi(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function slugify(s: string) {
    return s.toLowerCase()
      .replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/đ/g, 'd').replace(/ž/g, 'z')
      .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  }

  async function createShop() {
    if (!newShop.naziv || !newShop.admin_email) { showToast('Naziv i email su obavezni'); return }
    setSaving(true)
    const res = await fetch('/api/super-admin', {
      method: 'POST', headers: HEADERS,
      body: JSON.stringify({ ...newShop, slug: newShop.slug || slugify(newShop.naziv) })
    })
    const data = await res.json()
    if (data.error) { showToast('Greška: ' + data.error); setSaving(false); return }
    showToast('✓ Shop kreiran: ' + data.naziv)
    setCreating(false); setNewShop(EMPTY); load()
    setSaving(false)
  }

  async function toggleStatus(shop: Shop) {
    const newStatus = shop.status === 'aktivan' ? 'suspendovan' : 'aktivan'
    await fetch('/api/super-admin', { method: 'PATCH', headers: HEADERS, body: JSON.stringify({ id: shop.id, status: newStatus }) })
    setShopovi(prev => prev.map(s => s.id === shop.id ? { ...s, status: newStatus } : s))
    showToast(newStatus === 'aktivan' ? '✓ Shop aktiviran' : '✓ Shop suspendovan')
  }

  async function deleteShop(id: string, naziv: string) {
    if (!confirm('Obrisati "' + naziv + '"? Ovo se ne može poništiti!')) return
    await fetch('/api/super-admin', { method: 'DELETE', headers: HEADERS, body: JSON.stringify({ id }) })
    setShopovi(prev => prev.filter(s => s.id !== id))
    showToast('Obrisano')
  }

  async function testAPI(shop: Shop) {
    if (!shop.nibis_api_url) { showToast('Nema API URL'); return }
    setSyncing('test_' + shop.id)
    const res = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shop_id: shop.id }) })
    const data = await res.json()
    setSyncResults(prev => ({ ...prev, [shop.id]: data.ok ? '✓ API radi' : '✗ ' + (data.error || 'Greška') }))
    setSyncing(null)
  }

  async function syncShop(shop: Shop) {
    if (!shop.nibis_api_url) { showToast('Postavi NIBIS API URL i Key prvo'); return }
    setSyncing('sync_' + shop.id)
    setSyncResults(prev => ({ ...prev, [shop.id]: '⏳ Syncanje u toku...' }))
    // Sync se autorizuje kroz super-admin API rutu (service role)
    const res = await fetch('/api/super-admin/sync?shop_id=' + shop.id, { headers: HEADERS })
    const data = await res.json()
    setSyncResults(prev => ({
      ...prev,
      [shop.id]: data.ok
        ? `✓ ${data.artikliCount} artikala · ${data.stanjeCount} stanja · ${(data.durationMs/1000).toFixed(1)}s`
        : '✗ ' + (data.error || 'Sync greška')
    }))
    setSyncing(null)
    if (data.ok) showToast('✓ Sync završen za ' + shop.naziv)
  }

  async function saveApiConfig(shopId: string) {
    await fetch('/api/super-admin', {
      method: 'PATCH', headers: HEADERS,
      body: JSON.stringify({ id: shopId, nibis_api_url: editApiData.nibis_api_url, nibis_api_key: editApiData.nibis_api_key })
    })
    setShopovi(prev => prev.map(s => s.id === shopId ? { ...s, nibis_api_url: editApiData.nibis_api_url, nibis_api_key: editApiData.nibis_api_key } : s))
    setEditingApi(null)
    showToast('✓ API konfiguracija sačuvana')
  }

  const aktivnih = shopovi.filter(s => s.status === 'aktivan').length
  const prihod = shopovi.filter(s => s.status === 'aktivan').reduce((sum, s) =>
    sum + (s.plan === 'enterprise' ? 199 : s.plan === 'pro' ? 99 : 49), 0)
  const planBoja = (p: string) => p === 'enterprise' ? '#8b5cf6' : p === 'pro' ? '#3b82f6' : '#64748b'

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', fontFamily: "'Inter', system-ui, sans-serif", color: '#e2e8f0' }}>
      {toast && <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9000, padding: '12px 20px', background: toast.startsWith('✓') ? '#F0FDF4' : '#FEF2F2', border: '1px solid ' + (toast.startsWith('✓') ? '#BBF7D0' : '#FECACA'), borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: toast.startsWith('✓') ? '#065F46' : '#991B1B', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>{toast}</div>}

      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>⚡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>NIBIS SaaS Platform</div>
          <div style={{ fontSize: '11px', color: '#475569' }}>Super Admin · {shopovi.length} shopova</div>
        </div>
        <a href="/" style={{ padding: '7px 14px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', textDecoration: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ExternalLink size={12} /> Glavni shop
        </a>
        <button onClick={load} style={{ padding: '7px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
          <RefreshCw size={14} />
        </button>
        <button onClick={() => setCreating(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit' }}>
          <Plus size={14} /> Novi shop
        </button>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px' }}>
          {[
            { label: 'Ukupno shopova', value: shopovi.length, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
            { label: 'Aktivnih shopova', value: aktivnih, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            { label: 'Prihod procjena', value: prihod + ' KM/mj', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: '1px solid ' + s.color + '30', borderRadius: '14px', padding: '20px 24px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* New shop form */}
        {creating && (
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '18px' }}>⚡ Novi shop</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'Naziv firme *', key: 'naziv', ph: 'Firma d.o.o.' },
                { label: 'Slug (subdomain)', key: 'slug', ph: 'firma-doo (auto)' },
                { label: 'Email admina *', key: 'admin_email', ph: 'admin@firma.ba' },
                { label: 'Vlastita domena', key: 'domena', ph: 'shop.firma.ba' },
                { label: 'NIBIS API URL', key: 'nibis_api_url', ph: 'https://erp.firma.ba/api/integration/...' },
                { label: 'NIBIS API Key', key: 'nibis_api_key', ph: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                  <input
                    value={(newShop as any)[f.key]}
                    onChange={e => {
                      const v = e.target.value
                      setNewShop(prev => {
                        const u: any = { ...prev, [f.key]: v }
                        if (f.key === 'naziv' && !prev.slug) u.slug = slugify(v)
                        return u
                      })
                    }}
                    placeholder={f.ph}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              ))}
            </div>
            {/* Plan */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[['starter','49 KM/mj','Do 1000 artikala'],['pro','99 KM/mj','Neograničeno'],['enterprise','199 KM/mj','Prioritetna podrška']].map(([v,c,d]) => (
                  <button key={v} onClick={() => setNewShop(p => ({ ...p, plan: v }))}
                    style={{ flex: 1, padding: '10px 12px', border: '1.5px solid ' + (newShop.plan === v ? '#6366f1' : 'rgba(255,255,255,0.1)'), borderRadius: '10px', background: newShop.plan === v ? 'rgba(99,102,241,0.15)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'capitalize' }}>{v}</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>{c}</div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{d}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setCreating(false); setNewShop(EMPTY) }} style={{ padding: '9px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8', fontFamily: 'inherit', fontSize: '13px' }}>Odustani</button>
              <button onClick={createShop} disabled={saving} style={{ flex: 1, padding: '9px', background: saving ? '#475569' : '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: 'inherit' }}>
                {saving ? '⏳ Kreiram...' : '⚡ Kreiraj shop'}
              </button>
            </div>
          </div>
        )}

        {/* Shops list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array(3).fill(0).map((_,i) => <div key={i} style={{ height: '90px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : shopovi.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', color: '#475569' }}>
            <ShoppingBag size={44} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
            <p style={{ margin: 0 }}>Nema shopova. Kreiraj prvi!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {shopovi.map(s => (
              <div key={s.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.25)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.status === 'aktivan' ? '#10b981' : '#ef4444', flexShrink: 0, marginTop: '5px', boxShadow: s.status === 'aktivan' ? '0 0 6px #10b981' : 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>{s.naziv}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '100px', background: planBoja(s.plan) + '25', color: planBoja(s.plan) }}>{s.plan} · {s.plan === 'enterprise' ? '199 KM' : s.plan === 'pro' ? '99 KM' : '49 KM'}/mj</span>
                    {s.status === 'suspendovan' && <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '100px' }}>Suspendovan</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span>🌐 {s.slug}.nibisshop.ba</span>
                    {s.domena && <span>↪ {s.domena}</span>}
                    <span>✉ {s.admin_email}</span>
                    <span>📅 {new Date(s.created_at).toLocaleDateString('bs-BA')}</span>
                  </div>
                  {!s.nibis_api_url && (
                  <div style={{ marginTop: '6px' }}>
                    {editingApi === s.id ? (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input value={editApiData.nibis_api_url} onChange={e => setEditApiData(p => ({ ...p, nibis_api_url: e.target.value }))}
                          placeholder="NIBIS API URL" style={{ padding: '5px 9px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontFamily: 'inherit', width: '280px', outline: 'none' }} />
                        <input value={editApiData.nibis_api_key} onChange={e => setEditApiData(p => ({ ...p, nibis_api_key: e.target.value }))}
                          placeholder="API Key" style={{ padding: '5px 9px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontFamily: 'inherit', width: '200px', outline: 'none' }} />
                        <button onClick={() => saveApiConfig(s.id)} style={{ padding: '5px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: 600 }}>Sačuvaj</button>
                        <button onClick={() => setEditingApi(null)} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#94a3b8', fontFamily: 'inherit' }}>✕</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingApi(s.id); setEditApiData({ nibis_api_url: s.nibis_api_url || '', nibis_api_key: s.nibis_api_key || '' }) }}
                        style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        ⚠ Postavi NIBIS API →
                      </button>
                    )}
                  </div>
                )}
                  {syncResults[s.id] && (
                    <div style={{ fontSize: '12px', marginTop: '6px', padding: '5px 10px', background: syncResults[s.id].startsWith('✓') ? 'rgba(16,185,129,0.1)' : syncResults[s.id].startsWith('⏳') ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '6px', color: syncResults[s.id].startsWith('✓') ? '#10b981' : syncResults[s.id].startsWith('⏳') ? '#f59e0b' : '#ef4444', fontFamily: 'monospace' }}>
                      {syncResults[s.id]}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '5px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <a href={'/?shop=' + s.slug} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', color: '#94a3b8', textDecoration: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Globe size={12} /> Shop
                  </a>
                  <button onClick={() => testAPI(s)} disabled={!s.nibis_api_url || !!syncing}
                    style={{ padding: '6px 10px', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '7px', background: 'transparent', cursor: s.nibis_api_url ? 'pointer' : 'not-allowed', color: '#818cf8', fontFamily: 'inherit', fontSize: '12px', opacity: s.nibis_api_url ? 1 : 0.4 }}>
                    {syncing === 'test_' + s.id ? '...' : '🔌 Test'}
                  </button>
                  <button onClick={() => syncShop(s)} disabled={!s.nibis_api_url || !!syncing}
                    style={{ padding: '6px 10px', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '7px', background: 'transparent', cursor: s.nibis_api_url ? 'pointer' : 'not-allowed', color: '#10b981', fontFamily: 'inherit', fontSize: '12px', opacity: s.nibis_api_url ? 1 : 0.4 }}>
                    {syncing === 'sync_' + s.id ? '⏳' : '🔄 Sync'}
                  </button>
                  <button onClick={() => toggleStatus(s)}
                    style={{ padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', background: 'transparent', cursor: 'pointer', color: s.status === 'aktivan' ? '#f59e0b' : '#10b981', fontFamily: 'inherit', fontSize: '12px' }}>
                    {s.status === 'aktivan' ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                  <button onClick={() => deleteShop(s.id, s.naziv)}
                    style={{ padding: '6px 8px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '7px', background: 'transparent', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

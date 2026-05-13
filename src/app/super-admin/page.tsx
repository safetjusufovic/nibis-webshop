'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Eye, EyeOff, Globe, ExternalLink, RefreshCw, Settings, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Shop {
  id: string
  naziv: string
  slug: string
  domena?: string
  status: string
  admin_email: string
  created_at: string
  nibis_api_url?: string
  nibis_api_key?: string
}

interface NewShop {
  naziv: string
  slug: string
  domena: string
  admin_email: string
  nibis_api_url: string
  nibis_api_key: string
}

const EMPTY: NewShop = { naziv: '', slug: '', domena: '', admin_email: '', nibis_api_url: '', nibis_api_key: '' }
const SECRET = 'nibis-super-2025'
const H = { 'Content-Type': 'application/json', 'x-super-admin-secret': SECRET }

export default function SuperAdminPage() {
  const [shopovi, setShopovi] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<NewShop>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncResults, setSyncResults] = useState<Record<string, { ok: boolean; msg: string }>>({})
  const [editApiId, setEditApiId] = useState<string | null>(null)
  const [editApiData, setEditApiData] = useState({ nibis_api_url: '', nibis_api_key: '', domena: '' })
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function load() {
    setLoading(true)
    const res = await fetch('/api/super-admin', { headers: H })
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
    if (!form.naziv || !form.admin_email) { showToast('Naziv i email su obavezni', false); return }
    setSaving(true)
    const res = await fetch('/api/super-admin', {
      method: 'POST', headers: H,
      body: JSON.stringify({ ...form, slug: form.slug || slugify(form.naziv) })
    })
    const data = await res.json()
    if (data.error) { showToast(data.error, false); setSaving(false); return }
    showToast('Shop kreiran: ' + data.naziv)
    setCreating(false); setForm(EMPTY); load()
    setSaving(false)
  }

  async function toggleStatus(shop: Shop) {
    const newStatus = shop.status === 'aktivan' ? 'suspendovan' : 'aktivan'
    await fetch('/api/super-admin', { method: 'PATCH', headers: H, body: JSON.stringify({ id: shop.id, status: newStatus }) })
    setShopovi(prev => prev.map(s => s.id === shop.id ? { ...s, status: newStatus } : s))
    showToast(newStatus === 'aktivan' ? 'Shop aktiviran' : 'Shop suspendovan')
  }

  async function saveApiConfig(id: string) {
    await fetch('/api/super-admin', {
      method: 'PATCH', headers: H,
      body: JSON.stringify({ id, ...editApiData })
    })
    setShopovi(prev => prev.map(s => s.id === id ? { ...s, ...editApiData } : s))
    setEditApiId(null)
    showToast('Sačuvano')
  }

  async function deleteShop(shop: Shop) {
    if (!confirm(`Obrisati "${shop.naziv}"? Svi podaci ovog shopa će biti trajno obrisani.`)) return
    await fetch('/api/super-admin', { method: 'DELETE', headers: H, body: JSON.stringify({ id: shop.id }) })
    setShopovi(prev => prev.filter(s => s.id !== shop.id))
    showToast('Shop obrisan')
  }

  async function testApi(shop: Shop) {
    setSyncing('test_' + shop.id)
    const res = await fetch('/api/sync', { method: 'POST', headers: H, body: JSON.stringify({ shop_id: shop.id }) })
    const data = await res.json()
    setSyncResults(prev => ({ ...prev, [shop.id]: { ok: data.ok, msg: data.ok ? 'Konekcija uspješna' : (data.error || 'Greška') } }))
    setSyncing(null)
  }

  async function syncShop(shop: Shop) {
    if (!shop.nibis_api_url) { showToast('Postavi NIBIS API konfiguraciju prvo', false); return }
    setSyncing('sync_' + shop.id)
    setSyncResults(prev => ({ ...prev, [shop.id]: { ok: true, msg: 'Sinhronizacija u toku...' } }))
    const res = await fetch('/api/super-admin/sync?shop_id=' + shop.id, { headers: H })
    const data = await res.json()
    setSyncResults(prev => ({
      ...prev,
      [shop.id]: {
        ok: data.ok,
        msg: data.ok
          ? `Synced: ${data.artikliCount ?? 0} artikala · ${data.stanjeCount ?? 0} stanja · ${((data.durationMs ?? 0) / 1000).toFixed(1)}s`
          : (data.error || 'Greška pri sinhronizaciji')
      }
    }))
    if (data.ok) showToast('Sinhronizacija završena za ' + shop.naziv)
    setSyncing(null)
  }

  const inp = (label: string, key: keyof NewShop, ph: string, type = 'text') => (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</label>
      <input type={type} value={form[key]} placeholder={ph}
        onChange={e => {
          const v = e.target.value
          setForm(prev => {
            const u: any = { ...prev, [key]: v }
            if (key === 'naziv' && !prev.slug) u.slug = slugify(v)
            return u
          })
        }}
        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: 'white', color: '#111827' }}
        onFocus={e => e.target.style.borderColor = '#6366f1'}
        onBlur={e => e.target.style.borderColor = '#E5E7EB'}
      />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, padding: '12px 18px', background: toast.ok ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${toast.ok ? '#BBF7D0' : '#FECACA'}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: toast.ok ? '#065F46' : '#991B1B', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {toast.ok ? <CheckCircle size={15} /> : <XCircle size={15} />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '0 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: '#6366f1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>⚡</div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>NIBIS SaaS</div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>Super Admin</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{shopovi.length} {shopovi.length === 1 ? 'shop' : 'shopova'}</span>
            <button onClick={load} style={{ padding: '7px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: 'pointer', display: 'flex', color: '#6B7280' }}>
              <RefreshCw size={14} />
            </button>
            <a href="/" target="_blank" style={{ padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#6B7280', textDecoration: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ExternalLink size={12} /> Glavni shop
            </a>
            <button onClick={() => setCreating(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>
              <Plus size={14} /> Novi shop
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 32px' }}>

        {/* Forma za novi shop */}
        {creating && (
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} style={{ color: '#6366f1' }} /> Novi shop
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              {inp('Naziv firme *', 'naziv', 'Firma d.o.o.')}
              {inp('URL slug *', 'slug', 'firma-doo')}
              {inp('Email admina *', 'admin_email', 'admin@firma.ba', 'email')}
              {inp('Custom domena (opcionalno)', 'domena', 'shop.firma.ba')}
              {inp('NIBIS API URL', 'nibis_api_url', 'https://erp.firma.ba/integration/robno-materijalno')}
              {inp('NIBIS API Key', 'nibis_api_key', 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setCreating(false); setForm(EMPTY) }} style={{ padding: '9px 18px', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#6B7280', background: 'white', fontFamily: 'inherit' }}>
                Odustani
              </button>
              <button onClick={createShop} disabled={saving} style={{ padding: '9px 22px', background: saving ? '#9CA3AF' : '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>
                {saving ? 'Kreiram...' : 'Kreiraj shop'}
              </button>
            </div>
          </div>
        )}

        {/* Lista shopova */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: '80px', background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : shopovi.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '60px', textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏪</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Nema kreiranh shopova</div>
            <div style={{ fontSize: '13px', marginBottom: '20px' }}>Kreiraj prvi klijentski shop</div>
            <button onClick={() => setCreating(true)} style={{ padding: '9px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600 }}>
              + Novi shop
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {shopovi.map(s => (
              <div key={s.id} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>

                {/* Glavni red */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>

                  {/* Status indikator */}
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.status === 'aktivan' ? '#10b981' : '#EF4444', flexShrink: 0, boxShadow: s.status === 'aktivan' ? '0 0 0 3px rgba(16,185,129,0.15)' : 'none' }} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{s.naziv}</span>
                      {s.status === 'suspendovan' && (
                        <span style={{ fontSize: '11px', padding: '2px 8px', background: '#FEF2F2', color: '#DC2626', borderRadius: '100px', fontWeight: 600 }}>Suspendovan</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      <span>✉ {s.admin_email}</span>
                      {s.domena
                        ? <span>🌐 {s.domena}</span>
                        : <span style={{ color: '#D97706' }}>🌐 ?shop={s.slug} (nema domene)</span>
                      }
                      <span>📅 {new Date(s.created_at).toLocaleDateString('bs-BA')}</span>
                      {s.nibis_api_url
                        ? <span style={{ color: '#10b981' }}>✓ NIBIS API konfigurisan</span>
                        : <span style={{ color: '#EF4444' }}>✗ NIBIS API nije konfigurisan</span>
                      }
                    </div>
                  </div>

                  {/* Akcije */}
                  <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                    <a href={'/?shop=' + s.slug} target="_blank" rel="noopener noreferrer"
                      style={{ padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: '7px', color: '#6B7280', textDecoration: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Globe size={12} /> Otvori
                    </a>
                    <button onClick={() => { setEditApiId(editApiId === s.id ? null : s.id); setEditApiData({ nibis_api_url: s.nibis_api_url || '', nibis_api_key: s.nibis_api_key || '', domena: s.domena || '' }) }}
                      style={{ padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: '7px', background: editApiId === s.id ? '#EEF2FF' : 'white', cursor: 'pointer', color: editApiId === s.id ? '#6366f1' : '#6B7280', fontFamily: 'inherit', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Settings size={12} /> Postavke
                    </button>
                    {s.nibis_api_url && (
                      <>
                        <button onClick={() => testApi(s)} disabled={!!syncing}
                          style={{ padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#6B7280', fontFamily: 'inherit', fontSize: '12px' }}>
                          {syncing === 'test_' + s.id ? '...' : 'Test API'}
                        </button>
                        <button onClick={() => syncShop(s)} disabled={!!syncing}
                          style={{ padding: '6px 10px', border: '1px solid #D1FAE5', borderRadius: '7px', background: '#F0FDF4', cursor: syncing ? 'not-allowed' : 'pointer', color: '#059669', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600 }}>
                          {syncing === 'sync_' + s.id ? '⏳ Sync...' : '↺ Sync'}
                        </button>
                      </>
                    )}
                    <button onClick={() => toggleStatus(s)}
                      style={{ padding: '6px 8px', border: '1px solid #E5E7EB', borderRadius: '7px', background: 'white', cursor: 'pointer', color: s.status === 'aktivan' ? '#D97706' : '#10b981', display: 'flex' }}>
                      {s.status === 'aktivan' ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button onClick={() => deleteShop(s)}
                      style={{ padding: '6px 8px', border: '1px solid #FECACA', borderRadius: '7px', background: '#FEF2F2', cursor: 'pointer', color: '#EF4444', display: 'flex' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Sync rezultat */}
                {syncResults[s.id] && (
                  <div style={{ padding: '8px 20px 10px', borderTop: '1px solid #F3F4F6', background: '#F9FAFB', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: syncResults[s.id].ok ? '#059669' : '#DC2626' }}>
                    {syncResults[s.id].ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
                    {syncResults[s.id].msg}
                  </div>
                )}

                {/* Edit API panel */}
                {editApiId === s.id && (
                  <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>NIBIS API URL</label>
                        <input value={editApiData.nibis_api_url} onChange={e => setEditApiData(p => ({ ...p, nibis_api_url: e.target.value }))}
                          placeholder="https://erp.firma.ba/integration/robno-materijalno"
                          style={{ width: '100%', padding: '8px 10px', fontSize: '12px', border: '1px solid #E5E7EB', borderRadius: '7px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: 'white' }}
                          onFocus={e => e.target.style.borderColor = '#6366f1'}
                          onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>NIBIS API Key</label>
                        <input value={editApiData.nibis_api_key} onChange={e => setEditApiData(p => ({ ...p, nibis_api_key: e.target.value }))}
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          style={{ width: '100%', padding: '8px 10px', fontSize: '12px', border: '1px solid #E5E7EB', borderRadius: '7px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: 'white' }}
                          onFocus={e => e.target.style.borderColor = '#6366f1'}
                          onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Custom domena</label>
                        <input value={editApiData.domena} onChange={e => setEditApiData(p => ({ ...p, domena: e.target.value }))}
                          placeholder="shop.firma.ba"
                          style={{ width: '100%', padding: '8px 10px', fontSize: '12px', border: '1px solid #E5E7EB', borderRadius: '7px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: 'white' }}
                          onFocus={e => e.target.style.borderColor = '#6366f1'}
                          onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditApiId(null)} style={{ padding: '7px 14px', border: '1px solid #E5E7EB', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', color: '#6B7280', background: 'white', fontFamily: 'inherit' }}>Odustani</button>
                      <button onClick={() => saveApiConfig(s.id)} style={{ padding: '7px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>Sačuvaj</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

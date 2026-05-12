'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit2, Trash2, Eye, EyeOff, Globe, Users, Package, Settings, RefreshCw, Copy, ExternalLink, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react'

interface Shop {
  id: string; naziv: string; slug: string; domena?: string
  plan: string; status: string; admin_email: string
  created_at: string; trial_do?: string; nibis_api_url?: string
}

interface NewShop {
  naziv: string; slug: string; domena: string; plan: string
  admin_email: string; nibis_api_url: string; nibis_api_key: string
}

const EMPTY_SHOP: NewShop = {
  naziv: '', slug: '', domena: '', plan: 'starter',
  admin_email: '', nibis_api_url: '', nibis_api_key: ''
}

export default function SuperAdminPage() {
  const [shopovi, setShopovi] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editShop, setEditShop] = useState<Shop | null>(null)
  const [newShop, setNewShop] = useState<NewShop>(EMPTY_SHOP)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [stats, setStats] = useState({ ukupno: 0, aktivnih: 0, prihod_procjena: 0 })

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('shopovi').select('*').order('created_at', { ascending: false })
    const shops = data || []
    setShopovi(shops)
    setStats({
      ukupno: shops.length,
      aktivnih: shops.filter(s => s.status === 'aktivan').length,
      prihod_procjena: shops.filter(s => s.status === 'aktivan').reduce((sum, s) => {
        return sum + (s.plan === 'enterprise' ? 199 : s.plan === 'pro' ? 99 : 49)
      }, 0)
    })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function slugify(s: string) {
    return s.toLowerCase()
      .replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/đ/g, 'd').replace(/ž/g, 'z')
      .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').trim()
  }

  async function createShop() {
    if (!newShop.naziv || !newShop.admin_email) { showToast('Naziv i email su obavezni'); return }
    setSaving(true)
    try {
      const slug = newShop.slug || slugify(newShop.naziv)

      // 1. Kreiraj shop
      const { data: shop, error: shopErr } = await supabase.from('shopovi').insert({
        naziv: newShop.naziv,
        slug,
        domena: newShop.domena || null,
        plan: newShop.plan,
        admin_email: newShop.admin_email,
        nibis_api_url: newShop.nibis_api_url || null,
        nibis_api_key: newShop.nibis_api_key || null,
        status: 'aktivan',
      }).select().single()

      if (shopErr) throw shopErr

      // 2. Kreiraj default postavke za novi shop
      const defaultPostavke = [
        { kljuc: 'shop_naziv', vrijednost: newShop.naziv },
        { kljuc: 'shop_email', vrijednost: newShop.admin_email },
        { kljuc: 'theme_primary_boja', vrijednost: '#0F6E56' },
        { kljuc: 'shop_template', vrijednost: 'default' },
        { kljuc: 'shop_watermark', vrijednost: 'true' },
      ].map(p => ({ ...p, shop_id: shop.id }))

      await supabase.from('postavke').insert(defaultPostavke)

      showToast('Shop kreiran! Admin može pristupiti na /' + slug + '/admin')
      setCreating(false)
      setNewShop(EMPTY_SHOP)
      load()
    } catch (e: any) {
      showToast('Greška: ' + e.message)
    }
    setSaving(false)
  }

  async function toggleStatus(shop: Shop) {
    const newStatus = shop.status === 'aktivan' ? 'suspendovan' : 'aktivan'
    await supabase.from('shopovi').update({ status: newStatus }).eq('id', shop.id)
    setShopovi(prev => prev.map(s => s.id === shop.id ? { ...s, status: newStatus } : s))
    showToast(newStatus === 'aktivan' ? 'Shop aktiviran' : 'Shop suspendovan')
  }

  async function deleteShop(id: string) {
    if (!confirm('Obrisati ovaj shop i sve podatke? Ovo se ne može poništiti!')) return
    await supabase.from('shopovi').delete().eq('id', id)
    setShopovi(prev => prev.filter(s => s.id !== id))
    showToast('Shop obrisan')
  }

  const planBoja = (plan: string) => plan === 'enterprise' ? '#7C3AED' : plan === 'pro' ? '#2563EB' : '#374151'
  const planCijena = (plan: string) => plan === 'enterprise' ? '199 KM' : plan === 'pro' ? '99 KM' : '49 KM'

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', system-ui, sans-serif", color: '#e2e8f0' }}>
      {toast && <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000, padding: '12px 20px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#065F46', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>{toast}</div>}

      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>⚡</div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>NIBIS SaaS Platform</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Super Admin Panel</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <a href="/" style={{ padding: '7px 14px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', textDecoration: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ExternalLink size={12} /> Glavni shop
          </a>
          <button onClick={() => setCreating(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>
            <Plus size={14} /> Novi shop
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Ukupno shopova', value: stats.ukupno, icon: ShoppingBag, color: '#6366f1' },
            { label: 'Aktivnih shopova', value: stats.aktivnih, icon: TrendingUp, color: '#10b981' },
            { label: 'Procjena prihoda', value: stats.prihod_procjena + ' KM/mj', icon: TrendingUp, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '44px', height: '44px', background: s.color + '20', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#f1f5f9' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* New shop form */}
        {creating && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 0 32px rgba(99,102,241,0.1)' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} style={{ color: '#6366f1' }} /> Novi shop
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              {[
                { label: 'Naziv firme *', key: 'naziv', placeholder: 'Firma d.o.o.' },
                { label: 'Slug (subdomain) *', key: 'slug', placeholder: 'firma-doo' },
                { label: 'Email admina *', key: 'admin_email', placeholder: 'admin@firma.ba' },
                { label: 'Vlastita domena (opcionalno)', key: 'domena', placeholder: 'shop.firma.ba' },
                { label: 'NIBIS API URL', key: 'nibis_api_url', placeholder: 'https://erp.firma.ba/api' },
                { label: 'NIBIS API Key', key: 'nibis_api_key', placeholder: 'api-key-...' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                  <input value={(newShop as any)[f.key]}
                    onChange={e => {
                      const val = e.target.value
                      setNewShop(prev => {
                        const updated: any = { ...prev, [f.key]: val }
                        if (f.key === 'naziv' && !prev.slug) updated.slug = slugify(val)
                        return updated
                      })
                    }}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[['starter', '49 KM/mj', 'Do 1000 artikala'], ['pro', '99 KM/mj', 'Neograničeni artikli'], ['enterprise', '199 KM/mj', 'Prioritetna podrška']].map(([v, c, d]) => (
                  <button key={v} onClick={() => setNewShop(prev => ({ ...prev, plan: v }))}
                    style={{ flex: 1, padding: '12px', border: '1.5px solid ' + (newShop.plan === v ? '#6366f1' : 'rgba(255,255,255,0.1)'), borderRadius: '10px', background: newShop.plan === v ? 'rgba(99,102,241,0.15)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: newShop.plan === v ? '#a5b4fc' : '#94a3b8', textTransform: 'capitalize' }}>{v}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>{c}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{d}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setCreating(false); setNewShop(EMPTY_SHOP) }}
                style={{ padding: '9px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8', fontFamily: 'inherit', fontSize: '13px' }}>
                Odustani
              </button>
              <button onClick={createShop} disabled={saving}
                style={{ flex: 1, padding: '9px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit' }}>
                {saving ? 'Kreiram...' : '⚡ Kreiraj shop'}
              </button>
            </div>
          </div>
        )}

        {/* Shops list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            Array(3).fill(0).map((_, i) => <div key={i} style={{ height: '80px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />)
          ) : shopovi.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <ShoppingBag size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p>Nema shopova. Kreiraj prvi!</p>
            </div>
          ) : shopovi.map(s => (
            <div key={s.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'}
            >
              {/* Status dot */}
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.status === 'aktivan' ? '#10b981' : '#ef4444', flexShrink: 0, boxShadow: s.status === 'aktivan' ? '0 0 6px #10b981' : 'none' }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>{s.naziv}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '100px', background: planBoja(s.plan) + '25', color: planBoja(s.plan), textTransform: 'capitalize' as const }}>{s.plan} · {planCijena(s.plan)}</span>
                  {s.status === 'suspendovan' && <span style={{ fontSize: '11px', padding: '2px 8px', background: '#fef2f2', color: '#dc2626', borderRadius: '100px' }}>Suspendovan</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span>🌐 {s.slug}.nibisshop.ba</span>
                  {s.domena && <span>↪ {s.domena}</span>}
                  <span>✉ {s.admin_email}</span>
                  <span>📅 {new Date(s.created_at).toLocaleDateString('bs-BA')}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                <a href={'/' + s.slug} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', background: 'transparent', color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                  <Globe size={12} /> Shop
                </a>
                <button onClick={() => toggleStatus(s)}
                  style={{ padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', background: 'transparent', cursor: 'pointer', color: s.status === 'aktivan' ? '#f59e0b' : '#10b981', fontFamily: 'inherit', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {s.status === 'aktivan' ? <><EyeOff size={12} /> Suspenduj</> : <><Eye size={12} /> Aktiviraj</>}
                </button>
                <button onClick={() => deleteShop(s.id)}
                  style={{ padding: '6px 8px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '7px', background: 'transparent', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

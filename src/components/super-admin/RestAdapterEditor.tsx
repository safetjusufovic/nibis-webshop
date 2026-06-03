'use client'

import { useState } from 'react'
import { X, Plug, Code, ArrowRight, Loader2, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react'

const STANDARD_FIELDS: Record<string, string[]> = {
  artikli: ['id', 'sifra', 'barkod', 'naziv', 'naziv2', 'opis', 'aktivan', 'procPoreza', 'planskaMaloprodajnaCijena', 'planskaVeleprodajnaCijena', 'grupaId'],
  grupe: ['id', 'sifra', 'naziv', 'parentId'],
  stanje: ['id', 'artikalId', 'raspolozivaKolicina', 'vpcijena', 'mpcijena', 'nabavnaCijena'],
  partneri: ['id', 'sifra', 'naziv', 'pdvBroj', 'grad', 'rabat'],
}

const EMPTY_EP = { path: '', method: 'GET', itemsPath: '', totalPath: '', pageParam: '', perPageParam: '', perPageValue: 100, pageStyle: 'page', searchParam: '', extraParams: [] }

function emptyConfig() {
  return {
    baseUrl: '',
    auth: { type: 'none', username: '', password: '', token: '', headerName: '', headerValue: '', extraHeaders: [] },
    endpoints: { artikli: { ...EMPTY_EP }, grupe: { ...EMPTY_EP }, stanje: { ...EMPTY_EP }, partneri: { ...EMPTY_EP }, narudzba: { ...EMPTY_EP, method: 'POST' } },
    mapping: { artikli: {}, grupe: {}, stanje: {}, partneri: {} },
    narudzbaTemplate: { bodyTemplate: '', stavkaTemplate: '', responseIdPath: '', responseOznakaPath: '' },
  }
}

const TABS = ['Konekcija', 'Endpointi', 'Mapiranje', 'Narudžba', 'Test'] as const

export default function RestAdapterEditor({ shopId, shopSlug, initialConfig, onClose, onSaved }: {
  shopId: string; shopSlug: string; initialConfig?: any; onClose: () => void; onSaved: () => void
}) {
  const [tab, setTab] = useState<typeof TABS[number]>('Konekcija')
  const [cfg, setCfg] = useState<any>(initialConfig && initialConfig.baseUrl ? initialConfig : emptyConfig())
  const [saving, setSaving] = useState(false)
  const [testResource, setTestResource] = useState<'artikli' | 'grupe' | 'stanje' | 'partneri'>('artikli')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const H = { 'Content-Type': 'application/json', 'x-super-admin-secret': 'nibis-super-2025' }

  function setAuth(k: string, v: any) { setCfg((c: any) => ({ ...c, auth: { ...c.auth, [k]: v } })) }
  function setEp(res: string, k: string, v: any) { setCfg((c: any) => ({ ...c, endpoints: { ...c.endpoints, [res]: { ...c.endpoints[res], [k]: v } } })) }
  function setMap(res: string, field: string, v: string) { setCfg((c: any) => ({ ...c, mapping: { ...c.mapping, [res]: { ...c.mapping[res], [field]: v } } })) }
  function setTpl(k: string, v: string) { setCfg((c: any) => ({ ...c, narudzbaTemplate: { ...c.narudzbaTemplate, [k]: v } })) }

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/super-admin/rest-config', {
        method: 'POST', headers: H,
        body: JSON.stringify({ shopId, config: cfg }),
      })
      onSaved()
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  async function runTest() {
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch('/api/super-admin/rest-config/test', {
        method: 'POST', headers: H,
        body: JSON.stringify({ config: cfg, resource: testResource }),
      })
      setTestResult(await res.json())
    } catch (e: any) { setTestResult({ error: e.message }) }
    setTesting(false)
  }

  const inputStyle = { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }
  const labelStyle = { fontSize: '11px', fontWeight: 600 as const, color: '#6B7280', display: 'block', marginBottom: '4px' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '780px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Code size={20} style={{ color: '#6366f1' }} />
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: 0 }}>Custom REST adapter — {shopSlug}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '12px 24px 0', borderBottom: '1px solid #E5E7EB' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: tab === t ? '#6366f1' : '#9CA3AF', borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent', marginBottom: '-1px' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflow: 'auto', flex: 1 }}>
          {tab === 'Konekcija' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Base URL</label>
                <input value={cfg.baseUrl} onChange={e => setCfg((c: any) => ({ ...c, baseUrl: e.target.value }))} placeholder="https://erp.firma.com/api" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Tip autentifikacije</label>
                <select value={cfg.auth.type} onChange={e => setAuth('type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="none">Bez autentifikacije</option>
                  <option value="basic">Basic (username + password)</option>
                  <option value="bearer">Bearer token</option>
                  <option value="apikey_header">API ključ u headeru</option>
                  <option value="custom_header">Custom header</option>
                </select>
              </div>
              {cfg.auth.type === 'basic' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}><label style={labelStyle}>Username</label><input value={cfg.auth.username} onChange={e => setAuth('username', e.target.value)} style={inputStyle} /></div>
                  <div style={{ flex: 1 }}><label style={labelStyle}>Password</label><input type="password" value={cfg.auth.password} onChange={e => setAuth('password', e.target.value)} style={inputStyle} /></div>
                </div>
              )}
              {cfg.auth.type === 'bearer' && (
                <div><label style={labelStyle}>Token</label><input value={cfg.auth.token} onChange={e => setAuth('token', e.target.value)} style={inputStyle} /></div>
              )}
              {(cfg.auth.type === 'apikey_header' || cfg.auth.type === 'custom_header') && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}><label style={labelStyle}>Naziv headera</label><input value={cfg.auth.headerName} onChange={e => setAuth('headerName', e.target.value)} placeholder="X-API-Key" style={inputStyle} /></div>
                  <div style={{ flex: 1 }}><label style={labelStyle}>Vrijednost</label><input value={cfg.auth.headerValue} onChange={e => setAuth('headerValue', e.target.value)} style={inputStyle} /></div>
                </div>
              )}
            </div>
          )}

          {tab === 'Endpointi' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Putanja se dodaje na Base URL. itemsPath = gdje su podaci u odgovoru (npr. <code>value</code> za OData, <code>data.rows</code>, prazno za root niz).</p>
              {['artikli', 'grupe', 'stanje', 'partneri'].map(res => (
                <div key={res} style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '14px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#374151', margin: '0 0 10px', textTransform: 'capitalize' as const }}>{res}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div><label style={labelStyle}>Putanja</label><input value={cfg.endpoints[res]?.path || ''} onChange={e => setEp(res, 'path', e.target.value)} placeholder={'/' + res} style={inputStyle} /></div>
                    <div><label style={labelStyle}>itemsPath</label><input value={cfg.endpoints[res]?.itemsPath || ''} onChange={e => setEp(res, 'itemsPath', e.target.value)} placeholder="value" style={inputStyle} /></div>
                    <div><label style={labelStyle}>totalPath</label><input value={cfg.endpoints[res]?.totalPath || ''} onChange={e => setEp(res, 'totalPath', e.target.value)} placeholder="@odata.count" style={inputStyle} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                    <div><label style={labelStyle}>pageParam</label><input value={cfg.endpoints[res]?.pageParam || ''} onChange={e => setEp(res, 'pageParam', e.target.value)} placeholder="page" style={inputStyle} /></div>
                    <div><label style={labelStyle}>perPageParam</label><input value={cfg.endpoints[res]?.perPageParam || ''} onChange={e => setEp(res, 'perPageParam', e.target.value)} placeholder="perPage" style={inputStyle} /></div>
                    <div>
                      <label style={labelStyle}>Stil</label>
                      <select value={cfg.endpoints[res]?.pageStyle || 'page'} onChange={e => setEp(res, 'pageStyle', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="page">page (broj)</option>
                        <option value="offset">offset (skip)</option>
                      </select>
                    </div>
                    {res === 'partneri' && <div><label style={labelStyle}>searchParam</label><input value={cfg.endpoints[res]?.searchParam || ''} onChange={e => setEp(res, 'searchParam', e.target.value)} placeholder="search" style={inputStyle} /></div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'Mapiranje' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Lijevo standardno polje, desno upiši kako se zove u ERP odgovoru (putanja). Koristi Test tab da vidiš stvarna imena polja.</p>
              {Object.entries(STANDARD_FIELDS).map(([res, fields]) => (
                <div key={res} style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '14px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#374151', margin: '0 0 10px', textTransform: 'capitalize' as const }}>{res}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {fields.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#6B7280', minWidth: '90px', fontWeight: 500 }}>{f}</span>
                        <ArrowRight size={12} style={{ color: '#D1D5DB', flexShrink: 0 }} />
                        <input value={cfg.mapping[res]?.[f] || ''} onChange={e => setMap(res, f, e.target.value)} placeholder="ERP polje" style={{ ...inputStyle, padding: '6px 8px', fontSize: '12px' }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'Narudžba' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>JSON template za slanje narudžbe. Koristi <code>{'{{partnerId}}'}</code>, <code>{'{{externalId}}'}</code>, <code>{'{{napomena}}'}</code>. Za stavke <code>{'{{#stavke}}...{{/stavke}}'}</code> i u njemu <code>{'{{artikalId}}'}</code>, <code>{'{{kolicina}}'}</code>, <code>{'{{jedinicnaCijena}}'}</code>.</p>
              <div><label style={labelStyle}>Endpoint narudžbe (putanja)</label><input value={cfg.endpoints.narudzba?.path || ''} onChange={e => setEp('narudzba', 'path', e.target.value)} placeholder="/orders" style={inputStyle} /></div>
              <div><label style={labelStyle}>Body template (JSON)</label><textarea value={cfg.narudzbaTemplate?.bodyTemplate || ''} onChange={e => setTpl('bodyTemplate', e.target.value)} rows={6} placeholder={'{\n  "partner": "{{partnerId}}",\n  "items": [{{#stavke}}{{/stavke}}]\n}'} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px' }} /></div>
              <div><label style={labelStyle}>Stavka template (JSON)</label><textarea value={cfg.narudzbaTemplate?.stavkaTemplate || ''} onChange={e => setTpl('stavkaTemplate', e.target.value)} rows={3} placeholder={'{"id":"{{artikalId}}","qty":{{kolicina}},"price":{{jedinicnaCijena}}}'} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px' }} /></div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>ID u odgovoru</label><input value={cfg.narudzbaTemplate?.responseIdPath || ''} onChange={e => setTpl('responseIdPath', e.target.value)} placeholder="id" style={inputStyle} /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>Broj dokumenta u odgovoru</label><input value={cfg.narudzbaTemplate?.responseOznakaPath || ''} onChange={e => setTpl('responseOznakaPath', e.target.value)} placeholder="docNo" style={inputStyle} /></div>
              </div>
            </div>
          )}

          {tab === 'Test' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Pozovi stvarni endpoint i vidi sirovi odgovor — odatle čitaš tačna imena polja za mapiranje.</p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Resurs</label>
                  <select value={testResource} onChange={e => setTestResource(e.target.value as any)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="artikli">Artikli</option>
                    <option value="grupe">Grupe</option>
                    <option value="stanje">Stanje</option>
                    <option value="partneri">Partneri</option>
                  </select>
                </div>
                <button onClick={runTest} disabled={testing || !cfg.baseUrl}
                  style={{ padding: '9px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {testing ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />} Pozovi
                </button>
              </div>
              {testResult && (
                <div>
                  {testResult.error ? (
                    <div style={{ padding: '12px', background: '#FEF2F2', borderRadius: '8px', color: '#991B1B', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={16} /> {testResult.error}
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#065F46', fontSize: '13px' }}>
                        <CheckCircle2 size={16} /> Odgovor primljen — struktura ispod:
                      </div>
                      <pre style={{ background: '#1E293B', color: '#94Fbe8', padding: '14px', borderRadius: '8px', fontSize: '11px', overflow: 'auto', maxHeight: '300px', margin: 0 }}>
                        {JSON.stringify(testResult.sample, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', background: 'none', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>Zatvori</button>
          <button onClick={save} disabled={saving} style={{ padding: '9px 20px', background: '#0F6E56', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null} Sačuvaj konfiguraciju
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Check, ChevronRight, ChevronLeft, Loader2, Store, Plug, Tag, CheckCircle2, X, AlertCircle } from 'lucide-react'

const H = { 'Content-Type': 'application/json', 'x-super-admin-secret': 'nibis-super-2025' }

interface WizardData {
  naziv: string; slug: string; admin_email: string; domena: string
  nibis_api_url: string; nibis_api_key: string; org_jed_id: string; company_year: string
  tip_cijene: 'vpcijena' | 'mpcijena'
}

const EMPTY: WizardData = {
  naziv: '', slug: '', admin_email: '', domena: '',
  nibis_api_url: 'https://api.nextvision.ba/integration/robno-materijalno',
  nibis_api_key: '', org_jed_id: '1', company_year: new Date().getFullYear().toString(),
  tip_cijene: 'vpcijena',
}

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/đ/g, 'd').replace(/ž/g, 'z')
    .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

const STEPS = [
  { id: 1, label: 'Osnovni podaci', icon: Store },
  { id: 2, label: 'NIBIS konekcija', icon: Plug },
  { id: 3, label: 'Tip cijena', icon: Tag },
  { id: 4, label: 'Pregled', icon: CheckCircle2 },
]

export default function OnboardingWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>(EMPTY)
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  function upd(field: keyof WizardData, val: string) {
    setData(p => {
      const next = { ...p, [field]: val }
      if (field === 'naziv' && !p.slug) next.slug = slugify(val)
      return next
    })
    if (field === 'nibis_api_url' || field === 'nibis_api_key') setTestResult(null)
  }

  async function testNibis() {
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch('/api/super-admin/test-nibis', { method: 'POST', headers: H, body: JSON.stringify(data) })
      setTestResult(await res.json())
    } catch (e: any) { setTestResult({ ok: false, error: e.message }) }
    setTesting(false)
  }

  async function create() {
    setCreating(true); setError('')
    try {
      const res = await fetch('/api/super-admin', { method: 'POST', headers: H, body: JSON.stringify({ ...data, slug: data.slug || slugify(data.naziv) }) })
      const created = await res.json()
      if (created.error) { setError(created.error); setCreating(false); return }
      if (data.tip_cijene === 'mpcijena' && created.id) {
        await fetch('/api/postavke?shop=' + (data.slug || slugify(data.naziv)), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{ kljuc: 'tip_cijene', vrijednost: 'mpcijena' }]),
        }).catch(() => {})
      }
      onCreated()
    } catch (e: any) { setError(e.message); setCreating(false) }
  }

  const canNext = step === 1 ? !!(data.naziv && data.admin_email && data.slug) : step === 2 ? !!(data.nibis_api_url && data.nibis_api_key) : true

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>Novi shop</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', padding: '20px 24px', gap: '8px' }}>
          {STEPS.map(s => {
            const active = s.id === step; const done = s.id < step
            return (
              <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done || active ? '#0F6E56' : '#E5E7EB', color: done || active ? 'white' : '#9CA3AF' }}>
                  {done ? <Check size={16} /> : <s.icon size={16} />}
                </div>
                <span style={{ fontSize: '11px', fontWeight: active ? 600 : 400, color: active ? '#0F6E56' : '#9CA3AF', textAlign: 'center' }}>{s.label}</span>
              </div>
            )
          })}
        </div>
        <div style={{ padding: '8px 24px 24px' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Naziv shopa *" value={data.naziv} onChange={v => upd('naziv', v)} placeholder="Npr. ABC Trgovina" />
              <Field label="URL slug *" value={data.slug} onChange={v => upd('slug', slugify(v))} placeholder="abc-trgovina" hint={'Shop URL: nibis-webshop.vercel.app/' + (data.slug || 'slug')} />
              <Field label="Email administratora *" value={data.admin_email} onChange={v => upd('admin_email', v)} placeholder="admin@firma.ba" type="email" />
              <Field label="Custom domena (opcionalno)" value={data.domena} onChange={v => upd('domena', v)} placeholder="shop.firma.ba" hint="Možeš dodati kasnije" />
            </div>
          )}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="NIBIS API URL *" value={data.nibis_api_url} onChange={v => upd('nibis_api_url', v)} placeholder="https://api.nextvision.ba/..." />
              <Field label="NIBIS API ključ *" value={data.nibis_api_key} onChange={v => upd('nibis_api_key', v)} placeholder="erp_..." />
              <div style={{ display: 'flex', gap: '12px' }}>
                <Field label="Org. jedinica ID" value={data.org_jed_id} onChange={v => upd('org_jed_id', v)} placeholder="1" />
                <Field label="Poslovna godina" value={data.company_year} onChange={v => upd('company_year', v)} placeholder="2026" />
              </div>
              <button onClick={testNibis} disabled={testing || !data.nibis_api_url || !data.nibis_api_key}
                style={{ padding: '10px', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#374151' }}>
                {testing ? <Loader2 size={16} className="animate-spin" /> : <Plug size={16} />} Testiraj konekciju
              </button>
              {testResult && (
                <div style={{ padding: '12px', borderRadius: '10px', background: testResult.ok ? '#ECFDF5' : '#FEF2F2', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: testResult.ok ? '#065F46' : '#991B1B' }}>
                  {testResult.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {testResult.ok ? 'Konekcija uspješna! NIBIS odgovara.' : 'Greška: ' + (testResult.error || 'konekcija neuspješna')}
                </div>
              )}
            </div>
          )}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 8px' }}>Kako shop prikazuje cijene?</p>
              {[
                { val: 'vpcijena', title: 'B2B — Veleprodaja', desc: 'Veleprodajne cijene (bez PDV-a), PDV se dodaje' },
                { val: 'mpcijena', title: 'B2C — Maloprodaja', desc: 'Maloprodajne cijene (sa PDV-om), PDV uključen' },
              ].map(opt => (
                <button key={opt.val} onClick={() => upd('tip_cijene', opt.val)}
                  style={{ padding: '16px', borderRadius: '12px', border: data.tip_cijene === opt.val ? '2px solid #0F6E56' : '1px solid #E5E7EB', background: data.tip_cijene === opt.val ? '#F0FDF9' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: '#111827', marginBottom: '4px' }}>{opt.title}</div>
                  <div style={{ fontSize: '13px', color: '#6B7280' }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          )}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Row label="Naziv" value={data.naziv} />
              <Row label="URL" value={'/' + data.slug} />
              <Row label="Email" value={data.admin_email} />
              {data.domena && <Row label="Domena" value={data.domena} />}
              <Row label="NIBIS" value={testResult?.ok ? '✓ Testirano' : 'Nije testirano'} />
              <Row label="Tip" value={data.tip_cijene === 'vpcijena' ? 'B2B (veleprodaja)' : 'B2C (maloprodaja)'} />
              {error && <div style={{ padding: '12px', background: '#FEF2F2', borderRadius: '10px', color: '#991B1B', fontSize: '13px' }}>{error}</div>}
              <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '8px' }}>Nakon kreiranja, pokreni sinhronizaciju da se učitaju artikli.</p>
            </div>
          )}
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            style={{ padding: '10px 16px', background: 'none', border: '1px solid #D1D5DB', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: '#374151' }}>
            <ChevronLeft size={16} /> {step > 1 ? 'Nazad' : 'Otkaži'}
          </button>
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canNext}
              style={{ padding: '10px 20px', background: canNext ? '#0F6E56' : '#D1D5DB', color: 'white', border: 'none', borderRadius: '10px', cursor: canNext ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              Dalje <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={create} disabled={creating}
              style={{ padding: '10px 20px', background: '#0F6E56', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Kreiraj shop
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #D1D5DB', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
      {hint && <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0' }}>{hint}</p>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
      <span style={{ fontSize: '13px', color: '#6B7280' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{value}</span>
    </div>
  )
}

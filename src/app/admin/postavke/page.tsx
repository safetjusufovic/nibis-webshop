'use client'
import { usePathname } from 'next/navigation'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Settings, Mail, Store, Users, Bell } from 'lucide-react'

interface Postavka {
  kljuc: string
  vrijednost: string
}

const SECTIONS = [
  {
    id: 'shop',
    icon: <Store size={16} />,
    title: 'Opće informacije',
    keys: [
      { key: 'shop_naziv', label: 'Naziv webshopa', type: 'text', placeholder: 'Npr. ABC d.o.o. WebShop' },
      { key: 'shop_email', label: 'Kontakt email', type: 'email', placeholder: 'info@firma.ba' },
      { key: 'shop_telefon', label: 'Telefon', type: 'text', placeholder: '+387 33 000 000' },
      { key: 'shop_adresa', label: 'Adresa', type: 'text', placeholder: 'Ulica bb, Sarajevo' },
    ]
  },
  {
    id: 'katalog',
    icon: <Bell size={16} />,
    title: 'Katalog i narudžbe',
    keys: [
      { key: 'announcement_bar', label: 'Poruka na vrhu stranice', type: 'text', placeholder: 'Npr. Besplatna dostava iznad 500 KM' },
      { key: 'min_narudzba', label: 'Minimalni iznos narudžbe (KM)', type: 'number', placeholder: '0' },
      { key: 'nacini_placanja', label: 'Načini plaćanja (odvojeni zarezom)', type: 'text', placeholder: 'Virman,Gotovina,Kartica' },
    ]
  },
  {
    id: 'registracija',
    icon: <Users size={16} />,
    title: 'Registracija',
    keys: [
      { key: 'registracija_otvorena', label: 'Dozvoliti novu registraciju', type: 'boolean', placeholder: '' },
    ]
  },
  {
    id: 'hero',
    icon: <Bell size={16} />,
    title: 'Hero Banner',
    keys: [
      { key: 'hero_aktivan', label: 'Prikaži hero banner', type: 'boolean', placeholder: '' },
      { key: 'hero_naslov', label: 'Naslov', type: 'text', placeholder: 'Dobrodošli u naš webshop' },
      { key: 'hero_podnaslov', label: 'Podnaslov', type: 'text', placeholder: 'Profesionalna roba za vaše poslovanje' },
      { key: 'hero_dugme_tekst', label: 'Tekst dugmeta', type: 'text', placeholder: 'Pregledaj katalog' },
      { key: 'hero_boja_pozadine', label: 'Boja pozadine (hex)', type: 'text', placeholder: '#0F6E56' },
      { key: 'hero_url_slike', label: 'URL pozadinske slike (opcionalno)', type: 'text', placeholder: 'https://...' },
    ]
  },
  {
    id: 'izgled',
    icon: <Settings size={16} />,
    title: 'Izgled i banneri',
    keys: [
      { key: 'baner_tekst', label: 'Tekst bannera (announcement bar)', type: 'text', placeholder: 'Npr. Besplatna dostava iznad 500 KM' },
      { key: 'baner_boja_pozadine', label: 'Boja pozadine bannera (hex)', type: 'text', placeholder: '#085041' },
      { key: 'baner_boja_teksta', label: 'Boja teksta bannera (hex)', type: 'text', placeholder: '#ffffff' },
      { key: 'akcije_slider_naslov', label: 'Naslov sekcije akcija', type: 'text', placeholder: 'Akcije' },
      { key: 'primary_boja', label: 'Primarna boja (hex)', type: 'text', placeholder: '#0F6E56' },
    ]
  },
  {
    id: 'email',
    icon: <Mail size={16} />,
    title: 'Email predlošci',
    keys: [
      { key: 'email_predlozak_narudzba', label: 'Dodatni tekst u emailu potvrde narudžbe', type: 'textarea', placeholder: 'Npr. Hvala na narudžbi! Kontaktirajte nas za više info.' },
    ]
  },
]

export default function AdminPostavkePage() {
  // Čitaj shopSlug iz URL path-a: /novishop/admin/X -> novishop
  const pathname = usePathname()
  const _segments = pathname.split('/').filter(Boolean)
  const _adminIdx = _segments.indexOf('admin')
  const shopSlug = _adminIdx > 0 ? _segments[_adminIdx - 1] : ''
  const [postavke, setPostavke] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/postavke?kljuci=shop_naziv,shop_email,shop_telefon,shop_adresa,shop_grad,shop_web,shop_pib,shop_pdv_broj,announcement_bar,baner_boja_pozadine,baner_boja_teksta,nacini_placanja,korpa_napomena,korpa_pdv_prikaz,min_narudzba,registracija_otvorena,registracija_poruka,email_potvrda_narudzba,email_admin_narudzba,email_admin_registracija,per_page,default_view,default_sort,artikal_prikaz_dvije_cijene,artikal_velep_label,artikal_malop_label,artikal_prikaz_pdv,artikal_prikaz_sifra,artikal_prikaz_kategorija,artikal_prikaz_barcode,artikal_dugme_tekst,artikal_badge_stanje,sidebar_sirina,sidebar_pozicija' + (shopSlug ? '&shop=' + shopSlug : '')).then(r => r.json()).then((data) => {
      const map: Record<string, string> = {}
      Object.entries(data || {}).forEach(([k, v]) => { if (v) map[k] = v as string })
      setPostavke(map)
      setLoading(false)
    })
  }, [])

  function update(key: string, val: string) {
    setPostavke(prev => ({ ...prev, [key]: val }))
  }

  async function save() {
    setSaving(true)
    const rows = Object.entries(postavke).map(([kljuc, vrijednost]) => ({ kljuc, vrijednost }))
    await fetch('/api/postavke' + (shopSlug ? '?shop=' + shopSlug : ''), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rows) })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[1,2,3].map(i => <div key={i} style={{ height: '120px', background: 'var(--border)', borderRadius: '14px', animation: 'pulse 1.5s infinite' }} />)}
    </div>
  )

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text)' }}>Postavke</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Konfiguracija webshopa
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: saved ? '#059669' : 'var(--brand)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <Save size={15} />
          {saving ? 'Čuvam...' : saved ? 'Sačuvano ✓' : 'Sačuvaj promjene'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {SECTIONS.map(section => (
          <div key={section.id} style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 20px',
              background: 'var(--surface)',
              borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--brand)' }}>{section.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{section.title}</span>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {section.keys.map(field => (
                <div key={field.key}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text)',
                    marginBottom: '6px',
                  }}>
                    {field.label}
                  </label>

                  {field.type === 'boolean' ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={postavke[field.key] === 'true'}
                        onChange={e => update(field.key, e.target.checked ? 'true' : 'false')}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--brand)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        {postavke[field.key] === 'true' ? 'Uključeno' : 'Isključeno'}
                      </span>
                    </label>
                  ) : field.type === 'range' ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="range"
                          min={180}
                          max={400}
                          step={10}
                          value={parseInt(postavke[field.key] ?? '240') || 240}
                          onChange={e => update(field.key, e.target.value)}
                          style={{ flex: 1, accentColor: 'var(--brand)' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brand)', minWidth: '48px' }}>
                          {postavke[field.key] ?? '240'}px
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Promjena se primjenjuje nakon osvježavanja stranice
                      </div>
                    </div>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={postavke[field.key] ?? ''}
                      onChange={e => update(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        color: 'var(--text)',
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'var(--brand-light)'; e.target.style.boxShadow = '0 0 0 3px rgba(29,158,117,0.1)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={postavke[field.key] ?? ''}
                      onChange={e => update(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        color: 'var(--text)',
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'var(--brand-light)'; e.target.style.boxShadow = '0 0 0 3px rgba(29,158,117,0.1)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

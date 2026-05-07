'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Monitor, Palette, Type, Layout, Sliders, Square, AlignLeft, Smartphone, Undo2, Download, Upload, Image as ImageIcon, Globe, ShoppingBag, GripVertical, Eye, EyeOff } from 'lucide-react'

// ─── Preset teme ──────────────────────────────────────────────────────────────
const PRESET_TEME = [
  {
    naziv: 'Emerald', emoji: '🟢',
    boje: { theme_primary_boja: '#0F6E56', theme_bg_stranica: '#F8FAFA', theme_bg_kartica: '#ffffff', theme_border_boja: '#E8EDEB', theme_tekst_boja: '#0D1F1A', theme_header_boja: '#ffffff', baner_boja_pozadine: '#085041' }
  },
  {
    naziv: 'Ocean', emoji: '🔵',
    boje: { theme_primary_boja: '#0369A1', theme_bg_stranica: '#F0F9FF', theme_bg_kartica: '#ffffff', theme_border_boja: '#BAE6FD', theme_tekst_boja: '#0C4A6E', theme_header_boja: '#ffffff', baner_boja_pozadine: '#0C4A6E' }
  },
  {
    naziv: 'Violet', emoji: '🟣',
    boje: { theme_primary_boja: '#7C3AED', theme_bg_stranica: '#FAF5FF', theme_bg_kartica: '#ffffff', theme_border_boja: '#E9D5FF', theme_tekst_boja: '#2E1065', theme_header_boja: '#ffffff', baner_boja_pozadine: '#4C1D95' }
  },
  {
    naziv: 'Dark', emoji: '⚫',
    boje: { theme_primary_boja: '#10B981', theme_bg_stranica: '#111827', theme_bg_kartica: '#1F2937', theme_border_boja: '#374151', theme_tekst_boja: '#F9FAFB', theme_header_boja: '#1F2937', baner_boja_pozadine: '#064E3B' }
  },
  {
    naziv: 'Slate', emoji: '🔘',
    boje: { theme_primary_boja: '#475569', theme_bg_stranica: '#F8FAFC', theme_bg_kartica: '#ffffff', theme_border_boja: '#E2E8F0', theme_tekst_boja: '#0F172A', theme_header_boja: '#0F172A', baner_boja_pozadine: '#1E293B' }
  },
  {
    naziv: 'Rose', emoji: '🔴',
    boje: { theme_primary_boja: '#E11D48', theme_bg_stranica: '#FFF1F2', theme_bg_kartica: '#ffffff', theme_border_boja: '#FECDD3', theme_tekst_boja: '#881337', theme_header_boja: '#ffffff', baner_boja_pozadine: '#9F1239' }
  },
]

const FONTS = ['DM Sans', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Nunito', 'Montserrat', 'Raleway', 'Source Sans 3']

const BOJE_PRIMARNE = ['#0F6E56','#065F46','#059669','#0891B2','#1D4ED8','#4F46E5','#7C3AED','#C026D3','#E11D48','#DC2626','#EA580C','#D97706','#374151','#1F2937','#000000']
const BOJE_SVJETLE = ['#F0FDF4','#ECFDF5','#E0F2FE','#EFF6FF','#F5F3FF','#FFF7ED','#FEF2F2','#F8FAFC','#F1F5F9','#F9FAFB','#E5E7EB','#ffffff']

interface Theme {
  shop_naziv: string; shop_email: string; shop_telefon: string; shop_adresa: string
  theme_logo_url: string; seo_naslov: string; seo_opis: string; seo_og_slika: string
  footer_social_facebook: string; footer_social_instagram: string; footer_social_linkedin: string
  theme_primary_boja: string; theme_bg_stranica: string; theme_bg_kartica: string
  theme_border_boja: string; theme_tekst_boja: string; theme_tekst_muted: string
  theme_cijena_boja: string; theme_akcija_boja: string
  theme_header_boja: string; theme_header_tekst_boja: string
  theme_header_visina: string; theme_header_shadow: string; theme_header_logo_pozicija: string
  announcement_bar: string; baner_boja_pozadine: string; baner_boja_teksta: string
  theme_footer_boja: string; theme_footer_tekst: string
  hero_aktivan: string; hero_naslov: string; hero_podnaslov: string; hero_dugme_tekst: string
  hero_slika_url: string; hero_overlay_boja: string; hero_overlay_opacity: string
  hero_tekst_pozicija: string; hero_visina: string; hero_boja_pozadine: string
  theme_font: string; theme_font_naslov_size: string; theme_font_body_size: string; theme_font_cijena_size: string
  theme_border_radius: string; theme_dugme_stil: string; theme_dugme_visina: string; theme_dugme_shadow: string
  theme_kartica_radius: string; theme_kartica_shadow: string; theme_kartica_prikaz_cijene: string; theme_kartica_slika_visina: string
  theme_sidebar_tekst_boja: string; theme_sidebar_font_size: string; theme_sidebar_spacing: string
  theme_spacing: string; theme_animacije_speed: string; theme_hover_speed: string
  theme_input_stil: string; theme_badge_stil: string; theme_cijena_format: string
  per_page: string; default_view: string; default_sort: string; prikazi_bez_stanja: string
  nacini_placanja: string; korpa_napomena: string; korpa_pdv_prikaz: string; min_narudzba: string
  registracija_otvorena: string; registracija_poruka: string
  email_potvrda_narudzba: string; email_admin_narudzba: string; email_admin_registracija: string
  theme_custom_css: string
  theme_google_font_naslov: string
  theme_google_font_tijelo: string
  theme_gradient_primary: string
  theme_gradient_boja2: string
  theme_gradient_ugao: string
  theme_sekcije_redosljed: string
  theme_publish_status: string
  theme_draft: string
}

const DEFAULTS: Theme = {
  shop_naziv: '', shop_email: '', shop_telefon: '', shop_adresa: '',
  theme_logo_url: '', seo_naslov: '', seo_opis: '', seo_og_slika: '',
  footer_social_facebook: '', footer_social_instagram: '', footer_social_linkedin: '',
  theme_primary_boja: '#0F6E56', theme_bg_stranica: '#F8FAFA', theme_bg_kartica: '#ffffff',
  theme_border_boja: '#E8EDEB', theme_tekst_boja: '#0D1F1A', theme_tekst_muted: '#6B8279',
  theme_cijena_boja: '#0D1F1A', theme_akcija_boja: '#DC2626',
  theme_header_boja: '#ffffff', theme_header_tekst_boja: '#0D1F1A',
  theme_header_visina: '64', theme_header_shadow: 'true', theme_header_logo_pozicija: 'left',
  announcement_bar: '', baner_boja_pozadine: '#085041', baner_boja_teksta: '#ffffff',
  theme_footer_boja: '#ffffff', theme_footer_tekst: 'B2B webshop · Powered by NIBIS ERP',
  hero_aktivan: 'true', hero_naslov: 'Dobrodošli', hero_podnaslov: '', hero_dugme_tekst: 'Pregledaj katalog',
  hero_slika_url: '', hero_overlay_boja: '#000000', hero_overlay_opacity: '0.4',
  hero_tekst_pozicija: 'left', hero_visina: '400', hero_boja_pozadine: '#0F6E56',
  theme_font: 'DM Sans', theme_font_naslov_size: '22', theme_font_body_size: '14', theme_font_cijena_size: '16',
  theme_border_radius: '10', theme_dugme_stil: 'gradient', theme_dugme_visina: '36', theme_dugme_shadow: 'true',
  theme_kartica_radius: '14', theme_kartica_shadow: 'true', theme_kartica_prikaz_cijene: 'bottom', theme_kartica_slika_visina: '60',
  theme_sidebar_tekst_boja: '#374151', theme_sidebar_font_size: '13', theme_sidebar_spacing: '8',
  theme_spacing: 'normal', theme_animacije_speed: '150', theme_hover_speed: 'normal',
  theme_input_stil: 'border', theme_badge_stil: 'pill', theme_cijena_format: 'KM',
  per_page: '24', default_view: 'table', default_sort: 'naziv', prikazi_bez_stanja: 'true',
  nacini_placanja: 'Virman,Gotovina,Kartica', korpa_napomena: 'true', korpa_pdv_prikaz: 'true', min_narudzba: '0',
  registracija_otvorena: 'true', registracija_poruka: 'Vaš zahtjev je primljen.',
  email_potvrda_narudzba: 'true', email_admin_narudzba: 'true', email_admin_registracija: 'true',
  theme_custom_css: '',
  theme_google_font_naslov: '',
  theme_google_font_tijelo: '',
  theme_gradient_primary: 'false',
  theme_gradient_boja2: '#059669',
  theme_gradient_ugao: '135',
  theme_sekcije_redosljed: 'hero,akcije,katalog',
  theme_publish_status: 'published',
  theme_draft: '',
}

// ─── Komponente ───────────────────────────────────────────────────────────────
function BojaInput({ label, value, onChange, svjetle }: { label: string; value: string; onChange: (v: string) => void; svjetle?: boolean }) {
  const boje = svjetle ? BOJE_SVJETLE : BOJE_PRIMARNE
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '10px', gap: '8px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
          {boje.map(c => (
            <button key={c} onClick={() => onChange(c)} title={c} style={{
              width: '100%', aspectRatio: '1', borderRadius: '5px', background: c,
              border: value === c ? '2px solid #0F6E56' : '1px solid rgba(0,0,0,0.12)',
              cursor: 'pointer', padding: 0, transition: 'transform 0.1s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.18)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '4px', borderTop: '1px solid #E5E7EB' }}>
          <input type="color" value={value} onChange={e => onChange(e.target.value)}
            style={{ width: '36px', height: '30px', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', padding: '1px', flexShrink: 0 }} />
          <input type="text" value={value} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
            style={{ flex: 1, padding: '5px 7px', fontSize: '11px', fontFamily: 'monospace', border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none', background: 'white' }} />
          <span style={{ width: '24px', height: '24px', borderRadius: '5px', background: value, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
        </div>
      </div>
    </div>
  )
}

function Slider({ label, value, onChange, min, max, unit = 'px' }: { label: string; value: string; onChange: (v: string) => void; min: number; max: number; unit?: string }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'flex', justifyContent: 'space-between', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <span>{label}</span><span style={{ color: '#0F6E56', fontWeight: 700 }}>{value}{unit}</span>
      </label>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', accentColor: '#0F6E56' }} />
    </div>
  )
}

function TInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: 'white', color: '#111827' }}
        onFocus={e => { e.target.style.borderColor = '#0F6E56'; e.target.style.boxShadow = '0 0 0 2px rgba(15,110,86,0.1)' }}
        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }} />
    </div>
  )
}

function Toggle({ label, value, onChange, desc }: { label: string; value: string; onChange: (v: string) => void; desc?: string }) {
  const on = value === 'true'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#1F2937' }}>{label}</div>
        {desc && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(on ? 'false' : 'true')} style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', flexShrink: 0,
        background: on ? '#0F6E56' : '#D1D5DB', position: 'relative', transition: 'background 0.2s',
      }}>
        <span style={{ position: 'absolute', top: '2px', left: on ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', background: 'white', cursor: 'pointer', color: '#111827', fontFamily: 'inherit' }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
      <div style={{ padding: '10px 14px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
      </div>
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div>
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>{children}</div>
}

function Grid3({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>{children}</div>
}

// ─── Live Preview ─────────────────────────────────────────────────────────────
function LivePreview({ t, mobile }: { t: Theme; mobile: boolean }) {
  const r = parseInt(t.theme_border_radius) || 10
  const kr = parseInt(t.theme_kartica_radius) || 14
  const hv = parseInt(t.theme_header_visina) || 64
  const dv = parseInt(t.theme_dugme_visina) || 36
  const isGrad = t.theme_dugme_stil === 'gradient'
  const isOut = t.theme_dugme_stil === 'outline'
  const btnBg = isOut ? 'transparent' : isGrad ? `linear-gradient(135deg, ${t.theme_primary_boja}, ${t.theme_primary_boja}cc)` : t.theme_primary_boja
  const btnColor = isOut ? t.theme_primary_boja : 'white'
  const btnBorder = isOut ? `1.5px solid ${t.theme_primary_boja}` : 'none'
  const btnShadow = t.theme_dugme_shadow === 'true' && !isOut ? `0 2px 8px ${t.theme_primary_boja}40` : 'none'
  const w = mobile ? 180 : 280
  const scale = mobile ? 0.6 : 0.7

  return (
    <div style={{ width: w + 'px', border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontFamily: t.theme_font + ', sans-serif', fontSize: parseInt(t.theme_font_body_size) * scale + 'px' }}>
      {t.announcement_bar && (
        <div style={{ background: t.baner_boja_pozadine, color: t.baner_boja_teksta, fontSize: '7px', textAlign: 'center', padding: '3px 8px' }}>{t.announcement_bar}</div>
      )}
      <div style={{ background: t.theme_header_boja, borderBottom: `1px solid ${t.theme_border_boja}`, padding: `0 10px`, height: hv * scale * 0.75 + 'px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: t.theme_header_shadow === 'true' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none' }}>
        {t.theme_logo_url
          ? <img src={t.theme_logo_url} alt="" style={{ height: '16px', objectFit: 'contain' }} />
          : <span style={{ fontSize: '10px', fontWeight: 700, color: t.theme_header_tekst_boja }}>{t.shop_naziv || 'WebShop'}</span>
        }
        {!mobile && (
          <div style={{ flex: 1, margin: '0 8px', height: '16px', background: t.theme_bg_stranica, border: `1px solid ${t.theme_border_boja}`, borderRadius: r * 0.4 + 'px', display: 'flex', alignItems: 'center', paddingLeft: '6px' }}>
            <span style={{ fontSize: '7px', color: t.theme_tekst_muted }}>Pretraži...</span>
          </div>
        )}
        <div style={{ background: btnBg, color: btnColor, border: btnBorder, fontSize: '7px', fontWeight: 700, padding: `0 7px`, height: dv * scale * 0.6 + 'px', borderRadius: r * 0.5 + 'px', display: 'flex', alignItems: 'center', boxShadow: btnShadow, whiteSpace: 'nowrap' }}>
          🛒 {mobile ? '' : 'Korpa'}
        </div>
      </div>

      {/* Hero */}
      {t.hero_aktivan === 'true' && (
        <div style={{
          height: parseInt(t.hero_visina) * scale * 0.25 + 'px',
          background: t.hero_slika_url ? `linear-gradient(rgba(0,0,0,${t.hero_overlay_opacity}), rgba(0,0,0,${t.hero_overlay_opacity})), url(${t.hero_slika_url}) center/cover` : t.hero_boja_pozadine,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '6px 10px',
          alignItems: t.hero_tekst_pozicija === 'center' ? 'center' : t.hero_tekst_pozicija === 'right' ? 'flex-end' : 'flex-start',
        }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: 'white', marginBottom: '3px' }}>{t.hero_naslov || 'Hero naslov'}</div>
          {t.hero_podnaslov && <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>{t.hero_podnaslov}</div>}
          {t.hero_dugme_tekst && (
            <div style={{ background: 'white', color: t.theme_primary_boja, fontSize: '7px', fontWeight: 700, padding: '2px 7px', borderRadius: r * 0.4 + 'px', display: 'inline-flex', alignItems: 'center' }}>
              {t.hero_dugme_tekst} →
            </div>
          )}
        </div>
      )}

      <div style={{ background: t.theme_bg_stranica, padding: '6px', display: 'flex', gap: '5px' }}>
        {!mobile && (
          <div style={{ width: '45px', background: t.theme_bg_kartica, borderRadius: kr * 0.4 + 'px', border: `1px solid ${t.theme_border_boja}`, padding: '4px', flexShrink: 0 }}>
            {['Roba', 'Usluge', 'Oprema'].map((k, i) => (
              <div key={k} style={{ padding: '2px 3px', borderRadius: r * 0.25 + 'px', fontSize: '6px', marginBottom: '2px', background: i === 0 ? t.theme_primary_boja : 'transparent', color: i === 0 ? 'white' : t.theme_sidebar_tekst_boja, fontWeight: i === 0 ? 600 : 400 }}>{k}</div>
            ))}
          </div>
        )}
        <div style={{ flex: 1, background: t.theme_bg_kartica, borderRadius: kr * 0.4 + 'px', border: `1px solid ${t.theme_border_boja}`, overflow: 'hidden', boxShadow: t.theme_kartica_shadow === 'true' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none' }}>
          {[{ n: 'Akumulator 12V 55Ah', c: '110.00' }, { n: 'Motor starter 24V', c: '245.00' }, { n: 'Relej napajanja', c: '18.50' }].map((a, i) => (
            <div key={a.n} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 6px', borderBottom: i < 2 ? `1px solid ${t.theme_border_boja}` : 'none' }}>
              <span style={{ flex: 1, fontSize: '6px', color: t.theme_tekst_boja, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.n}</span>
              <span style={{ fontSize: '7px', fontWeight: 700, color: t.theme_cijena_boja, whiteSpace: 'nowrap' }}>{a.c} {t.theme_cijena_format}</span>
              <div style={{ background: btnBg, color: btnColor, border: btnBorder, fontSize: '6px', fontWeight: 700, padding: '2px 5px', borderRadius: r * 0.3 + 'px', boxShadow: btnShadow, whiteSpace: 'nowrap' }}>+ Dodaj</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: t.theme_footer_boja, borderTop: `1px solid ${t.theme_border_boja}`, padding: '4px 10px', fontSize: '6px', color: t.theme_tekst_muted, textAlign: 'center' }}>
        {t.theme_footer_tekst}
      </div>
    </div>
  )
}

// ─── Google Fonts Loader ─────────────────────────────────────────────────────
function GoogleFontsLoader({ naslov, tijelo }: { naslov: string; tijelo: string }) {
  useEffect(() => {
    const fonts = [naslov, tijelo].filter(Boolean)
    if (!fonts.length) return
    const id = 'google-fonts-preview'
    document.getElementById(id)?.remove()
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`).join('&')}&display=swap`
    document.head.appendChild(link)
    return () => document.getElementById(id)?.remove()
  }, [naslov, tijelo])
  return null
}

// ─── Sekcije Editor ───────────────────────────────────────────────────────────
const SVE_SEKCIJE = [
  { id: 'hero', naziv: 'Hero banner', opis: 'Velika slika/boja sa naslovom' },
  { id: 'akcije', naziv: 'Akcije slider', opis: 'Artikli na popustu' },
  { id: 'katalog', naziv: 'Katalog', opis: 'Lista artikala sa filterima' },
]

function SekcijeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const aktivne = value.split(',').filter(Boolean)
  const neaktivne = SVE_SEKCIJE.filter(s => !aktivne.includes(s.id))

  function toggle(id: string) {
    if (aktivne.includes(id)) {
      onChange(aktivne.filter(a => a !== id).join(','))
    } else {
      onChange([...aktivne, id].join(','))
    }
  }

  function moveUp(i: number) {
    if (i === 0) return
    const arr = [...aktivne]
    ;[arr[i-1], arr[i]] = [arr[i], arr[i-1]]
    onChange(arr.join(','))
  }

  function moveDown(i: number) {
    if (i === aktivne.length - 1) return
    const arr = [...aktivne]
    ;[arr[i], arr[i+1]] = [arr[i+1], arr[i]]
    onChange(arr.join(','))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {aktivne.map((id, i) => {
        const s = SVE_SEKCIJE.find(x => x.id === id)
        if (!s) return null
        return (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px' }}>
            <GripVertical size={14} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{s.naziv}</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>{s.opis}</div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => moveUp(i)} style={{ padding: '3px 6px', border: '1px solid #E5E7EB', borderRadius: '5px', background: 'white', cursor: 'pointer', fontSize: '11px' }}>↑</button>
              <button onClick={() => moveDown(i)} style={{ padding: '3px 6px', border: '1px solid #E5E7EB', borderRadius: '5px', background: 'white', cursor: 'pointer', fontSize: '11px' }}>↓</button>
              <button onClick={() => toggle(id)} style={{ padding: '3px 8px', border: '1px solid #FECACA', borderRadius: '5px', background: '#FEF2F2', cursor: 'pointer', fontSize: '11px', color: '#DC2626' }}>Sakrij</button>
            </div>
          </div>
        )
      })}
      {neaktivne.length > 0 && (
        <div style={{ marginTop: '6px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Skrivene sekcije</div>
          {neaktivne.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#F9FAFB', border: '1px dashed #E5E7EB', borderRadius: '8px', marginBottom: '4px', opacity: 0.7 }}>
              <EyeOff size={13} style={{ color: '#9CA3AF' }} />
              <div style={{ flex: 1, fontSize: '13px', color: '#6B7280' }}>{s.naziv}</div>
              <button onClick={() => toggle(s.id)} style={{ padding: '3px 10px', border: '1px solid #BBF7D0', borderRadius: '5px', background: '#F0FDF4', cursor: 'pointer', fontSize: '11px', color: '#059669', fontFamily: 'inherit' }}>+ Prikaži</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ─── CSS Preset Teme ─────────────────────────────────────────────────────────
const CSS_PRESET_TEME = [
  {
    naziv: 'Axiom',
    emoji: '⬛',
    opis: 'Enterprise · Monochrome · Zero noise',
    css: `/* AXIOM — Enterprise B2B */
* { -webkit-font-smoothing: antialiased !important; text-rendering: optimizeLegibility !important; }
body { background: #f7f7f5 !important; color: #1a1a18 !important; }
header { background: #ffffff !important; border-bottom: 1px solid #e8e8e4 !important; box-shadow: none !important; }
article { background: #ffffff !important; border: 1px solid #e8e8e4 !important; border-radius: 4px !important; box-shadow: none !important; transition: border-color 0.15s ease, box-shadow 0.15s ease !important; }
article:hover { border-color: #1a1a18 !important; box-shadow: 0 0 0 1px #1a1a18 !important; transform: none !important; }
aside > div { background: #ffffff !important; border: 1px solid #e8e8e4 !important; border-radius: 4px !important; box-shadow: none !important; }
table > thead > tr { background: transparent !important; border-bottom: 2px solid #1a1a18 !important; }
table > thead > tr > th { color: #1a1a18 !important; font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.1em !important; text-transform: uppercase !important; }
table > tbody > tr:hover { background: #f7f7f5 !important; }
button[style*="var(--brand)"], .btn-primary { background: #1a1a18 !important; border: 1px solid #1a1a18 !important; border-radius: 2px !important; box-shadow: none !important; font-size: 11px !important; font-weight: 700 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; animation: none !important; }
button[style*="var(--brand)"]:hover, .btn-primary:hover { background: #333330 !important; transform: none !important; box-shadow: none !important; }
input, select, textarea { background: #ffffff !important; border: 1px solid #d0d0cc !important; border-radius: 2px !important; box-shadow: none !important; }
input:focus, select:focus { border-color: #1a1a18 !important; box-shadow: none !important; }
footer { background: #1a1a18 !important; border-top: none !important; }
footer * { color: rgba(255,255,255,0.5) !important; }
::selection { background: #1a1a18 !important; color: #ffffff !important; }
::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #d0d0cc; border-radius: 0; }`,
  },
  {
    naziv: 'Dark Neon',
    emoji: '🟢',
    opis: 'Dark glass · Neon glow · Animated',
    css: `/* DARK NEON */
@keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
@keyframes neonPulse { 0%,100% { box-shadow: 0 0 10px rgba(15,110,86,0.5),0 0 20px rgba(15,110,86,0.3); } 50% { box-shadow: 0 0 20px rgba(15,110,86,0.8),0 0 40px rgba(15,110,86,0.5); } }
@keyframes shimmer { 0% { left: -100%; } 100% { left: 200%; } }
body { background: linear-gradient(-45deg,#0a1628,#0d2137,#0a2e1f,#0d1f2d) !important; background-size: 400% 400% !important; animation: gradientShift 15s ease infinite !important; }
header { background: rgba(10,22,40,0.7) !important; backdrop-filter: blur(24px) !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; box-shadow: 0 4px 30px rgba(0,0,0,0.3) !important; }
article { background: rgba(255,255,255,0.04) !important; backdrop-filter: blur(10px) !important; border: 1px solid rgba(255,255,255,0.08) !important; color: #e2e8f0 !important; transition: all 0.4s cubic-bezier(0.175,0.885,0.32,1.275) !important; }
article:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(15,110,86,0.5) !important; transform: translateY(-6px) !important; box-shadow: 0 20px 40px rgba(0,0,0,0.4),0 0 30px rgba(15,110,86,0.1) !important; }
aside > div { background: rgba(255,255,255,0.04) !important; backdrop-filter: blur(20px) !important; border: 1px solid rgba(255,255,255,0.08) !important; }
h1,h2,h3,p,span,td,th,label,div { color: #e2e8f0; }
button[style*="var(--brand)"],.btn-primary { background: linear-gradient(135deg,#0F6E56,#059669,#0891B2) !important; box-shadow: 0 0 15px rgba(15,110,86,0.4) !important; position: relative !important; overflow: hidden !important; animation: neonPulse 3s ease-in-out infinite !important; }
button[style*="var(--brand)"]:hover,.btn-primary:hover { transform: translateY(-3px) scale(1.03) !important; box-shadow: 0 0 30px rgba(15,110,86,0.7),0 0 60px rgba(15,110,86,0.3) !important; }
input,select,textarea { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #e2e8f0 !important; }
input:focus,select:focus { background: rgba(15,110,86,0.1) !important; border-color: rgba(15,110,86,0.6) !important; }
::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#0F6E56,#0891B2); }
::selection { background: rgba(15,110,86,0.4) !important; color: #f0fdf4 !important; }`,
  },
  {
    naziv: 'Bento Mesh',
    emoji: '🎨',
    opis: 'Mesh gradient · Soft shadows · Pill buttons',
    css: `/* BENTO MESH */
body { background-color: #fafaf9 !important; background-image: radial-gradient(at 20% 20%,rgba(134,239,172,0.3) 0px,transparent 50%),radial-gradient(at 80% 10%,rgba(147,197,253,0.25) 0px,transparent 50%),radial-gradient(at 60% 80%,rgba(196,181,253,0.2) 0px,transparent 50%) !important; background-attachment: fixed !important; }
header { background: rgba(255,255,255,0.92) !important; backdrop-filter: blur(20px) saturate(180%) !important; border-bottom: 1px solid rgba(0,0,0,0.06) !important; box-shadow: 0 1px 40px rgba(0,0,0,0.06) !important; }
article { background: white !important; border: 1px solid rgba(0,0,0,0.06) !important; border-radius: 20px !important; box-shadow: 0 2px 4px rgba(0,0,0,0.04),0 12px 24px rgba(0,0,0,0.06) !important; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1) !important; }
article:hover { transform: translateY(-6px) !important; box-shadow: 0 4px 8px rgba(0,0,0,0.04),0 24px 48px rgba(0,0,0,0.1) !important; border-color: rgba(0,0,0,0.1) !important; }
aside > div { background: rgba(255,255,255,0.85) !important; backdrop-filter: blur(16px) !important; border: 1px solid rgba(0,0,0,0.06) !important; border-radius: 20px !important; box-shadow: 0 4px 24px rgba(0,0,0,0.06) !important; }
button[style*="var(--brand)"],.btn-primary { background: linear-gradient(135deg,#0F6E56,#059669) !important; border-radius: 100px !important; font-weight: 600 !important; box-shadow: 0 4px 12px rgba(15,110,86,0.35) !important; transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1) !important; animation: none !important; }
button[style*="var(--brand)"]:hover,.btn-primary:hover { transform: translateY(-2px) scale(1.04) !important; box-shadow: 0 8px 20px rgba(15,110,86,0.45) !important; }
input,select { background: #f9fafb !important; border: 1.5px solid #e5e7eb !important; border-radius: 12px !important; }
input:focus,select:focus { background: white !important; border-color: #0F6E56 !important; box-shadow: 0 0 0 4px rgba(15,110,86,0.1) !important; }
::selection { background: rgba(15,110,86,0.15) !important; color: #065f46 !important; }
::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }`,
  },
  {
    naziv: 'Glassmorphism',
    emoji: '🔮',
    opis: 'Glass cards · Blur · Frosted UI',
    css: `/* GLASSMORPHISM */
body { background: linear-gradient(135deg,#f0fff4 0%,#e0f2fe 50%,#faf5ff 100%) !important; background-attachment: fixed !important; }
header { background: rgba(255,255,255,0.7) !important; backdrop-filter: blur(20px) saturate(180%) !important; border-bottom: 1px solid rgba(255,255,255,0.5) !important; box-shadow: 0 4px 20px rgba(0,0,0,0.04) !important; }
article { background: rgba(255,255,255,0.6) !important; backdrop-filter: blur(12px) !important; border: 1px solid rgba(255,255,255,0.8) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,0.9) !important; transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1) !important; }
article:hover { transform: translateY(-8px) scale(1.01) !important; box-shadow: 0 24px 48px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.9) !important; }
aside > div { background: rgba(255,255,255,0.6) !important; backdrop-filter: blur(16px) !important; border: 1px solid rgba(255,255,255,0.8) !important; }
button[style*="var(--brand)"],.btn-primary { background: linear-gradient(135deg,var(--brand),var(--brand)cc) !important; box-shadow: 0 4px 15px rgba(15,110,86,0.4) !important; position: relative !important; overflow: hidden !important; animation: none !important; }
button[style*="var(--brand)"]:hover,.btn-primary:hover { box-shadow: 0 8px 25px rgba(15,110,86,0.6),0 0 40px rgba(15,110,86,0.2) !important; transform: translateY(-2px) !important; }
input:focus,select:focus { box-shadow: 0 0 0 3px rgba(15,110,86,0.15),0 0 20px rgba(15,110,86,0.1) !important; border-color: var(--brand) !important; }
::selection { background: rgba(15,110,86,0.2) !important; color: var(--brand) !important; }`,
  },
  {
    naziv: 'Minimal White',
    emoji: '⬜',
    opis: 'Ultra clean · Maximum whitespace · Apple-like',
    css: `/* MINIMAL WHITE */
* { -webkit-font-smoothing: antialiased !important; }
body { background: #ffffff !important; }
header { background: rgba(255,255,255,0.95) !important; backdrop-filter: blur(10px) !important; border-bottom: 1px solid #f0f0f0 !important; box-shadow: none !important; }
article { background: #ffffff !important; border: 1px solid #f0f0f0 !important; border-radius: 16px !important; box-shadow: 0 2px 20px rgba(0,0,0,0.06) !important; transition: box-shadow 0.2s ease !important; }
article:hover { box-shadow: 0 8px 40px rgba(0,0,0,0.12) !important; transform: none !important; border-color: #e0e0e0 !important; }
aside > div { background: #fafafa !important; border: none !important; border-radius: 16px !important; box-shadow: none !important; }
button[style*="var(--brand)"],.btn-primary { background: #000000 !important; border-radius: 100px !important; font-weight: 600 !important; font-size: 13px !important; letter-spacing: 0 !important; text-transform: none !important; box-shadow: none !important; animation: none !important; transition: opacity 0.15s ease !important; }
button[style*="var(--brand)"]:hover,.btn-primary:hover { background: #333333 !important; transform: none !important; box-shadow: none !important; opacity: 0.85 !important; }
input,select { border: 1px solid #e0e0e0 !important; border-radius: 10px !important; background: #fafafa !important; }
input:focus,select:focus { border-color: #000000 !important; box-shadow: 0 0 0 3px rgba(0,0,0,0.08) !important; background: white !important; }
table > thead > tr { border-bottom: 1px solid #000000 !important; }
table > thead > tr > th { font-size: 11px !important; font-weight: 600 !important; letter-spacing: 0.05em !important; color: #666666 !important; }
footer { background: #000000 !important; } footer * { color: rgba(255,255,255,0.6) !important; }
::selection { background: rgba(0,0,0,0.1) !important; }
::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }`,
  },
  {
    naziv: 'Aurora',
    emoji: '🌅',
    opis: 'Warm gradient · Soft · Premium feel',
    css: `/* AURORA */
@keyframes aurora { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
body { background: linear-gradient(-45deg,#fff7ed,#fef3c7,#f0fdf4,#eff6ff) !important; background-size: 400% 400% !important; animation: aurora 20s ease infinite !important; }
header { background: rgba(255,255,255,0.85) !important; backdrop-filter: blur(20px) !important; border-bottom: 1px solid rgba(255,255,255,0.6) !important; box-shadow: 0 2px 20px rgba(0,0,0,0.05) !important; }
article { background: rgba(255,255,255,0.75) !important; backdrop-filter: blur(8px) !important; border: 1px solid rgba(255,255,255,0.9) !important; border-radius: 16px !important; box-shadow: 0 4px 24px rgba(0,0,0,0.06) !important; transition: all 0.3s ease !important; }
article:hover { transform: translateY(-4px) !important; box-shadow: 0 12px 40px rgba(0,0,0,0.1) !important; }
aside > div { background: rgba(255,255,255,0.75) !important; backdrop-filter: blur(12px) !important; border: 1px solid rgba(255,255,255,0.9) !important; border-radius: 16px !important; }
button[style*="var(--brand)"],.btn-primary { background: linear-gradient(135deg,#d97706,#f59e0b) !important; border-radius: 12px !important; font-weight: 600 !important; box-shadow: 0 4px 14px rgba(217,119,6,0.4) !important; animation: none !important; color: white !important; }
button[style*="var(--brand)"]:hover,.btn-primary:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(217,119,6,0.5) !important; }
input:focus,select:focus { border-color: #d97706 !important; box-shadow: 0 0 0 3px rgba(217,119,6,0.15) !important; }
::selection { background: rgba(217,119,6,0.2) !important; }`,
  },
]

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'teme', label: 'Teme', icon: <Palette size={13} /> },
  { id: 'identitet', label: 'Identitet', icon: <Globe size={13} /> },
  { id: 'boje', label: 'Boje', icon: <Palette size={13} /> },
  { id: 'tipografija', label: 'Tipografija', icon: <Type size={13} /> },
  { id: 'header', label: 'Header', icon: <AlignLeft size={13} /> },
  { id: 'hero', label: 'Hero', icon: <ImageIcon size={13} /> },
  { id: 'layout', label: 'Layout', icon: <Layout size={13} /> },
  { id: 'dugmad', label: 'Dugmad', icon: <Square size={13} /> },
  { id: 'spacing', label: 'Spacing', icon: <Sliders size={13} /> },
  { id: 'shop', label: 'Shop', icon: <ShoppingBag size={13} /> },
  { id: 'fontovi', label: 'Google Fonts', icon: <Type size={13} /> },
  { id: 'gradient', label: 'Gradient', icon: <Palette size={13} /> },
  { id: 'sekcije', label: 'Sekcije', icon: <Layout size={13} /> },
  { id: 'css', label: 'Custom CSS', icon: <Square size={13} /> },
]

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminIzgledPage() {
  const [theme, setTheme] = useState<Theme>(DEFAULTS)
  const [history, setHistory] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changed, setChanged] = useState(false)
  const [tab, setTab] = useState('teme')
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    supabase.from('postavke').select('kljuc, vrijednost').in('kljuc', Object.keys(DEFAULTS))
      .then(({ data }) => {
        if (data?.length) {
          const m = { ...DEFAULTS }
          data.forEach(p => { if (p.kljuc in m) (m as any)[p.kljuc] = p.vrijednost || (DEFAULTS as any)[p.kljuc] })
          setTheme(m)
        }
        setLoading(false)
      })
  }, [])

  // Apply CSS vars in real time
  useEffect(() => {
    if (loading) return
    const r = document.documentElement
    if (theme.theme_primary_boja) {
      r.style.setProperty('--brand', theme.theme_primary_boja)
      r.style.setProperty('--brand-pale', theme.theme_primary_boja + '18')
    }
    if (theme.theme_bg_stranica) r.style.setProperty('--surface', theme.theme_bg_stranica)
    if (theme.theme_border_boja) r.style.setProperty('--border', theme.theme_border_boja)
    if (theme.theme_tekst_boja) r.style.setProperty('--text', theme.theme_tekst_boja)
    if (theme.theme_tekst_muted) r.style.setProperty('--text-muted', theme.theme_tekst_muted)
    if (theme.theme_border_radius) r.style.setProperty('--radius', theme.theme_border_radius + 'px')
    if (theme.theme_font) document.body.style.fontFamily = theme.theme_font + ', DM Sans, system-ui, sans-serif'
  }, [theme, loading])

  function set(key: keyof Theme, value: string) {
    setHistory(h => [...h.slice(-20), theme])
    setTheme(prev => ({ ...prev, [key]: value }))
    setChanged(true)
  }

  function undo() {
    if (!history.length) return
    setTheme(history[history.length - 1])
    setHistory(h => h.slice(0, -1))
    setChanged(true)
  }

  function applyPreset(preset: typeof PRESET_TEME[0]) {
    setHistory(h => [...h.slice(-20), theme])
    setTheme(prev => ({ ...prev, ...preset.boje }))
    setChanged(true)
  }

  function exportTheme() {
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'tema.json'
    a.click()
  }

  function importTheme(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        setHistory(h => [...h.slice(-20), theme])
        setTheme(prev => ({ ...prev, ...data }))
        setChanged(true)
      } catch {}
    }
    reader.readAsText(file)
  }

  function resetDefaults() {
    setHistory(h => [...h.slice(-20), theme])
    setTheme(DEFAULTS)
    setChanged(true)
  }

  async function save() {
    setSaving(true)
    await supabase.from('postavke').upsert(
      Object.entries(theme).map(([kljuc, vrijednost]) => ({ kljuc, vrijednost: vrijednost || '' })),
      { onConflict: 'kljuc' }
    )
    setSaving(false); setSaved(true); setChanged(false)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[1,2,3,4].map(i => <div key={i} style={{ height: '100px', background: '#F3F4F6', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />)}
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

      {/* LEFT */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#111827' }}>Theme Builder</h1>
            <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0' }}>Promjene se primjenjuju odmah — bez refresha</p>
          </div>
          <button onClick={undo} disabled={!history.length} title="Undo" style={{ padding: '7px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: history.length ? 'pointer' : 'not-allowed', opacity: history.length ? 1 : 0.4, display: 'flex', alignItems: 'center' }}>
            <Undo2 size={14} style={{ color: '#374151' }} />
          </button>
          <button onClick={exportTheme} title="Export JSON" style={{ padding: '7px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Download size={14} style={{ color: '#374151' }} />
          </button>
          <label title="Import JSON" style={{ padding: '7px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Upload size={14} style={{ color: '#374151' }} />
            <input type="file" accept=".json" onChange={importTheme} style={{ display: 'none' }} />
          </label>
          <button onClick={resetDefaults} style={{ padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '12px', color: '#6B7280', fontFamily: 'inherit' }}>
            Reset
          </button>
          <button onClick={save} disabled={saving || !changed} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px',
            cursor: (saving || !changed) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            background: saved ? '#059669' : changed ? '#0F6E56' : '#E5E7EB',
            color: (saved || changed) ? 'white' : '#9CA3AF',
            boxShadow: changed ? '0 2px 8px rgba(15,110,86,0.3)' : 'none',
          }}>
            <Save size={13} />{saving ? 'Čuvam...' : saved ? '✓ Sačuvano' : 'Sačuvaj'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '3px', background: '#F3F4F6', padding: '3px', borderRadius: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px',
              fontSize: '11px', fontWeight: tab === t.id ? 700 : 400, fontFamily: 'inherit',
              border: 'none', borderRadius: '7px', cursor: 'pointer', transition: 'all 0.1s',
              background: tab === t.id ? 'white' : 'transparent',
              color: tab === t.id ? '#0F6E56' : '#6B7280',
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'teme' && (
          <>
            <Section title="Preset teme — klikni za primjenu">
              <Grid3>
                {PRESET_TEME.map(p => (
                  <button key={p.naziv} onClick={() => applyPreset(p)} style={{
                    padding: '12px', border: '1px solid #E5E7EB', borderRadius: '10px', cursor: 'pointer',
                    background: 'white', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#0F6E56'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(15,110,86,0.15)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    {/* Mini preview */}
                    <div style={{ borderRadius: '6px', overflow: 'hidden', marginBottom: '8px', border: '1px solid #E5E7EB' }}>
                      <div style={{ height: '20px', background: p.boje.theme_header_boja, borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', padding: '0 6px', gap: '4px' }}>
                        <div style={{ width: '30px', height: '8px', borderRadius: '3px', background: p.boje.theme_primary_boja }} />
                        <div style={{ marginLeft: 'auto', width: '20px', height: '8px', borderRadius: '3px', background: p.boje.theme_primary_boja }} />
                      </div>
                      <div style={{ height: '12px', background: p.boje.baner_boja_pozadine }} />
                      <div style={{ height: '30px', background: p.boje.theme_bg_stranica, display: 'flex', gap: '3px', padding: '4px' }}>
                        <div style={{ width: '20px', background: p.boje.theme_bg_kartica, borderRadius: '3px', border: '1px solid #E5E7EB' }} />
                        <div style={{ flex: 1, background: p.boje.theme_bg_kartica, borderRadius: '3px', border: '1px solid #E5E7EB', padding: '3px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {[1,2,3].map(i => <div key={i} style={{ height: '4px', background: p.boje.theme_border_boja, borderRadius: '2px' }} />)}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{p.emoji} {p.naziv}</div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                      {Object.values(p.boje).slice(0, 5).map((c, i) => (
                        <div key={i} style={{ width: '16px', height: '16px', borderRadius: '4px', background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                      ))}
                    </div>
                  </button>
                ))}
              </Grid3>
            </Section>
          </>
        )}

        {tab === 'identitet' && (
          <>
            <Section title="Firma i kontakt">
              <Grid2>
                <TInput label="Naziv webshopa" value={theme.shop_naziv} onChange={v => set('shop_naziv', v)} placeholder="Firma d.o.o." />
                <TInput label="URL loga" value={theme.theme_logo_url} onChange={v => set('theme_logo_url', v)} placeholder="https://..." />
                <TInput label="Email" value={theme.shop_email} onChange={v => set('shop_email', v)} placeholder="info@firma.ba" />
                <TInput label="Telefon" value={theme.shop_telefon} onChange={v => set('shop_telefon', v)} placeholder="+387 33 000 000" />
                <TInput label="Adresa" value={theme.shop_adresa} onChange={v => set('shop_adresa', v)} placeholder="Ulica bb, Sarajevo" />
                <TInput label="Footer tekst" value={theme.theme_footer_tekst} onChange={v => set('theme_footer_tekst', v)} />
              </Grid2>
            </Section>
            <Section title="Društvene mreže">
              <Grid2>
                <TInput label="Facebook URL" value={theme.footer_social_facebook} onChange={v => set('footer_social_facebook', v)} placeholder="https://facebook.com/..." />
                <TInput label="Instagram URL" value={theme.footer_social_instagram} onChange={v => set('footer_social_instagram', v)} placeholder="https://instagram.com/..." />
                <TInput label="LinkedIn URL" value={theme.footer_social_linkedin} onChange={v => set('footer_social_linkedin', v)} placeholder="https://linkedin.com/..." />
              </Grid2>
            </Section>
            <Section title="SEO">
              <TInput label="Meta naslov" value={theme.seo_naslov} onChange={v => set('seo_naslov', v)} placeholder="Firma d.o.o. — B2B Webshop" />
              <TInput label="Meta opis" value={theme.seo_opis} onChange={v => set('seo_opis', v)} placeholder="Profesionalna roba za vaše poslovanje..." />
              <TInput label="OG slika URL" value={theme.seo_og_slika} onChange={v => set('seo_og_slika', v)} placeholder="https://..." />
            </Section>
          </>
        )}

        {tab === 'boje' && (
          <>
            <Section title="Primarne boje">
              <Grid2>
                <BojaInput label="Primarna boja" value={theme.theme_primary_boja} onChange={v => set('theme_primary_boja', v)} />
                <BojaInput label="Boja akcija/sniženja" value={theme.theme_akcija_boja} onChange={v => set('theme_akcija_boja', v)} />
              </Grid2>
            </Section>
            <Section title="Pozadine">
              <Grid2>
                <BojaInput label="Pozadina stranice" value={theme.theme_bg_stranica} onChange={v => set('theme_bg_stranica', v)} svjetle />
                <BojaInput label="Pozadina kartica" value={theme.theme_bg_kartica} onChange={v => set('theme_bg_kartica', v)} svjetle />
                <BojaInput label="Boja bordera/linija" value={theme.theme_border_boja} onChange={v => set('theme_border_boja', v)} svjetle />
              </Grid2>
            </Section>
            <Section title="Tekst">
              <Grid2>
                <BojaInput label="Primarni tekst" value={theme.theme_tekst_boja} onChange={v => set('theme_tekst_boja', v)} />
                <BojaInput label="Sekundarni tekst" value={theme.theme_tekst_muted} onChange={v => set('theme_tekst_muted', v)} />
                <BojaInput label="Boja cijene" value={theme.theme_cijena_boja} onChange={v => set('theme_cijena_boja', v)} />
              </Grid2>
            </Section>
          </>
        )}

        {tab === 'tipografija' && (
          <>
            <Section title="Font">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {FONTS.map(f => (
                  <button key={f} onClick={() => set('theme_font', f)} style={{
                    padding: '8px 12px', border: theme.theme_font === f ? '2px solid #0F6E56' : '1px solid #E5E7EB',
                    borderRadius: '8px', cursor: 'pointer', fontFamily: f + ', sans-serif', fontSize: '13px',
                    background: theme.theme_font === f ? '#F0FDF4' : 'white',
                    color: theme.theme_font === f ? '#0F6E56' : '#374151',
                    fontWeight: theme.theme_font === f ? 600 : 400, transition: 'all 0.15s',
                  }}>{f}</button>
                ))}
              </div>
            </Section>
            <Section title="Veličine">
              <Grid2>
                <Slider label="Naslovi" value={theme.theme_font_naslov_size} onChange={v => set('theme_font_naslov_size', v)} min={16} max={40} />
                <Slider label="Tijelo" value={theme.theme_font_body_size} onChange={v => set('theme_font_body_size', v)} min={11} max={18} />
                <Slider label="Cijena" value={theme.theme_font_cijena_size} onChange={v => set('theme_font_cijena_size', v)} min={12} max={28} />
                <Slider label="Sidebar tekst" value={theme.theme_sidebar_font_size} onChange={v => set('theme_sidebar_font_size', v)} min={10} max={16} />
              </Grid2>
              <Select label="Format cijene" value={theme.theme_cijena_format} onChange={v => set('theme_cijena_format', v)}
                options={[{ v: 'KM', l: '119.00 KM' }, { v: 'BAM', l: '119.00 BAM' }, { v: '€', l: '119.00 €' }]} />
            </Section>
          </>
        )}

        {tab === 'header' && (
          <>
            <Section title="Header">
              <Grid2>
                <BojaInput label="Pozadina" value={theme.theme_header_boja} onChange={v => set('theme_header_boja', v)} svjetle />
                <BojaInput label="Boja teksta" value={theme.theme_header_tekst_boja} onChange={v => set('theme_header_tekst_boja', v)} />
              </Grid2>
              <Slider label="Visina headera" value={theme.theme_header_visina} onChange={v => set('theme_header_visina', v)} min={44} max={100} />
              <Grid2>
                <Select label="Pozicija loga" value={theme.theme_header_logo_pozicija} onChange={v => set('theme_header_logo_pozicija', v)}
                  options={[{ v: 'left', l: 'Lijevo' }, { v: 'center', l: 'Centar' }]} />
                <Slider label="Širina searcha" value={theme.theme_header_search_sirina || '520'} onChange={v => set('theme_header_search_sirina' as any, v)} min={200} max={700} />
              </Grid2>
              <Toggle label="Shadow ispod headera" value={theme.theme_header_shadow} onChange={v => set('theme_header_shadow', v)} />
            </Section>
            <Section title="Announcement bar">
              <TInput label="Tekst" value={theme.announcement_bar} onChange={v => set('announcement_bar', v)} placeholder="Narudžbe do 14h — isporuka narednog radnog dana" />
              <Grid2>
                <BojaInput label="Pozadina" value={theme.baner_boja_pozadine} onChange={v => set('baner_boja_pozadine', v)} />
                <BojaInput label="Boja teksta" value={theme.baner_boja_teksta} onChange={v => set('baner_boja_teksta', v)} svjetle />
              </Grid2>
            </Section>
            <Section title="Footer">
              <Grid2>
                <BojaInput label="Pozadina footera" value={theme.theme_footer_boja} onChange={v => set('theme_footer_boja', v)} svjetle />
              </Grid2>
            </Section>
          </>
        )}

        {tab === 'hero' && (
          <>
            <Section title="Hero banner">
              <Toggle label="Hero banner aktivan" value={theme.hero_aktivan} onChange={v => set('hero_aktivan', v)} />
              <TInput label="Naslov" value={theme.hero_naslov} onChange={v => set('hero_naslov', v)} placeholder="Dobrodošli u naš webshop" />
              <TInput label="Podnaslov" value={theme.hero_podnaslov} onChange={v => set('hero_podnaslov', v)} placeholder="Profesionalna roba za vaše poslovanje" />
              <TInput label="Tekst dugmeta" value={theme.hero_dugme_tekst} onChange={v => set('hero_dugme_tekst', v)} placeholder="Pregledaj katalog" />
              <TInput label="URL pozadinske slike" value={theme.hero_slika_url} onChange={v => set('hero_slika_url', v)} placeholder="https://..." />
              <Grid2>
                <Slider label="Visina banera" value={theme.hero_visina} onChange={v => set('hero_visina', v)} min={150} max={600} />
                <Select label="Pozicija teksta" value={theme.hero_tekst_pozicija} onChange={v => set('hero_tekst_pozicija', v)}
                  options={[{ v: 'left', l: 'Lijevo' }, { v: 'center', l: 'Centar' }, { v: 'right', l: 'Desno' }]} />
              </Grid2>
              <Grid2>
                <BojaInput label="Boja pozadine (bez slike)" value={theme.hero_boja_pozadine} onChange={v => set('hero_boja_pozadine', v)} />
                <BojaInput label="Overlay boja (sa slikom)" value={theme.hero_overlay_boja} onChange={v => set('hero_overlay_boja', v)} />
              </Grid2>
              <Slider label="Overlay transparentnost" value={theme.hero_overlay_opacity} onChange={v => set('hero_overlay_opacity', v)} min={0} max={1} unit="" />
            </Section>
          </>
        )}

        {tab === 'layout' && (
          <>
            <Section title="Kartice artikala">
              <Grid2>
                <Slider label="Zaobljenost kartica" value={theme.theme_kartica_radius} onChange={v => set('theme_kartica_radius', v)} min={0} max={24} />
                <Slider label="Visina slike (%)" value={theme.theme_kartica_slika_visina} onChange={v => set('theme_kartica_slika_visina', v)} min={40} max={100} unit="%" />
              </Grid2>
              <Toggle label="Shadow na karticama" value={theme.theme_kartica_shadow} onChange={v => set('theme_kartica_shadow', v)} desc="Blagi drop shadow ispod kartica" />
              <Select label="Pozicija cijene na kartici" value={theme.theme_kartica_prikaz_cijene} onChange={v => set('theme_kartica_prikaz_cijene', v)}
                options={[{ v: 'bottom', l: 'Na dnu' }, { v: 'top', l: 'Na vrhu' }, { v: 'right', l: 'Desno' }]} />
            </Section>
            <Section title="Sidebar kategorija">
              <Grid2>
                <BojaInput label="Boja teksta" value={theme.theme_sidebar_tekst_boja} onChange={v => set('theme_sidebar_tekst_boja', v)} />
                <Slider label="Razmak između redova" value={theme.theme_sidebar_spacing} onChange={v => set('theme_sidebar_spacing', v)} min={2} max={20} />
              </Grid2>
            </Section>
          </>
        )}

        {tab === 'dugmad' && (
          <>
            <Section title="Stil dugmadi">
              <Grid3>
                {[
                  { v: 'solid', l: 'Solid', desc: 'Jednobojno' },
                  { v: 'gradient', l: 'Gradient', desc: 'Gradijent' },
                  { v: 'outline', l: 'Outline', desc: 'Obrub' },
                ].map(o => (
                  <button key={o.v} onClick={() => set('theme_dugme_stil', o.v)} style={{
                    padding: '10px 8px', border: theme.theme_dugme_stil === o.v ? '2px solid #0F6E56' : '1px solid #E5E7EB',
                    borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                    background: theme.theme_dugme_stil === o.v ? '#F0FDF4' : 'white', transition: 'all 0.15s',
                  }}>
                    <div style={{
                      margin: '0 auto 6px', width: '60px', height: '22px', borderRadius: parseInt(theme.theme_border_radius) * 0.6 + 'px',
                      background: o.v === 'outline' ? 'transparent' : o.v === 'gradient' ? `linear-gradient(135deg, ${theme.theme_primary_boja}, ${theme.theme_primary_boja}cc)` : theme.theme_primary_boja,
                      border: o.v === 'outline' ? `2px solid ${theme.theme_primary_boja}` : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '8px', fontWeight: 700, color: o.v === 'outline' ? theme.theme_primary_boja : 'white',
                    }}>Dodaj</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: theme.theme_dugme_stil === o.v ? '#0F6E56' : '#374151' }}>{o.l}</div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{o.desc}</div>
                  </button>
                ))}
              </Grid3>
              <Grid2>
                <Slider label="Visina dugmadi" value={theme.theme_dugme_visina} onChange={v => set('theme_dugme_visina', v)} min={28} max={56} />
                <Slider label="Zaobljenost" value={theme.theme_border_radius} onChange={v => set('theme_border_radius', v)} min={0} max={28} />
              </Grid2>
              <Toggle label="Shadow/glow na dugmadima" value={theme.theme_dugme_shadow} onChange={v => set('theme_dugme_shadow', v)} desc="Glow efekat u boji primarne boje" />
            </Section>
            <Section title="Input polja">
              <Select label="Stil inputa" value={theme.theme_input_stil} onChange={v => set('theme_input_stil', v)}
                options={[{ v: 'border', l: 'Sa borderom' }, { v: 'filled', l: 'Filled' }, { v: 'underline', l: 'Underline' }]} />
              <Select label="Stil badgeva (stanje, kategorija)" value={theme.theme_badge_stil} onChange={v => set('theme_badge_stil', v)}
                options={[{ v: 'pill', l: 'Pill (zaobljeno)' }, { v: 'square', l: 'Square (uglato)' }, { v: 'rounded', l: 'Rounded' }]} />
            </Section>
          </>
        )}

        {tab === 'spacing' && (
          <>
            <Section title="Gustoća i animacije">
              <Grid3>
                {[{ v: 'compact', l: 'Kompaktno', e: '▤', d: 'Više artikala' }, { v: 'normal', l: 'Normalno', e: '▦', d: 'Balansiran' }, { v: 'spacious', l: 'Prostrano', e: '▧', d: 'Veći razmaci' }].map(o => (
                  <button key={o.v} onClick={() => set('theme_spacing', o.v)} style={{
                    padding: '12px', border: theme.theme_spacing === o.v ? '2px solid #0F6E56' : '1px solid #E5E7EB',
                    borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                    background: theme.theme_spacing === o.v ? '#F0FDF4' : 'white', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{o.e}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: theme.theme_spacing === o.v ? '#0F6E56' : '#374151' }}>{o.l}</div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{o.d}</div>
                  </button>
                ))}
              </Grid3>
              <Grid2>
                <Slider label="Brzina animacija" value={theme.theme_animacije_speed} onChange={v => set('theme_animacije_speed', v)} min={0} max={500} unit="ms" />
                <Select label="Hover efekt" value={theme.theme_hover_speed} onChange={v => set('theme_hover_speed', v)}
                  options={[{ v: 'none', l: 'Bez efekta' }, { v: 'slow', l: 'Sporo' }, { v: 'normal', l: 'Normalno' }, { v: 'fast', l: 'Brzo' }]} />
              </Grid2>
            </Section>
          </>
        )}

        {tab === 'shop' && (
          <>
            <Section title="Katalog">
              <Grid2>
                <Select label="Artikala po stranici" value={theme.per_page} onChange={v => set('per_page', v)}
                  options={[{ v: '12', l: '12' }, { v: '24', l: '24' }, { v: '36', l: '36' }, { v: '48', l: '48' }, { v: '60', l: '60' }]} />
                <Select label="Default prikaz" value={theme.default_view} onChange={v => set('default_view', v)}
                  options={[{ v: 'table', l: 'Tabelarni' }, { v: 'grid', l: 'Grid' }]} />
                <Select label="Default sortiranje" value={theme.default_sort} onChange={v => set('default_sort', v)}
                  options={[{ v: 'naziv', l: 'Naziv A-Z' }, { v: 'naziv_desc', l: 'Naziv Z-A' }, { v: 'cijena_asc', l: 'Cijena ↑' }, { v: 'cijena_desc', l: 'Cijena ↓' }]} />
              </Grid2>
              <Toggle label="Prikazivati artikle bez stanja" value={theme.prikazi_bez_stanja} onChange={v => set('prikazi_bez_stanja', v)} desc="Artikli sa 0 na stanju se prikazuju ali isijveni" />
            </Section>
            <Section title="Korpa i narudžbe">
              <TInput label="Načini plaćanja (odvojeni zarezom)" value={theme.nacini_placanja} onChange={v => set('nacini_placanja', v)} placeholder="Virman,Gotovina,Kartica" />
              <TInput label="Minimalni iznos narudžbe (KM)" value={theme.min_narudzba} onChange={v => set('min_narudzba', v)} placeholder="0" type="number" />
              <Toggle label="Polje za napomenu u korpi" value={theme.korpa_napomena} onChange={v => set('korpa_napomena', v)} />
              <Toggle label="Prikazati PDV raščlanjivanje" value={theme.korpa_pdv_prikaz} onChange={v => set('korpa_pdv_prikaz', v)} />
            </Section>
            <Section title="Registracija">
              <Toggle label="Registracija otvorena" value={theme.registracija_otvorena} onChange={v => set('registracija_otvorena', v)} desc="Novi korisnici mogu podnijeti zahtjev" />
              <TInput label="Poruka nakon registracije" value={theme.registracija_poruka} onChange={v => set('registracija_poruka', v)} placeholder="Vaš zahtjev je primljen..." />
            </Section>
            <Section title="Email notifikacije">
              <Toggle label="Email potvrde narudžbe kupcu" value={theme.email_potvrda_narudzba} onChange={v => set('email_potvrda_narudzba', v)} />
              <Toggle label="Email adminu za novu narudžbu" value={theme.email_admin_narudzba} onChange={v => set('email_admin_narudzba', v)} />
              <Toggle label="Email adminu za novu registraciju" value={theme.email_admin_registracija} onChange={v => set('email_admin_registracija', v)} />
            </Section>
          </>
        )}

        {tab === 'fontovi' && (
          <>
            <Section title="Google Fonts — Naslov">
              <TInput label="Naziv Google fonta za naslove (npr. Playfair Display)" value={theme.theme_google_font_naslov} onChange={v => set('theme_google_font_naslov', v)} placeholder="Playfair Display" />
              <div style={{ fontSize: '12px', color: '#6B7280', padding: '8px 10px', background: '#F9FAFB', borderRadius: '8px' }}>
                Pretraži fontove na <a href="https://fonts.google.com" target="_blank" style={{ color: '#0F6E56' }}>fonts.google.com</a> i upiši tačan naziv. Npr: Playfair Display, Merriweather, Oswald, Bebas Neue
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Playfair Display', 'Merriweather', 'Oswald', 'Bebas Neue', 'Cormorant', 'Abril Fatface', 'Cinzel', 'Libre Baskerville'].map(f => (
                  <button key={f} onClick={() => set('theme_google_font_naslov', f)} style={{
                    padding: '5px 10px', border: theme.theme_google_font_naslov === f ? '2px solid #0F6E56' : '1px solid #E5E7EB',
                    borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
                    background: theme.theme_google_font_naslov === f ? '#F0FDF4' : 'white',
                    color: theme.theme_google_font_naslov === f ? '#0F6E56' : '#374151',
                  }}>{f}</button>
                ))}
              </div>
            </Section>
            <Section title="Google Fonts — Tijelo teksta">
              <TInput label="Naziv Google fonta za tijelo (npr. Source Serif 4)" value={theme.theme_google_font_tijelo} onChange={v => set('theme_google_font_tijelo', v)} placeholder="Source Serif 4" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Inter', 'Plus Jakarta Sans', 'DM Sans', 'Outfit', 'Syne', 'Space Grotesk', 'Urbanist', 'Figtree'].map(f => (
                  <button key={f} onClick={() => set('theme_google_font_tijelo', f)} style={{
                    padding: '5px 10px', border: theme.theme_google_font_tijelo === f ? '2px solid #0F6E56' : '1px solid #E5E7EB',
                    borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
                    background: theme.theme_google_font_tijelo === f ? '#F0FDF4' : 'white',
                    color: theme.theme_google_font_tijelo === f ? '#0F6E56' : '#374151',
                  }}>{f}</button>
                ))}
              </div>
            </Section>
            <GoogleFontsLoader naslov={theme.theme_google_font_naslov} tijelo={theme.theme_google_font_tijelo} />
          </>
        )}

        {tab === 'gradient' && (
          <>
            <Section title="Gradient primarne boje">
              <Toggle label="Koristiti gradient umjesto solid boje" value={theme.theme_gradient_primary} onChange={v => set('theme_gradient_primary', v)} desc="Primjenjuje se na dugmad, sidebar aktivnu kategoriju i ostale primarne elemente" />
              {theme.theme_gradient_primary === 'true' && (
                <>
                  <Grid2>
                    <BojaInput label="Boja 1 (primarna)" value={theme.theme_primary_boja} onChange={v => set('theme_primary_boja', v)} />
                    <BojaInput label="Boja 2" value={theme.theme_gradient_boja2} onChange={v => set('theme_gradient_boja2', v)} />
                  </Grid2>
                  <Slider label="Ugao gradienta" value={theme.theme_gradient_ugao} onChange={v => set('theme_gradient_ugao', v)} min={0} max={360} unit="°" />
                  <div style={{ padding: '20px', borderRadius: '10px', background: `linear-gradient(${theme.theme_gradient_ugao}deg, ${theme.theme_primary_boja}, ${theme.theme_gradient_boja2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <span style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>Preview gradienta</span>
                    <div style={{ background: 'white', color: theme.theme_primary_boja, fontSize: '13px', fontWeight: 700, padding: '8px 16px', borderRadius: parseInt(theme.theme_border_radius) + 'px' }}>Dugme</div>
                  </div>
                </>
              )}
            </Section>
          </>
        )}

        {tab === 'sekcije' && (
          <>
            <Section title="Redosljed sekcija na glavnoj stranici">
              <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Odaberi koje sekcije se prikazuju i kojim redoslijedom:</p>
              <SekcijeEditor value={theme.theme_sekcije_redosljed} onChange={v => set('theme_sekcije_redosljed', v)} />
            </Section>
            <Section title="Objavi / Radna verzija">
              <div style={{ display: 'flex', gap: '10px' }}>
                {[{ v: 'published', l: '✅ Objavljeno', d: 'Korisnici vide trenutnu temu' }, { v: 'draft', l: '📝 Radna verzija', d: 'Temu vide samo admini' }].map(o => (
                  <button key={o.v} onClick={() => set('theme_publish_status', o.v)} style={{
                    flex: 1, padding: '12px', border: theme.theme_publish_status === o.v ? '2px solid #0F6E56' : '1px solid #E5E7EB',
                    borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    background: theme.theme_publish_status === o.v ? '#F0FDF4' : 'white',
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{o.l}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{o.d}</div>
                  </button>
                ))}
              </div>
            </Section>
          </>
        )}

        {tab === 'css' && (
          <>
            <Section title="Gotove CSS teme — klikni za primjenu">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {CSS_PRESET_TEME.map(p => (
                  <button key={p.naziv} onClick={() => set('theme_custom_css', p.css)}
                    style={{
                      padding: '12px', border: theme.theme_custom_css === p.css ? '2px solid #0F6E56' : '1px solid #E5E7EB',
                      borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      background: theme.theme_custom_css === p.css ? '#F0FDF4' : 'white',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (theme.theme_custom_css !== p.css) { (e.currentTarget as HTMLElement).style.borderColor = '#0F6E56'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(15,110,86,0.1)' } }}
                    onMouseLeave={e => { if (theme.theme_custom_css !== p.css) { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' } }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '6px' }}>{p.emoji}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '3px' }}>{p.naziv}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.4 }}>{p.opis}</div>
                    {theme.theme_custom_css === p.css && (
                      <div style={{ marginTop: '6px', fontSize: '10px', fontWeight: 700, color: '#0F6E56', textTransform: 'uppercase', letterSpacing: '0.05em' }}>✓ Aktivno</div>
                    )}
                  </button>
                ))}
                <button onClick={() => set('theme_custom_css', '')}
                  style={{ padding: '12px', border: !theme.theme_custom_css ? '2px solid #E5E7EB' : '1px solid #E5E7EB', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', background: !theme.theme_custom_css ? '#F9FAFB' : 'white' }}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>🔄</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '3px' }}>Standardno</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>Ukloni custom CSS</div>
                </button>
              </div>
            </Section>
            <Section title="Custom CSS — napiši vlastiti">
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                Napredno: upiši vlastiti CSS koji se dodaje na kraj stylesheets. Koristi CSS varijable kao <code style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: '3px' }}>var(--brand)</code>, <code style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: '3px' }}>var(--surface)</code> itd.
              </p>
              <textarea
                value={theme.theme_custom_css}
                onChange={e => set('theme_custom_css', e.target.value)}
                placeholder={`/* Primjer */
.btn-primary {
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.card {
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-4px);
}`}
                spellCheck={false}
                rows={16}
                style={{
                  width: '100%', fontFamily: 'DM Mono, Courier New, monospace', fontSize: '13px',
                  border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px',
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  background: '#0F172A', color: '#E2E8F0', lineHeight: 1.6,
                }}
                onFocus={e => e.target.style.borderColor = '#0F6E56'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
              <div style={{ fontSize: '11px', color: '#6B7280' }}>
                CSS varijable: <code>--brand</code>, <code>--surface</code>, <code>--border</code>, <code>--text</code>, <code>--text-muted</code>, <code>--radius</code>
              </div>
            </Section>
          </>
        )}

      </div>

      {/* RIGHT: Preview */}
      <div style={{ width: mobile ? '210px' : '310px', flexShrink: 0, position: 'sticky', top: '76px', transition: 'width 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Monitor size={10} /> Live preview
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setMobile(false)} style={{ padding: '4px 8px', border: !mobile ? '2px solid #0F6E56' : '1px solid #E5E7EB', borderRadius: '6px', background: !mobile ? '#F0FDF4' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Monitor size={12} style={{ color: !mobile ? '#0F6E56' : '#6B7280' }} />
            </button>
            <button onClick={() => setMobile(true)} style={{ padding: '4px 8px', border: mobile ? '2px solid #0F6E56' : '1px solid #E5E7EB', borderRadius: '6px', background: mobile ? '#F0FDF4' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Smartphone size={12} style={{ color: mobile ? '#0F6E56' : '#6B7280' }} />
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LivePreview t={theme} mobile={mobile} />
        </div>
        <div style={{ marginTop: '8px', padding: '8px 10px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', fontSize: '10px', color: '#065F46', lineHeight: 1.5 }}>
          ✓ Promjene se primjenjuju odmah<br />
          ✓ Undo — vrati prethodnu izmjenu<br />
          ✓ Export/Import JSON tema<br />
          Klikni <strong>Sačuvaj</strong> da se sačuva
        </div>
      </div>
    </div>
  )
}

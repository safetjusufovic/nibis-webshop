'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Save, Undo2, Download, Upload, Eye, EyeOff, RefreshCw,
  ChevronRight, ChevronDown, X, Image as ImgIcon,
  Type, Layout, Palette, Settings, ShoppingBag, Globe, Monitor,
} from 'lucide-react'

// ─── Tipovi ────────────────────────────────────────────────────────────────────
interface Postavke { [key: string]: string }

const DEFAULTS: Postavke = {
  shop_naziv: '', shop_email: '', shop_telefon: '', shop_adresa: '', shop_grad: '',
  shop_pib: '', shop_pdv_broj: '', shop_web: '',
  theme_logo_url: '', theme_favicon_url: '',
  seo_naslov: '', seo_opis: '', seo_og_slika: '',
  footer_social_facebook: '', footer_social_instagram: '', footer_social_linkedin: '',
  footer_social_twitter: '', footer_social_youtube: '', footer_social_tiktok: '',
  footer_social_whatsapp: '', footer_social_viber: '',
  theme_primary_boja: '#0F6E56', theme_bg_stranica: '#F8FAFA',
  theme_bg_kartica: '#ffffff', theme_border_boja: '#E8EDEB',
  theme_tekst_boja: '#0D1F1A', theme_tekst_muted: '#6B8279',
  theme_cijena_boja: '#0F6E56', theme_akcija_boja: '#DC2626',
  theme_font: 'DM Sans', theme_google_font_naslov: '', theme_google_font_tijelo: '',
  theme_font_body_size: '14', theme_font_naslov_size: '22',
  header_logo_visina: '34',
  header_layout: 'minimal', header_boja: '#ffffff', header_tekst_boja: '#111827',
  header_visina_nova: '64', header_shadow_nova: 'true', header_sticky: 'true',
  header_blur: 'true', header_search_stil: 'inline',
  header_search_sirina: '520', header_search_placeholder: 'Pretraži artikle...',
  header_korpa_stil: 'button', header_korpa_boja: '', header_border_bottom: 'true',
  topbar_aktivan: 'false', topbar_boja: '#1F2937', topbar_tekst_boja: '#9CA3AF',
  topbar_telefon: '', topbar_email: '', topbar_radno_vrijeme: '',
  topbar_adresa: '', topbar_jezik_switcher: 'true', topbar_custom_tekst: '',
  announcement_bar: '', baner_boja_pozadine: '#085041', baner_boja_teksta: '#ffffff',
  navkat_aktivan: 'true', navkat_featured: '[]', navkat_boja: '#1e3a5f', navkat_tekst_boja: '#ffffff',
  navkat_visina: '44', navkat_stil: 'flat', navkat_akcijski_dugme: 'false',
  navkat_akcijski_tekst: 'Akcijski proizvodi', navkat_akcijski_boja: '#DC2626',
  hero_slides: '[]',
  hero_aktivan: 'true', hero_naslov: 'Dobrodošli u naš webshop',
  hero_podnaslov: 'Profesionalna roba za vaše poslovanje',
  hero_dugme_tekst: 'Pregledaj katalog', hero_dugme_url: '/',
  hero_slika_url: '', hero_overlay_opacity: '0.4',
  hero_tekst_pozicija: 'center', hero_visina: '400',
  hero_boja_pozadine: '#0F6E56', hero_tekst_boja: '#ffffff',
  hero_font_naslov: '42', hero_font_podnaslov: '18',
  sidebar_sirina: '240', sidebar_boja_pozadine: '#F8FAFA',
  sidebar_visina_kategorije: '52', sidebar_pozicija: 'lijevo',
  per_page: '24', default_view: 'table', default_sort: 'naziv',
  artikal_prikaz_dvije_cijene: 'false', artikal_velep_label: 'Veleprodajna cijena',
  artikal_malop_label: 'Maloprodajna cijena', artikal_prikaz_pdv: 'false',
  artikal_prikaz_sifra: 'true', artikal_prikaz_kategorija: 'true',
  artikal_dugme_tekst: 'Dodaj', artikal_badge_stanje: 'pill',
  theme_border_radius: '10', theme_dugme_stil: 'gradient',
  theme_kartica_radius: '14', theme_kartica_shadow: 'true',
  nacini_placanja: 'Virman,Gotovina', korpa_napomena: 'true',
  korpa_pdv_prikaz: 'true', min_narudzba: '0',
  theme_footer_boja: '#ffffff', theme_footer_tekst: 'B2B webshop',
  theme_footer_logo_url: '', theme_footer_bg_slika: '',
  footer_kolone_aktivan: 'false',
  footer_kolona1_naslov: 'Kontakt', footer_kolona1_sadrzaj: '',
  footer_kolona2_naslov: 'Linkovi', footer_kolona2_sadrzaj: '',
  footer_kolona3_naslov: 'Radno vrijeme', footer_kolona3_sadrzaj: '',
  registracija_otvorena: 'true', registracija_poruka: '',
  email_potvrda_narudzba: 'true', email_admin_narudzba: 'true',
  email_admin_registracija: 'true',
  shop_watermark: 'true', shop_maintenance: 'false',
  kartica_prikaz_slika: 'true', kartica_prikaz_sifra: 'true',
  kartica_prikaz_stanje: 'true', kartica_prikaz_kategorija: 'false',
  theme_custom_css: '',
  sekcija_features_naslov: 'Zašto mi?',
  sekcija_banner_tekst: '', sekcija_banner_podnaslov: '', sekcija_banner_dugme: '', sekcija_banner_boja: '#0F6E56',
  sekcija_newsletter_naslov: '', sekcija_newsletter_podnaslov: '',
  page_sekcije: JSON.stringify([
    { id: 'hero', naziv: 'Hero Banner', aktivan: true },
    { id: 'akcije', naziv: 'Akcije Slider', aktivan: true },
    { id: 'features', naziv: 'Prednosti (3 ikone)', aktivan: false },
    { id: 'banner', naziv: 'Promo Banner', aktivan: false },
    { id: 'newsletter', naziv: 'Newsletter', aktivan: false },
    { id: 'katalog', naziv: 'Katalog artikala', aktivan: true },
  ]),
}

const PRESET_TEME = [
  { naziv: 'Emerald', emoji: '🟢', primary: '#0F6E56', bg: '#F8FAFA', kartica: '#ffffff', border: '#E8EDEB', tekst: '#0D1F1A', muted: '#6B8279', header: '#ffffff', hero: '#0F6E56' },
  { naziv: 'Ocean', emoji: '🔵', primary: '#0369A1', bg: '#F0F9FF', kartica: '#ffffff', border: '#BAE6FD', tekst: '#0C4A6E', muted: '#4B88A2', header: '#ffffff', hero: '#0369A1' },
  { naziv: 'Midnight', emoji: '⚫', primary: '#6366F1', bg: '#0F172A', kartica: '#1E293B', border: '#334155', tekst: '#F1F5F9', muted: '#94A3B8', header: '#1E293B', hero: '#312E81' },
  { naziv: 'Violet', emoji: '🟣', primary: '#7C3AED', bg: '#FAF5FF', kartica: '#ffffff', border: '#E9D5FF', tekst: '#2E1065', muted: '#7C3AED', header: '#ffffff', hero: '#7C3AED' },
  { naziv: 'Corporate', emoji: '🔷', primary: '#1e3a5f', bg: '#F8FAFC', kartica: '#ffffff', border: '#E2E8F0', tekst: '#0F172A', muted: '#64748B', header: '#1e3a5f', hero: '#1e3a5f' },
  { naziv: 'Rose', emoji: '🌹', primary: '#E11D48', bg: '#FFF1F2', kartica: '#ffffff', border: '#FECDD3', tekst: '#881337', muted: '#BE123C', header: '#ffffff', hero: '#E11D48' },
  { naziv: 'Sunset', emoji: '🌅', primary: '#EA580C', bg: '#FFF7ED', kartica: '#ffffff', border: '#FED7AA', tekst: '#431407', muted: '#9A3412', header: '#ffffff', hero: '#C2410C' },
  { naziv: 'Forest', emoji: '🌲', primary: '#166534', bg: '#F0FDF4', kartica: '#ffffff', border: '#BBF7D0', tekst: '#052E16', muted: '#15803D', header: '#14532D', hero: '#166534' },
  { naziv: 'Gold', emoji: '✨', primary: '#B45309', bg: '#FFFBEB', kartica: '#ffffff', border: '#FDE68A', tekst: '#451A03', muted: '#92400E', header: '#ffffff', hero: '#92400E' },
  { naziv: 'Slate', emoji: '🩶', primary: '#475569', bg: '#F8FAFC', kartica: '#ffffff', border: '#E2E8F0', tekst: '#0F172A', muted: '#64748B', header: '#1E293B', hero: '#334155' },
  { naziv: 'Sakura', emoji: '🌸', primary: '#DB2777', bg: '#FDF2F8', kartica: '#ffffff', border: '#FBCFE8', tekst: '#500724', muted: '#BE185D', header: '#ffffff', hero: '#BE185D' },
  { naziv: 'Arctic', emoji: '🧊', primary: '#0891B2', bg: '#ECFEFF', kartica: '#ffffff', border: '#A5F3FC', tekst: '#164E63', muted: '#0E7490', header: '#083344', hero: '#0E7490' },
]

const CSS_PRESET_TEME = [
  { naziv: 'Nebula Dark', emoji: '🌌', opis: 'Tamna, indigo gradijent header, glassmorphism kartice', css: '/* === NEBULA DARK === */\n@import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap\');\n:root {\n  --brand: #6366f1; --brand-dark: #4f46e5; --brand-pale: rgba(99,102,241,0.12);\n  --surface: #0f0f1a; --border: rgba(255,255,255,0.07);\n  --text: #e2e8f0; --text-muted: #94a3b8;\n  --bg-kartica: rgba(255,255,255,0.04); --radius: 12px; --kartica-radius: 16px;\n}\nbody, .min-h-screen { background: #0f0f1a !important; font-family: \'Inter\', sans-serif !important; }\nheader {\n  background: rgba(99,102,241,0.95) !important;\n  backdrop-filter: blur(20px) !important;\n  border-bottom: 1px solid rgba(255,255,255,0.1) !important;\n  box-shadow: 0 4px 24px rgba(99,102,241,0.3) !important;\n}\nheader * { color: white !important; }\nheader input {\n  background: rgba(255,255,255,0.12) !important;\n  border-color: rgba(255,255,255,0.2) !important;\n  color: white !important; border-radius: 100px !important;\n}\nheader input::placeholder { color: rgba(255,255,255,0.6) !important; }\naside, [style*="position: sticky"] {\n  background: rgba(255,255,255,0.03) !important;\n  border-color: rgba(255,255,255,0.07) !important;\n  backdrop-filter: blur(12px) !important;\n}\n[style*="background: white"], [style*="background:#ffffff"], [style*="background:#fff"] {\n  background: rgba(255,255,255,0.05) !important;\n  border-color: rgba(255,255,255,0.08) !important;\n  color: #e2e8f0 !important;\n}\n[style*="background: #F9FAFB"], [style*="background: #F8FAFA"], [style*="background: #f8fafa"] {\n  background: rgba(255,255,255,0.03) !important;\n}\n[style*="color: #111827"], [style*="color:#111827"] { color: #e2e8f0 !important; }\n[style*="color: #374151"], [style*="color:#374151"] { color: #cbd5e1 !important; }\n[style*="color: #6B7280"], [style*="color:#6B7280"] { color: #64748b !important; }\n[style*="border: 1px solid #E5E7EB"], [style*="border:1px solid #E5E7EB"] { border-color: rgba(255,255,255,0.08) !important; }\n[style*="border-bottom: 1px solid #E5E7EB"] { border-bottom-color: rgba(255,255,255,0.07) !important; }\n[style*="background: #F3F4F6"] { background: rgba(255,255,255,0.06) !important; }\nfooter { background: rgba(255,255,255,0.02) !important; border-top-color: rgba(255,255,255,0.06) !important; }\nfooter * { color: #94a3b8 !important; }\ntable { color: #e2e8f0 !important; }\nthead tr { background: rgba(255,255,255,0.04) !important; }\ntbody tr:hover { background: rgba(99,102,241,0.08) !important; }\nselect, input[type=number] { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.1) !important; color: #e2e8f0 !important; }' },
  { naziv: 'Midnight Gold', emoji: '✨', opis: 'Tamno-plavi header, zlatni akcenti, topla pozadina', css: '/* === MIDNIGHT GOLD === */\n@import url(\'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap\');\n:root {\n  --brand: #f59e0b; --brand-dark: #d97706; --brand-pale: rgba(245,158,11,0.12);\n  --surface: #fffbeb; --border: #fde68a;\n  --text: #1e1b4b; --text-muted: #6b7280;\n  --bg-kartica: #ffffff; --radius: 8px; --kartica-radius: 12px;\n}\nbody, .min-h-screen { background: #fffbeb !important; font-family: \'Plus Jakarta Sans\', sans-serif !important; }\nheader {\n  background: #1e1b4b !important;\n  border-bottom: 2px solid #f59e0b !important;\n  box-shadow: 0 2px 20px rgba(30,27,75,0.4) !important;\n}\nheader * { color: white !important; }\nheader input {\n  background: rgba(255,255,255,0.1) !important;\n  border-color: rgba(245,158,11,0.4) !important;\n  color: white !important;\n}\nheader input::placeholder { color: rgba(255,255,255,0.5) !important; }\n[style*="background: white"], [style*="background:#ffffff"] {\n  background: white !important;\n  border-color: #fde68a !important;\n  box-shadow: 0 1px 4px rgba(245,158,11,0.08) !important;\n}\n[style*="background: #F9FAFB"], [style*="background: #F8FAFA"], [style*="background: #f8fafa"] {\n  background: #fffbeb !important;\n}\naside, [style*="position: sticky"] {\n  background: white !important;\n  border-color: #fde68a !important;\n}\n[style*="color: #111827"], [style*="color:#111827"] { color: #1e1b4b !important; }\n[style*="color: #6B7280"], [style*="color:#6B7280"] { color: #92400e !important; }\n[style*="border: 1px solid #E5E7EB"] { border-color: #fde68a !important; }\n[style*="border-bottom: 1px solid #E5E7EB"] { border-bottom-color: #fde68a !important; }\nthead tr { background: #fffbeb !important; border-bottom-color: #fde68a !important; }\ntbody tr:hover { background: rgba(245,158,11,0.06) !important; }\nfooter { background: #1e1b4b !important; border-top-color: #f59e0b !important; }\nfooter * { color: rgba(255,255,255,0.8) !important; }\nselect, input[type=number] { background: white !important; border-color: #fde68a !important; color: #1e1b4b !important; }\nh1, h2, h3 { color: #1e1b4b !important; font-weight: 700 !important; }' },
  { naziv: 'Arctic Blue', emoji: '🧊', opis: 'Sky-blue akcenti, bijele kartice, čist SaaS izgled', css: ':root { --brand: #0ea5e9; --brand-dark: #0284c7; --brand-pale: #e0f2fe; --surface: #f8fafc; --border: #e2e8f0; --text: #0f172a; --text-muted: #64748b; } body { font-family: Inter, sans-serif !important; } header { background: white !important; border-bottom: 1px solid #e2e8f0 !important; box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important; } [style*="background: #F9FAFB"], [style*="background: #F8FAFA"] { background: #f8fafc !important; } tbody tr:hover { background: #f0f9ff !important; }' },
  { naziv: 'Noir Orange', emoji: '🔥', opis: 'Crni header, narančasti akcenti, premium kontrast', css: ':root { --brand: #f97316; --brand-dark: #ea580c; --brand-pale: #fff7ed; --surface: #fafaf9; --border: #e7e5e4; --text: #1c1917; --text-muted: #78716c; } body { font-family: Inter, sans-serif !important; } header { background: #1c1917 !important; border-bottom: 1px solid #f97316 !important; } header * { color: white !important; } header input { background: rgba(255,255,255,0.08) !important; border-color: rgba(249,115,22,0.4) !important; color: white !important; } [style*="background: #F9FAFB"], [style*="background: #F8FAFA"] { background: #fafaf9 !important; } tbody tr:hover { background: rgba(249,115,22,0.05) !important; }' },
  { naziv: 'Forest Pro', emoji: '🌲', opis: 'Tamno zeleni header, mint pozadina — napravljeno za NIBIS', css: ':root { --brand: #059669; --brand-dark: #047857; --brand-pale: #d1fae5; --surface: #f0fdf4; --border: #bbf7d0; --text: #052e16; --text-muted: #166534; } header { background: linear-gradient(90deg, #064e3b 0%, #065f46 100%) !important; border-bottom: none !important; box-shadow: 0 4px 16px rgba(6,78,59,0.3) !important; } header * { color: white !important; } header input { background: rgba(255,255,255,0.12) !important; border-color: rgba(255,255,255,0.2) !important; color: white !important; } [style*="background: #F9FAFB"], [style*="background: #F8FAFA"] { background: #f0fdf4 !important; } tbody tr:hover { background: rgba(5,150,105,0.06) !important; } [style*="border: 1px solid #E5E7EB"] { border-color: #bbf7d0 !important; }' },
  { naziv: 'Violet Storm', emoji: '💜', opis: 'Purple-pink gradijent, bijele kartice, lavanda pozadina', css: ':root { --brand: #9333ea; --brand-dark: #7e22ce; --brand-pale: #faf5ff; --surface: #faf5ff; --border: #e9d5ff; --text: #3b0764; --text-muted: #7c3aed; } body { font-family: Inter, sans-serif !important; } header { background: linear-gradient(90deg, #7c3aed 0%, #9333ea 50%, #c026d3 100%) !important; box-shadow: 0 4px 20px rgba(147,51,234,0.35) !important; border: none !important; } header * { color: white !important; } header input { background: rgba(255,255,255,0.15) !important; border-color: rgba(255,255,255,0.25) !important; color: white !important; } [style*="background: #F9FAFB"], [style*="background: #F8FAFA"] { background: #faf5ff !important; } [style*="border: 1px solid #E5E7EB"] { border-color: #e9d5ff !important; } tbody tr:hover { background: rgba(147,51,234,0.06) !important; }' },
  { naziv: 'Flat Design', emoji: '📐', opis: 'Bez sjena, minimalistično, oštre linije', css: '* { box-shadow: none !important; border-radius: 4px !important; } header { box-shadow: none !important; border-bottom: 2px solid var(--brand) !important; } button { border-radius: 4px !important; }' },
  { naziv: 'Bez CSS teme', emoji: '✨', opis: 'Default izgled — samo boje iz teme', css: '' },
]

const GOOGLE_FONTS = ['DM Sans', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Nunito', 'Montserrat', 'Raleway', 'Merriweather', 'Playfair Display', 'Source Sans 3']

// ─── UI komponente ─────────────────────────────────────────────────────────────
function Sec({ title, children, desc }: { title: string; children: React.ReactNode; desc?: string }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h3>
        {desc && <p style={{ fontSize: '11px', color: '#6B7280', margin: '3px 0 0' }}>{desc}</p>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{children}</div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>{children}</div>
}

function Divider() {
  return <div style={{ height: '1px', background: '#F3F4F6', margin: '4px 0' }} />
}

function Toggle({ label, value, onChange, desc }: { label: string; value: string; onChange: (v: string) => void; desc?: string }) {
  const on = value === 'true'
  const containerStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px', borderRadius: '10px', gap: '10px',
    background: on ? '#F0FDF4' : '#F9FAFB',
    border: on ? '1px solid #BBF7D0' : '1px solid #E5E7EB',
  }
  return (
    <div style={containerStyle}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{label}</div>
        {desc && <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{desc}</div>}
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

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px', background: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
        <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
          style={{ width: '40px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }} />
        <input type="text" value={value} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
          style={{ flex: 1, padding: '6px 8px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none', background: 'white' }} />
        <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: value, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
      </div>
    </div>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text', hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string
}) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: 'white', color: '#111827' }}
        onFocus={e => { e.target.style.borderColor = '#0F6E56'; e.target.style.boxShadow = '0 0 0 2px rgba(15,110,86,0.1)' }}
        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }} />
      {hint && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>{hint}</div>}
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: 'white', color: '#111827', resize: 'vertical' as const, lineHeight: 1.5 }}
        onFocus={e => { e.target.style.borderColor = '#0F6E56' }}
        onBlur={e => { e.target.style.borderColor = '#E5E7EB' }} />
    </div>
  )
}

function Slider({ label, value, onChange, min, max, unit = 'px' }: {
  label: string; value: string; onChange: (v: string) => void; min: number; max: number; unit?: string
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</label>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F6E56' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value || min} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', accentColor: '#0F6E56' }} />
    </div>
  )
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[]
}) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', background: 'white', color: '#111827', cursor: 'pointer' }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )
}

function ChoiceGroup({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string; icon?: string }[]
}) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
        {options.map(o => (
          <button key={o.v} onClick={() => onChange(o.v)} style={{
            padding: '7px 14px', fontSize: '12px', fontWeight: 500,
            border: '1.5px solid ' + (value === o.v ? '#0F6E56' : '#E5E7EB'),
            borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
            background: value === o.v ? '#F0FDF4' : 'white',
            color: value === o.v ? '#0F6E56' : '#374151',
          }}>
            {o.icon && <span style={{ marginRight: '5px' }}>{o.icon}</span>}{o.l}
          </button>
        ))}
      </div>
    </div>
  )
}

function ImageInput({ label, value, onChange, hint }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string
}) {
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const filename = 'uploads/' + Date.now() + '.' + ext
      const { error } = await supabase.storage.from('slike').upload(filename, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('slike').getPublicUrl(filename)
      onChange(data.publicUrl)
    } catch {
      const reader = new FileReader()
      reader.onload = ev => onChange(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
    setUploading(false)
  }

  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' as const }}>
          {value
            ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' as const }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            : <ImgIcon size={20} style={{ color: '#D1D5DB' }} />
          }
          {value && (
            <button onClick={() => onChange('')} style={{ position: 'absolute' as const, top: '2px', right: '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#EF4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
              <X size={9} style={{ color: 'white' }} />
            </button>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
          <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="https://..."
            style={{ width: '100%', padding: '8px 10px', fontSize: '12px', border: '1px solid #E5E7EB', borderRadius: '7px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
            onFocus={e => { e.target.style.borderColor = '#0F6E56' }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB' }} />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '7px', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 500, color: '#0F6E56', width: 'fit-content' }}>
            <ImgIcon size={12} /> {uploading ? 'Učitavam...' : 'Odaberi s računara'}
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} disabled={uploading} />
          </label>
          {hint && <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{hint}</div>}
        </div>
      </div>
    </div>
  )
}

function AccordionSec({ title, icon, children, defaultOpen = false, badge }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; badge?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        padding: '14px 16px', background: open ? '#F0FDF4' : 'white',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        borderBottom: open ? '1px solid #E5E7EB' : 'none',
      }}>
        <span style={{ color: open ? '#0F6E56' : '#6B7280', display: 'flex', flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, textAlign: 'left' as const, fontSize: '14px', fontWeight: 600, color: open ? '#0F6E56' : '#111827' }}>{title}</span>
        {badge && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: '#FEF3C7', color: '#92400E' }}>{badge}</span>}
        {open ? <ChevronDown size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} />}
      </button>
      {open && (
        <div style={{ padding: '20px 16px', background: 'white', display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Glavni Page ───────────────────────────────────────────────────────────────
export default function IzgledPage() {
  const [p, setP] = useState<Postavke>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changed, setChanged] = useState(false)
  const [history, setHistory] = useState<Postavke[]>([])
  const [preview, setPreview] = useState(false)
  const historyRef = useRef<Postavke[]>([])
  const lastKeyRef = useRef('')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    supabase.from('postavke').select('kljuc, vrijednost')
      .in('kljuc', Object.keys(DEFAULTS))
      .then(({ data }) => {
        const m: Postavke = { ...DEFAULTS }
        data?.forEach(row => { m[row.kljuc] = row.vrijednost })
        setP(m)
        setLoading(false)
      })
  }, [])

  function set(key: string, value: string) {
    if (lastKeyRef.current !== key) {
      lastKeyRef.current = key
      historyRef.current = [...historyRef.current.slice(-30), p]
      setHistory([...historyRef.current])
    }
    setP(prev => ({ ...prev, [key]: value }))
    setChanged(true)
    applyLive(key, value)
    iframeRef.current?.contentWindow?.postMessage({ type: 'THEME_UPDATE', key, value }, '*')
  }

  function applyLive(key: string, value: string) {
    const r = document.documentElement
    const cssMap: Record<string, string> = {
      theme_primary_boja: '--brand', theme_bg_stranica: '--surface',
      theme_bg_kartica: '--bg-kartica', theme_border_boja: '--border',
      theme_tekst_boja: '--text', theme_tekst_muted: '--text-muted',
    }
    if (cssMap[key]) {
      r.style.setProperty(cssMap[key], value)
      if (key === 'theme_primary_boja') {
        r.style.setProperty('--brand-pale', value + '18')
        r.style.setProperty('--brand-dark', value + 'dd')
      }
    }
    if (key === 'theme_border_radius') r.style.setProperty('--radius', value + 'px')
    if (key === 'theme_font_body_size') document.body.style.fontSize = value + 'px'
    if (key === 'theme_custom_css') {
      let el = document.getElementById('admin-live-css')
      if (!el) { el = document.createElement('style'); el.id = 'admin-live-css'; document.head.appendChild(el) }
      el.textContent = value
    }
  }

  function applyPreset(t: typeof PRESET_TEME[0]) {
    historyRef.current = [...historyRef.current.slice(-30), p]
    setHistory([...historyRef.current])
    lastKeyRef.current = ''
    const updates = {
      theme_primary_boja: t.primary, theme_bg_stranica: t.bg,
      theme_bg_kartica: t.kartica, theme_border_boja: t.border,
      theme_tekst_boja: t.tekst, theme_tekst_muted: (t as any).muted || t.tekst,
      theme_cijena_boja: t.primary, header_boja: t.header,
      hero_boja_pozadine: t.hero,
    }
    setP(prev => ({ ...prev, ...updates }))
    setChanged(true)
    Object.entries(updates).forEach(([k, v]) => {
      applyLive(k, v)
      iframeRef.current?.contentWindow?.postMessage({ type: 'THEME_UPDATE', key: k, value: v }, '*')
    })
  }

  function undo() {
    if (!historyRef.current.length) return
    const prev = historyRef.current[historyRef.current.length - 1]
    historyRef.current = historyRef.current.slice(0, -1)
    setHistory([...historyRef.current])
    lastKeyRef.current = ''
    setP(prev)
    setChanged(true)
  }

  async function save() {
    setSaving(true)
    await supabase.from('postavke').upsert(
      Object.entries(p).map(([kljuc, vrijednost]) => ({ kljuc, vrijednost: vrijednost || '' })),
      { onConflict: 'kljuc' }
    )
    setSaving(false); setSaved(true); setChanged(false)
    setTimeout(() => setSaved(false), 2500)
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'nibis-tema.json'; a.click()
    URL.revokeObjectURL(url)
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        historyRef.current = [...historyRef.current.slice(-30), p]
        setHistory([...historyRef.current])
        setP(prev => ({ ...prev, ...data }))
        setChanged(true)
      } catch { alert('Nevažeći JSON fajl') }
    }
    reader.readAsText(file)
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: '52px', background: '#F3F4F6', borderRadius: '12px' }} />
        ))}
      </div>
    )
  }

  const saveStyle = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 18px', fontSize: '13px', fontWeight: 700,
    border: 'none', borderRadius: '8px',
    cursor: (saving || !changed) ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    background: saved ? '#059669' : changed ? '#0F6E56' : '#E5E7EB',
    color: (saved || changed) ? 'white' : '#9CA3AF',
    transition: 'all 0.2s',
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>

      {/* ─── Panel ─── */}
      <div style={{ width: preview ? '380px' : '100%', maxWidth: preview ? '380px' : '780px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', borderRight: preview ? '1px solid #E5E7EB' : 'none' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderBottom: '1px solid #E5E7EB', background: 'white', flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#111827' }}>🎨 Podešavanja izgleda</h1>
            {changed && <p style={{ fontSize: '11px', color: '#D97706', margin: '2px 0 0' }}>● Nesačuvane promjene</p>}
          </div>
          <button onClick={undo} disabled={!history.length} title="Poništi"
            style={{ padding: '7px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: history.length ? 'pointer' : 'not-allowed', opacity: history.length ? 1 : 0.35, display: 'flex' }}>
            <Undo2 size={14} />
          </button>
          <button onClick={exportJSON} title="Eksportuj temu"
            style={{ padding: '7px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: 'pointer', display: 'flex' }}>
            <Download size={14} />
          </button>
          <label title="Uvezi temu" style={{ padding: '7px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: 'pointer', display: 'flex' }}>
            <Upload size={14} />
            <input type="file" accept=".json" onChange={importJSON} style={{ display: 'none' }} />
          </label>
          <button onClick={() => setPreview(!preview)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', border: '1px solid ' + (preview ? '#0F6E56' : '#E5E7EB'), borderRadius: '8px', background: preview ? '#F0FDF4' : 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: preview ? '#0F6E56' : '#374151', fontFamily: 'inherit' }}>
            {preview ? <EyeOff size={13} /> : <Eye size={13} />}
            {preview ? 'Sakrij' : 'Preview'}
          </button>
          <button onClick={save} disabled={saving || !changed} style={saveStyle}>
            <Save size={13} />{saving ? 'Čuvam...' : saved ? '✓ Sačuvano' : 'Sačuvaj'}
          </button>
        </div>

        {/* Sadržaj */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {/* ── BRZE TEME ── */}
          <AccordionSec title="Izgled i boje" icon={<Palette size={18} />} defaultOpen={true}>
            <Sec title="Brze teme" desc="Klikni za trenutnu primjenu">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {PRESET_TEME.map(t => (
                  <button key={t.naziv} onClick={() => applyPreset(t)} style={{
                    padding: '8px 6px', border: '2px solid ' + (p.theme_primary_boja === t.primary && p.theme_bg_stranica === t.bg ? '#0F6E56' : '#E5E7EB'),
                    borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                    background: p.theme_primary_boja === t.primary && p.theme_bg_stranica === t.bg ? '#F0FDF4' : 'white',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
                      {[t.primary, t.bg, t.header].map((c, i) => (
                        <div key={i} style={{ width: '12px', height: '12px', borderRadius: '3px', background: c, border: '1px solid rgba(0,0,0,0.08)' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>{(t as any).emoji} {t.naziv}</span>
                  </button>
                ))}
              </div>
            </Sec>
            <Sec title="Primarne boje">
              <Row>
                <ColorPicker label="Glavna boja" value={p.theme_primary_boja} onChange={v => set('theme_primary_boja', v)} />
                <ColorPicker label="Pozadina stranice" value={p.theme_bg_stranica} onChange={v => set('theme_bg_stranica', v)} />
              </Row>
              <Row>
                <ColorPicker label="Pozadina kartica" value={p.theme_bg_kartica} onChange={v => set('theme_bg_kartica', v)} />
                <ColorPicker label="Boja bordera" value={p.theme_border_boja} onChange={v => set('theme_border_boja', v)} />
              </Row>
              <Row>
                <ColorPicker label="Boja teksta" value={p.theme_tekst_boja} onChange={v => set('theme_tekst_boja', v)} />
                <ColorPicker label="Sekundarni tekst" value={p.theme_tekst_muted} onChange={v => set('theme_tekst_muted', v)} />
              </Row>
              <Row>
                <ColorPicker label="Boja cijena" value={p.theme_cijena_boja} onChange={v => set('theme_cijena_boja', v)} />
                <ColorPicker label="Boja akcija/popusta" value={p.theme_akcija_boja} onChange={v => set('theme_akcija_boja', v)} />
              </Row>
            </Sec>
            <Sec title="Font">
              <Select label="Font cijelog sajta" value={p.theme_font} onChange={v => set('theme_font', v)}
                options={GOOGLE_FONTS.map(f => ({ v: f, l: f }))} />
              <Row>
                <Slider label="Veličina teksta" value={p.theme_font_body_size} onChange={v => set('theme_font_body_size', v)} min={11} max={18} />
                <Slider label="Zaobljenost" value={p.theme_border_radius} onChange={v => set('theme_border_radius', v)} min={0} max={28} />
              </Row>
            </Sec>
          </AccordionSec>

          {/* ── ZAGLAVLJE ── */}
          <AccordionSec title="Zaglavlje (Header)" icon={<Layout size={18} />}>
            <Sec title="Layout zaglavlja">
              <ChoiceGroup label="Raspored" value={p.header_layout} onChange={v => set('header_layout', v)}
                options={[{ v: 'minimal', l: 'Minimalni' }, { v: 'rs_stil', l: 'R&S stil' }, { v: 'centered', l: 'Centrirani' }]} />
            </Sec>
            <Sec title="Boje">
              <Row>
                <ColorPicker label="Pozadina zaglavlja" value={p.header_boja} onChange={v => set('header_boja', v)} />
                <ColorPicker label="Boja teksta" value={p.header_tekst_boja} onChange={v => set('header_tekst_boja', v)} />
              </Row>
            </Sec>
            <Sec title="Postavke">
              <Slider label="Visina zaglavlja" value={p.header_visina_nova || '64'} onChange={v => set('header_visina_nova', v)} min={44} max={120} />
              <Row>
                <Toggle label="Sticky zaglavlje" value={p.header_sticky || 'true'} onChange={v => set('header_sticky', v)} />
                <Toggle label="Blur efekt" value={p.header_blur || 'true'} onChange={v => set('header_blur', v)} />
              </Row>
              <Row>
                <Toggle label="Sjena ispod" value={p.header_shadow_nova || 'true'} onChange={v => set('header_shadow_nova', v)} />
                <Toggle label="Linija ispod" value={p.header_border_bottom || 'true'} onChange={v => set('header_border_bottom', v)} />
              </Row>
            </Sec>
            <Sec title="Search">
              <ChoiceGroup label="Pozicija searcha" value={p.header_search_stil || 'inline'} onChange={v => set('header_search_stil', v)}
                options={[{ v: 'inline', l: 'U zaglavlju' }, { v: 'bar', l: 'Ispod' }, { v: 'hidden', l: 'Sakrij' }]} />
              <Slider label="Širina search polja" value={p.header_search_sirina || '520'} onChange={v => set('header_search_sirina', v)} min={200} max={900} />
              <Input label="Placeholder tekst" value={p.header_search_placeholder || ''} onChange={v => set('header_search_placeholder', v)} />
            </Sec>
            <Sec title="Korpa">
              <ChoiceGroup label="Stil dugmeta" value={p.header_korpa_stil || 'button'} onChange={v => set('header_korpa_stil', v)}
                options={[{ v: 'button', l: 'Dugme' }, { v: 'pill', l: 'Pill' }, { v: 'icon', l: 'Ikona' }]} />
              <ColorPicker label="Boja (prazno = primarna)" value={p.header_korpa_boja || ''} onChange={v => set('header_korpa_boja', v)} />
            </Sec>
            <Sec title="Info traka iznad zaglavlja">
              <Toggle label="Prikazati info traku" value={p.topbar_aktivan || 'false'} onChange={v => set('topbar_aktivan', v)} />
              {p.topbar_aktivan === 'true' && (
                <>
                  <Row>
                    <Input label="Telefon" value={p.topbar_telefon || ''} onChange={v => set('topbar_telefon', v)} placeholder="+387 33 000 000" />
                    <Input label="Email" value={p.topbar_email || ''} onChange={v => set('topbar_email', v)} placeholder="info@firma.ba" />
                  </Row>
                  <Row>
                    <Input label="Radno vrijeme" value={p.topbar_radno_vrijeme || ''} onChange={v => set('topbar_radno_vrijeme', v)} placeholder="Pon–Pet 08–16h" />
                    <Input label="Adresa" value={p.topbar_adresa || ''} onChange={v => set('topbar_adresa', v)} />
                  </Row>
                  <Input label="Vlastiti tekst" value={p.topbar_custom_tekst || ''} onChange={v => set('topbar_custom_tekst', v)} placeholder="Besplatna dostava za narudžbe iznad 200 KM" />
                  <Row>
                    <ColorPicker label="Pozadina trake" value={p.topbar_boja || '#1F2937'} onChange={v => set('topbar_boja', v)} />
                    <ColorPicker label="Boja teksta" value={p.topbar_tekst_boja || '#9CA3AF'} onChange={v => set('topbar_tekst_boja', v)} />
                  </Row>
                </>
              )}
            </Sec>
            <Sec title="Announcement bar (obavijest)">
              <Input label="Tekst (prazno = sakrij)" value={p.announcement_bar || ''} onChange={v => set('announcement_bar', v)} placeholder="Narudžbe do 14h — isporuka narednog radnog dana" />
              <Row>
                <ColorPicker label="Pozadina" value={p.baner_boja_pozadine || '#085041'} onChange={v => set('baner_boja_pozadine', v)} />
                <ColorPicker label="Boja teksta" value={p.baner_boja_teksta || '#ffffff'} onChange={v => set('baner_boja_teksta', v)} />
              </Row>
            </Sec>
          </AccordionSec>

          {/* ── LOGO I IDENTITET ── */}
          <AccordionSec title="Logo i identitet firme" icon={<Globe size={18} />}>
            <Sec title="Logo">
              <ImageInput label="Logo (PNG transparentna pozadina)" value={p.theme_logo_url || ''} onChange={v => set('theme_logo_url', v)} hint="Preporučeno: PNG s transparentnom pozadinom, horizontalni format" />
              <Slider label="Visina loga" value={p.header_logo_visina || '34'} onChange={v => set('header_logo_visina', v)} min={20} max={80} />
              <ImageInput label="Favicon (ikonica u browseru, 32×32px)" value={p.theme_favicon_url || ''} onChange={v => set('theme_favicon_url', v)} />
              <ImageInput label="Logo u footeru (ostavite prazno = isti)" value={p.theme_footer_logo_url || ''} onChange={v => set('theme_footer_logo_url', v)} />
            </Sec>
            <Sec title="Podaci firme">
              <Row>
                <Input label="Naziv firme" value={p.shop_naziv || ''} onChange={v => set('shop_naziv', v)} placeholder="Vaša firma d.o.o." />
                <Input label="Web" value={p.shop_web || ''} onChange={v => set('shop_web', v)} placeholder="www.vasafirma.ba" />
              </Row>
              <Row>
                <Input label="Email" value={p.shop_email || ''} onChange={v => set('shop_email', v)} placeholder="info@vasafirma.ba" />
                <Input label="Telefon" value={p.shop_telefon || ''} onChange={v => set('shop_telefon', v)} placeholder="+387 33 000 000" />
              </Row>
              <Input label="Adresa" value={p.shop_adresa || ''} onChange={v => set('shop_adresa', v)} placeholder="Ulica bb, 71000 Sarajevo" />
              <Row>
                <Input label="PIB / ID broj" value={p.shop_pib || ''} onChange={v => set('shop_pib', v)} />
                <Input label="PDV broj" value={p.shop_pdv_broj || ''} onChange={v => set('shop_pdv_broj', v)} />
              </Row>
            </Sec>
            <Sec title="SEO">
              <Input label="Naslov (tab u browseru)" value={p.seo_naslov || ''} onChange={v => set('seo_naslov', v)} placeholder="Vaša firma — B2B webshop" />
              <Textarea label="Opis (Google pretraga)" value={p.seo_opis || ''} onChange={v => set('seo_opis', v)} placeholder="Kratki opis..." rows={2} />
              <ImageInput label="OG slika za dijeljenje (1200×630px)" value={p.seo_og_slika || ''} onChange={v => set('seo_og_slika', v)} hint="Prikazuje se na Viber, Facebook, LinkedIn..." />
            </Sec>
            <Sec title="Društvene mreže i kontakt" desc="Unesite URL, ostavite prazno da sakrijete">
              <Row>
                <Input label="📘 Facebook" value={p.footer_social_facebook || ''} onChange={v => set('footer_social_facebook', v)} placeholder="https://facebook.com/..." />
                <Input label="📷 Instagram" value={p.footer_social_instagram || ''} onChange={v => set('footer_social_instagram', v)} placeholder="https://instagram.com/..." />
              </Row>
              <Row>
                <Input label="💼 LinkedIn" value={p.footer_social_linkedin || ''} onChange={v => set('footer_social_linkedin', v)} placeholder="https://linkedin.com/..." />
                <Input label="𝕏 Twitter/X" value={p.footer_social_twitter || ''} onChange={v => set('footer_social_twitter', v)} placeholder="https://x.com/..." />
              </Row>
              <Row>
                <Input label="▶ YouTube" value={p.footer_social_youtube || ''} onChange={v => set('footer_social_youtube', v)} placeholder="https://youtube.com/..." />
                <Input label="♪ TikTok" value={p.footer_social_tiktok || ''} onChange={v => set('footer_social_tiktok', v)} placeholder="https://tiktok.com/..." />
              </Row>
              <Row>
                <Input label="💬 WhatsApp" value={p.footer_social_whatsapp || ''} onChange={v => set('footer_social_whatsapp', v)} placeholder="https://wa.me/38733..." />
                <Input label="📞 Viber" value={p.footer_social_viber || ''} onChange={v => set('footer_social_viber', v)} placeholder="viber://chat?number=..." />
              </Row>
            </Sec>
          </AccordionSec>

          {/* ── HERO SLIDER ── */}
          <AccordionSec title="Hero Slider (glavni baner)" icon={<ImgIcon size={18} />}>
            <Toggle label="Prikazati hero slider" value={p.hero_aktivan || 'true'} onChange={v => set('hero_aktivan', v)} />
            <Slider label="Visina slidera" value={p.hero_visina || '480'} onChange={v => set('hero_visina', v)} min={200} max={800} />
            {p.hero_aktivan !== 'false' && (
              <>
                <Sec title="Slajdovi" desc="Dodaj do 5 slajdova. Svrtaju se automatski svakih 5 sekundi.">
                  {(() => {
                    let slides: any[] = []
                    try { slides = JSON.parse(p.hero_slides || '[]') } catch {}
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {slides.map((s: any, i: number) => (
                          <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                            {/* Preview */}
                            <div style={{ height: '80px', background: s.slika_url ? 'none' : 'linear-gradient(135deg, var(--brand-dark), var(--brand))', backgroundImage: s.slika_url ? 'linear-gradient(rgba(0,0,0,' + (s.overlay||'0.4') + '),rgba(0,0,0,' + (s.overlay||'0.4') + ')),url(' + s.slika_url + ')' : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: 'white', fontWeight: 700, fontSize: '13px', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{s.naslov || 'Slajd ' + (i + 1)}</span>
                              <button onClick={() => {
                                const updated = slides.filter((_: any, j: number) => j !== i)
                                set('hero_slides', JSON.stringify(updated))
                              }} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(239,68,68,0.85)', color: 'white', border: 'none', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                                ✕ Ukloni
                              </button>
                            </div>
                            {/* Fields */}
                            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'white' }}>
                              <ImageInput label="Slika (1920×600px, WebP preporučeno)" value={s.slika_url || ''} onChange={v => {
                                const updated = slides.map((sl: any, j: number) => j === i ? { ...sl, slika_url: v } : sl)
                                set('hero_slides', JSON.stringify(updated))
                              }} />
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <Input label="Naslov" value={s.naslov || ''} onChange={v => {
                                  const updated = slides.map((sl: any, j: number) => j === i ? { ...sl, naslov: v } : sl)
                                  set('hero_slides', JSON.stringify(updated))
                                }} placeholder="Naslov slajda" />
                                <Input label="Podnaslov" value={s.podnaslov || ''} onChange={v => {
                                  const updated = slides.map((sl: any, j: number) => j === i ? { ...sl, podnaslov: v } : sl)
                                  set('hero_slides', JSON.stringify(updated))
                                }} placeholder="Kratki opis" />
                                <Input label="Tekst dugmeta" value={s.dugme_tekst || ''} onChange={v => {
                                  const updated = slides.map((sl: any, j: number) => j === i ? { ...sl, dugme_tekst: v } : sl)
                                  set('hero_slides', JSON.stringify(updated))
                                }} placeholder="Pregledaj katalog" />
                                <Input label="URL dugmeta" value={s.dugme_url || '/'} onChange={v => {
                                  const updated = slides.map((sl: any, j: number) => j === i ? { ...sl, dugme_url: v } : sl)
                                  set('hero_slides', JSON.stringify(updated))
                                }} placeholder="/" />
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <ChoiceGroup label="Pozicija teksta" value={s.pozicija || 'center'} onChange={v => {
                                  const updated = slides.map((sl: any, j: number) => j === i ? { ...sl, pozicija: v } : sl)
                                  set('hero_slides', JSON.stringify(updated))
                                }} options={[{ v: 'left', l: '← Lijevo' }, { v: 'center', l: 'Centar' }, { v: 'right', l: 'Desno →' }]} />
                              </div>
                              <Slider label="Zatamnjenje slike" value={s.overlay || '0.4'} onChange={v => {
                                const updated = slides.map((sl: any, j: number) => j === i ? { ...sl, overlay: v } : sl)
                                set('hero_slides', JSON.stringify(updated))
                              }} min={0} max={1} unit="" />
                            </div>
                          </div>
                        ))}
                        {slides.length < 5 && (
                          <button onClick={() => {
                            const updated = [...slides, { slika_url: '', naslov: '', podnaslov: '', dugme_tekst: 'Pregledaj katalog', dugme_url: '/', pozicija: 'center', overlay: '0.4' }]
                            set('hero_slides', JSON.stringify(updated))
                          }} style={{ padding: '12px', border: '2px dashed #E5E7EB', borderRadius: '10px', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--brand)', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            + Dodaj slajd ({slides.length}/5)
                          </button>
                        )}
                      </div>
                    )
                  })()}
                </Sec>
              </>
            )}
          </AccordionSec>

          {/* ── NAVIGACIJA KATEGORIJA ── */}
          <AccordionSec title="Navigacija kategorija" icon={<Layout size={18} />}>
            <Toggle label="Horizontalni nav ispod zaglavlja" value={p.navkat_aktivan || 'false'} onChange={v => set('navkat_aktivan', v)} desc="Kategorije kao meni — kao na ris.ba" />
            {p.navkat_aktivan === 'true' && (
              <>
                <Row>
                  <ColorPicker label="Pozadina nava" value={p.navkat_boja || '#1e3a5f'} onChange={v => set('navkat_boja', v)} />
                  <ColorPicker label="Boja teksta" value={p.navkat_tekst_boja || '#ffffff'} onChange={v => set('navkat_tekst_boja', v)} />
                </Row>
                <Slider label="Visina nava" value={p.navkat_visina || '44'} onChange={v => set('navkat_visina', v)} min={32} max={72} />
                <ChoiceGroup label="Stil kategorija" value={p.navkat_stil || 'flat'} onChange={v => set('navkat_stil', v)}
                  options={[{ v: 'flat', l: 'Flat' }, { v: 'pills', l: 'Pills' }, { v: 'underline', l: 'Podvučeno' }, { v: 'boje_kategorija', l: 'Boje (R&S)' }]} />
                <Divider />
                <Toggle label="Akcijsko dugme" value={p.navkat_akcijski_dugme || 'false'} onChange={v => set('navkat_akcijski_dugme', v)} />
                {p.navkat_akcijski_dugme === 'true' && (
                  <Row>
                    <Input label="Tekst dugmeta" value={p.navkat_akcijski_tekst || ''} onChange={v => set('navkat_akcijski_tekst', v)} />
                    <ColorPicker label="Boja" value={p.navkat_akcijski_boja || '#DC2626'} onChange={v => set('navkat_akcijski_boja', v)} />
                  </Row>
                )}
              </>
            )}
            <Sec title="Istaknute kategorije (kao ris.ba)" desc="Klikni na kategoriju u dropdownu otvori grid s karticama i slikama">
              {(() => {
                let items: any[] = []
                try { items = JSON.parse(p.navkat_featured || '[]') } catch {}
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {items.map((item: any, i: number) => (
                      <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
                        {/* Preview */}
                        <div style={{ height: '60px', backgroundImage: item.slika_url ? 'url(' + item.slika_url + ')' : 'none', backgroundSize: 'cover', backgroundPosition: 'center', background: item.slika_url ? 'none' : (item.boja || '#E5E7EB'), display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
                          <span style={{ color: 'white', fontWeight: 700, fontSize: '13px', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{item.naziv || 'Kategorija ' + (i+1)}</span>
                          <button onClick={() => {
                            const updated = items.filter((_: any, j: number) => j !== i)
                            set('navkat_featured', JSON.stringify(updated))
                          }} style={{ background: 'rgba(239,68,68,0.8)', color: 'white', border: 'none', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' }}>
                            ✕
                          </button>
                        </div>
                        <div style={{ padding: '10px', background: 'white', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <Input label="Naziv" value={item.naziv || ''} onChange={v => {
                            const updated = items.map((it: any, j: number) => j === i ? { ...it, naziv: v } : it)
                            set('navkat_featured', JSON.stringify(updated))
                          }} placeholder="Alati" />
                          <Input label="URL (npr. /?grupaId=3)" value={item.url || ''} onChange={v => {
                            const updated = items.map((it: any, j: number) => j === i ? { ...it, url: v } : it)
                            set('navkat_featured', JSON.stringify(updated))
                          }} placeholder="/?grupaId=3" />
                          <ImageInput label="Slika kategorije" value={item.slika_url || ''} onChange={v => {
                            const updated = items.map((it: any, j: number) => j === i ? { ...it, slika_url: v } : it)
                            set('navkat_featured', JSON.stringify(updated))
                          }} />
                          <ColorPicker label="Boja (overlay na hover)" value={item.boja || '#0F6E56'} onChange={v => {
                            const updated = items.map((it: any, j: number) => j === i ? { ...it, boja: v } : it)
                            set('navkat_featured', JSON.stringify(updated))
                          }} />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => {
                      const updated = [...items, { naziv: '', slika_url: '', boja: 'var(--brand)', url: '' }]
                      set('navkat_featured', JSON.stringify(updated))
                    }} style={{ padding: '10px', border: '2px dashed #E5E7EB', borderRadius: '10px', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--brand)', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      + Dodaj kategoriju
                    </button>
                  </div>
                )
              })()}
            </Sec>

            <Sec title="Sidebar kategorija">
              <ChoiceGroup label="Pozicija kategorija" value={p.sidebar_pozicija || 'lijevo'} onChange={v => set('sidebar_pozicija', v)}
                options={[{ v: 'lijevo', l: 'S lijeva' }, { v: 'vrh', l: 'Na vrhu' }, { v: 'skriveno', l: 'Sakrij' }]} />
              <Row>
                <Slider label="Širina sidebara" value={p.sidebar_sirina || '240'} onChange={v => set('sidebar_sirina', v)} min={160} max={360} />
                <Slider label="Visina reda" value={p.sidebar_visina_kategorije || '52'} onChange={v => set('sidebar_visina_kategorije', v)} min={36} max={80} />
              </Row>
              <ColorPicker label="Pozadina sidebara" value={p.sidebar_boja_pozadine || '#F8FAFA'} onChange={v => set('sidebar_boja_pozadine', v)} />
            </Sec>
          </AccordionSec>

          {/* ── ARTIKLI ── */}
          <AccordionSec title="Artikli i katalog" icon={<ShoppingBag size={18} />}>
            <Sec title="Cijene">
              <Toggle label="Dvije cijene (veleprodajna + maloprodajna)" value={p.artikal_prikaz_dvije_cijene || 'false'} onChange={v => set('artikal_prikaz_dvije_cijene', v)} />
              {p.artikal_prikaz_dvije_cijene === 'true' && (
                <Row>
                  <Input label="Label velep. cijene" value={p.artikal_velep_label || ''} onChange={v => set('artikal_velep_label', v)} />
                  <Input label="Label malop. cijene" value={p.artikal_malop_label || ''} onChange={v => set('artikal_malop_label', v)} />
                </Row>
              )}
              <Toggle label="+PDV uz cijenu" value={p.artikal_prikaz_pdv || 'false'} onChange={v => set('artikal_prikaz_pdv', v)} />
            </Sec>
            <Sec title="Kolone tabele">
              <Toggle label="Šifra artikla" value={p.artikal_prikaz_sifra || 'true'} onChange={v => set('artikal_prikaz_sifra', v)} />
              <Toggle label="Kategorija" value={p.artikal_prikaz_kategorija || 'true'} onChange={v => set('artikal_prikaz_kategorija', v)} />
            </Sec>
            <Sec title="Katalog">
              <Row>
                <Select label="Artikala po stranici" value={p.per_page || '24'} onChange={v => set('per_page', v)}
                  options={[{ v: '12', l: '12' }, { v: '24', l: '24' }, { v: '36', l: '36' }, { v: '48', l: '48' }]} />
                <ChoiceGroup label="Zadani prikaz" value={p.default_view || 'table'} onChange={v => set('default_view', v)}
                  options={[{ v: 'table', l: 'Tabela' }, { v: 'grid', l: 'Grid' }]} />
              </Row>
              <Input label="Tekst dugmeta za korpu" value={p.artikal_dugme_tekst || 'Dodaj'} onChange={v => set('artikal_dugme_tekst', v)} />
            </Sec>
            <Sec title="Narudžbe">
              <Input label="Načini plaćanja (zarezom odvojeni)" value={p.nacini_placanja || ''} onChange={v => set('nacini_placanja', v)} placeholder="Virman,Gotovina,Kartica" />
              <Input label="Minimalna narudžba KM (0 = bez limita)" value={p.min_narudzba || '0'} onChange={v => set('min_narudzba', v)} type="number" />
              <Toggle label="Napomena uz narudžbu" value={p.korpa_napomena || 'true'} onChange={v => set('korpa_napomena', v)} />
            </Sec>
          </AccordionSec>

          {/* ── FOOTER ── */}
          <AccordionSec title="Podnožje (Footer)" icon={<Settings size={18} />}>
            <ColorPicker label="Pozadina footera" value={p.theme_footer_boja || '#ffffff'} onChange={v => set('theme_footer_boja', v)} />
            <ImageInput label="Slika pozadine footera (opcionalno)" value={p.theme_footer_bg_slika || ''} onChange={v => set('theme_footer_bg_slika', v)} />
            <Input label="Copyright tekst" value={p.theme_footer_tekst || ''} onChange={v => set('theme_footer_tekst', v)} placeholder="B2B webshop · Powered by NIBIS ERP" />
            <Sec title="Kolone u footeru">
              <Toggle label="Prikazati kolone" value={p.footer_kolone_aktivan || 'false'} onChange={v => set('footer_kolone_aktivan', v)} />
              {p.footer_kolone_aktivan === 'true' && (
                <>
                  <Row>
                    <Input label="Naslov kolone 1" value={p.footer_kolona1_naslov || ''} onChange={v => set('footer_kolona1_naslov', v)} />
                    <Textarea label="Sadržaj kolone 1" value={p.footer_kolona1_sadrzaj || ''} onChange={v => set('footer_kolona1_sadrzaj', v)} rows={3} />
                  </Row>
                  <Row>
                    <Input label="Naslov kolone 2" value={p.footer_kolona2_naslov || ''} onChange={v => set('footer_kolona2_naslov', v)} />
                    <Textarea label="Sadržaj kolone 2" value={p.footer_kolona2_sadrzaj || ''} onChange={v => set('footer_kolona2_sadrzaj', v)} rows={3} />
                  </Row>
                  <Row>
                    <Input label="Naslov kolone 3" value={p.footer_kolona3_naslov || ''} onChange={v => set('footer_kolona3_naslov', v)} />
                    <Textarea label="Sadržaj kolone 3" value={p.footer_kolona3_sadrzaj || ''} onChange={v => set('footer_kolona3_sadrzaj', v)} rows={3} />
                  </Row>
                </>
              )}
            </Sec>
          </AccordionSec>

          {/* ── REGISTRACIJA ── */}
          <AccordionSec title="Registracija i pristup" icon={<Globe size={18} />}>
            <Toggle label="Otvorena registracija" value={p.registracija_otvorena || 'true'} onChange={v => set('registracija_otvorena', v)} desc="Novi kupci se mogu sami registrovati" />
            <Toggle label="Maintenance mode" value={p.shop_maintenance || 'false'} onChange={v => set('shop_maintenance', v)} desc="Sakrij shop svim osim adminu" />
            <Input label="Poruka pri registraciji" value={p.registracija_poruka || ''} onChange={v => set('registracija_poruka', v)} placeholder="Vaš zahtjev je primljen. Kontaktirat ćemo vas u roku od 24h." />
            <Divider />
            <Toggle label="Email potvrda narudžbe kupcu" value={p.email_potvrda_narudzba || 'true'} onChange={v => set('email_potvrda_narudzba', v)} />
            <Toggle label="Email adminu — nova narudžba" value={p.email_admin_narudzba || 'true'} onChange={v => set('email_admin_narudzba', v)} />
            <Toggle label="Email adminu — nova registracija" value={p.email_admin_registracija || 'true'} onChange={v => set('email_admin_registracija', v)} />
          </AccordionSec>

          {/* ── PRIKAZ KARTICA ── */}
          <AccordionSec title="Prikaz kartica artikala (Grid)" icon={<ShoppingBag size={18} />}>
            <Sec title="Što se prikazuje na kartici">
              <Toggle label="Slika artikla" value={p.kartica_prikaz_slika || 'true'} onChange={v => set('kartica_prikaz_slika', v)} />
              <Toggle label="Šifra artikla" value={p.kartica_prikaz_sifra || 'true'} onChange={v => set('kartica_prikaz_sifra', v)} />
              <Toggle label="Badge stanja (Na stanju / Nema)" value={p.kartica_prikaz_stanje || 'true'} onChange={v => set('kartica_prikaz_stanje', v)} />
              <Toggle label="Kategorija na kartici" value={p.kartica_prikaz_kategorija || 'false'} onChange={v => set('kartica_prikaz_kategorija', v)} />
            </Sec>
          </AccordionSec>

                    {/* ── SEKCIJE STRANICE ── */}
          <AccordionSec title="Sekcije stranice" icon={<Layout size={18} />}>
            <Sec title="Uključi / isključi sekcije" desc="Redoslijed se mijenja povlačenjem">
              {(() => {
                let sekcije: {id: string; naziv: string; aktivan: boolean}[] = []
                try { sekcije = JSON.parse(p.page_sekcije || '[]') } catch {}
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {sekcije.map((s, idx) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: s.aktivan ? '#F0FDF4' : '#F9FAFB', border: '1px solid ' + (s.aktivan ? '#BBF7D0' : '#E5E7EB'), borderRadius: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#9CA3AF', cursor: 'grab' }}>⠿</span>
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#111827' }}>{s.naziv}</span>
                        <button onClick={() => {
                          const updated = sekcije.map((sec, i) => i === idx ? { ...sec, aktivan: !sec.aktivan } : sec)
                          set('page_sekcije', JSON.stringify(updated))
                        }} style={{
                          width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', flexShrink: 0,
                          background: s.aktivan ? '#0F6E56' : '#D1D5DB', position: 'relative', transition: 'background 0.2s',
                        }}>
                          <span style={{ position: 'absolute', top: '2px', left: s.aktivan ? '20px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </Sec>
            <Sec title="Features sekcija (kad je uključena)">
              <Input label="Naslov sekcije" value={p.sekcija_features_naslov || 'Zašto mi?'} onChange={v => set('sekcija_features_naslov', v)} />
            </Sec>
            <Sec title="Promo Banner (kad je uključen)">
              <Input label="Tekst banera" value={p.sekcija_banner_tekst || ''} onChange={v => set('sekcija_banner_tekst', v)} placeholder="Posebna ponuda ovog mjeseca!" />
              <Input label="Podnaslov" value={p.sekcija_banner_podnaslov || ''} onChange={v => set('sekcija_banner_podnaslov', v)} />
              <Input label="Tekst dugmeta" value={p.sekcija_banner_dugme || ''} onChange={v => set('sekcija_banner_dugme', v)} placeholder="Saznaj više" />
              <ColorPicker label="Boja banera" value={p.sekcija_banner_boja || '#0F6E56'} onChange={v => set('sekcija_banner_boja', v)} />
            </Sec>
            <Sec title="Newsletter (kad je uključen)">
              <Input label="Naslov" value={p.sekcija_newsletter_naslov || ''} onChange={v => set('sekcija_newsletter_naslov', v)} placeholder="Ostanite informisani" />
              <Input label="Podnaslov" value={p.sekcija_newsletter_podnaslov || ''} onChange={v => set('sekcija_newsletter_podnaslov', v)} />
            </Sec>
          </AccordionSec>

          {/* ── CSS TEME ── */}
          <AccordionSec title="CSS teme i napredne postavke" icon={<Type size={18} />} badge="Dev">
            <Sec title="Gotove CSS teme">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {CSS_PRESET_TEME.map(t => {
                  const isActive = t.css ? p.theme_custom_css === t.css : !p.theme_custom_css
                  return (
                    <button key={t.naziv} onClick={() => set('theme_custom_css', t.css)} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const,
                      border: '1.5px solid ' + (isActive ? 'var(--brand)' : '#E5E7EB'),
                      borderRadius: '12px', background: isActive ? 'var(--brand-pale)' : 'white',
                      transition: 'all 0.15s', width: '100%',
                    }}>
                      <div style={{ fontSize: '28px', flexShrink: 0 }}>{t.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: isActive ? 'var(--brand)' : '#111827' }}>{t.naziv}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{t.opis}</div>
                      </div>
                      {isActive && <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)', padding: '3px 10px', background: 'white', borderRadius: '100px', border: '1px solid var(--brand)', flexShrink: 0 }}>✓ Aktivna</div>}
                    </button>
                  )
                })}
              </div>
            </Sec>
            <div style={{ padding: '10px', background: '#FEF3C7', borderRadius: '8px', fontSize: '12px', color: '#92400E' }}>
              ⚠️ Vlastiti CSS može pokvariti izgled — koristite s oprezom.
            </div>
            <Textarea label="Vlastiti CSS" value={p.theme_custom_css || ''} onChange={v => set('theme_custom_css', v)} rows={8} placeholder="/* Vlastiti CSS */" />
          </AccordionSec>

        </div>
      </div>

      {/* ─── Preview ─── */}
      {preview && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F1F5F9', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #E5E7EB', background: 'white', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Live preview</span>
            <button onClick={() => { if (iframeRef.current) iframeRef.current.src = iframeRef.current.src }}
              style={{ padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: '6px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6B7280', fontFamily: 'inherit' }}>
              <RefreshCw size={11} /> Osvježi
            </button>
            <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 'auto' }}>nibis-webshop.vercel.app</span>
          </div>
          <div style={{ flex: 1, padding: '12px', overflow: 'hidden' }}>
            <iframe ref={iframeRef} src="/" style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px', background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} title="Preview" />
          </div>
        </div>
      )}
    </div>
  )
}

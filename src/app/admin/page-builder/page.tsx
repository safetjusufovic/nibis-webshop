'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Save, ChevronLeft, Monitor, Smartphone, Tablet, Undo2, Redo2,
  Eye, EyeOff, Trash2, Copy, ChevronUp, ChevronDown, Plus,
  Type, Image, Layout, Square, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Link, Minus, Settings, GripVertical, X,
  LayoutGrid, Star, Megaphone, Mail, BarChart2, Box, Columns,
} from 'lucide-react'
import Link from 'next/link'

// ─── Tipovi ────────────────────────────────────────────────────────────────────
type DeviceType = 'desktop' | 'tablet' | 'mobile'
type PanelTab = 'blokovi' | 'slojevi' | 'stilovi'

interface BlockProps {
  [key: string]: any
}

interface Block {
  id: string
  type: string
  props: BlockProps
  children?: Block[]
}

// ─── Defaultni props po tipu ───────────────────────────────────────────────────
const BLOCK_DEFAULTS: Record<string, BlockProps> = {
  hero: {
    naslov: 'Dobrodošli u naš webshop',
    podnaslov: 'Profesionalna roba za vaše poslovanje',
    dugmeTekst: 'Pregledaj katalog',
    dugmeUrl: '/',
    bgBoja: '#0F6E56',
    bgSlika: '',
    tekstBoja: '#ffffff',
    visina: '400',
    tekstPozicija: 'center',
    overlay: '0.3',
    fontSize: '42',
    podnaslovSize: '18',
  },
  features: {
    naslov: 'Zašto mi?',
    item1Ikona: '🚀', item1Naslov: 'Brza isporuka', item1Opis: 'Naredni radni dan',
    item2Ikona: '💎', item2Naslov: 'Kvalitet', item2Opis: 'Provjereni dobavljači',
    item3Ikona: '🔒', item3Naslov: 'Sigurnost', item3Opis: 'Zaštićene transakcije',
    kolone: '3', bgBoja: '#f8fafa', paddingV: '64', paddingH: '40',
    kartBoja: '#ffffff', radius: '14', shadow: 'true',
  },
  promo: {
    naslov: 'Posebna ponuda za B2B partnere',
    podnaslov: 'Kontaktirajte nas za individualne cijene i uslove',
    dugmeTekst: 'Kontaktiraj nas', dugmeUrl: '#',
    bgBoja: '#0F6E56', tekstBoja: '#ffffff', paddingV: '48',
    dugmeBgBoja: '#ffffff', dugmeTekstBoja: '#0F6E56',
  },
  newsletter: {
    naslov: 'Ostanite informisani',
    podnaslov: 'Primajte obavijesti o novim artiklima i akcijama',
    placeholder: 'vas@email.ba', dugmeTekst: 'Prijavi se',
    bgBoja: '#ffffff', paddingV: '64',
    dugmeBoja: '#0F6E56',
  },
  tekst_slika: {
    naslov: 'Vaš pouzdan B2B partner',
    tekst: 'Nudimo širok asortiman profesionalne robe sa brzom isporukom i konkurentnim cijenama za sve vaše poslovne potrebe.',
    dugmeTekst: 'Saznaj više', dugmeUrl: '#',
    slikaUrl: '', slikaEmoji: '🏭',
    slikaPozicija: 'desno', bgBoja: '#ffffff', paddingV: '64',
    naslovSize: '32', tekstSize: '16', tekstBoja: '#6b8279',
  },
  statistike: {
    stat1Broj: '5000+', stat1Label: 'Artikala',
    stat2Broj: '200+', stat2Label: 'Partnera',
    stat3Broj: '15+', stat3Label: 'Godina iskustva',
    stat4Broj: '24h', stat4Label: 'Isporuka',
    bgBoja: '#0F6E56', tekstBoja: '#ffffff', paddingV: '48',
    brojSize: '40', labelSize: '14',
  },
  tekst: {
    sadrzaj: 'Klikni da urediš tekst...',
    fontSize: '16', fontWeight: '400', boja: '#111827',
    align: 'left', lineHeight: '1.7', paddingV: '16', paddingH: '40',
  },
  slika: {
    url: '', alt: '', sirina: '100', visina: '300',
    radius: '0', objectFit: 'cover', align: 'center',
  },
  dugme: {
    tekst: 'Klikni ovdje', url: '#', bgBoja: '#0F6E56', tekstBoja: '#ffffff',
    paddingH: '24', paddingV: '12', radius: '8', fontSize: '15',
    fontWeight: '600', align: 'center', shadow: 'true',
  },
  separator: {
    visina: '1', boja: '#e8edeb', marginV: '32', stil: 'solid',
  },
  spacer: { visina: '40' },
  kolone_2: {
    bgBoja: '#ffffff', gap: '32', paddingV: '48', paddingH: '40',
    col1Sirina: '50',
  },
  kolone_3: {
    bgBoja: '#ffffff', gap: '24', paddingV: '48', paddingH: '40',
  },
  kartica: {
    naslov: 'Kartica naslov', tekst: 'Opis kartice ide ovdje.',
    bgBoja: '#ffffff', radius: '14', shadow: 'true', padding: '24',
    naslovBoja: '#0d1f1a', tekstBoja: '#6b8279',
  },
  kategorije_grid: {
    naslov: 'Kategorije', kolone: '4',
    bgBoja: '#f8fafa', paddingV: '48', paddingH: '40',
    katBoja: '#ffffff', katRadius: '12', katBorder: '#e8edeb',
  },
  video: {
    url: '', tip: 'youtube', visina: '400', radius: '12',
    paddingV: '32', paddingH: '40',
  },
  html: {
    sadrzaj: '<div style="padding:32px;text-align:center;color:#6b8279">Custom HTML blok</div>',
  },
}

// ─── Definicije blokova ────────────────────────────────────────────────────────
const BLOCK_DEFS = [
  { type: 'hero', label: 'Hero Banner', emoji: '🖼️', kat: 'Webshop', opis: 'Velika slika/boja s naslovom' },
  { type: 'features', label: 'Prednosti', emoji: '⭐', kat: 'Webshop', opis: '3 prednosti s ikonama' },
  { type: 'promo', label: 'Promo Banner', emoji: '📣', kat: 'Webshop', opis: 'CTA banner u boji' },
  { type: 'newsletter', label: 'Newsletter', emoji: '📧', kat: 'Webshop', opis: 'Email prijava forma' },
  { type: 'kategorije_grid', label: 'Kategorije Grid', emoji: '📁', kat: 'Webshop', opis: 'Grid kategorija' },
  { type: 'statistike', label: 'Statistike', emoji: '📊', kat: 'Webshop', opis: '4 broja/statistike' },
  { type: 'tekst_slika', label: 'Tekst + Slika', emoji: '📝', kat: 'Layout', opis: '2 kolone tekst i slika' },
  { type: 'kolone_2', label: '2 Kolone', emoji: '⊞', kat: 'Layout', opis: 'Dvije kolone' },
  { type: 'kolone_3', label: '3 Kolone', emoji: '⊟', kat: 'Layout', opis: 'Tri kolone' },
  { type: 'kartica', label: 'Kartica', emoji: '🃏', kat: 'Layout', opis: 'Card sa sadržajem' },
  { type: 'tekst', label: 'Tekst', emoji: '✍️', kat: 'Osnovno', opis: 'Paragraf teksta' },
  { type: 'slika', label: 'Slika', emoji: '🖼️', kat: 'Osnovno', opis: 'Jedna slika' },
  { type: 'dugme', label: 'Dugme', emoji: '🔘', kat: 'Osnovno', opis: 'Call-to-action dugme' },
  { type: 'separator', label: 'Separator', emoji: '─', kat: 'Osnovno', opis: 'Horizontalna linija' },
  { type: 'spacer', label: 'Spacer', emoji: '↕️', kat: 'Osnovno', opis: 'Prazan prostor' },
  { type: 'video', label: 'Video', emoji: '▶️', kat: 'Osnovno', opis: 'YouTube/Vimeo embed' },
  { type: 'html', label: 'Custom HTML', emoji: '</>', kat: 'Osnovno', opis: 'Vlastiti HTML kod' },
]

const KATEGORIJE = ['Webshop', 'Layout', 'Osnovno']

// ─── Renderer blokova ──────────────────────────────────────────────────────────
function renderBlock(block: Block, device: DeviceType): string {
  const p = block.props
  const isMobile = device === 'mobile'
  const isTablet = device === 'tablet'

  switch (block.type) {
    case 'hero': {
      const h = Math.max(150, parseInt(p.visina) * (isMobile ? 0.6 : isTablet ? 0.8 : 1))
      const bg = p.bgSlika
        ? `linear-gradient(rgba(0,0,0,${p.overlay}),rgba(0,0,0,${p.overlay})),url(${p.bgSlika}) center/cover no-repeat`
        : p.bgBoja
      const align = p.tekstPozicija === 'left' ? 'flex-start' : p.tekstPozicija === 'right' ? 'flex-end' : 'center'
      const fs = Math.max(20, parseInt(p.fontSize) * (isMobile ? 0.65 : 1))
      return `<section style="background:${bg};min-height:${h}px;display:flex;flex-direction:column;justify-content:center;align-items:${align};padding:${isMobile?'32px 20px':'48px 40px'};color:${p.tekstBoja};text-align:${p.tekstPozicija}">
        <h1 style="font-size:${fs}px;font-weight:800;margin:0 0 12px;line-height:1.15;max-width:700px">${p.naslov}</h1>
        ${p.podnaslov ? `<p style="font-size:${isMobile?14:parseInt(p.podnaslovSize)}px;opacity:0.85;margin:0 0 24px;max-width:560px">${p.podnaslov}</p>` : ''}
        ${p.dugmeTekst ? `<a href="${p.dugmeUrl}" style="display:inline-block;background:rgba(255,255,255,0.95);color:${p.bgBoja};padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:15px">${p.dugmeTekst} →</a>` : ''}
      </section>`
    }
    case 'features': {
      const cols = isMobile ? 1 : Math.min(parseInt(p.kolone), isTablet ? 2 : 3)
      const items = [1,2,3].slice(0, parseInt(p.kolone)).map(i => `
        <div style="text-align:center;padding:${p.paddingV>40?'28px':'20px'} 16px;background:${p.kartBoja};border-radius:${p.radius}px;box-shadow:${p.shadow==='true'?'0 2px 12px rgba(0,0,0,0.06)':'none'}">
          <div style="font-size:40px;margin-bottom:12px">${p[`item${i}Ikona`]}</div>
          <h3 style="font-size:16px;font-weight:700;margin:0 0 8px;color:#0d1f1a">${p[`item${i}Naslov`]}</h3>
          <p style="font-size:14px;color:#6b8279;margin:0">${p[`item${i}Opis`]}</p>
        </div>`).join('')
      return `<section style="padding:${p.paddingV}px ${isMobile?20:p.paddingH}px;background:${p.bgBoja}">
        ${p.naslov ? `<h2 style="text-align:center;font-size:28px;font-weight:700;margin:0 0 32px;color:#0d1f1a">${p.naslov}</h2>` : ''}
        <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:20px;max-width:900px;margin:0 auto">${items}</div>
      </section>`
    }
    case 'promo': {
      return `<section style="background:${p.bgBoja};padding:${p.paddingV}px ${isMobile?20:40}px;text-align:center;color:${p.tekstBoja}">
        <h2 style="font-size:${isMobile?22:28}px;font-weight:800;margin:0 0 10px">${p.naslov}</h2>
        ${p.podnaslov ? `<p style="font-size:16px;opacity:0.85;margin:0 0 22px">${p.podnaslov}</p>` : ''}
        ${p.dugmeTekst ? `<a href="${p.dugmeUrl}" style="display:inline-block;background:${p.dugmeBgBoja};color:${p.dugmeTekstBoja};padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none">${p.dugmeTekst}</a>` : ''}
      </section>`
    }
    case 'newsletter': {
      return `<section style="padding:${p.paddingV}px ${isMobile?20:40}px;background:${p.bgBoja};text-align:center">
        <h2 style="font-size:24px;font-weight:700;margin:0 0 8px;color:#0d1f1a">${p.naslov}</h2>
        ${p.podnaslov ? `<p style="font-size:14px;color:#6b8279;margin:0 0 24px">${p.podnaslov}</p>` : ''}
        <div style="display:flex;gap:8px;max-width:400px;margin:0 auto;flex-direction:${isMobile?'column':'row'}">
          <input type="email" placeholder="${p.placeholder}" style="flex:1;padding:10px 14px;border:1px solid #e8edeb;border-radius:8px;font-size:14px"/>
          <button style="padding:10px 20px;background:${p.dugmeBoja};color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap">${p.dugmeTekst}</button>
        </div>
      </section>`
    }
    case 'tekst_slika': {
      const reversed = p.slikaPozicija === 'lijevo'
      const cols = isMobile ? '1fr' : '1fr 1fr'
      const imgEl = p.slikaUrl
        ? `<img src="${p.slikaUrl}" alt="${p.slikaAlt||''}" style="width:100%;height:300px;object-fit:cover;border-radius:16px"/>`
        : `<div style="background:#f0fdf4;border-radius:16px;height:300px;display:flex;align-items:center;justify-content:center;font-size:64px">${p.slikaEmoji}</div>`
      const textEl = `<div>
        <h2 style="font-size:${isMobile?24:p.naslovSize}px;font-weight:800;color:#0d1f1a;margin:0 0 16px;line-height:1.2">${p.naslov}</h2>
        <p style="font-size:${p.tekstSize}px;color:${p.tekstBoja};line-height:1.7;margin:0 0 24px">${p.tekst}</p>
        ${p.dugmeTekst ? `<a href="${p.dugmeUrl}" style="display:inline-block;background:#0F6E56;color:white;padding:12px 24px;border-radius:8px;font-weight:700;text-decoration:none">${p.dugmeTekst}</a>` : ''}
      </div>`
      return `<section style="padding:${p.paddingV}px ${isMobile?20:40}px;background:${p.bgBoja}">
        <div style="display:grid;grid-template-columns:${cols};gap:${isMobile?32:48}px;align-items:center;max-width:1200px;margin:0 auto">
          ${reversed ? imgEl + textEl : textEl + imgEl}
        </div>
      </section>`
    }
    case 'statistike': {
      const cols = isMobile ? 2 : 4
      const stats = [[p.stat1Broj, p.stat1Label],[p.stat2Broj, p.stat2Label],[p.stat3Broj, p.stat3Label],[p.stat4Broj, p.stat4Label]]
      return `<section style="padding:${p.paddingV}px ${isMobile?20:40}px;background:${p.bgBoja};color:${p.tekstBoja}">
        <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:24px;max-width:900px;margin:0 auto;text-align:center">
          ${stats.map(([n,l]) => `<div><div style="font-size:${p.brojSize}px;font-weight:800;margin-bottom:6px">${n}</div><div style="font-size:${p.labelSize}px;opacity:0.8">${l}</div></div>`).join('')}
        </div>
      </section>`
    }
    case 'tekst': {
      return `<div style="padding:${p.paddingV}px ${isMobile?20:p.paddingH}px">
        <p style="font-size:${p.fontSize}px;font-weight:${p.fontWeight};color:${p.boja};text-align:${p.align};line-height:${p.lineHeight};margin:0">${p.sadrzaj}</p>
      </div>`
    }
    case 'slika': {
      if (!p.url) return `<div style="padding:20px;text-align:center;color:#9CA3AF;border:2px dashed #E5E7EB;margin:16px 40px;border-radius:8px">Dodaj URL slike u postavkama</div>`
      return `<div style="text-align:${p.align};padding:0 ${isMobile?20:40}px">
        <img src="${p.url}" alt="${p.alt}" style="width:${p.sirina}%;height:${p.visina}px;object-fit:${p.objectFit};border-radius:${p.radius}px"/>
      </div>`
    }
    case 'dugme': {
      const shadow = p.shadow === 'true' ? `box-shadow:0 4px 14px ${p.bgBoja}40` : ''
      return `<div style="text-align:${p.align};padding:${p.paddingV}px ${isMobile?20:p.paddingH}px">
        <a href="${p.url}" style="display:inline-block;background:${p.bgBoja};color:${p.tekstBoja};padding:${p.paddingV}px ${p.paddingH}px;border-radius:${p.radius}px;font-size:${p.fontSize}px;font-weight:${p.fontWeight};text-decoration:none;${shadow}">${p.tekst}</a>
      </div>`
    }
    case 'separator': {
      return `<div style="padding:${p.marginV}px ${isMobile?20:40}px">
        <hr style="border:none;border-top:${p.visina}px ${p.stil} ${p.boja};margin:0"/>
      </div>`
    }
    case 'spacer': {
      return `<div style="height:${p.visina}px"></div>`
    }
    case 'kategorije_grid': {
      const cols = isMobile ? 2 : Math.min(parseInt(p.kolone), 4)
      const cats = ['Alati', 'Elektro', 'Hidraulika', 'Pneumatika', 'Maziva', 'Sigurnost', 'Vijci', 'Ostalo']
      return `<section style="padding:${p.paddingV}px ${isMobile?20:p.paddingH}px;background:${p.bgBoja}">
        ${p.naslov ? `<h2 style="font-size:24px;font-weight:700;margin:0 0 28px;color:#0d1f1a">${p.naslov}</h2>` : ''}
        <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:12px">
          ${cats.slice(0,parseInt(p.kolone)*2).map(k => `<a href="/?q=${k}" style="display:flex;flex-direction:column;align-items:center;padding:16px 12px;background:${p.katBoja};border-radius:${p.katRadius}px;border:1px solid ${p.katBorder};text-decoration:none">
            <div style="width:44px;height:44px;background:#0F6E56;border-radius:10px;margin-bottom:8px"></div>
            <span style="font-size:13px;font-weight:600;color:#0d1f1a">${k}</span>
          </a>`).join('')}
        </div>
      </section>`
    }
    case 'kartica': {
      return `<div style="background:${p.bgBoja};border-radius:${p.radius}px;padding:${p.padding}px;box-shadow:${p.shadow==='true'?'0 2px 12px rgba(0,0,0,0.08)':'none'}">
        <h3 style="font-size:18px;font-weight:700;color:${p.naslovBoja};margin:0 0 10px">${p.naslov}</h3>
        <p style="font-size:14px;color:${p.tekstBoja};margin:0;line-height:1.6">${p.tekst}</p>
      </div>`
    }
    case 'kolone_2': {
      return `<div style="display:grid;grid-template-columns:${isMobile?'1fr':p.col1Sirina+'% 1fr'};gap:${p.gap}px;padding:${p.paddingV}px ${isMobile?20:p.paddingH}px;background:${p.bgBoja}">
        <div style="min-height:100px;border:2px dashed #E5E7EB;border-radius:8px;padding:16px;color:#9CA3AF;font-size:13px;text-align:center">Kolona 1</div>
        <div style="min-height:100px;border:2px dashed #E5E7EB;border-radius:8px;padding:16px;color:#9CA3AF;font-size:13px;text-align:center">Kolona 2</div>
      </div>`
    }
    case 'kolone_3': {
      return `<div style="display:grid;grid-template-columns:${isMobile?'1fr':isTablet?'1fr 1fr':'1fr 1fr 1fr'};gap:${p.gap}px;padding:${p.paddingV}px ${isMobile?20:p.paddingH}px;background:${p.bgBoja}">
        <div style="min-height:80px;border:2px dashed #E5E7EB;border-radius:8px;padding:16px;color:#9CA3AF;font-size:13px;text-align:center">Kolona 1</div>
        <div style="min-height:80px;border:2px dashed #E5E7EB;border-radius:8px;padding:16px;color:#9CA3AF;font-size:13px;text-align:center">Kolona 2</div>
        ${!isMobile?'<div style="min-height:80px;border:2px dashed #E5E7EB;border-radius:8px;padding:16px;color:#9CA3AF;font-size:13px;text-align:center">Kolona 3</div>':''}
      </div>`
    }
    case 'video': {
      if (!p.url) return `<div style="padding:${p.paddingV}px ${p.paddingH}px;text-align:center;color:#9CA3AF;border:2px dashed #E5E7EB;margin:16px 40px;border-radius:${p.radius}px">Dodaj URL videa u postavkama</div>`
      let embedUrl = p.url
      if (p.tip === 'youtube') {
        const id = p.url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1]
        embedUrl = id ? `https://www.youtube.com/embed/${id}` : p.url
      } else if (p.tip === 'vimeo') {
        const id = p.url.match(/vimeo\.com\/(\d+)/)?.[1]
        embedUrl = id ? `https://player.vimeo.com/video/${id}` : p.url
      }
      return `<div style="padding:${p.paddingV}px ${isMobile?20:p.paddingH}px">
        <iframe src="${embedUrl}" style="width:100%;height:${p.visina}px;border-radius:${p.radius}px;border:none" allowfullscreen></iframe>
      </div>`
    }
    case 'html': {
      return p.sadrzaj || ''
    }
    default:
      return `<div style="padding:20px;background:#FEF2F2;color:#991B1B;border-radius:8px;margin:8px">Nepoznat blok: ${block.type}</div>`
  }
}

// ─── Props panel po tipu ────────────────────────────────────────────────────────
function PropsPanel({ block, onChange }: { block: Block; onChange: (props: BlockProps) => void }) {
  const p = block.props
  const set = (key: string, val: string) => onChange({ ...p, [key]: val })

  const F = ({ label, k, type = 'text', placeholder = '' }: { label: string; k: string; type?: string; placeholder?: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
      <label style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input type={type} value={p[k] || ''} placeholder={placeholder}
        onChange={e => set(k, e.target.value)}
        style={{ padding: '6px 8px', fontSize: '12px', background: '#1F2937', border: '1px solid #374151', borderRadius: '6px', color: '#F9FAFB', fontFamily: 'inherit', outline: 'none' }}
        onFocus={e => e.target.style.borderColor = '#0F6E56'}
        onBlur={e => e.target.style.borderColor = '#374151'}
      />
    </div>
  )

  const TA = ({ label, k }: { label: string; k: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
      <label style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <textarea value={p[k] || ''} onChange={e => set(k, e.target.value)} rows={3}
        style={{ padding: '6px 8px', fontSize: '12px', background: '#1F2937', border: '1px solid #374151', borderRadius: '6px', color: '#F9FAFB', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
        onFocus={e => e.target.style.borderColor = '#0F6E56'}
        onBlur={e => e.target.style.borderColor = '#374151'}
      />
    </div>
  )

  const C = ({ label, k }: { label: string; k: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
      <label style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input type="color" value={p[k] || '#000000'} onChange={e => set(k, e.target.value)}
          style={{ width: '32px', height: '24px', border: '1px solid #374151', borderRadius: '4px', cursor: 'pointer', padding: '1px', background: '#1F2937' }} />
        <input type="text" value={p[k] || ''} onChange={e => set(k, e.target.value)}
          style={{ width: '72px', padding: '4px 6px', fontSize: '11px', fontFamily: 'monospace', background: '#1F2937', border: '1px solid #374151', borderRadius: '4px', color: '#F9FAFB', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = '#0F6E56'}
          onBlur={e => e.target.style.borderColor = '#374151'}
        />
      </div>
    </div>
  )

  const S = ({ label, k, min, max, unit = '' }: { label: string; k: string; min: number; max: number; unit?: string }) => (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <label style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
        <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 700 }}>{p[k]}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={p[k] || min} onChange={e => set(k, e.target.value)}
        style={{ width: '100%', accentColor: '#0F6E56' }} />
    </div>
  )

  const SEL = ({ label, k, opts }: { label: string; k: string; opts: { v: string; l: string }[] }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
      <label style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <select value={p[k] || opts[0]?.v} onChange={e => set(k, e.target.value)}
        style={{ padding: '6px 8px', fontSize: '12px', background: '#1F2937', border: '1px solid #374151', borderRadius: '6px', color: '#F9FAFB', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )

  const T = ({ label, k, desc }: { label: string; k: string; desc?: string }) => {
    const on = p[k] === 'true'
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1F2937', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#D1D5DB' }}>{label}</div>
          {desc && <div style={{ fontSize: '10px', color: '#6B7280' }}>{desc}</div>}
        </div>
        <button onClick={() => set(k, on ? 'false' : 'true')} style={{
          width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', flexShrink: 0,
          background: on ? '#0F6E56' : '#374151', position: 'relative', transition: 'background 0.2s',
        }}>
          <span style={{ position: 'absolute', top: '2px', left: on ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
        </button>
      </div>
    )
  }

  const SEC = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', paddingBottom: '4px', borderBottom: '1px solid #374151' }}>{title}</div>
      {children}
    </div>
  )

  const GR = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>{children}</div>
  )

  switch (block.type) {
    case 'hero':
      return (<>
        <SEC title="Sadržaj">
          <F label="Naslov" k="naslov" />
          <F label="Podnaslov" k="podnaslov" />
          <F label="Tekst dugmeta" k="dugmeTekst" />
          <F label="URL dugmeta" k="dugmeUrl" placeholder="/" />
        </SEC>
        <SEC title="Pozadina">
          <C label="Boja pozadine" k="bgBoja" />
          <F label="URL slike (opcionalno)" k="bgSlika" placeholder="https://..." />
          <S label="Overlay transparentnost" k="overlay" min={0} max={1} />
        </SEC>
        <SEC title="Tekst">
          <C label="Boja teksta" k="tekstBoja" />
          <S label="Veličina naslova" k="fontSize" min={20} max={72} unit="px" />
          <S label="Veličina podnaslov" k="podnaslovSize" min={12} max={32} unit="px" />
          <SEL label="Pozicija teksta" k="tekstPozicija" opts={[{v:'left',l:'Lijevo'},{v:'center',l:'Centar'},{v:'right',l:'Desno'}]} />
        </SEC>
        <SEC title="Dimenzije">
          <S label="Visina banera" k="visina" min={150} max={700} unit="px" />
        </SEC>
      </>)

    case 'features':
      return (<>
        <SEC title="Naslov">
          <F label="Naslov sekcije" k="naslov" />
          <S label="Kolone" k="kolone" min={1} max={4} />
        </SEC>
        <SEC title="Stavka 1">
          <GR><F label="Ikona" k="item1Ikona" /><F label="Naslov" k="item1Naslov" /></GR>
          <F label="Opis" k="item1Opis" />
        </SEC>
        <SEC title="Stavka 2">
          <GR><F label="Ikona" k="item2Ikona" /><F label="Naslov" k="item2Naslov" /></GR>
          <F label="Opis" k="item2Opis" />
        </SEC>
        <SEC title="Stavka 3">
          <GR><F label="Ikona" k="item3Ikona" /><F label="Naslov" k="item3Naslov" /></GR>
          <F label="Opis" k="item3Opis" />
        </SEC>
        <SEC title="Stil">
          <C label="Pozadina sekcije" k="bgBoja" />
          <C label="Pozadina kartice" k="kartBoja" />
          <S label="Radius kartice" k="radius" min={0} max={32} unit="px" />
          <T label="Shadow na karticama" k="shadow" />
          <S label="Padding vertikalni" k="paddingV" min={16} max={120} unit="px" />
        </SEC>
      </>)

    case 'promo':
      return (<>
        <SEC title="Sadržaj">
          <F label="Naslov" k="naslov" />
          <F label="Podnaslov" k="podnaslov" />
          <F label="Tekst dugmeta" k="dugmeTekst" />
          <F label="URL dugmeta" k="dugmeUrl" />
        </SEC>
        <SEC title="Boje">
          <C label="Pozadina" k="bgBoja" />
          <C label="Boja teksta" k="tekstBoja" />
          <C label="Pozadina dugmeta" k="dugmeBgBoja" />
          <C label="Tekst dugmeta" k="dugmeTekstBoja" />
        </SEC>
        <SEC title="Spacing"><S label="Padding vertikalni" k="paddingV" min={16} max={120} unit="px" /></SEC>
      </>)

    case 'newsletter':
      return (<>
        <SEC title="Sadržaj">
          <F label="Naslov" k="naslov" />
          <F label="Podnaslov" k="podnaslov" />
          <F label="Placeholder emaila" k="placeholder" />
          <F label="Tekst dugmeta" k="dugmeTekst" />
        </SEC>
        <SEC title="Stil">
          <C label="Pozadina" k="bgBoja" />
          <C label="Boja dugmeta" k="dugmeBoja" />
          <S label="Padding vertikalni" k="paddingV" min={16} max={120} unit="px" />
        </SEC>
      </>)

    case 'tekst_slika':
      return (<>
        <SEC title="Tekst">
          <F label="Naslov" k="naslov" />
          <TA label="Paragraf" k="tekst" />
          <F label="Tekst dugmeta" k="dugmeTekst" />
          <F label="URL dugmeta" k="dugmeUrl" />
          <S label="Veličina naslova" k="naslovSize" min={18} max={56} unit="px" />
          <S label="Veličina teksta" k="tekstSize" min={12} max={24} unit="px" />
          <C label="Boja teksta" k="tekstBoja" />
        </SEC>
        <SEC title="Slika">
          <F label="URL slike" k="slikaUrl" placeholder="https://..." />
          <F label="Emoji (ako nema slike)" k="slikaEmoji" />
          <SEL label="Pozicija slike" k="slikaPozicija" opts={[{v:'desno',l:'Desno'},{v:'lijevo',l:'Lijevo'}]} />
        </SEC>
        <SEC title="Stil">
          <C label="Pozadina" k="bgBoja" />
          <S label="Padding vertikalni" k="paddingV" min={16} max={120} unit="px" />
        </SEC>
      </>)

    case 'statistike':
      return (<>
        <SEC title="Statistike">
          <GR><F label="Broj 1" k="stat1Broj" /><F label="Label 1" k="stat1Label" /></GR>
          <GR><F label="Broj 2" k="stat2Broj" /><F label="Label 2" k="stat2Label" /></GR>
          <GR><F label="Broj 3" k="stat3Broj" /><F label="Label 3" k="stat3Label" /></GR>
          <GR><F label="Broj 4" k="stat4Broj" /><F label="Label 4" k="stat4Label" /></GR>
        </SEC>
        <SEC title="Stil">
          <C label="Pozadina" k="bgBoja" />
          <C label="Boja teksta" k="tekstBoja" />
          <S label="Veličina broja" k="brojSize" min={20} max={72} unit="px" />
          <S label="Padding vertikalni" k="paddingV" min={16} max={120} unit="px" />
        </SEC>
      </>)

    case 'tekst':
      return (<>
        <SEC title="Sadržaj"><TA label="Tekst" k="sadrzaj" /></SEC>
        <SEC title="Tipografija">
          <S label="Veličina" k="fontSize" min={10} max={72} unit="px" />
          <SEL label="Font weight" k="fontWeight" opts={[{v:'400',l:'Regular'},{v:'500',l:'Medium'},{v:'600',l:'Semibold'},{v:'700',l:'Bold'},{v:'800',l:'Extra Bold'}]} />
          <C label="Boja" k="boja" />
          <SEL label="Poravnanje" k="align" opts={[{v:'left',l:'Lijevo'},{v:'center',l:'Centar'},{v:'right',l:'Desno'},{v:'justify',l:'Justify'}]} />
          <S label="Line height" k="lineHeight" min={1} max={3} />
        </SEC>
        <SEC title="Spacing">
          <S label="Padding vertikalni" k="paddingV" min={0} max={80} unit="px" />
          <S label="Padding horizontalni" k="paddingH" min={0} max={120} unit="px" />
        </SEC>
      </>)

    case 'slika':
      return (<>
        <SEC title="Slika">
          <F label="URL slike" k="url" placeholder="https://..." />
          <F label="Alt tekst" k="alt" placeholder="Opis slike" />
        </SEC>
        <SEC title="Dimenzije">
          <S label="Širina (%)" k="sirina" min={10} max={100} unit="%" />
          <S label="Visina (px)" k="visina" min={50} max={800} unit="px" />
          <S label="Border radius" k="radius" min={0} max={32} unit="px" />
          <SEL label="Object fit" k="objectFit" opts={[{v:'cover',l:'Cover'},{v:'contain',l:'Contain'},{v:'fill',l:'Fill'}]} />
          <SEL label="Poravnanje" k="align" opts={[{v:'left',l:'Lijevo'},{v:'center',l:'Centar'},{v:'right',l:'Desno'}]} />
        </SEC>
      </>)

    case 'dugme':
      return (<>
        <SEC title="Sadržaj">
          <F label="Tekst" k="tekst" />
          <F label="URL" k="url" placeholder="https://..." />
        </SEC>
        <SEC title="Stil">
          <C label="Pozadina" k="bgBoja" />
          <C label="Boja teksta" k="tekstBoja" />
          <S label="Border radius" k="radius" min={0} max={50} unit="px" />
          <S label="Veličina fonta" k="fontSize" min={10} max={24} unit="px" />
          <T label="Shadow" k="shadow" />
        </SEC>
        <SEC title="Spacing">
          <S label="Padding horizontalni" k="paddingH" min={8} max={80} unit="px" />
          <S label="Padding vertikalni" k="paddingV" min={4} max={32} unit="px" />
          <SEL label="Poravnanje" k="align" opts={[{v:'left',l:'Lijevo'},{v:'center',l:'Centar'},{v:'right',l:'Desno'}]} />
        </SEC>
      </>)

    case 'separator':
      return (<>
        <SEC title="Stil">
          <C label="Boja" k="boja" />
          <S label="Debljina" k="visina" min={1} max={10} unit="px" />
          <SEL label="Stil linije" k="stil" opts={[{v:'solid',l:'Solid'},{v:'dashed',l:'Dashed'},{v:'dotted',l:'Dotted'}]} />
          <S label="Margin vertikalni" k="marginV" min={0} max={80} unit="px" />
        </SEC>
      </>)

    case 'spacer':
      return (<SEC title="Dimenzije"><S label="Visina" k="visina" min={8} max={300} unit="px" /></SEC>)

    case 'video':
      return (<>
        <SEC title="Video">
          <F label="URL (YouTube/Vimeo)" k="url" placeholder="https://youtube.com/watch?v=..." />
          <SEL label="Platforma" k="tip" opts={[{v:'youtube',l:'YouTube'},{v:'vimeo',l:'Vimeo'},{v:'direct',l:'Direktan URL'}]} />
        </SEC>
        <SEC title="Dimenzije">
          <S label="Visina" k="visina" min={150} max={800} unit="px" />
          <S label="Border radius" k="radius" min={0} max={32} unit="px" />
          <S label="Padding" k="paddingV" min={0} max={80} unit="px" />
        </SEC>
      </>)

    case 'html':
      return (<SEC title="HTML"><TA label="HTML kod" k="sadrzaj" /></SEC>)

    case 'kartica':
      return (<>
        <SEC title="Sadržaj">
          <F label="Naslov" k="naslov" />
          <TA label="Tekst" k="tekst" />
        </SEC>
        <SEC title="Stil">
          <C label="Pozadina" k="bgBoja" />
          <C label="Boja naslova" k="naslovBoja" />
          <C label="Boja teksta" k="tekstBoja" />
          <S label="Border radius" k="radius" min={0} max={32} unit="px" />
          <S label="Padding" k="padding" min={8} max={64} unit="px" />
          <T label="Shadow" k="shadow" />
        </SEC>
      </>)

    case 'kolone_2':
      return (<>
        <SEC title="Kolone">
          <S label="Širina prve kolone (%)" k="col1Sirina" min={20} max={80} unit="%" />
          <S label="Gap između kolona" k="gap" min={0} max={80} unit="px" />
        </SEC>
        <SEC title="Stil">
          <C label="Pozadina" k="bgBoja" />
          <S label="Padding vertikalni" k="paddingV" min={0} max={120} unit="px" />
          <S label="Padding horizontalni" k="paddingH" min={0} max={80} unit="px" />
        </SEC>
      </>)

    case 'kolone_3':
      return (<>
        <SEC title="Kolone">
          <S label="Gap između kolona" k="gap" min={0} max={80} unit="px" />
        </SEC>
        <SEC title="Stil">
          <C label="Pozadina" k="bgBoja" />
          <S label="Padding vertikalni" k="paddingV" min={0} max={120} unit="px" />
          <S label="Padding horizontalni" k="paddingH" min={0} max={80} unit="px" />
        </SEC>
      </>)

    case 'kategorije_grid':
      return (<>
        <SEC title="Sadržaj">
          <F label="Naslov sekcije" k="naslov" />
          <S label="Kolone" k="kolone" min={2} max={6} />
        </SEC>
        <SEC title="Stil">
          <C label="Pozadina sekcije" k="bgBoja" />
          <C label="Pozadina kartice" k="katBoja" />
          <C label="Boja bordera" k="katBorder" />
          <S label="Radius kartice" k="katRadius" min={0} max={24} unit="px" />
          <S label="Padding vertikalni" k="paddingV" min={16} max={120} unit="px" />
        </SEC>
      </>)

    default:
      return <div style={{ color: '#6B7280', fontSize: '12px', padding: '8px' }}>Nema postavki za ovaj blok.</div>
  }
}

// ─── Glavni Page Builder ────────────────────────────────────────────────────────
export default function PageBuilderPage() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [panelTab, setPanelTab] = useState<PanelTab>('blokovi')
  const [history, setHistory] = useState<Block[][]>([])
  const [future, setFuture] = useState<Block[][]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dragBlockType, setDragBlockType] = useState<string | null>(null)
  const dragIdRef = useRef<string | null>(null)

  // ─── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('postavke').select('vrijednost').eq('kljuc', 'craft_builder_json').single()
      .then(({ data }) => {
        if (data?.vrijednost) {
          try { setBlocks(JSON.parse(data.vrijednost)) } catch {}
        }
        setLoading(false)
      })
  }, [])

  // ─── History helpers ──────────────────────────────────────────────────────
  const pushHistory = useCallback((prev: Block[]) => {
    setHistory(h => [...h.slice(-30), prev])
    setFuture([])
  }, [])

  const updateBlocks = useCallback((newBlocks: Block[], prevBlocks: Block[]) => {
    pushHistory(prevBlocks)
    setBlocks(newBlocks)
  }, [pushHistory])

  function undo() {
    if (!history.length) return
    setFuture(f => [blocks, ...f])
    setBlocks(history[history.length - 1])
    setHistory(h => h.slice(0, -1))
  }

  function redo() {
    if (!future.length) return
    setHistory(h => [...h, blocks])
    setBlocks(future[0])
    setFuture(f => f.slice(1))
  }

  // ─── Block operations ─────────────────────────────────────────────────────
  function addBlock(type: string, afterId?: string) {
    const newBlock: Block = {
      id: `${type}_${Date.now()}`,
      type,
      props: { ...BLOCK_DEFAULTS[type] },
    }
    const prev = blocks
    if (afterId) {
      const idx = blocks.findIndex(b => b.id === afterId)
      const next = [...blocks]
      next.splice(idx + 1, 0, newBlock)
      updateBlocks(next, prev)
    } else {
      updateBlocks([...blocks, newBlock], prev)
    }
    setSelectedId(newBlock.id)
    setPanelTab('stilovi')
  }

  function removeBlock(id: string) {
    updateBlocks(blocks.filter(b => b.id !== id), blocks)
    if (selectedId === id) setSelectedId(null)
  }

  function duplicateBlock(id: string) {
    const block = blocks.find(b => b.id === id)
    if (!block) return
    const copy: Block = { ...block, id: `${block.type}_${Date.now()}`, props: { ...block.props } }
    const idx = blocks.findIndex(b => b.id === id)
    const next = [...blocks]
    next.splice(idx + 1, 0, copy)
    updateBlocks(next, blocks)
    setSelectedId(copy.id)
  }

  function moveBlock(id: string, dir: 'up' | 'down') {
    const idx = blocks.findIndex(b => b.id === id)
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === blocks.length - 1)) return
    const next = [...blocks]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    updateBlocks(next, blocks)
  }

  function updateProps(id: string, props: BlockProps) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, props } : b))
  }

  // ─── Drag & drop ──────────────────────────────────────────────────────────
  function handleDragStart(e: React.DragEvent, blockId: string) {
    dragIdRef.current = blockId
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragStartNew(e: React.DragEvent, type: string) {
    setDragBlockType(type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    setDragOverId(id)
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    setDragOverId(null)

    if (dragBlockType) {
      // Novi blok iz panela
      const newBlock: Block = {
        id: `${dragBlockType}_${Date.now()}`,
        type: dragBlockType,
        props: { ...BLOCK_DEFAULTS[dragBlockType] },
      }
      const idx = blocks.findIndex(b => b.id === targetId)
      const next = [...blocks]
      next.splice(idx + 1, 0, newBlock)
      updateBlocks(next, blocks)
      setSelectedId(newBlock.id)
      setPanelTab('stilovi')
      setDragBlockType(null)
      return
    }

    const srcId = dragIdRef.current
    if (!srcId || srcId === targetId) return
    const srcIdx = blocks.findIndex(b => b.id === srcId)
    const tgtIdx = blocks.findIndex(b => b.id === targetId)
    const next = [...blocks]
    const [moved] = next.splice(srcIdx, 1)
    next.splice(tgtIdx, 0, moved)
    updateBlocks(next, blocks)
    dragIdRef.current = null
  }

  // ─── Save ─────────────────────────────────────────────────────────────────
  async function save() {
    setSaving(true)
    await supabase.from('postavke').upsert(
      [{ kljuc: 'craft_builder_json', vrijednost: JSON.stringify(blocks) }],
      { onConflict: 'kljuc' }
    )
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // ─── Render canvas HTML ───────────────────────────────────────────────────
  const canvasHtml = blocks.map(b => renderBlock(b, device)).join('\n')

  const selectedBlock = blocks.find(b => b.id === selectedId)
  const canvasWidth = device === 'mobile' ? '390px' : device === 'tablet' ? '768px' : '100%'

  // ─── Slojevi panel ────────────────────────────────────────────────────────
  const SlojeviPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px' }}>
      {blocks.length === 0 && (
        <div style={{ color: '#6B7280', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
          Nema blokova. Dodaj blok iz taba "Blokovi".
        </div>
      )}
      {blocks.map((b, i) => {
        const def = BLOCK_DEFS.find(d => d.type === b.type)
        const isSelected = selectedId === b.id
        return (
          <div key={b.id}
            draggable
            onDragStart={e => handleDragStart(e, b.id)}
            onDragOver={e => handleDragOver(e, b.id)}
            onDrop={e => handleDrop(e, b.id)}
            onClick={() => { setSelectedId(b.id); setPanelTab('stilovi') }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 8px',
              borderRadius: '6px', cursor: 'pointer', transition: 'all 0.1s',
              background: isSelected ? '#0B2218' : dragOverId === b.id ? '#1a2e1a' : 'transparent',
              border: isSelected ? '1px solid #0F6E56' : '1px solid transparent',
            }}
          >
            <GripVertical size={12} style={{ color: '#4B5563', flexShrink: 0, cursor: 'grab' }} />
            <span style={{ fontSize: '14px', flexShrink: 0 }}>{def?.emoji}</span>
            <span style={{ flex: 1, fontSize: '11px', color: isSelected ? '#34D399' : '#D1D5DB', fontWeight: isSelected ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {def?.label}
            </span>
            <div style={{ display: 'flex', gap: '2px', opacity: 0 }} className="layer-actions">
              <button onClick={e => { e.stopPropagation(); moveBlock(b.id, 'up') }} disabled={i === 0}
                style={{ padding: '2px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <ChevronUp size={11} />
              </button>
              <button onClick={e => { e.stopPropagation(); moveBlock(b.id, 'down') }} disabled={i === blocks.length - 1}
                style={{ padding: '2px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <ChevronDown size={11} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#111827', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '32px' }}>🧱</div>
      <div style={{ color: '#F9FAFB', fontSize: '14px', fontWeight: 600 }}>Učitavam Page Builder...</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0F172A', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>

      {/* ─── Toolbar ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px', height: '48px', background: '#0B0F19', borderBottom: '1px solid #1E293B', flexShrink: 0, zIndex: 100 }}>
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280', textDecoration: 'none', fontSize: '12px' }}>
          <ChevronLeft size={14} /> Admin
        </Link>
        <div style={{ width: '1px', height: '16px', background: '#1E293B' }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#F9FAFB' }}>🧱 Page Builder</span>
        <span style={{ fontSize: '10px', color: '#34D399', background: '#0B2218', padding: '2px 8px', borderRadius: '100px', border: '1px solid #0F6E56' }}>Craft.js</span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Undo/Redo */}
          <button onClick={undo} disabled={!history.length} title="Undo (Ctrl+Z)"
            style={{ padding: '6px', background: 'none', border: '1px solid #1E293B', borderRadius: '6px', cursor: history.length ? 'pointer' : 'not-allowed', color: history.length ? '#9CA3AF' : '#374151', display: 'flex', alignItems: 'center' }}>
            <Undo2 size={13} />
          </button>
          <button onClick={redo} disabled={!future.length} title="Redo"
            style={{ padding: '6px', background: 'none', border: '1px solid #1E293B', borderRadius: '6px', cursor: future.length ? 'pointer' : 'not-allowed', color: future.length ? '#9CA3AF' : '#374151', display: 'flex', alignItems: 'center' }}>
            <Redo2 size={13} />
          </button>

          <div style={{ width: '1px', height: '16px', background: '#1E293B' }} />

          {/* Device */}
          <div style={{ display: 'flex', background: '#1E293B', borderRadius: '6px', padding: '2px', gap: '1px' }}>
            {([['desktop','🖥️','Desktop'],['tablet','📱','Tablet'],['mobile','📲','Mobile']] as const).map(([d, e, label]) => (
              <button key={d} onClick={() => setDevice(d)} title={label}
                style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px', background: device === d ? '#0F6E56' : 'transparent', color: 'white', transition: 'background 0.15s' }}>
                {e}
              </button>
            ))}
          </div>

          {/* Preview */}
          <button onClick={() => setPreviewMode(!previewMode)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, border: '1px solid #1E293B', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', background: previewMode ? '#0F6E56' : 'transparent', color: previewMode ? 'white' : '#9CA3AF' }}>
            {previewMode ? <EyeOff size={13} /> : <Eye size={13} />}
            {previewMode ? 'Izlaz' : 'Preview'}
          </button>

          {/* Save */}
          <button onClick={save} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 16px', fontSize: '12px', fontWeight: 700, border: 'none', borderRadius: '7px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', background: saved ? '#059669' : '#0F6E56', color: 'white', boxShadow: '0 0 12px rgba(15,110,86,0.3)' }}>
            <Save size={12} />{saving ? 'Čuvam...' : saved ? '✓ Sačuvano' : 'Sačuvaj'}
          </button>
        </div>
      </div>

      {/* ─── Main area ─── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ─── Left panel ─── */}
        {!previewMode && (
          <div style={{ width: '220px', background: '#0B0F19', borderRight: '1px solid #1E293B', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            {/* Panel tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1E293B', flexShrink: 0 }}>
              {([['blokovi','Blokovi'],['slojevi','Slojevi'],['stilovi','Postavke']] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => setPanelTab(tab)}
                  style={{ flex: 1, padding: '10px 4px', fontSize: '10px', fontWeight: panelTab === tab ? 700 : 400, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: panelTab === tab ? '#111827' : 'transparent', color: panelTab === tab ? '#34D399' : '#6B7280', borderBottom: panelTab === tab ? '2px solid #0F6E56' : '2px solid transparent', transition: 'all 0.1s', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Blokovi tab */}
              {panelTab === 'blokovi' && (
                <div>
                  {KATEGORIJE.map(kat => (
                    <div key={kat}>
                      <div style={{ padding: '8px 10px 4px', fontSize: '9px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{kat}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '0 8px 8px' }}>
                        {BLOCK_DEFS.filter(b => b.kat === kat).map(def => (
                          <div key={def.type}
                            draggable
                            onDragStart={e => handleDragStartNew(e, def.type)}
                            onDragEnd={() => setDragBlockType(null)}
                            onClick={() => addBlock(def.type)}
                            title={def.opis}
                            style={{ padding: '8px 6px', background: '#111827', border: '1px solid #1E293B', borderRadius: '8px', cursor: 'grab', textAlign: 'center', transition: 'all 0.15s', userSelect: 'none' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#0F6E56'; (e.currentTarget as HTMLElement).style.background = '#0B2218' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1E293B'; (e.currentTarget as HTMLElement).style.background = '#111827' }}
                          >
                            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{def.emoji}</div>
                            <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 500, lineHeight: 1.2 }}>{def.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Slojevi tab */}
              {panelTab === 'slojevi' && <SlojeviPanel />}

              {/* Stilovi/Postavke tab */}
              {panelTab === 'stilovi' && (
                <div style={{ padding: '10px' }}>
                  {selectedBlock ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #1E293B' }}>
                        <span style={{ fontSize: '16px' }}>{BLOCK_DEFS.find(d => d.type === selectedBlock.type)?.emoji}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#F9FAFB' }}>{BLOCK_DEFS.find(d => d.type === selectedBlock.type)?.label}</span>
                      </div>
                      <PropsPanel block={selectedBlock} onChange={props => updateProps(selectedBlock.id, props)} />
                    </>
                  ) : (
                    <div style={{ color: '#4B5563', fontSize: '12px', textAlign: 'center', padding: '20px 10px', lineHeight: 1.6 }}>
                      Klikni na blok u canvasu ili u sloju za uređivanje postavki
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Canvas ─── */}
        <div style={{ flex: 1, overflow: 'auto', background: '#1E293B', display: 'flex', justifyContent: 'center', padding: previewMode ? '0' : '16px' }}>
          <div style={{ width: canvasWidth, maxWidth: '100%', background: 'white', boxShadow: previewMode ? 'none' : '0 0 40px rgba(0,0,0,0.4)', borderRadius: previewMode ? '0' : '8px', overflow: 'hidden', position: 'relative', minHeight: '100%' }}>

            {blocks.length === 0 && !previewMode && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px', color: '#9CA3AF', padding: '40px' }}>
                <div style={{ fontSize: '48px' }}>🧱</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>Canvas je prazan</div>
                <div style={{ fontSize: '14px', textAlign: 'center', lineHeight: 1.6 }}>Klikni na blok u lijevom panelu ili ga prevuci ovdje da počneš graditi stranicu</div>
                <button onClick={() => addBlock('hero')} style={{ padding: '10px 24px', background: '#0F6E56', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'inherit' }}>
                  + Dodaj Hero Banner
                </button>
              </div>
            )}

            {blocks.map((block, i) => {
              const isSelected = selectedId === block.id && !previewMode
              const html = renderBlock(block, device)

              return (
                <div key={block.id}
                  onDragOver={e => handleDragOver(e, block.id)}
                  onDrop={e => handleDrop(e, block.id)}
                  style={{
                    position: 'relative',
                    outline: isSelected ? '2px solid #0F6E56' : dragOverId === block.id ? '2px dashed #34D399' : 'none',
                    outlineOffset: '-2px',
                    transition: 'outline 0.1s',
                  }}
                  onClick={() => { if (!previewMode) { setSelectedId(block.id); setPanelTab('stilovi') } }}
                >
                  {/* Block toolbar */}
                  {isSelected && !previewMode && (
                    <div style={{ position: 'absolute', top: '4px', right: '4px', zIndex: 20, display: 'flex', gap: '3px', background: '#0F6E56', borderRadius: '6px', padding: '3px' }}>
                      <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'up') }} disabled={i === 0}
                        style={{ padding: '4px', background: 'none', border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer', color: 'white', opacity: i === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center' }} title="Pomjeri gore">
                        <ChevronUp size={13} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'down') }} disabled={i === blocks.length - 1}
                        style={{ padding: '4px', background: 'none', border: 'none', cursor: i === blocks.length - 1 ? 'not-allowed' : 'pointer', color: 'white', opacity: i === blocks.length - 1 ? 0.3 : 1, display: 'flex', alignItems: 'center' }} title="Pomjeri dolje">
                        <ChevronDown size={13} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); duplicateBlock(block.id) }}
                        style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }} title="Duplikat">
                        <Copy size={13} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); removeBlock(block.id) }}
                        style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', display: 'flex', alignItems: 'center' }} title="Obriši">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}

                  {/* Label */}
                  {isSelected && !previewMode && (
                    <div style={{ position: 'absolute', top: '4px', left: '4px', zIndex: 20, background: '#0F6E56', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                      {BLOCK_DEFS.find(d => d.type === block.type)?.emoji} {BLOCK_DEFS.find(d => d.type === block.type)?.label}
                    </div>
                  )}

                  {/* Rendered block */}
                  <div dangerouslySetInnerHTML={{ __html: html }} />

                  {/* Add block between */}
                  {!previewMode && (
                    <div style={{ position: 'absolute', bottom: '-14px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, opacity: 0, transition: 'opacity 0.15s' }}
                      className="add-between-btn">
                      <button onClick={e => { e.stopPropagation(); addBlock('spacer', block.id) }}
                        style={{ padding: '3px 12px', background: '#0F6E56', color: 'white', border: 'none', borderRadius: '100px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(15,110,86,0.4)' }}>
                        <Plus size={11} /> Dodaj blok
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Add block at end */}
            {blocks.length > 0 && !previewMode && (
              <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px dashed #E5E7EB' }}>
                <button onClick={() => setPanelTab('blokovi')}
                  style={{ padding: '8px 20px', background: 'transparent', color: '#9CA3AF', border: '1px dashed #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
                  + Dodaj blok
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .layer-actions { display: none !important; }
        div:hover > .layer-actions { display: flex !important; opacity: 1 !important; }
        div:hover > .add-between-btn { opacity: 1 !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0B0F19; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #374151; }
      `}</style>
    </div>
  )
}

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Save, ChevronLeft, Undo2, Redo2, Eye, EyeOff, Trash2, Copy,
  ChevronUp, ChevronDown, Plus, GripVertical, X, Download, Upload,
  FileText, FolderOpen, LayoutTemplate, Layers, Settings2,
  Sparkles, Package, Image as ImageIcon,
} from 'lucide-react'
import NextLink from 'next/link'

// ─── Tipovi ────────────────────────────────────────────────────────────────────
type DeviceType = 'desktop' | 'tablet' | 'mobile'
type PanelTab = 'blokovi' | 'slojevi' | 'stilovi' | 'stranice'

interface Block {
  id: string
  type: string
  props: Record<string, any>
  children?: Block[]
}

interface Stranica {
  id: string
  naziv: string
  slug: string
  blocks: Block[]
}

// ─── Default props ─────────────────────────────────────────────────────────────
const BLOCK_DEFAULTS: Record<string, Record<string, any>> = {
  hero: { naslov: 'Dobrodošli u naš webshop', podnaslov: 'Profesionalna roba za vaše poslovanje', dugmeTekst: 'Pregledaj katalog', dugmeUrl: '/', bgBoja: '#0F6E56', bgSlika: '', tekstBoja: '#ffffff', visina: '400', tekstPozicija: 'center', overlay: '0.3', fontSize: '42', podnaslovSize: '18' },
  features: { naslov: 'Zašto mi?', item1Ikona: '🚀', item1Naslov: 'Brza isporuka', item1Opis: 'Naredni radni dan', item2Ikona: '💎', item2Naslov: 'Kvalitet', item2Opis: 'Provjereni dobavljači', item3Ikona: '🔒', item3Naslov: 'Sigurnost', item3Opis: 'Zaštićene transakcije', kolone: '3', bgBoja: '#f8fafa', paddingV: '64', paddingH: '40', kartBoja: '#ffffff', radius: '14', shadow: 'true' },
  promo: { naslov: 'Posebna ponuda za B2B partnere', podnaslov: 'Kontaktirajte nas za individualne cijene', dugmeTekst: 'Kontaktiraj nas', dugmeUrl: '#', bgBoja: '#0F6E56', tekstBoja: '#ffffff', paddingV: '48', dugmeBgBoja: '#ffffff', dugmeTekstBoja: '#0F6E56' },
  newsletter: { naslov: 'Ostanite informisani', podnaslov: 'Primajte obavijesti o novim artiklima', placeholder: 'vas@email.ba', dugmeTekst: 'Prijavi se', bgBoja: '#ffffff', paddingV: '64', dugmeBoja: '#0F6E56' },
  tekst_slika: { naslov: 'Vaš pouzdan B2B partner', tekst: 'Nudimo širok asortiman profesionalne robe.', dugmeTekst: 'Saznaj više', dugmeUrl: '#', slikaUrl: '', slikaEmoji: '🏭', slikaPozicija: 'desno', bgBoja: '#ffffff', paddingV: '64', naslovSize: '32', tekstSize: '16', tekstBoja: '#6b8279' },
  statistike: { stat1Broj: '5000+', stat1Label: 'Artikala', stat2Broj: '200+', stat2Label: 'Partnera', stat3Broj: '15+', stat3Label: 'Godina', stat4Broj: '24h', stat4Label: 'Isporuka', bgBoja: '#0F6E56', tekstBoja: '#ffffff', paddingV: '48', brojSize: '40', labelSize: '14' },
  tekst: { sadrzaj: 'Klikni da urediš tekst...', fontSize: '16', fontWeight: '400', boja: '#111827', align: 'left', lineHeight: '1.7', paddingV: '16', paddingH: '40' },
  slika: { url: '', alt: '', sirina: '100', visina: '300', radius: '0', objectFit: 'cover', align: 'center' },
  galerija: { slike: '', kolone: '3', gap: '8', radius: '8', visina: '220', paddingV: '32', paddingH: '40', lightbox: 'true' },
  dugme: { tekst: 'Klikni ovdje', url: '#', bgBoja: '#0F6E56', tekstBoja: '#ffffff', paddingH: '24', paddingV: '12', radius: '8', fontSize: '15', fontWeight: '600', align: 'center', shadow: 'true' },
  separator: { visina: '1', boja: '#e8edeb', marginV: '32', stil: 'solid' },
  spacer: { visina: '40' },
  kolone_2: { bgBoja: '#ffffff', gap: '32', paddingV: '48', paddingH: '40', col1Sirina: '50' },
  kolone_3: { bgBoja: '#ffffff', gap: '24', paddingV: '48', paddingH: '40' },
  kartica: { naslov: 'Kartica naslov', tekst: 'Opis kartice ide ovdje.', bgBoja: '#ffffff', radius: '14', shadow: 'true', padding: '24', naslovBoja: '#0d1f1a', tekstBoja: '#6b8279' },
  kategorije_grid: { naslov: 'Kategorije', kolone: '4', bgBoja: '#f8fafa', paddingV: '48', paddingH: '40', katBoja: '#ffffff', katRadius: '12', katBorder: '#e8edeb' },
  akcije: { naslov: 'Trenutne akcije', kolone: '4', bgBoja: '#ffffff', paddingV: '48', paddingH: '40', kartRadius: '12', dugmeTekst: 'Dodaj u korpu', dugmeBoja: '#0F6E56' },
  video: { url: '', tip: 'youtube', visina: '400', radius: '12', paddingV: '32', paddingH: '40' },
  html: { sadrzaj: '<div style="padding:32px;text-align:center;color:#6b8279">Custom HTML blok</div>' },
  animirani_tekst: { naslov: 'Dobrodošli!', animacija: 'fadeIn', trajanje: '1', boja: '#0d1f1a', fontSize: '36', align: 'center', paddingV: '48' },
}

const BLOCK_DEFS = [
  { type: 'hero', label: 'Hero Banner', emoji: '🖼️', kat: 'Webshop', opis: 'Velika slika/boja s naslovom' },
  { type: 'features', label: 'Prednosti', emoji: '⭐', kat: 'Webshop', opis: '3-4 prednosti s ikonama' },
  { type: 'promo', label: 'Promo Banner', emoji: '📣', kat: 'Webshop', opis: 'CTA banner u boji' },
  { type: 'newsletter', label: 'Newsletter', emoji: '📧', kat: 'Webshop', opis: 'Email prijava forma' },
  { type: 'kategorije_grid', label: 'Kategorije Grid', emoji: '📁', kat: 'Webshop', opis: 'Grid kategorija' },
  { type: 'statistike', label: 'Statistike', emoji: '📊', kat: 'Webshop', opis: '4 broja/statistike' },
  { type: 'akcije', label: 'Akcijski artikli', emoji: '🔥', kat: 'Webshop', opis: 'Artikli na akciji iz baze' },
  { type: 'tekst_slika', label: 'Tekst + Slika', emoji: '📝', kat: 'Layout', opis: '2 kolone tekst i slika' },
  { type: 'kolone_2', label: '2 Kolone', emoji: '⊞', kat: 'Layout', opis: 'Dvije kolone s blokovima' },
  { type: 'kolone_3', label: '3 Kolone', emoji: '⊟', kat: 'Layout', opis: 'Tri kolone s blokovima' },
  { type: 'kartica', label: 'Kartica', emoji: '🃏', kat: 'Layout', opis: 'Card sa sadržajem' },
  { type: 'tekst', label: 'Tekst', emoji: '✍️', kat: 'Osnovno', opis: 'Paragraf teksta' },
  { type: 'slika', label: 'Slika', emoji: '🖼️', kat: 'Osnovno', opis: 'Jedna slika' },
  { type: 'galerija', label: 'Galerija', emoji: '🎨', kat: 'Osnovno', opis: 'Grid slika s lightboxom' },
  { type: 'animirani_tekst', label: 'Animirani tekst', emoji: '✨', kat: 'Osnovno', opis: 'Naslov s CSS animacijom' },
  { type: 'dugme', label: 'Dugme', emoji: '🔘', kat: 'Osnovno', opis: 'Call-to-action dugme' },
  { type: 'separator', label: 'Separator', emoji: '─', kat: 'Osnovno', opis: 'Horizontalna linija' },
  { type: 'spacer', label: 'Spacer', emoji: '↕️', kat: 'Osnovno', opis: 'Prazan prostor' },
  { type: 'video', label: 'Video', emoji: '▶️', kat: 'Osnovno', opis: 'YouTube/Vimeo embed' },
  { type: 'html', label: 'Custom HTML', emoji: '</>', kat: 'Osnovno', opis: 'Vlastiti HTML kod' },
]

const KATEGORIJE_BLOKOVA = ['Webshop', 'Layout', 'Osnovno']

// ─── Predlošci stranica ────────────────────────────────────────────────────────
const PREDLOSCI = [
  {
    id: 'homepage_minimal', naziv: 'Homepage Minimal', emoji: '📋',
    opis: 'Čist homepage: Hero + Prednosti + Katalog',
    blocks: [
      { id: 'hero_1', type: 'hero', props: { ...BLOCK_DEFAULTS.hero } },
      { id: 'features_1', type: 'features', props: { ...BLOCK_DEFAULTS.features } },
    ]
  },
  {
    id: 'homepage_rs', naziv: 'R&S stil', emoji: '🏢',
    opis: 'Kao ris.ba: Hero + Akcije + Kategorije + Statistike',
    blocks: [
      { id: 'hero_1', type: 'hero', props: { ...BLOCK_DEFAULTS.hero, bgBoja: '#1e3a5f', naslov: 'Vaš B2B partner', fontSize: '48' } },
      { id: 'akcije_1', type: 'akcije', props: { ...BLOCK_DEFAULTS.akcije } },
      { id: 'kategorije_1', type: 'kategorije_grid', props: { ...BLOCK_DEFAULTS.kategorije_grid } },
      { id: 'statistike_1', type: 'statistike', props: { ...BLOCK_DEFAULTS.statistike } },
    ]
  },
  {
    id: 'landing_promo', naziv: 'Landing / Promo', emoji: '🎯',
    opis: 'Hero velik + Prednosti + Promo banner + Newsletter',
    blocks: [
      { id: 'hero_1', type: 'hero', props: { ...BLOCK_DEFAULTS.hero, visina: '500', fontSize: '52' } },
      { id: 'features_1', type: 'features', props: { ...BLOCK_DEFAULTS.features } },
      { id: 'tekst_slika_1', type: 'tekst_slika', props: { ...BLOCK_DEFAULTS.tekst_slika } },
      { id: 'promo_1', type: 'promo', props: { ...BLOCK_DEFAULTS.promo } },
      { id: 'newsletter_1', type: 'newsletter', props: { ...BLOCK_DEFAULTS.newsletter } },
    ]
  },
  {
    id: 'about', naziv: 'O nama', emoji: '🏭',
    opis: 'Stranica o firmi: Statistike + Tekst+Slika + Features',
    blocks: [
      { id: 'hero_1', type: 'hero', props: { ...BLOCK_DEFAULTS.hero, naslov: 'O nama', podnaslov: 'Vaš pouzdani partner od 2010. godine', visina: '280', dugmeTekst: '' } },
      { id: 'statistike_1', type: 'statistike', props: { ...BLOCK_DEFAULTS.statistike } },
      { id: 'tekst_slika_1', type: 'tekst_slika', props: { ...BLOCK_DEFAULTS.tekst_slika } },
      { id: 'features_1', type: 'features', props: { ...BLOCK_DEFAULTS.features } },
    ]
  },
  {
    id: 'kontakt', naziv: 'Kontakt', emoji: '📞',
    opis: 'Kontakt stranica: Hero + Info + HTML forma',
    blocks: [
      { id: 'hero_1', type: 'hero', props: { ...BLOCK_DEFAULTS.hero, naslov: 'Kontaktirajte nas', podnaslov: 'Odgovaramo u roku od 24 sata', visina: '250', dugmeTekst: '' } },
      { id: 'statistike_1', type: 'statistike', props: { ...BLOCK_DEFAULTS.statistike, bgBoja: '#f8fafa', tekstBoja: '#0d1f1a', stat1Broj: 'Pon-Pet', stat1Label: '08:00-16:00', stat2Broj: '+387', stat2Label: 'Telefon', stat3Broj: '@email', stat3Label: 'Email', stat4Broj: '24h', stat4Label: 'Odgovor' } },
      { id: 'html_1', type: 'html', props: { sadrzaj: '<div style="max-width:600px;margin:0 auto;padding:48px 24px"><h2 style="font-size:24px;font-weight:700;margin-bottom:24px">Pošalji poruku</h2><form style="display:flex;flex-direction:column;gap:12px"><input placeholder="Vaše ime" style="padding:10px 14px;border:1px solid #e8edeb;border-radius:8px;font-size:14px"/><input type="email" placeholder="Email" style="padding:10px 14px;border:1px solid #e8edeb;border-radius:8px;font-size:14px"/><textarea placeholder="Poruka" rows="4" style="padding:10px 14px;border:1px solid #e8edeb;border-radius:8px;font-size:14px;resize:vertical"></textarea><button type="submit" style="padding:12px;background:#0F6E56;color:white;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer">Pošalji</button></form></div>' } },
    ]
  },
]

// ─── Block renderer ────────────────────────────────────────────────────────────
function renderBlockHTML(block: Block, device: DeviceType = 'desktop', isEditor = false): string {
  const p = block.props
  const isMobile = device === 'mobile'
  const isTablet = device === 'tablet'

  const clickAttr = isEditor ? `data-block-id="${block.id}" style="cursor:default"` : ''

  switch (block.type) {
    case 'hero': {
      const h = Math.max(150, parseInt(p.visina) * (isMobile ? 0.6 : 1))
      const bg = p.bgSlika
        ? `linear-gradient(rgba(0,0,0,${p.overlay}),rgba(0,0,0,${p.overlay})),url(${p.bgSlika}) center/cover no-repeat`
        : p.bgBoja
      const align = p.tekstPozicija === 'left' ? 'flex-start' : p.tekstPozicija === 'right' ? 'flex-end' : 'center'
      const fs = Math.max(20, parseInt(p.fontSize) * (isMobile ? 0.65 : 1))
      return `<section ${clickAttr} style="background:${bg};min-height:${h}px;display:flex;flex-direction:column;justify-content:center;align-items:${align};padding:${isMobile ? '32px 20px' : '48px 40px'};color:${p.tekstBoja};text-align:${p.tekstPozicija}">
        <h1 style="font-size:${fs}px;font-weight:800;margin:0 0 12px;line-height:1.15;max-width:700px">${p.naslov}</h1>
        ${p.podnaslov ? `<p style="font-size:${isMobile ? 14 : parseInt(p.podnaslovSize)}px;opacity:0.85;margin:0 0 24px;max-width:560px">${p.podnaslov}</p>` : ''}
        ${p.dugmeTekst ? `<a href="${p.dugmeUrl}" style="display:inline-block;background:rgba(255,255,255,0.95);color:${p.bgBoja};padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:15px">${p.dugmeTekst} →</a>` : ''}
      </section>`
    }
    case 'features': {
      const cols = isMobile ? 1 : Math.min(parseInt(p.kolone), isTablet ? 2 : parseInt(p.kolone))
      const items = [1, 2, 3, 4].slice(0, parseInt(p.kolone)).map(i => `
        <div style="text-align:center;padding:${isMobile ? '20px 12px' : '28px 16px'};background:${p.kartBoja};border-radius:${p.radius}px;box-shadow:${p.shadow === 'true' ? '0 2px 12px rgba(0,0,0,0.06)' : 'none'}">
          <div style="font-size:40px;margin-bottom:12px">${p[`item${i}Ikona`] || ''}</div>
          <h3 style="font-size:16px;font-weight:700;margin:0 0 8px;color:#0d1f1a">${p[`item${i}Naslov`] || ''}</h3>
          <p style="font-size:14px;color:#6b8279;margin:0">${p[`item${i}Opis`] || ''}</p>
        </div>`).join('')
      return `<section ${clickAttr} style="padding:${p.paddingV}px ${isMobile ? 20 : p.paddingH}px;background:${p.bgBoja}">
        ${p.naslov ? `<h2 style="text-align:center;font-size:28px;font-weight:700;margin:0 0 32px;color:#0d1f1a">${p.naslov}</h2>` : ''}
        <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:20px;max-width:960px;margin:0 auto">${items}</div>
      </section>`
    }
    case 'promo':
      return `<section ${clickAttr} style="background:${p.bgBoja};padding:${p.paddingV}px ${isMobile ? 20 : 40}px;text-align:center;color:${p.tekstBoja}">
        <h2 style="font-size:${isMobile ? 22 : 28}px;font-weight:800;margin:0 0 10px">${p.naslov}</h2>
        ${p.podnaslov ? `<p style="font-size:16px;opacity:0.85;margin:0 0 22px">${p.podnaslov}</p>` : ''}
        ${p.dugmeTekst ? `<a href="${p.dugmeUrl}" style="display:inline-block;background:${p.dugmeBgBoja};color:${p.dugmeTekstBoja};padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none">${p.dugmeTekst}</a>` : ''}
      </section>`
    case 'newsletter':
      return `<section ${clickAttr} style="padding:${p.paddingV}px ${isMobile ? 20 : 40}px;background:${p.bgBoja};text-align:center">
        <h2 style="font-size:24px;font-weight:700;margin:0 0 8px;color:#0d1f1a">${p.naslov}</h2>
        ${p.podnaslov ? `<p style="font-size:14px;color:#6b8279;margin:0 0 24px">${p.podnaslov}</p>` : ''}
        <div style="display:flex;gap:8px;max-width:400px;margin:0 auto;flex-direction:${isMobile ? 'column' : 'row'}">
          <input type="email" placeholder="${p.placeholder}" style="flex:1;padding:10px 14px;border:1px solid #e8edeb;border-radius:8px;font-size:14px"/>
          <button style="padding:10px 20px;background:${p.dugmeBoja};color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap">${p.dugmeTekst}</button>
        </div>
      </section>`
    case 'tekst_slika': {
      const reversed = p.slikaPozicija === 'lijevo'
      const imgEl = p.slikaUrl
        ? `<img src="${p.slikaUrl}" alt="${p.slikaAlt || ''}" style="width:100%;height:300px;object-fit:cover;border-radius:16px"/>`
        : `<div style="background:#f0fdf4;border-radius:16px;height:300px;display:flex;align-items:center;justify-content:center;font-size:64px">${p.slikaEmoji}</div>`
      const textEl = `<div><h2 style="font-size:${isMobile ? 24 : p.naslovSize}px;font-weight:800;color:#0d1f1a;margin:0 0 16px;line-height:1.2">${p.naslov}</h2><p style="font-size:${p.tekstSize}px;color:${p.tekstBoja};line-height:1.7;margin:0 0 24px">${p.tekst}</p>${p.dugmeTekst ? `<a href="${p.dugmeUrl}" style="display:inline-block;background:#0F6E56;color:white;padding:12px 24px;border-radius:8px;font-weight:700;text-decoration:none">${p.dugmeTekst}</a>` : ''}</div>`
      return `<section ${clickAttr} style="padding:${p.paddingV}px ${isMobile ? 20 : 40}px;background:${p.bgBoja}">
        <div style="display:grid;grid-template-columns:${isMobile ? '1fr' : '1fr 1fr'};gap:${isMobile ? 32 : 48}px;align-items:center;max-width:1200px;margin:0 auto">
          ${reversed ? imgEl + textEl : textEl + imgEl}
        </div>
      </section>`
    }
    case 'statistike': {
      const stats = [[p.stat1Broj, p.stat1Label], [p.stat2Broj, p.stat2Label], [p.stat3Broj, p.stat3Label], [p.stat4Broj, p.stat4Label]]
      return `<section ${clickAttr} style="padding:${p.paddingV}px ${isMobile ? 20 : 40}px;background:${p.bgBoja};color:${p.tekstBoja}">
        <div style="display:grid;grid-template-columns:repeat(${isMobile ? 2 : 4},1fr);gap:24px;max-width:900px;margin:0 auto;text-align:center">
          ${stats.map(([n, l]) => `<div><div style="font-size:${p.brojSize}px;font-weight:800;margin-bottom:6px">${n || ''}</div><div style="font-size:${p.labelSize}px;opacity:0.8">${l || ''}</div></div>`).join('')}
        </div>
      </section>`
    }
    case 'akcije': {
      const cols = isMobile ? 2 : Math.min(parseInt(p.kolone) || 4, isTablet ? 2 : 4)
      const placeholders = Array.from({ length: parseInt(p.kolone) || 4 }, (_, i) => `
        <div style="background:white;border-radius:${p.kartRadius}px;border:1px solid #E5E7EB;overflow:hidden;display:flex;flex-direction:column">
          <div style="height:140px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);display:flex;align-items:center;justify-content:center;font-size:36px">📦</div>
          <div style="padding:12px;flex:1;display:flex;flex-direction:column;gap:6px">
            <div style="font-size:12px;color:#6B7280">Artikal ${i + 1}</div>
            <div style="font-size:13px;font-weight:700;color:#0d1f1a">Naziv artikla</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:auto">
              <span style="font-size:14px;font-weight:800;color:#0F6E56">45.00 KM</span>
              <span style="font-size:11px;color:#DC2626;background:#FEF2F2;padding:2px 6px;border-radius:100px;font-weight:600">-20%</span>
            </div>
            <button style="padding:8px;background:${p.dugmeBoja};color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;margin-top:4px">${p.dugmeTekst}</button>
          </div>
        </div>`).join('')
      return `<section ${clickAttr} style="padding:${p.paddingV}px ${isMobile ? 20 : p.paddingH}px;background:${p.bgBoja}">
        ${p.naslov ? `<h2 style="font-size:24px;font-weight:700;margin:0 0 24px;color:#0d1f1a">${p.naslov}</h2>` : ''}
        <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px">${placeholders}</div>
        <div style="margin-top:12px;padding:8px;background:#FEF3C7;border-radius:6px;font-size:11px;color:#92400E;text-align:center">ℹ️ U produkciji prikazuje stvarne akcijske artikle iz NIBIS ERP baze</div>
      </section>`
    }
    case 'tekst':
      return `<div ${clickAttr} style="padding:${p.paddingV}px ${isMobile ? 20 : p.paddingH}px"><p style="font-size:${p.fontSize}px;font-weight:${p.fontWeight};color:${p.boja};text-align:${p.align};line-height:${p.lineHeight};margin:0">${p.sadrzaj}</p></div>`
    case 'slika':
      return p.url
        ? `<div ${clickAttr} style="text-align:${p.align};padding:0 ${isMobile ? 20 : 40}px"><img src="${p.url}" alt="${p.alt}" style="width:${p.sirina}%;height:${p.visina}px;object-fit:${p.objectFit};border-radius:${p.radius}px"/></div>`
        : `<div ${clickAttr} style="margin:16px ${isMobile ? 20 : 40}px;padding:32px;background:#F9FAFB;border:2px dashed #E5E7EB;border-radius:8px;text-align:center;color:#9CA3AF;font-size:13px">🖼️ Dodaj URL slike u postavkama</div>`
    case 'galerija': {
      const urls = (p.slike || '').split('\n').map((s: string) => s.trim()).filter(Boolean)
      const cols = isMobile ? 2 : parseInt(p.kolone) || 3
      if (!urls.length) return `<div ${clickAttr} style="margin:16px ${isMobile ? 20 : 40}px;padding:32px;background:#F9FAFB;border:2px dashed #E5E7EB;border-radius:8px;text-align:center;color:#9CA3AF;font-size:13px">🎨 Dodaj URL-ove slika (jedan po redu) u postavkama</div>`
      return `<div ${clickAttr} style="padding:${p.paddingV}px ${isMobile ? 20 : p.paddingH}px">
        <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${p.gap}px">
          ${urls.map((url: string) => `<div style="overflow:hidden;border-radius:${p.radius}px;cursor:${p.lightbox === 'true' ? 'zoom-in' : 'default'}"><img src="${url}" alt="" style="width:100%;height:${p.visina}px;object-fit:cover;transition:transform 0.3s" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"/></div>`).join('')}
        </div>
      </div>`
    }
    case 'animirani_tekst': {
      const animCSS: Record<string, string> = {
        fadeIn: 'opacity:0;animation:fadeIn 1s forwards',
        slideUp: 'opacity:0;transform:translateY(30px);animation:slideUp 1s forwards',
        slideLeft: 'opacity:0;transform:translateX(-30px);animation:slideLeft 1s forwards',
        pulse: 'animation:pulse 2s infinite',
        bounce: 'animation:bounce 1s infinite',
      }
      return `<div ${clickAttr} style="padding:${p.paddingV}px 40px;text-align:${p.align}">
        <style>@keyframes fadeIn{to{opacity:1}}@keyframes slideUp{to{opacity:1;transform:none}}@keyframes slideLeft{to{opacity:1;transform:none}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}</style>
        <h2 style="font-size:${p.fontSize}px;font-weight:800;color:${p.boja};margin:0;${animCSS[p.animacija] || ''};animation-duration:${p.trajanje}s">${p.naslov}</h2>
      </div>`
    }
    case 'dugme': {
      const shadow = p.shadow === 'true' ? `box-shadow:0 4px 14px ${p.bgBoja}40` : ''
      return `<div ${clickAttr} style="text-align:${p.align};padding:${p.paddingV}px ${isMobile ? 20 : p.paddingH}px">
        <a href="${p.url}" style="display:inline-block;background:${p.bgBoja};color:${p.tekstBoja};padding:${p.paddingV}px ${p.paddingH}px;border-radius:${p.radius}px;font-size:${p.fontSize}px;font-weight:${p.fontWeight};text-decoration:none;${shadow}">${p.tekst}</a>
      </div>`
    }
    case 'separator':
      return `<div ${clickAttr} style="padding:${p.marginV}px ${isMobile ? 20 : 40}px"><hr style="border:none;border-top:${p.visina}px ${p.stil} ${p.boja};margin:0"/></div>`
    case 'spacer':
      return `<div ${clickAttr} style="height:${p.visina}px"></div>`
    case 'kategorije_grid': {
      const cols = isMobile ? 2 : Math.min(parseInt(p.kolone), 4)
      const cats = ['Alati', 'Elektro', 'Hidraulika', 'Pneumatika', 'Maziva', 'Sigurnost', 'Vijci', 'Ostalo']
      return `<section ${clickAttr} style="padding:${p.paddingV}px ${isMobile ? 20 : p.paddingH}px;background:${p.bgBoja}">
        ${p.naslov ? `<h2 style="font-size:24px;font-weight:700;margin:0 0 28px;color:#0d1f1a">${p.naslov}</h2>` : ''}
        <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:12px">
          ${cats.slice(0, cols * 2).map(k => `<a href="/?q=${k}" style="display:flex;flex-direction:column;align-items:center;padding:16px 12px;background:${p.katBoja};border-radius:${p.katRadius}px;border:1px solid ${p.katBorder};text-decoration:none">
            <div style="width:44px;height:44px;background:#0F6E56;border-radius:10px;margin-bottom:8px"></div>
            <span style="font-size:13px;font-weight:600;color:#0d1f1a">${k}</span>
          </a>`).join('')}
        </div>
      </section>`
    }
    case 'kartica':
      return `<div ${clickAttr} style="background:${p.bgBoja};border-radius:${p.radius}px;padding:${p.padding}px;box-shadow:${p.shadow === 'true' ? '0 2px 12px rgba(0,0,0,0.08)' : 'none'}">
        <h3 style="font-size:18px;font-weight:700;color:${p.naslovBoja};margin:0 0 10px">${p.naslov}</h3>
        <p style="font-size:14px;color:${p.tekstBoja};margin:0;line-height:1.6">${p.tekst}</p>
      </div>`
    case 'kolone_2': {
      const childrenHtml = (block.children || []).map(c => renderBlockHTML(c, device, isEditor)).join('')
      return `<div ${clickAttr} style="display:grid;grid-template-columns:${isMobile ? '1fr' : `${p.col1Sirina}% 1fr`};gap:${p.gap}px;padding:${p.paddingV}px ${isMobile ? 20 : p.paddingH}px;background:${p.bgBoja}">
        ${childrenHtml || '<div style="min-height:80px;border:2px dashed #E5E7EB;border-radius:8px;padding:16px;color:#9CA3AF;font-size:12px;text-align:center;display:flex;align-items:center;justify-content:center">Kolona 1 — prevuci blok ovdje</div><div style="min-height:80px;border:2px dashed #E5E7EB;border-radius:8px;padding:16px;color:#9CA3AF;font-size:12px;text-align:center;display:flex;align-items:center;justify-content:center">Kolona 2 — prevuci blok ovdje</div>'}
      </div>`
    }
    case 'kolone_3': {
      const childrenHtml = (block.children || []).map(c => renderBlockHTML(c, device, isEditor)).join('')
      return `<div ${clickAttr} style="display:grid;grid-template-columns:${isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr'};gap:${p.gap}px;padding:${p.paddingV}px ${isMobile ? 20 : p.paddingH}px;background:${p.bgBoja}">
        ${childrenHtml || '<div style="min-height:80px;border:2px dashed #E5E7EB;border-radius:8px;padding:16px;color:#9CA3AF;font-size:12px;text-align:center;display:flex;align-items:center;justify-content:center">Kolona 1</div><div style="min-height:80px;border:2px dashed #E5E7EB;border-radius:8px;padding:16px;color:#9CA3AF;font-size:12px;text-align:center;display:flex;align-items:center;justify-content:center">Kolona 2</div><div style="min-height:80px;border:2px dashed #E5E7EB;border-radius:8px;padding:16px;color:#9CA3AF;font-size:12px;text-align:center;display:flex;align-items:center;justify-content:center">Kolona 3</div>'}
      </div>`
    }
    case 'video': {
      if (!p.url) return `<div ${clickAttr} style="margin:${p.paddingV}px ${isMobile ? 20 : p.paddingH}px;padding:32px;background:#F9FAFB;border:2px dashed #E5E7EB;border-radius:${p.radius}px;text-align:center;color:#9CA3AF">▶️ Dodaj URL videa u postavkama</div>`
      let embedUrl = p.url
      if (p.tip === 'youtube') { const id = p.url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1]; if (id) embedUrl = `https://www.youtube.com/embed/${id}` }
      else if (p.tip === 'vimeo') { const id = p.url.match(/vimeo\.com\/(\d+)/)?.[1]; if (id) embedUrl = `https://player.vimeo.com/video/${id}` }
      return `<div ${clickAttr} style="padding:${p.paddingV}px ${isMobile ? 20 : p.paddingH}px"><iframe src="${embedUrl}" style="width:100%;height:${p.visina}px;border-radius:${p.radius}px;border:none" allowfullscreen></iframe></div>`
    }
    case 'html':
      return `<div ${clickAttr}>${p.sadrzaj || ''}</div>`
    default:
      return `<div style="padding:12px;background:#FEF2F2;color:#991B1B;border-radius:6px;margin:8px;font-size:12px">Nepoznat blok: ${block.type}</div>`
  }
}

// ─── Props Panel ───────────────────────────────────────────────────────────────
function PropsPanel({ block, onChange }: { block: Block; onChange: (props: Record<string, any>) => void }) {
  const p = block.props
  const set = (k: string, v: string) => onChange({ ...p, [k]: v })

  const s: Record<string, any> = {
    label: { fontSize: '10px', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '4px', display: 'block' },
    input: { padding: '6px 8px', fontSize: '12px', background: '#1F2937', border: '1px solid #374151', borderRadius: '6px', color: '#F9FAFB', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const },
    wrap: { marginBottom: '10px', display: 'flex', flexDirection: 'column' as const, gap: '3px' },
    sec: { fontSize: '9px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px', marginTop: '14px', paddingBottom: '4px', borderBottom: '1px solid #374151' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  }

  const F = ({ label, k, type = 'text', ph = '' }: { label: string; k: string; type?: string; ph?: string }) => (
    <div style={s.wrap}><label style={s.label}>{label}</label><input type={type} value={p[k] || ''} placeholder={ph} onChange={e => set(k, e.target.value)} style={s.input} onFocus={e => (e.target as any).style.borderColor = '#0F6E56'} onBlur={e => (e.target as any).style.borderColor = '#374151'} /></div>
  )

  const TA = ({ label, k, rows = 3 }: { label: string; k: string; rows?: number }) => (
    <div style={s.wrap}><label style={s.label}>{label}</label><textarea value={p[k] || ''} rows={rows} onChange={e => set(k, e.target.value)} style={{ ...s.input, resize: 'vertical' }} onFocus={e => (e.target as any).style.borderColor = '#0F6E56'} onBlur={e => (e.target as any).style.borderColor = '#374151'} /></div>
  )

  const C = ({ label, k }: { label: string; k: string }) => (
    <div style={{ ...s.wrap, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <label style={s.label}>{label}</label>
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
        <input type="color" value={p[k] || '#000000'} onChange={e => set(k, e.target.value)} style={{ width: '30px', height: '22px', border: '1px solid #374151', borderRadius: '4px', cursor: 'pointer', padding: '1px', background: '#1F2937' }} />
        <input type="text" value={p[k] || ''} onChange={e => set(k, e.target.value)} style={{ width: '70px', padding: '4px 6px', fontSize: '11px', fontFamily: 'monospace', background: '#1F2937', border: '1px solid #374151', borderRadius: '4px', color: '#F9FAFB', outline: 'none' }} />
      </div>
    </div>
  )

  const SL = ({ label, k, min, max, unit = '' }: { label: string; k: string; min: number; max: number; unit?: string }) => (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <label style={s.label}>{label}</label>
        <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 700 }}>{p[k]}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={p[k] || min} onChange={e => set(k, e.target.value)} style={{ width: '100%', accentColor: '#0F6E56' }} />
    </div>
  )

  const SEL = ({ label, k, opts }: { label: string; k: string; opts: { v: string; l: string }[] }) => (
    <div style={s.wrap}><label style={s.label}>{label}</label><select value={p[k] || opts[0]?.v} onChange={e => set(k, e.target.value)} style={{ ...s.input, cursor: 'pointer' }}>{opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
  )

  const TOG = ({ label, k }: { label: string; k: string }) => {
    const on = p[k] === 'true'
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #1F2937', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: '#D1D5DB' }}>{label}</span>
        <button onClick={() => set(k, on ? 'false' : 'true')} style={{ width: '34px', height: '18px', borderRadius: '9px', border: 'none', cursor: 'pointer', background: on ? '#0F6E56' : '#374151', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
          <span style={{ position: 'absolute', top: '2px', left: on ? '16px' : '2px', width: '14px', height: '14px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
        </button>
      </div>
    )
  }

  const SEC = ({ t }: { t: string }) => <div style={s.sec}>{t}</div>
  const GR = ({ children }: { children: React.ReactNode }) => <div style={s.grid}>{children}</div>

  switch (block.type) {
    case 'hero': return <><SEC t="Sadržaj"/><F label="Naslov" k="naslov"/><F label="Podnaslov" k="podnaslov"/><F label="Tekst dugmeta" k="dugmeTekst"/><F label="URL dugmeta" k="dugmeUrl" ph="/"/><SEC t="Pozadina"/><C label="Boja pozadine" k="bgBoja"/><F label="URL slike (opcionalno)" k="bgSlika" ph="https://..."/><SL label="Overlay" k="overlay" min={0} max={1}/><SEC t="Tekst"/><C label="Boja teksta" k="tekstBoja"/><SL label="Veličina naslova" k="fontSize" min={20} max={72} unit="px"/><SL label="Veličina podnaslov" k="podnaslovSize" min={12} max={32} unit="px"/><SEL label="Pozicija teksta" k="tekstPozicija" opts={[{v:'left',l:'Lijevo'},{v:'center',l:'Centar'},{v:'right',l:'Desno'}]}/><SEC t="Dimenzije"/><SL label="Visina banera" k="visina" min={150} max={700} unit="px"/></>
    case 'features': return <><SEC t="Naslov sekcije"/><F label="Naslov" k="naslov"/><SL label="Broj kolona" k="kolone" min={1} max={4}/><SEC t="Stavka 1"/><GR><F label="Ikona" k="item1Ikona"/><F label="Naslov" k="item1Naslov"/></GR><F label="Opis" k="item1Opis"/><SEC t="Stavka 2"/><GR><F label="Ikona" k="item2Ikona"/><F label="Naslov" k="item2Naslov"/></GR><F label="Opis" k="item2Opis"/><SEC t="Stavka 3"/><GR><F label="Ikona" k="item3Ikona"/><F label="Naslov" k="item3Naslov"/></GR><F label="Opis" k="item3Opis"/><SEC t="Stil"/><C label="Pozadina sekcije" k="bgBoja"/><C label="Pozadina kartice" k="kartBoja"/><SL label="Radius kartice" k="radius" min={0} max={32} unit="px"/><TOG label="Shadow na karticama" k="shadow"/><SL label="Padding vertikalni" k="paddingV" min={16} max={120} unit="px"/></>
    case 'promo': return <><SEC t="Sadržaj"/><F label="Naslov" k="naslov"/><F label="Podnaslov" k="podnaslov"/><F label="Tekst dugmeta" k="dugmeTekst"/><F label="URL dugmeta" k="dugmeUrl"/><SEC t="Boje"/><C label="Pozadina" k="bgBoja"/><C label="Boja teksta" k="tekstBoja"/><C label="Pozadina dugmeta" k="dugmeBgBoja"/><C label="Tekst dugmeta" k="dugmeTekstBoja"/><SL label="Padding vertikalni" k="paddingV" min={16} max={120} unit="px"/></>
    case 'newsletter': return <><SEC t="Sadržaj"/><F label="Naslov" k="naslov"/><F label="Podnaslov" k="podnaslov"/><F label="Placeholder emaila" k="placeholder"/><F label="Tekst dugmeta" k="dugmeTekst"/><SEC t="Stil"/><C label="Pozadina" k="bgBoja"/><C label="Boja dugmeta" k="dugmeBoja"/><SL label="Padding vertikalni" k="paddingV" min={16} max={120} unit="px"/></>
    case 'tekst_slika': return <><SEC t="Tekst"/><F label="Naslov" k="naslov"/><TA label="Paragraf" k="tekst"/><F label="Tekst dugmeta" k="dugmeTekst"/><F label="URL dugmeta" k="dugmeUrl"/><SL label="Veličina naslova" k="naslovSize" min={18} max={56} unit="px"/><SL label="Veličina teksta" k="tekstSize" min={12} max={24} unit="px"/><C label="Boja teksta" k="tekstBoja"/><SEC t="Slika"/><F label="URL slike" k="slikaUrl" ph="https://..."/><F label="Emoji (ako nema slike)" k="slikaEmoji"/><SEL label="Pozicija slike" k="slikaPozicija" opts={[{v:'desno',l:'Desno'},{v:'lijevo',l:'Lijevo'}]}/><SEC t="Stil"/><C label="Pozadina" k="bgBoja"/><SL label="Padding vertikalni" k="paddingV" min={16} max={120} unit="px"/></>
    case 'statistike': return <><SEC t="Statistike"/><GR><F label="Broj 1" k="stat1Broj"/><F label="Label 1" k="stat1Label"/></GR><GR><F label="Broj 2" k="stat2Broj"/><F label="Label 2" k="stat2Label"/></GR><GR><F label="Broj 3" k="stat3Broj"/><F label="Label 3" k="stat3Label"/></GR><GR><F label="Broj 4" k="stat4Broj"/><F label="Label 4" k="stat4Label"/></GR><SEC t="Stil"/><C label="Pozadina" k="bgBoja"/><C label="Boja teksta" k="tekstBoja"/><SL label="Veličina broja" k="brojSize" min={20} max={72} unit="px"/><SL label="Padding vertikalni" k="paddingV" min={16} max={120} unit="px"/></>
    case 'akcije': return <><SEC t="Sadržaj"/><F label="Naslov sekcije" k="naslov"/><SL label="Broj kolona" k="kolone" min={2} max={6}/><F label="Tekst dugmeta" k="dugmeTekst"/><SEC t="Stil"/><C label="Pozadina" k="bgBoja"/><C label="Boja dugmeta" k="dugmeBoja"/><SL label="Radius kartice" k="kartRadius" min={0} max={24} unit="px"/><SL label="Padding vertikalni" k="paddingV" min={16} max={120} unit="px"/><SL label="Padding horizontalni" k="paddingH" min={0} max={80} unit="px"/></>
    case 'tekst': return <><SEC t="Sadržaj"/><TA label="Tekst" k="sadrzaj"/><SEC t="Tipografija"/><SL label="Veličina" k="fontSize" min={10} max={72} unit="px"/><SEL label="Font weight" k="fontWeight" opts={[{v:'400',l:'Regular'},{v:'500',l:'Medium'},{v:'600',l:'Semibold'},{v:'700',l:'Bold'},{v:'800',l:'Extra Bold'}]}/><C label="Boja" k="boja"/><SEL label="Poravnanje" k="align" opts={[{v:'left',l:'Lijevo'},{v:'center',l:'Centar'},{v:'right',l:'Desno'},{v:'justify',l:'Justify'}]}/><SL label="Line height" k="lineHeight" min={1} max={3}/><SEC t="Spacing"/><SL label="Padding vertikalni" k="paddingV" min={0} max={80} unit="px"/><SL label="Padding horizontalni" k="paddingH" min={0} max={120} unit="px"/></>
    case 'slika': return <><SEC t="Slika"/><F label="URL slike" k="url" ph="https://..."/><F label="Alt tekst" k="alt"/><SEC t="Dimenzije"/><SL label="Širina (%)" k="sirina" min={10} max={100} unit="%"/><SL label="Visina (px)" k="visina" min={50} max={800} unit="px"/><SL label="Border radius" k="radius" min={0} max={32} unit="px"/><SEL label="Object fit" k="objectFit" opts={[{v:'cover',l:'Cover'},{v:'contain',l:'Contain'},{v:'fill',l:'Fill'}]}/><SEL label="Poravnanje" k="align" opts={[{v:'left',l:'Lijevo'},{v:'center',l:'Centar'},{v:'right',l:'Desno'}]}/></>
    case 'galerija': return <><SEC t="Slike"/><TA label="URL-ovi slika (jedan po redu)" k="slike" rows={5}/><SEC t="Raspored"/><SL label="Kolone" k="kolone" min={1} max={6}/><SL label="Gap između slika" k="gap" min={0} max={32} unit="px"/><SL label="Visina slike" k="visina" min={80} max={600} unit="px"/><SL label="Border radius" k="radius" min={0} max={32} unit="px"/><TOG label="Lightbox efekt" k="lightbox"/><SL label="Padding vertikalni" k="paddingV" min={0} max={80} unit="px"/><SL label="Padding horizontalni" k="paddingH" min={0} max={80} unit="px"/></>
    case 'animirani_tekst': return <><SEC t="Sadržaj"/><F label="Naslov" k="naslov"/><SEC t="Animacija"/><SEL label="Tip animacije" k="animacija" opts={[{v:'fadeIn',l:'Fade In'},{v:'slideUp',l:'Slide Up'},{v:'slideLeft',l:'Slide Left'},{v:'pulse',l:'Pulse (loop)'},{v:'bounce',l:'Bounce (loop)'}]}/><SL label="Trajanje (sek)" k="trajanje" min={0.3} max={3}/><SEC t="Stil"/><C label="Boja teksta" k="boja"/><SL label="Veličina fonta" k="fontSize" min={16} max={72} unit="px"/><SEL label="Poravnanje" k="align" opts={[{v:'left',l:'Lijevo'},{v:'center',l:'Centar'},{v:'right',l:'Desno'}]}/><SL label="Padding vertikalni" k="paddingV" min={0} max={120} unit="px"/></>
    case 'dugme': return <><SEC t="Sadržaj"/><F label="Tekst" k="tekst"/><F label="URL" k="url" ph="https://..."/><SEC t="Stil"/><C label="Pozadina" k="bgBoja"/><C label="Boja teksta" k="tekstBoja"/><SL label="Border radius" k="radius" min={0} max={50} unit="px"/><SL label="Veličina fonta" k="fontSize" min={10} max={24} unit="px"/><TOG label="Shadow" k="shadow"/><SEC t="Spacing"/><SL label="Padding horizontalni" k="paddingH" min={8} max={80} unit="px"/><SL label="Padding vertikalni" k="paddingV" min={4} max={32} unit="px"/><SEL label="Poravnanje" k="align" opts={[{v:'left',l:'Lijevo'},{v:'center',l:'Centar'},{v:'right',l:'Desno'}]}/></>
    case 'separator': return <><SEC t="Stil"/><C label="Boja" k="boja"/><SL label="Debljina" k="visina" min={1} max={10} unit="px"/><SEL label="Stil linije" k="stil" opts={[{v:'solid',l:'Solid'},{v:'dashed',l:'Dashed'},{v:'dotted',l:'Dotted'}]}/><SL label="Margin vertikalni" k="marginV" min={0} max={80} unit="px"/></>
    case 'spacer': return <><SEC t="Dimenzije"/><SL label="Visina" k="visina" min={8} max={300} unit="px"/></>
    case 'video': return <><SEC t="Video"/><F label="URL (YouTube/Vimeo)" k="url" ph="https://youtube.com/watch?v=..."/><SEL label="Platforma" k="tip" opts={[{v:'youtube',l:'YouTube'},{v:'vimeo',l:'Vimeo'},{v:'direct',l:'Direktan URL'}]}/><SEC t="Dimenzije"/><SL label="Visina" k="visina" min={150} max={800} unit="px"/><SL label="Border radius" k="radius" min={0} max={32} unit="px"/><SL label="Padding" k="paddingV" min={0} max={80} unit="px"/></>
    case 'html': return <><SEC t="HTML kod"/><TA label="HTML" k="sadrzaj" rows={8}/><div style={{fontSize:'10px',color:'#6B7280',lineHeight:1.5}}>Možeš koristiti HTML, CSS i inline skripte.</div></>
    case 'kartica': return <><SEC t="Sadržaj"/><F label="Naslov" k="naslov"/><TA label="Tekst" k="tekst"/><SEC t="Stil"/><C label="Pozadina" k="bgBoja"/><C label="Boja naslova" k="naslovBoja"/><C label="Boja teksta" k="tekstBoja"/><SL label="Border radius" k="radius" min={0} max={32} unit="px"/><SL label="Padding" k="padding" min={8} max={64} unit="px"/><TOG label="Shadow" k="shadow"/></>
    case 'kolone_2': return <><SEC t="Kolone"/><SL label="Širina prve kolone (%)" k="col1Sirina" min={20} max={80} unit="%"/><SL label="Gap između kolona" k="gap" min={0} max={80} unit="px"/><SEC t="Stil"/><C label="Pozadina" k="bgBoja"/><SL label="Padding vertikalni" k="paddingV" min={0} max={120} unit="px"/><SL label="Padding horizontalni" k="paddingH" min={0} max={80} unit="px"/></>
    case 'kolone_3': return <><SEC t="Kolone"/><SL label="Gap između kolona" k="gap" min={0} max={80} unit="px"/><SEC t="Stil"/><C label="Pozadina" k="bgBoja"/><SL label="Padding vertikalni" k="paddingV" min={0} max={120} unit="px"/><SL label="Padding horizontalni" k="paddingH" min={0} max={80} unit="px"/></>
    case 'kategorije_grid': return <><SEC t="Sadržaj"/><F label="Naslov sekcije" k="naslov"/><SL label="Kolone" k="kolone" min={2} max={6}/><SEC t="Stil"/><C label="Pozadina sekcije" k="bgBoja"/><C label="Pozadina kartice" k="katBoja"/><C label="Boja bordera" k="katBorder"/><SL label="Radius kartice" k="katRadius" min={0} max={24} unit="px"/><SL label="Padding vertikalni" k="paddingV" min={16} max={120} unit="px"/></>
    default: return <div style={{ color: '#6B7280', fontSize: '12px' }}>Nema postavki.</div>
  }
}

// ─── Glavni Page Builder ────────────────────────────────────────────────────────
export default function PageBuilderPage() {
  const [stranice, setStranice] = useState<Stranica[]>([
    { id: 'homepage', naziv: 'Početna stranica', slug: '/', blocks: [] }
  ])
  const [aktivnaStranica, setAktivnaStranica] = useState('homepage')
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
  const [showPredlosci, setShowPredlosci] = useState(false)
  const [novaStranicaNaziv, setNovaStranicaNaziv] = useState('')
  const [novaStranicaSlug, setNovaStranicaSlug] = useState('')
  const dragIdRef = useRef<string | null>(null)

  const currentStranica = stranice.find(s => s.id === aktivnaStranica)!
  const blocks = currentStranica?.blocks || []

  const setBlocks = useCallback((fn: Block[] | ((prev: Block[]) => Block[])) => {
    setStranice(prev => prev.map(s => s.id === aktivnaStranica
      ? { ...s, blocks: typeof fn === 'function' ? fn(s.blocks) : fn }
      : s
    ))
  }, [aktivnaStranica])

  // ─── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('postavke').select('vrijednost').eq('kljuc', 'craft_builder_stranice').single()
      .then(({ data }) => {
        if (data?.vrijednost) {
          try {
            const parsed = JSON.parse(data.vrijednost)
            if (Array.isArray(parsed) && parsed.length > 0) setStranice(parsed)
          } catch {}
        }
        setLoading(false)
      })
  }, [])

  // ─── History ──────────────────────────────────────────────────────────────
  const pushHistory = useCallback((prev: Block[]) => {
    setHistory(h => [...h.slice(-30), prev])
    setFuture([])
  }, [])

  const updateBlocks = useCallback((newBlocks: Block[], prevBlocks: Block[]) => {
    pushHistory(prevBlocks)
    setBlocks(newBlocks)
  }, [pushHistory, setBlocks])

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

  // ─── Block ops ───────────────────────────────────────────────────────────
  function addBlock(type: string, afterId?: string) {
    const nb: Block = { id: `${type}_${Date.now()}`, type, props: { ...BLOCK_DEFAULTS[type] } }
    const prev = blocks
    if (afterId) {
      const idx = blocks.findIndex(b => b.id === afterId)
      const next = [...blocks]; next.splice(idx + 1, 0, nb)
      updateBlocks(next, prev)
    } else {
      updateBlocks([...blocks, nb], prev)
    }
    setSelectedId(nb.id); setPanelTab('stilovi')
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
    const next = [...blocks]; next.splice(idx + 1, 0, copy)
    updateBlocks(next, blocks); setSelectedId(copy.id)
  }

  function moveBlock(id: string, dir: 'up' | 'down') {
    const idx = blocks.findIndex(b => b.id === id)
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === blocks.length - 1)) return
    const next = [...blocks]
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]]
    updateBlocks(next, blocks)
  }

  function updateProps(id: string, props: Record<string, any>) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, props } : b))
  }

  // ─── Stranice ─────────────────────────────────────────────────────────────
  function addStranica() {
    if (!novaStranicaNaziv) return
    const id = `stranica_${Date.now()}`
    const slug = novaStranicaSlug || `/${novaStranicaNaziv.toLowerCase().replace(/\s+/g, '-')}`
    setStranice(prev => [...prev, { id, naziv: novaStranicaNaziv, slug, blocks: [] }])
    setAktivnaStranica(id)
    setNovaStranicaNaziv(''); setNovaStranicaSlug('')
    setPanelTab('blokovi')
  }

  function removeStranica(id: string) {
    if (stranice.length <= 1) return
    setStranice(prev => prev.filter(s => s.id !== id))
    if (aktivnaStranica === id) setAktivnaStranica(stranice[0].id)
  }

  // ─── Predlošci ────────────────────────────────────────────────────────────
  function applyPredlozak(predlozak: typeof PREDLOSCI[0]) {
    const withIds = predlozak.blocks.map(b => ({ ...b, id: `${b.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, props: { ...b.props } }))
    updateBlocks(withIds, blocks)
    setShowPredlosci(false); setSelectedId(null)
  }

  // ─── Drag & drop ─────────────────────────────────────────────────────────
  function handleDragStart(e: React.DragEvent, blockId: string) {
    dragIdRef.current = blockId; e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragStartNew(e: React.DragEvent, type: string) {
    setDragBlockType(type); e.dataTransfer.effectAllowed = 'copy'
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault(); setDragOverId(id)
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault(); setDragOverId(null)
    if (dragBlockType) {
      const nb: Block = { id: `${dragBlockType}_${Date.now()}`, type: dragBlockType, props: { ...BLOCK_DEFAULTS[dragBlockType] } }
      const idx = blocks.findIndex(b => b.id === targetId)
      const next = [...blocks]; next.splice(idx + 1, 0, nb)
      updateBlocks(next, blocks); setSelectedId(nb.id); setPanelTab('stilovi'); setDragBlockType(null); return
    }
    const srcId = dragIdRef.current
    if (!srcId || srcId === targetId) { dragIdRef.current = null; return }
    const srcIdx = blocks.findIndex(b => b.id === srcId)
    const tgtIdx = blocks.findIndex(b => b.id === targetId)
    const next = [...blocks]; const [moved] = next.splice(srcIdx, 1); next.splice(tgtIdx, 0, moved)
    updateBlocks(next, blocks); dragIdRef.current = null
  }

  function handleDropCanvas(e: React.DragEvent) {
    e.preventDefault(); setDragOverId(null)
    if (dragBlockType) {
      addBlock(dragBlockType); setDragBlockType(null)
    }
    dragIdRef.current = null
  }

  // ─── Export / Import ──────────────────────────────────────────────────────
  function exportJSON() {
    const data = JSON.stringify(stranice, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'nibis-pagebuilder.json'; a.click()
    URL.revokeObjectURL(url)
  }

  function importJSON() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'
    input.onchange = (e: any) => {
      const file = e.target.files?.[0]; if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string)
          if (Array.isArray(parsed)) { setStranice(parsed); alert('Uvoz uspješan!') }
          else alert('Nevažeći format fajla')
        } catch { alert('Greška pri parsiranju JSON-a') }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // ─── Save ─────────────────────────────────────────────────────────────────
  async function save() {
    setSaving(true)
    await supabase.from('postavke').upsert([
      { kljuc: 'craft_builder_stranice', vrijednost: JSON.stringify(stranice) },
      { kljuc: 'craft_builder_json', vrijednost: JSON.stringify(blocks) }, // backwards compat
    ], { onConflict: 'kljuc' })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const selectedBlock = blocks.find(b => b.id === selectedId)
  const canvasWidth = device === 'mobile' ? '390px' : device === 'tablet' ? '768px' : '100%'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0B0F19', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '32px' }}>🧱</div>
      <div style={{ color: '#F9FAFB', fontSize: '14px', fontWeight: 600 }}>Učitavam Page Builder...</div>
    </div>
  )

  const BS = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} title={label} style={{ padding: '6px', background: 'none', border: `1px solid ${active ? '#0F6E56' : '#1E293B'}`, borderRadius: '6px', cursor: 'pointer', color: active ? '#34D399' : '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? '#0B2218' : 'transparent' } as any}>
      {icon}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0F172A', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>

      {/* ─── Toolbar ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', height: '48px', background: '#0B0F19', borderBottom: '1px solid #1E293B', flexShrink: 0, zIndex: 100 }}>
        <NextLink href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280', textDecoration: 'none', fontSize: '12px', flexShrink: 0 }}>
          <ChevronLeft size={14} /> Admin
        </NextLink>
        <div style={{ width: '1px', height: '16px', background: '#1E293B' }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#F9FAFB', flexShrink: 0 }}>🧱 Page Builder</span>

        {/* Stranica selector */}
        <select value={aktivnaStranica} onChange={e => { setAktivnaStranica(e.target.value); setSelectedId(null) }}
          style={{ padding: '4px 8px', fontSize: '12px', background: '#1E293B', border: '1px solid #374151', borderRadius: '6px', color: '#F9FAFB', fontFamily: 'inherit', outline: 'none', maxWidth: '160px' }}>
          {stranice.map(s => <option key={s.id} value={s.id}>{s.naziv}</option>)}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px' }}>
          {/* Undo/Redo */}
          <BS icon={<Undo2 size={13} />} label="Undo" active={false} onClick={undo} />
          <BS icon={<Redo2 size={13} />} label="Redo" active={false} onClick={redo} />
          <div style={{ width: '1px', height: '16px', background: '#1E293B' }} />

          {/* Predlošci */}
          <button onClick={() => setShowPredlosci(!showPredlosci)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, border: '1px solid #1E293B', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', background: showPredlosci ? '#0B2218' : 'transparent', color: showPredlosci ? '#34D399' : '#9CA3AF' }}>
            <LayoutTemplate size={12} /> Predlošci
          </button>

          {/* Export/Import */}
          <button onClick={exportJSON} title="Export JSON"
            style={{ padding: '5px 8px', border: '1px solid #1E293B', borderRadius: '6px', cursor: 'pointer', background: 'transparent', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'inherit' }}>
            <Download size={12} /> Export
          </button>
          <button onClick={importJSON} title="Import JSON"
            style={{ padding: '5px 8px', border: '1px solid #1E293B', borderRadius: '6px', cursor: 'pointer', background: 'transparent', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'inherit' }}>
            <Upload size={12} /> Import
          </button>

          <div style={{ width: '1px', height: '16px', background: '#1E293B' }} />

          {/* Device */}
          <div style={{ display: 'flex', background: '#1E293B', borderRadius: '6px', padding: '2px', gap: '1px' }}>
            {(['desktop', 'tablet', 'mobile'] as const).map((d, i) => (
              <button key={d} onClick={() => setDevice(d)}
                style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px', background: device === d ? '#0F6E56' : 'transparent', color: 'white', transition: 'background 0.15s' }}>
                {['🖥️', '📱', '📲'][i]}
              </button>
            ))}
          </div>

          {/* Preview */}
          <button onClick={() => setPreviewMode(!previewMode)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, border: '1px solid #1E293B', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', background: previewMode ? '#0F6E56' : 'transparent', color: previewMode ? 'white' : '#9CA3AF' }}>
            {previewMode ? <EyeOff size={12} /> : <Eye size={12} />}
            Preview
          </button>

          {/* Save */}
          <button onClick={save} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, border: 'none', borderRadius: '7px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', background: saved ? '#059669' : '#0F6E56', color: 'white', boxShadow: '0 0 12px rgba(15,110,86,0.3)' }}>
            <Save size={12} />{saving ? 'Čuvam...' : saved ? '✓ Sačuvano' : 'Sačuvaj'}
          </button>
        </div>
      </div>

      {/* ─── Predlošci overlay ─── */}
      {showPredlosci && (
        <div style={{ position: 'absolute', top: '48px', left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: '#0B0F19', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px', width: '640px', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#F9FAFB' }}>Predlošci stranica</span>
            <button onClick={() => setShowPredlosci(false)} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={14} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {PREDLOSCI.map(pred => (
              <button key={pred.id} onClick={() => applyPredlozak(pred)}
                style={{ padding: '12px', background: '#111827', border: '1px solid #1E293B', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as any).style.borderColor = '#0F6E56'; (e.currentTarget as any).style.background = '#0B2218' }}
                onMouseLeave={e => { (e.currentTarget as any).style.borderColor = '#1E293B'; (e.currentTarget as any).style.background = '#111827' }}
              >
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>{pred.emoji}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#F9FAFB', marginBottom: '3px' }}>{pred.naziv}</div>
                <div style={{ fontSize: '10px', color: '#6B7280', lineHeight: 1.4 }}>{pred.opis}</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: '10px', padding: '8px 10px', background: '#1E293B', borderRadius: '6px', fontSize: '11px', color: '#6B7280' }}>
            ⚠️ Primjena predloška zamjenjuje trenutni sadržaj stranice.
          </div>
        </div>
      )}

      {/* ─── Main area ─── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ─── Left panel ─── */}
        {!previewMode && (
          <div style={{ width: '224px', background: '#0B0F19', borderRight: '1px solid #1E293B', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1E293B', flexShrink: 0 }}>
              {([['blokovi', '⊞'], ['slojevi', '≡'], ['stilovi', '⚙'], ['stranice', '📄']] as const).map(([tab, icon]) => (
                <button key={tab} onClick={() => setPanelTab(tab as PanelTab)}
                  style={{ flex: 1, padding: '9px 2px', fontSize: '16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: panelTab === tab ? '#111827' : 'transparent', color: panelTab === tab ? '#34D399' : '#4B5563', borderBottom: panelTab === tab ? '2px solid #0F6E56' : '2px solid transparent', transition: 'all 0.1s' }}
                  title={tab}>
                  {icon}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>

              {/* ─── Blokovi ─── */}
              {panelTab === 'blokovi' && (
                <div>
                  {KATEGORIJE_BLOKOVA.map(kat => (
                    <div key={kat}>
                      <div style={{ padding: '8px 10px 4px', fontSize: '9px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{kat}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', padding: '0 6px 6px' }}>
                        {BLOCK_DEFS.filter(b => b.kat === kat).map(def => (
                          <div key={def.type} draggable
                            onDragStart={e => handleDragStartNew(e, def.type)}
                            onDragEnd={() => setDragBlockType(null)}
                            onClick={() => addBlock(def.type)}
                            title={def.opis}
                            style={{ padding: '7px 5px', background: '#111827', border: '1px solid #1E293B', borderRadius: '7px', cursor: 'grab', textAlign: 'center', transition: 'all 0.15s', userSelect: 'none' }}
                            onMouseEnter={e => { (e.currentTarget as any).style.borderColor = '#0F6E56'; (e.currentTarget as any).style.background = '#0B2218' }}
                            onMouseLeave={e => { (e.currentTarget as any).style.borderColor = '#1E293B'; (e.currentTarget as any).style.background = '#111827' }}
                          >
                            <div style={{ fontSize: '18px', marginBottom: '3px' }}>{def.emoji}</div>
                            <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 500, lineHeight: 1.2 }}>{def.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ─── Slojevi ─── */}
              {panelTab === 'slojevi' && (
                <div style={{ padding: '6px' }}>
                  {blocks.length === 0 && <div style={{ color: '#4B5563', fontSize: '12px', textAlign: 'center', padding: '20px 10px' }}>Nema blokova. Dodaj iz taba Blokovi.</div>}
                  {blocks.map((b, i) => {
                    const def = BLOCK_DEFS.find(d => d.type === b.type)
                    const isSel = selectedId === b.id
                    return (
                      <div key={b.id} draggable
                        onDragStart={e => { handleDragStart(e, b.id) }}
                        onDragOver={e => handleDragOver(e, b.id)}
                        onDrop={e => handleDrop(e, b.id)}
                        onDragEnd={() => setDragOverId(null)}
                        onClick={() => { setSelectedId(b.id); setPanelTab('stilovi') }}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', marginBottom: '2px', background: isSel ? '#0B2218' : dragOverId === b.id ? '#1a2e1a' : 'transparent', border: isSel ? '1px solid #0F6E56' : dragOverId === b.id ? '1px dashed #34D399' : '1px solid transparent', transition: 'all 0.1s' }}>
                        <GripVertical size={11} style={{ color: '#374151', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', flexShrink: 0 }}>{def?.emoji}</span>
                        <span style={{ flex: 1, fontSize: '11px', color: isSel ? '#34D399' : '#9CA3AF', fontWeight: isSel ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{def?.label}</span>
                        <div style={{ display: 'flex', gap: '1px', flexShrink: 0 }}>
                          <button onClick={e => { e.stopPropagation(); moveBlock(b.id, 'up') }} disabled={i === 0}
                            style={{ padding: '2px', background: 'none', border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer', color: '#4B5563', opacity: i === 0 ? 0.3 : 1 }}><ChevronUp size={10} /></button>
                          <button onClick={e => { e.stopPropagation(); moveBlock(b.id, 'down') }} disabled={i === blocks.length - 1}
                            style={{ padding: '2px', background: 'none', border: 'none', cursor: i === blocks.length - 1 ? 'not-allowed' : 'pointer', color: '#4B5563', opacity: i === blocks.length - 1 ? 0.3 : 1 }}><ChevronDown size={10} /></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ─── Stilovi ─── */}
              {panelTab === 'stilovi' && (
                <div style={{ padding: '10px' }}>
                  {selectedBlock ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #1E293B' }}>
                        <span style={{ fontSize: '16px' }}>{BLOCK_DEFS.find(d => d.type === selectedBlock.type)?.emoji}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#F9FAFB' }}>{BLOCK_DEFS.find(d => d.type === selectedBlock.type)?.label}</span>
                        <button onClick={() => removeBlock(selectedBlock.id)} style={{ marginLeft: 'auto', padding: '3px', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }} title="Obriši blok"><Trash2 size={12} /></button>
                        <button onClick={() => duplicateBlock(selectedBlock.id)} style={{ padding: '3px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }} title="Duplikat"><Copy size={12} /></button>
                      </div>
                      <PropsPanel block={selectedBlock} onChange={props => updateProps(selectedBlock.id, props)} />
                    </>
                  ) : (
                    <div style={{ color: '#4B5563', fontSize: '12px', textAlign: 'center', padding: '20px 8px', lineHeight: 1.6 }}>
                      Klikni na blok u canvasu ili sloju da urediš postavke
                    </div>
                  )}
                </div>
              )}

              {/* ─── Stranice ─── */}
              {panelTab === 'stranice' && (
                <div style={{ padding: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Stranice</div>
                  {stranice.map(s => (
                    <div key={s.id} onClick={() => { setAktivnaStranica(s.id); setSelectedId(null) }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 8px', borderRadius: '6px', cursor: 'pointer', marginBottom: '2px', background: aktivnaStranica === s.id ? '#0B2218' : 'transparent', border: aktivnaStranica === s.id ? '1px solid #0F6E56' : '1px solid transparent' }}>
                      <FileText size={11} style={{ color: aktivnaStranica === s.id ? '#34D399' : '#4B5563', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '11px', fontWeight: aktivnaStranica === s.id ? 600 : 400, color: aktivnaStranica === s.id ? '#34D399' : '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.naziv}</div>
                        <div style={{ fontSize: '9px', color: '#4B5563' }}>{s.slug}</div>
                      </div>
                      <div style={{ fontSize: '9px', color: '#374151', flexShrink: 0 }}>{s.blocks.length}bl</div>
                      {s.id !== 'homepage' && (
                        <button onClick={e => { e.stopPropagation(); removeStranica(s.id) }}
                          style={{ padding: '2px', background: 'none', border: 'none', cursor: 'pointer', color: '#374151' }}><X size={10} /></button>
                      )}
                    </div>
                  ))}
                  <div style={{ marginTop: '12px', borderTop: '1px solid #1E293B', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nova stranica</div>
                    <input value={novaStranicaNaziv} onChange={e => setNovaStranicaNaziv(e.target.value)} placeholder="Naziv (npr. O nama)"
                      style={{ padding: '5px 8px', fontSize: '11px', background: '#1F2937', border: '1px solid #374151', borderRadius: '5px', color: '#F9FAFB', fontFamily: 'inherit', outline: 'none' }} />
                    <input value={novaStranicaSlug} onChange={e => setNovaStranicaSlug(e.target.value)} placeholder="/o-nama (opcionalno)"
                      style={{ padding: '5px 8px', fontSize: '11px', background: '#1F2937', border: '1px solid #374151', borderRadius: '5px', color: '#F9FAFB', fontFamily: 'inherit', outline: 'none' }} />
                    <button onClick={addStranica} disabled={!novaStranicaNaziv}
                      style={{ padding: '6px', background: novaStranicaNaziv ? '#0F6E56' : '#1E293B', color: novaStranicaNaziv ? 'white' : '#374151', border: 'none', borderRadius: '5px', cursor: novaStranicaNaziv ? 'pointer' : 'not-allowed', fontSize: '11px', fontWeight: 600, fontFamily: 'inherit' }}>
                      <Plus size={11} style={{ display: 'inline', marginRight: '4px' }} /> Dodaj stranicu
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Canvas ─── */}
        <div style={{ flex: 1, overflow: 'auto', background: '#1E293B', display: 'flex', justifyContent: 'center', padding: previewMode ? '0' : '16px' }}
          onDragOver={e => { if (dragBlockType) e.preventDefault() }}
          onDrop={handleDropCanvas}>
          <div style={{ width: canvasWidth, maxWidth: '100%', background: 'white', boxShadow: previewMode ? 'none' : '0 0 40px rgba(0,0,0,0.4)', borderRadius: previewMode ? '0' : '8px', overflow: 'hidden', position: 'relative', minHeight: '100%' }}>

            {blocks.length === 0 && !previewMode && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px', color: '#9CA3AF', padding: '40px' }}>
                <div style={{ fontSize: '48px' }}>🧱</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>Canvas je prazan</div>
                <div style={{ fontSize: '14px', textAlign: 'center', lineHeight: 1.6 }}>Prevuci blok ovdje ili klikni na blok u lijevom panelu</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button onClick={() => setShowPredlosci(true)} style={{ padding: '10px 20px', background: '#0F6E56', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LayoutTemplate size={14} /> Odaberi predložak
                  </button>
                  <button onClick={() => addBlock('hero')} style={{ padding: '10px 20px', background: 'transparent', color: '#6B7280', border: '1px dashed #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
                    + Hero Banner
                  </button>
                </div>
              </div>
            )}

            {blocks.map((block, i) => {
              const isSel = selectedId === block.id && !previewMode
              const def = BLOCK_DEFS.find(d => d.type === block.type)
              return (
                <div key={block.id}
                  onDragOver={e => handleDragOver(e, block.id)}
                  onDrop={e => handleDrop(e, block.id)}
                  onDragEnd={() => setDragOverId(null)}
                  style={{ position: 'relative', outline: isSel ? '2px solid #0F6E56' : dragOverId === block.id ? '2px dashed #34D399' : 'none', outlineOffset: '-2px', transition: 'outline 0.1s' }}
                  onClick={() => { if (!previewMode) { setSelectedId(block.id); setPanelTab('stilovi') } }}
                >
                  {isSel && (
                    <>
                      <div style={{ position: 'absolute', top: '4px', left: '4px', zIndex: 20, background: '#0F6E56', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', pointerEvents: 'none' }}>
                        {def?.emoji} {def?.label}
                      </div>
                      <div style={{ position: 'absolute', top: '4px', right: '4px', zIndex: 20, display: 'flex', gap: '2px', background: '#0F6E56', borderRadius: '6px', padding: '3px' }}>
                        <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'up') }} disabled={i === 0}
                          style={{ padding: '4px', background: 'none', border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer', color: 'white', opacity: i === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center' }} title="Gore"><ChevronUp size={13} /></button>
                        <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'down') }} disabled={i === blocks.length - 1}
                          style={{ padding: '4px', background: 'none', border: 'none', cursor: i === blocks.length - 1 ? 'not-allowed' : 'pointer', color: 'white', opacity: i === blocks.length - 1 ? 0.3 : 1, display: 'flex', alignItems: 'center' }} title="Dolje"><ChevronDown size={13} /></button>
                        <button onClick={e => { e.stopPropagation(); duplicateBlock(block.id) }}
                          style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }} title="Duplikat"><Copy size={13} /></button>
                        <button onClick={e => { e.stopPropagation(); removeBlock(block.id) }}
                          style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', display: 'flex', alignItems: 'center' }} title="Obriši"><Trash2 size={13} /></button>
                      </div>
                    </>
                  )}
                  <div dangerouslySetInnerHTML={{ __html: renderBlockHTML(block, device, !previewMode) }} />
                </div>
              )
            })}

            {blocks.length > 0 && !previewMode && (
              <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px dashed #E5E7EB' }}>
                <button onClick={() => setPanelTab('blokovi')}
                  style={{ padding: '7px 18px', background: 'transparent', color: '#9CA3AF', border: '1px dashed #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                  + Dodaj blok
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#0B0F19}
        ::-webkit-scrollbar-thumb{background:#1E293B;border-radius:2px}
        ::-webkit-scrollbar-thumb:hover{background:#374151}
      `}</style>
    </div>
  )
}

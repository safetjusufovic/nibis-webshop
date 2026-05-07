'use client'

import { useEffect } from 'react'

// Ova komponenta se mountuje na svakoj stranici.
// Aktivira se SAMO ako je stranica učitana u iframe (Visual Editor).
// Pruža click-to-edit i live theme update bez refresha.
export default function EditorBridge() {
  useEffect(() => {
    // Provjeri da li smo u iframeu
    const inIframe = window.self !== window.top
    if (!inIframe) return

    let editMode = false

    // ── Overlay ────────────────────────────────────────────────────────────
    const overlay = document.createElement('div')
    overlay.id = '__editor_overlay'
    overlay.style.cssText = [
      'position:fixed', 'pointer-events:none', 'z-index:2147483647',
      'border:2px solid #7C3AED', 'border-radius:4px',
      'background:rgba(124,58,237,0.07)', 'transition:all 0.06s',
      'display:none', 'box-shadow:0 0 0 4px rgba(124,58,237,0.12)',
    ].join(';')

    const tooltip = document.createElement('div')
    tooltip.style.cssText = [
      'position:absolute', 'top:-26px', 'left:0',
      'background:#7C3AED', 'color:white', 'font-size:10px',
      'font-weight:700', 'padding:3px 8px', 'border-radius:4px',
      'white-space:nowrap', "font-family:'DM Sans',sans-serif",
    ].join(';')
    overlay.appendChild(tooltip)
    document.body.appendChild(overlay)

    // ── Section detection ──────────────────────────────────────────────────
    function detect(el: Element): { sekcija: string; label: string } {
      if (el.closest('[data-sekcija]')) {
        const s = el.closest('[data-sekcija]')!.getAttribute('data-sekcija')!
        const labels: Record<string, string> = { hero: '🖼️ Hero', header: '🔝 Header', footer: '🔚 Footer', announcement: '📢 Bar' }
        return { sekcija: s, label: labels[s] || s }
      }
      if (el.closest('#announcement-bar')) return { sekcija: 'announcement', label: '📢 Announcement Bar' }
      if (el.closest('header')) return { sekcija: 'header', label: '🔝 Header' }
      if (el.closest('footer')) return { sekcija: 'footer', label: '🔚 Footer' }
      const tag = el.tagName.toLowerCase()
      if (['h1', 'h2', 'h3'].includes(tag)) return { sekcija: 'tipografija', label: `${tag.toUpperCase()} naslov` }
      if (tag === 'p') return { sekcija: 'tipografija', label: 'Paragraf' }
      if (tag === 'button' || el.closest('button')) return { sekcija: 'dugmad', label: 'Dugme' }
      if (tag === 'img') return { sekcija: 'hero', label: 'Slika' }
      return { sekcija: 'boje', label: el.tagName }
    }

    // ── Mouse events ──────────────────────────────────────────────────────
    function onOver(e: MouseEvent) {
      if (!editMode) return
      const el = e.target as Element
      if (el === document.body || el === document.documentElement || overlay.contains(el)) return
      const rect = el.getBoundingClientRect()
      overlay.style.display = 'block'
      overlay.style.left = (rect.left + window.scrollX) + 'px'
      overlay.style.top = (rect.top + window.scrollY) + 'px'
      overlay.style.width = rect.width + 'px'
      overlay.style.height = rect.height + 'px'
      tooltip.textContent = detect(el).label
    }

    function onOut() { overlay.style.display = 'none' }

    function onClickCapture(e: MouseEvent) {
      if (!editMode) return
      e.preventDefault(); e.stopPropagation()
      const el = e.target as Element
      const { sekcija, label } = detect(el)
      // Flash
      ;(el as HTMLElement).style.outline = '3px solid #7C3AED'
      setTimeout(() => { (el as HTMLElement).style.outline = '' }, 400)
      window.parent.postMessage({
        type: 'ELEMENT_CLICKED',
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim().slice(0, 80) || '',
        sekcija, label, elementType: sekcija,
      }, '*')
    }

    // ── Apply theme updates ────────────────────────────────────────────────
    function apply(key: string, value: string) {
      const r = document.documentElement
      const vars: Record<string, string> = {
        theme_primary_boja: '--brand', theme_bg_stranica: '--surface',
        theme_bg_kartica: '--bg-kartica', theme_border_boja: '--border',
        theme_tekst_boja: '--text', theme_tekst_muted: '--text-muted',
      }
      if (vars[key]) { r.style.setProperty(vars[key], value); if (key === 'theme_primary_boja') { r.style.setProperty('--brand-pale', value + '18'); r.style.setProperty('--brand-dark', value + 'dd') }; return }
      if (key === 'theme_border_radius') { r.style.setProperty('--radius', value + 'px'); return }
      if (key === 'theme_kartica_radius') { r.style.setProperty('--kartica-radius', value + 'px'); return }
      if (key === 'theme_font_body_size') { document.body.style.fontSize = value + 'px'; return }
      if (key === 'theme_font' || key === 'theme_google_font_tijelo') {
        document.body.style.fontFamily = `'${value}',DM Sans,system-ui,sans-serif`
        const id = 'editor-font'; document.getElementById(id)?.remove()
        const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'
        l.href = `https://fonts.googleapis.com/css2?family=${value.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`
        document.head.appendChild(l); return
      }
      if (key === 'theme_custom_css') {
        let s = document.getElementById('editor-custom-css')
        if (!s) { s = document.createElement('style'); s.id = 'editor-custom-css'; document.head.appendChild(s) }
        s.textContent = value; return
      }
      // Header
      if (key === 'theme_header_boja') { document.querySelectorAll('header').forEach((h: any) => h.style.setProperty('background', value, 'important')); return }
      if (key === 'theme_header_tekst_boja') { document.querySelectorAll('header').forEach((h: any) => h.style.setProperty('color', value, 'important')); return }
      if (key === 'theme_header_visina') { document.querySelectorAll('header > div').forEach((h: any) => h.style.minHeight = value + 'px'); return }
      if (key === 'theme_header_shadow') { document.querySelectorAll('header').forEach((h: any) => h.style.boxShadow = value === 'true' ? '0 1px 8px rgba(0,0,0,0.08)' : 'none'); return }
      // Hero
      if (key === 'hero_naslov') { document.querySelectorAll('[data-hero-naslov]').forEach(e => e.textContent = value); return }
      if (key === 'hero_podnaslov') { document.querySelectorAll('[data-hero-podnaslov]').forEach(e => e.textContent = value); return }
      if (key === 'hero_dugme_tekst') { document.querySelectorAll('[data-hero-dugme]').forEach(e => e.textContent = value + ' →'); return }
      if (key === 'hero_boja_pozadine') {
        document.querySelectorAll('[data-hero-section]').forEach((el: any) => {
          const slika = el.getAttribute('data-hero-slika') || ''
          el.setAttribute('data-hero-boja', value)
          el.style.background = slika ? `linear-gradient(rgba(0,0,0,0.35),rgba(0,0,0,0.35)),url(${slika}) center/cover no-repeat` : value
        }); return
      }
      if (key === 'hero_slika_url' || key === 'hero_url_slike') {
        document.querySelectorAll('[data-hero-section]').forEach((el: any) => {
          const boja = el.getAttribute('data-hero-boja') || '#0F6E56'
          const overlay = el.getAttribute('data-hero-overlay') || '0.35'
          el.setAttribute('data-hero-slika', value)
          el.style.background = value ? `linear-gradient(rgba(0,0,0,${overlay}),rgba(0,0,0,${overlay})),url(${value}) center/cover no-repeat` : boja
        }); return
      }
      if (key === 'hero_visina') { document.querySelectorAll('[data-hero-section]').forEach((e: any) => e.style.minHeight = value + 'px'); return }
      if (key === 'hero_overlay_opacity') {
        document.querySelectorAll('[data-hero-section]').forEach((el: any) => {
          el.setAttribute('data-hero-overlay', value)
          const slika = el.getAttribute('data-hero-slika') || ''
          const boja = el.getAttribute('data-hero-boja') || '#0F6E56'
          el.style.background = slika ? `linear-gradient(rgba(0,0,0,${value}),rgba(0,0,0,${value})),url(${slika}) center/cover no-repeat` : boja
        }); return
      }
      // Announcement
      if (key === 'announcement_bar') { const b = document.getElementById('announcement-bar'); if (b) { b.style.display = value ? '' : 'none'; b.querySelector('[data-announcement-text]')!.textContent = value }; return }
      if (key === 'baner_boja_pozadine') { const b = document.getElementById('announcement-bar'); if (b) (b as any).style.background = value; return }
      if (key === 'baner_boja_teksta') { const b = document.getElementById('announcement-bar'); if (b) (b as any).style.color = value; return }
      // Footer
      if (key === 'theme_footer_boja') { document.querySelectorAll('footer').forEach((f: any) => f.style.background = value); return }
      if (key === 'theme_footer_tekst') { document.querySelectorAll('[data-footer-tekst]').forEach(e => e.textContent = value); return }
      if (key === 'shop_email') { document.querySelectorAll('[data-footer-email]').forEach(e => { e.textContent = value; (e as any).href = `mailto:${value}` }); return }
      if (key === 'shop_naziv') { document.querySelectorAll('[data-shop-naziv]').forEach(e => e.textContent = value); return }
    }

    // ── Listen ────────────────────────────────────────────────────────────
    function onMsg(e: MessageEvent) {
      if (!e.data?.type) return
      if (e.data.type === 'SET_EDIT_MODE') {
        editMode = e.data.active
        document.body.style.cursor = editMode ? 'crosshair' : ''
        if (!editMode) overlay.style.display = 'none'
      }
      if (e.data.type === 'THEME_UPDATE') apply(e.data.key, e.data.value)
      if (e.data.type === 'PING') window.parent.postMessage({ type: 'PONG' }, '*')
    }

    document.addEventListener('mouseover', onOver, true)
    document.addEventListener('mouseout', onOut, true)
    document.addEventListener('click', onClickCapture, true)
    window.addEventListener('message', onMsg)

    // Signal parent da smo spremni
    window.parent.postMessage({ type: 'PREVIEW_READY' }, '*')

    return () => {
      document.removeEventListener('mouseover', onOver, true)
      document.removeEventListener('mouseout', onOut, true)
      document.removeEventListener('click', onClickCapture, true)
      window.removeEventListener('message', onMsg)
      overlay.remove()
    }
  }, [])

  return null
}

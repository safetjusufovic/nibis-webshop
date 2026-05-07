'use client'

// editor-preview/page.tsx
// Ova stranica se učitava u iframe vizuelnog editora.
// Ona ODMAH redirectuje na / ali injektuje click-to-edit logiku
// kroz window.addEventListener('message') PRIJE redirecta.

import { useEffect } from 'react'

export default function EditorPreview() {
  useEffect(() => {
    // Injektuj logiku u iframe ODMAH
    injectEditorLogic()
    // Ne radimo redirect — ostajemo na / direkt kroz iframe src="/"
  }, [])

  return null
}

function injectEditorLogic() {
  let editMode = false

  // Overlay element za highlight
  const overlay = document.createElement('div')
  overlay.id = '__editor_overlay'
  overlay.style.cssText = [
    'position:fixed', 'pointer-events:none', 'z-index:2147483647',
    'border:2px solid #7C3AED', 'border-radius:4px',
    'background:rgba(124,58,237,0.08)', 'transition:all 0.08s',
    'display:none', 'box-shadow:0 0 0 4px rgba(124,58,237,0.15)',
  ].join(';')

  const tooltipEl = document.createElement('div')
  tooltipEl.style.cssText = [
    'position:absolute', 'top:-28px', 'left:0',
    'background:#7C3AED', 'color:white', 'font-size:10px',
    'font-weight:700', 'padding:3px 8px', 'border-radius:4px',
    'white-space:nowrap', "font-family:'DM Sans',sans-serif",
    'pointer-events:none',
  ].join(';')
  overlay.appendChild(tooltipEl)
  document.body.appendChild(overlay)

  function getSectionAndLabel(el: Element): { sekcija: string; label: string } {
    if (el.closest('[data-sekcija="hero"]') || el.closest('[data-hero]')) return { sekcija: 'hero', label: '🖼️ Hero Banner' }
    if (el.closest('[data-sekcija="announcement"]') || el.id === 'announcement-bar' || el.closest('#announcement-bar')) return { sekcija: 'announcement', label: '📢 Announcement Bar' }
    if (el.closest('header') || el.closest('[data-sekcija="header"]')) return { sekcija: 'header', label: '🔝 Header' }
    if (el.closest('footer') || el.closest('[data-sekcija="footer"]')) return { sekcija: 'footer', label: '🔚 Footer' }
    if (el.closest('[data-sekcija="akcije"]') || el.closest('[data-akcije]')) return { sekcija: 'boje', label: '⭐ Akcije' }
    const tag = el.tagName.toLowerCase()
    if (tag === 'h1') return { sekcija: 'tipografija', label: 'H1 Naslov' }
    if (tag === 'h2') return { sekcija: 'tipografija', label: 'H2 Naslov' }
    if (tag === 'h3') return { sekcija: 'tipografija', label: 'H3 Naslov' }
    if (tag === 'p' || tag === 'span') return { sekcija: 'tipografija', label: 'Tekst' }
    if (tag === 'button' || el.closest('button')) return { sekcija: 'dugmad', label: 'Dugme' }
    if (tag === 'a' || el.closest('a')) return { sekcija: 'dugmad', label: 'Link' }
    if (tag === 'img') return { sekcija: 'hero', label: '🖼️ Slika' }
    if (tag === 'input') return { sekcija: 'tipografija', label: 'Input polje' }
    return { sekcija: 'boje', label: el.tagName }
  }

  function onMouseOver(e: MouseEvent) {
    if (!editMode) return
    const el = e.target as Element
    if (el === overlay || overlay.contains(el) || el === document.body || el === document.documentElement) return
    const rect = el.getBoundingClientRect()
    const { label } = getSectionAndLabel(el)
    overlay.style.display = 'block'
    overlay.style.left = (rect.left + window.scrollX) + 'px'
    overlay.style.top = (rect.top + window.scrollY) + 'px'
    overlay.style.width = rect.width + 'px'
    overlay.style.height = rect.height + 'px'
    tooltipEl.textContent = label
  }

  function onMouseOut(e: MouseEvent) {
    const relEl = e.relatedTarget as Element
    if (relEl && (relEl === overlay || overlay.contains(relEl))) return
    overlay.style.display = 'none'
  }

  function onClick(e: MouseEvent) {
    if (!editMode) return
    e.preventDefault(); e.stopPropagation()
    const el = e.target as Element
    const { sekcija, label } = getSectionAndLabel(el)
    const text = el.textContent?.trim().slice(0, 80) || ''
    const tag = el.tagName.toLowerCase()

    // Flash efekt
    const origOutline = (el as HTMLElement).style?.outline || ''
    const origTransition = (el as HTMLElement).style?.transition || ''
    ;(el as HTMLElement).style.outline = '3px solid #7C3AED'
    ;(el as HTMLElement).style.transition = 'outline 0.3s'
    setTimeout(() => {
      ;(el as HTMLElement).style.outline = origOutline
      ;(el as HTMLElement).style.transition = origTransition
    }, 500)

    window.parent.postMessage({
      type: 'ELEMENT_CLICKED',
      tag, text, sekcija, label,
      elementType: sekcija,
    }, '*')
  }

  function applyThemeUpdate(key: string, value: string) {
    const r = document.documentElement

    // CSS varijable — direktno
    const cssVarMap: Record<string, string> = {
      theme_primary_boja: '--brand',
      theme_bg_stranica: '--surface',
      theme_bg_kartica: '--bg-kartica',
      theme_border_boja: '--border',
      theme_tekst_boja: '--text',
      theme_tekst_muted: '--text-muted',
    }
    if (cssVarMap[key]) {
      r.style.setProperty(cssVarMap[key], value)
      if (key === 'theme_primary_boja') {
        r.style.setProperty('--brand-pale', value + '18')
        r.style.setProperty('--brand-dark', value + 'dd')
      }
      return
    }

    if (key === 'theme_border_radius') { r.style.setProperty('--radius', value + 'px'); return }
    if (key === 'theme_kartica_radius') { r.style.setProperty('--kartica-radius', value + 'px'); return }
    if (key === 'theme_animacije_speed') { r.style.setProperty('--transition', value + 'ms'); return }
    if (key === 'theme_font_body_size') { document.body.style.fontSize = value + 'px'; return }

    if (key === 'theme_font' || key === 'theme_google_font_tijelo') {
      document.body.style.fontFamily = `'${value}', DM Sans, system-ui, sans-serif`
      // Load from Google Fonts
      const id = 'editor-font-tijelo'
      document.getElementById(id)?.remove()
      const link = document.createElement('link')
      link.id = id; link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${value.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`
      document.head.appendChild(link)
      return
    }

    if (key === 'theme_custom_css') {
      let el = document.getElementById('theme-custom-css-editor')
      if (!el) { el = document.createElement('style'); el.id = 'theme-custom-css-editor'; document.head.appendChild(el) }
      el.textContent = value; return
    }

    // Hero direktno
    if (key === 'hero_naslov') { document.querySelectorAll('[data-hero-naslov]').forEach(e => e.textContent = value); return }
    if (key === 'hero_podnaslov') { document.querySelectorAll('[data-hero-podnaslov]').forEach(e => e.textContent = value); return }
    if (key === 'hero_dugme_tekst') { document.querySelectorAll('[data-hero-dugme]').forEach(e => e.textContent = value + ' →'); return }
    if (key === 'hero_boja_pozadine' || key === 'hero_slika_url' || key === 'hero_url_slike') {
      document.querySelectorAll('[data-hero-section]').forEach((el: any) => {
        const boja = el.getAttribute('data-hero-boja') || '#0F6E56'
        const slika = key === 'hero_slika_url' || key === 'hero_url_slike' ? value : el.getAttribute('data-hero-slika') || ''
        const overlay = el.getAttribute('data-hero-overlay') || '0.35'
        if (key !== 'hero_slika_url' && key !== 'hero_url_slike') el.setAttribute('data-hero-boja', value)
        else el.setAttribute('data-hero-slika', value)
        el.style.background = slika
          ? `linear-gradient(rgba(0,0,0,${overlay}),rgba(0,0,0,${overlay})),url(${slika}) center/cover no-repeat`
          : (key !== 'hero_slika_url' && key !== 'hero_url_slike' ? value : boja)
      })
      return
    }
    if (key === 'hero_visina') { document.querySelectorAll('[data-hero-section]').forEach((e: any) => e.style.minHeight = value + 'px'); return }
    if (key === 'hero_overlay_opacity') {
      document.querySelectorAll('[data-hero-section]').forEach((el: any) => {
        const boja = el.getAttribute('data-hero-boja') || '#0F6E56'
        const slika = el.getAttribute('data-hero-slika') || ''
        el.setAttribute('data-hero-overlay', value)
        if (slika) el.style.background = `linear-gradient(rgba(0,0,0,${value}),rgba(0,0,0,${value})),url(${slika}) center/cover no-repeat`
        else el.style.background = boja
      })
      return
    }

    // Header direktno
    if (key === 'theme_header_boja') { document.querySelectorAll('header').forEach((h: any) => h.style.setProperty('background', value, 'important')); return }
    if (key === 'theme_header_tekst_boja') { document.querySelectorAll('header').forEach((h: any) => h.style.setProperty('color', value, 'important')); return }
    if (key === 'theme_header_visina') { document.querySelectorAll('header > div').forEach((h: any) => h.style.minHeight = value + 'px'); return }
    if (key === 'theme_header_shadow') {
      document.querySelectorAll('header').forEach((h: any) => h.style.boxShadow = value === 'true' ? '0 1px 8px rgba(0,0,0,0.08)' : 'none'); return
    }

    // Announcement bar
    if (key === 'announcement_bar') {
      const bar = document.getElementById('announcement-bar')
      if (bar) { bar.style.display = value ? '' : 'none'; const t = bar.querySelector('[data-announcement-text]'); if (t) t.textContent = value }
      return
    }
    if (key === 'baner_boja_pozadine') { const bar = document.getElementById('announcement-bar'); if (bar) (bar as any).style.background = value; return }
    if (key === 'baner_boja_teksta') { const bar = document.getElementById('announcement-bar'); if (bar) (bar as any).style.color = value; return }

    // Shop naziv
    if (key === 'shop_naziv') { document.querySelectorAll('[data-shop-naziv]').forEach(e => e.textContent = value); return }

    // Footer
    if (key === 'theme_footer_boja') { document.querySelectorAll('footer').forEach((f: any) => f.style.background = value); return }
    if (key === 'theme_footer_tekst') { document.querySelectorAll('[data-footer-tekst]').forEach(e => e.textContent = value); return }
    if (key === 'shop_email') { document.querySelectorAll('[data-footer-email]').forEach(e => { e.textContent = value; (e as any).href = `mailto:${value}` }); return }
  }

  function onMessage(e: MessageEvent) {
    if (!e.data?.type) return
    if (e.data.type === 'SET_EDIT_MODE') {
      editMode = e.data.active
      document.body.style.cursor = editMode ? 'crosshair' : ''
      if (!editMode) overlay.style.display = 'none'
    }
    if (e.data.type === 'THEME_UPDATE') {
      applyThemeUpdate(e.data.key, e.data.value)
    }
    if (e.data.type === 'PING') {
      window.parent.postMessage({ type: 'PONG' }, '*')
    }
  }

  document.addEventListener('mouseover', onMouseOver, true)
  document.addEventListener('mouseout', onMouseOut, true)
  document.addEventListener('click', onClick, true)
  window.addEventListener('message', onMessage)

  // Signal ready
  window.parent.postMessage({ type: 'PREVIEW_READY' }, '*')
}

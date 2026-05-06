'use client'

import { useEffect } from 'react'

// Ova stranica se učitava u iframe vizuelnog editora
// Injektuje click-to-edit logiku
export default function EditorPreview() {
  useEffect(() => {
    let editMode = false
    let overlay: HTMLDivElement | null = null

    function createOverlay() {
      overlay = document.createElement('div')
      overlay.style.cssText = `
        position: fixed; pointer-events: none; z-index: 99999;
        border: 2px solid #7C3AED; border-radius: 4px;
        background: rgba(124,58,237,0.1);
        transition: all 0.1s ease;
        display: none;
      `
      document.body.appendChild(overlay)
    }

    function getElementType(el: Element): string {
      const tag = el.tagName.toLowerCase()
      // Pokušaj identifikovati sekciju
      const parent = el.closest('[data-sekcija]')
      if (parent) return parent.getAttribute('data-sekcija') || tag

      // Header detection
      if (el.closest('header')) return 'header'
      if (el.closest('footer')) return 'footer'

      // Announcement bar (obično prvi div)
      const rect = el.getBoundingClientRect()
      if (rect.top < 50 && el.closest('div')) return 'announcement'

      return tag
    }

    function onMouseOver(e: MouseEvent) {
      if (!editMode) return
      const el = e.target as Element
      if (!overlay) return
      const rect = el.getBoundingClientRect()
      overlay.style.display = 'block'
      overlay.style.left = rect.left + window.scrollX + 'px'
      overlay.style.top = rect.top + window.scrollY + 'px'
      overlay.style.width = rect.width + 'px'
      overlay.style.height = rect.height + 'px'
    }

    function onMouseOut() {
      if (overlay) overlay.style.display = 'none'
    }

    function onClick(e: MouseEvent) {
      if (!editMode) return
      e.preventDefault()
      e.stopPropagation()
      const el = e.target as Element
      const tag = el.tagName.toLowerCase()
      const text = el.textContent?.trim().slice(0, 50) || ''
      const elementType = getElementType(el)

      // Pošalji roditeljskom prozoru
      window.parent.postMessage({
        type: 'ELEMENT_CLICKED',
        tag,
        text,
        elementType,
        rect: el.getBoundingClientRect(),
      }, '*')

      // Visual feedback
      el.animate([
        { outline: '3px solid #7C3AED', outlineOffset: '2px' },
        { outline: '3px solid transparent', outlineOffset: '4px' },
      ], { duration: 600, easing: 'ease-out' })
    }

    // Slušaj postMessage od roditelja
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'SET_EDIT_MODE') {
        editMode = e.data.active
        document.body.style.cursor = editMode ? 'crosshair' : ''
        if (!editMode && overlay) overlay.style.display = 'none'
      }
      if (e.data?.type === 'THEME_UPDATE') {
        applyThemeUpdate(e.data.key, e.data.value)
      }
    }

    function applyThemeUpdate(key: string, value: string) {
      const r = document.documentElement
      if (key === 'theme_primary_boja') {
        r.style.setProperty('--brand', value)
        r.style.setProperty('--brand-pale', value + '18')
      }
      if (key === 'theme_bg_stranica') r.style.setProperty('--surface', value)
      if (key === 'theme_border_boja') r.style.setProperty('--border', value)
      if (key === 'theme_tekst_boja') r.style.setProperty('--text', value)
      if (key === 'theme_font') document.body.style.fontFamily = value + ', DM Sans, sans-serif'
    }

    createOverlay()
    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseout', onMouseOut)
    document.addEventListener('click', onClick, true)
    window.addEventListener('message', onMessage)

    return () => {
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseout', onMouseOut)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('message', onMessage)
      overlay?.remove()
    }
  }, [])

  // Redirect na homepage sadržaj
  useEffect(() => {
    window.location.replace('/')
  }, [])

  return null
}

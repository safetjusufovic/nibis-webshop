'use client'

import { useEffect } from 'react'

const KEYS = [
  'theme_primary_boja', 'theme_bg_stranica', 'theme_bg_kartica',
  'theme_border_boja', 'theme_tekst_boja', 'theme_tekst_muted',
  'theme_border_radius', 'theme_font', 'theme_kartica_radius',
  'theme_animacije_speed', 'theme_font_body_size',
  'theme_custom_css', 'theme_google_font_naslov', 'theme_google_font_tijelo',
  'theme_gradient_primary', 'theme_gradient_boja2', 'theme_gradient_ugao',
  'theme_cijena_boja', 'theme_akcija_boja', 'theme_header_boja', 'theme_header_tekst_boja',
]

export default function ThemeProvider({ children, shopSlug = '' }: { children: React.ReactNode; shopSlug?: string }) {
  useEffect(() => {
    const shopParam = shopSlug ? '&shop=' + shopSlug : ''
    fetch('/api/postavke?kljuci=' + KEYS.join(',') + shopParam)
      .then(r => r.json())
      .then(data => { if (data) apply(data) })
      .catch(() => {})
  }, [shopSlug])

  return <>{children}</>
}

function apply(m: Record<string, string>) {
  const r = document.documentElement
  if (m.theme_primary_boja) {
    const isGrad = m.theme_gradient_primary === 'true' && m.theme_gradient_boja2
    const grad = isGrad ? `linear-gradient(${m.theme_gradient_ugao || 135}deg, ${m.theme_primary_boja}, ${m.theme_gradient_boja2})` : m.theme_primary_boja
    r.style.setProperty('--brand', m.theme_primary_boja)
    r.style.setProperty('--brand-gradient', grad)
    r.style.setProperty('--brand-pale', m.theme_primary_boja + '18')
    r.style.setProperty('--brand-dark', m.theme_primary_boja + 'dd')
    r.style.setProperty('--brand-light', m.theme_primary_boja + 'ee')
  }
  if (m.theme_bg_stranica) r.style.setProperty('--surface', m.theme_bg_stranica)
  if (m.theme_bg_kartica) r.style.setProperty('--bg-kartica', m.theme_bg_kartica)
  if (m.theme_border_boja) r.style.setProperty('--border', m.theme_border_boja)
  if (m.theme_tekst_boja) r.style.setProperty('--text', m.theme_tekst_boja)
  if (m.theme_tekst_muted) r.style.setProperty('--text-muted', m.theme_tekst_muted)
  if (m.theme_border_radius) r.style.setProperty('--radius', m.theme_border_radius + 'px')
  if (m.theme_kartica_radius) r.style.setProperty('--kartica-radius', m.theme_kartica_radius + 'px')
  if (m.theme_animacije_speed) r.style.setProperty('--transition', m.theme_animacije_speed + 'ms')
  const font = m.theme_google_font_tijelo || m.theme_font || 'DM Sans'
  if (font) document.body.style.fontFamily = font + ', DM Sans, system-ui, sans-serif'
  if (m.theme_font_body_size) document.body.style.fontSize = m.theme_font_body_size + 'px'
  const fonts = [m.theme_google_font_naslov, m.theme_google_font_tijelo].filter(Boolean)
  if (fonts.length) {
    const id = 'theme-google-fonts'
    document.getElementById(id)?.remove()
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f!.replace(/ /g, '+')}:wght@400;500;600;700`).join('&')}&display=swap`
    document.head.appendChild(link)
  }
  if (m.theme_cijena_boja) r.style.setProperty('--cijena', m.theme_cijena_boja)
  if (m.theme_akcija_boja) r.style.setProperty('--akcija', m.theme_akcija_boja)
  if (m.theme_custom_css) {
    const id = 'theme-custom-css'
    document.getElementById(id)?.remove()
    const style = document.createElement('style')
    style.id = id; style.textContent = m.theme_custom_css
    document.head.appendChild(style)
  }
}

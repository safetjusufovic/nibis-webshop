'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    supabase.from('postavke').select('kljuc, vrijednost')
      .in('kljuc', [
        'theme_primary_boja', 'theme_bg_stranica', 'theme_bg_kartica',
        'theme_border_boja', 'theme_tekst_boja', 'theme_tekst_muted',
        'theme_border_radius', 'theme_font', 'theme_header_boja',
        'theme_header_tekst_boja', 'theme_cijena_boja', 'theme_akcija_boja',
        'theme_font_body_size', 'theme_kartica_radius',
      ])
      .then(({ data }) => {
        if (!data) return
        const m: Record<string, string> = {}
        data.forEach(p => { m[p.kljuc] = p.vrijednost })
        const r = document.documentElement

        if (m.theme_primary_boja) {
          r.style.setProperty('--brand', m.theme_primary_boja)
          r.style.setProperty('--brand-dark', m.theme_primary_boja)
          r.style.setProperty('--brand-light', m.theme_primary_boja)
          r.style.setProperty('--brand-pale', m.theme_primary_boja + '18')
        }
        if (m.theme_bg_stranica) r.style.setProperty('--surface', m.theme_bg_stranica)
        if (m.theme_border_boja) r.style.setProperty('--border', m.theme_border_boja)
        if (m.theme_tekst_boja) r.style.setProperty('--text', m.theme_tekst_boja)
        if (m.theme_tekst_muted) r.style.setProperty('--text-muted', m.theme_tekst_muted)
        if (m.theme_border_radius) r.style.setProperty('--radius', m.theme_border_radius + 'px')
        if (m.theme_font) {
          document.body.style.fontFamily = m.theme_font + ', DM Sans, system-ui, sans-serif'
        }
        if (m.theme_font_body_size) {
          document.body.style.fontSize = m.theme_font_body_size + 'px'
        }
      })
  }, [])

  return <>{children}</>
}

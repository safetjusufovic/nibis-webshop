'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    supabase.from('postavke').select('kljuc, vrijednost')
      .in('kljuc', [
        'theme_primary_boja', 'theme_header_boja', 'theme_header_tekst_boja',
        'theme_footer_boja', 'theme_border_radius', 'theme_font',
        'baner_boja_pozadine', 'baner_boja_teksta',
      ])
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, string> = {}
        data.forEach(p => { map[p.kljuc] = p.vrijednost })

        const root = document.documentElement

        if (map.theme_primary_boja) {
          root.style.setProperty('--brand', map.theme_primary_boja)
          // Deriviraj light i dark varijante
          root.style.setProperty('--brand-light', map.theme_primary_boja + 'dd')
          root.style.setProperty('--brand-dark', map.theme_primary_boja + 'aa')
          root.style.setProperty('--brand-pale', map.theme_primary_boja + '18')
        }
        if (map.theme_border_radius) {
          root.style.setProperty('--radius', map.theme_border_radius + 'px')
        }
        if (map.theme_font) {
          root.style.setProperty('--font', map.theme_font + ', DM Sans, system-ui, sans-serif')
          document.body.style.fontFamily = map.theme_font + ', DM Sans, system-ui, sans-serif'
        }
      })
  }, [])

  return <>{children}</>
}

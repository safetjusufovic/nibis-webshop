'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { siteConfig } from '@/lib/config'

interface LogoConfig {
  shop_naziv: string
  theme_logo_url: string
}

// Cache da ne fetcha svaki put
let cachedConfig: LogoConfig | null = null

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const [cfg, setCfg] = useState<LogoConfig>({
    shop_naziv: siteConfig.name || '',
    theme_logo_url: siteConfig.logoUrl || '',
  })

  useEffect(() => {
    if (cachedConfig) { setCfg(cachedConfig); return }
    supabase.from('postavke').select('kljuc, vrijednost')
      .in('kljuc', ['shop_naziv', 'theme_logo_url'])
      .then(({ data }) => {
        const m: any = {}
        data?.forEach(r => { m[r.kljuc] = r.vrijednost })
        const config = {
          shop_naziv: m.shop_naziv || siteConfig.name || 'WebShop',
          theme_logo_url: m.theme_logo_url || siteConfig.logoUrl || '',
        }
        cachedConfig = config
        setCfg(config)
      })
  }, [])

  const s = size === 'sm' ? 28 : size === 'md' ? 34 : 44
  const fs = size === 'sm' ? 13 : size === 'md' ? 15 : 20
  const naziv = cfg.shop_naziv || 'WebShop'
  const parts = naziv.split(' ')
  const line1 = parts[0]
  const line2 = parts.slice(1).join(' ')

  // Ako ima custom logo sliku — prikaži je
  if (cfg.theme_logo_url) {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={cfg.theme_logo_url}
          alt={naziv}
          style={{
            height: s + 'px',
            maxWidth: '180px',
            objectFit: 'contain',
          }}
        />
      </div>
    )
  }

  // Generirani logo s nazivom
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="9" fill="var(--brand)"/>
        <text x="20" y="26" textAnchor="middle" fontSize="18" fontWeight="700" fill="white" fontFamily="system-ui">
          {line1[0]?.toUpperCase() || 'W'}
        </text>
      </svg>
      <div style={{ lineHeight: 1.15 }}>
        <div style={{ fontSize: fs, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          {line1}
        </div>
        {line2 && (
          <div style={{ fontSize: fs - 1, fontWeight: 400, color: 'var(--brand)', letterSpacing: '-0.01em' }}>
            {line2}
          </div>
        )}
      </div>
    </div>
  )
}

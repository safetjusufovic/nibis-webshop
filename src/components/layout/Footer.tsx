'use client'

import { shopFetch } from '@/lib/shopFetch'
import { useState, useEffect } from 'react'
import { siteConfig } from '@/lib/config'

export default function Footer() {

  const [p, setP] = useState<Record<string, string>>({})
  const [grupe, setGrupe] = useState<any[]>([])

  useEffect(() => {
    shopFetch('/api/postavke?kljuci=shop_naziv,shop_email,shop_telefon,shop_adresa,shop_grad,shop_web,theme_footer_tekst,theme_footer_boja,theme_footer_bg_slika,theme_footer_logo_url,footer_kolone_aktivan,footer_kolona1_naslov,footer_kolona1_sadrzaj,footer_kolona2_naslov,footer_kolona2_sadrzaj,footer_kolona3_naslov,footer_kolona3_sadrzaj,footer_social_facebook,footer_social_instagram,footer_social_linkedin,footer_social_twitter,footer_social_youtube,footer_social_tiktok,footer_social_whatsapp,footer_social_viber,shop_watermark')
      .then(r => r.json()).then(setP).catch(() => {})
    shopFetch('/api/grupe')
      .then(r => r.json()).then(d => setGrupe((d.items || []).filter((g: any) => !g.parentId).slice(0, 8)))
      .catch(() => {})
  }, [])

  const socials = [
    { key: 'footer_social_facebook', label: 'Facebook', icon: '📘' },
    { key: 'footer_social_instagram', label: 'Instagram', icon: '📷' },
    { key: 'footer_social_linkedin', label: 'LinkedIn', icon: '💼' },
    { key: 'footer_social_twitter', label: 'X / Twitter', icon: '✖' },
    { key: 'footer_social_youtube', label: 'YouTube', icon: '▶' },
    { key: 'footer_social_tiktok', label: 'TikTok', icon: '♪' },
    { key: 'footer_social_whatsapp', label: 'WhatsApp', icon: '💬' },
    { key: 'footer_social_viber', label: 'Viber', icon: '📞' },
  ].filter(s => p[s.key])

  const bgStyle: React.CSSProperties = {
    background: p.theme_footer_bg_slika
      ? 'url(' + p.theme_footer_bg_slika + ') center/cover no-repeat'
      : (p.theme_footer_boja || '#f5f5f3'),
    borderTop: '1px solid #e5e7eb',
  }

  const col1Lines = (p.footer_kolona1_sadrzaj || '').split('\n').filter(Boolean)
  const col2Lines = (p.footer_kolona2_sadrzaj || '').split('\n').filter(Boolean)
  const col3Lines = (p.footer_kolona3_sadrzaj || '').split('\n').filter(Boolean)

  return (
    <footer style={bgStyle}>
      {/* Gornji dio — 4 kolone */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px 32px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px' }}>

        {/* Kolona 1 — Kategorije */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {grupe.length > 0 ? 'Kategorije' : (p.footer_kolona1_naslov || 'Kategorije')}
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(grupe.length > 0 ? grupe.map(g => ({ href: '/?grupaId=' + g.id, label: g.naziv })) : col1Lines.map(l => ({ href: '#', label: l }))).map((item, i) => (
              <li key={i}>
                <a href={item.href} style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Kolona 2 — Custom (iz postavki) */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {p.footer_kolona2_naslov || 'Informacije'}
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {col2Lines.length > 0 ? col2Lines.map((line, i) => (
              <li key={i}><a href="#" style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}
              >{line}</a></li>
            )) : [{ label: 'O nama', href: '/stranica/o-nama' }, { label: 'Vijesti', href: '/vijesti' }, { label: 'Dostava i plaćanje', href: '/stranica/dostava-i-placanje' }, { label: 'Uvjeti korištenja', href: '/stranica/uvjeti-koristenja' }, { label: 'Kontakt', href: '/stranica/kontakt' }].map((item, i) => (
              <li key={i}><a href={item.href || '#'} style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}
              >{item.label}</a></li>
            ))}
          </ul>
        </div>

        {/* Kolona 3 — Pratite nas */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Pratite nas
          </h4>
          {socials.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {socials.map(s => (
                <li key={s.key}>
                  <a href={p[s.key]} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#6B7280', textDecoration: 'none', paddingBottom: '10px', borderBottom: '1px solid #f0f0f0' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}
                  >
                    <span style={{ width: '28px', height: '28px', background: '#f3f4f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
                      {s.icon}
                    </span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.6 }}>
              Dodajte linkove društvenih mreža u Admin → Izgled → Logo i identitet.
            </p>
          )}
        </div>

        {/* Kolona 4 — Kontakt */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {p.footer_kolona3_naslov || 'Kontakt'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(p.shop_naziv || siteConfig.name) && (
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{p.shop_naziv || siteConfig.name}</div>
            )}
            {(p.shop_adresa || p.shop_grad) && (
              <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6 }}>
                {p.shop_adresa && <div>{p.shop_adresa}</div>}
                {p.shop_grad && <div>{p.shop_grad}</div>}
              </div>
            )}
            {col3Lines.length > 0 && (
              <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{p.footer_kolona3_sadrzaj}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
              {p.shop_telefon && (
                <a href={'tel:' + p.shop_telefon} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}
                >
                  <span style={{ fontSize: '14px' }}>📞</span> {p.shop_telefon}
                </a>
              )}
              {p.shop_email && (
                <a href={'mailto:' + p.shop_email} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--brand)', textDecoration: 'none', fontWeight: 500 }}>
                  <span style={{ fontSize: '14px' }}>✉</span> {p.shop_email}
                </a>
              )}
              {p.shop_web && (
                <a href={'https://' + p.shop_web.replace('https://', '')} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}
                >
                  <span style={{ fontSize: '14px' }}>🌐</span> {p.shop_web}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Donji bar — copyright */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {p.theme_footer_logo_url && (
              <img src={p.theme_footer_logo_url} alt="" style={{ height: '24px', objectFit: 'contain' }} />
            )}
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
              © {new Date().getFullYear()} {p.shop_naziv || siteConfig.name}
              {p.shop_watermark !== 'false' && <span style={{ opacity: 0.6 }}> · Powered by NIBIS</span>}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Impressum', 'Izjava o kolačićima', 'Pravila o privatnosti', 'Opći uslovi'].map(link => (
              <a key={link} href="#" style={{ fontSize: '11px', color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--brand)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#9CA3AF'}
              >{link}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}


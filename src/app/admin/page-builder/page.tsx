'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, ChevronLeft, Eye, Code, Monitor, Smartphone, Tablet } from 'lucide-react'
import Link from 'next/link'

export default function PageBuilderPage() {
  const editorRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  useEffect(() => {
    let gjs: any = null

    async function init() {
      // Dinamički import — samo na klientu
      const grapesjs = (await import('grapesjs')).default
      // @ts-ignore
      const presetWebpage = (await import('grapesjs-preset-webpage')).default

      // Učitaj postojeći sadržaj iz Supabase
      const { data } = await supabase.from('postavke').select('vrijednost').eq('kljuc', 'page_builder_html').single()
      const { data: cssData } = await supabase.from('postavke').select('vrijednost').eq('kljuc', 'page_builder_css').single()

      gjs = grapesjs.init({
        container: containerRef.current!,
        height: '100%',
        width: 'auto',
        storageManager: false, // Koristimo vlastiti storage
        plugins: [presetWebpage],
        pluginsOpts: {
          [presetWebpage as any]: {
            blocks: ['link-block', 'quote', 'text-basic'],
          }
        },

        // Komponente koje se mogu dodati
        blockManager: {
          appendTo: '#blocks-panel',
          blocks: [
            {
              id: 'hero-blok',
              label: '🖼️ Hero Banner',
              category: 'Webshop',
              content: `<section style="background: linear-gradient(135deg, #0F6E56, #059669); padding: 80px 40px; text-align: center; color: white;">
                <h1 style="font-size: 42px; font-weight: 800; margin: 0 0 16px; letter-spacing: -0.02em;">Dobrodošli u naš webshop</h1>
                <p style="font-size: 18px; opacity: 0.85; margin: 0 0 28px;">Profesionalna roba za vaše poslovanje</p>
                <a href="#" style="display: inline-block; background: white; color: #0F6E56; padding: 14px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 15px;">Pregledaj katalog →</a>
              </section>`,
            },
            {
              id: 'features-blok',
              label: '⭐ Prednosti',
              category: 'Webshop',
              content: `<section style="padding: 64px 40px; background: #f8fafa;">
                <h2 style="text-align: center; font-size: 28px; font-weight: 700; margin: 0 0 40px; color: #0d1f1a;">Zašto mi?</h2>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 900px; margin: 0 auto;">
                  <div style="text-align: center; padding: 28px; background: white; border-radius: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
                    <div style="font-size: 40px; margin-bottom: 12px;">🚀</div>
                    <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 8px; color: #0d1f1a;">Brza isporuka</h3>
                    <p style="font-size: 14px; color: #6b8279; margin: 0;">Naredni radni dan</p>
                  </div>
                  <div style="text-align: center; padding: 28px; background: white; border-radius: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
                    <div style="font-size: 40px; margin-bottom: 12px;">💎</div>
                    <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 8px; color: #0d1f1a;">Kvalitet</h3>
                    <p style="font-size: 14px; color: #6b8279; margin: 0;">Provjereni dobavljači</p>
                  </div>
                  <div style="text-align: center; padding: 28px; background: white; border-radius: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
                    <div style="font-size: 40px; margin-bottom: 12px;">🔒</div>
                    <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 8px; color: #0d1f1a;">Sigurnost</h3>
                    <p style="font-size: 14px; color: #6b8279; margin: 0;">Zaštićene transakcije</p>
                  </div>
                </div>
              </section>`,
            },
            {
              id: 'promo-banner',
              label: '📣 Promo Banner',
              category: 'Webshop',
              content: `<section style="background: #0F6E56; padding: 48px 40px; text-align: center; color: white;">
                <h2 style="font-size: 28px; font-weight: 800; margin: 0 0 10px;">Posebna ponuda za B2B partnere</h2>
                <p style="font-size: 16px; opacity: 0.85; margin: 0 0 22px;">Kontaktirajte nas za individualne cijene i uslove</p>
                <a href="#" style="display: inline-block; background: white; color: #0F6E56; padding: 12px 28px; border-radius: 8px; font-weight: 700; text-decoration: none;">Kontaktiraj nas</a>
              </section>`,
            },
            {
              id: 'newsletter-blok',
              label: '📧 Newsletter',
              category: 'Webshop',
              content: `<section style="padding: 64px 40px; background: white; text-align: center;">
                <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #0d1f1a;">Ostanite informisani</h2>
                <p style="font-size: 14px; color: #6b8279; margin: 0 0 24px;">Primajte obavijesti o novim artiklima i akcijama</p>
                <div style="display: flex; gap: 8px; max-width: 400px; margin: 0 auto;">
                  <input type="email" placeholder="vas@email.ba" style="flex: 1; padding: 10px 14px; border: 1px solid #e8edeb; border-radius: 8px; font-size: 14px; outline: none;"/>
                  <button style="padding: 10px 20px; background: #0F6E56; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap;">Prijavi se</button>
                </div>
              </section>`,
            },
            {
              id: 'kategorije-grid',
              label: '📁 Kategorije Grid',
              category: 'Webshop',
              content: `<section style="padding: 48px 40px; background: #f8fafa;">
                <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 28px; color: #0d1f1a;">Kategorije</h2>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
                  ${['Alati', 'Elektro', 'Hidraulika', 'Pneumatika', 'Maziva', 'Sigurnost', 'Vijci', 'Ostalo'].map(k => `
                  <a href="#" style="display: flex; flex-direction: column; align-items: center; padding: 20px 12px; background: white; border-radius: 12px; border: 1px solid #e8edeb; text-decoration: none; transition: all 0.2s;">
                    <div style="width: 48px; height: 48px; background: #0F6E56; border-radius: 10px; margin-bottom: 10px;"></div>
                    <span style="font-size: 13px; font-weight: 600; color: #0d1f1a;">${k}</span>
                  </a>`).join('')}
                </div>
              </section>`,
            },
            {
              id: 'tekst-slika',
              label: '📝 Tekst + Slika',
              category: 'Layout',
              content: `<section style="padding: 64px 40px; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center;">
                <div>
                  <h2 style="font-size: 32px; font-weight: 800; color: #0d1f1a; margin: 0 0 16px; line-height: 1.2;">Vaš pouzdan B2B partner</h2>
                  <p style="font-size: 16px; color: #6b8279; line-height: 1.7; margin: 0 0 24px;">Nudimo širok asortiman profesionalne robe sa brzom isporukom i konkurentnim cijenama za sve vaše poslovne potrebe.</p>
                  <a href="#" style="display: inline-block; background: #0F6E56; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Saznaj više</a>
                </div>
                <div style="background: #f0fdf4; border-radius: 16px; height: 300px; display: flex; align-items: center; justify-content: center; font-size: 64px;">🏭</div>
              </section>`,
            },
            {
              id: 'statistike',
              label: '📊 Statistike',
              category: 'Layout',
              content: `<section style="padding: 48px 40px; background: #0F6E56; color: white;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; max-width: 900px; margin: 0 auto; text-align: center;">
                  ${[['5000+', 'Artikala'], ['200+', 'Partnera'], ['15+', 'Godina iskustva'], ['24h', 'Isporuka']].map(([n, l]) => `
                  <div>
                    <div style="font-size: 40px; font-weight: 800; margin-bottom: 6px;">${n}</div>
                    <div style="font-size: 14px; opacity: 0.8;">${l}</div>
                  </div>`).join('')}
                </div>
              </section>`,
            },
            {
              id: 'spacer',
              label: '↕️ Spacer',
              category: 'Osnovno',
              content: '<div style="height: 40px;"></div>',
            },
            {
              id: 'divider',
              label: '─ Divider',
              category: 'Osnovno',
              content: '<hr style="border: none; border-top: 1px solid #e8edeb; margin: 32px 0;"/>',
            },
            {
              id: 'tekst-blok',
              label: '📄 Tekst blok',
              category: 'Osnovno',
              content: `<div style="padding: 32px 40px; max-width: 800px; margin: 0 auto;">
                <h2 style="font-size: 28px; font-weight: 700; color: #0d1f1a; margin: 0 0 16px;">Naslov sekcije</h2>
                <p style="font-size: 16px; color: #6b8279; line-height: 1.7; margin: 0;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              </div>`,
            },
          ],
        },

        styleManager: {
          appendTo: '#styles-panel',
          sectors: [
            {
              name: 'Dimenzije',
              open: true,
              properties: ['width', 'height', 'max-width', 'margin', 'padding'],
            },
            {
              name: 'Tipografija',
              properties: ['font-size', 'font-weight', 'color', 'text-align', 'line-height'],
            },
            {
              name: 'Pozadina',
              properties: ['background-color', 'background-image'],
            },
            {
              name: 'Border',
              properties: ['border-radius', 'border', 'box-shadow'],
            },
          ],
        },

        layerManager: {
          appendTo: '#layers-panel',
        },

        traitManager: {
          appendTo: '#traits-panel',
        },

        canvas: {
          styles: [
            'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap',
          ],
          scripts: [],
        },
      })

      editorRef.current = gjs

      // Učitaj postojeći sadržaj
      if (data?.vrijednost) {
        gjs.setComponents(data.vrijednost)
      }
      if (cssData?.vrijednost) {
        gjs.setStyle(cssData.vrijednost)
      }

      // Postavi device
      gjs.setDevice('Desktop')

      setLoading(false)
    }

    init().catch(console.error)

    return () => {
      gjs?.destroy()
    }
  }, [])

  // Device promjena
  useEffect(() => {
    if (!editorRef.current) return
    const deviceMap = { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile portrait' }
    editorRef.current.setDevice(deviceMap[device])
  }, [device])

  async function save() {
    if (!editorRef.current) return
    setSaving(true)
    const html = editorRef.current.getHtml()
    const css = editorRef.current.getCss()
    await supabase.from('postavke').upsert([
      { kljuc: 'page_builder_html', vrijednost: html },
      { kljuc: 'page_builder_css', vrijednost: css },
    ], { onConflict: 'kljuc' })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1F2937', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', height: '48px', background: '#111827', borderBottom: '1px solid #374151', flexShrink: 0, zIndex: 100 }}>
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280', textDecoration: 'none', fontSize: '12px' }}>
          <ChevronLeft size={14} /> Admin
        </Link>
        <div style={{ width: '1px', height: '16px', background: '#374151' }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#F9FAFB' }}>🧱 Page Builder</span>
        <span style={{ fontSize: '10px', color: '#4B5563', background: '#1F2937', padding: '2px 8px', borderRadius: '100px' }}>GrapeJS</span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Device */}
          <div style={{ display: 'flex', background: '#1F2937', borderRadius: '6px', padding: '2px', gap: '1px' }}>
            {([['desktop', '🖥️'], ['tablet', '📱'], ['mobile', '📲']] as const).map(([d, e]) => (
              <button key={d} onClick={() => setDevice(d)} style={{ padding: '3px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px', background: device === d ? '#0F6E56' : 'transparent' }}>{e}</button>
            ))}
          </div>

          <button onClick={save} disabled={saving} style={{
            display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px',
            fontSize: '12px', fontWeight: 700, border: 'none', borderRadius: '7px',
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            background: saved ? '#059669' : '#0F6E56', color: 'white',
            boxShadow: '0 0 12px rgba(15,110,86,0.4)',
          }}>
            <Save size={12} />{saving ? 'Čuvam...' : saved ? '✓ Sačuvano' : 'Sačuvaj'}
          </button>
        </div>
      </div>

      {/* GrapeJS Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left: Blocks */}
        <div style={{ width: '200px', background: '#111827', borderRight: '1px solid #374151', overflow: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #374151', fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Blokovi
          </div>
          <div id="blocks-panel" style={{ padding: '8px' }} />
        </div>

        {/* Center: Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <div style={{ textAlign: 'center', color: '#6B7280' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🧱</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#F9FAFB' }}>Učitavam Page Builder...</div>
                <div style={{ fontSize: '12px', marginTop: '6px' }}>GrapeJS se inicijalizira</div>
              </div>
            </div>
          )}
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Right: Panels */}
        <div style={{ width: '220px', background: '#111827', borderLeft: '1px solid #374151', overflow: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #374151', fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Stilovi
          </div>
          <div id="styles-panel" style={{ padding: '8px', flex: 1 }} />
          <div style={{ borderTop: '1px solid #374151', padding: '10px 12px', fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Slojevi
          </div>
          <div id="layers-panel" style={{ padding: '8px', maxHeight: '200px', overflow: 'auto' }} />
        </div>
      </div>

      {/* GrapeJS dark theme CSS */}
      <style>{`
        .gjs-one-bg { background: #111827 !important; }
        .gjs-two-bg { background: #1F2937 !important; }
        .gjs-three-bg { background: #374151 !important; }
        .gjs-four-bg { background: #4B5563 !important; }
        .gjs-cr-prim { color: #F9FAFB !important; }
        .gjs-cr-sec { color: #D1D5DB !important; }
        .gjs-cr-ter { color: #9CA3AF !important; }
        .gjs-cr-qua { color: #6B7280 !important; }
        .gjs-pn-btn { color: #9CA3AF !important; }
        .gjs-pn-btn:hover, .gjs-pn-btn.gjs-pn-active { color: #34D399 !important; background: rgba(15,110,86,0.2) !important; }
        .gjs-block { border-color: #374151 !important; color: #D1D5DB !important; background: #1F2937 !important; }
        .gjs-block:hover { border-color: #0F6E56 !important; background: #0B2218 !important; }
        .gjs-block__media { color: #34D399 !important; }
        .gjs-toolbar { background: #0F6E56 !important; }
        .gjs-resizer-h { border-color: #0F6E56 !important; }
        .gjs-selected { outline: 2px solid #0F6E56 !important; }
        .gjs-hovered { outline: 1px dashed rgba(15,110,86,0.5) !important; }
        .gjs-sm-sector-title, .gjs-layer-title { background: #1F2937 !important; color: #D1D5DB !important; border-color: #374151 !important; }
        .gjs-sm-property { border-color: #374151 !important; }
        .gjs-sm-input-holder input, .gjs-sm-input-holder select { background: #374151 !important; color: #F9FAFB !important; border-color: #4B5563 !important; }
        .gjs-blocks-c { display: flex !important; flex-wrap: wrap !important; gap: 6px !important; }
        .gjs-block { width: calc(50% - 3px) !important; min-height: 60px !important; padding: 8px 6px !important; font-size: 10px !important; text-align: center !important; border-radius: 8px !important; cursor: grab !important; }
        .gjs-block-label { font-size: 10px !important; line-height: 1.3 !important; }
        .gjs-blocks-cs .gjs-block-category .gjs-title { font-size: 10px !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; padding: 6px 8px !important; background: #0B0F19 !important; color: #6B7280 !important; border-color: #252D3D !important; }
      `}</style>
    </div>
  )
}

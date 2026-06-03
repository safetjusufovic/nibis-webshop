'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, X, Search, Phone, Mail, Clock, ChevronDown, MapPin } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import React from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import CartDrawer from '@/components/shop/CartDrawer'
import LangSwitcher from '@/components/layout/LangSwitcher'
import Logo from '@/components/layout/Logo'
import { siteConfig } from '@/lib/config'
import type { ArtikalGrupa } from '@/types/nibis'

// Gradi navigacijski link: custom domena -> čist, path-bazirano -> /slug prefiks
function buildHref(shopSlug: string, path: string): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    const isCustom = !['nibis-webshop.vercel.app', 'localhost', '127.0.0.1'].includes(host) && !host.endsWith('.vercel.app')
    if (isCustom) return path
  }
  if (!shopSlug) return path
  return '/' + shopSlug + (path === '/' ? '' : path)
}


interface HeaderPostavke {
  topbar_aktivan: string; topbar_boja: string; topbar_tekst_boja: string
  topbar_telefon: string; topbar_email: string; topbar_radno_vrijeme: string
  topbar_adresa: string; topbar_jezik_switcher: string; topbar_custom_tekst: string
  header_layout: string; header_boja: string; header_tekst_boja: string
  header_visina: string; header_shadow: string; header_sticky: string
  header_blur: string; header_logo_pozicija: string; header_search_stil: string
  header_search_sirina: string; header_search_placeholder: string
  header_korpa_stil: string; header_korpa_boja: string; header_border_bottom: string
  navkat_aktivan: string; navkat_boja: string; navkat_tekst_boja: string
  navkat_visina: string; navkat_stil: string; navkat_akcijski_dugme: string
  navkat_akcijski_tekst: string; navkat_akcijski_boja: string
  announcement_bar: string; baner_boja_pozadine: string; baner_boja_teksta: string
  shop_naziv: string; theme_logo_url: string
}

const D: HeaderPostavke = {
  topbar_aktivan: 'false', topbar_boja: '#1F2937', topbar_tekst_boja: '#9CA3AF',
  topbar_telefon: '', topbar_email: '', topbar_radno_vrijeme: '',
  topbar_adresa: '', topbar_jezik_switcher: 'true', topbar_custom_tekst: '',
  header_layout: 'minimal', header_boja: '#ffffff', header_tekst_boja: '#111827',
  header_visina: '64', header_shadow: 'true', header_sticky: 'true',
  header_blur: 'true', header_logo_pozicija: 'left', header_search_stil: 'inline',
  header_search_sirina: '520', header_search_placeholder: 'Pretraži artikle, šifre, barkodove...',
  header_korpa_stil: 'button', header_korpa_boja: '', header_border_bottom: 'true',
  navkat_aktivan: 'false', navkat_boja: '#1e3a5f', navkat_tekst_boja: '#ffffff',
  navkat_visina: '44', navkat_stil: 'flat', navkat_akcijski_dugme: 'false',
  navkat_akcijski_tekst: 'Akcijski proizvodi', navkat_akcijski_boja: '#DC2626',
  announcement_bar: '', baner_boja_pozadine: '#085041', baner_boja_teksta: '#ffffff',
  shop_naziv: '', theme_logo_url: '',
}

function TopBar({ p }: { p: HeaderPostavke }) {
  if (p.topbar_aktivan !== 'true') return null
  return (
    <div style={{ background: p.topbar_boja, color: p.topbar_tekst_boja, fontSize: '12px', padding: '6px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {p.topbar_telefon && <a href={`tel:${p.topbar_telefon}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: p.topbar_tekst_boja, textDecoration: 'none' }}><Phone size={12} />{p.topbar_telefon}</a>}
          {p.topbar_email && <a href={`mailto:${p.topbar_email}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: p.topbar_tekst_boja, textDecoration: 'none' }}><Mail size={12} />{p.topbar_email}</a>}
          {p.topbar_radno_vrijeme && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={12} />{p.topbar_radno_vrijeme}</span>}
          {p.topbar_adresa && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={12} />{p.topbar_adresa}</span>}
          {p.topbar_custom_tekst && <span>{p.topbar_custom_tekst}</span>}
        </div>
        {p.topbar_jezik_switcher === 'true' && <LangSwitcher current="bs" />}
      </div>
    </div>
  )
}

function AnnouncementBar({ p }: { p: HeaderPostavke }) {
  if (!p.announcement_bar) return null
  return (
    <div style={{ background: p.baner_boja_pozadine, color: p.baner_boja_teksta, fontSize: '12px', textAlign: 'center', padding: '7px 16px', letterSpacing: '0.01em' }}>
      {p.announcement_bar}
    </div>
  )
}

function NavKategorija({ p, grupe, shopSlug = '' }: { p: HeaderPostavke; grupe: ArtikalGrupa[]; shopSlug?: string }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (p.navkat_aktivan !== 'true') return null
  const roots = grupe.filter(g => !g.parentId)
  const navH = parseInt(p.navkat_visina) || 48

  return (
    <div style={{ background: p.navkat_boja, borderBottom: '1px solid rgba(0,0,0,0.1)', position: 'relative', zIndex: 90 }} ref={ref}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: navH + 'px', gap: '4px' }}>
        {p.navkat_akcijski_dugme === 'true' && (
          <Link href={buildHref(shopSlug, "/?akcija=true")} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: p.navkat_akcijski_boja, color: 'white', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', marginRight: '6px', flexShrink: 0 }}>
            ⚡ {p.navkat_akcijski_tekst}
          </Link>
        )}

        {/* Kategorije dugme s dropdownom */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', height: navH + 'px', padding: '0 16px', background: open ? 'rgba(255,255,255,0.18)' : 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: p.navkat_tekst_boja, transition: 'background 0.15s', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.12)' }}
        >
          ☰ Kategorije
          <span style={{ fontSize: '10px', opacity: 0.7, transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{ position: 'absolute', top: navH + 'px', left: 0, right: 0, background: 'white', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', zIndex: 200, maxHeight: '70vh', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1px', backgroundColor: '#F3F4F6' }}>
          {/* Svi artikli */}
          <button onClick={() => {
              setOpen(false)
              const url = new URL(window.location.href); url.searchParams.delete('grupaId')
              window.history.pushState({}, '', url.toString())
              window.dispatchEvent(new Event('grupaChanged'))
            }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 18px', background: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 500, color: '#374151', borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left' as const }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F0FDF4'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}
          >
            <span style={{ width: '30px', height: '30px', background: '#F3F4F6', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>🏪</span>
            Svi artikli
          </button>

          {roots.map(g => (
            <button key={g.id} onClick={() => {
                setOpen(false)
                const url = new URL(window.location.href); url.searchParams.set('grupaId', String(g.id))
                window.history.pushState({}, '', url.toString())
                window.dispatchEvent(new Event('grupaChanged'))
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 18px', background: 'white', fontSize: '13px', fontWeight: 500, color: '#374151', transition: 'background 0.1s', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left' as const }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#F9FAFB'; el.style.color = 'var(--brand)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'white'; el.style.color = '#374151' }}
            >
              <span style={{ width: '30px', height: '30px', background: g.boja || '#F3F4F6', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0, overflow: 'hidden' }}>
                {g.ikonaUrl
                  ? <img src={g.ikonaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '7px' }} />
                  : <span style={{ fontSize: '15px' }}>{g.ikonaEmoji || '📦'}</span>
                }
              </span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.naziv}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SearchBox({ p, searchVal, setSearchVal, onSearch, className, extraStyle }: {
  p: HeaderPostavke; searchVal: string; setSearchVal: (v: string) => void
  onSearch?: (q: string) => void; className?: string; extraStyle?: React.CSSProperties
}) {
  if (!onSearch || p.header_search_stil === 'hidden') return null
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: parseInt(p.header_search_sirina) + 'px', ...extraStyle }} className={className}>
      <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9CACA6', pointerEvents: 'none' }} />
      <input type="text" placeholder={p.header_search_placeholder || 'Pretraži artikle...'} value={searchVal}
        onChange={e => { setSearchVal(e.target.value); onSearch?.(e.target.value) }}
        style={{ width: '100%', paddingLeft: '38px', paddingRight: '14px', height: '40px', fontSize: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', fontFamily: 'inherit', color: 'var(--text)', transition: 'all 0.15s', boxSizing: 'border-box' }}
        onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-pale)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}

function KorpaDugme({ p, totalQty, onClick }: { p: HeaderPostavke; totalQty: number; onClick: () => void }) {
  const boja = p.header_korpa_boja || 'var(--brand)'
  if (p.header_korpa_stil === 'icon') {
    return (
      <button onClick={onClick} style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
        <ShoppingCart size={18} />
        {totalQty > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: boja, color: 'white', fontSize: '10px', fontWeight: 700, borderRadius: '100px', minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{totalQty > 9 ? '9+' : totalQty}</span>}
      </button>
    )
  }
  const isPill = p.header_korpa_stil === 'pill'
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: boja, color: 'white', border: 'none', borderRadius: isPill ? '100px' : '10px', padding: '8px 16px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = ''; (e.currentTarget as HTMLElement).style.transform = 'none' }}
    >
      <ShoppingCart size={15} />
      <span className="cart-label">Korpa</span>
      {totalQty > 0 && <span style={{ background: 'rgba(255,255,255,0.25)', fontSize: '11px', fontWeight: 700, borderRadius: '100px', minWidth: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{totalQty > 9 ? '9+' : totalQty}</span>}
    </button>
  )
}

function MobileMenu({ user, isAdmin, menuOpen, setMenuOpen, handleSignOut, shopSlug = '' }: any) {
  if (!menuOpen) return null
  return (
    <div style={{ borderTop: '1px solid var(--border)', background: 'white', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {[{ href: buildHref(shopSlug, "/"), label: 'Katalog' }, ...(user ? [{ href: buildHref(shopSlug, "/moje-narudzbe"), label: 'Narudžbe' }, { href: buildHref(shopSlug, "/favoriti"), label: 'Favoriti' }] : []), ...(isAdmin ? [{ href: buildHref(shopSlug, "/admin"), label: 'Admin', accent: true }] : [])].map(item => (
        <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{ padding: '10px 12px', fontSize: '15px', color: (item as any).accent ? 'var(--brand)' : 'var(--text)', fontWeight: (item as any).accent ? 500 : 400, textDecoration: 'none', borderRadius: '8px' }}>{item.label}</Link>
      ))}
      {user && <button onClick={handleSignOut} style={{ textAlign: 'left', padding: '10px 12px', fontSize: '15px', color: '#991B1B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '8px' }}>Odjava</button>}
    </div>
  )
}

export default function Header({ onSearch, shopSlug = '' }: { onSearch?: (q: string) => void; shopSlug?: string }) {
  const { totalQty } = useCart()
  const { user, profil, isAdmin, signOut } = useAuth()
  const [p, setP] = useState<HeaderPostavke>(D)
  const [grupe, setGrupe] = useState<ArtikalGrupa[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const router = useRouter()
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch postavke via API - respektuje shop izolaciju
    const keys = Object.keys(D).join(',')
    const shopParam = shopSlug ? '&shop=' + shopSlug : ''
    fetch('/api/postavke?kljuci=' + keys + shopParam)
      .then(r => r.json())
      .then(data => {
        const map: any = { ...D }
        Object.entries(data).forEach(([k, v]) => { map[k] = v })
        setP(map)
      })
      .catch(() => {})
  }, [shopSlug])

  useEffect(() => {
    if (p.navkat_aktivan === 'true') {
      fetch(`/api/grupe${shopSlug ? '?shop=' + shopSlug : ''}`).then(r => r.json()).then(d => setGrupe(d.items ?? []))
    }
  }, [p.navkat_aktivan])

  useEffect(() => {
    function h(e: MouseEvent) { if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  async function handleSignOut() { await signOut(); router.push(buildHref(shopSlug, '/login')) }

  const partnerNaziv = (profil?.partner as any)?.naziv
  const userName = profil ? `${profil.ime ?? ''} ${profil.prezime ?? ''}`.trim() || user?.email : user?.email
  const initials = profil?.ime ? `${profil.ime[0]}${profil.prezime?.[0] ?? ''}`.toUpperCase() : (user?.email?.[0] ?? '?').toUpperCase()

  const hVisina = parseInt(p.header_visina) || 64
  const layout = p.header_layout || 'minimal'

  const hStyle: React.CSSProperties = {
    position: p.header_sticky !== 'false' ? 'sticky' : 'relative',
    top: 0, zIndex: 40,
    background: p.header_blur !== 'false' ? `${p.header_boja}f5` : p.header_boja,
    backdropFilter: p.header_blur !== 'false' ? 'blur(12px)' : 'none',
    borderBottom: p.header_border_bottom !== 'false' ? '1px solid var(--border)' : 'none',
    boxShadow: p.header_shadow !== 'false' ? '0 1px 8px rgba(0,0,0,0.06)' : 'none',
  }

  const UserMenu = () => (
    <div style={{ position: 'relative' }} ref={userMenuRef}>
      <button onClick={() => setUserMenuOpen(!userMenuOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px 12px 6px 6px', cursor: 'pointer', fontFamily: 'inherit' }}>
        <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{initials}</span>
        <span className="user-info" style={{ display: 'none', fontSize: '13px', fontWeight: 500, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{userName}</span>
        <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
      </button>
      {userMenuOpen && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '220px', background: 'white', border: '1px solid var(--border)', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{userName}</div>
            {partnerNaziv && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{partnerNaziv}</div>}
          </div>
          {[{ href: buildHref(shopSlug, "/moje-narudzbe"), label: 'Moje narudžbe' }, { href: buildHref(shopSlug, "/favoriti"), label: 'Moji favoriti' }, ...(isAdmin ? [{ href: buildHref(shopSlug, "/admin"), label: 'Admin panel', accent: true }] : [])].map(item => (
            <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)} style={{ display: 'block', padding: '10px 16px', fontSize: '14px', color: (item as any).accent ? 'var(--brand)' : 'var(--text)', fontWeight: (item as any).accent ? 500 : 400, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >{item.label}</Link>
          ))}
          <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
          <button onClick={handleSignOut} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '14px', color: '#991B1B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEF2F2'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
          >Odjava</button>
        </div>
      )}
    </div>
  )

  const RightActions = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {user ? (<><KorpaDugme p={p} totalQty={totalQty} onClick={() => setCartOpen(true)} /><UserMenu /></>) : (
        <Link href={buildHref(shopSlug, "/login")} style={{ padding: '8px 18px', background: 'var(--brand)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Prijava</Link>
      )}
      <button style={{ display: 'none', padding: '8px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text)' }} onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn">
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
    </div>
  )

  return (
    <>
      <TopBar p={p} />
      <AnnouncementBar p={p} />

      <header style={hStyle}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>

          {/* Klasični layout — logo lijevo, search centar, akcije desno */}
          {layout === 'rs_stil' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: hVisina + 'px' }}>
              <Link href={buildHref(shopSlug, "/")} style={{ flexShrink: 0, textDecoration: 'none' }}><Logo size="md" /></Link>
              <Link href={buildHref(shopSlug, "/vijesti")} style={{ fontSize: '13px', fontWeight: 500, color: 'white', textDecoration: 'none', padding: '6px 10px', borderRadius: '7px', flexShrink: 0, whiteSpace: 'nowrap' as const, opacity: 0.85 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >Vijesti</Link>
              <div style={{ flex: 1 }}>
                <SearchBox p={p} searchVal={searchVal} setSearchVal={setSearchVal} onSearch={onSearch} extraStyle={{ maxWidth: '600px', margin: '0 auto' }} />
              </div>
              <RightActions />
            </div>
          )}

          {/* Centered layout — logo centar, search ispod */}
          {layout === 'centered' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: hVisina + 'px' }}>
                {user ? <UserMenu /> : <Link href={buildHref(shopSlug, "/login")} style={{ padding: '7px 16px', background: 'var(--brand)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '13px' }}>Prijava</Link>}
                <Link href={buildHref(shopSlug, "/")} style={{ textDecoration: 'none', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}><Logo size="lg" /></Link>
                {user && <KorpaDugme p={p} totalQty={totalQty} onClick={() => setCartOpen(true)} />}
              </div>
              {onSearch && p.header_search_stil !== 'hidden' && (
                <div style={{ paddingBottom: '14px' }}>
                  <SearchBox p={p} searchVal={searchVal} setSearchVal={setSearchVal} onSearch={onSearch} extraStyle={{ margin: '0 auto' }} />
                </div>
              )}
            </>
          )}

          {/* Minimal layout (default) */}
          {(layout === 'minimal' || layout === 'mega') && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: hVisina + 'px' }}>
                <Link href={buildHref(shopSlug, "/")} style={{ flexShrink: 0, textDecoration: 'none' }}><Logo size="md" /></Link>
                <Link href={buildHref(shopSlug, "/vijesti")} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none', padding: '6px 10px', borderRadius: '7px', flexShrink: 0, whiteSpace: 'nowrap' as const }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--brand)'; (e.currentTarget as HTMLElement).style.background = 'var(--brand-pale)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >Vijesti</Link>
                {p.header_search_stil === 'inline' && (
                  <SearchBox p={p} searchVal={searchVal} setSearchVal={setSearchVal} onSearch={onSearch} className="md-search" extraStyle={{ flex: 1, display: 'none' }} />
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {p.topbar_aktivan !== 'true' && <LangSwitcher current="bs" />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: '100px' }} className="oj-badge">
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand)', display: 'inline-block' }} />
                    {siteConfig.orgJedNaziv}
                  </div>
                  <RightActions />
                </div>
              </div>
              {p.header_search_stil === 'bar' && onSearch && (
                <div style={{ paddingBottom: '12px' }}>
                  <SearchBox p={p} searchVal={searchVal} setSearchVal={setSearchVal} onSearch={onSearch} extraStyle={{ maxWidth: '100%' }} />
                </div>
              )}
              {p.header_search_stil === 'inline' && onSearch && (
                <div style={{ paddingBottom: '12px' }} className="search-bar-mobile">
                  <SearchBox p={p} searchVal={searchVal} setSearchVal={setSearchVal} onSearch={onSearch} extraStyle={{ maxWidth: '100%' }} />
                </div>
              )}
            </>
          )}
        </div>
        <MobileMenu user={user} isAdmin={isAdmin} menuOpen={menuOpen} setMenuOpen={setMenuOpen} handleSignOut={handleSignOut} shopSlug={shopSlug} />
      </header>

      <NavKategorija p={p} grupe={grupe} shopSlug={shopSlug} />

      <style>{`
        @media (min-width: 768px) {
          .md-search { display: flex !important; }
          .search-bar-mobile { display: none !important; }
          .user-info { display: block !important; }
          .oj-badge { display: flex !important; }
          .cart-label { display: inline !important; }
        }
        @media (max-width: 767px) {
          .oj-badge { display: none !important; }
          .cart-label { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} shopSlug={shopSlug} />
    </>
  )
}

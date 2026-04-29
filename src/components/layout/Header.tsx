'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, X, ChevronDown, User, Search, Bell } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import CartDrawer from '@/components/shop/CartDrawer'
import LangSwitcher from '@/components/layout/LangSwitcher'
import Logo from '@/components/layout/Logo'
import { siteConfig } from '@/lib/config'

export default function Header({ onSearch }: { onSearch?: (q: string) => void }) {
  const { totalQty } = useCart()
  const { user, profil, isAdmin, signOut } = useAuth()
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const partnerNaziv = (profil?.partner as any)?.naziv
  const userName = profil
    ? `${profil.ime ?? ''} ${profil.prezime ?? ''}`.trim() || user?.email
    : user?.email

  const initials = profil?.ime
    ? `${profil.ime[0]}${profil.prezime?.[0] ?? ''}`.toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase()

  return (
    <>
      {/* Announcement bar */}
      <div style={{
        background: 'var(--brand-dark)',
        color: 'rgba(255,255,255,0.75)',
        fontSize: '12px',
        textAlign: 'center',
        padding: '7px 16px',
        letterSpacing: '0.01em',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.45)', marginRight: '8px' }}>●</span>
        Radimo pon–pet 08:00–16:00
        <span style={{ margin: '0 12px', opacity: 0.3 }}>|</span>
        Narudžbe do 14h — isporuka narednog radnog dana
        <span style={{ margin: '0 12px', opacity: 0.3 }}>|</span>
        {siteConfig.orgJedNaziv}
      </div>

      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 0 0 rgba(0,0,0,0.04)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', height: '64px' }}>

            {/* Logo */}
            <Link href="/" style={{ flexShrink: 0, textDecoration: 'none' }}>
              <Logo size="md" />
            </Link>

            {/* Search */}
            {onSearch && (
              <div style={{ flex: 1, maxWidth: '520px', position: 'relative', display: 'none' }} className="md-search">
                <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9CACA6', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Pretraži artikle, šifre, barkodove..."
                  value={searchVal}
                  onChange={e => { setSearchVal(e.target.value); onSearch(e.target.value) }}
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    paddingRight: '14px',
                    height: '40px',
                    fontSize: '14px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    color: 'var(--text)',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--brand-light)'; e.target.style.boxShadow = '0 0 0 3px rgba(29,158,117,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LangSwitcher current="bs" />

              {/* OJ badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                padding: '5px 12px',
                borderRadius: '100px',
              }} className="oj-badge">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-light)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                {siteConfig.orgJedNaziv}
              </div>

              {/* Cart */}
              {user && (
                <button
                  onClick={() => setCartOpen(true)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--brand)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                    boxShadow: '0 1px 3px rgba(15,110,86,0.2)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--brand-dark)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--brand)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
                >
                  <ShoppingCart size={15} />
                  <span className="cart-label">Korpa</span>
                  {totalQty > 0 && (
                    <span style={{
                      background: 'white',
                      color: 'var(--brand)',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '100px',
                      minWidth: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 5px',
                    }}>
                      {totalQty > 9 ? '9+' : totalQty}
                    </span>
                  )}
                </button>
              )}

              {/* User menu */}
              {user ? (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'var(--brand-pale)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--brand)',
                    }}>
                      {initials}
                    </div>
                    <div style={{ textAlign: 'left', display: 'none' }} className="user-info">
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.2, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {userName}
                      </div>
                      {partnerNaziv && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {partnerNaziv}
                        </div>
                      )}
                    </div>
                    <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setUserMenuOpen(false)} />
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 8px)',
                        width: '220px',
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: '14px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        zIndex: 20,
                        overflow: 'hidden',
                      }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{userName}</div>
                          {partnerNaziv && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{partnerNaziv}</div>}
                        </div>
                        {[
                          { href: '/moje-narudzbe', label: 'Moje narudžbe' },
          { href: '/favoriti', label: 'Moji favoriti' },
                          ...(isAdmin ? [{ href: '/admin', label: 'Admin panel', accent: true }] : []),
                        ].map(item => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setUserMenuOpen(false)}
                            style={{
                              display: 'block',
                              padding: '10px 16px',
                              fontSize: '14px',
                              color: (item as any).accent ? 'var(--brand)' : 'var(--text)',
                              fontWeight: (item as any).accent ? 500 : 400,
                              textDecoration: 'none',
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                          >
                            {item.label}
                          </Link>
                        ))}
                        <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                        <button
                          onClick={handleSignOut}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 16px',
                            fontSize: '14px',
                            color: '#991B1B',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEF2F2'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                        >
                          Odjava
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link href="/login" className="btn-primary" style={{ fontSize: '14px', padding: '8px 18px', textDecoration: 'none' }}>
                  Prijava
                </Link>
              )}

              {/* Mobile menu btn */}
              <button
                style={{ display: 'none', padding: '8px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text)' }}
                onClick={() => setMenuOpen(!menuOpen)}
                className="mobile-menu-btn"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Search bar below on desktop */}
          {onSearch && (
            <div style={{ paddingBottom: '12px' }} className="search-bar-mobile">
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9CACA6', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Pretraži artikle..."
                  value={searchVal}
                  onChange={e => { setSearchVal(e.target.value); onSearch(e.target.value) }}
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    paddingRight: '14px',
                    height: '40px',
                    fontSize: '14px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    color: 'var(--text)',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--brand-light)'; e.target.style.boxShadow = '0 0 0 3px rgba(29,158,117,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div style={{
            borderTop: '1px solid var(--border)',
            background: 'white',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            {[
              { href: '/', label: 'Katalog' },
              ...(user ? [{ href: '/moje-narudzbe', label: 'Narudžbe' }] : []),
              ...(isAdmin ? [{ href: '/admin', label: 'Admin', accent: true }] : []),
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '10px 12px',
                  fontSize: '15px',
                  color: (item as any).accent ? 'var(--brand)' : 'var(--text)',
                  fontWeight: (item as any).accent ? 500 : 400,
                  textDecoration: 'none',
                  borderRadius: '8px',
                  transition: 'background 0.1s',
                }}
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={handleSignOut}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  fontSize: '15px',
                  color: '#991B1B',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  borderRadius: '8px',
                }}
              >
                Odjava
              </button>
            )}
          </div>
        )}
      </header>

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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}

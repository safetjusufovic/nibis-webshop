'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, X, ChevronDown, User } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { siteConfig } from '@/lib/config'
import CartDrawer from '@/components/shop/CartDrawer'
import LangSwitcher from '@/components/layout/LangSwitcher'

export default function Header({ locale = 'bs' }: { locale?: string }) {
  const { totalQty } = useCart()
  const { user, profil, isAdmin, signOut } = useAuth()
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const userName = profil
    ? `${profil.ime ?? ''} ${profil.prezime ?? ''}`.trim() || user?.email
    : user?.email

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              {siteConfig.logoUrl ? (
                <Image src={siteConfig.logoUrl} alt={siteConfig.name} width={120} height={36} className="h-8 w-auto object-contain" />
              ) : (
                <span className="font-semibold text-lg text-gray-900">{siteConfig.name}</span>
              )}
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <Link href="/" className="hover:text-teal-600 transition-colors">Katalog</Link>
              {user && <Link href="/moje-narudzbe" className="hover:text-teal-600 transition-colors">Narudžbe</Link>}
              {isAdmin && <Link href="/admin" className="text-teal-600 font-medium hover:text-teal-700 transition-colors">Admin</Link>}
            </nav>

            <div className="flex items-center gap-2">
              <LangSwitcher current={locale} />

              {siteConfig.orgJedNaziv && (
                <span className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block animate-pulse" />
                  {siteConfig.orgJedNaziv}
                </span>
              )}

              {user && (
                <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-1 text-sm text-gray-700 hover:text-teal-600 transition-colors p-1">
                  <ShoppingCart size={20} />
                  {totalQty > 0 && (
                    <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                      {totalQty > 9 ? '9+' : totalQty}
                    </span>
                  )}
                </button>
              )}

              {user ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1 text-sm text-gray-700 hover:text-teal-600 p-1">
                    <User size={18} />
                    <span className="hidden sm:inline max-w-[7rem] truncate">{userName}</span>
                    <ChevronDown size={14} />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1">
                        <Link href="/moje-narudzbe" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>Moje narudžbe</Link>
                        {isAdmin && <Link href="/admin" className="block px-4 py-2 text-sm text-teal-600 font-medium hover:bg-teal-50" onClick={() => setUserMenuOpen(false)}>Admin panel</Link>}
                        <div className="border-t border-gray-100 my-1" />
                        <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50">Odjava</button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link href="/login" className="btn-primary text-sm py-1.5 px-3">Prijava</Link>
              )}

              <button className="md:hidden p-1 text-gray-600" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3 text-sm text-gray-700">
            <Link href="/" onClick={() => setMenuOpen(false)}>Katalog</Link>
            {user && <Link href="/moje-narudzbe" onClick={() => setMenuOpen(false)}>Narudžbe</Link>}
            {isAdmin && <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-teal-600 font-medium">Admin</Link>}
            {user && <button onClick={handleSignOut} className="text-left text-gray-500">Odjava</button>}
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}

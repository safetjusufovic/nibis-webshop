'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, ShoppingBag, Image, RefreshCw, LayoutDashboard, Settings, LayoutList, BarChart2, Activity } from 'lucide-react'
import AuthGuard from '@/components/auth/AuthGuard'
import Header from '@/components/layout/Header'

const NAV = [
  { href: '/admin', label: 'Pregled', icon: LayoutDashboard, exact: true },
  { href: '/admin/korisnici', label: 'Korisnici', icon: Users },
  { href: '/admin/narudzbe', label: 'Narudžbe', icon: ShoppingBag },
  { href: '/admin/slike', label: 'Slike artikala', icon: Image },
  { href: '/admin/sync', label: 'Sinhronizacija', icon: RefreshCw },
  { href: '/admin/katalog', label: 'Katalog', icon: LayoutList },
  { href: '/admin/izvjestaji', label: 'Izvještaji', icon: BarChart2 },
  { href: '/admin/korisnici-log', label: 'Historija prijava', icon: Activity },
  { href: '/admin/postavke', label: 'Postavke', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
          {/* Sidebar */}
          <aside className="w-48 shrink-0">
            <div className="bg-white border border-gray-100 rounded-xl p-2 sticky top-20">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-3 py-2">Admin</p>
              {NAV.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                )
              })}
            </div>
          </aside>
          {/* Content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </AuthGuard>
  )
}

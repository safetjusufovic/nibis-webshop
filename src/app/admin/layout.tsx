'use client'

import { useAdminNotifikacije } from '@/hooks/useAdminNotifikacije'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, ShoppingBag, Image, RefreshCw, LayoutDashboard, Settings, LayoutList, BarChart2, Activity, FolderTree, Paintbrush } from 'lucide-react'
import AuthGuard from '@/components/auth/AuthGuard'
import Header from '@/components/layout/Header'

const NAV = [
  { href: '/admin', label: 'Pregled', icon: LayoutDashboard, exact: true },
  { href: '/admin/korisnici', label: 'Korisnici', icon: Users, badge: 'registracije' },
  { href: '/admin/narudzbe', label: 'Narudžbe', icon: ShoppingBag, badge: 'narudzbe' },
  { href: '/admin/slike', label: 'Slike artikala', icon: Image },
  { href: '/admin/sync', label: 'Sinhronizacija', icon: RefreshCw },
  { href: '/admin/katalog', label: 'Katalog', icon: LayoutList },
  { href: '/admin/kategorije', label: 'Kategorije', icon: FolderTree },
  { href: '/admin/izvjestaji', label: 'Izvještaji', icon: BarChart2 },
  { href: '/admin/korisnici-log', label: 'Historija prijava', icon: Activity },
  { href: '/admin/izgled', label: 'Izgled', icon: Paintbrush },
  { href: '/admin/postavke', label: 'Postavke', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const notifikacije = useAdminNotifikacije()
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
              {NAV.map(({ href, label, icon: Icon, exact, badge: badgeKey }: any) => {
                const active = exact ? pathname === href : pathname.startsWith(href)
                const badgeCount = badgeKey === 'narudzbe' ? notifikacije.noveNarudzbe : badgeKey === 'registracije' ? notifikacije.noveRegistracije : 0
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-[var(--brand-pale)] text-[var(--brand)] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Icon size={15} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {badgeCount > 0 && (
                      <span style={{
                        background: '#DC2626', color: 'white', fontSize: '10px', fontWeight: 700,
                        borderRadius: '100px', minWidth: '18px', height: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                      }}>
                        {badgeCount}
                      </span>
                    )}
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

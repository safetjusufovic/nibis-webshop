'use client'

import { useAdminNotifikacije } from '@/hooks/useAdminNotifikacije'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { Users, ShoppingBag, Image, RefreshCw, LayoutDashboard, Settings, LayoutList, BarChart2, Activity, FolderTree, Paintbrush, FileText } from 'lucide-react'
import AuthGuard from '@/components/auth/AuthGuard'
import Header from '@/components/layout/Header'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const notifikacije = useAdminNotifikacije()
  const pathname = usePathname()
  const params = useParams()
  const shopSlug = params?.shopSlug as string || ''
  const base = '/' + shopSlug + '/admin'

  const NAV = [
    { href: base, label: 'Pregled', icon: LayoutDashboard, exact: true },
    { href: base + '/korisnici', label: 'Korisnici', icon: Users, badge: 'registracije' },
    { href: base + '/narudzbe', label: 'Narudžbe', icon: ShoppingBag, badge: 'narudzbe' },
    { href: base + '/slike', label: 'Slike artikala', icon: Image },
    { href: base + '/sync', label: 'Sinhronizacija', icon: RefreshCw },
    { href: base + '/katalog', label: 'Katalog', icon: LayoutList },
    { href: base + '/kategorije', label: 'Kategorije', icon: FolderTree },
    { href: base + '/izvjestaji', label: 'Izvještaji', icon: BarChart2 },
    { href: base + '/korisnici-log', label: 'Historija prijava', icon: Activity },
    { href: base + '/izgled', label: 'Izgled', icon: Paintbrush },
    { href: base + '/stranice', label: 'Stranice i članci', icon: FileText },
    { href: base + '/postavke', label: 'Postavke', icon: Settings },
  ]

  return (
    <AuthGuard requireAdmin shopSlug={shopSlug}>
      <div className="min-h-screen bg-gray-50">
        <Header shopSlug={shopSlug} />
        <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
          <aside className="w-48 shrink-0">
            <div className="bg-white border border-gray-100 rounded-xl p-2 sticky top-20">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-3 py-2">Admin · {shopSlug}</p>
              {NAV.map(({ href, label, icon: Icon, exact, badge: badgeKey }: any) => {
                const active = exact ? pathname === href : pathname.startsWith(href)
                const badgeCount = badgeKey === 'narudzbe' ? notifikacije.noveNarudzbe : badgeKey === 'registracije' ? notifikacije.noveRegistracije : 0
                return (
                  <Link key={href} href={href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-[var(--brand-pale)] text-[var(--brand)] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Icon size={15} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {badgeCount > 0 && (
                      <span style={{ background: '#DC2626', color: 'white', fontSize: '10px', fontWeight: 700, borderRadius: '100px', minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </aside>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </AuthGuard>
  )
}

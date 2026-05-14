'use client'

import { useAdminNotifikacije } from '@/hooks/useAdminNotifikacije'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, ShoppingBag, Image, RefreshCw, LayoutDashboard, Settings, LayoutList, BarChart2, Activity, FolderTree, Paintbrush, FileText } from 'lucide-react'
import AuthGuard from '@/components/auth/AuthGuard'
import Header from '@/components/layout/Header'

const NAV_ITEMS = [
  { path: '', label: 'Pregled', icon: LayoutDashboard, exact: true },
  { path: '/korisnici', label: 'Korisnici', icon: Users, badge: 'registracije' },
  { path: '/narudzbe', label: 'Narudžbe', icon: ShoppingBag, badge: 'narudzbe' },
  { path: '/slike', label: 'Slike artikala', icon: Image },
  { path: '/sync', label: 'Sinhronizacija', icon: RefreshCw },
  { path: '/katalog', label: 'Katalog', icon: LayoutList },
  { path: '/kategorije', label: 'Kategorije', icon: FolderTree },
  { path: '/izvjestaji', label: 'Izvještaji', icon: BarChart2 },
  { path: '/korisnici-log', label: 'Historija prijava', icon: Activity },
  { path: '/izgled', label: 'Izgled', icon: Paintbrush },
  { path: '/stranice', label: 'Stranice i članci', icon: FileText },
  { path: '/postavke', label: 'Postavke', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const notifikacije = useAdminNotifikacije()
  const pathname = usePathname()

  // Izvuci shopSlug iz path-a: /novishop/admin/... -> novishop, /admin/... -> ''
  const segs = pathname.split('/').filter(Boolean)
  const adminIdx = segs.indexOf('admin')
  const shopSlug = adminIdx > 0 ? segs[adminIdx - 1] : ''
  const adminBase = shopSlug ? `/${shopSlug}/admin` : '/admin'

  const shopSlugForHeader = shopSlug || 'main'

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Header shopSlug={shopSlugForHeader} />
        <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
          <aside className="w-48 shrink-0">
            <div className="bg-white border border-gray-100 rounded-xl p-2 sticky top-20">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-3 py-2">
                Admin{shopSlug ? ` · ${shopSlug}` : ''}
              </p>
              {NAV_ITEMS.map(({ path, label, icon: Icon, exact, badge: badgeKey }: any) => {
                const href = adminBase + path
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
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </AuthGuard>
  )
}

'use client'
import { usePathname } from 'next/navigation'
import AdminKatalogPage from '@/components/admin/katalog'

export default function KatalogPage() {
  const pathname = usePathname()
  const segs = pathname.split('/').filter(Boolean)
  const idx = segs.indexOf('admin')
  const shopSlug = idx > 0 ? segs[idx - 1] : 'main'
  return <AdminKatalogPage shopSlug={shopSlug} />
}

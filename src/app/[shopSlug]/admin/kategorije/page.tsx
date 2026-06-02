'use client'
import { usePathname } from 'next/navigation'
import AdminKategorijePage from '@/components/admin/kategorije'

export default function KategorijePage() {
  const pathname = usePathname()
  const segs = pathname.split('/').filter(Boolean)
  const idx = segs.indexOf('admin')
  const shopSlug = idx > 0 ? segs[idx - 1] : 'main'
  return <AdminKategorijePage shopSlug={shopSlug} />
}

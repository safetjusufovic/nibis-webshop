'use client'
import { usePathname } from 'next/navigation'
import AdminPregled from '@/components/admin/pregled'

export default function AdminPage() {
  const pathname = usePathname()
  const segs = pathname.split('/').filter(Boolean)
  const idx = segs.indexOf('admin')
  const shopSlug = idx > 0 ? segs[idx - 1] : 'main'
  return <AdminPregled shopSlug={shopSlug} />
}

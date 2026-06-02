'use client'
import { usePathname } from 'next/navigation'
import AdminSlikePage from '@/components/admin/slike'

export default function SlikePage() {
  const pathname = usePathname()
  const segs = pathname.split('/').filter(Boolean)
  const idx = segs.indexOf('admin')
  const shopSlug = idx > 0 ? segs[idx - 1] : 'main'
  return <AdminSlikePage shopSlug={shopSlug} />
}

'use client'
import { usePathname } from 'next/navigation'
import AdminStranicePage from '@/components/admin/stranice'

export default function StranicePage() {
  const pathname = usePathname()
  const segs = pathname.split('/').filter(Boolean)
  const idx = segs.indexOf('admin')
  const shopSlug = idx > 0 ? segs[idx - 1] : 'main'
  return <AdminStranicePage shopSlug={shopSlug} />
}

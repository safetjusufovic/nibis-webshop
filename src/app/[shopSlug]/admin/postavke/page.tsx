'use client'
import { usePathname } from 'next/navigation'
import AdminPostavkePage from '@/components/admin/postavke'

export default function PostavkePage() {
  const pathname = usePathname()
  const segs = pathname.split('/').filter(Boolean)
  const idx = segs.indexOf('admin')
  const shopSlug = idx > 0 ? segs[idx - 1] : 'main'
  return <AdminPostavkePage shopSlug={shopSlug} />
}

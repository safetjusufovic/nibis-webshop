'use client'
import { usePathname } from 'next/navigation'
import AdminIzvjestajiPage from '@/components/admin/izvjestaji'

export default function IzvjestajiPage() {
  const pathname = usePathname()
  const segs = pathname.split('/').filter(Boolean)
  const idx = segs.indexOf('admin')
  const shopSlug = idx > 0 ? segs[idx - 1] : 'main'
  return <AdminIzvjestajiPage shopSlug={shopSlug} />
}

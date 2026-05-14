'use client'
import { usePathname } from 'next/navigation'
import AdminNarudzbePage from '@/components/admin/narudzbe'

export default function NarudzbePage() {
  const pathname = usePathname()
  const segs = pathname.split('/').filter(Boolean)
  const idx = segs.indexOf('admin')
  const shopSlug = idx > 0 ? segs[idx - 1] : 'main'
  return <AdminNarudzbePage shopSlug={shopSlug} />
}

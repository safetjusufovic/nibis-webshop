'use client'
import { usePathname } from 'next/navigation'
import KorisniciLogPage from '@/components/admin/korisnici-log'

export default function KorisniciLogPage() {
  const pathname = usePathname()
  const segs = pathname.split('/').filter(Boolean)
  const idx = segs.indexOf('admin')
  const shopSlug = idx > 0 ? segs[idx - 1] : 'main'
  return <KorisniciLogPage shopSlug={shopSlug} />
}

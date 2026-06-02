'use client'
import { usePathname } from 'next/navigation'
import AdminKorisniciPage from '@/components/admin/korisnici'

export default function KorisniciPage() {
  const pathname = usePathname()
  const segs = pathname.split('/').filter(Boolean)
  const idx = segs.indexOf('admin')
  const shopSlug = idx > 0 ? segs[idx - 1] : 'main'
  return <AdminKorisniciPage shopSlug={shopSlug} />
}

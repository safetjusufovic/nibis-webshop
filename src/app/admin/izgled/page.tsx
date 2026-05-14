'use client'
import { usePathname } from 'next/navigation'
import IzgledPageShared from '@/components/admin/izgled'

export default function IzgledPage() {
  const pathname = usePathname()
  const segs = pathname.split('/').filter(Boolean)
  const idx = segs.indexOf('admin')
  const shopSlug = idx > 0 ? segs[idx - 1] : 'main'
  return <IzgledPageShared shopSlug={shopSlug} />
}

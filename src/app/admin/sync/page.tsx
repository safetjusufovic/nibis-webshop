'use client'
import { usePathname } from 'next/navigation'
import AdminSyncPage from '@/components/admin/sync'

export default function SyncPage() {
  const pathname = usePathname()
  const segs = pathname.split('/').filter(Boolean)
  const idx = segs.indexOf('admin')
  const shopSlug = idx > 0 ? segs[idx - 1] : 'main'
  return <AdminSyncPage shopSlug={shopSlug} />
}

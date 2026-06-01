'use client'

import { useParams } from 'next/navigation'
import { ShopPage } from '@/app/page'

export default function KlijentskiShopPage() {
  const params = useParams()
  const shopSlug = params?.shopSlug as string || ''
  return <ShopPage shopSlug={shopSlug} />
}

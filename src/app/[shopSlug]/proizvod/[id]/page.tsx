'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'

// Reuseamo postojecu proizvod stranicu ali s ispravnim shopSlug
// Jednostavno importamo i proslijedimo shopSlug
export default function ProizvodPage() {
  const params = useParams()
  const shopSlug = params?.shopSlug as string || ''
  const id = params?.id as string || ''

  // Dinamicki import da izbjegnemo circular deps
  const [ProizvodComp, setProizvodComp] = useState<any>(null)

  useEffect(() => {
    import('@/components/shop/ProizvodDetail').then(m => setProizvodComp(() => m.default)).catch(() => {})
  }, [])

  if (!ProizvodComp) return <div style={{ minHeight: '100vh', background: 'var(--surface)' }} />
  return <ProizvodComp shopSlug={shopSlug} id={id} />
}

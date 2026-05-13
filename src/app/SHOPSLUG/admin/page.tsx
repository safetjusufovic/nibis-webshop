'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabaseAdmin } from '@/lib/supabase'

export default function AdminPage() {
  const params = useParams()
  const shopSlug = params?.shopSlug as string || ''
  const [stats, setStats] = useState({ artikli: 0, narudzbe: 0, korisnici: 0 })
  const [shopId, setShopId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/super-admin/shop-id?slug=' + shopSlug, {
      headers: { 'x-super-admin-secret': 'nibis-super-2025' }
    }).then(r => r.json()).then(d => setShopId(d.id))
  }, [shopSlug])

  useEffect(() => {
    if (!shopId) return
    // Stats za ovaj shop
    Promise.all([
      fetch('/api/artikli?perPage=1&shop=' + shopSlug).then(r => r.json()).then(d => d.total || 0),
      fetch('/api/narudzbe?shop_id=' + shopId).then(r => r.json()).then(d => d.total || 0).catch(() => 0),
    ]).then(([artikli, narudzbe]) => setStats(s => ({ ...s, artikli, narudzbe })))
  }, [shopId, shopSlug])

  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Pregled — {shopSlug}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          { label: 'Artikala', value: stats.artikli, color: '#0F6E56' },
          { label: 'Narudžbi', value: stats.narudzbe, color: '#2563EB' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px 24px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

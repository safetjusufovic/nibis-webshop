import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export const revalidate = 3600 // osvježi svaki sat

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://nibis-webshop.vercel.app'

  // Statične stranice
  const staticneStranice: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/vijesti`, changeFrequency: 'weekly', priority: 0.6 },
  ]

  try {
    // Main shop proizvodi (aktivni, webshop vidljivi)
    const { data: mainShop } = await supabaseAdmin
      .from('shopovi').select('id').eq('slug', 'main').single()

    if (mainShop?.id) {
      const { data: artikli } = await supabaseAdmin
        .from('artikli')
        .select('id, synced_at')
        .eq('shop_id', mainShop.id)
        .eq('aktivan', true)
        .limit(5000)

      const proizvodi: MetadataRoute.Sitemap = (artikli || []).map((a: any) => ({
        url: `${base}/proizvod/${a.id}`,
        lastModified: a.synced_at ? new Date(a.synced_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))

      // CMS stranice
      const { data: stranice } = await supabaseAdmin
        .from('stranice').select('slug').eq('shop_id', mainShop.id)
      const cmsStranice: MetadataRoute.Sitemap = (stranice || []).map((s: any) => ({
        url: `${base}/stranica/${s.slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }))

      return [...staticneStranice, ...proizvodi, ...cmsStranice]
    }
  } catch (e) {
    console.error('[SITEMAP]', e)
  }

  return staticneStranice
}

import { supabase } from './supabase'

export interface Shop {
  id: string
  naziv: string
  slug: string
  domena?: string
  plan: 'starter' | 'pro' | 'enterprise'
  status: string
  nibis_api_url?: string
  nibis_api_key?: string
}

// Cache shops by domain/slug to avoid repeated DB calls
const shopCache = new Map<string, { shop: Shop | null; ts: number }>()
const CACHE_TTL = 60 * 1000 // 1 minute

export async function getShopByDomain(hostname: string): Promise<Shop | null> {
  const cached = shopCache.get(hostname)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.shop

  // Try exact domain match first
  let { data } = await supabase.from('shopovi').select('*').eq('domena', hostname).eq('status', 'aktivan').single()

  // Then try subdomain (slug.domain.ba)
  if (!data) {
    const slug = hostname.split('.')[0]
    const res = await supabase.from('shopovi').select('*').eq('slug', slug).eq('status', 'aktivan').single()
    data = res.data
  }

  const shop = data as Shop | null
  shopCache.set(hostname, { shop, ts: Date.now() })
  return shop
}

export async function getShopById(id: string): Promise<Shop | null> {
  const { data } = await supabase.from('shopovi').select('*').eq('id', id).single()
  return data as Shop | null
}

export async function getUserShop(userId: string): Promise<Shop | null> {
  const { data } = await supabase
    .from('shop_korisnici')
    .select('shopovi(*)')
    .eq('user_id', userId)
    .single()
  return (data?.shopovi as unknown as Shop) || null
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('shop_korisnici')
    .select('uloga')
    .eq('user_id', userId)
    .eq('uloga', 'super_admin')
    .single()
  return !!data
}

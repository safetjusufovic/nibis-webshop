import type { ErpAdapter, ErpConfig } from './types'
import { NibisAdapter } from './nibis-adapter'
import { PantheonAdapter } from './pantheon-adapter'

export * from './types'

// Factory — vraća odgovarajući adapter prema tipu ERP-a
export function getErpAdapter(config: ErpConfig): ErpAdapter {
  switch (config.tip) {
    case 'pantheon':
      return new PantheonAdapter(config)
    case 'nibis':
    default:
      return new NibisAdapter(config)
  }
}

// Dohvati ERP config za shop iz baze
import { supabaseAdmin } from '@/lib/supabase'

export async function getShopErpConfig(shopId: string): Promise<ErpConfig> {
  const { data: shop } = await supabaseAdmin
    .from('shopovi')
    .select('nibis_api_url, nibis_api_key, org_jed_id, company_year, erp_tip, erp_username, erp_password, erp_database')
    .eq('id', shopId)
    .single()

  const defaultConfig: ErpConfig = {
    tip: 'nibis',
    baseUrl: process.env.NIBIS_API_URL ?? '',
    apiKey: process.env.NIBIS_API_KEY ?? '',
    companyYear: process.env.NIBIS_COMPANY_YEAR ?? new Date().getFullYear().toString(),
    orgJedId: parseInt(process.env.ORG_JED_ID ?? '1'),
  }

  if (!shop?.nibis_api_url || !shop?.nibis_api_key) return defaultConfig

  return {
    tip: (shop as any).erp_tip || 'nibis',
    baseUrl: shop.nibis_api_url,
    apiKey: shop.nibis_api_key,
    companyYear: shop.company_year?.toString() || new Date().getFullYear().toString(),
    orgJedId: shop.org_jed_id || 1,
    username: (shop as any).erp_username || undefined,
    password: (shop as any).erp_password || undefined,
    database: (shop as any).erp_database || undefined,
  }
}

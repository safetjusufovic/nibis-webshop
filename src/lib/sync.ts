import { supabaseAdmin } from '@/lib/supabase'
import { getArtikli, getGrupe, getStanje, getPartneri, defaultConfig, NibisConfig } from '@/lib/nibis'

const BATCH_SIZE = 50

// ─── Dohvati config za shop iz baze ──────────────────────────────────────────
export async function getShopConfig(shopId: string): Promise<NibisConfig> {
  const { data } = await supabaseAdmin
    .from('shopovi')
    .select('nibis_api_url, nibis_api_key, org_jed_id, company_year')
    .eq('id', shopId)
    .single()

  if (!data?.nibis_api_url || !data?.nibis_api_key) return defaultConfig

  return {
    baseUrl: data.nibis_api_url,
    apiKey: data.nibis_api_key,
    companyYear: data.company_year?.toString() || new Date().getFullYear().toString(),
    orgJedId: data.org_jed_id || 1,
  }
}

// ─── Sync grupe ───────────────────────────────────────────────────────────────
async function syncGrupe(config: NibisConfig, shopId?: string): Promise<number> {
  let page = 1, total = 0, synced = 0
  do {
    const data = await getGrupe({ page, perPage: BATCH_SIZE }, config)
    total = data.total
    const rows = data.items.map(g => ({
      id: g.id, sifra: g.sifra, naziv: g.naziv, opis: g.opis,
      prefix: g.prefix, nivo: g.nivo, parent_id: g.parentId,
      nibis_created: g.dateCreated, nibis_updated: g.dateModified,
      synced_at: new Date().toISOString(),
      ...(shopId && { shop_id: shopId }),
    }))
    const { error } = await supabaseAdmin.from('grupe').upsert(rows, { onConflict: 'id,shop_id' })
    if (error) throw new Error('Grupe upsert: ' + error.message)
    synced += rows.length; page++
  } while (synced < total)
  return synced
}

// ─── Sync artikli ─────────────────────────────────────────────────────────────
async function syncArtikli(config: NibisConfig, shopId?: string): Promise<number> {
  let page = 1, total = 0, synced = 0
  do {
    const data = await getArtikli({ page, perPage: BATCH_SIZE }, config)
    total = data.total
    const rows = data.items.map(a => ({
      id: a.id, sifra: a.sifra, barkod: a.barkod, naziv: a.naziv,
      naziv2: a.naziv2, opis: a.opis, aktivan: a.aktivan,
      van_upotrebe: a.vanUpotrebe, proc_poreza: a.procPoreza,
      planska_maloprodajna_cijena: a.planskaMaloprodajnaCijena,
      planska_veleprodajna_cijena: a.planskaVeleprodajnaCijena,
      grupa_id: a.grupaId, dobavljac_naziv: a.dobavljac?.naziv ?? null,
      proizvodjac_naziv: a.proizvodjac?.naziv ?? null,
      nibis_created: a.dateCreated, nibis_updated: a.dateModified,
      synced_at: new Date().toISOString(),
      ...(shopId && { shop_id: shopId }),
    }))
    const { error } = await supabaseAdmin.from('artikli').upsert(rows, { onConflict: 'id,shop_id', ignoreDuplicates: false })
    if (error) throw new Error('Artikli upsert: ' + error.message)
    synced += rows.length; page++
  } while (synced < total)
  return synced
}

// ─── Sync stanje ──────────────────────────────────────────────────────────────
async function syncStanje(orgJedId: number, config: NibisConfig, shopId?: string, page = 1): Promise<number> {
  const data = await getStanje(page, orgJedId, undefined, config)
  const rows = data.items.map(s => ({
    id: s.id, artikal_id: s.artikalId, org_jed_id: s.orgJedId,
    raspoloziva_kolicina: s.raspolozivaKolicina, nabavna_cijena: s.nabavnaCijena,
    vpcijena: s.vpcijena, mpcijena: s.mpcijena,
    nibis_created: s.dateCreated, nibis_updated: s.dateModified,
    synced_at: new Date().toISOString(),
    ...(shopId && { shop_id: shopId }),
  }))
  if (rows.length) {
    const { error } = await supabaseAdmin.from('stanje_skladista').upsert(rows, { onConflict: 'id,shop_id' })
    if (error) throw new Error('Stanje upsert: ' + error.message)
  }
  // Rekurzivno ako ima više stranica
  if (data.items.length === 100 && page < 100) {
    return rows.length + await syncStanje(orgJedId, config, shopId, page + 1)
  }
  return rows.length
}

// ─── Sync partneri ────────────────────────────────────────────────────────────
async function syncPartneri(config: NibisConfig): Promise<number> {
  let page = 1, total = 0, synced = 0
  do {
    const data = await getPartneri({ page, perPage: BATCH_SIZE }, config)
    total = data.total
    const rows = data.items.map(p => ({
      id: p.id, sifra: p.sifra, aktivan: p.aktivan, naziv: p.naziv,
      adresa: p.adresa, postanski_broj: p.postanskiBroj, grad: p.grad,
      pdv_broj: p.pdvBroj, id_broj: p.idBroj, tel: p.tel, fax: p.fax,
      email: p.email, pdv_obveznik: p.pdvObveznik, rok_placanja: p.rokPlacanja,
      opis: p.opis, web_site: p.webSite, rabat: p.rabat,
      limit_fin: p.limitFin, limit_fin2: p.limitFin2, napomena: p.napomena,
      partner_grupa_id: p.grupa?.id ?? null, partner_grupa_naziv: p.grupa?.naziv ?? null,
      komercijalista_id: p.komercijalista?.id ?? null,
      komercijalista_naziv: p.komercijalista?.naziv ?? null,
      nibis_created: p.dateCreated, nibis_updated: p.dateModified,
      synced_at: new Date().toISOString(),
    }))
    const { error } = await supabaseAdmin.from('partneri').upsert(rows, { onConflict: 'id' })
    if (error) throw new Error('Partneri upsert: ' + error.message)
    synced += rows.length; page++
  } while (synced < total)
  return synced
}

// ─── FULL SYNC — za jedan shop ────────────────────────────────────────────────
export async function runSync(shopId?: string) {
  const start = Date.now()
  try {
    const config = shopId ? await getShopConfig(shopId) : defaultConfig
    const orgJedId = config.orgJedId || 1

    console.log(`[SYNC] Start shop=${shopId || 'default'} url=${config.baseUrl}`)

    const [grupeCount, artikliCount] = await Promise.all([
      syncGrupe(config, shopId),
      syncArtikli(config, shopId),
    ])
    const stanjeCount = await syncStanje(orgJedId, config, shopId)
    const partneriCount = 0 // partneri se citaju live iz NIBIS API-ja po shopu

    // Ažuriraj last_sync_at za shop
    if (shopId) {
      await supabaseAdmin.from('shopovi').update({ updated_at: new Date().toISOString() }).eq('id', shopId)
    }

    console.log(`[SYNC] Done: grupe=${grupeCount} artikli=${artikliCount} stanje=${stanjeCount} partneri=${partneriCount} ms=${Date.now()-start}`)
    return { success: true, grupeCount, artikliCount, stanjeCount, partneriCount, durationMs: Date.now() - start }
  } catch (err) {
    console.error('[SYNC] Error:', err)
    return { success: false, grupeCount: 0, artikliCount: 0, stanjeCount: 0, partneriCount: 0, durationMs: Date.now() - start, error: String(err) }
  }
}

// ─── INCREMENTAL SYNC — samo izmijenjeni od X minuta ─────────────────────────
export async function runIncrementalSync(minutes = 5, shopId?: string) {
  const start = Date.now()
  try {
    const config = shopId ? await getShopConfig(shopId) : defaultConfig
    const orgJedId = config.orgJedId || 1
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString()

    let artikliCount = 0, stanjeCount = 0, partneriCount = 0

    const artikliData = await getArtikli({ page: 1, perPage: 200, since }, config)
    if (artikliData.items.length > 0) {
      const rows = artikliData.items.map(a => ({
        id: a.id, sifra: a.sifra, barkod: a.barkod, naziv: a.naziv,
        naziv2: a.naziv2, opis: a.opis, aktivan: a.aktivan,
        van_upotrebe: a.vanUpotrebe, proc_poreza: a.procPoreza,
        planska_maloprodajna_cijena: a.planskaMaloprodajnaCijena,
        planska_veleprodajna_cijena: a.planskaVeleprodajnaCijena,
        grupa_id: a.grupaId, dobavljac_naziv: a.dobavljac?.naziv ?? null,
        proizvodjac_naziv: a.proizvodjac?.naziv ?? null,
        nibis_created: a.dateCreated, nibis_updated: a.dateModified,
        synced_at: new Date().toISOString(),
        ...(shopId && { shop_id: shopId }),
      }))
      await supabaseAdmin.from('artikli').upsert(rows, { onConflict: 'id,shop_id', ignoreDuplicates: false })
      artikliCount = rows.length
    }

    const stanjeData = await getStanje(1, orgJedId, since, config)
    if (stanjeData.items.length > 0) {
      const rows = stanjeData.items.map(s => ({
        id: s.id, artikal_id: s.artikalId, org_jed_id: s.orgJedId,
        raspoloziva_kolicina: s.raspolozivaKolicina, nabavna_cijena: s.nabavnaCijena,
        vpcijena: s.vpcijena, mpcijena: s.mpcijena,
        nibis_created: s.dateCreated, nibis_updated: s.dateModified,
        synced_at: new Date().toISOString(),
        ...(shopId && { shop_id: shopId }),
      }))
      await supabaseAdmin.from('stanje_skladista').upsert(rows, { onConflict: 'id,shop_id' })
      stanjeCount = rows.length
    }

    return { success: true, grupeCount: 0, artikliCount, stanjeCount, partneriCount, durationMs: Date.now() - start }
  } catch (err) {
    return { success: false, grupeCount: 0, artikliCount: 0, stanjeCount: 0, partneriCount: 0, durationMs: Date.now() - start, error: String(err) }
  }
}

// Backwards compat
export async function runSyncPartial(only: string, page: number, shopId?: string) {
  return runSync(shopId)
}

// ─── CHUNK SYNC — jedna stranica po pozivu (za Free plan 10s limit) ──────────
const CHUNK_SIZE = 100

export async function syncChunk(shopId: string, what: string, page: number) {
  const config = await getShopConfig(shopId)
  const orgJedId = config.orgJedId || 1

  if (what === 'grupe') {
    const data = await getGrupe({ page, perPage: CHUNK_SIZE }, config)
    const rows = data.items.map(g => ({
      id: g.id, sifra: g.sifra, naziv: g.naziv, opis: g.opis,
      prefix: g.prefix, nivo: g.nivo, parent_id: g.parentId,
      nibis_created: g.dateCreated, nibis_updated: g.dateModified,
      synced_at: new Date().toISOString(), shop_id: shopId,
    }))
    if (rows.length) await supabaseAdmin.from('grupe').upsert(rows, { onConflict: 'id,shop_id' })
    const hasMore = page * CHUNK_SIZE < data.total
    return { what, page, synced: rows.length, total: data.total, hasMore, next: hasMore ? { what: 'grupe', page: page + 1 } : { what: 'artikli', page: 1 } }
  }

  if (what === 'artikli') {
    const data = await getArtikli({ page, perPage: CHUNK_SIZE }, config)
    const rows = data.items.map(a => ({
      id: a.id, sifra: a.sifra, barkod: a.barkod, naziv: a.naziv,
      naziv2: a.naziv2, opis: a.opis, aktivan: a.aktivan,
      van_upotrebe: a.vanUpotrebe, proc_poreza: a.procPoreza,
      planska_maloprodajna_cijena: a.planskaMaloprodajnaCijena,
      planska_veleprodajna_cijena: a.planskaVeleprodajnaCijena,
      grupa_id: a.grupaId, dobavljac_naziv: a.dobavljac?.naziv ?? null,
      proizvodjac_naziv: a.proizvodjac?.naziv ?? null,
      nibis_created: a.dateCreated, nibis_updated: a.dateModified,
      synced_at: new Date().toISOString(), shop_id: shopId,
    }))
    if (rows.length) await supabaseAdmin.from('artikli').upsert(rows, { onConflict: 'id,shop_id', ignoreDuplicates: false })
    const hasMore = page * CHUNK_SIZE < data.total
    return { what, page, synced: rows.length, total: data.total, hasMore, next: hasMore ? { what: 'artikli', page: page + 1 } : { what: 'stanje', page: 1 } }
  }

  if (what === 'stanje') {
    const data = await getStanje(page, orgJedId, undefined, config)
    const rows = data.items.map(s => ({
      id: s.id, artikal_id: s.artikalId, org_jed_id: s.orgJedId,
      raspoloziva_kolicina: s.raspolozivaKolicina, nabavna_cijena: s.nabavnaCijena,
      vpcijena: s.vpcijena, mpcijena: s.mpcijena,
      nibis_created: s.dateCreated, nibis_updated: s.dateModified,
      synced_at: new Date().toISOString(), shop_id: shopId,
    }))
    if (rows.length) await supabaseAdmin.from('stanje_skladista').upsert(rows, { onConflict: 'id,shop_id' })
    const hasMore = data.items.length === CHUNK_SIZE
    return { what, page, synced: rows.length, total: data.total, hasMore, next: hasMore ? { what: 'stanje', page: page + 1 } : null }
  }

  // Ažuriraj timestamp na kraju
  await supabaseAdmin.from('shopovi').update({ updated_at: new Date().toISOString() }).eq('id', shopId)
  return { what, page, synced: 0, total: 0, hasMore: false, next: null }
}

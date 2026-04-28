import { supabaseAdmin } from '@/lib/supabase'
import { getArtikli, getGrupe, getStanje, getPartneri } from '@/lib/nibis'
import { siteConfig } from '@/lib/config'

const BATCH_SIZE = 50

// ─── Sync grupe ───────────────────────────────────────────────────────────────
// parentId → parent_id | dateCreated → nibis_created | dateModified → nibis_updated
async function syncGrupe(): Promise<number> {
  let page = 1, total = 0, synced = 0
  do {
    const data = await getGrupe({ page, perPage: BATCH_SIZE })
    total = data.total
    const rows = data.items.map(g => ({
      id:            g.id,
      sifra:         g.sifra,
      naziv:         g.naziv,
      opis:          g.opis,
      prefix:        g.prefix,
      nivo:          g.nivo,
      parent_id:     g.parentId,
      nibis_created: g.dateCreated,
      nibis_updated: g.dateModified,
      synced_at:     new Date().toISOString(),
    }))
    const { error } = await supabaseAdmin.from('grupe').upsert(rows, { onConflict: 'id' })
    if (error) throw new Error('Grupe upsert: ' + error.message)
    synced += rows.length
    page++
  } while (synced < total)
  return synced
}

// ─── Sync artikli ─────────────────────────────────────────────────────────────
// vanUpotrebe → van_upotrebe
// procPoreza → proc_poreza
// planskaMaloprodajnaCijena → planska_maloprodajna_cijena
// planskaVeleprodajnaCijena → planska_veleprodajna_cijena
// grupaId → grupa_id
// dobavljac.naziv → dobavljac_naziv
// dateCreated → nibis_created | dateModified → nibis_updated
// slika_url IZOSTAVLJENO — admin postavlja ručno, sync ne smije prepisati
async function syncArtikli(): Promise<number> {
  let page = 1, total = 0, synced = 0
  do {
    const data = await getArtikli({ page, perPage: BATCH_SIZE })
    total = data.total
    const rows = data.items.map(a => ({
      id:                          a.id,
      sifra:                       a.sifra,
      barkod:                      a.barkod,
      naziv:                       a.naziv,
      naziv2:                      a.naziv2,
      opis:                        a.opis,
      aktivan:                     a.aktivan,
      van_upotrebe:                a.vanUpotrebe,
      proc_poreza:                 a.procPoreza,
      planska_maloprodajna_cijena: a.planskaMaloprodajnaCijena,
      planska_veleprodajna_cijena: a.planskaVeleprodajnaCijena,
      grupa_id:                    a.grupaId,
      dobavljac_naziv:             a.dobavljac?.naziv ?? null,
      proizvodjac_naziv:           a.proizvodjac?.naziv ?? null,
      nibis_created:               a.dateCreated,
      nibis_updated:               a.dateModified,
      synced_at:                   new Date().toISOString(),
    }))
    const { error } = await supabaseAdmin.from('artikli').upsert(rows, { onConflict: 'id', ignoreDuplicates: false })
    if (error) throw new Error('Artikli upsert: ' + error.message)
    synced += rows.length
    page++
  } while (synced < total)
  return synced
}

// ─── Sync stanje ──────────────────────────────────────────────────────────────
// artikalId → artikal_id | orgJedId → org_jed_id
// raspolozivaKolicina → raspoloziva_kolicina | nabavnaCijena → nabavna_cijena
// vpcijena → vpcijena | mpcijena → mpcijena (isti naziv)
async function syncStanje(orgJedId: number): Promise<number> {
  let page = 1, synced = 0
  while (true) {
    const data = await getStanje(orgJedId)
    if (!data.items.length) break
    const rows = data.items.map(s => ({
      id:                   s.id,
      artikal_id:           s.artikalId,
      org_jed_id:           s.orgJedId,
      raspoloziva_kolicina: s.raspolozivaKolicina,
      nabavna_cijena:       s.nabavnaCijena,
      vpcijena:             s.vpcijena,
      mpcijena:             s.mpcijena,
      nibis_created:        s.dateCreated,
      nibis_updated:        s.dateModified,
      synced_at:            new Date().toISOString(),
    }))
    const { error } = await supabaseAdmin.from('stanje_skladista').upsert(rows, { onConflict: 'id' })
    if (error) throw new Error('Stanje upsert: ' + error.message)
    synced += rows.length
    if (data.items.length < BATCH_SIZE) break
    page++
  }
  return synced
}

// ─── Sync partneri ────────────────────────────────────────────────────────────
// postanskiBroj → postanski_broj | pdvBroj → pdv_broj | idBroj → id_broj
// pdvObveznik → pdv_obveznik | rokPlacanja → rok_placanja | webSite → web_site
// limitFin → limit_fin | limitFin2 → limit_fin2
// tel → tel (API koristi "tel" ne "telefon"!)
// grupa.id → partner_grupa_id | grupa.naziv → partner_grupa_naziv
// komercijalista.id → komercijalista_id | komercijalista.naziv → komercijalista_naziv
async function syncPartneri(): Promise<number> {
  let page = 1, total = 0, synced = 0
  do {
    const data = await getPartneri({ page, perPage: BATCH_SIZE })
    total = data.total
    const rows = data.items.map(p => ({
      id:                   p.id,
      sifra:                p.sifra,
      aktivan:              p.aktivan,
      naziv:                p.naziv,
      adresa:               p.adresa,
      postanski_broj:       p.postanskiBroj,
      grad:                 p.grad,
      pdv_broj:             p.pdvBroj,
      id_broj:              p.idBroj,
      tel:                  p.tel,
      fax:                  p.fax,
      email:                p.email,
      pdv_obveznik:         p.pdvObveznik,
      rok_placanja:         p.rokPlacanja,
      opis:                 p.opis,
      web_site:             p.webSite,
      rabat:                p.rabat,
      limit_fin:            p.limitFin,
      limit_fin2:           p.limitFin2,
      napomena:             p.napomena,
      partner_grupa_id:     p.grupa?.id ?? null,
      partner_grupa_naziv:  p.grupa?.naziv ?? null,
      komercijalista_id:    p.komercijalista?.id ?? null,
      komercijalista_naziv: p.komercijalista?.naziv ?? null,
      nibis_created:        p.dateCreated,
      nibis_updated:        p.dateModified,
      synced_at:            new Date().toISOString(),
    }))
    const { error } = await supabaseAdmin.from('partneri').upsert(rows, { onConflict: 'id' })
    if (error) throw new Error('Partneri upsert: ' + error.message)
    synced += rows.length
    page++
  } while (synced < total)
  return synced
}

// ─── Glavni runner ────────────────────────────────────────────────────────────
export async function runSync(): Promise<{
  success: boolean
  grupeCount: number
  artikliCount: number
  stanjeCount: number
  partneriCount: number
  durationMs: number
  error?: string
}> {
  const start = Date.now()
  const { data: logEntry } = await supabaseAdmin
    .from('sync_log').insert({ status: 'running' }).select('id').single()
  const logId = logEntry?.id

  try {
    const grupeCount    = await syncGrupe()
    const artikliCount  = await syncArtikli()
    const stanjeCount   = await syncStanje(siteConfig.orgJedId)
    const partneriCount = await syncPartneri()
    const durationMs    = Date.now() - start

    if (logId) {
      await supabaseAdmin.from('sync_log').update({
        status: 'success', finished_at: new Date().toISOString(),
        grupe_synced: grupeCount, artikli_synced: artikliCount,
        stanje_synced: stanjeCount, partneri_synced: partneriCount,
      }).eq('id', logId)
    }
    return { success: true, grupeCount, artikliCount, stanjeCount, partneriCount, durationMs }
  } catch (err) {
    const errorMessage = String(err)
    if (logId) {
      await supabaseAdmin.from('sync_log').update({
        status: 'error', finished_at: new Date().toISOString(), error_message: errorMessage,
      }).eq('id', logId)
    }
    return { success: false, grupeCount: 0, artikliCount: 0, stanjeCount: 0, partneriCount: 0, durationMs: Date.now() - start, error: errorMessage }
  }
}

// ─── Partial sync ─────────────────────────────────────────────────────────────
export async function runSyncPartial(only: string): Promise<{
  success: boolean
  grupeCount: number
  artikliCount: number
  stanjeCount: number
  partneriCount: number
  durationMs: number
  error?: string
}> {
  const start = Date.now()
  try {
    let grupeCount = 0, artikliCount = 0, stanjeCount = 0, partneriCount = 0
    if (only === 'grupe') grupeCount = await syncGrupe()
    else if (only === 'artikli') artikliCount = await syncArtikli()
    else if (only === 'stanje') stanjeCount = await syncStanje(siteConfig.orgJedId)
    else if (only === 'partneri') partneriCount = await syncPartneri()
    return { success: true, grupeCount, artikliCount, stanjeCount, partneriCount, durationMs: Date.now() - start }
  } catch (err) {
    return { success: false, grupeCount: 0, artikliCount: 0, stanjeCount: 0, partneriCount: 0, durationMs: Date.now() - start, error: String(err) }
  }
}

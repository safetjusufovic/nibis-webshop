import type {
  ErpAdapter, ErpConfig, ErpListParams, ErpListResult,
  ErpArtikal, ErpGrupa, ErpStanje, ErpPartner, ErpNarudzba, ErpNarudzbaResult
} from './types'
import * as nibis from '@/lib/nibis'
import type { NibisConfig } from '@/types/nibis'

// NIBIS adapter — wrapuje postojeći nibis.ts u standardni ErpAdapter interfejs
export class NibisAdapter implements ErpAdapter {
  tip = 'nibis'
  private config: NibisConfig

  constructor(config: ErpConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      companyYear: config.companyYear || new Date().getFullYear().toString(),
      orgJedId: config.orgJedId || 1,
    }
  }

  async getArtikli(params: ErpListParams): Promise<ErpListResult<ErpArtikal>> {
    const r = await nibis.getArtikli(params, this.config)
    return { items: r.items as any, total: r.total }
  }

  async getGrupe(params: ErpListParams): Promise<ErpListResult<ErpGrupa>> {
    const r = await nibis.getGrupe(params, this.config)
    return { items: r.items as any, total: r.total }
  }

  async getStanje(page: number, orgJedId?: number, since?: string): Promise<ErpListResult<ErpStanje>> {
    const r = await nibis.getStanje(page, orgJedId ?? this.config.orgJedId, since, this.config)
    return { items: r.items as any, total: r.total }
  }

  async getPartneri(params: ErpListParams): Promise<ErpListResult<ErpPartner>> {
    const r = await nibis.getPartneri(params, this.config)
    return { items: r.items as any, total: r.total }
  }

  async createNarudzba(narudzba: ErpNarudzba): Promise<ErpNarudzbaResult> {
    // Mapiraj standardni ErpNarudzba u NIBIS format
    const payload: any = {
      orgJedId: narudzba.orgJedId,
      datum: new Date().toISOString(),
      rbrAuto: true, rbr: null,
      partnerId: narudzba.partnerId,
      externalId: narudzba.externalId,
      nacinPlacanja: narudzba.nacinPlacanja,
      nacinOdredjivanjaCijene: 'StandardnaProdaja',
      nacinObracunaPoreza: 'SaPorezom',
      napomena: narudzba.napomena ?? null,
      stavke: narudzba.stavke.map(s => ({
        rbr: null, tip: 'Artikal',
        artikalId: s.artikalId, naziv: s.naziv,
        kolicina: s.kolicina, jedinicnaCijena: s.jedinicnaCijena,
        poreskaStopa: s.poreskaStopa,
      })),
    }
    const r = await nibis.createNarudzba(payload, this.config)
    return { id: r.id, oznakaDokumenta: r.oznakaDokumenta, ukupnoSaPorezom: r.ukupnoSaPorezom }
  }

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    return nibis.testConnection(this.config)
  }
}

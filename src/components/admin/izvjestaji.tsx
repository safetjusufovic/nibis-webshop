'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCijena } from '@/lib/config'
import { TrendingUp, ShoppingBag, Users, Package, Calendar } from 'lucide-react'

interface StatKartica {
  label: string
  vrijednost: string
  opis: string
  icon: React.ReactNode
  boja: string
}

interface TopArtikal {
  naziv: string
  sifra: string
  ukupno_kolicina: number
  ukupno_iznos: number
}

interface TopPartner {
  naziv: string
  ukupno_narudzbi: number
  ukupno_iznos: number
}

interface PrometPoMjesecu {
  mjesec: string
  ukupno: number
  narudzbi: number
}

const PERIODI = [
  { label: '7 dana', days: 7 },
  { label: '30 dana', days: 30 },
  { label: '3 mjeseca', days: 90 },
  { label: 'Ova godina', days: 365 },
]

export default function AdminIzvjestajiPage({ shopSlug = 'main' }: { shopSlug?: string }) {
  const [shopId, setShopId] = useState<string | null>(null)

  useEffect(() => {
    const lookupSlug = shopSlug || 'main'
    fetch('/api/shop-info?slug=' + lookupSlug)
      .then(r => r.json()).then(d => setShopId(d.id || null))
  }, [shopSlug])


  const [period, setPeriod] = useState(30)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ ukupnoPromet: 0, ukupnoNarudzbi: 0, aktivniKupci: 0, prosjecnaVrijednost: 0 })
  const [topArtikli, setTopArtikli] = useState<TopArtikal[]>([])
  const [topPartneri, setTopPartneri] = useState<TopPartner[]>([])
  const [prometPoMjesecima, setPrometPoMjesecima] = useState<PrometPoMjesecu[]>([])

  useEffect(() => {
    if (!shopId) return // čekaj shopId
    load()
  }, [period, shopId])

  async function load() {
    setLoading(true)
    const od = new Date()
    od.setDate(od.getDate() - period)
    const odStr = od.toISOString()

    // Osnovne statistike
    let qNar = supabase
      .from('narudzbe')
      .select('ukupno_sa_porezom, korisnik_id, partner_id, created_at, status')
      .gte('created_at', odStr)
      .neq('status', 'otkazana')
    qNar = qNar.eq('shop_id', shopId)
    const { data: narudzbe } = await qNar

    const ukupnoPromet = narudzbe?.reduce((s, n) => s + (n.ukupno_sa_porezom ?? 0), 0) ?? 0
    const ukupnoNarudzbi = narudzbe?.length ?? 0
    const aktivniKupci = new Set(narudzbe?.map(n => n.korisnik_id)).size
    const prosjecnaVrijednost = ukupnoNarudzbi > 0 ? ukupnoPromet / ukupnoNarudzbi : 0

    setStats({ ukupnoPromet, ukupnoNarudzbi, aktivniKupci, prosjecnaVrijednost })

    // Top artikli
    const { data: stavke } = await supabase
      .from('narudzba_stavke')
      .select('naziv, sifra, kolicina, jedinicna_cijena, narudzba:narudzbe!narudzba_id(created_at, status, shop_id)')
      .gte('narudzbe.created_at', odStr)
      .eq('narudzbe.shop_id', shopId)

    const artikalMap: Record<string, TopArtikal> = {}
    stavke?.forEach((s: any) => {
      if (s.narudzba?.status === 'otkazana') return
      const key = s.sifra || s.naziv
      if (!artikalMap[key]) {
        artikalMap[key] = { naziv: s.naziv, sifra: s.sifra, ukupno_kolicina: 0, ukupno_iznos: 0 }
      }
      artikalMap[key].ukupno_kolicina += s.kolicina
      artikalMap[key].ukupno_iznos += s.kolicina * s.jedinicna_cijena
    })
    const sortedArtikli = Object.values(artikalMap)
      .sort((a, b) => b.ukupno_iznos - a.ukupno_iznos)
      .slice(0, 10)
    setTopArtikli(sortedArtikli)

    // Top partneri
    const { data: narudzbePartneri } = await supabase
      .from('narudzbe')
      .select('ukupno_sa_porezom, status, partner:partneri!partner_id(naziv)')
      .gte('created_at', odStr)
      .neq('status', 'otkazana')
      .eq('shop_id', shopId)

    const partnerMap: Record<string, TopPartner> = {}
    narudzbePartneri?.forEach((n: any) => {
      const naziv = n.partner?.naziv ?? 'Nepoznat'
      if (!partnerMap[naziv]) {
        partnerMap[naziv] = { naziv, ukupno_narudzbi: 0, ukupno_iznos: 0 }
      }
      partnerMap[naziv].ukupno_narudzbi++
      partnerMap[naziv].ukupno_iznos += n.ukupno_sa_porezom ?? 0
    })
    const sortedPartneri = Object.values(partnerMap)
      .sort((a, b) => b.ukupno_iznos - a.ukupno_iznos)
      .slice(0, 10)
    setTopPartneri(sortedPartneri)

    // Promet po mjesecima (zadnjih 6)
    const mjeseci: Record<string, PrometPoMjesecu> = {}
    narudzbe?.forEach(n => {
      const d = new Date(n.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!mjeseci[key]) {
        const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
        mjeseci[key] = { mjesec: `${names[d.getMonth()]} ${d.getFullYear()}`, ukupno: 0, narudzbi: 0 }
      }
      mjeseci[key].ukupno += n.ukupno_sa_porezom ?? 0
      mjeseci[key].narudzbi++
    })
    setPrometPoMjesecima(Object.entries(mjeseci).sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v))

    setLoading(false)
  }

  const karticeBoje = ['#0F6E56', '#1D4ED8', '#92400E', '#7C3AED']
  const kartice: StatKartica[] = [
    { label: 'Ukupan promet', vrijednost: formatCijena(stats.ukupnoPromet), opis: `Zadnjih ${period} dana`, icon: <TrendingUp size={18} />, boja: karticeBoje[0] },
    { label: 'Narudžbi', vrijednost: String(stats.ukupnoNarudzbi), opis: `Zadnjih ${period} dana`, icon: <ShoppingBag size={18} />, boja: karticeBoje[1] },
    { label: 'Aktivnih kupaca', vrijednost: String(stats.aktivniKupci), opis: 'Jedinstvenih partnera', icon: <Users size={18} />, boja: karticeBoje[2] },
    { label: 'Prosj. narudžba', vrijednost: formatCijena(stats.prosjecnaVrijednost), opis: 'Po narudžbi', icon: <Package size={18} />, boja: karticeBoje[3] },
  ]

  const maxPromet = Math.max(...prometPoMjesecima.map(m => m.ukupno), 1)
  const maxArtikalIznos = Math.max(...topArtikli.map(a => a.ukupno_iznos), 1)
  const maxPartnerIznos = Math.max(...topPartneri.map(p => p.ukupno_iznos), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text)' }}>Izvještaji</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Pregled prometa i prodaje</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', background: 'white', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
          {PERIODI.map(p => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                border: 'none',
                borderRadius: '7px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: period === p.days ? 600 : 400,
                background: period === p.days ? 'var(--brand)' : 'transparent',
                color: period === p.days ? 'white' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat kartice */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
        {kartice.map(k => (
          <div key={k.label} style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: k.boja + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.boja }}>
                {k.icon}
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
              {loading ? <div style={{ height: '26px', background: 'var(--border)', borderRadius: '6px', width: '80%', animation: 'pulse 1.5s infinite' }} /> : k.vrijednost}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{k.opis}</div>
          </div>
        ))}
      </div>

      {/* Promet po mjesecima */}
      {prometPoMjesecima.length > 0 && (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} style={{ color: 'var(--brand)' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Promet po periodu</span>
          </div>
          <div style={{ padding: '20px', display: 'flex', gap: '12px', alignItems: 'flex-end', minHeight: '160px' }}>
            {prometPoMjesecima.map(m => (
              <div key={m.mjesec} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '50px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand)' }}>{formatCijena(m.ukupno).replace(' KM', '')}</span>
                <div style={{
                  width: '100%',
                  background: 'var(--brand)',
                  borderRadius: '6px 6px 0 0',
                  height: `${Math.max(8, (m.ukupno / maxPromet) * 120)}px`,
                  transition: 'height 0.3s ease',
                  opacity: 0.85,
                }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>{m.mjesec}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{m.narudzbi} nar.</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top artikli i partneri */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="reports-grid">

        {/* Top artikli */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Top 10 artikala</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {loading ? (
              [1,2,3,4,5].map(i => <div key={i} style={{ height: '44px', margin: '4px 16px', background: 'var(--border)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />)
            ) : topArtikli.length === 0 ? (
              <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Nema podataka</p>
            ) : topArtikli.map((a, i) => (
              <div key={a.sifra} style={{ padding: '10px 16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${(a.ukupno_iznos / maxArtikalIznos) * 100}%`,
                  background: 'var(--brand-pale)',
                  zIndex: 0,
                }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', width: '16px' }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.naziv}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.ukupno_kolicina} kom</div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand)', whiteSpace: 'nowrap' }}>{formatCijena(a.ukupno_iznos)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top partneri */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Top 10 partnera</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {loading ? (
              [1,2,3,4,5].map(i => <div key={i} style={{ height: '44px', margin: '4px 16px', background: 'var(--border)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />)
            ) : topPartneri.length === 0 ? (
              <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Nema podataka</p>
            ) : topPartneri.map((p, i) => (
              <div key={p.naziv} style={{ padding: '10px 16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${(p.ukupno_iznos / maxPartnerIznos) * 100}%`,
                  background: '#EFF6FF',
                  zIndex: 0,
                }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', width: '16px' }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.naziv}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.ukupno_narudzbi} narudžbi</div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1D4ED8', whiteSpace: 'nowrap' }}>{formatCijena(p.ukupno_iznos)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .reports-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

-- ============================================================
-- NIBIS WebShop — Supabase schema
-- Pokreni ovo u Supabase SQL editoru (jednokratno)
-- ============================================================

-- ─── Grupe artikala (sync sa NIBIS) ──────────────────────────────────────────
-- API: { id, sifra, naziv, opis, prefix, nivo, parentId, dateCreated, dateModified }
CREATE TABLE IF NOT EXISTS grupe (
  id            BIGINT PRIMARY KEY,
  sifra         TEXT NOT NULL,
  naziv         TEXT NOT NULL,
  opis          TEXT,
  prefix        TEXT,
  nivo          INTEGER DEFAULT 1,
  parent_id     BIGINT REFERENCES grupe(id),   -- API: parentId
  nibis_created TIMESTAMPTZ,                    -- API: dateCreated
  nibis_updated TIMESTAMPTZ,                    -- API: dateModified
  synced_at     TIMESTAMPTZ DEFAULT now()
);

-- ─── Artikli (sync sa NIBIS) ─────────────────────────────────────────────────
-- API: { id, sifra, barkod, naziv, naziv2, opis, aktivan, vanUpotrebe,
--        procPoreza, planskaMaloprodajnaCijena, planskaVeleprodajnaCijena,
--        grupaId, dobavljac{naziv}, proizvodjac{naziv}, dateCreated, dateModified }
CREATE TABLE IF NOT EXISTS artikli (
  id                            BIGINT PRIMARY KEY,
  sifra                         TEXT NOT NULL,
  barkod                        TEXT,                -- API: barkod
  naziv                         TEXT NOT NULL,
  naziv2                        TEXT,                -- API: naziv2
  opis                          TEXT,
  aktivan                       BOOLEAN DEFAULT true,
  van_upotrebe                  BOOLEAN DEFAULT false, -- API: vanUpotrebe
  proc_poreza                   NUMERIC(5,2) DEFAULT 0, -- API: procPoreza
  planska_maloprodajna_cijena   NUMERIC(12,2) DEFAULT 0, -- API: planskaMaloprodajnaCijena
  planska_veleprodajna_cijena   NUMERIC(12,2) DEFAULT 0, -- API: planskaVeleprodajnaCijena
  grupa_id                      BIGINT REFERENCES grupe(id), -- API: grupaId
  dobavljac_naziv               TEXT,                -- API: dobavljac.naziv
  proizvodjac_naziv             TEXT,                -- API: proizvodjac.naziv
  slika_url                     TEXT,                -- WebShop: Cloudinary (nije iz NIBIS-a)
  nibis_created                 TIMESTAMPTZ,         -- API: dateCreated
  nibis_updated                 TIMESTAMPTZ,         -- API: dateModified
  synced_at                     TIMESTAMPTZ DEFAULT now()
);

-- ─── Stanje skladišta (sync sa NIBIS) ────────────────────────────────────────
-- API: { id, artikalId, orgJedId, raspolozivaKolicina,
--        nabavnaCijena, vpcijena, mpcijena, dateCreated, dateModified }
CREATE TABLE IF NOT EXISTS stanje_skladista (
  id                    BIGINT PRIMARY KEY,
  artikal_id            BIGINT NOT NULL REFERENCES artikli(id) ON DELETE CASCADE, -- API: artikalId
  org_jed_id            INTEGER NOT NULL,             -- API: orgJedId
  raspoloziva_kolicina  NUMERIC(12,3) DEFAULT 0,      -- API: raspolozivaKolicina
  nabavna_cijena        NUMERIC(12,2) DEFAULT 0,      -- API: nabavnaCijena
  vpcijena              NUMERIC(12,2) DEFAULT 0,      -- API: vpcijena
  mpcijena              NUMERIC(12,2) DEFAULT 0,      -- API: mpcijena
  nibis_created         TIMESTAMPTZ,                  -- API: dateCreated
  nibis_updated         TIMESTAMPTZ,                  -- API: dateModified
  synced_at             TIMESTAMPTZ DEFAULT now(),
  UNIQUE(artikal_id, org_jed_id)
);

-- ─── Partneri (sync sa NIBIS) ─────────────────────────────────────────────────
-- API: { id, sifra, aktivan, naziv, adresa, postanskiBroj, grad,
--        pdvBroj, idBroj, tel, fax, email, pdvObveznik, rokPlacanja,
--        opis, webSite, rabat, limitFin, limitFin2, napomena,
--        dateCreated, dateModified, grupa{id,naziv,sifra}, komercijalista{id,naziv,sifra} }
CREATE TABLE IF NOT EXISTS partneri (
  id                BIGINT PRIMARY KEY,               -- API: id (NIBIS id, nije UUID)
  sifra             TEXT,                             -- API: sifra
  aktivan           BOOLEAN DEFAULT true,             -- API: aktivan
  naziv             TEXT NOT NULL,                    -- API: naziv
  adresa            TEXT,                             -- API: adresa
  postanski_broj    TEXT,                             -- API: postanskiBroj
  grad              TEXT,                             -- API: grad
  pdv_broj          TEXT,                             -- API: pdvBroj
  id_broj           TEXT,                             -- API: idBroj
  tel               TEXT,                             -- API: tel
  fax               TEXT,                             -- API: fax
  email             TEXT,                             -- API: email
  pdv_obveznik      BOOLEAN DEFAULT false,            -- API: pdvObveznik
  rok_placanja      INTEGER,                          -- API: rokPlacanja
  opis              TEXT,                             -- API: opis
  web_site          TEXT,                             -- API: webSite
  rabat             NUMERIC(5,2) DEFAULT 0,           -- API: rabat
  limit_fin         NUMERIC(12,2) DEFAULT 0,          -- API: limitFin
  limit_fin2        NUMERIC(12,2) DEFAULT 0,          -- API: limitFin2
  napomena          TEXT,                             -- API: napomena
  partner_grupa_id  BIGINT,                           -- API: grupa.id
  partner_grupa_naziv TEXT,                           -- API: grupa.naziv
  komercijalista_id   BIGINT,                         -- API: komercijalista.id
  komercijalista_naziv TEXT,                          -- API: komercijalista.naziv
  nibis_created     TIMESTAMPTZ,                      -- API: dateCreated
  nibis_updated     TIMESTAMPTZ,                      -- API: dateModified
  synced_at         TIMESTAMPTZ DEFAULT now()
);

-- ─── Korisnici webshopa (vezani za partnera iz NIBIS-a) ───────────────────────
CREATE TABLE IF NOT EXISTS korisnici (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id    BIGINT REFERENCES partneri(id),       -- NIBIS partner id
  ime           TEXT,
  prezime       TEXT,
  telefon       TEXT,
  role          TEXT CHECK (role IN ('admin','kupac')) DEFAULT 'kupac',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── Sync log ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_log (
  id              BIGSERIAL PRIMARY KEY,
  started_at      TIMESTAMPTZ DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  status          TEXT CHECK (status IN ('running','success','error')) DEFAULT 'running',
  grupe_synced    INTEGER DEFAULT 0,
  artikli_synced  INTEGER DEFAULT 0,
  stanje_synced   INTEGER DEFAULT 0,
  partneri_synced INTEGER DEFAULT 0,
  error_message   TEXT
);

-- ─── Narudžbe ─────────────────────────────────────────────────────────────────
-- Lokalna kopija narudžbi koje su poslane u NIBIS
CREATE TABLE IF NOT EXISTS narudzbe (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  korisnik_id       UUID REFERENCES korisnici(id),
  partner_id        BIGINT REFERENCES partneri(id),   -- NIBIS partner id
  nibis_id          BIGINT,                            -- API response: id
  nibis_oznaka      TEXT,                              -- API response: oznakaDokumenta
  nibis_external_id TEXT UNIQUE,                       -- API request: externalId
  org_jed_id        INTEGER NOT NULL,
  ukupno_bez_poreza NUMERIC(12,2) DEFAULT 0,           -- API response: ukupnoBezPoreza
  ukupno_porez      NUMERIC(12,2) DEFAULT 0,           -- API response: ukupnoPorez
  ukupno_sa_porezom NUMERIC(12,2) DEFAULT 0,           -- API response: ukupnoSaPorezom
  nacin_placanja    TEXT DEFAULT 'Virman',              -- API: nacinPlacanja
  napomena          TEXT,
  status            TEXT CHECK (status IN ('kreirana','poslana','greska')) DEFAULT 'kreirana',
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS narudzba_stavke (
  id                BIGSERIAL PRIMARY KEY,
  narudzba_id       UUID NOT NULL REFERENCES narudzbe(id) ON DELETE CASCADE,
  artikal_id        BIGINT NOT NULL,                   -- API: artikalId
  naziv             TEXT NOT NULL,                     -- API: naziv
  sifra             TEXT,
  kolicina          NUMERIC(12,3) NOT NULL,            -- API: kolicina
  jedinicna_cijena  NUMERIC(12,2) NOT NULL,            -- API: jedinicnaCijena
  poreska_stopa     NUMERIC(5,2) DEFAULT 0,            -- API: poreskaStopa (bilo: poreskastopa)
  ukupno            NUMERIC(12,2) GENERATED ALWAYS AS (kolicina * jedinicna_cijena) STORED
);

-- ─── Indeksi ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_artikli_grupa    ON artikli(grupa_id);
CREATE INDEX IF NOT EXISTS idx_artikli_aktivan  ON artikli(aktivan);
CREATE INDEX IF NOT EXISTS idx_stanje_artikal   ON stanje_skladista(artikal_id);
CREATE INDEX IF NOT EXISTS idx_stanje_orgjed    ON stanje_skladista(org_jed_id);
CREATE INDEX IF NOT EXISTS idx_partneri_aktivan ON partneri(aktivan);
CREATE INDEX IF NOT EXISTS idx_narudzbe_korisnik ON narudzbe(korisnik_id);
CREATE INDEX IF NOT EXISTS idx_narudzbe_partner  ON narudzbe(partner_id);
CREATE INDEX IF NOT EXISTS idx_narudzbe_created  ON narudzbe(created_at DESC);

-- ─── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE grupe            ENABLE ROW LEVEL SECURITY;
ALTER TABLE artikli          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stanje_skladista ENABLE ROW LEVEL SECURITY;
ALTER TABLE partneri         ENABLE ROW LEVEL SECURITY;
ALTER TABLE narudzbe         ENABLE ROW LEVEL SECURITY;
ALTER TABLE narudzba_stavke  ENABLE ROW LEVEL SECURITY;
ALTER TABLE korisnici        ENABLE ROW LEVEL SECURITY;

-- Javno čitanje kataloga
CREATE POLICY "javno citanje grupe"   ON grupe            FOR SELECT USING (true);
CREATE POLICY "javno citanje artikli" ON artikli          FOR SELECT USING (aktivan = true);
CREATE POLICY "javno citanje stanje"  ON stanje_skladista FOR SELECT USING (true);

-- Partner vidi samo vlastite podatke
CREATE POLICY "vlastiti partner" ON partneri
  FOR SELECT USING (
    id IN (SELECT partner_id FROM korisnici WHERE id = auth.uid())
  );

-- Korisnik vidi samo svoje narudžbe
CREATE POLICY "vlastite narudzbe" ON narudzbe
  FOR SELECT USING (auth.uid() = korisnik_id);

CREATE POLICY "vlastite stavke" ON narudzba_stavke
  FOR SELECT USING (
    narudzba_id IN (SELECT id FROM narudzbe WHERE korisnik_id = auth.uid())
  );

-- Korisnik vidi vlastiti profil
CREATE POLICY "vlastiti profil" ON korisnici
  FOR ALL USING (auth.uid() = id);

-- ─── Registracija zahtjevi (B2B self-registration) ────────────────────────────
CREATE TABLE IF NOT EXISTS registracija_zahtjevi (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  ime           TEXT NOT NULL,
  prezime       TEXT NOT NULL,
  naziv_firme   TEXT NOT NULL,
  pdv_broj      TEXT,
  telefon       TEXT,
  odobren       BOOLEAN,                     -- null=na čekanju, true=odobren, false=odbijen
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE registracija_zahtjevi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vlastiti zahtjev" ON registracija_zahtjevi
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Dodaj odobren kolonu u korisnici tabelu
ALTER TABLE korisnici ADD COLUMN IF NOT EXISTS odobren BOOLEAN DEFAULT false;

-- Indeks za pending zahtjeve
CREATE INDEX IF NOT EXISTS idx_reg_zahtjevi_pending ON registracija_zahtjevi(odobren) WHERE odobren IS NULL;

-- Admin policy — service role može sve (sync job i admin operacije)
-- Ovo se automatski primjenjuje za service_role key

-- ============================================================
-- SETUP NAKON PRVOG DEPLOYA
-- ============================================================

-- KORAK 1: Registruj se normalno na webshopu (register stranica)
-- KORAK 2: Potvrdi email u Supabase Auth (ako je email potvrda uključena)
-- KORAK 3: Pokreni ovaj SQL u Supabase SQL Editoru da postaviš prvog admina
--          (zamijeni EMAIL_ADMINA sa tvojim emailom)

/*
INSERT INTO korisnici (id, ime, prezime, role, odobren)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'EMAIL_ADMINA' LIMIT 1),
  'Admin',
  '',
  'admin',
  true
)
ON CONFLICT (id) DO UPDATE SET role = 'admin', odobren = true;
*/

-- ============================================================
-- CLOUDINARY SETUP ZA SLIKE ARTIKALA
-- ============================================================
-- 1. Idi na https://cloudinary.com i napravi besplatan račun
-- 2. U dashboardu idi na Settings → Upload → Upload presets
-- 3. Klikni "Add upload preset"
-- 4. Preset name: nibis_webshop
-- 5. Signing Mode: Unsigned
-- 6. Folder: artikli
-- 7. Sačuvaj
-- 8. Kopiraj "Cloud name" iz dashboard-a
-- 9. Dodaj u Vercel env: NEXT_PUBLIC_CLOUDINARY_CLOUD=tvoj_cloud_name
-- ============================================================

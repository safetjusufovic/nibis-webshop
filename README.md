# NIBIS WebShop

Profesionalni B2B webshop integriran sa NIBIS ERP sistemom (NextVision).
Sync svakih 5 minuta. Login, rabat po partneru, email notifikacije.

---

## Korak 1 — Supabase (5 min)

1. https://supabase.com -> Sign up -> New project -> EU West region
2. SQL Editor -> New query -> kopiraj SVE iz supabase-schema.sql -> Run
3. Settings -> API -> kopiraj:
   - Project URL -> NEXT_PUBLIC_SUPABASE_URL
   - anon public -> NEXT_PUBLIC_SUPABASE_ANON_KEY
   - service_role secret -> SUPABASE_SERVICE_ROLE_KEY

---

## Korak 2 — GitHub + Vercel (5 min)

1. Napravi GitHub repozitorij (private)
2. Raspakiraj zip, otvori cmd u folderu:

   git init
   git add .
   git commit -m "init"
   git remote add origin https://github.com/TI/nibis-webshop.git
   git push -u origin main

3. https://vercel.com -> New Project -> import repo
4. PRIJE Deploy -> dodaj Environment Variables (Korak 3)
5. Deploy

---

## Korak 3 — Environment Variables na Vercel

Settings -> Environment Variables:

  NIBIS_API_URL              = https://api.nextvision.ba/integration/robno-materijalno
  NIBIS_API_KEY              = (Secret) tvoj API key
  NIBIS_COMPANY_YEAR         = 2026
  NEXT_PUBLIC_SHOP_NAME      = Naziv tvog webshopa
  NEXT_PUBLIC_ORG_JED_ID     = 1
  NEXT_PUBLIC_ORG_JED_NAZIV  = Sarajevo Centar
  NEXT_PUBLIC_TIP_CIJENE     = mpcijena
  NEXT_PUBLIC_SUPABASE_URL   = https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
  SUPABASE_SERVICE_ROLE_KEY  = (Secret) eyJ...
  CRON_SECRET                = (Secret) izmisli string
  RESEND_API_KEY             = (Secret) re_xxx  [opcionalno]
  EMAIL_FROM                 = narudzbe@tvoja-domena.ba  [opcionalno]
  EMAIL_ADMIN                = admin@tvoja-domena.ba  [opcionalno]
  NEXT_PUBLIC_CLOUDINARY_CLOUD = tvoj_cloud_name  [opcionalno]

---

## Korak 4 — Prvi sync

Nakon deploya otvori u browseru:
https://tvoj-webshop.vercel.app/api/sync?secret=TVOJ_CRON_SECRET

Baza se popuni, sync se dalje vrti automatski svakih 5 minuta.

---

## Korak 5 — Postavi prvog admina

1. Registruj se na webshopu (Register stranica)
2. U Supabase SQL Editor pokreni:

   INSERT INTO korisnici (id, ime, prezime, role, odobren)
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'TVOJ_EMAIL' LIMIT 1),
     'Admin', '', 'admin', true
   )
   ON CONFLICT (id) DO UPDATE SET role = 'admin', odobren = true;

3. Prijavi se -> vidiš Admin panel

---

## Korak 6 — Cloudinary za slike (opcionalno)

1. https://cloudinary.com -> besplatan račun
2. Settings -> Upload -> Upload presets -> Add upload preset
3. Preset name: nibis_webshop | Signing Mode: Unsigned | Folder: artikli
4. Kopiraj Cloud name -> dodaj u Vercel: NEXT_PUBLIC_CLOUDINARY_CLOUD

---

## Stranice

  /               Katalog artikala (zaštićeno, samo ulogovani)
  /login          Prijava
  /register       B2B registracija (čeka admin odobrenje)
  /proizvod/[id]  Detalj artikla
  /moje-narudzbe  Historija narudžbi korisnika
  /admin          Admin dashboard
  /admin/korisnici  Odobravanje korisnika + dodjela NIBIS partnera
  /admin/narudzbe   Sve narudžbe sa stavkama
  /admin/slike      Upload slika po artiklu (Cloudinary)
  /admin/sync       Ručni sync + historija

---

## Kako radi rabat

1. Partner u NIBIS-u ima polje "rabat" (npr. 10%)
2. Sync povuče rabat u tabelu partneri
3. Admin veže korisnika za partnera pri odobravanju
4. Kad korisnik otvori korpu, cijena je automatski umanjena
5. Rabat se šalje i na NIBIS u polju rabat1Procenat

---

## Lokalni razvoj

  npm install
  copy .env.local.example .env.local
  (uredi .env.local)
  npm run dev -> http://localhost:3000

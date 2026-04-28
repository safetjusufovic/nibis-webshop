// Email notifikacije putem Resend (https://resend.com — besplatno do 3000 emaila/mj)
// Instalacija: npm install resend

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM || 'narudzbe@tvoja-domena.ba'
const ADMIN_EMAIL = process.env.EMAIL_ADMIN || ''

interface SendOptions {
  to: string
  subject: string
  html: string
}

async function sendEmail({ to, subject, html }: SendOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY nije postavljen — email nije poslan')
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[EMAIL] Resend greška:', err)
      return false
    }
    return true
  } catch (e) {
    console.error('[EMAIL] Greška:', e)
    return false
  }
}

// ─── Potvrda narudžbe kupcu ───────────────────────────────────────────────────
export async function sendOrderConfirmation(opts: {
  toEmail: string
  imeKupca: string
  oznakaDokumenta: string
  ukupno: number
  stavke: { naziv: string; kolicina: number; jedinicnaCijena: number }[]
  nacinPlacanja: string
  napomena?: string | null
}) {
  const stavkeHtml = opts.stavke.map(s =>
    `<tr style="border-bottom:1px solid #f3f4f6">
      <td style="padding:8px 0;color:#374151">${s.naziv}</td>
      <td style="padding:8px 0;text-align:right;color:#6b7280">${s.kolicina}</td>
      <td style="padding:8px 0;text-align:right;color:#111827;font-weight:500">${(s.kolicina * s.jedinicnaCijena).toFixed(2)} KM</td>
    </tr>`
  ).join('')

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111827">
      <div style="background:#1D9E75;padding:24px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px;font-weight:500">Narudžba potvrđena</h1>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px">
        <p style="color:#6b7280">Poštovani/a <strong style="color:#111827">${opts.imeKupca}</strong>,</p>
        <p style="color:#6b7280">Vaša narudžba je uspješno poslana u naš ERP sistem.</p>

        <div style="background:#f9fafb;border-radius:8px;padding:12px;margin:16px 0">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em">Oznaka narudžbe</p>
          <p style="margin:4px 0 0;font-family:monospace;font-size:16px;font-weight:600;color:#1D9E75">${opts.oznakaDokumenta}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="border-bottom:1px solid #e5e7eb">
              <th style="text-align:left;padding:6px 0;font-size:12px;color:#9ca3af;font-weight:500">Naziv</th>
              <th style="text-align:right;padding:6px 0;font-size:12px;color:#9ca3af;font-weight:500">Kol.</th>
              <th style="text-align:right;padding:6px 0;font-size:12px;color:#9ca3af;font-weight:500">Iznos</th>
            </tr>
          </thead>
          <tbody>${stavkeHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:12px 0 0;font-weight:600;color:#111827">Ukupno</td>
              <td style="padding:12px 0 0;text-align:right;font-weight:600;color:#111827">${opts.ukupno.toFixed(2)} KM</td>
            </tr>
          </tfoot>
        </table>

        <div style="font-size:13px;color:#6b7280;border-top:1px solid #f3f4f6;padding-top:12px">
          <p style="margin:4px 0">Način plaćanja: <strong>${opts.nacinPlacanja}</strong></p>
          ${opts.napomena ? `<p style="margin:4px 0">Napomena: ${opts.napomena}</p>` : ''}
        </div>
      </div>
    </div>`

  return sendEmail({
    to: opts.toEmail,
    subject: `Narudžba ${opts.oznakaDokumenta} — potvrda`,
    html,
  })
}

// ─── Obavijest adminu o novoj narudžbi ────────────────────────────────────────
export async function sendAdminOrderNotification(opts: {
  oznakaDokumenta: string
  partnerNaziv: string
  korisnikIme: string
  ukupno: number
  stavkeCount: number
}) {
  if (!ADMIN_EMAIL) return false

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Nova narudžba: ${opts.oznakaDokumenta}`,
    html: `
      <div style="font-family:sans-serif;max-width:400px">
        <h2 style="color:#111827">Nova narudžba primljena</h2>
        <table style="width:100%;font-size:14px;color:#374151">
          <tr><td style="padding:4px 0;color:#6b7280">Oznaka</td><td style="font-family:monospace;font-weight:600;color:#1D9E75">${opts.oznakaDokumenta}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280">Partner</td><td>${opts.partnerNaziv}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280">Korisnik</td><td>${opts.korisnikIme}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280">Stavki</td><td>${opts.stavkeCount}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280">Ukupno</td><td style="font-weight:600">${opts.ukupno.toFixed(2)} KM</td></tr>
        </table>
      </div>`,
  })
}

// ─── Obavijest korisniku da je račun odobren ─────────────────────────────────
export async function sendAccountApproved(opts: {
  toEmail: string
  imeKupca: string
  shopName: string
}) {
  return sendEmail({
    to: opts.toEmail,
    subject: `Vaš račun je odobren — ${opts.shopName}`,
    html: `
      <div style="font-family:sans-serif;max-width:400px">
        <div style="background:#1D9E75;padding:20px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:18px">Račun odobren ✓</h1>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 12px 12px">
          <p>Poštovani/a <strong>${opts.imeKupca}</strong>,</p>
          <p style="color:#6b7280">Vaš B2B račun na <strong>${opts.shopName}</strong> je odobren. Možete se prijaviti i početi naručivati.</p>
        </div>
      </div>`,
  })
}

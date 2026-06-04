const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev'
const ADMIN_EMAIL = process.env.EMAIL_ADMIN || ''

async function sendEmail({ to, subject, html, from }: { to: string; subject: string; html: string; from?: string }): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY nije postavljen')
    return false
  }
  if (!to) { console.warn('[EMAIL] Nema primaoca'); return false }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: from || FROM_EMAIL, to, subject, html }),
    })
    if (!res.ok) console.error('[EMAIL] Resend odbio:', res.status, await res.text().catch(() => ''))
    return res.ok
  } catch (e) {
    console.error('[EMAIL]', e)
    return false
  }
}

export async function sendOrderConfirmation(opts: {
  toEmail: string; imeKupca: string; oznakaDokumenta: string
  ukupno: number; stavke: { naziv: string; kolicina: number; jedinicnaCijena: number }[]
  nacinPlacanja: string; napomena?: string | null
}) {
  const stavkeHtml = opts.stavke.map(s =>
    `<tr><td style="padding:8px 0;color:#374151">${s.naziv}</td>
     <td style="padding:8px 0;text-align:right;color:#6b7280">${s.kolicina}</td>
     <td style="padding:8px 0;text-align:right;font-weight:500">${(s.kolicina * s.jedinicnaCijena).toFixed(2)} KM</td></tr>`
  ).join('')

  return sendEmail({
    to: opts.toEmail,
    subject: `Narudžba ${opts.oznakaDokumenta} — potvrda`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <div style="background:#1D9E75;padding:24px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">Narudžba potvrđena ✓</h1>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px">
        <p>Poštovani/a <strong>${opts.imeKupca}</strong>,</p>
        <div style="background:#f9fafb;border-radius:8px;padding:12px;margin:16px 0">
          <p style="margin:0;font-size:12px;color:#9ca3af">Oznaka narudžbe</p>
          <p style="margin:4px 0 0;font-family:monospace;font-size:16px;font-weight:600;color:#1D9E75">${opts.oznakaDokumenta}</p>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="border-bottom:1px solid #e5e7eb">
            <th style="text-align:left;padding:6px 0;font-size:12px;color:#9ca3af">Naziv</th>
            <th style="text-align:right;padding:6px 0;font-size:12px;color:#9ca3af">Kol.</th>
            <th style="text-align:right;padding:6px 0;font-size:12px;color:#9ca3af">Iznos</th>
          </tr></thead>
          <tbody>${stavkeHtml}</tbody>
          <tfoot><tr>
            <td colspan="2" style="padding:12px 0 0;font-weight:600">Ukupno</td>
            <td style="padding:12px 0 0;text-align:right;font-weight:600">${opts.ukupno.toFixed(2)} KM</td>
          </tr></tfoot>
        </table>
        <p style="font-size:13px;color:#6b7280;margin-top:16px">Način plaćanja: <strong>${opts.nacinPlacanja}</strong></p>
        ${opts.napomena ? `<p style="font-size:13px;color:#6b7280">Napomena: ${opts.napomena}</p>` : ''}
      </div>
    </div>`
  })
}

export async function sendAdminOrderNotification(opts: {
  oznakaDokumenta: string; partnerNaziv: string; korisnikIme: string; ukupno: number; stavkeCount: number; adminEmail?: string
}) {
  const primalac = opts.adminEmail || ADMIN_EMAIL
  if (!primalac) return false
  return sendEmail({
    to: primalac,
    subject: `Nova narudžba: ${opts.oznakaDokumenta}`,
    html: `<div style="font-family:sans-serif;max-width:400px">
      <h2>Nova narudžba primljena</h2>
      <p><strong>Oznaka:</strong> ${opts.oznakaDokumenta}</p>
      <p><strong>Partner:</strong> ${opts.partnerNaziv}</p>
      <p><strong>Korisnik:</strong> ${opts.korisnikIme}</p>
      <p><strong>Stavki:</strong> ${opts.stavkeCount}</p>
      <p><strong>Ukupno:</strong> ${opts.ukupno.toFixed(2)} KM</p>
    </div>`
  })
}

export async function sendAccountApproved(opts: { toEmail: string; imeKupca: string; shopName: string }) {
  return sendEmail({
    to: opts.toEmail,
    subject: `Vaš račun je odobren — ${opts.shopName}`,
    html: `<div style="font-family:sans-serif;max-width:400px">
      <div style="background:#1D9E75;padding:20px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:18px">Račun odobren ✓</h1>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 12px 12px">
        <p>Poštovani/a <strong>${opts.imeKupca}</strong>,</p>
        <p style="color:#6b7280">Vaš račun na <strong>${opts.shopName}</strong> je odobren.</p>
      </div>
    </div>`
  })
}

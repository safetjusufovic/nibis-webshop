import nodemailer from 'nodemailer'

// Globalni SMTP (nextvision.ba) — fallback za shopove bez svojih postavki
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465')
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM || SMTP_USER || 'onboarding@resend.dev'
const ADMIN_EMAIL = process.env.EMAIL_ADMIN || ''

// Per-shop SMTP postavke
export interface ShopSmtp {
  host?: string; port?: number; user?: string; pass?: string; from?: string
}

let globalTx: nodemailer.Transporter | null = null
function getGlobalTransporter() {
  if (!globalTx && SMTP_USER && SMTP_PASS) {
    globalTx = nodemailer.createTransport({
      host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  }
  return globalTx
}

async function sendEmail({ to, subject, html, from, smtp }: { to: string; subject: string; html: string; from?: string; smtp?: ShopSmtp }): Promise<boolean> {
  if (!to) { console.warn('[EMAIL] Nema primaoca'); return false }

  // 1. Shop-specifični SMTP (svaki shop svoje postavke)
  if (smtp?.user && smtp?.pass) {
    try {
      const shopTx = nodemailer.createTransport({
        host: smtp.host || 'smtp.gmail.com',
        port: smtp.port || 465,
        secure: (smtp.port || 465) === 465,
        auth: { user: smtp.user, pass: smtp.pass },
      })
      await shopTx.sendMail({ from: smtp.from || smtp.user, to, subject, html })
      return true
    } catch (e) {
      console.error('[EMAIL] Shop SMTP greška:', e)
    }
  }

  // 2. Globalni SMTP (nextvision.ba fallback)
  const tx = getGlobalTransporter()
  if (tx) {
    try {
      await tx.sendMail({ from: from || FROM_EMAIL, to, subject, html })
      return true
    } catch (e) {
      console.error('[EMAIL] Globalni SMTP greška:', e)
    }
  }

  // 3. Resend fallback
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: from || FROM_EMAIL, to, subject, html }),
      })
      return res.ok
    } catch (e) {
      console.error('[EMAIL]', e); return false
    }
  }

  console.warn('[EMAIL] Nijedan email provider nije konfigurisan')
  return false
}

export async function sendOrderConfirmation(opts: {
  toEmail: string; imeKupca: string; oznakaDokumenta: string
  ukupno: number; stavke: { naziv: string; kolicina: number; jedinicnaCijena: number }[]
  nacinPlacanja: string; napomena?: string | null; smtp?: ShopSmtp
}) {
  const stavkeHtml = opts.stavke.map(s =>
    `<tr><td style="padding:8px 0;color:#374151">${s.naziv}</td>
     <td style="padding:8px 0;text-align:right;color:#6b7280">${s.kolicina}</td>
     <td style="padding:8px 0;text-align:right;font-weight:500">${(s.kolicina * s.jedinicnaCijena).toFixed(2)} KM</td></tr>`
  ).join('')

  return sendEmail({
    smtp: opts.smtp,
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
  oznakaDokumenta: string; partnerNaziv: string; korisnikIme: string; ukupno: number; stavkeCount: number; adminEmail?: string; smtp?: ShopSmtp
}) {
  const primalac = opts.adminEmail || ADMIN_EMAIL
  if (!primalac) return false
  return sendEmail({
    smtp: opts.smtp,
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

export async function sendAccountApproved(opts: { toEmail: string; imeKupca: string; shopName: string; smtp?: ShopSmtp }) {
  return sendEmail({
    smtp: opts.smtp,
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

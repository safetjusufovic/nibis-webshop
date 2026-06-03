import crypto from 'crypto'

// Monri WebPay Form (redirect) integracija
// Test: https://ipgtest.monri.com  | Prod: https://ipg.monri.com

export interface MonriConfig {
  merchantKey: string       // shared secret za digest
  authenticityToken: string // iz Monri merchant računa
  test: boolean
}

export interface MonriOrderData {
  orderNumber: string   // jedinstveni broj narudžbe
  amount: number        // u KM (npr. 162.90)
  currency?: string     // default BAM
  orderInfo: string     // opis
  fullName: string
  email: string
  city?: string
  address?: string
  zip?: string
  phone?: string
  successUrl: string
  cancelUrl: string
  callbackUrl: string
}

export function monriBaseUrl(test: boolean): string {
  return test ? 'https://ipgtest.monri.com' : 'https://ipg.monri.com'
}

// digest = SHA512(merchant_key + order_number + amount + currency)
// amount je u centima (cijeli broj kao string)
export function calculateDigest(merchantKey: string, orderNumber: string, amountCents: number, currency: string): string {
  const plain = merchantKey + orderNumber + String(amountCents) + currency
  return crypto.createHash('sha512').update(plain).digest('hex')
}

// Verifikuj callback digest = SHA512(merchant_key + body)
export function verifyCallbackDigest(merchantKey: string, body: string, receivedDigest: string): boolean {
  const expected = crypto.createHash('sha512').update(merchantKey + body).digest('hex')
  return expected === receivedDigest
}

// Pripremi podatke za WebPay Form POST
export function buildFormData(config: MonriConfig, order: MonriOrderData) {
  const currency = order.currency || 'BAM'
  const amountCents = Math.round(order.amount * 100)
  const digest = calculateDigest(config.merchantKey, order.orderNumber, amountCents, currency)

  return {
    actionUrl: monriBaseUrl(config.test) + '/v2/form',
    fields: {
      authenticity_token: config.authenticityToken,
      amount: String(amountCents),
      order_number: order.orderNumber,
      currency,
      transaction_type: 'purchase',
      order_info: order.orderInfo,
      ch_full_name: order.fullName,
      ch_email: order.email,
      ch_address: order.address || '',
      ch_city: order.city || '',
      ch_zip: order.zip || '',
      ch_phone: order.phone || '',
      ch_country: 'BA',
      language: 'hr',
      digest,
      success_url: order.successUrl,
      cancel_url: order.cancelUrl,
      // Monri šalje POST callback na ovaj URL nakon plaćanja
      ...(order.callbackUrl && { redirect_url: order.successUrl }),
    },
  }
}

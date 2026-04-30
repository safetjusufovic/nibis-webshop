import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface)', fontFamily: 'DM Sans, sans-serif', padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '96px', fontWeight: 800, color: 'var(--brand)', lineHeight: 1, marginBottom: '16px' }}>404</div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>
          Stranica nije pronađena
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.6 }}>
          Stranica koju tražite ne postoji ili je premještena.
        </p>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'var(--brand)', color: 'white', textDecoration: 'none',
          padding: '12px 24px', borderRadius: '10px', fontSize: '15px', fontWeight: 500,
        }}>
          ← Nazad na katalog
        </Link>
      </div>
    </div>
  )
}

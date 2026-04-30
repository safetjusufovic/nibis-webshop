'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface)', fontFamily: 'DM Sans, sans-serif', padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>
          Došlo je do greške
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.6 }}>
          {error.message || 'Neočekivana greška. Pokušajte ponovo.'}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '24px' }}>
          <button onClick={reset} style={{
            background: 'var(--brand)', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '10px', fontSize: '14px',
            fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Pokušaj ponovo
          </button>
          <a href="/" style={{
            background: 'white', color: 'var(--text)', border: '1px solid var(--border)',
            padding: '10px 20px', borderRadius: '10px', fontSize: '14px',
            fontWeight: 500, textDecoration: 'none',
          }}>
            Nazad na početnu
          </a>
        </div>
      </div>
    </div>
  )
}

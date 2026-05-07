export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 28 : size === 'md' ? 34 : 44
  const fs = size === 'sm' ? 13 : size === 'md' ? 15 : 20

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="9" fill="var(--brand)"/>
        <path d="M8 30 L14 12 L20 22 L26 15 L32 30 Z" fill="white" fillOpacity="0.15"/>
        <path d="M8 30 L14 16 L20 24 L26 17 L32 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="26" cy="12" r="3" fill="#1D9E75"/>
      </svg>
      <div style={{ lineHeight: 1.15 }}>
        <div style={{ fontSize: fs, fontWeight: 700, color: '#0D1F1A', letterSpacing: '-0.02em' }}>
          {process.env.NEXT_PUBLIC_SHOP_NAME?.split(' ')[0] ?? 'Testni'}
        </div>
        <div style={{ fontSize: fs - 1, fontWeight: 400, color: 'var(--brand)', letterSpacing: '-0.01em' }}>
          {process.env.NEXT_PUBLIC_SHOP_NAME?.split(' ').slice(1).join(' ') ?? 'WebShop'}
        </div>
      </div>
    </div>
  )
}

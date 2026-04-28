import Link from 'next/link'
import { siteConfig } from '@/lib/config'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-semibold text-gray-200 mb-4">404</p>
        <h1 className="text-xl font-medium text-gray-900 mb-2">Stranica nije pronađena</h1>
        <p className="text-sm text-gray-500 mb-6">Stranica koju tražite ne postoji ili je premještena.</p>
        <Link href="/" className="btn-primary">← Nazad na {siteConfig.name}</Link>
      </div>
    </div>
  )
}

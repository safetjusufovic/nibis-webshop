'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { siteConfig } from '@/lib/config'

export default function LoginPage() {
  const pathname = usePathname()
  const shopSlug = (() => { const s = pathname.split('/').filter(Boolean); const i = s.indexOf('login'); return i > 0 ? s[i-1] : '' })()

  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) {
      setError('Pogrešan email ili lozinka.')
      setLoading(false)
    } else {
      // Logiraj prijavu
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('login_log').insert({
            korisnik_id: user.id,
            user_agent: navigator.userAgent,
          })
        }
      } catch (e) { /* ignoriši greške u logovanju */ }
      router.push(shopSlug ? '/' + shopSlug + '/' : '/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">{siteConfig.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Prijavite se na vaš račun</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="ime@firma.ba"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Lozinka</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Prijavljivanje...' : 'Prijava'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Nemate račun?{' '}
            <Link href="/register" className="text-[var(--brand)] hover:underline font-medium">
              Registrujte se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

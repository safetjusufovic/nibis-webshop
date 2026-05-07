'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { siteConfig } from '@/lib/config'

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '', password: '', ime: '', prezime: '',
    naziv_firme: '', pdv_broj: '', telefon: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')

    // 1. Kreiraj Supabase auth usera
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { ime: form.ime, prezime: form.prezime },
      },
    })

    if (authError) {
      setError(authError.message)
      setStatus('error')
      return
    }

    if (data.user) {
      // 2. Kreiraj zahtjev za registraciju (odobren: false — čeka admin)
      const { error: profileError } = await supabase.from('registracija_zahtjevi').insert({
        user_id: data.user.id,
        email: form.email,
        ime: form.ime,
        prezime: form.prezime,
        naziv_firme: form.naziv_firme,
        pdv_broj: form.pdv_broj,
        telefon: form.telefon,
      })

      if (profileError) {
        setError('Greška pri slanju zahtjeva. Kontaktirajte administratora.')
        setStatus('error')
        return
      }
    }

    setStatus('success')
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
            <div className="w-12 h-12 bg-[var(--brand-pale)] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[var(--brand)] text-xl">✓</span>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Zahtjev poslan!</h2>
            <p className="text-sm text-gray-500 mb-6">
              Vaš račun čeka odobrenje administratora. Biti ćete obaviješteni na email kada bude aktiviran.
            </p>
            <Link href="/login" className="btn-primary inline-block">Idi na prijavu</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">{siteConfig.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Kreirajte B2B račun</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Ime</label>
                <input type="text" required value={form.ime} onChange={e => update('ime', e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Prezime</label>
                <input type="text" required value={form.prezime} onChange={e => update('prezime', e.target.value)} className="input" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Naziv firme</label>
              <input type="text" required value={form.naziv_firme} onChange={e => update('naziv_firme', e.target.value)} className="input" placeholder="d.o.o." />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">PDV broj</label>
              <input type="text" value={form.pdv_broj} onChange={e => update('pdv_broj', e.target.value)} className="input" placeholder="BA123456789" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Telefon</label>
              <input type="tel" value={form.telefon} onChange={e => update('telefon', e.target.value)} className="input" placeholder="+387 61 123 456" />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Email</label>
              <input type="email" required value={form.email} onChange={e => update('email', e.target.value)} className="input" placeholder="ime@firma.ba" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Lozinka</label>
              <input type="password" required minLength={8} value={form.password} onChange={e => update('password', e.target.value)} className="input" placeholder="Minimalno 8 znakova" />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
              {status === 'loading' ? 'Slanje...' : 'Pošalji zahtjev'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Već imate račun?{' '}
            <Link href="/login" className="text-[var(--brand)] hover:underline font-medium">Prijavite se</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Nakon registracije, administrator mora odobriti vaš račun.
        </p>
      </div>
    </div>
  )
}

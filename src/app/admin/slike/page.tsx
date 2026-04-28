'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Upload, Package } from 'lucide-react'

export default function AdminSlikePage() {
  const [artikli, setArtikli] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PER = 24

  async function load() {
    let q = supabase
      .from('artikli')
      .select('id, sifra, naziv, slika_url, grupe:grupa_id(naziv)', { count: 'exact' })
      .order('naziv')
      .range((page - 1) * PER, page * PER - 1)
    if (search) q = q.or(`naziv.ilike.%${search}%,sifra.ilike.%${search}%`)
    const { data, count } = await q
    setArtikli(data ?? [])
    setTotal(count ?? 0)
  }

  useEffect(() => { load() }, [page, search])

  async function handleUpload(artikalId: number, file: File) {
    setUploading(artikalId)
    const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD
    if (!CLOUD) { alert('Cloudinary nije konfigurisan. Dodaj NEXT_PUBLIC_CLOUDINARY_CLOUD u env.'); setUploading(null); return }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'nibis_webshop')
    formData.append('public_id', `artikli/${artikalId}`)

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: formData })
      const data = await res.json()
      if (data.secure_url) {
        await supabase.from('artikli').update({ slika_url: data.secure_url }).eq('id', artikalId)
        load()
      }
    } catch (e) {
      alert('Greška pri uploadu')
    }
    setUploading(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Slike artikala</h1>



      <input
        type="text"
        placeholder="Pretraži artikle..."
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1) }}
        className="input max-w-md"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {artikli.map(a => (
          <div key={a.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="h-28 bg-gray-50 flex items-center justify-center relative">
              {a.slika_url ? (
                <Image src={a.slika_url} alt={a.naziv} fill className="object-cover" />
              ) : (
                <Package size={24} className="text-gray-200" />
              )}
            </div>
            <div className="p-2">
              <p className="text-xs font-medium text-gray-700 truncate">{a.naziv}</p>
              <p className="text-xs text-gray-400 font-mono">{a.sifra}</p>
              <label className={`mt-2 flex items-center justify-center gap-1 text-xs py-1 rounded-lg border cursor-pointer transition-colors ${uploading === a.id ? 'border-gray-100 text-gray-300' : 'border-teal-200 text-teal-600 hover:bg-teal-50'}`}>
                <Upload size={11} />
                {uploading === a.id ? 'Upload...' : a.slika_url ? 'Promijeni' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" disabled={uploading === a.id} onChange={e => { if (e.target.files?.[0]) handleUpload(a.id, e.target.files[0]) }} />
              </label>
            </div>
          </div>
        ))}
      </div>

      {Math.ceil(total / PER) > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1} className="btn-secondary disabled:opacity-40">← Preth.</button>
          <span className="text-gray-500">Stranica {page} / {Math.ceil(total / PER)}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page >= Math.ceil(total/PER)} className="btn-secondary disabled:opacity-40">Sljed. →</button>
        </div>
      )}
    </div>
  )
}

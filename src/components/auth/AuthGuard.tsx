'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function AuthGuard({ children, requireAdmin = false }: Props) {
  const { user, profil, loading } = useAuth()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')
      return
    }

    // profil je null dok se učitava ili ako nije pronađen
    // Daj 3 sekunde da se profil učita
    if (profil === null) {
      const t = setTimeout(() => {
        setReady(true) // Prikaži stranicu čak i bez profila
      }, 3000)
      return () => clearTimeout(t)
    }

    if (!profil.odobren) {
      router.replace('/login?status=pending')
      return
    }

    if (requireAdmin && profil.role !== 'admin') {
      router.replace('/')
      return
    }

    setReady(true)
  }, [user, profil, loading, requireAdmin, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-400">Učitavam...</div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-400">Provjera pristupa...</div>
      </div>
    )
  }

  return <>{children}</>
}

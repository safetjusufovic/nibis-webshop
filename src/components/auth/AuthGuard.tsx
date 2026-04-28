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

    // Čekaj da se profil učita
    if (profil === undefined) return

    // Ako profil nije pronađen ili nije odobren — čekaj malo više (async učitavanje)
    if (profil === null) {
      // Daj još 2 sekunde da se profil učita
      const t = setTimeout(() => {
        router.replace('/login')
      }, 2000)
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

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-400">Učitavam...</div>
      </div>
    )
  }

  return <>{children}</>
}

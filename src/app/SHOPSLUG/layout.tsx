'use client'

import { CartProvider } from '@/hooks/useCart'
import { AuthProvider } from '@/hooks/useAuth'
import { FavoritiProvider } from '@/hooks/useFavoriti'
import { ShopProvider } from '@/hooks/useShop'
import ThemeProvider from '@/components/ThemeProvider'
import EditorBridge from '@/components/EditorBridge'
import { useParams } from 'next/navigation'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const shopSlug = params?.shopSlug as string || ''

  return (
    <ShopProvider slug={shopSlug}>
      <ThemeProvider shopSlug={shopSlug}>
        <EditorBridge />
        <AuthProvider>
          <FavoritiProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </FavoritiProvider>
        </AuthProvider>
      </ThemeProvider>
    </ShopProvider>
  )
}

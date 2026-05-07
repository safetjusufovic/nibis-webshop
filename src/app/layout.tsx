import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/hooks/useCart'
import { AuthProvider } from '@/hooks/useAuth'
import ThemeProvider from '@/components/ThemeProvider'
import { FavoritiProvider } from '@/hooks/useFavoriti'
import { siteConfig } from '@/lib/config'
import EditorBridge from '@/components/EditorBridge'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bs">
      <body className={inter.className}>
        <ThemeProvider>
        <EditorBridge />
      <AuthProvider>
        <FavoritiProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </FavoritiProvider>
        </AuthProvider>
      </ThemeProvider>
      </body>
    </html>
  )
}

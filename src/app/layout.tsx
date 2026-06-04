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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nibis-webshop.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  icons: { icon: '/favicon.ico' },
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    locale: 'bs_BA',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
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

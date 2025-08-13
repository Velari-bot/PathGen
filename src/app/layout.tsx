import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PathGen - AI-Powered Fortnite Improvement',
  description: 'Get personalized Fortnite coaching with AI analysis of your gameplay stats. Improve your building, strategy, and overall performance.',
  icons: {
    icon: [
      {
        url: '/Black PathGen logo.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/Black PathGen logo.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    apple: '/Black PathGen logo.png',
    shortcut: '/Black PathGen logo.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'PathGen - AI-Powered Fortnite Improvement',
    description: 'Get personalized Fortnite coaching with AI analysis of your gameplay stats.',
    type: 'website',
    images: ['/Black PathGen logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PathGen - AI-Powered Fortnite Improvement',
    description: 'Get personalized Fortnite coaching with AI analysis of your gameplay stats.',
    images: ['/Black PathGen logo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

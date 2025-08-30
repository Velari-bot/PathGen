import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'

const inter = Inter({ subsets: ['latin'] })

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
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

// Google AdSense script component
function AdSenseScript() {
  return (
    <script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2357025365884471"
      crossOrigin="anonymous"
    />
  );
}

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        {children}
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <AdSenseScript />
      </head>
      <body className="font-sans antialiased">
        <RootLayoutContent>
          {children}
        </RootLayoutContent>
      </body>
    </html>
  )
}

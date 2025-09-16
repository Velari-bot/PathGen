import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import ReferralTracker from '@/components/ReferralTracker'
import SimpleTracker from '@/components/SimpleTracker'
import TwitterPixel from '@/components/TwitterPixel'

const inter = Inter({ subsets: ['latin'] })

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: 'PathGen AI - Your AI Fortnite Coach | Improve Building, Strategy & Win Rate',
  description: 'Get personalized Fortnite coaching with AI analysis. Improve your building, strategy, K/D ratio, and win rate. Upload stats, get instant feedback, and dominate your friends.',
  keywords: 'Fortnite improvement, AI coaching, Fortnite strategy, building practice, win rate, K/D ratio, Fortnite tips, competitive Fortnite, Fortnite analysis',
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
    title: 'PathGen AI - Your AI Fortnite Coach | Improve Building, Strategy & Win Rate',
    description: 'Get personalized Fortnite coaching with AI analysis. Improve your building, strategy, K/D ratio, and win rate.',
    type: 'website',
    images: [
      {
        url: '/pathgen-social-thumbnail.png',
        width: 1200,
        height: 630,
        alt: 'PathGen AI - Your AI Fortnite Coach',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PathGen AI - Your AI Fortnite Coach | Improve Building, Strategy & Win Rate',
    description: 'Get personalized Fortnite coaching with AI analysis. Improve your building, strategy, K/D ratio, and win rate.',
    images: ['/pathgen-social-thumbnail.png'],
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
        <TwitterPixel />
        <ReferralTracker />
        <SimpleTracker />
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

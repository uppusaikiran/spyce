import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@copilotkit/react-ui/styles.css'
import CopilotWrapper from './CopilotWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Spyce - Advanced Competitive Intelligence Platform',
  description: 'Spyce empowers businesses with AI-driven competitive intelligence. Monitor competitors, analyze market trends, and gain strategic insights.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: '/apple-touch-icon.png',
  },
  themeColor: '#3B82F6',
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 antialiased`}>
        <CopilotWrapper>
          <div className="min-h-full">
            {children}
          </div>
        </CopilotWrapper>
      </body>
    </html>
  )
} 
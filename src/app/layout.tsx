import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IntelAI - Competitive Intelligence Research Assistant',
  description: 'AI-powered assistant that crawls competitor websites, extracts key updates, synthesizes insights, and generates strategic briefs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 antialiased`}>
        <div className="min-h-full">
          {children}
        </div>
      </body>
    </html>
  )
} 
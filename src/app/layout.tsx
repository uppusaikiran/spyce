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
      <body className={`${inter.className} h-full bg-gray-50`}>
        <div className="min-h-full">
          {children}
        </div>
      </body>
    </html>
  )
} 
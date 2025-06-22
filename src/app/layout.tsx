'use client';

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@copilotkit/react-ui/styles.css'
import { CopilotKit } from '@copilotkit/react-core'

const inter = Inter({ subsets: ['latin'] })

// Note: In a real app, you'd use the Metadata export from a server component
// For now, we'll handle metadata differently since we need CopilotKit client-side
const metadata = {
  title: 'Spyce - Advanced Competitive Intelligence Platform',
  description: 'Spyce empowers businesses with AI-driven competitive intelligence. Monitor competitors, analyze market trends, and gain strategic insights.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="theme-color" content="#3B82F6" />
      </head>
      <body className={`${inter.className} h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 antialiased`}>
        <CopilotKit 
          runtimeUrl="/api/copilotkit"
          publicApiKey={process.env.NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY}
        >
          <div className="min-h-full">
            {children}
          </div>
        </CopilotKit>
      </body>
    </html>
  )
} 
import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Justice Dashboard',
  description: 'Root Next.js app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}

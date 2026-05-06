import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UrbanVault Chats',
  description: 'La plataforma premium de comunidades para México y LATAM',
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}

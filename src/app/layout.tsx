import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RestaurantBoost – Marketing pre reštaurácie | AI generovanie obsahu',
  description: 'Kompletný marketing pre vašu reštauráciu. Správa sociálnych sietí, AI generovanie príspevkov na Facebook a Instagram, grafika a branding.',
  other: {
    'facebook-domain-verification': '000ntbxy3qgfx6dfyxnzclujxmwtqb',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  )
}

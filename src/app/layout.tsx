import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PROJECTBer – AI Social Media na autopilote',
  description: 'Generujte brandované príspevky, obrázky a texty pre vaše sociálne siete s AI. Správa obsahu, plánovanie a automatické publikovanie.',
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

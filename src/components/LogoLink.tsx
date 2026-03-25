'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function LogoLink() {
  const pathname = usePathname()
  
  return (
    <Link 
      href="/" 
      onClick={(e) => {
        if (pathname === '/') {
          e.preventDefault()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }}
      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
    >
      <span style={{
        fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 22,
        color: 'var(--text-primary)', letterSpacing: '-0.04em',
      }}>
        PROJECTBer
      </span>
    </Link>
  )
}

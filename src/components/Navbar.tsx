import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import LogoLink from './LogoLink'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative'
      }}>
        {/* Logo */}
        <LogoLink />

        {/* Nav links */}
        <div className="nav-center-menu" style={{ 
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <a href="#features" className="nav-pill">Funkcie</a>
          <a href="#how-it-works" className="nav-pill">Ako to funguje</a>
          <a href="#pricing" className="nav-pill">Cenník</a>
        </div>

        {/* Auth buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              <Link href="/portal/dashboard" className="btn-primary" style={{ padding: '9px 20px', fontSize: 13 }}>
                Môj portál
              </Link>
              <form action={logout}>
                <button type="submit" className="btn-ghost" style={{ fontSize: 13 }}>Odhlásiť</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost" style={{ fontSize: 13 }}>Prihlásiť sa</Link>
              <Link href="/register" className="btn-primary" style={{ padding: '9px 20px', fontSize: 13 }}>
                Vyskúšať zadarmo
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

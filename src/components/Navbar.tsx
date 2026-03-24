import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(10, 10, 15, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--dark-border)',
      padding: '0 24px',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800,
          }}>🍽</div>
          <span style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20,
            color: 'var(--text-primary)',
          }}>
            Restaurant<span style={{ color: 'var(--brand-primary)' }}>Boost</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/#sluzby" className="btn-ghost">Služby</Link>
          <Link href="/#ako-to-funguje" className="btn-ghost">Ako to funguje</Link>
          <Link href="/#kontakt" className="btn-ghost">Kontakt</Link>
        </div>

        {/* Auth buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              <Link href="/portal/dashboard" className="btn-secondary" style={{ padding: '10px 20px' }}>
                Môj portál
              </Link>
              <form action={logout}>
                <button type="submit" className="btn-ghost">Odhlásiť</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Prihlásiť sa</Link>
              <Link href="/register" className="btn-primary" style={{ padding: '10px 20px' }}>
                Začať zadarmo
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

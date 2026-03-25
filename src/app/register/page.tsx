'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'
import { UserPlus, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left panel — dark branded */}
      <div style={{
        width: '44%', minHeight: '100vh', background: '#1B1D2A',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 48px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle glow */}
        <div style={{
          position: 'absolute', width: 400, height: 400, top: -100, right: -100,
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, padding: '0 24px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 34,
              color: '#FFF', letterSpacing: '-0.04em',
            }}>
              PROJECTBer
            </span>
          </Link>

          <h2 style={{
            fontSize: 48, fontWeight: 800, color: '#FFFFFF', marginTop: 80, lineHeight: 1.15,
            letterSpacing: '-0.03em',
          }}>
            Začnite<br />generovať obsah.
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: 18, marginTop: 16, lineHeight: 1.6,
            maxWidth: 420,
          }}>
            Vytvorte si bezplatný účet a spravujte sociálne siete na autopilote s AI.
          </p>

          <div style={{ marginTop: 64, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              'Registrácia zadarmo, bez kreditnej karty',
              'Neobmedzený počet projektov',
              'Publikovanie na FB & IG',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--brand)', flexShrink: 0,
                }} />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-body)', padding: 24,
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>
              Vytvoriť účet
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Projekty pridáte po prihlásení.
            </p>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <button onClick={handleGoogleLogin} disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer',
              transition: 'all 200ms', opacity: loading ? 0.6 : 1, marginBottom: 20
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Pokračovať s Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>alebo</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" className="input-field" placeholder="vas@email.sk" required autoComplete="email" />
              </div>
              <div>
                <label className="input-label" htmlFor="password">Heslo</label>
                <input id="password" name="password" type="password" className="input-field" placeholder="Minimálne 8 znakov" required minLength={8} autoComplete="new-password" />
              </div>
              {error && (
                <div style={{ padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius)', color: 'var(--error)', fontSize: 13 }}>
                  {error}
                </div>
              )}
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '12px', opacity: loading ? 0.6 : 1, fontSize: 14, borderRadius: 10 }}>
                <UserPlus size={15} /> {loading ? 'Registrujem...' : 'Vytvoriť účet'}
              </button>
            </form>
            <div className="divider" />
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              Už máte účet?{' '}
              <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
                Prihláste sa <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

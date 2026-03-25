'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { LogIn, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
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
          position: 'absolute', width: 400, height: 400, bottom: -100, left: -100,
          background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 28,
              color: '#FFF', letterSpacing: '-0.04em',
            }}>
              PROJECTBer
            </span>
          </Link>

          <h2 style={{
            fontSize: 28, fontWeight: 800, color: '#FFFFFF', marginTop: 40, lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}>
            Vitajte späť.
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 12, lineHeight: 1.7,
            maxWidth: 340,
          }}>
            Prihláste sa do vášho účtu a pokračujte v generovaní obsahu pre vaše sociálne siete.
          </p>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              'AI generovanie príspevkov',
              'Správa viacerých projektov',
              'Automatické publikovanie',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--brand)', flexShrink: 0,
                }} />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{item}</span>
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
              Prihlásenie
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Zadajte vaše prihlasovacie údaje.
            </p>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" className="input-field" placeholder="vas@email.sk" required autoComplete="email" />
              </div>
              <div>
                <label className="input-label" htmlFor="password">Heslo</label>
                <input id="password" name="password" type="password" className="input-field" placeholder="Vaše heslo" required autoComplete="current-password" />
              </div>
              {error && (
                <div style={{ padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius)', color: 'var(--error)', fontSize: 13 }}>
                  {error}
                </div>
              )}
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '12px', opacity: loading ? 0.6 : 1, fontSize: 14, borderRadius: 10 }}>
                <LogIn size={15} /> {loading ? 'Prihlasujem...' : 'Prihlásiť sa'}
              </button>
            </form>
            <div className="divider" />
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              Nemáte účet?{' '}
              <Link href="/register" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
                Zaregistrujte sa <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

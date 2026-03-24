'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { Sparkles, LogIn } from 'lucide-react'

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
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-body)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.25)',
            }}>
              <Sparkles size={18} color="#FFF" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              RestaurantBoost
            </span>
          </Link>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14 }}>
            Prihláste sa do vášho účtu.
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
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
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '11px', opacity: loading ? 0.6 : 1 }}>
              <LogIn size={14} /> {loading ? 'Prihlasujem...' : 'Prihlásiť sa'}
            </button>
          </form>
          <div className="divider" />
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
            Nemáte účet?{' '}
            <Link href="/register" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Zaregistrujte sa</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

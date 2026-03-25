'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, UserPlus, Settings, Trash2, X, Loader2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProjectRowActions({ projectId, isOwner }: { projectId: string, isOwner: boolean }) {
  const [open, setOpen] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div 
      ref={menuRef} 
      style={{ position: 'relative' }} 
      onClick={(e) => {
        // Zabraniť aktivácii Link komponentu pri kliknuti
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <button 
        type="button" 
        onClick={() => setOpen(!open)}
        style={{ 
          background: open ? 'var(--bg-hover)' : 'transparent', 
          border: 'none', 
          cursor: 'pointer', 
          padding: 6, 
          borderRadius: 'var(--radius)', 
          color: open ? 'var(--text-primary)' : 'var(--text-faint)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 150ms'
        }}
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 100,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
          minWidth: 160, padding: 4, display: 'flex', flexDirection: 'column'
        }}>
          <div 
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', 
              fontSize: 13, color: 'var(--text-primary)', textDecoration: 'none',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer' 
            }}
            className="dropdown-item"
            onClick={() => {
              setOpen(false)
              setShowInviteModal(true)
            }}
          >
            <UserPlus size={14} color="var(--brand)" /> 
            Pridať prístup
          </div>
          <div 
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', 
              fontSize: 13, color: 'var(--text-primary)', textDecoration: 'none',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer' 
            }}
            className="dropdown-item"
            onClick={() => {
              setOpen(false)
              router.push(`/portal/projects/${projectId}/settings`)
            }}
          >
            <Settings size={14} color="var(--text-muted)" /> 
            Nastavenia
          </div>
          
          {isOwner && (
            <>
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', 
                  fontSize: 13, color: 'var(--error)', textDecoration: 'none',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer' 
                }}
                className="dropdown-item"
                onClick={() => {
                  setOpen(false)
                  router.push(`/portal/projects/${projectId}/settings`)
                }}
              >
                <Trash2 size={14} /> 
                Odstrániť
              </div>
            </>
          )}
        </div>
      )}

      {showInviteModal && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
          onClick={(e) => { e.stopPropagation(); setShowInviteModal(false) }}
        >
          <div className="card" style={{ width: 440, maxWidth: '90%', padding: '24px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--brand-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={16} color="var(--brand)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Pridať prístup</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Používateľ musí mať vytvorený účet</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-faint)' }}>
                <X size={20} />
              </button>
            </div>

            <InviteForm projectId={projectId} onClose={() => setShowInviteModal(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

function InviteForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleInvite() {
    if (!email.trim() || !email.includes('@')) return
    setInviting(true)
    setError(null)
    setSuccess(false)
    const res = await fetch('/api/project-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, email }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Nastala chyba pri pridávaní člena')
    } else {
      setSuccess(true)
      setEmail('')
      setTimeout(() => onClose(), 2000)
    }
    setInviting(false)
  }

  return (
    <div style={{ marginTop: 24 }}>
      <label className="input-label" style={{ marginBottom: 8 }}>E-mail používateľa</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleInvite()}
          className="input-field"
          placeholder="email@example.com"
          style={{ flex: 1 }}
        />
        <button type="button" className="btn-primary" onClick={handleInvite} disabled={inviting || !email.trim()} style={{ flexShrink: 0, opacity: (inviting || !email.trim()) ? 0.6 : 1 }}>
          {inviting ? <Loader2 size={13} style={{ animation: 'spin-slow 1s linear infinite' }} /> : 'Poslať prístup'}
        </button>
      </div>

      {error && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--error)', padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
      {success && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--success)', padding: '10px 14px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} /> Prístup udelený</div>}
    </div>
  )
}

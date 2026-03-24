'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { updateProject, deleteProject } from '@/app/actions/projects'
import {
  ExternalLink, CheckCircle2, AlertTriangle, Trash2, Loader2,
  Palette, Camera, Layers, Sun, Users, UserPlus, UserMinus, Crown,
} from 'lucide-react'

type Project = {
  id: string; name: string; description: string | null
  brand_style_prompt: string | null
  brand_colors: { primary: string; secondary: string } | null
  image_style: { template: string; mood: string; background: string; photoStyle: string } | null
  facebook_page_id: string | null; instagram_account_id: string | null; meta_access_token: string | null
  project_type: string | null
}

const PROJECT_TYPES = [
  { id: 'restaurant', label: 'Reštaurácia / Kaváreň', emoji: '🍽️', desc: 'Jedlo, nápoje, atmosféra' },
  { id: 'hotel', label: 'Hotel / Ubytovanie', emoji: '🏨', desc: 'Recepcia, izby, vybavenosť' },
  { id: 'influencer', label: 'Osoba / Influencer', emoji: '👤', desc: 'Životný štýl, personálny brand' },
  { id: 'shop', label: 'Obchod / E-shop', emoji: '🛍️', desc: 'Produkty, kolékcie, výpredaj' },
  { id: 'company', label: 'Firma / Agentúra', emoji: '🏢', desc: 'Tím, služby, B2B' },
]

const TEMPLATES = [
  { id: 'modern-minimal', label: 'Minimalistický', desc: 'Čistý, moderný, veľa priestoru' },
  { id: 'bold-vibrant', label: 'Bold & Vibrant', desc: 'Energické farby, vysoký kontrast' },
  { id: 'elegant-luxury', label: 'Elegantný', desc: 'Tmavé tóny, luxusný feel' },
  { id: 'playful-casual', label: 'Hravý', desc: 'Priateľský, organické tvary' },
  { id: 'rustic-natural', label: 'Rustikálny', desc: 'Prírodné tóny, drevo, zemité' },
]

const MOODS = [
  { id: 'warm', label: 'Teplý', color: '#F59E0B' },
  { id: 'cool', label: 'Studený', color: '#3B82F6' },
  { id: 'dark', label: 'Tmavý', color: '#1F2937' },
  { id: 'bright', label: 'Jasný', color: '#10B981' },
]

const BACKGROUNDS = [
  { id: 'gradient', label: 'Gradient' },
  { id: 'solid', label: 'Jednofarebné' },
  { id: 'contextual', label: 'Kontextové' },
  { id: 'blurred', label: 'Rozmazané' },
]

const PHOTO_STYLES = [
  { id: 'studio-lighting', label: 'Štúdiové svetlo' },
  { id: 'natural-light', label: 'Prirodzené svetlo' },
  { id: 'dramatic', label: 'Dramatické' },
  { id: 'flat-lay', label: 'Flat lay' },
]

export default function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  // Image style state
  const [imageTemplate, setImageTemplate] = useState('modern-minimal')
  const [imageMood, setImageMood] = useState('warm')
  const [imageBackground, setImageBackground] = useState('gradient')
  const [imagePhotoStyle, setImagePhotoStyle] = useState('studio-lighting')
  const [projectType, setProjectType] = useState('restaurant')

  // Team state
  type Member = { id: string; user_id: string; invited_email: string; created_at: string }
  const [members, setMembers] = useState<Member[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/project?id=${id}`).then(r => r.json()).then(data => {
      const p = data.project
      setProject(p)
      if (p?.image_style) {
        setImageTemplate(p.image_style.template || 'modern-minimal')
        setImageMood(p.image_style.mood || 'warm')
        setImageBackground(p.image_style.background || 'gradient')
        setImagePhotoStyle(p.image_style.photoStyle || 'studio-lighting')
      }
      if (p?.project_type) setProjectType(p.project_type)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  // Check ownership + load members
  useEffect(() => {
    fetch(`/api/project-members?projectId=${id}`).then(async res => {
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || [])
        setIsOwner(true)
      }
    })
  }, [id])

  async function handleInvite() {
    setInviting(true); setInviteError(null); setInviteSuccess(false)
    const res = await fetch('/api/project-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id, email: inviteEmail }),
    })
    const data = await res.json()
    if (!res.ok) {
      setInviteError(data.error)
    } else {
      setMembers(prev => [...prev, { id: data.userId, user_id: data.userId, invited_email: data.email, created_at: new Date().toISOString() }])
      setInviteEmail('')
      setInviteSuccess(true)
      setTimeout(() => setInviteSuccess(false), 3000)
    }
    setInviting(false)
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Odstrániť tohto člena z projektu?')) return
    const res = await fetch('/api/project-members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id, memberId }),
    })
    if (res.ok) setMembers(prev => prev.filter(m => m.id !== memberId))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setError(null); setSuccess(false)
    const fd = new FormData(e.currentTarget)
    fd.set('image_template', imageTemplate)
    fd.set('image_mood', imageMood)
    fd.set('image_background', imageBackground)
    fd.set('image_photo_style', imagePhotoStyle)
    fd.set('project_type', projectType)
    const result = await updateProject(id, fd)
    if (result?.error) { setError(result.error) } else { setSuccess(true); setTimeout(() => setSuccess(false), 3000) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Naozaj vymazať tento projekt a všetky jeho príspevky?')) return
    await deleteProject(id)
    router.push('/portal/projects')
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}><Loader2 size={24} style={{ animation: 'spin-slow 1s linear infinite' }} /></div>
  if (!project) return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Projekt nebol nájdený.</div>

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
      {/* Project type */}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Typ projektu</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {PROJECT_TYPES.map(t => {
            const active = projectType === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setProjectType(t.id)}
                style={{
                  padding: '12px 14px', borderRadius: 'var(--radius)', textAlign: 'left', cursor: 'pointer',
                  border: active ? '2px solid var(--brand)' : '1px solid var(--border)',
                  background: active ? 'var(--brand-bg)' : 'var(--bg-base)',
                  transition: 'all 150ms',
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 4 }}>{t.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: active ? 'var(--brand-dark)' : 'var(--text-primary)', marginBottom: 2 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Basic info */}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Základné informácie</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="input-label">Názov</label><input name="name" className="input-field" defaultValue={project.name} required /></div>
          <div><label className="input-label">Popis</label><textarea name="description" className="input-field" rows={2} defaultValue={project.description || ''} placeholder="Krátky popis projektu..." /></div>
        </div>
      </div>

      {/* Brand colors */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Palette size={14} color="var(--text-muted)" />
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Brand farby</h2>
        </div>
        <div className="grid-2">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" name="primary_color" defaultValue={project.brand_colors?.primary || '#F59E0B'} style={{ width: 40, height: 40, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', padding: 2 }} />
            <div><div style={{ fontSize: 13, fontWeight: 500 }}>Primárna</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hlavná farba brandu</div></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" name="secondary_color" defaultValue={project.brand_colors?.secondary || '#FFFFFF'} style={{ width: 40, height: 40, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', padding: 2 }} />
            <div><div style={{ fontSize: 13, fontWeight: 500 }}>Sekundárna</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Doplnková farba</div></div>
          </div>
        </div>
      </div>

      {/* AI Brand prompt */}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Brand Prompt</h2>
        <textarea name="brand_style_prompt" className="input-field" rows={3} defaultValue={project.brand_style_prompt || ''} placeholder="Popíšte brand – štýl, cieľová skupina, tón komunikácie..." />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>AI použije tento popis pri generovaní textu aj obrázkov. Čím detailnejší, tým lepšie výsledky.</p>
      </div>

      {/* ═══ IMAGE STYLE SETTINGS ═══ */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Camera size={14} color="var(--text-muted)" />
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Štýl obrázkov</h2>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Nastavte vizuálny štýl pre konzistentné generovanie obrázkov.</p>

        {/* Template */}
        <div style={{ marginBottom: 18 }}>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Layers size={12} /> Šablóna</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {TEMPLATES.map(t => (
              <button key={t.id} type="button" onClick={() => setImageTemplate(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter',
                border: `1px solid ${imageTemplate === t.id ? 'var(--brand-border)' : 'var(--border)'}`,
                background: imageTemplate === t.id ? 'var(--brand-bg)' : 'transparent',
                transition: 'all 100ms',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: imageTemplate === t.id ? 'var(--brand)' : 'var(--text-faint)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: imageTemplate === t.id ? 600 : 500, fontSize: 13, color: imageTemplate === t.id ? 'var(--brand-dark)' : 'var(--text-primary)' }}>{t.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{t.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div style={{ marginBottom: 18 }}>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Sun size={12} /> Nálada svetla</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {MOODS.map(m => (
              <button key={m.id} type="button" onClick={() => setImageMood(m.id)} style={{
                flex: 1, padding: '8px', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'Inter',
                border: `1px solid ${imageMood === m.id ? 'var(--brand-border)' : 'var(--border)'}`,
                background: imageMood === m.id ? 'var(--brand-bg)' : 'transparent',
                color: imageMood === m.id ? 'var(--brand-dark)' : 'var(--text-secondary)',
                fontWeight: imageMood === m.id ? 600 : 400, fontSize: 12, transition: 'all 100ms',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: m.color, border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Background */}
        <div style={{ marginBottom: 18 }}>
          <label className="input-label">Pozadie</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {BACKGROUNDS.map(b => (
              <button key={b.id} type="button" onClick={() => setImageBackground(b.id)} style={{
                flex: 1, padding: '8px', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'Inter',
                border: `1px solid ${imageBackground === b.id ? 'var(--brand-border)' : 'var(--border)'}`,
                background: imageBackground === b.id ? 'var(--brand-bg)' : 'transparent',
                color: imageBackground === b.id ? 'var(--brand-dark)' : 'var(--text-secondary)',
                fontWeight: imageBackground === b.id ? 600 : 400, fontSize: 12, transition: 'all 100ms',
              }}>{b.label}</button>
            ))}
          </div>
        </div>

        {/* Photo style */}
        <div>
          <label className="input-label">Štýl fotenia</label>
          <div className="grid-2" style={{ gap: 6 }}>
            {PHOTO_STYLES.map(s => (
              <button key={s.id} type="button" onClick={() => setImagePhotoStyle(s.id)} style={{
                padding: '8px 12px', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'Inter',
                border: `1px solid ${imagePhotoStyle === s.id ? 'var(--brand-border)' : 'var(--border)'}`,
                background: imagePhotoStyle === s.id ? 'var(--brand-bg)' : 'transparent',
                color: imagePhotoStyle === s.id ? 'var(--brand-dark)' : 'var(--text-secondary)',
                fontWeight: imagePhotoStyle === s.id ? 600 : 400, fontSize: 12, transition: 'all 100ms',
              }}>{s.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Facebook */}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Facebook & Instagram</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Pripojte sociálne siete pre postovanie.</p>
        <div style={{ padding: '10px 14px', marginBottom: 14, borderRadius: 'var(--radius)', background: 'var(--info-bg)', border: '1px solid var(--info-border)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          Token získate tu: <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" style={{ color: 'var(--info)', marginLeft: 4 }}>Graph API Explorer <ExternalLink size={11} style={{ verticalAlign: 'middle' }} /></a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label className="input-label">Facebook Page ID</label><input name="facebook_page_id" className="input-field" defaultValue={project.facebook_page_id || ''} placeholder="123456789012345" /></div>
          <div><label className="input-label">Instagram Account ID <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(voliteľné)</span></label><input name="instagram_account_id" className="input-field" defaultValue={project.instagram_account_id || ''} /></div>
          <div><label className="input-label">Page Access Token</label><textarea name="meta_access_token" className="input-field" rows={2} defaultValue={project.meta_access_token || ''} style={{ fontFamily: 'monospace', fontSize: 12, resize: 'none' }} /></div>
          {project.facebook_page_id && project.meta_access_token ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius)' }}><CheckCircle2 size={14} color="var(--success)" /><span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>Facebook pripravený</span></div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius)' }}><AlertTriangle size={14} color="var(--warning)" /><span style={{ fontSize: 12, color: 'var(--warning)' }}>Vyplňte Page ID a Token</span></div>
          )}
        </div>
      </div>

      {/* ─── Team Members ─── */}
      {isOwner && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Users size={14} color="var(--text-muted)" />
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tím projektu</h2>
          </div>

          {/* Current members */}
          {members.length > 0 && (
            <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand-bg)', border: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={13} color="var(--brand)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.invited_email}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pridaný {new Date(m.created_at).toLocaleDateString('sk-SK')}</div>
                  </div>
                  <button onClick={() => handleRemoveMember(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 4, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }} title="Odstrániť">
                    <UserMinus size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Invite form */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              className="input-field"
              placeholder="email@example.com"
              style={{ flex: 1 }}
            />
            <button type="button" className="btn-primary" onClick={handleInvite} disabled={inviting} style={{ flexShrink: 0, opacity: inviting ? 0.6 : 1 }}>
              {inviting ? <Loader2 size={13} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <UserPlus size={13} />}
              Pridať
            </button>
          </div>

          {inviteError && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--error)', padding: '8px 12px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius-sm)' }}>{inviteError}</div>}
          {inviteSuccess && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--success)', padding: '8px 12px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={12} /> Člen úspešne pridaný!</div>}

          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>Používateľ musí mať existujúci RestaurantBoost účet (registrovaný emailom).</p>
        </div>
      )}

      {error && <div style={{ padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius)', color: 'var(--error)', fontSize: 13 }}>{error}</div>}
      {success && <div style={{ padding: '10px 14px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius)', color: 'var(--success)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} /> Uložené</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? 0.5 : 1 }}>{saving ? 'Ukladám...' : 'Uložiť zmeny'}</button>
        {isOwner && (
          <button type="button" className="btn-danger" onClick={handleDelete}><Trash2 size={13} /> Vymazať projekt</button>
        )}
      </div>
    </form>
  )
}

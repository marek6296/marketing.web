'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateProject, deleteProject } from '@/app/actions/projects'
import {
  ExternalLink, CheckCircle2, AlertTriangle, Trash2, Loader2,
  Palette, Camera, Layers, Sun, Users, UserPlus, UserMinus, Crown,
  Utensils, Hotel, User, ShoppingBag, Building2, Pencil, BookOpen, Info, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import PromptHelper from '@/components/PromptHelper'

type Project = {
  id: string; name: string; description: string | null
  brand_style_prompt: string | null
  brand_colors: { primary: string; secondary: string } | null
  image_style: { template: string; mood: string; background: string; photoStyle: string } | null
  facebook_page_id: string | null; instagram_account_id: string | null; meta_access_token: string | null
  project_type: string | null
  image_prompt: string | null
  image_reference_url: string | null
  brand_logo_url: string | null
  disable_emojis: boolean | null
}

const PROJECT_TYPES = [
  { id: 'restaurant', label: 'Reštaurácia / Kaváreň', icon: Utensils, desc: 'Jedlo, nápoje, atmosféra' },
  { id: 'hotel', label: 'Hotel / Ubytovanie', icon: Hotel, desc: 'Recepcia, izby, vybavenosť' },
  { id: 'influencer', label: 'Osoba / Influencer', icon: User, desc: 'Životný štýl, personálny brand' },
  { id: 'shop', label: 'Obchod / E-shop', icon: ShoppingBag, desc: 'Produkty, kolékcie, výpredaj' },
  { id: 'company', label: 'Firma / Agentúra', icon: Building2, desc: 'Tím, služby, B2B' },
  { id: 'custom', label: 'Vlastné', icon: Pencil, desc: 'Vlastný typ s individuálnym promptom' },
]

const TEMPLATE_PREVIEWS: Record<string, string> = {
  restaurant: 'restaurant',
  hotel: 'hotel',
  influencer: 'influencer',
  shop: 'shop',
  company: 'company',
}

const TEMPLATES = [
  { id: 'modern-minimal', label: 'Minimalistický', desc: 'Biele pozadie, veľa priestoru, geometricky čistý' },
  { id: 'bold-vibrant', label: 'Bold & Vibrant', desc: 'Energie, syté farby, vysoký kontrast' },
  { id: 'elegant-luxury', label: 'Elegantný', desc: 'Tmavé tóny, zlatové akcenty, luxusný feel' },
  { id: 'playful-casual', label: 'Hravý', desc: 'Pastelky, priateľský, živahavný' },
  { id: 'rustic-natural', label: 'Rustikálny', desc: 'Drevo, príroda, zemité tóny' },
]

function getPreviewFolder(projectType: string | null) {
  return TEMPLATE_PREVIEWS[projectType || ''] || 'restaurant'
}

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
  const [imagePrompt, setImagePrompt] = useState('')
  const [brandPrompt, setBrandPrompt] = useState('')
  const [imageRefUrl, setImageRefUrl] = useState<string | null>(null)
  const [uploadingRef, setUploadingRef] = useState(false)
  const refFileInputRef = useRef<HTMLInputElement>(null)
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoFileInputRef = useRef<HTMLInputElement>(null)

  // Team state
  type Member = { id: string; user_id: string; invited_email: string; created_at: string }
  const [members, setMembers] = useState<Member[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const searchParams = useSearchParams()
  const [oauthStatus, setOauthStatus] = useState<'success' | 'error' | 'no_pages' | null>(null)

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
      if (p?.image_prompt) setImagePrompt(p.image_prompt)
      if (p?.brand_style_prompt) setBrandPrompt(p.brand_style_prompt)
      if (p?.image_reference_url) setImageRefUrl(p.image_reference_url)
      if (p?.brand_logo_url) setBrandLogoUrl(p.brand_logo_url)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  // Handle OAuth redirect result
  useEffect(() => {
    const status = searchParams.get('oauth')
    if (status === 'success' || status === 'error' || status === 'no_pages') {
      setOauthStatus(status as 'success' | 'error' | 'no_pages')
      // Reload project data to show updated tokens
      if (status === 'success') {
        fetch(`/api/project?id=${id}`).then(r => r.json()).then(data => setProject(data.project))
      }
      // Clean URL
      const url = new URL(window.location.href)
      url.searchParams.delete('oauth')
      window.history.replaceState({}, '', url.toString())
      setTimeout(() => setOauthStatus(null), 6000)
    }
  }, [searchParams, id])

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

  async function handleRefUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingRef(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `project-references/${id}/reference.${ext}`
      const { error } = await supabase.storage.from('post-images').upload(filename, file, { upsert: true, contentType: file.type })
      if (!error) {
        const { data } = supabase.storage.from('post-images').getPublicUrl(filename)
        setImageRefUrl(data.publicUrl)
      }
    } finally {
      setUploadingRef(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'png'
      const filename = `project-logos/${id}/logo-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('post-images').upload(filename, file, { upsert: true, contentType: file.type })
      if (!error) {
        const { data } = supabase.storage.from('post-images').getPublicUrl(filename)
        setBrandLogoUrl(data.publicUrl)
      }
    } finally {
      setUploadingLogo(false)
      if (logoFileInputRef.current) logoFileInputRef.current.value = ''
    }
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
    fd.set('image_prompt', imagePrompt)
    fd.set('image_reference_url', imageRefUrl || '')
    fd.set('brand_logo_url', brandLogoUrl || '')
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
                  padding: '16px 14px', borderRadius: 'var(--radius)', textAlign: 'left', cursor: 'pointer',
                  border: active ? '2px solid var(--brand)' : '1px solid var(--border)',
                  background: active ? 'var(--brand-bg)' : 'var(--bg-card)',
                  transition: 'all 150ms',
                }}
              >
                <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
                  <t.icon size={24} color={active ? 'var(--brand-dark)' : 'var(--text-muted)'} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--brand-dark)' : 'var(--text-primary)', marginBottom: 2 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Basic info */}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Základné informácie</h2>
        
        <div style={{ display: 'flex', gap: 20, marginBottom: 18, alignItems: 'flex-start' }}>
          {/* Logo Uploader */}
          <div>
            <label className="input-label" style={{ marginBottom: 8 }}>Vlastný obrázok / Logo</label>
            <div 
              style={{ width: 80, height: 80, borderRadius: 'var(--radius)', background: 'var(--bg-hover)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              onClick={() => logoFileInputRef.current?.click()}
            >
              {uploadingLogo ? <Loader2 size={24} style={{ animation: 'spin-slow 1s linear infinite', color: 'var(--text-muted)' }} /> : 
               brandLogoUrl ? <img src={brandLogoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
               <Camera size={24} color="var(--text-faint)" />
              }
            </div>
            {brandLogoUrl && !uploadingLogo && <button type="button" onClick={() => setBrandLogoUrl(null)} style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: 11, marginTop: 6, cursor: 'pointer', padding: 0 }}>Odstrániť logo</button>}
            <input type="file" ref={logoFileInputRef} onChange={handleLogoUpload} accept="image/*" style={{ display: 'none' }} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label className="input-label">Názov</label><input name="name" className="input-field" defaultValue={project.name} required /></div>
            <div><label className="input-label">Popis</label><textarea name="description" className="input-field" rows={2} defaultValue={project.description || ''} placeholder="Krátky popis projektu..." /></div>
          </div>
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
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 8 }}>
          AI Brand Prompt
          <PromptHelper fieldType="brand" onUse={text => setBrandPrompt(text)} projectId={id} />
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <textarea name="brand_style_prompt" className="input-field" rows={8} value={brandPrompt} onChange={e => setBrandPrompt(e.target.value)} placeholder="Popíšte brand – štýl, cieľová skupina, tón komunikácie..." />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>AI použije tento popis pri generovaní textu aj obrázkov. Čím detailnejší, tým lepšie výsledky.</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', transition: 'all 150ms' }}>
            <input type="checkbox" name="disable_emojis" defaultChecked={project.disable_emojis || false} style={{ width: 16, height: 16, accentColor: 'var(--brand)', marginTop: 2, cursor: 'pointer' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Zakázať systémové Emoji</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>Ak označíte túto možnosť, AI pri generovaní nových príspevkov a textov vôbec nepoužije emotikony (smajlíky). Vhodné pre vysoko konzervatívne alebo čisté B2B texty.</div>
            </div>
          </label>
        </div>
      </div>

      {/* ═══ IMAGE STYLE SETTINGS ═══ */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Camera size={14} color="var(--text-muted)" />
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Štýl obrázkov</h2>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Nastavte vizuálny štýl pre konzistentné generovanie obrázkov.</p>

        {projectType !== 'custom' && (
          <>
            {/* Template */}
            <div style={{ marginBottom: 20 }}>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}><Layers size={12} /> Vizuálny štýl obrázkov</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {TEMPLATES.map(t => {
              const active = imageTemplate === t.id
              return (
                <button key={t.id} type="button" onClick={() => setImageTemplate(t.id)} style={{
                  padding: 0, borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter',
                  border: `2px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
                  background: active ? 'var(--brand-bg)' : 'var(--bg-base)',
                  overflow: 'hidden', transition: 'all 150ms',
                  boxShadow: active ? '0 0 0 1px var(--brand)' : 'none',
                }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={`/style-previews/${getPreviewFolder(projectType)}/${t.id}.jpg`}
                      alt={t.label}
                      style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                    />
                    {active && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        background: 'var(--brand)', borderRadius: '50%',
                        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <CheckCircle2 size={12} color="white" />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: active ? 'var(--brand-dark)' : 'var(--text-primary)', marginBottom: 2 }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>Zvolený štýl sa automaticky aplikuje pri generovaní obrázkov pre tento projekt.</p>
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
          </>
        )}

        {/* Permanent image prompt - shown for all types */}
        {true && (
        <div style={{
          marginTop: 20, padding: '14px', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          background: 'var(--bg-hover)',
          transition: 'all 200ms',
        }}>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            ✏️ Stály prompt pre obrázky
            <PromptHelper fieldType="image" onUse={text => setImagePrompt(text)} projectId={id} />
          </label>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
            Bude pridaný ku každému generovanému obrázku tohto projektu. Ideálne pre špecifické miesto, produkty alebo štýl.
          </p>
          <textarea
            className="input-field"
            rows={3}
            placeholder='Napr. "moderná kancelária v Bratislave, sklenená fasáda, business casual oblečenie, prirodzené svetlo"'
            value={imagePrompt}
            onChange={e => setImagePrompt(e.target.value)}
            style={{ resize: 'vertical', fontSize: 12 }}
          />
          {imagePrompt.trim() && (
            <p style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>✅ Aktívny – zahrnutý pri každom generovaní obrázku.</p>
          )}

          {/* Reference image upload */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              🖼️ Referenčný obrázok štýlu
            </label>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
              Nahraj obrázok – jeho vizuálny štýl (farby, osvetlenie, kompozícia) bude použitý pri každom generovaní.
            </p>
            <input
              ref={refFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleRefUpload}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: 'column' }}>
              {imageRefUrl && (
                <div>
                  <img
                    src={imageRefUrl}
                    alt="Referenčný obrázok"
                    style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 'var(--radius)', border: '2px solid var(--brand)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setImageRefUrl(null)}
                    style={{ display: 'block', background: 'none', border: 'none', color: 'var(--error)', fontSize: 11, marginTop: 6, cursor: 'pointer', padding: 0 }}
                  >
                    Odstrániť referenciu
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => refFileInputRef.current?.click()}
                disabled={uploadingRef}
                style={{
                  padding: '8px 14px', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'Inter',
                  border: '1px dashed var(--border)', background: 'transparent',
                  color: 'var(--text-secondary)', fontSize: 12,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {uploadingRef ? <><Loader2 size={12} style={{ animation: 'spin-slow 1s linear infinite' }} /> Nahrávam...</> : <>{imageRefUrl ? '🔄 Zmeniť obrázok' : '📤 Nahrať obrázok'}</>}
              </button>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Facebook */}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Facebook & Instagram</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Pripojte sociálne siete pre postovanie.</p>

        {/* OAuth Flash Banners */}
        {oauthStatus === 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', marginBottom: 14, background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius)' }}>
            <CheckCircle2 size={15} color="var(--success)" />
            <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>Facebook a Instagram úspešne prepojené! Token uložený automaticky.</span>
          </div>
        )}
        {oauthStatus === 'no_pages' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', marginBottom: 14, background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius)' }}>
            <AlertTriangle size={15} color="var(--warning)" />
            <span style={{ fontSize: 13, color: 'var(--warning)' }}>Žiadna Facebook stránka nebola nájdená. Uisti sa, že spravuješ aspoň jednu stránku.</span>
          </div>
        )}
        {oauthStatus === 'error' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', marginBottom: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius)' }}>
            <AlertTriangle size={15} color="#dc2626" />
            <span style={{ fontSize: 13, color: '#dc2626' }}>OAuth prepojenie zlyhalo. Skús znova alebo použi manuálne zadanie.</span>
          </div>
        )}

        {/* One-click OAuth connect */}
        <div style={{ padding: '14px 16px', marginBottom: 16, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(to right, rgba(24,119,242,0.06), rgba(24,119,242,0.02))', border: '1px solid rgba(24,119,242,0.2)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width={19} height={19} viewBox="0 0 24 24" fill="white"><path d="M24 12.07C24 5.4 18.63 0 12 0C5.37 0 0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24V15.56H7.08V12.07H10.13V9.4C10.13 6.38 11.93 4.7 14.65 4.7C15.96 4.7 17.34 4.93 17.34 4.93V7.9H15.83C14.34 7.9 13.88 8.83 13.88 9.78V12.07H17.2L16.66 15.56H13.88V24C19.61 23.1 24 18.1 24 12.07Z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            {project?.meta_access_token ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 }}>Prepojené cez Facebook</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Token je aktívny. Môžeš ho obnoviť opätovným prepojením.</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 }}>Rýchle prepojenie cez Facebook Login</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Automaticky načítame Page ID, Instagram ID a Access Token.</div>
              </>
            )}
          </div>
          <a
            href={`/api/meta/connect?projectId=${id}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#1877F2', color: 'white',
              padding: '7px 14px', borderRadius: 'var(--radius)',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
              transition: 'opacity 150ms', flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {project?.meta_access_token ? 'Obnoviť' : 'Pripojiť'}
          </a>
        </div>

        {/* Separator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>alebo zadaj manuálne</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Info banner for tokens */}
        <div style={{ padding: '16px 20px', marginBottom: 20, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(to right, rgba(59,130,246,0.05), rgba(59,130,246,0.01))', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={20} color="#3B82F6" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Nevieš, kde získať tieto údaje?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
              Ak si nie si istý, ako získať prístupové údaje pre API Meta (Facebook a Instagram), pripravili sme pre teba podrobného sprievodcu s krok-za-krokom obrázkami. Dozvieš sa tam aj to, ako presne použiť <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" style={{ color: '#3B82F6', fontWeight: 500, textDecoration: 'none' }}>Graph API Explorer <ExternalLink size={12} style={{ verticalAlign: 'baseline', opacity: 0.8 }} /></a> na získanie Tokenu.
            </p>
            <Link href="/portal/help/meta-setup" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#3B82F6', color: 'white', padding: '8px 16px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all 150ms', boxShadow: '0 2px 4px rgba(59,130,246,0.2)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              Zobraziť Sprievodcu Meta API <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label className="input-label">Facebook Page ID</label><input name="facebook_page_id" className="input-field" defaultValue={project.facebook_page_id || ''} placeholder="123456789012345" /></div>
          <div><label className="input-label">Instagram Account ID</label><input name="instagram_account_id" className="input-field" defaultValue={project.instagram_account_id || ''} /></div>
          <div><label className="input-label">Page Access Token</label><textarea name="meta_access_token" className="input-field" rows={6} defaultValue={project.meta_access_token || ''} style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} /></div>
          {project.meta_access_token && (project.facebook_page_id || project.instagram_account_id) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius)' }}><CheckCircle2 size={14} color="var(--success)" /><span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>{project.facebook_page_id && project.instagram_account_id ? 'Facebook a Instagram sú pripravené' : project.facebook_page_id ? 'Facebook pripravený' : 'Instagram pripravený'}</span></div>
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

          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>Používateľ musí mať existujúci PROJECTBer účet (registrovaný emailom).</p>
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

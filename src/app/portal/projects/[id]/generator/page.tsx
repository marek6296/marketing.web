'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Sparkles, Send, CalendarPlus, RefreshCw, ImageIcon, Loader2,
  CheckCircle2, Upload, Wand2, Camera, FileText, Download,
  BookmarkPlus, BookmarkCheck, Library, Smartphone, PenLine,
  Utensils, Hotel, User, ShoppingBag, Building2, Pencil, Palette,
  Image as LucideImage, ScanText, ZoomIn
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ImageEditor from '../images/ImageEditor'

import RefImagePicker from './RefImagePicker'
import PromptHelper from '@/components/PromptHelper'

export type ProfileData = { plan: string; role: string; tokens_used: number; tokens_limit: number }

type Post = { id: string; image_url: string | null; caption: string | null; status: string; post_type?: string }
type Tab = 'post' | 'story' | 'image' | 'enhance' | 'upscale'
type LibraryImage = { id: string; image_url: string; source: string; title: string | null; created_at: string; post_type?: string; is_favorite?: boolean }

const STYLE_PRESETS = [
  { id: 'modern-minimal', label: 'Minimalistický', desc: 'Čistý a moderný' },
  { id: 'bold-vibrant', label: 'Bold', desc: 'Živé farby, energia' },
  { id: 'elegant-luxury', label: 'Elegantný', desc: 'Luxusný a sofistikovaný' },
  { id: 'playful-casual', label: 'Hravý', desc: 'Priateľský a casual' },
  { id: 'rustic-natural', label: 'Rustikálny', desc: 'Prírodný a organický' },
]

const ENHANCE_MODES = [
  { id: 'professional', label: 'Profi foto', icon: Camera, desc: 'Celkové vylepšenie' },
  { id: 'food-pro', label: 'Food foto', icon: Sparkles, desc: 'Jedlo na úrovni' },
  { id: 'product-shot', label: 'Produkt', icon: ImageIcon, desc: 'E-shop kvalita' },
  { id: 'social-media', label: 'Social', icon: Upload, desc: 'IG/FB ready' },
]

/* ─── Save to Library button ─────────────────────────────────────── */
function SaveToLibraryButton({ imageUrl, projectId, source, postType, onSaved }: {
  imageUrl: string; projectId: string; source: 'generated' | 'enhanced'; postType?: 'post' | 'story'; onSaved?: () => void
}) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (saved || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, projectId, source, post_type: postType || 'post' }),
      })
      if (res.ok) { setSaved(true); onSaved?.() }
    } finally { setSaving(false) }
  }

  return (
    <button
      onClick={handleSave}
      disabled={saved || saving}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
        borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 500,
        cursor: saved ? 'default' : 'pointer', fontFamily: 'Inter',
        border: saved ? '1px solid var(--success-border)' : '1px solid var(--border)',
        color: saved ? 'var(--success)' : 'var(--text-secondary)',
        background: saved ? 'var(--success-bg)' : 'var(--bg-card)',
        transition: 'all 150ms', opacity: saving ? 0.6 : 1,
      }}
    >
      {saved ? <BookmarkCheck size={14} /> : saving ? <Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <BookmarkPlus size={14} />}
      {saved ? 'Uložené' : 'Uložiť do knižnice'}
    </button>
  )
}

/* ─── Library picker modal ────────────────────────────────────────── */
function LibraryPicker({ projectId, onSelect, onClose }: {
  projectId: string; onSelect: (url: string) => void; onClose: () => void
}) {
  const [images, setImages] = useState<LibraryImage[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/images?projectId=${projectId}`)
    const data = await res.json()
    setImages(data.images || [])
    setLoading(false)
  }, [projectId])

  useState(() => { load() })

  async function toggleFavorite(e: React.MouseEvent, img: LibraryImage) {
    e.stopPropagation()
    const newFav = !img.is_favorite
    setImages(prev => prev.map(i => i.id === img.id ? { ...i, is_favorite: newFav } : i))
    try {
      await fetch('/api/images', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: img.id, is_favorite: newFav })
      })
      load() // Refresh to apply server sorting
    } catch {
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, is_favorite: !newFav } : i))
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
        padding: 24, width: 600, maxHeight: '80vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15 }}>
            <Library size={16} color="var(--brand)" /> Knižnica obrázkov
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Loader2 size={24} style={{ animation: 'spin-slow 1s linear infinite', color: 'var(--text-muted)' }} />
            </div>
          ) : images.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
              Knižnica je prázdna. Uložte nejaké obrázky z generátora.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {images.map(img => (
                <button key={img.id} onClick={() => onSelect(img.image_url)} style={{
                  padding: 0, border: '2px solid transparent', borderRadius: 'var(--radius)',
                  cursor: 'pointer', overflow: 'hidden', transition: 'border-color 150ms', background: 'none',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                >
                  <div style={{ position: 'relative' }}>
                    <img src={img.image_url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                    <button 
                      onClick={(e) => toggleFavorite(e, img)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', color: img.is_favorite ? '#fbbf24' : 'rgba(255,255,255,0.7)', transition: 'all 150ms' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill={img.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </button>
                  </div>
                  <div style={{ padding: '4px 6px', fontSize: 10, color: 'var(--text-muted)', textAlign: 'left', background: 'var(--bg-hover)', display: 'flex', gap: 4, alignItems: 'center' }}>
                    {img.post_type === 'story' ? '📱 Story' : '🖼️ Post'}
                    <span style={{ opacity: 0.5 }}>·</span>
                    {img.source === 'enhanced' ? '✨ Enhanced' : '🎨 Generated'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type ProjectBrand = {
  name: string
  brand_style_prompt: string | null
  brand_colors: { primary: string; secondary: string } | null
  image_style: { template: string; mood: string; background: string; photoStyle: string } | null
  project_type: string | null
  image_prompt: string | null
  image_reference_url: string | null
}


export default function ProjectGeneratorPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('post')
  const [brand, setBrand] = useState<ProjectBrand | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)

  useEffect(() => {
    fetch(`/api/project?id=${projectId}`)
      .then(r => r.json())
      .then(d => { if (d.project) setBrand(d.project) })
      .catch(() => {})

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('plan, role, tokens_used, tokens_limit').eq('id', user.id).single()
          .then(({ data }) => setProfile(data))
      }
    })
  }, [projectId])

  const isUnlimited = profile?.role === 'admin' || profile?.role === 'superadmin'
  const isFree = !isUnlimited && profile?.plan === 'free'

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{
          display: 'flex', gap: 4,
          background: 'var(--bg-card)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', padding: 4, width: 'fit-content',
        }}>
          {[
            { id: 'post' as Tab, label: 'Príspevok', icon: FileText },
            { id: 'story' as Tab, label: 'Story', icon: Smartphone },
            { id: 'image' as Tab, label: 'Obrázok', icon: ImageIcon },
            { id: 'enhance' as Tab, label: 'Photo Enhancer', icon: Wand2 },
            { id: 'upscale' as Tab, label: 'Upscale', icon: ZoomIn },
          ].map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? 'var(--brand-dark)' : 'var(--text-secondary)',
                background: active ? 'var(--brand-bg)' : 'transparent',
                border: active ? '1px solid var(--brand-border)' : '1px solid transparent',
                cursor: 'pointer', fontFamily: 'Inter', transition: 'all 150ms',
              }}>
                <Icon size={14} />{t.label}
              </button>
            )
          })}
        </div>

        {/* Tokens Status */}
        {profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isUnlimited ? (
              <span className="badge badge-brand"><Sparkles size={12} style={{ marginRight: 4 }} /> AI Neobmedzene</span>
            ) : isFree ? (
              <span className="badge badge-error"><Wand2 size={12} style={{ marginRight: 4 }} /> Free Plán (AI Zamknuté)</span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>
                <span style={{ color: 'var(--text-muted)' }}>Mesačné AI Tokeny:</span>
                <span style={{ color: profile.tokens_used >= profile.tokens_limit ? 'var(--error)' : 'var(--text-primary)' }}>
                  {profile.tokens_limit - profile.tokens_used} <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>/ {profile.tokens_limit}</span>
                </span>
                <div style={{ width: 60, height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden', marginLeft: 4 }}>
                  <div style={{
                    width: `${Math.min(100, Math.max(0, (profile.tokens_used / profile.tokens_limit) * 100))}%`,
                    height: '100%',
                    background: profile.tokens_used >= profile.tokens_limit ? 'var(--error)' : 'var(--brand)',
                    borderRadius: 3,
                  }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>


      {tab === 'post' && <PostGenerator projectId={projectId} profile={profile} />}
      {tab === 'story' && (isFree ? <PremiumBanner feature="AI Story Generátor" /> : <StoryGenerator projectId={projectId} />)}
      {tab === 'image' && (isFree ? <PremiumBanner feature="Múdry Generátor Obrázkov" /> : <ImageGenerator projectId={projectId} />)}
      {tab === 'enhance' && (isFree ? <PremiumBanner feature="AI Photo Vylepšovač" /> : <PhotoEnhancer projectId={projectId} />)}
      {tab === 'upscale' && (isFree ? <PremiumBanner feature="Picture Upscale" /> : <ImageUpscaler projectId={projectId} />)}
    </div>
  )
}

function PremiumBanner({ feature }: { feature: string }) {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--brand-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Wand2 size={32} color="var(--brand)" />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{feature} je uzamknutý</h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
        Váš aktuálny plán <strong>FREE</strong> neobsahuje prístup k automatickým AI funkciám platformy. 
        Pre generovanie obsahu priamo z jedného kliknutia si, prosím, navýšte svoj plán.
      </p>
      <button className="btn-brand" style={{ padding: '12px 24px', fontSize: 13, fontWeight: 600 }}>
        <Sparkles size={16} /> Odomknúť Premium Prístup
      </button>
    </div>
  )
}

/* ─── TAB: Story Generator ───────────────────────────────────────── */
function StoryGenerator({ projectId }: { projectId: string }) {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState<'facebook_story' | 'instagram_story' | 'both_stories'>('both_stories')
  const [refImages, setRefImages] = useState<{ url: string; thumb: string }[]>([])
  const [showInputLibrary, setShowInputLibrary] = useState(false)
  const [inputImage, setInputImage] = useState<{ url: string; base64: string; mime: string } | null>(null)
  const [imgHovering, setImgHovering] = useState(false)
  const storyFileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [post, setPost] = useState<Post | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState<{ facebook?: string; instagram?: string; errors?: string[] } | null>(null)
  const [editingImage, setEditingImage] = useState(false)
  // baseImageUrl = original AI image (no text burned in)
  // savedLayers = last text layers — editor always opens with these on top of base image
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null)
  const [savedLayers, setSavedLayers] = useState<{
    id: string; x: number; y: number; text: string
    font: string; size: number; bold: boolean; italic: boolean
    underline: boolean; color: string; align: 'left' | 'center' | 'right'
    shadow: boolean; strokeColor: string; strokeWidth: number; maxWidth: number
  }[] | undefined>(undefined)



  async function handleStoryInputFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      const [header, base64] = result.split(',')
      setInputImage({ url: result, base64, mime: header.replace('data:', '').replace(';base64', '') })
    }
    reader.readAsDataURL(file); e.target.value = ''
  }

  function handleStoryInputLibrarySelect(url: string) {
    setShowInputLibrary(false)
    setInputImage({ url, base64: '', mime: 'image/jpeg' })
    fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(d => { if (d.base64) setInputImage(prev => prev ? { ...prev, base64: d.base64, mime: d.mime || 'image/jpeg' } : null) })
      .catch(() => {})
  }

  // Extract punchy headline from AI-generated caption
  function makeHeadline(caption: string): string {
    if (!caption) return ''
    // Take first sentence (up to . ! ?)
    const firstSentence = caption.split(/[.!?]/)[0].trim()
    // Take first 4-5 words
    const words = firstSentence.split(/\s+/).filter(Boolean)
    return words.slice(0, 5).join(' ').toUpperCase()
  }

  async function handleGenerate() {
    if (!topic.trim() && !inputImage) return
    setLoading(true); setError(null); setPost(null); setPublishResult(null)
    try {
      const body: Record<string, unknown> = {
        topic: topic.trim() || 'Story k priloženej fotke', platform, projectId, mode: 'post', postType: 'story',
        ...(refImages.length > 0 ? { referenceImageUrls: refImages.map(r => r.url) } : {}),
      }
      if (inputImage?.base64) { body.imageData = inputImage.base64; body.imageMime = inputImage.mime }
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPost(data.post)

      // Auto-open editor with ONE clean headline text layer
      if (data.post?.image_url) {
        const headline = makeHeadline(data.post.caption || topic)
        const layers = [{
          id: `story-text-${Date.now()}`,
          x: 197, y: 510,
          text: headline,
          font: 'Outfit', size: 52, bold: true, italic: false,
          underline: false, color: '#ffffff', align: 'center' as const,
          shadow: true, strokeColor: '#000000', strokeWidth: 2, maxWidth: 360,
        }]
        // Store the ORIGINAL image url (before text) — editor always works from this
        setBaseImageUrl(data.post.image_url)
        setSavedLayers(layers)
        setEditingImage(true)
      }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Chyba') }
    finally { setLoading(false) }
  }

  async function handlePublish() {
    if (!post) return
    setPublishing(true); setError(null)
    try {
      await fetch('/api/posts', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, platform, post_type: 'story' }),
      })
      const res = await fetch('/api/publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPost({ ...post, status: 'published' })
      setPublishResult({ facebook: data.facebook, instagram: data.instagram, errors: data.errors })
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Chyba') }
    finally { setPublishing(false) }
  }

  return (
    <>
      {showInputLibrary && <LibraryPicker projectId={projectId} onSelect={handleStoryInputLibrarySelect} onClose={() => setShowInputLibrary(false)} />}
      {editingImage && (baseImageUrl || post?.image_url) && (
        <ImageEditor
          imageUrl={baseImageUrl || post!.image_url!}
          projectId={projectId}
          initialLayers={savedLayers}
          onClose={() => setEditingImage(false)}
          onLayersSaved={(layers) => setSavedLayers(layers)}
          onSaved={async (newUrl) => {
            setEditingImage(false)
            // Update post preview to show composite (text burned in)
            await fetch('/api/posts', {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: post!.id, image_url: newUrl }),
            })
            setPost(p => p ? { ...p, image_url: newUrl } : null)
            // Don't clear baseImageUrl or savedLayers — next edit reuses them
          }}
        />
      )}
    <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
      {/* LEFT: Controls */}
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Generovať Story</h2>
        

        {/* Input image */}
        <div style={{ marginBottom: 18 }}>
          <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>Fotka k Story <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(voliteľná)</span></label>
          <input ref={storyFileRef} type="file" accept="image/*" onChange={handleStoryInputFileUpload} style={{ display: 'none' }} />
          {inputImage ? (
            <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer' }}
              onMouseEnter={() => setImgHovering(true)} onMouseLeave={() => setImgHovering(false)}>
              <img src={inputImage.url} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: imgHovering ? 1 : 0, transition: 'opacity 200ms' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#111' }}>
                  <Camera size={13} /> Zmeniť
                  <input type="file" accept="image/*" onChange={handleStoryInputFileUpload} style={{ display: 'none' }} />
                </label>
                <button onClick={() => setInputImage(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', background: 'white', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#dc2626', border: 'none' }}>
                  × Odstrániť
                </button>
              </div>
              {!inputImage.base64 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={22} color="white" style={{ animation: 'spin-slow 1s linear infinite' }} /></div>}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 'var(--radius)', border: '2px dashed var(--border)', background: 'var(--bg-hover)', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-bg)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-hover)' }}>
                <Upload size={16} /> Nahrať foto
                <input type="file" accept="image/*" onChange={handleStoryInputFileUpload} style={{ display: 'none' }} />
              </label>
              <button onClick={() => setShowInputLibrary(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-bg)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}>
                <Library size={16} /> Z knižnice
              </button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="input-label">Téma Story</label>
          <textarea className="input-field" rows={3} placeholder="Popíšte o čom má story byť..." value={topic} onChange={e => setTopic(e.target.value)} style={{ resize: 'vertical' }} />
        </div>


        <div style={{ marginBottom: 18 }}>
          <RefImagePicker projectId={projectId} value={refImages} onChange={setRefImages} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="input-label">Platforma</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {([{ v: 'facebook_story', l: 'Facebook' }, { v: 'instagram_story', l: 'Instagram' }, { v: 'both_stories', l: 'Facebook+Instagram' }] as const).map(o => (
              <button key={o.v} onClick={() => setPlatform(o.v)} style={{
                flex: 1, padding: '9px', fontSize: 13, borderRadius: 'var(--radius)',
                cursor: 'pointer', fontFamily: 'Inter',
                border: `1px solid ${platform === o.v ? 'var(--brand-border)' : 'var(--border)'}`,
                color: platform === o.v ? 'var(--brand-dark)' : 'var(--text-secondary)',
                background: platform === o.v ? 'var(--brand-bg)' : 'var(--bg-card)',
                fontWeight: platform === o.v ? 600 : 400, transition: 'all 150ms',
              }}>{o.l}</button>
            ))}
          </div>
        </div>

        {error && <div style={{ padding: '10px 14px', marginBottom: 14, background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius)', color: 'var(--error)', fontSize: 13 }}>{error}</div>}
        <button className="btn-primary" onClick={handleGenerate} disabled={loading || !topic.trim()} style={{ width: '100%', padding: '11px' }}>
          {loading ? <><Loader2 size={15} style={{ animation: 'spin-slow 1s linear infinite' }} /> Generujem story...</> : <><Sparkles size={15} /> Generovať Story</>}
        </button>
      </div>

      {/* RIGHT: Story preview (9:16) */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          Náhľad Story {post && <span className="badge badge-green">Hotovo</span>}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Loader2 size={28} color="var(--text-faint)" style={{ margin: '0 auto 12px', animation: 'spin-slow 1s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>AI generuje story obrázok (9:16)...</p>
            <p style={{ color: 'var(--text-faint)', fontSize: 11, marginTop: 4 }}>Potom automaticky pridá text na obrázok</p>
          </div>
        ) : post ? (
          <div>
            {/* 9:16 Story preview frame */}
            <div style={{
              position: 'relative', borderRadius: 16, overflow: 'hidden',
              aspectRatio: '9/16', maxWidth: 260, margin: '0 auto 14px',
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              {post.image_url ? (
                <img src={post.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)' }}>
                  <ImageIcon size={40} />
                </div>
              )}
              {/* 📱 Story progress bar */}
              <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', gap: 3 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i === 1 ? 'white' : 'rgba(255,255,255,0.35)' }} />
                ))}
              </div>
            </div>

            {/* Info: text is baked in */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius)', marginBottom: 10, fontSize: 11, color: 'var(--success)' }}>
              <CheckCircle2 size={12} /> Text je vpísaný priamo do obrázka
            </div>

            {/* Edit image — change text button */}
            {post.image_url && (
              <button
                onClick={() => setEditingImage(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  width: '100%', padding: '9px', marginBottom: 10,
                  borderRadius: 'var(--radius)', border: '2px solid var(--brand-border)',
                  background: 'var(--brand-bg)', color: 'var(--brand-dark)',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter', transition: 'all 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand)'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--brand-bg)'; e.currentTarget.style.color = 'var(--brand-dark)' }}
              >
                <PenLine size={14} /> Upraviť text / obrázok
              </button>
            )}

            {post.status === 'published' ? (
              <div style={{ padding: '12px', borderRadius: 'var(--radius)', background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><CheckCircle2 size={14} color="var(--success)" /><span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>Story publikovaná!</span></div>
                {publishResult?.instagram && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>IG: {publishResult.instagram}</p>}
                {publishResult?.facebook && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>FB: {publishResult.facebook}</p>}
                {publishResult?.errors && publishResult.errors.length > 0 && (
                  <div style={{ marginTop: 8, padding: '8px', background: 'var(--warning-bg, rgba(234,179,8,0.1))', border: '1px solid var(--warning-border, rgba(234,179,8,0.3))', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--warning, #a16207)' }}>
                    {publishResult.errors.map((e, i) => <p key={i} style={{ margin: '2px 0' }}>{e}</p>)}
                  </div>
                )}
                <button className="btn-ghost" onClick={handleGenerate} style={{ marginTop: 8, fontSize: 12, width: '100%', justifyContent: 'center' }}><RefreshCw size={13} /> Ďalšia story</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn-brand" onClick={handlePublish} disabled={publishing} style={{ width: '100%', padding: '10px', opacity: publishing ? 0.6 : 1 }}>
                  {publishing ? <><Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> Publikujem...</> : <><Send size={14} /> Publikovať Story</>}
                </button>
                <button className="btn-ghost" onClick={handleGenerate} style={{ fontSize: 12, width: '100%', justifyContent: 'center' }}><RefreshCw size={13} /> Znova</button>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '80px 0' }}>
            <Smartphone size={36} style={{ opacity: 0.3 }} />
            <p>Tu sa zobrazí story</p>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>Formát 9:16 – optimalizované pre Stories</p>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

/* ─── TAB 2: Post Generator ─────────────────────────────────────── */
function PostGenerator({ projectId, profile }: { projectId: string; profile: ProfileData | null }) {
  const isFree = profile && profile.plan === 'free' && profile.role !== 'admin' && profile.role !== 'superadmin'
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('both')
  const [loading, setLoading] = useState(false)
  const [post, setPost] = useState<Post | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [publishResult, setPublishResult] = useState<{ facebook?: string; instagram?: string } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const d = params.get('date')
    if (d) {
      setScheduledAt(d)
    }
  }, [])
  const [showLibrary, setShowLibrary] = useState(false)
  const [showInputLibrary, setShowInputLibrary] = useState(false)
  // image attached before generation
  const [refImages, setRefImages] = useState<{ url: string; thumb: string }[]>([])
  const [inputImage, setInputImage] = useState<{ url: string; base64: string; mime: string } | null>(null)
  const [imgHovering, setImgHovering] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleInputFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      // result = data:image/jpeg;base64,...
      const [header, base64] = result.split(',')
      const mime = header.replace('data:', '').replace(';base64', '')
      setInputImage({ url: result, base64, mime })
    }
    reader.readAsDataURL(file)
    // reset input so same file can be selected again
    e.target.value = ''
  }

  function handleInputLibrarySelect(url: string) {
    // For library images we need to fetch them as base64
    setShowInputLibrary(false)
    setInputImage({ url, base64: '', mime: 'image/jpeg' })
    // Fetch with proxy to get base64
    fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(d => { if (d.base64) setInputImage(prev => prev ? { ...prev, base64: d.base64, mime: d.mime || 'image/jpeg' } : null) })
      .catch(() => {})
  }

  async function handleGenerate() {
    if (!topic.trim() && !inputImage) return
    setLoading(true); setError(null); setPost(null); setPublishResult(null)
    try {
      const body: Record<string, unknown> = { topic: topic.trim() || 'Príspevok k priloženej fotke', platform, projectId, mode: isFree ? 'manual' : 'post' }
      if (inputImage?.base64) {
        body.imageData = inputImage.base64
        body.imageMime = inputImage.mime
      }
      if (refImages.length > 0) body.referenceImageUrls = refImages.map(r => r.url)
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPost(data.post)
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Chyba') }
    finally { setLoading(false) }
  }

  async function handlePublish() {
    if (!post) return
    setPublishing(true); setError(null)
    try {
      // Always sync image_url + platform to DB before publishing
      // (image may have been selected from library without explicit save)
      await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, image_url: post.image_url, platform: platform }),
      })

      const res = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: post.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPost({ ...post, status: 'published' })
      setPublishResult({ facebook: data.facebook, instagram: data.instagram })
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Chyba') }
    finally { setPublishing(false) }
  }

  async function handleSchedule() {
    if (!post || !scheduledAt) return
    setScheduling(true)
    try {
      const res = await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: post.id, scheduledAt }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setPost({ ...post, status: 'scheduled' })
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Chyba') }
    finally { setScheduling(false) }
  }

  function handleLibrarySelect(url: string) {
    setPost(prev => prev ? { ...prev, image_url: url } : null)
    setShowLibrary(false)
  }



  return (
    <>
      {showLibrary && <LibraryPicker projectId={projectId} onSelect={handleLibrarySelect} onClose={() => setShowLibrary(false)} />}
      {showInputLibrary && <LibraryPicker projectId={projectId} onSelect={handleInputLibrarySelect} onClose={() => setShowInputLibrary(false)} />}
      <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Generovať príspevok</h2>

          {/* ── Input image section ── */}
          <div style={{ marginBottom: 18 }}>
            <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>Fotka k príspevku <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(voliteľná)</span></label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleInputFileUpload} style={{ display: 'none' }} />
            {inputImage ? (
              <div
                style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer' }}
                onMouseEnter={() => setImgHovering(true)}
                onMouseLeave={() => setImgHovering(false)}
              >
                <img src={inputImage.url} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: imgHovering ? 1 : 0, transition: 'opacity 200ms',
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#111' }}>
                    <Camera size={13} /> Zmeniť
                    <input type="file" accept="image/*" onChange={handleInputFileUpload} style={{ display: 'none' }} />
                  </label>
                  <button onClick={() => setInputImage(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', background: 'white', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#dc2626', border: 'none' }}>
                    × Odstrániť
                  </button>
                </div>
                {!inputImage.base64 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={22} color="white" style={{ animation: 'spin-slow 1s linear infinite' }} />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px', borderRadius: 'var(--radius)', border: '2px dashed var(--border)',
                  background: 'var(--bg-hover)', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, transition: 'all 150ms',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-bg)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
                >
                  <Upload size={16} /> Nahrať foto
                  <input type="file" accept="image/*" onChange={handleInputFileUpload} style={{ display: 'none' }} />
                </label>
                <button onClick={() => setShowInputLibrary(true)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                  background: 'var(--bg-card)', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, transition: 'all 150ms',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-bg)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}
                >
                  <Library size={16} /> Z knižnice
                </button>
              </div>
            )}
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="input-label">{isFree ? 'Text príspevku' : 'Téma'}</label>
            <textarea className="input-field" rows={3} placeholder={isFree ? "Napíšte text príspevku sem..." : "Popíšte, o čom má byť príspevok..."} value={topic} onChange={(e) => setTopic(e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <RefImagePicker projectId={projectId} value={refImages} onChange={setRefImages} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="input-label">Platforma</label>
            <div style={{ display: 'flex', gap: 6 }}>{[{ v: 'facebook', l: 'Facebook' }, { v: 'instagram', l: 'Instagram' }, { v: 'both', l: 'Facebook+Instagram' }].map(o => (
              <button key={o.v} onClick={() => setPlatform(o.v)} style={{ flex: 1, padding: '9px', fontSize: 13, borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'Inter', border: `1px solid ${platform === o.v ? 'var(--brand-border)' : 'var(--border)'}`, color: platform === o.v ? 'var(--brand-dark)' : 'var(--text-secondary)', background: platform === o.v ? 'var(--brand-bg)' : 'var(--bg-card)', fontWeight: platform === o.v ? 600 : 400, transition: 'all 150ms' }}>{o.l}</button>
            ))}</div>
          </div>
          {error && <div style={{ padding: '10px 14px', marginBottom: 14, background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius)', color: 'var(--error)', fontSize: 13 }}>{error}</div>}
          <button className="btn-primary" onClick={handleGenerate} disabled={loading || (!topic.trim() && !inputImage && !refImages.length)} style={{ width: '100%', padding: '11px' }}>
            {loading ? <><Loader2 size={15} style={{ animation: 'spin-slow 1s linear infinite' }} /> {isFree ? 'Pripravujem...' : 'Generujem...'}</> : <><Sparkles size={15} /> {isFree ? 'Vytvoriť manuálne' : 'Generovať'}</>}
          </button>
        </div>

        <Preview
          post={post} loading={loading}
          onPublish={handlePublish} onSchedule={handleSchedule} onRegenerate={handleGenerate}
          publishing={publishing} scheduling={scheduling}
          scheduledAt={scheduledAt} setScheduledAt={setScheduledAt}
          publishResult={publishResult}
          projectId={projectId}
          onOpenLibrary={() => setShowLibrary(true)}
          onImageChange={(url) => setPost(prev => prev ? { ...prev, image_url: url } : null)}
        />
      </div>
    </>
  )
}

/* ─── TAB 2: Image-Only Generator ────────────────────────────────── */
function ImageGenerator({ projectId }: { projectId: string }) {
  const [topic, setTopic] = useState('')
  const [outputFormat, setOutputFormat] = useState<'post' | 'story'>('post')
  const [refImages, setRefImages] = useState<{ url: string; thumb: string }[]>([])
  const [showInputLibrary2, setShowInputLibrary2] = useState(false)
  const [inputImage, setInputImage] = useState<{ url: string; base64: string; mime: string } | null>(null)
  const [imgHovering2, setImgHovering2] = useState(false)
  const imgFileRef2 = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleImgFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      const [header, base64] = result.split(',')
      setInputImage({ url: result, base64, mime: header.replace('data:', '').replace(';base64', '') })
    }
    reader.readAsDataURL(file); e.target.value = ''
  }

  function handleImgLibrarySelect(url: string) {
    setShowInputLibrary2(false)
    setInputImage({ url, base64: '', mime: 'image/jpeg' })
    fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(d => { if (d.base64) setInputImage(prev => prev ? { ...prev, base64: d.base64, mime: d.mime || 'image/jpeg' } : null) })
      .catch(() => {})
  }

  async function handleGenerate() {
    if (!topic.trim()) return
    setLoading(true); setError(null); setImageUrl(null)
    try {
      const platform = outputFormat === 'story' ? 'instagram_story' : 'instagram'
      const body: Record<string, unknown> = {
        topic: topic.trim() || 'Obrázok k priloženej fotke', projectId, mode: 'image-only', platform,
        ...(refImages.length > 0 ? { referenceImageUrls: refImages.map(r => r.url) } : {}),
      }
      if (inputImage?.base64) { body.imageData = inputImage.base64; body.imageMime = inputImage.mime }
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImageUrl(data.imageUrl)
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Chyba') }
    finally { setLoading(false) }
  }

  return (
    <>
      {showInputLibrary2 && <LibraryPicker projectId={projectId} onSelect={handleImgLibrarySelect} onClose={() => setShowInputLibrary2(false)} />}
    <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Generovať obrázok</h2>
        {/* Input image (Fotka k obrázku) – hore ako v Post/Story */}
        <div style={{ marginBottom: 18 }}>
          <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>Fotka k obrázku <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(voliteľňá)</span></label>
          {inputImage ? (
            <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer' }}
              onMouseEnter={() => setImgHovering2(true)} onMouseLeave={() => setImgHovering2(false)}>
              <img src={inputImage.url} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: imgHovering2 ? 1 : 0, transition: 'opacity 200ms' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#111' }}>
                  <Camera size={13} /> Zmeniť
                  <input type="file" accept="image/*" onChange={handleImgFileUpload} style={{ display: 'none' }} />
                </label>
                <button onClick={() => setInputImage(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', background: 'white', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#dc2626', border: 'none' }}>
                  × Odstrániť
                </button>
              </div>
              {!inputImage.base64 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={22} color="white" style={{ animation: 'spin-slow 1s linear infinite' }} /></div>}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 'var(--radius)', border: '2px dashed var(--border)', background: 'var(--bg-hover)', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-bg)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-hover)' }}>
                <Upload size={16} /> Nahrať foto
                <input type="file" accept="image/*" onChange={handleImgFileUpload} style={{ display: 'none' }} />
              </label>
              <button onClick={() => setShowInputLibrary2(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-bg)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}>
                <Library size={16} /> Z knižnice
              </button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="input-label">Čo zobrazuje</label>
          <textarea className="input-field" rows={3} value={topic} onChange={e => setTopic(e.target.value)} placeholder="Napr. čerstvý burger s hranolkami na drevenej doske..." style={{ resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <RefImagePicker projectId={projectId} value={refImages} onChange={setRefImages} />
        </div>

        {/* Format selector */}
        <div style={{ marginBottom: 18 }}>
          <label className="input-label">Formát</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {([
              { v: 'post' as const, label: '🖼️ Post', desc: '1:1 štvorec' },
              { v: 'story' as const, label: '📱 Story', desc: '9:16 na výšku' },
            ] as { v: 'post' | 'story'; label: string; desc: string }[]).map(f => (
              <button key={f.v} onClick={() => setOutputFormat(f.v)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'Inter',
                border: `1px solid ${outputFormat === f.v ? 'var(--brand-border)' : 'var(--border)'}`,
                background: outputFormat === f.v ? 'var(--brand-bg)' : 'var(--bg-card)', transition: 'all 150ms',
              }}>
                <div style={{ width: f.v === 'story' ? 14 : 20, height: f.v === 'story' ? 24 : 20, border: `2px solid ${outputFormat === f.v ? 'var(--brand)' : 'var(--text-muted)'}`, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: outputFormat === f.v ? 600 : 500, color: outputFormat === f.v ? 'var(--brand-dark)' : 'var(--text-primary)' }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>


        {error && <div style={{ padding: '10px 14px', marginBottom: 14, background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius)', color: 'var(--error)', fontSize: 13 }}>{error}</div>}
        <button className="btn-primary" onClick={handleGenerate} disabled={loading || (!topic.trim() && !inputImage)} style={{ width: '100%', padding: '11px' }}>
          {loading ? <><Loader2 size={15} style={{ animation: 'spin-slow 1s linear infinite' }} /> Generujem...</> : <><ImageIcon size={15} /> Vytvoriť obrázok</>}
        </button>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          Výsledok {imageUrl && <span className="badge badge-green">Hotovo</span>}
          {imageUrl && <span className="badge">{outputFormat === 'story' ? '📱 Story' : '🖼️ Post'}</span>}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Loader2 size={28} color="var(--text-faint)" style={{ margin: '0 auto 12px', animation: 'spin-slow 1s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>AI generuje obrázok...</p>
          </div>
        ) : imageUrl ? (
          <div>
            <img src={imageUrl} alt="" style={{ width: '100%', borderRadius: 'var(--radius)', aspectRatio: outputFormat === 'story' ? '9/16' : '1', objectFit: 'cover', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <a href={imageUrl} download className="btn-secondary" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}><Download size={14} /> Stiahnuť</a>
              <SaveToLibraryButton imageUrl={imageUrl} projectId={projectId} source="generated" postType={outputFormat} />
              <button className="btn-ghost" onClick={handleGenerate} style={{ fontSize: 12 }}><RefreshCw size={13} /> Znova</button>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '64px 0' }}><ImageIcon /><p>Tu sa zobrazí vygenerovaný obrázok</p></div>
        )}
      </div>
    </div>
    </>
  )
}

/* ─── TAB 3: Photo Enhancer ──────────────────────────────────────── */
function PhotoEnhancer({ projectId }: { projectId: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [enhanceMode, setEnhanceMode] = useState('professional')
  const [outputFormat, setOutputFormat] = useState<'post' | 'story'>('post')
  const [refImages, setRefImages] = useState<{ url: string; thumb: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f); setResultUrl(null)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  async function handleEnhance() {
    if (!file) return
    setLoading(true); setError(null); setResultUrl(null)
    try {
      const fd = new FormData()
      fd.append('image', file); fd.append('projectId', projectId); fd.append('enhanceMode', enhanceMode); fd.append('outputFormat', outputFormat)
      if (refImages.length > 0) fd.append('referenceImageUrls', JSON.stringify(refImages.map(r => r.url)))
      const res = await fetch('/api/enhance', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResultUrl(data.imageUrl)
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Chyba') }
    finally { setLoading(false) }
  }

  return (
    <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Photo Enhancer</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Nahrajte amatérsku fotku a AI ju vylepší na profi úroveň vo vašom brand štýle.</p>

        <div onClick={() => fileRef.current?.click()} style={{
          border: `2px dashed ${preview ? 'var(--brand-border)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)', padding: preview ? 0 : '40px 24px',
          textAlign: 'center', cursor: 'pointer', marginBottom: 18,
          background: preview ? 'transparent' : 'var(--bg-hover)', transition: 'all 150ms', overflow: 'hidden',
        }}>
          {preview ? (
            <img src={preview} alt="" style={{ width: '100%', borderRadius: 'var(--radius)', aspectRatio: outputFormat === 'story' ? '9/16' : '1', objectFit: 'cover' }} />
          ) : (
            <>
              <Upload size={28} color="var(--text-faint)" style={{ marginBottom: 8 }} />
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>Kliknite pre nahratie fotky</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>JPG, PNG do 10MB</p>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        </div>

        {/* Format selector */}
        <div style={{ marginBottom: 18 }}>
          <label className="input-label">Formát výstupu</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {([
              { v: 'post' as const, label: '🖼️ Post', desc: '1:1 štvorec', ratio: '1 / 1' },
              { v: 'story' as const, label: '📱 Story', desc: '9:16 na výšku', ratio: '9 / 16' },
            ] as { v: 'post' | 'story'; label: string; desc: string; ratio: string }[]).map(f => (
              <button key={f.v} onClick={() => setOutputFormat(f.v)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'Inter',
                border: `1px solid ${outputFormat === f.v ? 'var(--brand-border)' : 'var(--border)'}`,
                background: outputFormat === f.v ? 'var(--brand-bg)' : 'var(--bg-card)', transition: 'all 150ms',
              }}>
                <div style={{ width: outputFormat === f.v && f.v === 'story' ? 16 : 20, height: outputFormat === f.v && f.v === 'post' ? 20 : f.v === 'story' ? 28 : 20, border: `2px solid ${outputFormat === f.v ? 'var(--brand)' : 'var(--text-muted)'}`, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: outputFormat === f.v ? 600 : 500, color: outputFormat === f.v ? 'var(--brand-dark)' : 'var(--text-primary)' }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="input-label">Typ vylepšenia</label>
          <div className="grid-2" style={{ gap: 6 }}>
            {ENHANCE_MODES.map(m => {
              const Icon = m.icon
              return (
                <button key={m.id} onClick={() => setEnhanceMode(m.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter',
                  border: `1px solid ${enhanceMode === m.id ? 'var(--brand-border)' : 'var(--border)'}`,
                  background: enhanceMode === m.id ? 'var(--brand-bg)' : 'var(--bg-card)', transition: 'all 150ms',
                }}>
                  <Icon size={16} color={enhanceMode === m.id ? 'var(--brand)' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ fontWeight: enhanceMode === m.id ? 600 : 500, fontSize: 13, color: enhanceMode === m.id ? 'var(--brand-dark)' : 'var(--text-primary)' }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <RefImagePicker projectId={projectId} value={refImages} onChange={setRefImages} />
        </div>

        {error && <div style={{ padding: '10px 14px', marginBottom: 14, background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius)', color: 'var(--error)', fontSize: 13 }}>{error}</div>}
        <button className="btn-primary" onClick={handleEnhance} disabled={loading || !file} style={{ width: '100%', padding: '11px', opacity: (!file || loading) ? 0.5 : 1 }}>
          {loading ? <><Loader2 size={15} style={{ animation: 'spin-slow 1s linear infinite' }} /> Vylepšujem...</> : <><Wand2 size={15} /> Vylepšiť fotku</>}
        </button>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          Výsledok {resultUrl && <span className="badge badge-green">Hotovo</span>}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Loader2 size={28} color="var(--text-faint)" style={{ margin: '0 auto 12px', animation: 'spin-slow 1s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>AI vylepšuje fotku...</p>
            <p style={{ color: 'var(--text-faint)', fontSize: 11, marginTop: 4 }}>Toto môže trvať 15-30 sekúnd</p>
          </div>
        ) : resultUrl ? (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span className="badge badge-brand" style={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>Pred</span>
                {preview && <img src={preview} alt="Original" style={{ width: '100%', borderRadius: 'var(--radius)', aspectRatio: outputFormat === 'story' ? '9/16' : '1', objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <span className="badge badge-green" style={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>Po</span>
                <img src={resultUrl} alt="Enhanced" style={{ width: '100%', borderRadius: 'var(--radius)', aspectRatio: outputFormat === 'story' ? '9/16' : '1', objectFit: 'cover' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <a href={resultUrl} download className="btn-primary" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}><Download size={14} /> Stiahnuť</a>
              <SaveToLibraryButton imageUrl={resultUrl} projectId={projectId} source="enhanced" postType={outputFormat} />
              <button className="btn-ghost" onClick={handleEnhance}><RefreshCw size={13} /> Znova</button>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '64px 0' }}>
            <Wand2 />
            <p>Nahrajte fotku a vyberte typ vylepšenia</p>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>Pred → Po porovnanie</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Preview component ──────────────────────────────────────────── */
function Preview({ post, loading, onPublish, onSchedule, onRegenerate, publishing, scheduling, scheduledAt, setScheduledAt, publishResult, projectId, onOpenLibrary, onImageChange }: {
  post: Post | null; loading: boolean; onPublish: () => void; onSchedule: () => void; onRegenerate: () => void
  publishing: boolean; scheduling: boolean; scheduledAt: string; setScheduledAt: (v: string) => void
  publishResult: { facebook?: string; instagram?: string } | null
  projectId: string; onOpenLibrary: () => void
  onImageChange: (url: string) => void
}) {
  const [imgMode, setImgMode] = useState<'none' | 'generate' | 'edit' | 'library'>('none')
  const [imgPrompt, setImgPrompt] = useState('')
  const [imgLoading, setImgLoading] = useState(false)

  function toggleMode(m: typeof imgMode) {
    setImgMode(prev => prev === m ? 'none' : m)
    if (m === 'library') { onOpenLibrary(); setImgMode('none') }
  }

  async function handleGenerateNew() {
    if (!imgPrompt.trim()) return
    setImgLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: imgPrompt, projectId, mode: 'image-only', platform: 'instagram' }),
      })
      const data = await res.json()
      if (data.imageUrl) { onImageChange(data.imageUrl); setImgMode('none'); setImgPrompt('') }
    } finally { setImgLoading(false) }
  }

  async function handleEditWithPrompt() {
    if (!imgPrompt.trim() || !post?.image_url) return
    setImgLoading(true)
    try {
      const proxy = await fetch(`/api/proxy-image?url=${encodeURIComponent(post.image_url)}`)
      const proxyData = await proxy.json()
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: imgPrompt, projectId, mode: 'image-only', platform: 'instagram',
          imageData: proxyData.base64, imageMime: proxyData.mime,
        }),
      })
      const data = await res.json()
      if (data.imageUrl) { onImageChange(data.imageUrl); setImgMode('none'); setImgPrompt('') }
    } finally { setImgLoading(false) }
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        Náhľad {post && <span className="badge badge-green">Hotovo</span>}
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Loader2 size={28} color="var(--text-faint)" style={{ margin: '0 auto 12px', animation: 'spin-slow 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>AI generuje príspevok...</p>
        </div>
      ) : post ? (
        <div>
          {/* Image section */}
          {post.image_url ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ position: 'relative' }}>
                <img src={post.image_url} alt="" style={{ width: '100%', borderRadius: 'var(--radius)', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
                  <SaveToLibraryButton imageUrl={post.image_url} projectId={projectId} source="generated" postType={post.post_type as "post" | "story"} />
                </div>
              </div>

              {/* Image action toolbar */}
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                <button onClick={() => toggleMode('generate')} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '7px 4px', borderRadius: 'var(--radius)', border: `1px solid ${imgMode === 'generate' ? 'var(--brand-border)' : 'var(--border)'}`,
                  background: imgMode === 'generate' ? 'var(--brand-bg)' : 'var(--bg-base)',
                  color: imgMode === 'generate' ? 'var(--brand-dark)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'Inter', transition: 'all 150ms',
                }}>
                  <RefreshCw size={12} /> Nový obrázok
                </button>
                <button onClick={() => toggleMode('edit')} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '7px 4px', borderRadius: 'var(--radius)', border: `1px solid ${imgMode === 'edit' ? 'var(--brand-border)' : 'var(--border)'}`,
                  background: imgMode === 'edit' ? 'var(--brand-bg)' : 'var(--bg-base)',
                  color: imgMode === 'edit' ? 'var(--brand-dark)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'Inter', transition: 'all 150ms',
                }}>
                  <Wand2 size={12} /> Upraviť promptom
                </button>
                <button onClick={() => toggleMode('library')} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '7px 4px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                  background: 'var(--bg-base)', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'Inter', transition: 'all 150ms',
                }}>
                  <Library size={12} /> Z knižnice
                </button>
              </div>

              {/* Prompt panel */}
              {(imgMode === 'generate' || imgMode === 'edit') && (
                <div style={{
                  marginTop: 8, padding: '12px', borderRadius: 'var(--radius)',
                  background: 'var(--bg-hover)', border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {imgMode === 'generate'
                      ? '🎨 Nový obrázok – zadať čo má obrázok zobrazovať'
                      : '✏️ Upraviť – popíš čo chceš zmeniť na tomto obrázku'}
                    <PromptHelper fieldType="image" onUse={text => setImgPrompt(text)} projectId={projectId} />
                  </div>
                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder={imgMode === 'generate' ? 'Napr. čerstvý burger na drevenom stole, prírodzené svetlo...' : 'Napr. pridaj viac zeleného listia, zmeň pozadie na bíelem...'}
                    value={imgPrompt}
                    onChange={e => setImgPrompt(e.target.value)}
                    style={{ resize: 'none', marginBottom: 8, fontSize: 12 }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-brand"
                      onClick={imgMode === 'generate' ? handleGenerateNew : handleEditWithPrompt}
                      disabled={imgLoading || !imgPrompt.trim()}
                      style={{ flex: 1, padding: '8px', fontSize: 12, opacity: (imgLoading || !imgPrompt.trim()) ? 0.5 : 1 }}
                    >
                      {imgLoading
                        ? <><Loader2 size={13} style={{ animation: 'spin-slow 1s linear infinite' }} /> Generujem...</>
                        : <><Sparkles size={13} /> {imgMode === 'generate' ? 'Vytvoriť nový' : 'Upraviť'}</>
                      }
                    </button>
                    <button onClick={() => { setImgMode('none'); setImgPrompt('') }} className="btn-ghost" style={{ fontSize: 12 }}>Zrušiť</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ width: '100%', aspectRatio: '1', borderRadius: 'var(--radius)', background: 'var(--bg-hover)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
              <ImageIcon size={24} />
              <span style={{ fontSize: 12 }}>Bez obrázku</span>
              <button className="btn-ghost" onClick={onOpenLibrary} style={{ fontSize: 12 }}><Library size={13} /> Vybrať z knižnice</button>
            </div>
          )}
          <div style={{ padding: '12px 14px', background: 'var(--bg-hover)', borderRadius: 'var(--radius)', marginBottom: 16 }}>
            <p style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{post.caption}</p>
          </div>
          {post.status === 'published' ? (
            <div style={{ padding: '14px', borderRadius: 'var(--radius)', background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><CheckCircle2 size={15} color="var(--success)" /><span style={{ color: 'var(--success)', fontSize: 14, fontWeight: 600 }}>Publikované</span></div>
              {publishResult?.facebook && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>FB: {publishResult.facebook}</p>}
              {publishResult?.instagram && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>IG: {publishResult.instagram}</p>}
              <button className="btn-ghost" onClick={onRegenerate} style={{ marginTop: 8, fontSize: 12 }}><RefreshCw size={13} /> Ďalší</button>
            </div>
          ) : post.status === 'scheduled' ? (
            <div style={{ padding: '12px', borderRadius: 'var(--radius)', background: 'var(--success-bg)', border: '1px solid var(--success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--success)', fontWeight: 600, fontSize: 13 }}><CheckCircle2 size={14} /> Naplánovaný</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn-brand" onClick={onPublish} disabled={publishing} style={{ width: '100%', padding: '10px', opacity: publishing ? 0.6 : 1 }}>
                {publishing ? <><Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> Publikujem...</> : <><Send size={14} /> Publikovať teraz</>}
              </button>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="datetime-local" className="input-field" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={{ flex: 1, fontSize: 12 }} />
                <button className="btn-secondary" onClick={onSchedule} disabled={scheduling || !scheduledAt} style={{ opacity: (scheduling || !scheduledAt) ? 0.4 : 1 }}><CalendarPlus size={14} /> Naplánovať</button>
              </div>
              <button className="btn-ghost" onClick={onRegenerate} style={{ fontSize: 12 }}><RefreshCw size={13} /> Znova</button>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '48px 0' }}><Sparkles /><p>Tu sa zobrazí príspevok</p></div>
      )}
    </div>
  )
}

/* ═════════════════════════════ IMAGE UPSCALER ═════════════════════════════ */
function ImageUpscaler({ projectId }: { projectId: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [scaleLevel, setScaleLevel] = useState<'2k' | '4k'>('2k')
  const [loading, setLoading] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [origDimensions, setOrigDimensions] = useState<{ w: number; h: number } | null>(null)
  const [showLibrary, setShowLibrary] = useState(false)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f); setResultUrl(null); setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      setPreview(url)
      // Get dimensions
      const img = new Image()
      img.onload = () => setOrigDimensions({ w: img.naturalWidth, h: img.naturalHeight })
      img.src = url
    }
    reader.readAsDataURL(f)
  }

  async function handleLibrarySelect(url: string) {
    setShowLibrary(false); setResultUrl(null); setError(null)
    setPreview(url)
    // Load the image from URL and create a File object
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const f = new File([blob], 'library-image.jpg', { type: blob.type })
      setFile(f)
      const img = new Image()
      img.onload = () => setOrigDimensions({ w: img.naturalWidth, h: img.naturalHeight })
      img.src = url
    } catch { /* ignore */ }
  }

  async function handleUpscale() {
    if (!file) return
    setLoading(true); setError(null); setResultUrl(null)
    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('projectId', projectId)
      fd.append('scaleLevel', scaleLevel)
      const res = await fetch('/api/upscale', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResultUrl(data.imageUrl)
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Chyba') }
    finally { setLoading(false) }
  }

  const scaleInfo: Record<string, { label: string; desc: string; res: string }> = {
    '2k': { label: '2K', desc: 'Vysoká kvalita', res: '~2048px' },
    '4k': { label: '4K', desc: 'Ultra kvalita', res: '~4096px' },
  }

  return (
    <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Picture Upscale</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
            Nahrajte obrázok alebo vyberte z knižnice a AI ho upscalne na vyššie rozlíšenie bez straty kvality.
        </p>

        {/* Upload area */}
        <div onClick={() => fileRef.current?.click()} style={{
          border: `2px dashed ${preview ? 'var(--brand-border)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)', padding: preview ? 0 : '40px 24px',
          textAlign: 'center', cursor: 'pointer', marginBottom: 12,
          background: preview ? 'transparent' : 'var(--bg-hover)', transition: 'all 150ms', overflow: 'hidden',
        }}>
          {preview ? (
            <img src={preview} alt="" style={{ width: '100%', borderRadius: 'var(--radius)', maxHeight: 360, objectFit: 'contain' }} />
          ) : (
            <>
              <Upload size={28} color="var(--text-faint)" style={{ marginBottom: 8 }} />
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>Kliknite pre nahratie obrázku</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>JPG, PNG, WebP – AI zvýši rozlíšenie</p>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        </div>

        {/* Library picker button */}
        <button onClick={() => setShowLibrary(!showLibrary)} className="btn-ghost" style={{ width: '100%', marginBottom: 14, fontSize: 12, justifyContent: 'center' }}>
          <Library size={13} /> Vybrať z knižnice obrázkov
        </button>

        {showLibrary && <LibraryPicker projectId={projectId} onSelect={handleLibrarySelect} onClose={() => setShowLibrary(false)} />}

        {/* Original dimensions info */}
        {origDimensions && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            background: 'var(--bg-hover)', borderRadius: 'var(--radius)', marginBottom: 14,
            fontSize: 12, color: 'var(--text-muted)',
          }}>
            <ImageIcon size={13} />
            <span>Originál: <strong style={{ color: 'var(--text-primary)' }}>{origDimensions.w} × {origDimensions.h}px</strong></span>
          </div>
        )}

        {/* Scale level selector */}
        <div style={{ marginBottom: 18 }}>
          <label className="input-label">Cieľové rozlíšenie</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['2k', '4k'] as const).map(level => {
              const info = scaleInfo[level]
              const active = scaleLevel === level
              return (
                <button key={level} onClick={() => setScaleLevel(level)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'Inter',
                  border: `1px solid ${active ? 'var(--brand-border)' : 'var(--border)'}`,
                  background: active ? 'var(--brand-bg)' : 'var(--bg-card)', transition: 'all 150ms',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? 'var(--brand)' : 'var(--bg-hover)',
                  }}>
                    <ZoomIn size={18} color={active ? '#FFF' : 'var(--text-muted)'} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: active ? 700 : 600, fontSize: 14, color: active ? 'var(--brand-dark)' : 'var(--text-primary)' }}>
                      {info.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{info.desc} · {info.res}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {error && <div style={{ padding: '10px 14px', marginBottom: 14, background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius)', color: 'var(--error)', fontSize: 13 }}>{error}</div>}

        <button className="btn-primary" onClick={handleUpscale} disabled={loading || !file} style={{ width: '100%', padding: '11px', opacity: (!file || loading) ? 0.5 : 1 }}>
          {loading ? <><Loader2 size={15} style={{ animation: 'spin-slow 1s linear infinite' }} /> Upscalujem...</> : <><ZoomIn size={15} /> Upscalovať na {scaleInfo[scaleLevel].label}</>}
        </button>
      </div>

      {/* Result panel */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          Výsledok {resultUrl && <span className="badge badge-green">Hotovo</span>}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Loader2 size={28} color="var(--text-faint)" style={{ margin: '0 auto 12px', animation: 'spin-slow 1s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>AI upscaluje obrázok na {scaleInfo[scaleLevel].label}...</p>
            <p style={{ color: 'var(--text-faint)', fontSize: 11, marginTop: 4 }}>Toto môže trvať 15-30 sekúnd</p>
          </div>
        ) : resultUrl ? (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span className="badge badge-brand" style={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>Originál</span>
                {preview && <img src={preview} alt="Original" style={{ width: '100%', borderRadius: 'var(--radius)', maxHeight: 300, objectFit: 'contain' }} />}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <span className="badge badge-green" style={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>{scaleInfo[scaleLevel].label}</span>
                <img src={resultUrl} alt="Upscaled" style={{ width: '100%', borderRadius: 'var(--radius)', maxHeight: 300, objectFit: 'contain' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <a href={resultUrl} download className="btn-primary" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}><Download size={14} /> Stiahnuť {scaleInfo[scaleLevel].label}</a>
              <SaveToLibraryButton imageUrl={resultUrl} projectId={projectId} source="enhanced" />
              <button className="btn-ghost" onClick={handleUpscale}><RefreshCw size={13} /> Znova</button>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '64px 0' }}>
            <ZoomIn />
            <p>Nahrajte obrázok a vyberte rozlíšenie</p>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>Originál → {scaleInfo[scaleLevel].label} porovnanie</p>
          </div>
        )}
      </div>
    </div>
  )
}

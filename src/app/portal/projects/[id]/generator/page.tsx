'use client'

import { useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Sparkles, Send, CalendarPlus, RefreshCw, ImageIcon, Loader2,
  CheckCircle2, Upload, Wand2, Camera, FileText, Download,
  BookmarkPlus, BookmarkCheck, Library, Smartphone, Link, PenLine,
} from 'lucide-react'
import ImageEditor from '../images/ImageEditor'

type Post = { id: string; image_url: string | null; caption: string | null; status: string; post_type?: string }
type Tab = 'post' | 'story' | 'image' | 'enhance'
type LibraryImage = { id: string; image_url: string; source: string; title: string | null; created_at: string }

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
function SaveToLibraryButton({ imageUrl, projectId, source, onSaved }: {
  imageUrl: string; projectId: string; source: 'generated' | 'enhanced'; onSaved?: () => void
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
        body: JSON.stringify({ imageUrl, projectId, source }),
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
                  <img src={img.image_url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '4px 6px', fontSize: 10, color: 'var(--text-muted)', textAlign: 'left', background: 'var(--bg-hover)' }}>
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

export default function ProjectGeneratorPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('post')

  return (
    <div>
      {/* Tab switcher */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: 'var(--bg-card)', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)', padding: 4, width: 'fit-content',
      }}>
        {[
          { id: 'post' as Tab, label: 'Príspevok', icon: FileText },
          { id: 'story' as Tab, label: 'Story', icon: Smartphone },
          { id: 'image' as Tab, label: 'Obrázok', icon: ImageIcon },
          { id: 'enhance' as Tab, label: 'Photo Enhancer', icon: Wand2 },
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

      {tab === 'post' && <PostGenerator projectId={projectId} />}
      {tab === 'story' && <StoryGenerator projectId={projectId} />}
      {tab === 'image' && <ImageGenerator projectId={projectId} />}
      {tab === 'enhance' && <PhotoEnhancer projectId={projectId} />}
    </div>
  )
}

/* ─── TAB: Story Generator ───────────────────────────────────────── */
function StoryGenerator({ projectId }: { projectId: string }) {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState<'facebook_story' | 'instagram_story' | 'both_stories'>('both_stories')
  const [loading, setLoading] = useState(false)
  const [post, setPost] = useState<Post | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState<{ facebook?: string; instagram?: string; errors?: string[] } | null>(null)
  const [editingImage, setEditingImage] = useState(false)

  const suggestions = ['Ranná akcia', 'Flash sale 24h', 'Za kulisami', 'Nový produkt', 'Špeciálna ponuka dnes', 'Motivácia dňa']

  const [initialEditorLayers, setInitialEditorLayers] = useState<{
    id: string; x: number; y: number; text: string
    font: string; size: number; bold: boolean; italic: boolean
    underline: boolean; color: string; align: 'left' | 'center' | 'right'
    shadow: boolean; strokeColor: string; strokeWidth: number; maxWidth: number
  }[] | undefined>(undefined)

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
    if (!topic.trim()) return
    setLoading(true); setError(null); setPost(null); setPublishResult(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), platform, projectId, mode: 'post', postType: 'story' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPost(data.post)

      // Auto-open editor with ONE clean headline text layer
      if (data.post?.image_url) {
        const headline = makeHeadline(data.post.caption || topic)
        setInitialEditorLayers([{
          id: `story-text-${Date.now()}`,
          x: 197, y: 510,
          text: headline,
          font: 'Outfit', size: 52, bold: true, italic: false,
          underline: false, color: '#ffffff', align: 'center',
          shadow: true, strokeColor: '#000000', strokeWidth: 2, maxWidth: 360,
        }])
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
      {editingImage && post?.image_url && (
        <ImageEditor
          imageUrl={post.image_url}
          projectId={projectId}
          initialLayers={initialEditorLayers}
          onClose={() => { setEditingImage(false); setInitialEditorLayers(undefined) }}
          onSaved={async (newUrl) => {
            setEditingImage(false)
            setInitialEditorLayers(undefined)
            await fetch('/api/posts', {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: post!.id, image_url: newUrl }),
            })
            setPost(p => p ? { ...p, image_url: newUrl } : null)
          }}
        />
      )}
    <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
      {/* LEFT: Controls */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Smartphone size={16} color="var(--brand)" />
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>Generovať Story</h2>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Story sa generujú vo formáte 9:16 (na výšku) optimalizovanom pre Instagram a Facebook Stories.</p>

        <div style={{ marginBottom: 18 }}>
          <label className="input-label">Téma Story</label>
          <textarea className="input-field" rows={3} placeholder="Popíšte o čom má story byť..." value={topic} onChange={e => setTopic(e.target.value)} style={{ resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Rýchle návrhy</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => setTopic(s)} style={{ padding: '5px 12px', fontSize: 12, borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 500, fontFamily: 'Inter', border: `1px solid ${topic === s ? 'var(--brand-border)' : 'var(--border)'}`, color: topic === s ? 'var(--brand-dark)' : 'var(--text-secondary)', background: topic === s ? 'var(--brand-bg)' : 'var(--bg-card)', transition: 'all 150ms' }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="input-label">Publikovať ako</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {([
              { v: 'both_stories', l: '✨ FB Story + IG Story', d: 'Obidve platformy' },
              { v: 'instagram_story', l: '📸 Instagram Story', d: 'Len Instagram' },
              { v: 'facebook_story', l: '📘 Facebook Story', d: 'Len Facebook' },
            ] as const).map(o => (
              <button key={o.v} onClick={() => setPlatform(o.v)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'Inter',
                border: `1px solid ${platform === o.v ? 'var(--brand-border)' : 'var(--border)'}`,
                background: platform === o.v ? 'var(--brand-bg)' : 'var(--bg-card)', transition: 'all 150ms',
              }}>
                <span style={{ fontSize: 13, fontWeight: platform === o.v ? 600 : 400, color: platform === o.v ? 'var(--brand-dark)' : 'var(--text-primary)' }}>{o.l}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.d}</span>
              </button>
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
          <Smartphone size={15} color="var(--brand)" />
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
function PostGenerator({ projectId }: { projectId: string }) {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('both')
  const [loading, setLoading] = useState(false)
  const [post, setPost] = useState<Post | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [publishResult, setPublishResult] = useState<{ facebook?: string; instagram?: string } | null>(null)
  const [showLibrary, setShowLibrary] = useState(false)
  const [showInputLibrary, setShowInputLibrary] = useState(false)
  // image attached before generation
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
      const body: Record<string, unknown> = { topic: topic.trim() || 'Príspevok k priloženej fotke', platform, projectId, mode: 'post' }
      if (inputImage?.base64) {
        body.imageData = inputImage.base64
        body.imageMime = inputImage.mime
      }
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

  const suggestions = ['Nová akcia', 'Denná ponuka', 'Špeciálna udalosť', 'Sezónny produkt', 'Happy hour', 'Novinka']

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
            <label className="input-label">Téma</label>
            <textarea className="input-field" rows={3} placeholder="Popíšte, o čom má byť príspevok..." value={topic} onChange={(e) => setTopic(e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Rýchle návrhy</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{suggestions.map(s => (
              <button key={s} onClick={() => setTopic(s)} style={{ padding: '5px 12px', fontSize: 12, borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 500, fontFamily: 'Inter', border: `1px solid ${topic === s ? 'var(--brand-border)' : 'var(--border)'}`, color: topic === s ? 'var(--brand-dark)' : 'var(--text-secondary)', background: topic === s ? 'var(--brand-bg)' : 'var(--bg-card)', transition: 'all 150ms' }}>{s}</button>
            ))}</div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="input-label">Platforma</label>
            <div style={{ display: 'flex', gap: 6 }}>{[{ v: 'facebook', l: 'Facebook' }, { v: 'instagram', l: 'Instagram' }, { v: 'both', l: 'Obidva' }].map(o => (
              <button key={o.v} onClick={() => setPlatform(o.v)} style={{ flex: 1, padding: '9px', fontSize: 13, borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'Inter', border: `1px solid ${platform === o.v ? 'var(--brand-border)' : 'var(--border)'}`, color: platform === o.v ? 'var(--brand-dark)' : 'var(--text-secondary)', background: platform === o.v ? 'var(--brand-bg)' : 'var(--bg-card)', fontWeight: platform === o.v ? 600 : 400, transition: 'all 150ms' }}>{o.l}</button>
            ))}</div>
          </div>
          {error && <div style={{ padding: '10px 14px', marginBottom: 14, background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius)', color: 'var(--error)', fontSize: 13 }}>{error}</div>}
          <button className="btn-primary" onClick={handleGenerate} disabled={loading || !topic.trim()} style={{ width: '100%', padding: '11px' }}>
            {loading ? <><Loader2 size={15} style={{ animation: 'spin-slow 1s linear infinite' }} /> Generujem...</> : <><Sparkles size={15} /> Generovať</>}
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
  const [style, setStyle] = useState('modern-minimal')
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (!topic.trim()) return
    setLoading(true); setError(null); setImageUrl(null)
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: `${topic}. Style: ${style}`, projectId, mode: 'image-only', platform: 'instagram' }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImageUrl(data.imageUrl)
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Chyba') }
    finally { setLoading(false) }
  }

  return (
    <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Generovať obrázok</h2>
        <div style={{ marginBottom: 18 }}>
          <label className="input-label">Čo zobrazuje</label>
          <textarea className="input-field" rows={3} value={topic} onChange={e => setTopic(e.target.value)} placeholder="Napr. čerstvý burger s hranolkami na drevenej doske..." style={{ resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="input-label">Vizuálny štýl</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {STYLE_PRESETS.map(p => (
              <button key={p.id} onClick={() => setStyle(p.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--radius)',
                border: `1px solid ${style === p.id ? 'var(--brand-border)' : 'var(--border)'}`,
                background: style === p.id ? 'var(--brand-bg)' : 'var(--bg-card)',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter', transition: 'all 150ms',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: style === p.id ? 'var(--brand)' : 'var(--text-faint)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: style === p.id ? 600 : 500, fontSize: 13, color: style === p.id ? 'var(--brand-dark)' : 'var(--text-primary)' }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && <div style={{ padding: '10px 14px', marginBottom: 14, background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius)', color: 'var(--error)', fontSize: 13 }}>{error}</div>}
        <button className="btn-primary" onClick={handleGenerate} disabled={loading || !topic.trim()} style={{ width: '100%', padding: '11px' }}>
          {loading ? <><Loader2 size={15} style={{ animation: 'spin-slow 1s linear infinite' }} /> Generujem...</> : <><ImageIcon size={15} /> Vytvoriť obrázok</>}
        </button>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          Výsledok {imageUrl && <span className="badge badge-green">Hotovo</span>}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Loader2 size={28} color="var(--text-faint)" style={{ margin: '0 auto 12px', animation: 'spin-slow 1s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>AI generuje obrázok...</p>
          </div>
        ) : imageUrl ? (
          <div>
            <img src={imageUrl} alt="" style={{ width: '100%', borderRadius: 'var(--radius)', aspectRatio: '1', objectFit: 'cover', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <a href={imageUrl} download className="btn-secondary" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}><Download size={14} /> Stiahnuť</a>
              <SaveToLibraryButton imageUrl={imageUrl} projectId={projectId} source="generated" />
              <button className="btn-ghost" onClick={handleGenerate} style={{ fontSize: 12 }}><RefreshCw size={13} /> Znova</button>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '64px 0' }}><ImageIcon /><p>Tu sa zobrazí vygenerovaný obrázok</p></div>
        )}
      </div>
    </div>
  )
}

/* ─── TAB 3: Photo Enhancer ──────────────────────────────────────── */
function PhotoEnhancer({ projectId }: { projectId: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [enhanceMode, setEnhanceMode] = useState('professional')
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
      fd.append('image', file); fd.append('projectId', projectId); fd.append('enhanceMode', enhanceMode)
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
            <img src={preview} alt="" style={{ width: '100%', borderRadius: 'var(--radius)', aspectRatio: '1', objectFit: 'cover' }} />
          ) : (
            <>
              <Upload size={28} color="var(--text-faint)" style={{ marginBottom: 8 }} />
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>Kliknite pre nahratie fotky</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>JPG, PNG do 10MB</p>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
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
                {preview && <img src={preview} alt="Original" style={{ width: '100%', borderRadius: 'var(--radius)', aspectRatio: '1', objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <span className="badge badge-green" style={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>Po</span>
                <img src={resultUrl} alt="Enhanced" style={{ width: '100%', borderRadius: 'var(--radius)', aspectRatio: '1', objectFit: 'cover' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <a href={resultUrl} download className="btn-primary" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}><Download size={14} /> Stiahnuť</a>
              <SaveToLibraryButton imageUrl={resultUrl} projectId={projectId} source="enhanced" />
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
                  <SaveToLibraryButton imageUrl={post.image_url} projectId={projectId} source="generated" />
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
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    {imgMode === 'generate'
                      ? '🎨 Nový obrázok – zadať čo má obrázok zobrazovať'
                      : '✏️ Upraviť – popíš čo chceš zmeniť na tomto obrázku'}
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

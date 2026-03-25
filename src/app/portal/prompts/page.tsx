'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Wand2, Plus, Star, Trash2, Copy, Check, Loader2,
  ImageIcon, Upload, Sparkles, Search, Filter, PenLine,
  X, ArrowRight, FileText, Palette, Camera, FolderKanban
} from 'lucide-react'

type Prompt = {
  id: string; project_id: string; user_id: string
  title: string; prompt_text: string; category: string
  source_image_url: string | null; is_favorite: boolean
  created_at: string; updated_at: string
}

type ProjectInfo = { id: string; name: string; brand_colors: { primary?: string } | null }

const CATS = [
  { id: 'all', label: 'Všetky', icon: Filter },
  { id: 'brand', label: 'Brand', icon: Palette },
  { id: 'image', label: 'Obrázky', icon: Camera },
  { id: 'text', label: 'Texty', icon: FileText },
  { id: 'general', label: 'Všeobecné', icon: PenLine },
]

export default function PromptHelperPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  // Creator state
  const [showCreator, setShowCreator] = useState(false)
  const [creatorMode, setCreatorMode] = useState<'text' | 'image'>('text')
  const [userInput, setUserInput] = useState('')
  const [creatorCategory, setCreatorCategory] = useState('general')
  const [creatorTitle, setCreatorTitle] = useState('')
  const [creatorProject, setCreatorProject] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [creatorError, setCreatorError] = useState<string | null>(null)

  // Image mode
  const [imgUrl, setImgUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [libImages, setLibImages] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  // Edit state
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    // Load user's projects
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: projs } = await supabase
      .from('projects')
      .select('id, name, brand_colors')
      .order('name')
    setProjects(projs || [])
    if (projs?.length && !creatorProject) setCreatorProject(projs[0].id)

    // Load all prompts for all user projects
    if (projs?.length) {
      const allPrompts: Prompt[] = []
      for (const p of projs) {
        const res = await fetch(`/api/prompt-templates?projectId=${p.id}`)
        const data = await res.json()
        if (data.prompts) allPrompts.push(...data.prompts)
      }
      // Sort: favorites first, then newest
      allPrompts.sort((a, b) => {
        if (a.is_favorite !== b.is_favorite) return b.is_favorite ? 1 : -1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      setPrompts(allPrompts)
    }
    setLoading(false)
  }

  async function loadLibImages() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load ALL images from image_library across all projects for this user
    const { data } = await supabase
      .from('image_library')
      .select('image_url, title, project_id')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200)

    setLibImages((data || []).map(x => x.image_url).filter(Boolean))
    setShowLibrary(true)
  }

  async function handleUpload(file: File) {
    if (!creatorProject) return
    setUploading(true)
    const supabase = createClient()
    const filename = `${creatorProject}/prompt-ref-${Date.now()}.${file.name.split('.').pop()}`
    await supabase.storage.from('post-images').upload(filename, file, { upsert: true, contentType: file.type })
    const { data } = supabase.storage.from('post-images').getPublicUrl(filename)
    setImgUrl(data.publicUrl)
    setUploading(false)
  }

  async function generateFromText() {
    if (!userInput.trim()) return
    setGenerating(true); setCreatorError(null)
    try {
      const res = await fetch('/api/prompt-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput, fieldType: creatorCategory === 'brand' ? 'brand' : creatorCategory === 'image' ? 'image' : 'general' }),
      })
      const data = await res.json()
      if (data.prompt) setGeneratedPrompt(data.prompt)
      else setCreatorError(data.error || 'Chyba')
    } catch { setCreatorError('Sieťová chyba') }
    setGenerating(false)
  }

  async function generateFromImage() {
    if (!imgUrl) return
    setGenerating(true); setCreatorError(null)
    try {
      const res = await fetch('/api/image-to-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imgUrl, userText: userInput, fieldType: creatorCategory === 'brand' ? 'brand' : 'image' }),
      })
      const data = await res.json()
      if (data.prompt) setGeneratedPrompt(data.prompt)
      else setCreatorError(data.error || 'Chyba')
    } catch { setCreatorError('Sieťová chyba') }
    setGenerating(false)
  }

  async function savePrompt() {
    if (!generatedPrompt.trim() || !creatorProject) return
    const res = await fetch('/api/prompt-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: creatorProject,
        title: creatorTitle || `Prompt ${new Date().toLocaleDateString('sk')}`,
        promptText: generatedPrompt,
        category: creatorCategory,
        sourceImageUrl: imgUrl || null,
      }),
    })
    const data = await res.json()
    if (data.prompt) {
      setPrompts(prev => [data.prompt, ...prev])
      resetCreator()
    }
  }

  async function toggleFavorite(p: Prompt) {
    await fetch('/api/prompt-templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, isFavorite: !p.is_favorite }),
    })
    setPrompts(prev => prev.map(x => x.id === p.id ? { ...x, is_favorite: !x.is_favorite } : x))
  }

  async function deletePrompt(id: string) {
    if (!confirm('Vymazať tento prompt?')) return
    await fetch(`/api/prompt-templates?id=${id}`, { method: 'DELETE' })
    setPrompts(prev => prev.filter(x => x.id !== id))
  }

  async function saveEdit(id: string) {
    await fetch('/api/prompt-templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, promptText: editText }),
    })
    setPrompts(prev => prev.map(x => x.id === id ? { ...x, prompt_text: editText } : x))
    setEditId(null)
  }

  function copyPrompt(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  function resetCreator() {
    setShowCreator(false); setUserInput(''); setGeneratedPrompt('')
    setCreatorTitle(''); setCreatorError(null); setImgUrl('')
    setCreatorMode('text'); setShowLibrary(false)
  }

  function getProjectName(id: string) {
    return projects.find(p => p.id === id)?.name || '—'
  }
  function getProjectColor(id: string) {
    return projects.find(p => p.id === id)?.brand_colors?.primary || 'var(--brand)'
  }

  const filtered = prompts
    .filter(p => filter === 'all' || p.category === filter)
    .filter(p => projectFilter === 'all' || p.project_id === projectFilter)
    .filter(p =>
      !search.trim() || p.prompt_text.toLowerCase().includes(search.toLowerCase())
      || p.title.toLowerCase().includes(search.toLowerCase())
    )

  const catColors: Record<string, string> = {
    brand: '#F59E0B', image: '#8B5CF6', text: '#0EA5E9', general: '#6B7280',
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 2 }}>Prompt Helper</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Knižnica promptov pre konzistentný AI output naprieč projektmi</p>
        </div>
        <button onClick={() => setShowCreator(true)} className="btn-primary" style={{ fontSize: 13 }}>
          <Plus size={14} /> Nový prompt
        </button>
      </div>

      {/* Filters & search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {CATS.map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: '1px solid', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              background: filter === c.id ? 'var(--brand-bg)' : 'var(--bg-card)',
              borderColor: filter === c.id ? 'var(--brand-border)' : 'var(--border)',
              color: filter === c.id ? 'var(--brand-dark)' : 'var(--text-secondary)',
              fontFamily: 'Inter',
            }}
          >
            <c.icon size={12} /> {c.label}
          </button>
        ))}
      </div>

      {/* Project filter + search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FolderKanban size={13} color="var(--text-muted)" />
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
            className="input-field" style={{ fontSize: 12, width: 180, padding: '6px 10px' }}>
            <option value="all">Všetky projekty</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Hľadať..." className="input-field"
            style={{ paddingLeft: 30, width: 180, fontSize: 12 }}
          />
        </div>
      </div>

      {/* Prompt cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
          <Loader2 size={20} style={{ animation: 'spin-slow 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Wand2 size={28} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {prompts.length === 0 ? 'Zatiaľ žiadne prompty. Vytvorte prvý!' : 'Žiadne výsledky pre filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(p => (
            <div key={p.id} className="card" style={{ padding: '16px 20px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Category + project + title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                      background: `${catColors[p.category] || '#6B7280'}15`,
                      color: catColors[p.category] || '#6B7280',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      {p.category}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                      background: `${getProjectColor(p.project_id)}12`,
                      color: getProjectColor(p.project_id),
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: getProjectColor(p.project_id) }} />
                      {getProjectName(p.project_id)}
                    </span>
                    {p.title && (
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</span>
                    )}
                    {p.is_favorite && <Star size={12} fill="#F59E0B" color="#F59E0B" />}
                  </div>

                  {/* Prompt text */}
                  {editId === p.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea className="input-field" rows={4} value={editText} onChange={e => setEditText(e.target.value)} style={{ fontSize: 13 }} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => saveEdit(p.id)} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>Uložiť</button>
                        <button onClick={() => setEditId(null)} className="btn-ghost" style={{ fontSize: 12 }}>Zrušiť</button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{p.prompt_text}</p>
                  )}

                  {/* Source image thumbnail */}
                  {p.source_image_url && (
                    <div style={{ marginTop: 8 }}>
                      <img src={p.source_image_url} alt=""
                        style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => toggleFavorite(p)} title="Obľúbené"
                    style={{ padding: 6, borderRadius: 6, background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: p.is_favorite ? '#F59E0B' : 'var(--text-muted)' }}>
                    <Star size={13} fill={p.is_favorite ? '#F59E0B' : 'none'} />
                  </button>
                  <button onClick={() => copyPrompt(p.prompt_text, p.id)} title="Kopírovať"
                    style={{ padding: 6, borderRadius: 6, background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {copied === p.id ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                  </button>
                  <button onClick={() => { setEditId(p.id); setEditText(p.prompt_text) }} title="Upraviť"
                    style={{ padding: 6, borderRadius: 6, background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <PenLine size={13} />
                  </button>
                  <button onClick={() => deletePrompt(p.id)} title="Vymazať"
                    style={{ padding: 6, borderRadius: 6, background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {/* Timestamp */}
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                {new Date(p.created_at).toLocaleDateString('sk', { day: '2-digit', month: '2-digit', year: 'numeric' })} · {new Date(p.created_at).toLocaleTimeString('sk', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ CREATOR MODAL ═══ */}
      {showCreator && (
        <div onClick={e => { if (e.target === e.currentTarget) resetCreator() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, animation: 'fadeInOverlay 150ms ease-out',
          }}>
          <div style={{
            width: '100%', maxWidth: 580,
            background: '#FFFFFF', borderRadius: 16,
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
            overflow: 'hidden', animation: 'slideUpModal 200ms ease-out',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid var(--border)',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.04) 0%, rgba(245,158,11,0.04) 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #8B5CF6, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={16} color="#FFF" strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Vytvoriť nový prompt</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Popíšte alebo nahrajte obrázok → AI vytvorí profesionálny prompt</div>
                </div>
              </div>
              <button onClick={resetCreator} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Mode tabs */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'text' as const, label: 'Text → Prompt', icon: PenLine },
                  { id: 'image' as const, label: 'Obrázok → Prompt', icon: ImageIcon },
                ].map(m => (
                  <button key={m.id} onClick={() => { setCreatorMode(m.id); setGeneratedPrompt(''); setCreatorError(null) }}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: creatorMode === m.id ? 'var(--brand-bg)' : 'var(--bg-hover)',
                      border: `1px solid ${creatorMode === m.id ? 'var(--brand-border)' : 'var(--border)'}`,
                      color: creatorMode === m.id ? 'var(--brand-dark)' : 'var(--text-secondary)',
                      cursor: 'pointer', fontFamily: 'Inter',
                    }}>
                    <m.icon size={14} /> {m.label}
                  </button>
                ))}
              </div>

              {/* Project + Category + title */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Projekt</label>
                  <select value={creatorProject} onChange={e => setCreatorProject(e.target.value)} className="input-field" style={{ fontSize: 12 }}>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Kategória</label>
                  <select value={creatorCategory} onChange={e => setCreatorCategory(e.target.value)} className="input-field" style={{ fontSize: 12 }}>
                    <option value="brand">Brand</option>
                    <option value="image">Obrázky</option>
                    <option value="text">Texty</option>
                    <option value="general">Všeobecné</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Názov (voliteľné)</label>
                <input type="text" value={creatorTitle} onChange={e => setCreatorTitle(e.target.value)} className="input-field" placeholder="Napr. Letná kolekcia vizuál" style={{ fontSize: 12 }} />
              </div>

              {/* Image mode */}
              {creatorMode === 'image' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Zdrojový obrázok</label>
                  {imgUrl ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, background: 'var(--bg-hover)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <img src={imgUrl} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Obrázok načítaný. AI analyzuje vizuálny štýl.</p>
                        <button onClick={() => setImgUrl('')} className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>Zmeniť</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => fileRef.current?.click()}
                        style={{
                          flex: 1, padding: '20px 14px', borderRadius: 10, border: '2px dashed var(--border)',
                          background: 'var(--bg-hover)', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                          alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, fontFamily: 'Inter',
                        }}>
                        {uploading ? <Loader2 size={18} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Upload size={18} />}
                        Nahrať obrázok
                      </button>
                      <button onClick={() => loadLibImages()}
                        style={{
                          flex: 1, padding: '20px 14px', borderRadius: 10, border: '2px dashed var(--border)',
                          background: 'var(--bg-hover)', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                          alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, fontFamily: 'Inter',
                        }}>
                        <ImageIcon size={18} />
                        Z knižnice
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]) }} />
                    </div>
                  )}

                  {/* Library grid */}
                  {showLibrary && (
                    <div style={{ marginTop: 10, padding: 12, background: 'var(--bg-hover)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Vyberte obrázok z knižnice:</div>
                      {libImages.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                          {libImages.map((url, i) => (
                            <img key={i} src={url} alt="" onClick={() => { setImgUrl(url); setShowLibrary(false) }}
                              style={{
                                width: '100%', aspectRatio: '1', borderRadius: 8, objectFit: 'cover',
                                cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 150ms',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
                              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                            />
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Žiadne obrázky naprieč vašimi projektmi.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Text input */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  {creatorMode === 'image' ? 'Doplnkový popis (voliteľné)' : 'Váš popis vlastnými slovami'}
                </label>
                <textarea
                  value={userInput} onChange={e => setUserInput(e.target.value)}
                  placeholder={creatorMode === 'image'
                    ? 'Napr. chcem zachytiť tú farebnú paletu a osvetlenie...'
                    : 'Napr. sme moderná kaviareň v centre Bratislavy, cielime na mladých ľudí...'
                  }
                  rows={3} className="input-field" style={{ resize: 'vertical', fontSize: 13 }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      creatorMode === 'image' ? generateFromImage() : generateFromText()
                    }
                  }}
                />
              </div>

              {/* Generate button */}
              <button
                onClick={creatorMode === 'image' ? generateFromImage : generateFromText}
                disabled={generating || (creatorMode === 'text' ? !userInput.trim() : !imgUrl)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 20px', width: '100%',
                  background: (generating || (creatorMode === 'text' ? !userInput.trim() : !imgUrl)) ? '#E5E7EB' : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                  color: (generating || (creatorMode === 'text' ? !userInput.trim() : !imgUrl)) ? '#9CA3AF' : '#FFF',
                  border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: (generating || (creatorMode === 'text' ? !userInput.trim() : !imgUrl)) ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter', transition: 'all 200ms',
                }}
              >
                {generating
                  ? <><Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> Generujem prompt...</>
                  : <><Wand2 size={14} /> {creatorMode === 'image' ? 'Analyzovať obrázok' : 'Vytvoriť profesionálny prompt'}</>
                }
              </button>

              {creatorError && (
                <div style={{ padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 8, color: 'var(--error)', fontSize: 12 }}>
                  {creatorError}
                </div>
              )}

              {/* Result */}
              {generatedPrompt && (
                <div style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', animation: 'slideUpModal 200ms ease-out' }}>
                  <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'rgba(139,92,246,0.04)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vygenerovaný prompt</span>
                  </div>
                  <div style={{ padding: 14 }}>
                    <textarea value={generatedPrompt} onChange={e => setGeneratedPrompt(e.target.value)} rows={5} className="input-field" style={{ resize: 'vertical', fontSize: 13, background: '#FFF' }} />
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Môžete text ešte upraviť pred uložením.</div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {generatedPrompt && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--bg-hover)' }}>
                <button onClick={() => { setGeneratedPrompt(''); setCreatorError(null) }} className="btn-ghost" style={{ fontSize: 13 }}>
                  Regenerovať
                </button>
                <button onClick={savePrompt}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px',
                    background: 'var(--brand)', color: '#FFF', border: 'none', borderRadius: 10,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter',
                    boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                  }}>
                  Uložiť prompt <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

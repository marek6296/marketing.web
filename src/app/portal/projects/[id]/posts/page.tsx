'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  FileText, Loader2, Trash2, CheckCircle2,
  Edit3, X, Save, Copy, Sparkles, RefreshCw,
  Share2, Globe, ImageIcon, ChevronRight, Info, MousePointerClick,
  Upload, Library, Camera, Send, AlertCircle,
} from 'lucide-react'

type Post = {
  id: string
  caption: string | null
  image_url: string | null
  platform: string
  topic: string | null
  status: string
  created_at: string
  scheduled_at: string | null
  fb_post_id: string | null
  ig_post_id: string | null
}

type LibraryImage = { id: string; image_url: string; source: string }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft:     { label: 'Koncept',     color: 'var(--text-muted)',  bg: 'var(--bg-hover)',   border: 'var(--border)' },
  published: { label: 'Publikovaný', color: 'var(--success)',     bg: 'var(--success-bg)', border: 'var(--success-border)' },
  scheduled: { label: 'Naplánovaný', color: 'var(--brand-dark)',  bg: 'var(--brand-bg)',   border: 'var(--brand-border)' },
  failed:    { label: 'Zlyhalo',     color: 'var(--error)',       bg: 'var(--error-bg)',   border: 'var(--error-border)' },
}

/* ─── Library Picker modal ───────────────────────────────────────── */
function LibraryPicker({ projectId, onSelect, onClose }: {
  projectId: string
  onSelect: (url: string) => void
  onClose: () => void
}) {
  const [images, setImages] = useState<LibraryImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/images?projectId=${projectId}`)
      .then(r => r.json())
      .then(d => { setImages(d.images || []); setLoading(false) })
  }, [projectId])

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 20, width: 520, maxHeight: '70vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Library size={15} color="var(--brand)" /> Vybrať z knižnice
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Loader2 size={22} style={{ animation: 'spin-slow 1s linear infinite', color: 'var(--text-muted)' }} />
            </div>
          ) : images.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
              Knižnica je prázdna. Uložte obrázky z Generátora.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {images.map(img => (
                <button
                  key={img.id}
                  onClick={() => onSelect(img.image_url)}
                  style={{ padding: 0, border: '2px solid transparent', borderRadius: 'var(--radius)', cursor: 'pointer', overflow: 'hidden', background: 'none', transition: 'border-color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                >
                  <img src={img.image_url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Post Detail Drawer ─────────────────────────────────────────── */
function PostDrawer({ post, projectId, onClose, onUpdate, onDelete, hasMetaToken }: {
  post: Post
  projectId: string
  onClose: () => void
  onUpdate: (updated: Post) => void
  onDelete: (id: string) => void
  hasMetaToken: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [editCaption, setEditCaption] = useState(post.caption || '')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishPlatform, setPublishPlatform] = useState<'facebook' | 'instagram' | 'both'>('both')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [generatingImg, setGeneratingImg] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [hovering, setHovering] = useState(false)
  const sc = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft
  // Post is on a platform if it's published and has social IDs
  const hasSocialPost = post.status === 'published' && !!(post.fb_post_id || post.ig_post_id)
  const socialLabel = [post.fb_post_id && 'Facebook', post.ig_post_id && 'Instagram'].filter(Boolean).join(' & ')

  async function patchPost(fields: Record<string, unknown>) {
    const res = await fetch('/api/posts', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id, ...fields }),
    })
    return res.ok
  }

  async function handleSaveCaption() {
    setSaving(true)
    if (await patchPost({ caption: editCaption })) { onUpdate({ ...post, caption: editCaption }); setEditing(false) }
    setSaving(false)
  }

  async function handleManualPublish() {
    setPublishing(true)
    if (await patchPost({ status: 'published' })) onUpdate({ ...post, status: 'published' })
    setPublishing(false)
  }

  async function handleMetaPublish() {
    setPublishing(true)
    setPublishError(null)
    try {
      // First update the post's platform
      await patchPost({ platform: publishPlatform })
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPublishError(data.error || 'Chyba pri publikovaní')
      } else {
        onUpdate({ ...post, status: 'published', platform: publishPlatform })
      }
    } catch {
      setPublishError('Sieťová chyba – skúste znova')
    } finally {
      setPublishing(false)
    }
  }

  async function handleDelete(deleteSocial = false) {
    setDeleting(true)
    setShowDeleteConfirm(false)
    const res = await fetch(`/api/posts?id=${post.id}${deleteSocial ? '&deleteSocial=true' : ''}`, { method: 'DELETE' })
    const data = await res.json()
    setDeleting(false)
    if (data.socialErrors?.length > 0) {
      // Deleted from portal but social deletion had issues – show warning, keep drawer open
      setDeleteWarning(`Vymazané z portálu. Problém so sociálnymi sieťami: ${data.socialErrors.join(' | ')}`)
      onDelete(post.id) // Remove from list, but keep drawer showing the warning
    } else {
      onDelete(post.id); onClose()
    }
  }

  function handleDeleteClick() {
    if (hasSocialPost) {
      setShowDeleteConfirm(true) // Show the modal
    } else {
      handleDelete(false) // Draft/scheduled - just delete from DB
    }
  }

  function handleCopy() {
    if (!post.caption) return
    navigator.clipboard.writeText(post.caption)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    try {
      // Upload to Supabase Storage via our API
      const fd = new FormData()
      fd.append('file', file)
      fd.append('projectId', projectId)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url && await patchPost({ image_url: data.url })) {
        onUpdate({ ...post, image_url: data.url })
      }
    } finally { setUploadingImg(false) }
  }

  async function handleLibrarySelect(url: string) {
    setShowLibrary(false)
    if (await patchPost({ image_url: url })) onUpdate({ ...post, image_url: url })
  }

  async function handleRemoveImage() {
    if (await patchPost({ image_url: null })) onUpdate({ ...post, image_url: null })
  }

  async function handleGenerateImage() {
    setGeneratingImg(true)
    try {
      const topic = post.caption
        ? post.caption.substring(0, 300).replace(/#\S+/g, '').trim()
        : 'marketing post'
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, projectId, mode: 'image-only', platform: 'instagram' }),
      })
      const data = await res.json()
      if (data.imageUrl && await patchPost({ image_url: data.imageUrl })) {
        onUpdate({ ...post, image_url: data.imageUrl })
      }
    } finally { setGeneratingImg(false) }
  }

  return (
    <>
      {showLibrary && (
        <LibraryPicker projectId={projectId} onSelect={handleLibrarySelect} onClose={() => setShowLibrary(false)} />
      )}

      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 101,
        width: 420, background: 'var(--bg-card)', borderLeft: '1px solid var(--border)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', overflowY: 'auto', padding: 24,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
              {sc.label}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {new Date(post.created_at).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Image section ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Obrázok</span>
            {post.image_url && (
              <button onClick={handleRemoveImage} className="btn-ghost" style={{ fontSize: 11, color: 'var(--error)', padding: '3px 8px' }}>
                <X size={11} /> Odstrániť
              </button>
            )}
          </div>

          {post.image_url ? (
            /* Existing image – hover to show edit overlay */
            <div
              style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer' }}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              <img src={post.image_url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
              {/* Edit overlay */}
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: hovering ? 1 : 0, transition: 'opacity 200ms',
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'white', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#111' }}>
                  <Camera size={14} /> Zmeniť foto
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
                <button
                  onClick={() => setShowLibrary(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'white', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#111', border: 'none' }}
                >
                  <Library size={14} /> Knižnica
                </button>
              </div>
              {/* Upload spinner */}
              {uploadingImg && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 size={30} color="white" style={{ animation: 'spin-slow 1s linear infinite' }} />
                </div>
              )}
            </div>
          ) : (
            /* No image – 3 options: upload, library, AI generate */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '18px 8px', borderRadius: 'var(--radius)', border: '2px dashed var(--border)',
                background: 'var(--bg-hover)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, transition: 'all 150ms', textAlign: 'center',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-bg)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
              >
                {uploadingImg ? <Loader2 size={18} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Upload size={18} />}
                <span>{uploadingImg ? 'Nahrávam...' : 'Nahrať fotku'}</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploadingImg} />
              </label>
              <button
                onClick={() => setShowLibrary(true)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '18px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                  background: 'var(--bg-card)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, transition: 'all 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-bg)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}
              >
                <Library size={18} />
                <span>Z knižnice</span>
              </button>
              <button
                onClick={handleGenerateImage}
                disabled={generatingImg}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '18px 8px', borderRadius: 'var(--radius)',
                  border: '1px solid var(--brand-border)', background: 'var(--brand-bg)',
                  cursor: generatingImg ? 'wait' : 'pointer', fontSize: 12, color: 'var(--brand-dark)', fontWeight: 600, transition: 'all 150ms',
                }}
                onMouseEnter={e => { if (!generatingImg) { e.currentTarget.style.background = 'var(--brand)'; e.currentTarget.style.color = 'white' } }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--brand-bg)'; e.currentTarget.style.color = 'var(--brand-dark)' }}
              >
                {generatingImg
                  ? <Loader2 size={18} style={{ animation: 'spin-slow 1s linear infinite' }} />
                  : <Sparkles size={18} />}
                <span>{generatingImg ? 'Generujem...' : 'Generovať AI'}</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Caption ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Text príspevku</span>
            {!editing && (
              <button onClick={() => { setEditing(true); setEditCaption(post.caption || '') }} className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}>
                <Edit3 size={12} /> Upraviť
              </button>
            )}
          </div>
          {editing ? (
            <div>
              <textarea
                className="input-field"
                value={editCaption}
                onChange={e => setEditCaption(e.target.value)}
                rows={8}
                style={{ resize: 'vertical', fontSize: 13, lineHeight: 1.6 }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button className="btn-primary" onClick={handleSaveCaption} disabled={saving} style={{ flex: 1, fontSize: 13 }}>
                  {saving ? <Loader2 size={13} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Save size={13} />} Uložiť
                </button>
                <button className="btn-ghost" onClick={() => setEditing(false)} style={{ fontSize: 13 }}><X size={13} /> Zrušiť</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '12px 14px', background: 'var(--bg-hover)', borderRadius: 'var(--radius)', maxHeight: 200, overflowY: 'auto' }}>
              <p style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0, color: 'var(--text-primary)' }}>
                {post.caption || <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>Bez textu</span>}
              </p>
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          {(post.status === 'draft' || post.status === 'failed') && (
            <>
              {post.status === 'failed' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius)' }}>
                  <AlertCircle size={13} color="var(--error)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--error)', fontWeight: 600 }}>Publikovanie zlyhalo – skúste znova</span>
                </div>
              )}
              {hasMetaToken ? (
                <>
                  {/* Platform selector */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['facebook', 'instagram', 'both'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setPublishPlatform(p)}
                        style={{
                          flex: 1, padding: '8px 4px', borderRadius: 'var(--radius)', cursor: 'pointer',
                          border: `1px solid ${publishPlatform === p ? 'var(--brand)' : 'var(--border)'}`,
                          background: publishPlatform === p ? 'var(--brand-bg)' : 'var(--bg-base)',
                          color: publishPlatform === p ? 'var(--brand-dark)' : 'var(--text-muted)',
                          fontSize: 11, fontWeight: 600, fontFamily: 'Inter',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        }}
                      >
                        {p === 'facebook' ? '📘 Facebook' : p === 'instagram' ? '📸 Instagram' : '✨ Obe'}
                      </button>
                    ))}
                  </div>
                  {publishError && (
                    <div style={{ display: 'flex', gap: 8, padding: '9px 12px', borderRadius: 'var(--radius)', background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
                      <AlertCircle size={13} color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 12, color: 'var(--error)', margin: 0, lineHeight: 1.5 }}>{publishError}</p>
                    </div>
                  )}
                  <button className="btn-brand" onClick={handleMetaPublish} disabled={publishing} style={{ padding: '11px', opacity: publishing ? 0.6 : 1 }}>
                    {publishing
                      ? <><Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> Publikujem...</>
                      : <><Send size={14} /> {post.status === 'failed' ? 'Skúsiť znova' : `Publikovať na ${publishPlatform === 'both' ? 'Facebook & Instagram' : publishPlatform === 'facebook' ? 'Facebook' : 'Instagram'}`}</> }
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'var(--accent-sky-bg)', border: '1px solid var(--accent-sky-light)', borderRadius: 'var(--radius)' }}>
                    <Info size={13} color="var(--accent-sky)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12, color: 'var(--accent-sky)', lineHeight: 1.5, margin: 0 }}>
                      Pre automatické publikovanie pripojte Facebook / Instagram token v Nastaveniach projektu.
                    </p>
                  </div>
                  <button className="btn-brand" onClick={handleManualPublish} disabled={publishing} style={{ padding: '11px', opacity: publishing ? 0.6 : 1 }}>
                    {publishing
                      ? <><Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> Zverejňujem...</>
                      : <><MousePointerClick size={14} /> Označiť ako zverejnený</>}
                  </button>
                </>
              )}
            </>
          )}
          {post.status === 'published' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius)' }}>
              <CheckCircle2 size={14} color="var(--success)" />
              <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>Zverejnený</span>
            </div>
          )}
          <button className="btn-secondary" onClick={handleCopy}>
            {copied ? <><CheckCircle2 size={14} /> Skopírované!</> : <><Copy size={14} /> Kopírovať text</>}
          </button>
          {deleteWarning && (
            <div style={{ padding: '10px 12px', borderRadius: 'var(--radius)', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', fontSize: 12, color: 'var(--warning)', lineHeight: 1.5 }}>
              ⚠️ {deleteWarning}
            </div>
          )}
          <button className="btn-ghost" onClick={handleDeleteClick} disabled={deleting} style={{ color: 'var(--error)', fontSize: 13 }}>
            {deleting ? <Loader2 size={13} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Trash2 size={13} />} Odstrániť
          </button>
        </div>
      </div>
      {/* ── Delete confirmation modal ── */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          backdropFilter: 'blur(3px)',
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)', padding: 24, width: '100%', maxWidth: 320,
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Trash2 size={16} color="var(--error)" />
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Odstrániť príspevok?</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Tento príspevok je zverejnený na <strong>{socialLabel}</strong>. Chceš ho odstrániť aj tam?
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn-danger"
                onClick={() => handleDelete(true)}
                disabled={deleting}
                style={{ width: '100%', justifyContent: 'center', opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? <Loader2 size={13} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Trash2 size={13} />}
                Odstrániť aj z {socialLabel}
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleDelete(false)}
                disabled={deleting}
                style={{ width: '100%', justifyContent: 'center', opacity: deleting ? 0.6 : 1 }}
              >
                Len z portálu
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowDeleteConfirm(false)}
                style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
              >
                Zrušiť
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function ProjectPostsPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'scheduled'>('all')
  const [selected, setSelected] = useState<Post | null>(null)
  const [hasMetaToken, setHasMetaToken] = useState(false)

  // Read ?filter= from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const f = params.get('filter') as 'all' | 'draft' | 'published' | 'scheduled'
    if (f && ['all', 'draft', 'published', 'scheduled'].includes(f)) setFilter(f)
  }, [])

  // Load project meta token status
  useEffect(() => {
    fetch(`/api/projects/${projectId}/token-status`)
      .then(r => r.json())
      .then(d => setHasMetaToken(!!d.hasToken))
      .catch(() => {})
  }, [projectId])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/posts?projectId=${projectId}`)
    const data = await res.json()
    setPosts(data.posts || [])
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  function handleUpdate(updated: Post) {
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSelected(updated)
  }

  function handleDelete(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
    setSelected(null)
  }

  const filtered = posts.filter(p => filter === 'all' || p.status === filter)
  const stats = {
    all: posts.length,
    draft: posts.filter(p => p.status === 'draft').length,
    published: posts.filter(p => p.status === 'published').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
  }

  return (
    <div>
      {/* Drawer */}
      {selected && (
        <PostDrawer
          post={selected}
          projectId={projectId}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          hasMetaToken={hasMetaToken}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="var(--brand)" /> Príspevky
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {stats.all} príspevkov – {stats.draft} konceptov, {stats.published} publikovaných, {stats.scheduled} naplánovaných
          </p>
        </div>
        <button onClick={load} className="btn-ghost" style={{ fontSize: 12 }}>
          <RefreshCw size={13} /> Obnoviť
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {([['all', 'Všetky', stats.all], ['draft', 'Koncepty', stats.draft], ['published', 'Publikované', stats.published], ['scheduled', 'Naplánované', stats.scheduled]] as const).map(([id, label, count]) => (
          <button key={id} onClick={() => setFilter(id)} style={{
            padding: '8px 14px', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'Inter',
            border: `1px solid ${filter === id ? 'var(--brand-border)' : 'var(--border)'}`,
            background: filter === id ? 'var(--brand-bg)' : 'var(--bg-card)',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            color: filter === id ? 'var(--brand-dark)' : 'var(--text-secondary)',
            fontWeight: filter === id ? 600 : 400,
          }}>
            {label}
            <span style={{ background: filter === id ? 'var(--brand)' : 'var(--bg-hover)', color: filter === id ? 'white' : 'var(--text-muted)', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Loader2 size={28} style={{ animation: 'spin-slow 1s linear infinite', color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Načítavam príspevky...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <Sparkles size={40} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
          <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)', marginBottom: 6 }}>
            {posts.length === 0 ? 'Zatiaľ žiadne príspevky' : 'Žiadne výsledky'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {posts.length === 0 ? 'Generujte príspevky v sekcii Generátor.' : 'Skúste iný filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(post => {
            const sc = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft
            const PlatformIcon = post.platform === 'facebook' ? Share2 : Globe
            return (
              <div
                key={post.id}
                onClick={() => setSelected(post)}
                className="card"
                style={{
                  padding: '14px 16px', cursor: 'pointer', transition: 'all 150ms',
                  border: `1px solid ${selected?.id === post.id ? 'var(--brand)' : 'var(--border)'}`,
                  display: 'flex', gap: 14, alignItems: 'center',
                }}
                onMouseEnter={e => { if (selected?.id !== post.id) e.currentTarget.style.borderColor = 'var(--brand-border)' }}
                onMouseLeave={e => { if (selected?.id !== post.id) e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 'var(--radius)', flexShrink: 0, overflow: 'hidden', background: 'var(--bg-hover)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {post.image_url ? <img src={post.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={18} color="var(--text-faint)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                    <PlatformIcon size={11} color="var(--text-muted)" />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(post.created_at).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {post.caption || <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>Bez textu</span>}
                  </p>
                </div>
                <ChevronRight size={16} color="var(--text-faint)" style={{ flexShrink: 0 }} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

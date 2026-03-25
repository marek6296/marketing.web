'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Library, X, Loader2, Plus } from 'lucide-react'

const MAX = 3

type PickedImage = { url: string; thumb: string }  // url = uploaded/library URL

interface Props {
  projectId: string
  value: PickedImage[]
  onChange: (imgs: PickedImage[]) => void
}

type LibraryImg = { id: string; image_url: string; post_type?: string; source: string; is_favorite?: boolean }

export default function RefImagePicker({ projectId, value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'upload' | 'library'>('upload')
  const [library, setLibrary] = useState<LibraryImg[]>([])
  const [libLoaded, setLibLoaded] = useState(false)
  const [libLoading, setLibLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const loadLibrary = useCallback(async () => {
    if (libLoaded) return
    setLibLoading(true)
    try {
      const res = await fetch(`/api/images?projectId=${projectId}`)
      const data = await res.json()
      setLibrary(data.images || [])
      setLibLoaded(true)
    } finally { setLibLoading(false) }
  }, [projectId, libLoaded])

  function switchTab(t: 'upload' | 'library') {
    setTab(t)
    if (t === 'library') loadLibrary()
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const canAdd = MAX - value.length
    const toAdd = files.slice(0, canAdd)
    setUploading(true)
    try {
      const uploaded: PickedImage[] = []
      for (const file of toAdd) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('projectId', projectId)
        const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
        const data = await res.json()
        if (data.url) uploaded.push({ url: data.url, thumb: data.url })
      }
      onChange([...value, ...uploaded].slice(0, MAX))
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  function toggleLibraryImg(img: LibraryImg) {
    const already = value.find(v => v.url === img.image_url)
    if (already) {
      onChange(value.filter(v => v.url !== img.image_url))
    } else {
      if (value.length >= MAX) return
      onChange([...value, { url: img.image_url, thumb: img.image_url }])
    }
  }

  function remove(url: string) { onChange(value.filter(v => v.url !== url)) }

  async function toggleFavorite(e: React.MouseEvent, img: LibraryImg) {
    e.stopPropagation()
    const newFav = !img.is_favorite
    setLibrary(prev => prev.map(i => i.id === img.id ? { ...i, is_favorite: newFav } : i))
    try {
      await fetch('/api/images', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: img.id, is_favorite: newFav })
      })
      // Načítaj knižnicu s novým radením z API
      const res = await fetch(`/api/images?projectId=${projectId}`)
      const data = await res.json()
      setLibrary(data.images || [])
    } catch {
      setLibrary(prev => prev.map(i => i.id === img.id ? { ...i, is_favorite: !newFav } : i))
    }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '7px 0', fontSize: 12, fontWeight: active ? 600 : 500,
    cursor: 'pointer', border: 'none', fontFamily: 'Inter',
    background: active ? 'var(--bg-card)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    borderBottom: active ? '2px solid var(--brand)' : '2px solid transparent',
    transition: 'all 150ms',
  })

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg-card)' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Referenčné obrázky <span style={{ fontWeight: 400, color: 'var(--text-faint)' }}>({value.length}/{MAX})</span>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          <button style={tabStyle(tab === 'upload')} onClick={() => switchTab('upload')}>
            <Upload size={11} style={{ marginRight: 4, display: 'inline' }} />Nahrať z PC
          </button>
          <button style={tabStyle(tab === 'library')} onClick={() => switchTab('library')}>
            <Library size={11} style={{ marginRight: 4, display: 'inline' }} />Z knižnice
          </button>
        </div>
      </div>

      {/* Tab: Upload */}
      {tab === 'upload' && (
        <div style={{ padding: 12 }}>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={value.length >= MAX || uploading}
            style={{
              width: '100%', padding: '10px', border: '2px dashed var(--border)',
              borderRadius: 'var(--radius)', background: 'var(--bg-hover)',
              cursor: value.length >= MAX ? 'not-allowed' : 'pointer',
              color: 'var(--text-muted)', fontSize: 12, fontFamily: 'Inter',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: value.length >= MAX ? 0.5 : 1, transition: 'all 150ms',
            }}
          >
            {uploading
              ? <><Loader2 size={13} style={{ animation: 'spin-slow 1s linear infinite' }} /> Nahrávam...</>
              : <><Plus size={13} /> Pridať foto (max {MAX})</>}
          </button>
          <input
            ref={fileRef} type="file" multiple accept="image/*"
            onChange={handleFiles} style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Tab: Library */}
      {tab === 'library' && (
        <div style={{ padding: 12, maxHeight: 180, overflowY: 'auto' }}>
          {libLoading ? (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <Loader2 size={18} style={{ animation: 'spin-slow 1s linear infinite', color: 'var(--text-muted)' }} />
            </div>
          ) : library.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', padding: '12px 0' }}>
              Knižnica je prázdna
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {library.map(img => {
                const sel = value.some(v => v.url === img.image_url)
                return (
                  <button
                    key={img.id}
                    onClick={() => toggleLibraryImg(img)}
                    disabled={!sel && value.length >= MAX}
                    style={{
                      padding: 0, border: `2px solid ${sel ? 'var(--brand)' : 'transparent'}`,
                      borderRadius: 'var(--radius-sm)', overflow: 'hidden', cursor: !sel && value.length >= MAX ? 'not-allowed' : 'pointer',
                      background: 'none', position: 'relative', opacity: !sel && value.length >= MAX ? 0.4 : 1,
                      transition: 'border-color 150ms',
                    }}
                  >
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
                    <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', top: 4, left: 4, padding: '2px 4px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 9, borderRadius: 4, fontWeight: 500, backdropFilter: 'blur(4px)' }}>
                      {img.post_type === 'story' ? '📱' : '🖼️'}
                    </div>
                    <button 
                      onClick={(e) => toggleFavorite(e, img)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', color: img.is_favorite ? '#fbbf24' : 'rgba(255,255,255,0.7)', transition: 'all 150ms' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill={img.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </button>
                    {sel && (
                      <div style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontSize: 8, fontWeight: 700 }}>✓</span>
                      </div>
                    )}
                  </div>
                </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected thumbnails */}
      {value.length > 0 && (
        <div style={{ padding: '0 12px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {value.map(img => (
            <div key={img.url} style={{ position: 'relative', width: 52, height: 52 }}>
              <img src={img.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
              <button
                onClick={() => remove(img.url)}
                style={{
                  position: 'absolute', top: -6, right: -6, width: 18, height: 18,
                  borderRadius: '50%', background: 'var(--error)', border: '1px solid white',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                }}
              >
                <X size={10} color="white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

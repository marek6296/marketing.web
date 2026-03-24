'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ImageIcon, Trash2, Download, Loader2, Wand2, Sparkles, Search, Library } from 'lucide-react'

type LibraryImage = {
  id: string
  image_url: string
  source: string
  title: string | null
  created_at: string
}

export default function ProjectImagesPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [images, setImages] = useState<LibraryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'generated' | 'enhanced'>('all')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selected, setSelected] = useState<LibraryImage | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/images?projectId=${projectId}`)
    const data = await res.json()
    setImages(data.images || [])
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch(`/api/images?id=${id}`, { method: 'DELETE' })
    setImages(prev => prev.filter(img => img.id !== id))
    if (selected?.id === id) setSelected(null)
    setDeleting(null)
  }

  const filtered = images.filter(img => {
    const matchSource = filter === 'all' || img.source === filter
    const matchSearch = !search || img.title?.toLowerCase().includes(search.toLowerCase()) || img.source.includes(search.toLowerCase())
    return matchSource && matchSearch
  })

  const stats = {
    total: images.length,
    generated: images.filter(i => i.source === 'generated').length,
    enhanced: images.filter(i => i.source === 'enhanced').length,
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Library size={18} color="var(--brand)" /> Knižnica obrázkov
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {stats.total} obrázkov – {stats.generated} vygenerovaných, {stats.enhanced} vylepšených
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Všetky', value: stats.total, id: 'all' as const },
          { label: '🎨 Vygenerované', value: stats.generated, id: 'generated' as const },
          { label: '✨ Vylepšené', value: stats.enhanced, id: 'enhanced' as const },
        ].map(s => (
          <button key={s.id} onClick={() => setFilter(s.id)} style={{
            padding: '10px 16px', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'Inter',
            border: `1px solid ${filter === s.id ? 'var(--brand-border)' : 'var(--border)'}`,
            background: filter === s.id ? 'var(--brand-bg)' : 'var(--bg-card)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: filter === s.id ? 'var(--brand-dark)' : 'var(--text-primary)' }}>{s.value}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
          </button>
        ))}

        {/* Search */}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            placeholder="Hľadať..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 32, width: 200, fontSize: 13 }}
          />
        </div>
      </div>

      {/* Gallery + detail panel */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'start' }}>
        {/* Gallery grid */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Loader2 size={28} style={{ animation: 'spin-slow 1s linear infinite', color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Načítavam knižnicu...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: 'center' }}>
              <ImageIcon size={40} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
              <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {images.length === 0 ? 'Knižnica je prázdna' : 'Žiadne výsledky'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {images.length === 0 ? 'Generujte alebo vylepšite obrázky v Generátore a uložte ich sem.' : 'Skúste zmeniť filter alebo hľadaný výraz.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {filtered.map(img => (
                <div
                  key={img.id}
                  onClick={() => setSelected(img)}
                  style={{
                    borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer',
                    border: `2px solid ${selected?.id === img.id ? 'var(--brand)' : 'var(--border)'}`,
                    background: 'var(--bg-card)', transition: 'all 150ms',
                    boxShadow: selected?.id === img.id ? '0 0 0 3px var(--brand-bg)' : 'none',
                  }}
                >
                  <img
                    src={img.image_url}
                    alt=""
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {img.source === 'enhanced' ? <Wand2 size={11} color="var(--brand)" /> : <Sparkles size={11} color="var(--brand)" />}
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{img.source === 'enhanced' ? 'Enhanced' : 'Generated'}</span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(img.id) }}
                      disabled={deleting === img.id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 2 }}
                    >
                      {deleting === img.id ? <Loader2 size={11} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> : <Trash2 size={11} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="card" style={{ width: 280, flexShrink: 0, padding: 20, position: 'sticky', top: 20 }}>
            <img src={selected.image_url} alt="" style={{ width: '100%', borderRadius: 'var(--radius)', aspectRatio: '1', objectFit: 'cover', marginBottom: 14 }} />
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                {selected.source === 'enhanced' ? <Wand2 size={13} color="var(--brand)" /> : <Sparkles size={13} color="var(--brand)" />}
                <span className={`badge ${selected.source === 'enhanced' ? 'badge-brand' : 'badge-green'}`}>
                  {selected.source === 'enhanced' ? 'Vylepšený' : 'Vygenerovaný'}
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {new Date(selected.created_at).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <a
                href={selected.image_url}
                download
                className="btn-primary"
                style={{ justifyContent: 'center', textDecoration: 'none' }}
              >
                <Download size={14} /> Stiahnuť
              </a>
              <button
                className="btn-ghost"
                onClick={() => { navigator.clipboard.writeText(selected.image_url) }}
                style={{ fontSize: 12 }}
              >
                Kopírovať URL
              </button>
              <button
                className="btn-ghost"
                onClick={() => handleDelete(selected.id)}
                disabled={deleting === selected.id}
                style={{ fontSize: 12, color: 'var(--error)' }}
              >
                <Trash2 size={13} /> Odstrániť
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

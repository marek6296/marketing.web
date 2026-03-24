'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '@/app/actions/projects'
import { ArrowLeft, FolderPlus } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const result = await createProject(fd)
    if (result?.error) { setError(result.error); setSaving(false); return }
    if (result?.project) {
      router.push(`/portal/projects/${result.project.id}`)
    }
  }

  return (
    <div>
      <Link href="/portal/projects" className="btn-ghost" style={{ marginBottom: 16, display: 'inline-flex' }}>
        <ArrowLeft size={14} /> Späť na projekty
      </Link>

      <div className="page-header">
        <h1>Nový projekt</h1>
        <p>Vytvorte nový marketingový projekt. Nastavenia upravíte neskôr.</p>
      </div>

      <div className="card" style={{ padding: 28, maxWidth: 520 }}>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="input-label">Názov projektu</label>
            <input name="name" className="input-field" placeholder="Napr. Pizzeria Bella, Salon Glamour..." required autoFocus />
          </div>
          <div>
            <label className="input-label">Popis <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(voliteľné)</span></label>
            <textarea name="description" className="input-field" rows={2} placeholder="Krátky popis projektu – typ biznesu, cieľová skupina..." />
          </div>
          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius)', color: 'var(--error)', fontSize: 13 }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? 0.5 : 1 }}>
              <FolderPlus size={14} /> {saving ? 'Vytváram...' : 'Vytvoriť projekt'}
            </button>
            <Link href="/portal/projects" className="btn-secondary">Zrušiť</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

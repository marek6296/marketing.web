'use client'

import { useState, useRef, useEffect } from 'react'
import { Wand2, Loader2, ArrowRight, X, Sparkles, Copy, Check } from 'lucide-react'

interface Props {
  /** Which field type: 'brand' | 'image' | 'general' */
  fieldType?: 'brand' | 'image' | 'general'
  /** Called with the final prompt text when user clicks "Použiť" */
  onUse: (prompt: string) => void
  /** If provided, auto-saves to prompt library */
  projectId?: string
}

export default function PromptHelper({ fieldType = 'general', onUse, projectId }: Props) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); resetState() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function resetState() {
    setInput(''); setResult(''); setError(null); setLoading(false); setCopied(false)
  }

  async function generate() {
    if (!input.trim()) return
    setLoading(true); setError(null); setResult('')
    try {
      const res = await fetch('/api/prompt-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: input, fieldType }),
      })
      const data = await res.json()
      if (data.prompt) setResult(data.prompt)
      else setError(data.error || 'Chyba pri generovaní')
    } catch {
      setError('Sieťová chyba')
    } finally {
      setLoading(false)
    }
  }

  function handleUse() {
    onUse(result)
    // Auto-save to prompt library if projectId is provided
    if (projectId) {
      fetch('/api/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: `AI Helper – ${fieldType}`,
          promptText: result,
          category: fieldType === 'brand' ? 'brand' : fieldType === 'image' ? 'image' : 'general',
        }),
      }).catch(() => {}) // silent save
    }
    setOpen(false)
    resetState()
  }

  function handleCopy() {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const placeholderMap: Record<string, string> = {
    brand: 'Napr. "sme moderná kaviareň v centre Bratislavy, cielime na mladých ľudí, chceme byť cool a priateľskí"',
    image: 'Napr. "chcem fotky jedla na tmavom pozadí s teplým svetlom, minimalistické"',
    general: 'Popíšte vlastnými slovami čo potrebujete...',
  }

  return (
    <>
      {/* Trigger icon button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Prompt Helper – AI vám pomôže napísať profesionálny prompt"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 6,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(245,158,11,0.08) 100%)',
          border: '1px solid rgba(139,92,246,0.2)',
          color: '#8B5CF6', fontSize: 11, fontWeight: 600,
          cursor: 'pointer', transition: 'all 150ms',
          fontFamily: 'Inter, sans-serif', lineHeight: 1,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(245,158,11,0.14) 100%)'
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.35)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(245,158,11,0.08) 100%)'
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.2)'
        }}
      >
        <Wand2 size={11} strokeWidth={2.5} />
        AI Helper
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) { setOpen(false); resetState() } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, animation: 'fadeInOverlay 150ms ease-out',
          }}
        >
          <div
            ref={modalRef}
            style={{
              width: '100%', maxWidth: 520,
              background: '#FFFFFF', borderRadius: 16,
              boxShadow: '0 24px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
              overflow: 'hidden', animation: 'slideUpModal 200ms ease-out',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid var(--border)',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.04) 0%, rgba(245,158,11,0.04) 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, #8B5CF6, #F59E0B)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={16} color="#FFF" strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Prompt Helper</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Popíšte čo chcete → AI vytvorí profesionálny prompt</div>
                </div>
              </div>
              <button
                onClick={() => { setOpen(false); resetState() }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Input */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Váš popis vlastnými slovami
                </label>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={placeholderMap[fieldType]}
                  rows={3}
                  className="input-field"
                  style={{ resize: 'vertical', fontSize: 13 }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); generate() }
                  }}
                />
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  ⌘ + Enter na odoslanie
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={generate}
                disabled={!input.trim() || loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px 20px', width: '100%',
                  background: (!input.trim() || loading) ? '#E5E7EB' : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                  color: (!input.trim() || loading) ? '#9CA3AF' : '#FFF',
                  border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif', transition: 'all 200ms',
                }}
              >
                {loading
                  ? <><Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> Generujem prompt...</>
                  : <><Wand2 size={14} /> Vytvoriť profesionálny prompt</>
                }
              </button>

              {/* Error */}
              {error && (
                <div style={{
                  padding: '10px 14px', background: 'var(--error-bg)',
                  border: '1px solid var(--error-border)', borderRadius: 8,
                  color: 'var(--error)', fontSize: 12,
                }}>
                  {error}
                </div>
              )}

              {/* Result */}
              {result && (
                <div style={{
                  background: 'var(--bg-hover)', border: '1px solid var(--border)',
                  borderRadius: 10, overflow: 'hidden',
                  animation: 'slideUpModal 200ms ease-out',
                }}>
                  <div style={{
                    padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border)', background: 'rgba(139,92,246,0.04)',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Vygenerovaný prompt
                    </span>
                    <button
                      onClick={handleCopy}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px',
                        background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                        fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer',
                        fontFamily: 'Inter', transition: 'all 150ms',
                      }}
                    >
                      {copied ? <><Check size={11} /> Skopírované</> : <><Copy size={11} /> Kopírovať</>}
                    </button>
                  </div>
                  <div style={{ padding: 14 }}>
                    <textarea
                      value={result}
                      onChange={e => setResult(e.target.value)}
                      rows={4}
                      className="input-field"
                      style={{ resize: 'vertical', fontSize: 13, background: '#FFF' }}
                    />
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                      Môžete text ešte upraviť pred použitím.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {result && (
              <div style={{
                padding: '16px 24px', borderTop: '1px solid var(--border)',
                display: 'flex', justifyContent: 'flex-end', gap: 8,
                background: 'var(--bg-hover)',
              }}>
                <button
                  onClick={() => { setResult(''); setError(null) }}
                  className="btn-ghost"
                  style={{ fontSize: 13 }}
                >
                  Regenerovať
                </button>
                <button
                  onClick={handleUse}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 24px', background: 'var(--brand)', color: '#FFF',
                    border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'Inter', transition: 'all 150ms',
                    boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                  }}
                >
                  Použiť prompt <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

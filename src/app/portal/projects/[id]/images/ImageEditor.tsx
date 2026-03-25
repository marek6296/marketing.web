'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, Type, Crop, MousePointer2, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Trash2, Loader2,
  Wand2, Plus, Minus, Check, RotateCcw,
} from 'lucide-react'

/* ── Types ───────────────────────────────────────────────────────── */
interface TextLayer {
  id: string; x: number; y: number; text: string
  font: string; size: number; bold: boolean; italic: boolean
  underline: boolean; color: string; align: 'left' | 'center' | 'right'
  shadow: boolean; strokeColor: string; strokeWidth: number; maxWidth: number
}
interface CropBox { startX: number; startY: number; endX: number; endY: number }
type Tool = 'select' | 'text' | 'crop' | 'ai'

interface Props {
  imageUrl: string; projectId: string
  onClose: () => void; onSaved: (newUrl: string) => void
  initialLayers?: TextLayer[]
}

/* ── Pure helpers (outside component) ───────────────────────────── */
const FONT_GROUPS: { label: string; fonts: string[] }[] = [
  { label: 'Sans-serif', fonts: ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Nunito', 'Poppins', 'Montserrat', 'Raleway', 'Oswald', 'Work Sans', 'DM Sans', 'Outfit'] },
  { label: 'Serif', fonts: ['Georgia', 'Playfair Display', 'Merriweather', 'Lora', 'EB Garamond', 'Cormorant Garamond', 'Libre Baskerville'] },
  { label: 'Display / Bold', fonts: ['Impact', 'Bebas Neue', 'Anton', 'Black Han Sans', 'Righteous', 'Fredoka One', 'Permanent Marker'] },
  { label: 'Script / Rukopis', fonts: ['Dancing Script', 'Pacifico', 'Great Vibes', 'Lobster', 'Sacramento', 'Caveat'] },
  { label: 'Mono', fonts: ['Courier New', 'Source Code Pro', 'Space Mono', 'JetBrains Mono'] },
]
const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=' +
  [
    'Inter', 'Roboto', 'Open+Sans', 'Lato', 'Nunito', 'Poppins', 'Montserrat', 'Raleway', 'Oswald',
    'Work+Sans', 'DM+Sans', 'Outfit', 'Playfair+Display', 'Merriweather', 'Lora', 'EB+Garamond',
    'Cormorant+Garamond', 'Libre+Baskerville', 'Bebas+Neue', 'Anton', 'Black+Han+Sans', 'Righteous',
    'Fredoka+One', 'Permanent+Marker', 'Dancing+Script', 'Pacifico', 'Great+Vibes', 'Lobster',
    'Sacramento', 'Caveat', 'Source+Code+Pro', 'Space+Mono', 'JetBrains+Mono',
  ].map(f => `${f}:wght@400;700`).join('&family=') + '&display=swap'

function useGoogleFonts() {
  useEffect(() => {
    if (document.getElementById('img-editor-fonts')) return
    const link = document.createElement('link')
    link.id = 'img-editor-fonts'
    link.rel = 'stylesheet'
    link.href = GOOGLE_FONTS_URL
    document.head.appendChild(link)
    // Wait for fonts to load so canvas renders them correctly
    document.fonts.ready.then(() => {})
  }, [])
}

function buildFont(l: TextLayer) {
  return `${l.italic ? 'italic ' : ''}${l.bold ? 'bold ' : ''}${l.size}px '${l.font}', sans-serif`
}

function getWrappedLines(ctx: CanvasRenderingContext2D, text: string, maxW?: number): string[] {
  const result: string[] = []
  for (const raw of text.split('\n')) {
    if (!maxW) { result.push(raw); continue }
    const words = raw.split(' '); let cur = ''
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w
      if (ctx.measureText(test).width > maxW && cur) { result.push(cur); cur = w }
      else cur = test
    }
    result.push(cur)
  }
  return result.length ? result : ['']
}

function drawLayer(ctx: CanvasRenderingContext2D, l: TextLayer) {
  ctx.save()
  ctx.font = buildFont(l); ctx.fillStyle = l.color
  ctx.textAlign = l.align; ctx.textBaseline = 'top'
  if (l.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2 }
  const lines = getWrappedLines(ctx, l.text, l.maxWidth > 0 ? l.maxWidth : undefined)
  const lh = l.size * 1.3
  lines.forEach((line, i) => {
    const ly = l.y + i * lh
    if (l.strokeWidth > 0) { ctx.strokeStyle = l.strokeColor; ctx.lineWidth = l.strokeWidth; ctx.strokeText(line, l.x, ly) }
    ctx.fillText(line, l.x, ly)
    if (l.underline) {
      const mw = ctx.measureText(line).width
      let ulx = l.x
      if (l.align === 'center') ulx -= mw / 2
      if (l.align === 'right') ulx -= mw
      ctx.shadowColor = 'transparent'
      ctx.fillRect(ulx, ly + l.size + 2, mw, Math.max(1, l.size * 0.06))
    }
  })
  ctx.restore()
}

function getTextBounds(ctx: CanvasRenderingContext2D, l: TextLayer) {
  ctx.font = buildFont(l)
  const lines = getWrappedLines(ctx, l.text, l.maxWidth > 0 ? l.maxWidth : undefined)
  const mw = Math.max(...lines.map(ln => ctx.measureText(ln).width), 10)
  const h = lines.length * (l.size * 1.3)
  let x = l.x
  if (l.align === 'center') x -= mw / 2
  if (l.align === 'right') x -= mw
  return { x, y: l.y, w: mw, h }
}

function normCrop(b: CropBox, W: number, H: number) {
  const x = Math.max(0, Math.min(b.startX, b.endX))
  const y = Math.max(0, Math.min(b.startY, b.endY))
  const x2 = Math.min(W, Math.max(b.startX, b.endX))
  const y2 = Math.min(H, Math.max(b.startY, b.endY))
  return { x, y, w: x2 - x, h: y2 - y }
}

/* ── Tiny sub-components ─────────────────────────────────────────── */
function ToolBtn({ active, onClick, title, children }: { active: boolean; onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--radius)',
      cursor: 'pointer', border: 'none', fontFamily: 'Inter', fontSize: 13, transition: 'all 150ms',
      background: active ? 'var(--brand-bg)' : 'transparent',
      color: active ? 'var(--brand-dark)' : 'var(--text-secondary)',
      fontWeight: active ? 700 : 400,
    }}>{children}</button>
  )
}
function SBtn({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 32, height: 32, borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
      background: active ? 'var(--brand-bg)' : 'var(--bg-hover)',
      color: active ? 'var(--brand-dark)' : 'var(--text-secondary)', transition: 'all 150ms',
    }}>{children}</button>
  )
}

/* ── Main component ──────────────────────────────────────────────── */
export default function ImageEditor({ imageUrl, projectId, onClose, onSaved, initialLayers }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [sz, setSz] = useState({ w: 700, h: 700 })
  const [loaded, setLoaded] = useState(false)
  const [tool, setTool] = useState<Tool>('select')
  const [layers, setLayers] = useState<TextLayer[]>(initialLayers ?? [])
  const [selId, setSelId] = useState<string | null>(initialLayers?.[0]?.id ?? null)
  const [cropBox, setCropBox] = useState<CropBox | null>(null)
  const [appliedCrop, setAppliedCrop] = useState<CropBox | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  useGoogleFonts()
  const baseUrlRef = useRef(imageUrl)

  // drag refs
  const isCropDrag = useRef(false)
  const isDrag = useRef(false)
  const dragId = useRef<string | null>(null)
  const dragOff = useRef({ x: 0, y: 0 })
  const cropStart = useRef<{ x: number; y: number } | null>(null)

  /* Load image */
  useEffect(() => {
    const img = new Image(); img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgRef.current = img
      const r = img.naturalWidth / img.naturalHeight
      const MAX = 700; let w = MAX, h = MAX
      if (r > 1) h = Math.round(w / r)
      else if (r < 1) w = Math.round(h * r)
      setSz({ w, h }); setLoaded(true)
    }
    img.src = imageUrl
  }, [imageUrl])

  /* Render */
  const render = useCallback(() => {
    const canvas = canvasRef.current; const img = imgRef.current
    if (!canvas || !img || !loaded) return
    const ctx = canvas.getContext('2d')!
    const { w, h } = sz
    ctx.clearRect(0, 0, w, h)
    // checker
    const ts = 16
    for (let cy = 0; cy < h; cy += ts) for (let cx = 0; cx < w; cx += ts) {
      ctx.fillStyle = ((cx / ts + cy / ts) % 2 === 0) ? '#e5e7eb' : '#f3f4f6'
      ctx.fillRect(cx, cy, ts, ts)
    }
    // image
    if (appliedCrop) {
      const nc = normCrop(appliedCrop, w, h)
      const sX = (nc.x / w) * img.naturalWidth, sY = (nc.y / h) * img.naturalHeight
      const sW = (nc.w / w) * img.naturalWidth, sH = (nc.h / h) * img.naturalHeight
      ctx.drawImage(img, sX, sY, sW, sH, 0, 0, w, h)
    } else ctx.drawImage(img, 0, 0, w, h)
    // text layers
    for (const l of layers) {
      if (l.id === editingId) continue
      drawLayer(ctx, l)
      if (l.id === selId && tool !== 'crop') {
        const b = getTextBounds(ctx, l)
        ctx.save(); ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2; ctx.setLineDash([5, 4])
        ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12); ctx.restore()
      }
    }
    // crop overlay
    if (tool === 'crop') {
      const box = cropBox
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, w, h)
      if (box) {
        const nc = normCrop(box, w, h)
        ctx.clearRect(nc.x, nc.y, nc.w, nc.h)
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.setLineDash([])
        ctx.strokeRect(nc.x, nc.y, nc.w, nc.h)
        // grid
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1
        for (let i = 1; i < 3; i++) {
          ctx.beginPath(); ctx.moveTo(nc.x + nc.w / 3 * i, nc.y); ctx.lineTo(nc.x + nc.w / 3 * i, nc.y + nc.h); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(nc.x, nc.y + nc.h / 3 * i); ctx.lineTo(nc.x + nc.w, nc.y + nc.h / 3 * i); ctx.stroke()
        }
        // handles
        ctx.fillStyle = 'white'; ctx.setLineDash([])
        ;[[nc.x, nc.y], [nc.x + nc.w, nc.y], [nc.x, nc.y + nc.h], [nc.x + nc.w, nc.y + nc.h]].forEach(([hx, hy]) => {
          ctx.beginPath(); ctx.arc(hx, hy, 6, 0, Math.PI * 2); ctx.fill()
        })
      }
      ctx.restore()
    }
  }, [loaded, sz, layers, selId, tool, cropBox, appliedCrop, editingId])

  useEffect(() => { render() }, [render])

  /* Canvas pos helper */
  function pos(e: React.MouseEvent) {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  /* Hit test */
  function hit(x: number, y: number) {
    const ctx = canvasRef.current!.getContext('2d')!
    for (let i = layers.length - 1; i >= 0; i--) {
      const b = getTextBounds(ctx, layers[i])
      if (x >= b.x - 6 && x <= b.x + b.w + 6 && y >= b.y - 6 && y <= b.y + b.h + 6) return layers[i].id
    }
    return null
  }

  /* Commit inline edit */
  function commit() {
    if (!editingId) return
    if (editText.trim()) setLayers(p => p.map(l => l.id === editingId ? { ...l, text: editText } : l))
    else setLayers(p => p.filter(l => l.id !== editingId))
    setEditingId(null); setEditText('')
  }

  /* Mouse handlers */
  function onDown(e: React.MouseEvent) {
    const p = pos(e)
    if (tool === 'crop') {
      isCropDrag.current = true; cropStart.current = p
      setCropBox({ startX: p.x, startY: p.y, endX: p.x, endY: p.y }); return
    }
    if (tool === 'text') {
      commit()
      const nl: TextLayer = {
        id: Date.now().toString(), x: p.x, y: p.y, text: 'Tvoj text', font: 'Inter',
        size: 40, bold: true, italic: false, underline: false, color: '#ffffff',
        align: 'left', shadow: true, strokeColor: '#000000', strokeWidth: 0, maxWidth: 0,
      }
      setLayers(prev => [...prev, nl]); setSelId(nl.id); setTool('select')
      setEditingId(nl.id); setEditText('Tvoj text')
      setTimeout(() => textareaRef.current?.focus(), 30); return
    }
    if (tool === 'select') {
      const h = hit(p.x, p.y)
      if (h) {
        setSelId(h); isDrag.current = true; dragId.current = h
        const l = layers.find(x => x.id === h)!
        dragOff.current = { x: p.x - l.x, y: p.y - l.y }
      } else { commit(); setSelId(null) }
    }
  }

  function onMove(e: React.MouseEvent) {
    const p = pos(e)
    if (tool === 'crop' && isCropDrag.current && cropStart.current)
      setCropBox({ startX: cropStart.current.x, startY: cropStart.current.y, endX: p.x, endY: p.y })
    if (isDrag.current && dragId.current)
      setLayers(prev => prev.map(l => l.id === dragId.current ? { ...l, x: p.x - dragOff.current.x, y: p.y - dragOff.current.y } : l))
  }

  function onUp() { isCropDrag.current = false; isDrag.current = false; dragId.current = null }

  function onDbl(e: React.MouseEvent) {
    const p = pos(e); const h = hit(p.x, p.y)
    if (h) {
      const l = layers.find(x => x.id === h)!
      setEditingId(h); setEditText(l.text); setSelId(h)
      setTimeout(() => textareaRef.current?.focus(), 30)
    }
  }

  /* Update selected layer */
  function upd(fields: Partial<TextLayer>) {
    if (!selId) return
    setLayers(p => p.map(l => l.id === selId ? { ...l, ...fields } : l))
  }

  const sel = layers.find(l => l.id === selId) || null
  const editLayer = layers.find(l => l.id === editingId) || null

  /* Keyboard */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
      if (e.key === 'v' || e.key === 'V') setTool('select')
      if (e.key === 't' || e.key === 'T') setTool('text')
      if (e.key === 'c' || e.key === 'C') setTool('crop')
      if ((e.key === 'Delete' || e.key === 'Backspace') && selId) {
        setLayers(p => p.filter(l => l.id !== selId)); setSelId(null)
      }
      if (e.key === 'Escape') { commit(); setSelId(null); setTool('select') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selId, editingId, editText]) // eslint-disable-line

  /* AI edit */
  async function doAI() {
    if (!aiPrompt.trim()) return
    setAiLoading(true); setAiError(null)
    try {
      const res = await fetch('/api/edit-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: baseUrlRef.current, prompt: aiPrompt, projectId }),
      })
      const data = await res.json()
      if (data.imageUrl) {
        baseUrlRef.current = data.imageUrl
        const img = new Image(); img.crossOrigin = 'anonymous'
        img.onload = () => { imgRef.current = img; setLoaded(false); setTimeout(() => setLoaded(true), 50) }
        img.src = data.imageUrl; setAiPrompt('')
      } else setAiError(data.error || 'Chyba')
    } catch { setAiError('Sieťová chyba') } finally { setAiLoading(false) }
  }

  /* Save */
  async function save() {
    const canvas = canvasRef.current; if (!canvas) return
    setSaving(true)
    try {
      const exp = document.createElement('canvas')
      const scale = 2; exp.width = sz.w * scale; exp.height = sz.h * scale
      const ctx = exp.getContext('2d')!; ctx.scale(scale, scale)
      const img = imgRef.current!
      if (appliedCrop) {
        const nc = normCrop(appliedCrop, sz.w, sz.h)
        ctx.drawImage(img, (nc.x / sz.w) * img.naturalWidth, (nc.y / sz.h) * img.naturalHeight, (nc.w / sz.w) * img.naturalWidth, (nc.h / sz.h) * img.naturalHeight, 0, 0, sz.w, sz.h)
      } else ctx.drawImage(img, 0, 0, sz.w, sz.h)
      for (const l of layers) drawLayer(ctx, l)
      const blob = await new Promise<Blob>(r => exp.toBlob(b => r(b!), 'image/jpeg', 0.92))
      const fd = new FormData()
      fd.append('file', blob, `edited-${Date.now()}.jpg`); fd.append('projectId', projectId)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        await fetch('/api/images', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: data.url, projectId, source: 'enhanced', title: 'Upravený obrázok' }),
        })
        onSaved(data.url)
      }
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  /* Sidebar content */
  function Sidebar() {
    if (tool === 'crop') return (
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Label>Orezanie</Label>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>Ťahaj myšou na plátne pre výber oblasti. Potom klikni Aplikovať.</p>
        {cropBox && <button onClick={() => { setAppliedCrop(cropBox); setCropBox(null); setTool('select') }} className="btn-primary" style={{ fontSize: 13, justifyContent: 'center' }}><Check size={14} /> Aplikovať orezanie</button>}
        {appliedCrop && <button onClick={() => { setAppliedCrop(null); setCropBox(null) }} className="btn-ghost" style={{ fontSize: 13, justifyContent: 'center' }}><RotateCcw size={13} /> Zrušiť orezanie</button>}
      </div>
    )
    if (tool === 'ai') return (
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Label>AI Editácia</Label>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>Popíš zmenu. AI upraví celý obrázok podľa tvojej inštrukcie.</p>
        <textarea className="input-field" rows={4} placeholder='Napr. "zmeň pozadie na bielu", "pridaj ranné svetlo"' value={aiPrompt} onChange={e => { setAiPrompt(e.target.value); setAiError(null) }} style={{ resize: 'none', fontSize: 12 }} />
        {aiError && <p style={{ fontSize: 11, color: 'var(--error)' }}>⚠️ {aiError}</p>}
        <button onClick={doAI} disabled={!aiPrompt.trim() || aiLoading} className="btn-brand" style={{ opacity: (!aiPrompt.trim() || aiLoading) ? 0.6 : 1, justifyContent: 'center' }}>
          {aiLoading ? <><Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> Upravujem...</> : <><Wand2 size={14} /> Aplikovať prompt</>}
        </button>
      </div>
    )
    if (tool === 'select' && sel) return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1 }}>
        <Label>Vlastnosti textu</Label>
        <div>
          <FieldLabel>Písmo</FieldLabel>
          <select
            value={sel.font}
            onChange={e => upd({ font: e.target.value })}
            className="input-field"
            style={{ fontSize: 13, fontFamily: sel.font }}
          >
            {FONT_GROUPS.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.fonts.map(f => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {/* Live font preview */}
          <div style={{
            marginTop: 6, padding: '8px 10px', background: 'var(--bg-hover)',
            borderRadius: 'var(--radius)', fontSize: sel.size > 48 ? 22 : 18,
            fontFamily: `'${sel.font}', sans-serif`,
            fontWeight: sel.bold ? 700 : 400,
            fontStyle: sel.italic ? 'italic' : 'normal',
            color: sel.color === '#ffffff' ? 'var(--text-primary)' : sel.color,
            lineHeight: 1.3, textAlign: 'center', wordBreak: 'break-word',
          }}>
            Abc 123
          </div>
        </div>
        <div>
          <FieldLabel>Veľkosť: {sel.size}px</FieldLabel>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <SBtn active={false} onClick={() => upd({ size: Math.max(8, sel.size - 2) })}><Minus size={12} /></SBtn>
            <input type="range" min={8} max={250} value={sel.size} onChange={e => upd({ size: +e.target.value })} style={{ flex: 1 }} />
            <SBtn active={false} onClick={() => upd({ size: Math.min(250, sel.size + 2) })}><Plus size={12} /></SBtn>
          </div>
        </div>
        <div>
          <FieldLabel>Štýl</FieldLabel>
          <div style={{ display: 'flex', gap: 4 }}>
            <SBtn active={sel.bold} onClick={() => upd({ bold: !sel.bold })} title="Tučné"><Bold size={13} /></SBtn>
            <SBtn active={sel.italic} onClick={() => upd({ italic: !sel.italic })} title="Kurzíva"><Italic size={13} /></SBtn>
            <SBtn active={sel.underline} onClick={() => upd({ underline: !sel.underline })} title="Podčiarknuté"><Underline size={13} /></SBtn>
          </div>
        </div>
        <div>
          <FieldLabel>Zarovnanie</FieldLabel>
          <div style={{ display: 'flex', gap: 4 }}>
            <SBtn active={sel.align === 'left'} onClick={() => upd({ align: 'left' })}><AlignLeft size={13} /></SBtn>
            <SBtn active={sel.align === 'center'} onClick={() => upd({ align: 'center' })}><AlignCenter size={13} /></SBtn>
            <SBtn active={sel.align === 'right'} onClick={() => upd({ align: 'right' })}><AlignRight size={13} /></SBtn>
          </div>
        </div>
        <div>
          <FieldLabel>Farba textu</FieldLabel>
          <input type="color" value={sel.color} onChange={e => upd({ color: e.target.value })} style={{ width: '100%', height: 36, border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', padding: 2 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <FieldLabel style={{ margin: 0 }}>Tiene</FieldLabel>
          <Toggle on={sel.shadow} onToggle={() => upd({ shadow: !sel.shadow })} />
        </div>
        <div>
          <FieldLabel>Obrys: {sel.strokeWidth}px</FieldLabel>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="range" min={0} max={12} value={sel.strokeWidth} onChange={e => upd({ strokeWidth: +e.target.value })} style={{ flex: 1 }} />
            <input type="color" value={sel.strokeColor} onChange={e => upd({ strokeColor: e.target.value })} style={{ width: 36, height: 28, border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 2, cursor: 'pointer' }} />
          </div>
        </div>
        <div>
          <FieldLabel>Max. šírka (0 = neobmedzená): {sel.maxWidth}px</FieldLabel>
          <input type="range" min={0} max={sz.w} value={sel.maxWidth} onChange={e => upd({ maxWidth: +e.target.value })} style={{ width: '100%' }} />
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <button onClick={() => { setLayers(p => p.filter(l => l.id !== selId)); setSelId(null) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 12, color: 'var(--error)', fontWeight: 600, width: '100%', justifyContent: 'center', fontFamily: 'Inter' }}>
            <Trash2 size={13} /> Odstrániť text
          </button>
        </div>
      </div>
    )
    return (
      <div style={{ padding: 20 }}>
        <Label>Nástroje</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {[
            { icon: <MousePointer2 size={14} />, l: 'Výber (V)', d: 'Klikni na text a presuň ho' },
            { icon: <Type size={14} />, l: 'Text (T)', d: 'Klikni na plátno – pridá textový blok' },
            { icon: <Crop size={14} />, l: 'Orezanie (C)', d: 'Ťahaj výber, potom Aplikovať' },
            { icon: <Wand2 size={14} />, l: 'AI Edit', d: 'Uprav obrázok prirodzenou inštrukciou' },
          ].map(it => (
            <div key={it.l} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius)' }}>
              <span style={{ color: 'var(--brand)', marginTop: 1 }}>{it.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{it.l}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{it.d}</div>
              </div>
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>Dvojklik na text = editovať obsah &nbsp;|&nbsp; Delete = odstrániť</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(4px)' }}>
      {/* Toolbar */}
      <div style={{ height: 56, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 2, padding: '0 16px', flexShrink: 0 }}>
        <ToolBtn active={tool === 'select'} onClick={() => setTool('select')} title="Výber (V)"><MousePointer2 size={15} /> Výber</ToolBtn>
        <ToolBtn active={tool === 'text'} onClick={() => setTool('text')} title="Text (T)"><Type size={15} /> Text</ToolBtn>
        <ToolBtn active={tool === 'crop'} onClick={() => setTool('crop')} title="Orezanie (C)"><Crop size={15} /> Orezanie</ToolBtn>
        <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 6px' }} />
        <ToolBtn active={tool === 'ai'} onClick={() => setTool('ai')} title="AI editácia"><Wand2 size={15} /> AI Edit</ToolBtn>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={save} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: saving ? 'wait' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter', opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> Ukladám...</> : <><Check size={14} /> Uložiť kópiu</>}
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6 }}><X size={20} /></button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Canvas */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'auto' }}>
          <div style={{ position: 'relative' }}>
            {!loaded && <div style={{ width: sz.w, height: sz.h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={32} color="white" style={{ animation: 'spin-slow 1s linear infinite' }} /></div>}
            <canvas
              ref={canvasRef} width={sz.w} height={sz.h}
              style={{ display: loaded ? 'block' : 'none', cursor: tool === 'text' ? 'text' : tool === 'crop' ? 'crosshair' : 'default', borderRadius: 6, boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }}
              onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onDoubleClick={onDbl}
            />
            {/* Inline textarea */}
            {editingId && editLayer && (
              <textarea
                ref={textareaRef} value={editText}
                onChange={e => setEditText(e.target.value)}
                onBlur={commit} onKeyDown={e => { if (e.key === 'Escape') commit() }}
                style={{
                  position: 'absolute', left: editLayer.x, top: editLayer.y,
                  background: 'rgba(99,102,241,0.12)', border: '2px solid #6366f1',
                  color: editLayer.color, font: buildFont(editLayer), textAlign: editLayer.align,
                  padding: '4px 6px', outline: 'none', resize: 'both', minWidth: 120, minHeight: 48,
                  borderRadius: 4, backdropFilter: 'blur(2px)', lineHeight: 1.3,
                }}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: 290, background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <Sidebar />
        </div>
      </div>
    </div>
  )
}

/* Tiny UI helpers */
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{children}</div>
}
function FieldLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, ...style }}>{children}</div>
}
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{ position: 'relative', width: 36, height: 20, borderRadius: 10, background: on ? 'var(--brand)' : 'var(--border)', border: 'none', cursor: 'pointer', transition: 'background 200ms', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 200ms', display: 'block' }} />
    </button>
  )
}

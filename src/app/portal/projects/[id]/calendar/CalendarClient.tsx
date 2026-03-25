'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle2, Plus, CalendarDays, FileText, ChevronLeft, ChevronRight, LayoutList, Calendar as CalendarIcon, X, Loader2, ListPlus } from 'lucide-react'

type Post = {
  id: string
  caption: string | null
  image_url: string | null
  platform: string
  status: string
  scheduled_at: string | null
  published_at: string | null
  post_type?: string
}

export type CalendarNote = {
  id: string
  project_id: string
  client_id: string
  date: string
  content: string
  color: string
  importance: string
  created_at: string
}

function PostRow({ post }: { post: Post }) {
  const dt = post.scheduled_at ? new Date(post.scheduled_at) : post.published_at ? new Date(post.published_at) : null
  return (
    <div className="table-row" style={{ gap: 14, padding: '10px 12px' }}>
      {post.image_url ? (
        <img src={post.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--bg-hover)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={14} color="var(--text-faint)" /></div>
      )}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(post.caption)?.substring(0, 70) || 'Bez textu'}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 4, alignItems: 'center' }}>
          {post.post_type === 'story' ? (
            <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--accent-fuchsia-bg)', color: 'var(--accent-fuchsia)', borderRadius: 10, fontWeight: 600 }}>📱 Story</span>
          ) : (
            <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--accent-sky-bg)', color: 'var(--accent-sky)', borderRadius: 10, fontWeight: 600 }}>🖼️ Post</span>
          )}
          {dt && <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{dt.toLocaleDateString('sk-SK')} {dt.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}</span>}
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
            {post.platform === 'both' ? 'FB + IG' : 
             post.platform === 'facebook' ? 'Facebook' : 
             post.platform === 'instagram' ? 'Instagram' : 
             post.platform === 'both_stories' ? 'FB + IG' : 
             post.platform === 'facebook_story' ? 'Facebook' : 'Instagram'}
          </span>
        </div>
      </div>
      <span className={`badge ${post.status === 'published' ? 'badge-green' : 'badge-yellow'}`}>{post.status === 'published' ? 'Live' : 'Čaká'}</span>
    </div>
  )
}

export default function CalendarClient({ projectId, scheduled, published, drafts, initialNotes }: { projectId: string, scheduled: Post[], published: Post[], drafts: Post[], initialNotes: CalendarNote[] }) {
  const router = useRouter()
  const [view, setView] = useState<'list' | 'calendar'>('calendar')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDrafts, setShowDrafts] = useState(false)
  const [draftTime, setDraftTime] = useState('12:00')
  const [scheduling, setScheduling] = useState<string | null>(null)
  
  // Notes state
  const [notes, setNotes] = useState<CalendarNote[]>(initialNotes)
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteColor, setNewNoteColor] = useState('violet')
  const [newNoteHigh, setNewNoteHigh] = useState(false)
  const [addingNote, setAddingNote] = useState(false)

  const allPosts = [...scheduled, ...published]

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthNames = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December']
  const dayNames = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne']

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startingDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const daysInMonth = lastDay.getDate()

  const days = []
  for (let i = 0; i < startingDayIndex; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
  }

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)) }

  // Posts on a specific date
  function getPostsForDate(d: Date | null) {
    if (!d) return []
    const ds = d.toLocaleDateString('en-CA') // YYYY-MM-DD local
    return allPosts.filter(p => {
      const pdt = p.scheduled_at ? new Date(p.scheduled_at) : p.published_at ? new Date(p.published_at) : null
      return pdt && pdt.toLocaleDateString('en-CA') === ds
    })
  }

  // Notes on a specific date
  function getNotesForDate(d: Date | null) {
    if (!d) return []
    const ds = d.toLocaleDateString('en-CA')
    return notes.filter(n => n.date === ds)
  }

  async function handleAddNote() {
    if (!selectedDate || !newNoteText.trim()) return
    setAddingNote(true)
    const ds = selectedDate.toLocaleDateString('en-CA')
    
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          date: ds,
          content: newNoteText.trim(),
          color: newNoteColor,
          importance: newNoteHigh ? 'high' : 'normal'
        })
      })
      if (res.ok) {
        const data = await res.json()
        setNotes([...notes, data])
        setShowAddNote(false)
        setNewNoteText('')
        setNewNoteHigh(false)
      }
    } finally {
      setAddingNote(false)
    }
  }

  async function handleDeleteNote(id: string) {
    setNotes(notes.filter(n => n.id !== id))
    await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
  }

  async function handleScheduleDraft(draftId: string) {
    if (!selectedDate) return
    setScheduling(draftId)
    
    // Merge selectedDate and draftTime
    const [hh, mm] = draftTime.split(':')
    const dt = new Date(selectedDate)
    dt.setHours(parseInt(hh, 10) || 12, parseInt(mm, 10) || 0, 0, 0)
    
    // Convert to target ISO (we'll just use ISO string)
    const scheduledAt = dt.toISOString()
    
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: draftId, status: 'scheduled', scheduled_at: scheduledAt })
    })
    
    router.refresh()
    setShowDrafts(false)
    setScheduling(null)
  }

  const selectedPosts = getPostsForDate(selectedDate)
  // Format selected date to match datetime-local input YYYY-MM-DDThh:mm
  const generatorDate = selectedDate ? `${selectedDate.toLocaleDateString('en-CA')}T12:00` : ''

  return (
    <div>
      {/* Modals / Sidebars */}
      {selectedDate && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(2px)' }}
          onClick={() => { setSelectedDate(null); setShowDrafts(false) }}
        >
          <div 
            style={{ width: 400, background: 'var(--bg-card)', height: '100%', boxShadow: '-8px 0 32px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
            className="slide-in-right"
          >
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                  {showDrafts ? 'Vybrať koncept na naplánovanie' : 'Príspevky v tento deň'}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{selectedDate.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <button onClick={() => { setSelectedDate(null); setShowDrafts(false); setShowAddNote(false) }} style={{ background: 'var(--bg-hover)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={16}/></button>
            </div>
            
            <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
              {showDrafts ? (
                drafts.length === 0 ? (
                  <div className="empty-state" style={{ height: 200 }}>
                    <FileText />
                    <p>Nemáte žiadne rozpísané koncepty</p>
                    <button onClick={() => setShowDrafts(false)} className="btn-ghost" style={{ marginTop: 12 }}>Späť</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <button onClick={() => setShowDrafts(false)} className="btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }}><ChevronLeft size={14}/> Späť</button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={14} color="var(--text-muted)" />
                        <select 
                          className="input-field" 
                          value={draftTime.split(':')[0]} 
                          onChange={e => setDraftTime(`${e.target.value}:${draftTime.split(':')[1]}`)}
                          style={{ fontSize: 13, padding: '4px 8px', width: 64, textAlign: 'center', cursor: 'pointer' }}
                        >
                          {Array.from({length: 24}).map((_, i) => {
                            const hh = i.toString().padStart(2, '0');
                            return <option key={hh} value={hh}>{hh}</option>
                          })}
                        </select>
                        <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>:</span>
                        <select 
                          className="input-field" 
                          value={draftTime.split(':')[1]} 
                          onChange={e => setDraftTime(`${draftTime.split(':')[0]}:${e.target.value}`)}
                          style={{ fontSize: 13, padding: '4px 8px', width: 64, textAlign: 'center', cursor: 'pointer' }}
                        >
                          <option value="00">00</option>
                          <option value="15">15</option>
                          <option value="30">30</option>
                          <option value="45">45</option>
                        </select>
                      </div>
                    </div>
                    {drafts.map(draft => (
                      <div 
                        key={draft.id} 
                        style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}
                      >
                        <PostRow post={draft} />
                        <button 
                          onClick={() => handleScheduleDraft(draft.id)} 
                          disabled={scheduling === draft.id}
                          className="btn-primary" 
                          style={{ width: '100%', justifyContent: 'center', padding: '8px' }}
                        >
                          {scheduling === draft.id ? <><Loader2 size={13} style={{ animation: 'spin-slow 1s linear infinite' }} /> Plánujem...</> : `Naplánovať ${draft.post_type === 'story' ? 'Story' : 'Post'}`}
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  
                  {/* --- Notes Section --- */}
                  {getNotesForDate(selectedDate).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pripomienky</div>
                      {getNotesForDate(selectedDate).map(n => (
                        <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 12px', background: `var(--accent-${n.color}-bg)`, border: `1px solid var(--accent-${n.color}-light)`, borderRadius: 'var(--radius)', color: `var(--accent-${n.color})` }}>
                           <div style={{ fontSize: 13, fontWeight: n.importance === 'high' ? 700 : 500, lineHeight: 1.5, flex: 1 }}>
                              {n.importance === 'high' && '🔥 '} {n.content}
                           </div>
                           <button onClick={() => handleDeleteNote(n.id)} className="btn-ghost" style={{ color: 'currentcolor', padding: 4, height: 'auto', marginLeft: 8 }}>
                             <X size={14} />
                           </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showAddNote && (
                     <button onClick={() => setShowAddNote(true)} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: selectedPosts.length > 0 ? 12 : 0, color: 'var(--text-secondary)' }}><Plus size={14} /> Pridať pripomienku</button>
                  )}

                  {showAddNote && (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: selectedPosts.length > 0 ? 12 : 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>Nová pripomienka</div>
                        <textarea className="input-field" rows={2} placeholder="Napr. Sviatok, Výročie..." value={newNoteText} onChange={e => setNewNoteText(e.target.value)} style={{ resize: 'none', fontSize: 13 }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                           {['emerald', 'sky', 'violet', 'rose', 'amber'].map(c => (
                             <button key={c} onClick={() => setNewNoteColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: `var(--accent-${c})`, border: newNoteColor === c ? '2px solid var(--bg-card)' : 'none', outline: newNoteColor === c ? `2px solid var(--accent-${c})` : 'none', cursor: 'pointer', padding: 0 }} />
                           ))}
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', marginTop: 4 }}>
                           <input type="checkbox" checked={newNoteHigh} onChange={e => setNewNoteHigh(e.target.checked)} style={{ accentColor: 'var(--brand)' }} />
                           Vysoká priorita (Naliehavé)
                        </label>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                           <button onClick={handleAddNote} disabled={addingNote || !newNoteText.trim()} className="btn-primary" style={{ flex: 1, padding: '8px' }}>{addingNote ? <Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> : 'Uložiť'}</button>
                           <button onClick={() => { setShowAddNote(false); setNewNoteText(''); setNewNoteHigh(false); }} className="btn-ghost" style={{ flex: 1, padding: '8px' }}>Zrušiť</button>
                        </div>
                     </div>
                  )}

                  {selectedPosts.length > 0 && <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Príspevky na siete</div>}
                  {selectedPosts.length === 0 && getNotesForDate(selectedDate).length === 0 && !showAddNote && (
                     <div className="empty-state" style={{ height: 180, border: 'none' }}>
                       <CalendarDays style={{ opacity: 0.5 }} size={32} />
                       <p>Žiadny obsah na tento deň</p>
                     </div>
                  )}
                  {selectedPosts.map(post => (
                    <Link 
                      key={post.id} 
                      href={`/portal/projects/${projectId}/posts?edit=${post.id}`}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', transition: 'all 150ms' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <PostRow post={post} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: 20, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!showDrafts && (
                <>
                  <Link href={`/portal/projects/${projectId}/generator?date=${generatorDate}`} className="btn-brand" style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                    <Plus size={15}/> Nový v generátore
                  </Link>
                  <button onClick={() => setShowDrafts(true)} className="btn-secondary" style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                    <ListPlus size={15}/> Vybrať z konceptov
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div className="grid-2" style={{ gap: 16, width: 400 }}>
          <div className="stat-card" style={{ background: 'var(--accent-violet-bg)', border: '1px solid var(--accent-violet-light)', padding: 12 }}>
            <div className="stat-header">
              <div className="stat-label" style={{ color: 'var(--accent-violet)' }}>Naplánované</div>
              <div className="stat-icon" style={{ background: 'var(--accent-violet-light)', width: 28, height: 28 }}><Clock size={14} color="var(--accent-violet)" /></div>
            </div>
            <div className="stat-value" style={{ color: '#3B0764', fontSize: 20 }}>{scheduled.length}</div>
          </div>
          <div className="stat-card" style={{ background: 'var(--accent-emerald-bg)', border: '1px solid var(--accent-emerald-light)', padding: 12 }}>
            <div className="stat-header">
              <div className="stat-label" style={{ color: 'var(--accent-emerald)' }}>Publikované</div>
              <div className="stat-icon" style={{ background: 'var(--accent-emerald-light)', width: 28, height: 28 }}><CheckCircle2 size={14} color="var(--accent-emerald)" /></div>
            </div>
            <div className="stat-value" style={{ color: '#064E3B', fontSize: 20 }}>{published.length}</div>
          </div>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 4, borderRadius: 'var(--radius)' }}>
          <button 
            onClick={() => setView('list')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: 'none', background: view === 'list' ? 'var(--bg-hover)' : 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: view === 'list' ? 'var(--text-primary)' : 'var(--text-muted)' }}
          ><LayoutList size={14} /> Zoznam</button>
          <button 
            onClick={() => setView('calendar')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: 'none', background: view === 'calendar' ? 'var(--bg-hover)' : 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: view === 'calendar' ? 'var(--text-primary)' : 'var(--text-muted)' }}
          ><CalendarIcon size={14} /> Kalendár</button>
        </div>
      </div>

      {view === 'list' ? (
        <>
          <div className="card" style={{ marginBottom: 16, padding: 0 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 14, fontWeight: 600 }}>Naplánované príspevky</h2>
              <Link href={`/portal/projects/${projectId}/generator`} className="btn-ghost" style={{ fontSize: 12 }}><Plus size={13} /> Nový</Link>
            </div>
            <div style={{ padding: '4px 8px 8px' }}>
              {scheduled.length === 0 ? (
                <div className="empty-state"><CalendarDays /><p>Žiadne naplánované príspevky</p></div>
              ) : scheduled.map(post => (
                <Link key={post.id} href={`/portal/projects/${projectId}/posts?edit=${post.id}`} style={{textDecoration: 'none', color: 'inherit'}}>
                  <PostRow post={post} />
                </Link>
              ))}
            </div>
          </div>

          {published.length > 0 && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}><h2 style={{ fontSize: 14, fontWeight: 600 }}>Nedávno publikované</h2></div>
              <div style={{ padding: '4px 8px 8px' }}>
                {published.slice(0, 5).map(post => (
                  <Link key={post.id} href={`/portal/projects/${projectId}/posts?edit=${post.id}`} style={{textDecoration: 'none', color: 'inherit'}}>
                    <PostRow post={post} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Calendar Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{monthNames[month]} {year}</h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-ghost" onClick={prevMonth} style={{ padding: '6px 8px' }}><ChevronLeft size={16} /></button>
              <button className="btn-ghost" onClick={() => setCurrentDate(new Date())}>Dnes</button>
              <button className="btn-ghost" onClick={nextMonth} style={{ padding: '6px 8px' }}><ChevronRight size={16} /></button>
            </div>
          </div>
          
          {/* Grid Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
            {dayNames.map(d => (
              <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>

          {/* Grid Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '130px' }}>
            {days.map((dayObj, index) => {
              const pts = getPostsForDate(dayObj)
              const isToday = dayObj && dayObj.toLocaleDateString() === new Date().toLocaleDateString()
              
              return (
                <div 
                  key={index} 
                  onClick={() => dayObj && setSelectedDate(dayObj)}
                  style={{ 
                    borderRight: (index + 1) % 7 === 0 ? 'none' : '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    padding: 8,
                    background: dayObj ? 'var(--bg-card)' : 'var(--bg-base)',
                    cursor: dayObj ? 'pointer' : 'default',
                    overflow: 'hidden',
                    transition: 'background 150ms',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={e => { if (dayObj) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { if (dayObj) e.currentTarget.style.background = 'var(--bg-card)' }}
                >
                  {dayObj && (
                    <>
                      <div style={{ 
                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: isToday ? 700 : 500,
                        background: isToday ? 'var(--brand)' : 'transparent',
                        color: isToday ? 'white' : 'var(--text-primary)',
                        marginBottom: 6,
                        flexShrink: 0
                      }}>
                        {dayObj.getDate()}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
                        {pts.length > 0 && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2, flexShrink: 0 }}>Príspevky</div>}
                        {pts.slice(0, 1).map(p => (
                          <div key={p.id} style={{ 
                            fontSize: 11, padding: '3px 6px', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            background: p.status === 'published' ? 'var(--success-bg)' : 'var(--brand-bg)',
                            color: p.status === 'published' ? 'var(--success)' : 'var(--brand-dark)',
                            border: `1px solid ${p.status === 'published' ? 'var(--success-border)' : 'var(--brand-border)'}`,
                            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0
                          }}>
                            {p.status === 'published' ? <CheckCircle2 size={10}/> : <Clock size={10}/>}
                            {p.platform === 'both' ? 'FB+IG' : p.platform === 'facebook' ? 'FB' : 'IG'} {p.caption ? '...' : ''}
                          </div>
                        ))}
                        {pts.length > 1 && (
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2, flexShrink: 0 }}>
                            +{pts.length - 1} ďalšie
                          </div>
                        )}
                      </div>
                      
                      {getNotesForDate(dayObj).length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, overflow: 'hidden' }}>
                          {getNotesForDate(dayObj).slice(0, 1).map(n => (
                            <div key={n.id} style={{ 
                               fontSize: 10, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                               background: `var(--accent-${n.color}-bg)`, color: `var(--accent-${n.color})`, border: `1px solid var(--accent-${n.color}-light)`,
                               fontWeight: n.importance === 'high' ? 700 : 500,
                               display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0
                            }}>
                               {n.importance === 'high' && '🔥'} {n.importance !== 'high' && <div style={{width: 6, height: 6, borderRadius: '50%', background: `var(--accent-${n.color})`, flexShrink: 0}}/>} {n.content}
                            </div>
                          ))}
                          {getNotesForDate(dayObj).length > 1 && (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2, flexShrink: 0 }}>
                              +{getNotesForDate(dayObj).length - 1} ďalšie
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  FileText, CheckCircle2, Clock, FileEdit,
  Sparkles, CalendarDays, ArrowRight, ArrowUpRight, TrendingUp,
} from 'lucide-react'

function Sparkline({ color, data }: { color: string; data: number[] }) {
  const max = Math.max(...data, 1)
  const w = 120, h = 40
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  const areaPoints = `0,${h} ${points} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace('#','')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default async function ProjectDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('project_id', id)
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  const total = posts?.length ?? 0
  const published = posts?.filter(p => p.status === 'published').length ?? 0
  const scheduled = posts?.filter(p => p.status === 'scheduled').length ?? 0
  const drafts = posts?.filter(p => p.status === 'draft').length ?? 0
  const recentPosts = posts?.slice(0, 5) ?? []

  const sparkTotal = [2, 5, 3, 7, 4, 8, 6, total || 1]
  const sparkPub = [1, 2, 1, 3, 2, 4, 3, published || 1]
  const sparkSched = [0, 1, 2, 1, 0, 2, 1, scheduled || 1]
  const sparkDraft = [1, 0, 1, 2, 1, 0, 2, drafts || 1]

  return (
    <div>
      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <Link href={`/portal/projects/${id}/posts?filter=all`} style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ background: 'var(--accent-sky-bg)', border: '1px solid var(--accent-sky-light)', cursor: 'pointer', transition: 'box-shadow 150ms' }}>
            <div className="stat-header">
              <div className="stat-label" style={{ color: 'var(--accent-sky)' }}>Celkom</div>
              <div className="stat-icon" style={{ background: 'var(--accent-sky-light)' }}><FileText size={16} color="var(--accent-sky)" /></div>
            </div>
            <div className="stat-value" style={{ color: '#0C4A6E' }}>{total}</div>
            <div className="stat-change" style={{ color: 'var(--accent-sky)' }}><ArrowUpRight size={13} /> Príspevkov</div>
            <div className="sparkline"><Sparkline color="#0EA5E9" data={sparkTotal} /></div>
          </div>
        </Link>
        <Link href={`/portal/projects/${id}/posts?filter=published`} style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ background: 'var(--accent-emerald-bg)', border: '1px solid var(--accent-emerald-light)', cursor: 'pointer', transition: 'box-shadow 150ms' }}>
            <div className="stat-header">
              <div className="stat-label" style={{ color: 'var(--accent-emerald)' }}>Publikované</div>
              <div className="stat-icon" style={{ background: 'var(--accent-emerald-light)' }}><CheckCircle2 size={16} color="var(--accent-emerald)" /></div>
            </div>
            <div className="stat-value" style={{ color: '#064E3B' }}>{published}</div>
            <div className="stat-change" style={{ color: 'var(--accent-emerald)' }}><TrendingUp size={13} /> Live</div>
            <div className="sparkline"><Sparkline color="#10B981" data={sparkPub} /></div>
          </div>
        </Link>
        <Link href={`/portal/projects/${id}/posts?filter=scheduled`} style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ background: 'var(--accent-violet-bg)', border: '1px solid var(--accent-violet-light)', cursor: 'pointer', transition: 'box-shadow 150ms' }}>
            <div className="stat-header">
              <div className="stat-label" style={{ color: 'var(--accent-violet)' }}>Naplánované</div>
              <div className="stat-icon" style={{ background: 'var(--accent-violet-light)' }}><Clock size={16} color="var(--accent-violet)" /></div>
            </div>
            <div className="stat-value" style={{ color: '#3B0764' }}>{scheduled}</div>
            <div className="stat-change" style={{ color: 'var(--accent-violet)' }}><CalendarDays size={13} /> V poradí</div>
            <div className="sparkline"><Sparkline color="#8B5CF6" data={sparkSched} /></div>
          </div>
        </Link>
        <Link href={`/portal/projects/${id}/posts?filter=draft`} style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ background: 'var(--accent-amber-bg)', border: '1px solid var(--accent-amber-light)', cursor: 'pointer', transition: 'box-shadow 150ms' }}>
            <div className="stat-header">
              <div className="stat-label" style={{ color: 'var(--accent-amber)' }}>Koncepty</div>
              <div className="stat-icon" style={{ background: 'var(--accent-amber-light)' }}><FileEdit size={16} color="var(--accent-amber)" /></div>
            </div>
            <div className="stat-value" style={{ color: '#78350F' }}>{drafts}</div>
            <div className="stat-change" style={{ color: 'var(--accent-amber)' }}><FileEdit size={13} /> Draft</div>
            <div className="sparkline"><Sparkline color="#F59E0B" data={sparkDraft} /></div>
          </div>
        </Link>
      </div>

      {/* Quick actions + Recent */}
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Rýchle akcie</h2>
          </div>
          <div style={{ padding: 6 }}>
            <Link href={`/portal/projects/${id}/generator`} className="table-row" style={{ textDecoration: 'none', padding: '14px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: 'var(--brand-bg)', border: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={16} color="var(--brand)" />
              </div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>Generovať príspevok</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>AI vytvorí obsah</div></div>
              <ArrowRight size={14} color="var(--text-faint)" />
            </Link>
            <Link href={`/portal/projects/${id}/calendar`} className="table-row" style={{ textDecoration: 'none', padding: '14px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: 'var(--accent-sky-bg)', border: '1px solid var(--accent-sky-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CalendarDays size={16} color="var(--accent-sky)" />
              </div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>Kalendár</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Naplánované posty</div></div>
              <ArrowRight size={14} color="var(--text-faint)" />
            </Link>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Posledné príspevky</h2>
            {total > 0 && <Link href={`/portal/projects/${id}/posts`} style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 500 }}>Všetky <ArrowRight size={12} /></Link>}
          </div>
          <div style={{ padding: '4px 6px 6px' }}>
            {recentPosts.length === 0 ? (
              <div className="empty-state"><FileText /><p>Žiadne príspevky</p></div>
            ) : (
              recentPosts.map((post) => (
                <Link key={post.id} href={`/portal/projects/${id}/posts`} className="table-row" style={{ padding: '10px 12px', textDecoration: 'none' }}>
                  {post.image_url ? (
                    <img src={post.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--bg-hover)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={14} color="var(--text-faint)" /></div>
                  )}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{post.caption?.substring(0, 50) || 'Bez textu'}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{new Date(post.created_at).toLocaleDateString('sk-SK')}</p>
                  </div>
                  <span className={`badge ${post.status === 'published' ? 'badge-green' : post.status === 'scheduled' ? 'badge-yellow' : 'badge-brand'}`}>
                    {post.status === 'published' ? 'Live' : post.status === 'scheduled' ? 'Čaká' : 'Draft'}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

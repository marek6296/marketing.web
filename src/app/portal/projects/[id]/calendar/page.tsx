import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Clock, CheckCircle2, Plus, CalendarDays, FileText } from 'lucide-react'

export default async function ProjectCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('project_id', id)
    .eq('client_id', user.id)
    .in('status', ['scheduled', 'published'])
    .order('scheduled_at', { ascending: true })

  const scheduled = posts?.filter(p => p.status === 'scheduled') ?? []
  const published = posts?.filter(p => p.status === 'published') ?? []

  return (
    <div>
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ background: 'var(--accent-violet-bg)', border: '1px solid var(--accent-violet-light)' }}>
          <div className="stat-header">
            <div className="stat-label" style={{ color: 'var(--accent-violet)' }}>Naplánované</div>
            <div className="stat-icon" style={{ background: 'var(--accent-violet-light)' }}><Clock size={16} color="var(--accent-violet)" /></div>
          </div>
          <div className="stat-value" style={{ color: '#3B0764' }}>{scheduled.length}</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--accent-emerald-bg)', border: '1px solid var(--accent-emerald-light)' }}>
          <div className="stat-header">
            <div className="stat-label" style={{ color: 'var(--accent-emerald)' }}>Publikované</div>
            <div className="stat-icon" style={{ background: 'var(--accent-emerald-light)' }}><CheckCircle2 size={16} color="var(--accent-emerald)" /></div>
          </div>
          <div className="stat-value" style={{ color: '#064E3B' }}>{published.length}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600 }}>Naplánované</h2>
          <Link href={`/portal/projects/${id}/generator`} className="btn-ghost" style={{ fontSize: 12 }}><Plus size={13} /> Nový</Link>
        </div>
        <div style={{ padding: '4px 8px 8px' }}>
          {scheduled.length === 0 ? (
            <div className="empty-state"><CalendarDays /><p>Žiadne naplánované príspevky</p></div>
          ) : scheduled.map(post => <PostRow key={post.id} post={post} />)}
        </div>
      </div>

      {published.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}><h2 style={{ fontSize: 14, fontWeight: 600 }}>Nedávno publikované</h2></div>
          <div style={{ padding: '4px 8px 8px' }}>{published.slice(0, 5).map(post => <PostRow key={post.id} post={post} />)}</div>
        </div>
      )}
    </div>
  )
}

function PostRow({ post }: { post: Record<string, unknown> }) {
  const dt = post.scheduled_at ? new Date(post.scheduled_at as string) : post.published_at ? new Date(post.published_at as string) : null
  return (
    <div className="table-row" style={{ gap: 14, padding: '10px 12px' }}>
      {post.image_url ? (
        <img src={post.image_url as string} alt="" style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--bg-hover)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={14} color="var(--text-faint)" /></div>
      )}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(post.caption as string)?.substring(0, 70) || 'Bez textu'}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
          {dt && <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{dt.toLocaleDateString('sk-SK')} {dt.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}</span>}
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{post.platform === 'both' ? 'FB + IG' : post.platform === 'facebook' ? 'Facebook' : 'Instagram'}</span>
        </div>
      </div>
      <span className={`badge ${post.status === 'published' ? 'badge-green' : 'badge-yellow'}`}>{post.status === 'published' ? 'Live' : 'Čaká'}</span>
    </div>
  )
}

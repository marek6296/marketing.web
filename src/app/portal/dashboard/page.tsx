import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FileText, CheckCircle2, Clock, FolderKanban,
  Sparkles, ArrowRight, Plus,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, brand_colors')
    .eq('client_id', user!.id)

  const { data: posts } = await supabase
    .from('posts')
    .select('id, status, project_id, caption, image_url, created_at')
    .eq('client_id', user!.id)
    .order('created_at', { ascending: false })

  const total = posts?.length ?? 0
  const published = posts?.filter(p => p.status === 'published').length ?? 0
  const scheduled = posts?.filter(p => p.status === 'scheduled').length ?? 0
  const projectCount = projects?.length ?? 0
  const recentPosts = posts?.slice(0, 5) ?? []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Overview</h1>
          <p>Prehľad všetkých projektov a príspevkov.</p>
        </div>
        <Link href="/portal/projects/new" className="btn-primary"><Plus size={14} /> Nový projekt</Link>
      </div>

      {/* Summary stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ background: 'var(--accent-sky-bg)', border: '1px solid var(--accent-sky-light)' }}>
          <div className="stat-header">
            <div className="stat-label" style={{ color: 'var(--accent-sky)' }}>Projekty</div>
            <div className="stat-icon" style={{ background: 'var(--accent-sky-light)' }}><FolderKanban size={16} color="var(--accent-sky)" /></div>
          </div>
          <div className="stat-value" style={{ color: '#0C4A6E' }}>{projectCount}</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--accent-amber-bg)', border: '1px solid var(--accent-amber-light)' }}>
          <div className="stat-header">
            <div className="stat-label" style={{ color: 'var(--accent-amber)' }}>Celkom postov</div>
            <div className="stat-icon" style={{ background: 'var(--accent-amber-light)' }}><FileText size={16} color="var(--accent-amber)" /></div>
          </div>
          <div className="stat-value" style={{ color: '#78350F' }}>{total}</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--accent-emerald-bg)', border: '1px solid var(--accent-emerald-light)' }}>
          <div className="stat-header">
            <div className="stat-label" style={{ color: 'var(--accent-emerald)' }}>Publikované</div>
            <div className="stat-icon" style={{ background: 'var(--accent-emerald-light)' }}><CheckCircle2 size={16} color="var(--accent-emerald)" /></div>
          </div>
          <div className="stat-value" style={{ color: '#064E3B' }}>{published}</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--accent-violet-bg)', border: '1px solid var(--accent-violet-light)' }}>
          <div className="stat-header">
            <div className="stat-label" style={{ color: 'var(--accent-violet)' }}>Naplánované</div>
            <div className="stat-icon" style={{ background: 'var(--accent-violet-light)' }}><Clock size={16} color="var(--accent-violet)" /></div>
          </div>
          <div className="stat-value" style={{ color: '#3B0764' }}>{scheduled}</div>
        </div>
      </div>

      {/* Projects list + Recent */}
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Projects */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Projekty</h2>
            <Link href="/portal/projects" style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>Všetky <ArrowRight size={12} /></Link>
          </div>
          <div style={{ padding: 6 }}>
            {projectCount === 0 ? (
              <div className="empty-state">
                <FolderKanban /><p>Žiadne projekty</p>
                <Link href="/portal/projects/new" className="btn-ghost" style={{ marginTop: 8, fontSize: 12 }}><Plus size={13} /> Vytvoriť</Link>
              </div>
            ) : (
              projects!.slice(0, 5).map((project) => (
                <Link key={project.id} href={`/portal/projects/${project.id}`} className="table-row" style={{ textDecoration: 'none', padding: '12px 14px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: project.brand_colors?.primary || 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={14} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{project.name}</div>
                  </div>
                  <ArrowRight size={14} color="var(--text-faint)" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent posts */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Posledné príspevky</h2>
          </div>
          <div style={{ padding: '4px 6px 6px' }}>
            {recentPosts.length === 0 ? (
              <div className="empty-state"><FileText /><p>Žiadne príspevky</p></div>
            ) : (
              recentPosts.map((post) => (
                <div key={post.id} className="table-row" style={{ padding: '10px 12px' }}>
                  {post.image_url ? (
                    <img src={post.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--bg-hover)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={14} color="var(--text-faint)" /></div>
                  )}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.caption?.substring(0, 50) || 'Bez textu'}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{new Date(post.created_at).toLocaleDateString('sk-SK')}</p>
                  </div>
                  <span className={`badge ${post.status === 'published' ? 'badge-green' : post.status === 'scheduled' ? 'badge-yellow' : 'badge-brand'}`}>
                    {post.status === 'published' ? 'Live' : post.status === 'scheduled' ? 'Čaká' : 'Draft'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

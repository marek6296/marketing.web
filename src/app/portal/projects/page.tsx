import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FolderKanban, Plus, ArrowRight, CheckCircle2, AlertTriangle, Sparkles, Users } from 'lucide-react'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // RLS automatically returns both owned AND member projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  // Get post counts per project (RLS limits to accessible projects)
  const { data: posts } = await supabase
    .from('posts')
    .select('project_id, status')

  function getProjectStats(projectId: string) {
    const projectPosts = posts?.filter(p => p.project_id === projectId) ?? []
    return {
      total: projectPosts.length,
      published: projectPosts.filter(p => p.status === 'published').length,
      scheduled: projectPosts.filter(p => p.status === 'scheduled').length,
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Projekty</h1>
          <p>Spravujte všetky vaše marketingové projekty.</p>
        </div>
        <Link href="/portal/projects/new" className="btn-primary">
          <Plus size={14} /> Nový projekt
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="card" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <FolderKanban size={44} color="var(--text-faint)" style={{ margin: '0 auto 16px', opacity: 0.35 }} />
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Žiadne projekty</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
            Vytvorte prvý projekt a začnite generovať obsah pre sociálne siete.
          </p>
          <Link href="/portal/projects/new" className="btn-primary">
            <Plus size={14} /> Vytvoriť projekt
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.map((project) => {
            const stats = getProjectStats(project.id)
            const hasFb = project.facebook_page_id && project.meta_access_token
            const isOwner = project.client_id === user!.id
            return (
              <Link key={project.id} href={`/portal/projects/${project.id}`} className="card" style={{
                padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 18,
                textDecoration: 'none', transition: 'all 150ms',
              }}>
                {/* Color dot */}
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius)', flexShrink: 0,
                  background: project.brand_colors?.primary || 'var(--brand)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={20} color="white" />
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{project.name}</span>
                    {!isOwner && (
                      <span className="badge" style={{ background: 'rgba(139,92,246,0.12)', color: 'rgb(139,92,246)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={9} /> Zdieľaný
                      </span>
                    )}
                    {hasFb
                      ? <span className="badge badge-green"><CheckCircle2 size={10} /> FB</span>
                      : <span className="badge badge-yellow"><AlertTriangle size={10} /> Bez FB</span>
                    }
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {project.description || 'Bez popisu'}
                  </p>
                </div>

                {/* Quick stats */}
                <div style={{ display: 'flex', gap: 20, marginRight: 8 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.total}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Postov</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-emerald)' }}>{stats.published}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Live</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-violet)' }}>{stats.scheduled}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Čaká</div>
                  </div>
                </div>

                <ArrowRight size={16} color="var(--text-faint)" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProjectRowActions from './ProjectRowActions'
import { FolderKanban, Plus, ArrowRight, CheckCircle2, AlertTriangle, Sparkles, Users } from 'lucide-react'

// Custom SVGs since lucide-react doesn't have brand icons
function FacebookIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.07C24 5.4 18.63 0 12 0C5.37 0 0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24V15.56H7.08V12.07H10.13V9.4C10.13 6.38 11.93 4.7 14.65 4.7C15.96 4.7 17.34 4.93 17.34 4.93V7.9H15.83C14.34 7.9 13.88 8.83 13.88 9.78V12.07H17.2L16.66 15.56H13.88V24C19.61 23.1 24 18.1 24 12.07Z"/>
    </svg>
  )
}

function InstagramIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
}

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
            const hasIg = project.instagram_account_id && project.meta_access_token
            const isOwner = project.client_id === user!.id
            return (
              <Link key={project.id} href={`/portal/projects/${project.id}`} className="card" style={{
                padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 18,
                textDecoration: 'none', transition: 'all 150ms',
              }}>
                {/* Color dot or logo */}
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius)', flexShrink: 0,
                  background: project.brand_colors?.primary || 'var(--brand)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                }}>
                  {project.brand_logo_url ? (
                    <img src={project.brand_logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Sparkles size={20} color="white" />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{project.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                      <FacebookIcon size={16} color={hasFb ? '#1877F2' : '#9CA3AF'} />
                      <InstagramIcon size={16} color={hasIg ? '#E4405F' : '#9CA3AF'} />
                    </div>
                    {!isOwner && (
                      <span className="badge" style={{ background: 'rgba(139,92,246,0.12)', color: 'rgb(139,92,246)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
                        <Users size={9} /> Zdieľaný
                      </span>
                    )}
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

                <ProjectRowActions projectId={project.id} isOwner={isOwner} />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

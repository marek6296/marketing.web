import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FolderKanban, ArrowRight, User, Calendar, MonitorPlay } from 'lucide-react'

export const metadata = { title: 'Users & Projects | PROJECTBer' }

// Force dynamic rendering to ensure we get fresh data
export const dynamic = 'force-dynamic'

export default async function AdminProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify access
  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!myProfile || (myProfile.role !== 'admin' && myProfile.role !== 'superadmin')) {
    redirect('/portal/dashboard')
  }

  // Fetch all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch all projects (Admins_Full_Access RLS policy guarantees we see all projects)
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (profilesError || projectsError || !profiles || !projects) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60, textAlign: 'center', paddingTop: 80 }}>
        <p style={{ color: 'var(--error)' }}>Chyba pri načítavaní údajov o používateľoch alebo projektoch.</p>
      </div>
    )
  }

  // Group projects by user ID
  const projectsByUserId = profiles.map(profile => ({
    ...profile,
    projects: projects.filter(p => p.client_id === profile.id)
  }))

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FolderKanban size={22} color="var(--brand)" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Users & Projects</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Globálny prístup do klientskych projektov. Kliknutím na projekt vstúpite do Nástenky.
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {projectsByUserId.map(userItem => {
          const hasProjects = userItem.projects.length > 0;
          return (
            <div key={userItem.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: hasProjects ? '1px solid var(--border)' : 'none', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', paddingBottom: hasProjects ? 16 : 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <User size={16} color="var(--text-secondary)" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{userItem.email}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>ID: {userItem.id.split('-')[0]}... ({userItem.role})</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  <Calendar size={14} />
                  Zaregistrovaný {new Date(userItem.created_at).toLocaleDateString()}
                </div>
              </div>

              {hasProjects ? (
                <div style={{ padding: '4px 0' }}>
                  {userItem.projects.map((project: any) => (
                    <Link 
                      key={project.id} 
                      href={`/portal/projects/${project.id}`}
                      style={{ 
                        display: 'flex', alignItems: 'center', padding: '16px 20px', 
                        borderBottom: '1px solid var(--border)', textDecoration: 'none',
                        transition: 'background 150ms'
                      }}
                      className="dropdown-item"
                    >
                      <div style={{ 
                        width: 40, height: 40, borderRadius: 8, overflow: 'hidden', 
                        background: project.brand_logo_url ? 'none' : 'var(--bg-hover)', 
                        border: '1px solid var(--border)', flexShrink: 0, marginRight: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {project.brand_logo_url ? (
                          <img src={project.brand_logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <FolderKanban size={20} color="var(--text-faint)" />
                        )}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{project.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            Pripojené API: {project.meta_access_token ? <span style={{ color: 'var(--success)' }}>Áno</span> : <span style={{ color: 'var(--error)' }}>Nie</span>}
                          </span>
                        </div>
                      </div>

                      <div style={{ 
                        padding: '6px 14px', borderRadius: 20, background: 'var(--brand)', 
                        color: 'white', fontSize: 12, fontWeight: 600, display: 'flex', 
                        alignItems: 'center', gap: 6 
                      }}>
                        Otvoriť Projekt
                        <ArrowRight size={14} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <MonitorPlay size={24} style={{ opacity: 0.5 }} />
                  Tento používateľ zatiaľ nevytvoril žiadne projekty.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

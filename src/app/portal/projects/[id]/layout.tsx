import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { ProjectNav } from './ProjectNav'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, brand_colors')
    .eq('id', id)
    .single()

  if (!project) redirect('/portal/projects')



  return (
    <div>
      {/* Project breadcrumb bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, paddingBottom: 16,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/portal/projects" className="btn-ghost" style={{ padding: '6px 10px' }}>
            <ArrowLeft size={14} />
          </Link>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: project.brand_colors?.primary || 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={13} color="white" />
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
            {project.name}
          </span>
        </div>
      </div>

      {/* Project sub-navigation */}
      <ProjectNav id={id} />

      {children}
    </div>
  )
}

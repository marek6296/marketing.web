import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarClient from './CalendarClient'

export default async function ProjectCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: posts }, { data: notes }] = await Promise.all([
    supabase
      .from('posts')
      .select('*')
      .eq('project_id', id)
      .in('status', ['scheduled', 'published', 'draft'])
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('calendar_notes')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true })
  ])

  const scheduled = posts?.filter(p => p.status === 'scheduled') ?? []
  const published = posts?.filter(p => p.status === 'published') ?? []
  const drafts = posts?.filter(p => p.status === 'draft') ?? []

  return (
    <CalendarClient 
      projectId={id} 
      scheduled={scheduled as any} 
      published={published as any}
      drafts={drafts as any}
      initialNotes={notes || []}
    />
  )
}



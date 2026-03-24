import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )
}

// Admin client to look up users by email
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET /api/project-members?projectId=X
export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

  // Verify requester is owner
  const { data: project } = await supabase
    .from('projects')
    .select('client_id')
    .eq('id', projectId)
    .single()

  if (!project || project.client_id !== user.id) {
    return NextResponse.json({ error: 'Not the owner' }, { status: 403 })
  }

  const { data: members } = await supabase
    .from('project_members')
    .select('id, user_id, invited_email, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  return NextResponse.json({ members: members || [] })
}

// POST /api/project-members  { projectId, email }
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, email } = await req.json()
  if (!projectId || !email) return NextResponse.json({ error: 'Chýba projectId alebo email' }, { status: 400 })

  // Verify requester is owner
  const { data: project } = await supabase
    .from('projects')
    .select('client_id, name')
    .eq('id', projectId)
    .single()

  if (!project || project.client_id !== user.id) {
    return NextResponse.json({ error: 'Nie ste vlastník projektu' }, { status: 403 })
  }

  // Look up user by email using admin client
  const admin = getAdminClient()
  const { data: usersPage, error: lookupErr } = await admin.auth.admin.listUsers({ perPage: 1000 })

  if (lookupErr) return NextResponse.json({ error: 'Chyba pri hľadaní používateľa' }, { status: 500 })

  const targetUser = usersPage.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

  if (!targetUser) {
    return NextResponse.json({
      error: `Používateľ s emailom ${email} nebol nájdený. Musí mať vytvorený účet.`,
    }, { status: 404 })
  }

  if (targetUser.id === user.id) {
    return NextResponse.json({ error: 'Nemôžete pridať seba samého' }, { status: 400 })
  }

  // Insert membership
  const { error: insertErr } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: targetUser.id, invited_email: email.toLowerCase() })

  if (insertErr) {
    if (insertErr.code === '23505') {
      return NextResponse.json({ error: 'Tento používateľ je už členom projektu' }, { status: 409 })
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId: targetUser.id, email: email.toLowerCase() })
}

// DELETE /api/project-members  { projectId, memberId }
export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, memberId } = await req.json()
  if (!projectId || !memberId) return NextResponse.json({ error: 'Chýba projectId alebo memberId' }, { status: 400 })

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('id', memberId)
    .eq('project_id', projectId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

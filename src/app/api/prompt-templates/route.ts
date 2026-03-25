import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(c => cookieStore.set(c.name, c.value, c.options)) } }
  )
}

// GET — list prompts for a project
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('project_id', projectId)
    .order('is_favorite', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prompts: data })
}

// POST — create a new prompt
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { projectId, title, promptText, category, sourceImageUrl } = body

  if (!projectId || !promptText?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('prompt_templates')
    .insert({
      project_id: projectId,
      user_id: user.id,
      title: title || '',
      prompt_text: promptText.trim(),
      category: category || 'general',
      source_image_url: sourceImageUrl || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prompt: data })
}

// PATCH — update a prompt
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, title, promptText, category, isFavorite } = body

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = await getSupabase()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (title !== undefined) updates.title = title
  if (promptText !== undefined) updates.prompt_text = promptText
  if (category !== undefined) updates.category = category
  if (isFavorite !== undefined) updates.is_favorite = isFavorite

  const { data, error } = await supabase
    .from('prompt_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prompt: data })
}

// DELETE — delete a prompt
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = await getSupabase()
  const { error } = await supabase.from('prompt_templates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

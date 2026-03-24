import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  let query = supabase
    .from('posts')
    .select('id, caption, image_url, platform, topic, status, created_at, scheduled_at, fb_post_id, ig_post_id')
    .order('created_at', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data })
}

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, caption, status, scheduled_at, image_url } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (caption !== undefined) updates.caption = caption
  if (status !== undefined) updates.status = status
  if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at
  if (image_url !== undefined) updates.image_url = image_url

  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}

export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const deleteSocial = searchParams.get('deleteSocial') === 'true'
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const socialErrors: string[] = []

  // ─── Optionally delete from Meta platforms first ──────────────────────────
  if (deleteSocial) {
    const { data: post } = await supabase
      .from('posts')
      .select('fb_post_id, ig_post_id, project_id')
      .eq('id', id)
      .single()
    console.log('[DELETE] post fetched:', JSON.stringify(post))

    if (post?.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('meta_access_token')
        .eq('id', post.project_id)
        .single()

      const token = project?.meta_access_token

      console.log('[DELETE] token found:', !!token, 'fb_post_id:', post.fb_post_id, 'ig_post_id:', post.ig_post_id)

      if (token) {
        // Delete Facebook post
        if (post.fb_post_id) {
          try {
            const fbRes = await fetch(
              `https://graph.facebook.com/v21.0/${post.fb_post_id}?access_token=${token}`,
              { method: 'DELETE' }
            )
            const fbData = await fbRes.json()
            console.log('[DELETE] FB response:', JSON.stringify(fbData))
            if (fbData.error) socialErrors.push(`Facebook: ${fbData.error.message}`)
          } catch (e) { socialErrors.push(`Facebook: sieťová chyba`) }
        }
        // Delete Instagram media
        if (post.ig_post_id) {
          try {
            const igRes = await fetch(
              `https://graph.facebook.com/v21.0/${post.ig_post_id}?access_token=${token}`,
              { method: 'DELETE' }
            )
            const igData = await igRes.json()
            console.log('[DELETE] IG response:', JSON.stringify(igData))
            if (igData.error) socialErrors.push(`Instagram: ${igData.error.message}`)
          } catch (e) { socialErrors.push(`Instagram: sieťová chyba`) }
        }
        if (!post.fb_post_id && !post.ig_post_id) {
          socialErrors.push('Príspevok nemal uložené ID sociálnych sietí – nebol publikovaný cez portál.')
        }
      } else {
        socialErrors.push('Chýba Meta Access Token v nastaveniach projektu.')
      }
    }
  }

  // ─── Delete from DB ───────────────────────────────────────────────────────
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, socialErrors })
}

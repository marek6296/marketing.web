import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { publishPostToMeta } from '@/lib/meta/publishHelper'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId } = await req.json()
  if (!postId) return NextResponse.json({ error: 'Chýba postId' }, { status: 400 })

  const { data: post } = await supabase.from('posts').select('*').eq('id', postId).single()
  if (!post) return NextResponse.json({ error: 'Príspevok neexistuje' }, { status: 404 })

  const { data: project } = await supabase
    .from('projects')
    .select('facebook_page_id, instagram_account_id, meta_access_token')
    .eq('id', post.project_id)
    .single()

  if (!project?.facebook_page_id || !project?.meta_access_token) {
    return NextResponse.json({
      error: 'Nemáte nastavený Facebook Page ID alebo Access Token. Choďte do Nastavení projektu.',
    }, { status: 400 })
  }

  const pageId = project.facebook_page_id
  const token = project.meta_access_token
  const result = await publishPostToMeta(
    { id: post.id, image_url: post.image_url, caption: post.caption, post_type: post.post_type, platform: post.platform },
    project,
    supabase
  )

  if (result.errors.length > 0 && !result.success) {
    return NextResponse.json({ error: result.errors.join(' | ') }, { status: 500 })
  }

  return NextResponse.json({ success: true, facebook: result.facebook, instagram: result.instagram, errors: result.errors })
}

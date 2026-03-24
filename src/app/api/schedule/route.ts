import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

  const { postId, scheduledAt } = await req.json()
  if (!postId || !scheduledAt) {
    return NextResponse.json({ error: 'Chýba postId alebo scheduledAt' }, { status: 400 })
  }

  // Verify the post belongs to this user
  const { data: existingPost } = await supabase
    .from('posts')
    .select('id, client_id')
    .eq('id', postId)
    .eq('client_id', user.id)
    .single()

  if (!existingPost) {
    return NextResponse.json({ error: 'Príspevok neexistuje' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('posts')
    .update({
      status: 'scheduled',
      scheduled_at: scheduledAt,
    })
    .eq('id', postId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ post: data })
}

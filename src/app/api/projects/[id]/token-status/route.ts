import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params
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
  if (!user) return NextResponse.json({ hasToken: false }, { status: 401 })

  const { data: project } = await supabase
    .from('projects')
    .select('meta_access_token, facebook_page_id')
    .eq('id', projectId)
    .eq('client_id', user.id)
    .single()

  return NextResponse.json({
    hasToken: !!(project?.meta_access_token && project?.facebook_page_id),
  })
}

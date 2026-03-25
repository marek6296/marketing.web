import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { publishPostToMeta } from '@/lib/meta/publishHelper'

// Force dynamic execution since it takes a cron request
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // 1. Verify Vercel Cron Secret to protect the endpoint
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized CRON trigger' }, { status: 401 })
  }

  // 2. Instantiate Supabase with Service Role to bypass RLS and read all projects' posts
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 3. Find all scheduled posts whose scheduled_at is less than or equal to current time
  const now = new Date().toISOString()
  const { data: overduePosts, error } = await supabaseAdmin
    .from('posts')
    .select('*, projects(facebook_page_id, instagram_account_id, meta_access_token)')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)

  if (error) {
    console.error('[CRON ERROR] Fetching posts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!overduePosts || overduePosts.length === 0) {
    return NextResponse.json({ message: 'No overdue posts to process.' })
  }

  console.log(`[CRON] Found ${overduePosts.length} post(s) to publish.`)

  const results = []

  // 4. Loop through and publish each
  for (const post of overduePosts) {
    const project = post.projects
    
    // Safety check if project has tokens (though UI shouldn't allow scheduling without it)
    if (!project || Array.isArray(project) /* just to satisfy typings if it was joined loosely */) {
      console.warn(`[CRON WARNING] Post ${post.id} missing project relations`)
      results.push({ id: post.id, status: 'failed', error: 'Missing project data' })
      continue
    }

    try {
      console.log(`[CRON] Publishing post ${post.id} ...`)
      const publishResult = await publishPostToMeta(
        { id: post.id, image_url: post.image_url, caption: post.caption, post_type: post.post_type, platform: post.platform },
        { 
          facebook_page_id: project.facebook_page_id, 
          instagram_account_id: project.instagram_account_id, 
          meta_access_token: project.meta_access_token 
        },
        supabaseAdmin
      )
      
      results.push({ id: post.id, publishResult })
    } catch (err: unknown) {
      console.error(`[CRON ERROR] Publishing post ${post.id}:`, err)
      
      // Mark as failed directly since the helper might have thrown an uncaught error
      await supabaseAdmin.from('posts').update({ status: 'failed' }).eq('id', post.id)
      
      results.push({ id: post.id, status: 'failed', error: err instanceof Error ? err.message : 'Unknown' })
    }
  }

  return NextResponse.json({ message: 'Cron job finished successfully', processed: results.length, results })
}

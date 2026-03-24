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

  const { postId } = await req.json()
  if (!postId) return NextResponse.json({ error: 'Chýba postId' }, { status: 400 })

  // Load post
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .eq('client_id', user.id)
    .single()

  if (!post) return NextResponse.json({ error: 'Príspevok neexistuje' }, { status: 404 })

  // Load project credentials (tokens are stored per-project)
  const { data: project } = await supabase
    .from('projects')
    .select('facebook_page_id, instagram_account_id, meta_access_token')
    .eq('id', post.project_id)
    .eq('client_id', user.id)
    .single()

  if (!project?.facebook_page_id || !project?.meta_access_token) {
    return NextResponse.json({
      error: 'Nemáte nastavený Facebook Page ID alebo Access Token. Choďte do Nastavení projektu.',
    }, { status: 400 })
  }

  const pageId = project.facebook_page_id
  const accessToken = project.meta_access_token
  const results: { facebook?: string; instagram?: string; errors: string[] } = { errors: [] }

  // ─── PUBLISH TO FACEBOOK ───────────────────────────────────────────────────
  if (post.platform === 'facebook' || post.platform === 'both') {
    try {
      const fbBody: Record<string, string> = {
        message: post.caption || '',
        access_token: accessToken,
      }

      // If we have an image, use photo endpoint; otherwise use feed
      if (post.image_url) {
        // Post photo with caption
        const photoRes = await fetch(
          `https://graph.facebook.com/v21.0/${pageId}/photos`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: post.image_url,
              caption: post.caption || '',
              access_token: accessToken,
            }),
          }
        )
        const photoData = await photoRes.json()
        if (photoData.error) {
          results.errors.push(`Facebook: ${photoData.error.message}`)
        } else {
          results.facebook = photoData.post_id || photoData.id
        }
      } else {
        // Text-only post
        const feedRes = await fetch(
          `https://graph.facebook.com/v21.0/${pageId}/feed`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fbBody),
          }
        )
        const feedData = await feedRes.json()
        if (feedData.error) {
          results.errors.push(`Facebook: ${feedData.error.message}`)
        } else {
          results.facebook = feedData.id
        }
      }
    } catch (err) {
      results.errors.push(`Facebook: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // ─── PUBLISH TO INSTAGRAM ──────────────────────────────────────────────────
  if ((post.platform === 'instagram' || post.platform === 'both') && project.instagram_account_id) {
    try {
      if (!post.image_url) {
        results.errors.push('Instagram: Príspevok musí mať obrázok')
      } else {
        // Step 1: Create media container
        const containerRes = await fetch(
          `https://graph.facebook.com/v21.0/${project.instagram_account_id}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_url: post.image_url,
              caption: post.caption || '',
              access_token: accessToken,
            }),
          }
        )
        const containerData = await containerRes.json()

        if (containerData.error) {
          results.errors.push(`Instagram: ${containerData.error.message}`)
        } else {
          // Step 2: Publish the container
          const publishRes = await fetch(
            `https://graph.facebook.com/v21.0/${project.instagram_account_id}/media_publish`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                creation_id: containerData.id,
                access_token: accessToken,
              }),
            }
          )
          const publishData = await publishRes.json()
          if (publishData.error) {
            results.errors.push(`Instagram: ${publishData.error.message}`)
          } else {
            results.instagram = publishData.id
          }
        }
      }
    } catch (err) {
      results.errors.push(`Instagram: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // ─── UPDATE DB ─────────────────────────────────────────────────────────────
  const published = results.facebook || results.instagram
  await supabase.from('posts').update({
    status: published ? 'published' : (results.errors.length > 0 ? 'failed' : 'published'),
    published_at: published ? new Date().toISOString() : null,
    fb_post_id: results.facebook || null,
    ig_post_id: results.instagram || null,
  }).eq('id', postId)

  if (results.errors.length > 0 && !published) {
    return NextResponse.json({ error: results.errors.join(' | ') }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    facebook: results.facebook,
    instagram: results.instagram,
    errors: results.errors,
  })
}

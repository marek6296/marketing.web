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
  const isStory = post.post_type === 'story'
  const platform = post.platform as string

  const results: { facebook?: string; instagram?: string; errors: string[] } = { errors: [] }

  // ─── FACEBOOK ────────────────────────────────────────────────────────────────
  const doFacebook = platform === 'facebook' || platform === 'both' ||
    platform === 'facebook_story' || platform === 'both_stories'

  if (doFacebook) {
    try {
      if (isStory) {
        // Facebook Photo Story
        if (!post.image_url) {
          results.errors.push('Facebook Story: Príspevok musí mať obrázok')
        } else {
          const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photo_stories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: post.image_url, access_token: token }),
          })
          const data = await res.json()
          if (data.error) results.errors.push(`Facebook Story: ${data.error.message}`)
          else results.facebook = data.post_id || data.id
        }
      } else {
        // Regular Facebook post
        if (post.image_url) {
          const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: post.image_url, caption: post.caption || '', access_token: token }),
          })
          const data = await res.json()
          if (data.error) results.errors.push(`Facebook: ${data.error.message}`)
          else results.facebook = data.post_id || data.id
        } else {
          const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: post.caption || '', access_token: token }),
          })
          const data = await res.json()
          if (data.error) results.errors.push(`Facebook: ${data.error.message}`)
          else results.facebook = data.id
        }
      }
    } catch (err) {
      results.errors.push(`Facebook: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // ─── INSTAGRAM ───────────────────────────────────────────────────────────────
  const doInstagram = (platform === 'instagram' || platform === 'both' ||
    platform === 'instagram_story' || platform === 'both_stories') &&
    !!project.instagram_account_id

  if (doInstagram) {
    try {
      if (!post.image_url) {
        results.errors.push('Instagram: Príspevok musí mať obrázok')
      } else {
        const igUserId = project.instagram_account_id

        // Build container params — stories use media_type=STORIES
        const containerParams: Record<string, string> = {
          image_url: post.image_url,
          access_token: token,
        }
        if (isStory) {
          containerParams.media_type = 'STORIES'
          // Link sticker — only supported for Stories
          if (post.link_sticker_url) {
            containerParams.link_sticker_url = post.link_sticker_url
          }
        } else {
          containerParams.caption = post.caption || ''
        }

        // Step 1: Create media container
        const containerRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(containerParams),
        })
        const containerData = await containerRes.json()
        console.log(`[IG${isStory ? '_STORY' : ''}] container response:`, JSON.stringify(containerData))

        // If link_sticker_url caused an error, retry without it
        let finalContainerData = containerData
        if (containerData.error && post.link_sticker_url && isStory) {
          console.log('[IG_STORY] link_sticker_url rejected, retrying without it...')
          const paramsWithoutLink = { ...containerParams }
          delete paramsWithoutLink.link_sticker_url
          const retryRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paramsWithoutLink),
          })
          finalContainerData = await retryRes.json()
          console.log(`[IG_STORY] retry response (no link):`, JSON.stringify(finalContainerData))
          // Surface warning to user that link sticker was not applied
          results.errors.push(`⚠️ Link sticker nebol pridaný: ${containerData.error.message}`)
        }

        if (finalContainerData.error) {
          results.errors.push(`Instagram${isStory ? ' Story' : ''}: ${finalContainerData.error.message}`)
        } else {
          const containerId = finalContainerData.id

          // Step 2: Poll until FINISHED
          let statusCode = 'IN_PROGRESS'
          let attempts = 0
          while (statusCode === 'IN_PROGRESS' && attempts < 30) {
            await new Promise(r => setTimeout(r, 1000))
            const statusRes = await fetch(
              `https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${token}`
            )
            const statusData = await statusRes.json()
            statusCode = statusData.status_code || 'ERROR'
            attempts++
            console.log(`[IG${isStory ? '_STORY' : ''}] status ${attempts}: ${statusCode}`)
          }

          if (statusCode === 'FINISHED') {
            // Step 3: Publish
            const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ creation_id: containerId, access_token: token }),
            })
            const publishData = await publishRes.json()
            console.log(`[IG${isStory ? '_STORY' : ''}] publish response:`, JSON.stringify(publishData))
            if (publishData.error) results.errors.push(`Instagram${isStory ? ' Story' : ''}: ${publishData.error.message}`)
            else results.instagram = publishData.id
          } else {
            results.errors.push(`Instagram${isStory ? ' Story' : ''}: Spracovanie zlyhalo (status: ${statusCode})`)
          }
        }
      }
    } catch (err) {
      results.errors.push(`Instagram: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // ─── UPDATE DB ───────────────────────────────────────────────────────────────
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

  return NextResponse.json({ success: true, facebook: results.facebook, instagram: results.instagram, errors: results.errors })
}

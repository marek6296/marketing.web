export async function publishPostToMeta(
  post: { id: string; image_url: string | null; caption: string | null; post_type: string | null; platform: string },
  project: { facebook_page_id: string | null; instagram_account_id: string | null; meta_access_token: string | null },
  supabaseAdmin: any // the Supabase client used to update the post status
) {
  if (!project.facebook_page_id || !project.meta_access_token) {
    return { success: false, errors: ['Chýba Facebook Page ID alebo Access Token'] }
  }

  const pageId = project.facebook_page_id
  const token = project.meta_access_token
  const isStory = post.post_type === 'story'
  const platform = post.platform

  const results: { facebook?: string; instagram?: string; errors: string[] } = { errors: [] }

  // ─── FACEBOOK ────────────────────────────────────────────────────────────────
  const doFacebook = platform === 'facebook' || platform === 'both' ||
    platform === 'facebook_story' || platform === 'both_stories'

  if (doFacebook) {
    try {
      if (isStory) {
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
        const containerParams: Record<string, string> = {
          image_url: post.image_url,
          access_token: token,
        }
        if (isStory) containerParams.media_type = 'STORIES'
        else containerParams.caption = post.caption || ''

        const containerRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(containerParams),
        })
        const containerData = await containerRes.json()

        if (containerData.error) {
          results.errors.push(`Instagram${isStory ? ' Story' : ''}: ${containerData.error.message}`)
        } else {
          const containerId = containerData.id
          let statusCode = 'IN_PROGRESS'
          let attempts = 0
          while (statusCode === 'IN_PROGRESS' && attempts < 30) {
            await new Promise(r => setTimeout(r, 1000))
            const statusRes = await fetch(`https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${token}`)
            const statusData = await statusRes.json()
            statusCode = statusData.status_code || 'ERROR'
            attempts++
          }

          if (statusCode === 'FINISHED') {
            const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ creation_id: containerId, access_token: token }),
            })
            const publishData = await publishRes.json()
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
  await supabaseAdmin.from('posts').update({
    status: published ? 'published' : (results.errors.length > 0 ? 'failed' : 'published'),
    published_at: published ? new Date().toISOString() : null,
    fb_post_id: results.facebook || null,
    ig_post_id: results.instagram || null,
  }).eq('id', post.id)

  return { success: !!published, facebook: results.facebook, instagram: results.instagram, errors: results.errors }
}

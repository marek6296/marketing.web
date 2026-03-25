import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    console.error('Meta OAuth error:', error, searchParams.get('error_description'))
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/portal/projects?oauth=error`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/portal/projects?oauth=error`)
  }

  // Decode state
  let projectId: string, userId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'))
    projectId = decoded.projectId
    userId = decoded.userId
  } catch {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/portal/projects?oauth=error`)
  }

  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/callback`

  try {
    // Step 1: Exchange code for short-lived user access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      console.error('Token exchange failed:', tokenData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/portal/projects/${projectId}/settings?oauth=error`)
    }
    const shortLivedToken: string = tokenData.access_token

    // Step 2: Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
    )
    const longData = await longRes.json()
    const longLivedToken: string = longData.access_token || shortLivedToken

    // Step 3: Get user's pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedToken}`
    )
    const pagesData = await pagesRes.json()
    const pages: { id: string; name: string; access_token: string }[] = pagesData.data || []

    if (pages.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/portal/projects/${projectId}/settings?oauth=no_pages`
      )
    }

    // If multiple pages, redirect to page selection (future) – for now use the first
    if (pages.length > 1) {
      // Encode pages in a cookie and redirect to a page-picker UI
      const encodedPages = Buffer.from(JSON.stringify({ pages, projectId })).toString('base64url')
      const response = NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/portal/projects/${projectId}/settings/select-page`
      )
      response.cookies.set('meta_pages', encodedPages, { httpOnly: true, maxAge: 300, path: '/' })
      return response
    }

    // Single page – proceed automatically
    const page = pages[0]
    const pageAccessToken = page.access_token
    const facebookPageId = page.id

    // Step 4: Get Instagram Business Account for this page
    let instagramAccountId: string | null = null
    try {
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${facebookPageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
      )
      const igData = await igRes.json()
      instagramAccountId = igData.instagram_business_account?.id || null
    } catch {
      // IG not connected to this page – continue without it
    }

    // Step 5: Save to DB using service role (bypass RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: dbError } = await supabaseAdmin
      .from('projects')
      .update({
        meta_access_token: pageAccessToken,
        facebook_page_id: facebookPageId,
        instagram_account_id: instagramAccountId,
      })
      .eq('id', projectId)

    if (dbError) {
      console.error('DB save error:', dbError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/portal/projects/${projectId}/settings?oauth=error`
      )
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/portal/projects/${projectId}/settings?oauth=success`
    )
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/portal/projects/${projectId}/settings?oauth=error`
    )
  }
}

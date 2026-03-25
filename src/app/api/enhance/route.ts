import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GoogleGenAI } from '@google/genai'

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

  const formData = await req.formData()
  const file = formData.get('image') as File
  const projectId = formData.get('projectId') as string
  const enhanceMode = formData.get('enhanceMode') as string || 'professional'
  const submittedAspectRatio = formData.get('aspectRatio') as string || '1:1'
  const referenceImageUrlsStr = formData.get('referenceImageUrls') as string | null
  
  // map 4:5 to 3:4 for Gemini supported aspect ratios
  const aspectRatio = submittedAspectRatio === '4:5' ? '3:4' : submittedAspectRatio
  let referenceImageUrls: string[] = []
  if (referenceImageUrlsStr) {
    try { referenceImageUrls = JSON.parse(referenceImageUrlsStr) } catch { /* ignore */ }
  }

  if (!file) return NextResponse.json({ error: 'Obrázok je povinný' }, { status: 400 })

  // Load project brand settings
  let brandPrompt = 'Professional marketing photo'
  let brandColors: { primary?: string; secondary?: string } | null = null
  let imageStyle: Record<string, string> | null = null

  if (projectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('name, brand_style_prompt, brand_colors, image_style')
      .eq('id', projectId)
      .eq('client_id', user.id)
      .single()

    if (project) {
      brandPrompt = project.brand_style_prompt || `Professional photo for ${project.name}`
      brandColors = project.brand_colors as { primary?: string; secondary?: string } | null
      imageStyle = project.image_style as Record<string, string> | null
    }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return NextResponse.json({ error: 'API kľúč nie je nakonfigurovaný' }, { status: 500 })
  }

  try {
    const ai = new GoogleGenAI({ apiKey })

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type || 'image/jpeg'

    // Build enhancement prompt based on mode
    const enhancePrompts: Record<string, string> = {
      professional: `Enhance this photo to professional commercial quality. Improve lighting, colors, sharpness. Make it look like a professional studio photo.`,
      'food-pro': `Enhance this food photo to professional food photography quality. Improve lighting to warm appetizing tones, enhance colors to make food look more appetizing. Magazine-quality food styling.`,
      'product-shot': `Transform this into a professional product shot. Clean background, perfect lighting, sharp focus on the product. E-commerce quality.`,
      'social-media': `Optimize this photo for social media. Make colors pop, improve contrast, add subtle vibrancy. Instagram-worthy quality.`,
    }

    const primaryColor = brandColors?.primary || '#F59E0B'
    const mood = imageStyle?.mood || 'warm'

    const prompt = `${enhancePrompts[enhanceMode] || enhancePrompts.professional}

Brand style: ${brandPrompt}
Color mood: ${mood}, incorporate subtle ${primaryColor} color accents where natural.
Output format: ${aspectRatio === '9:16' ? 'vertical portrait 9:16 aspect ratio, optimized for Story/Reels' : aspectRatio === '16:9' ? 'landscape 16:9 aspect ratio' : 'optimized for social media post'}.
Compose the image to fill this aspect ratio naturally.
Keep the same subject but make it look dramatically more professional.
Output a single enhanced image, no text.`

    // Build parts: reference images (style) -> input image (content) -> text instruction
    const parts: { inlineData?: { mimeType: string; data: string }, text?: string }[] = []

    if (referenceImageUrls.length > 0) {
      for (const url of referenceImageUrls) {
        try {
          const r = await fetch(url)
          if (r.ok) {
            const buf = await r.arrayBuffer()
            parts.push({ inlineData: { data: Buffer.from(buf).toString('base64'), mimeType: r.headers.get('content-type') || 'image/jpeg' } })
          }
        } catch { /* ignore */ }
      }
    }

    parts.push({ inlineData: { mimeType, data: base64 } })
    
    if (referenceImageUrls.length > 0) {
      parts.push({ text: `Transformuj tento obrázok (posledný priložený) do vizuálneho štýlu referenčných obrázkov (prvé priložené), zatiaľ čo ho profesionálne vylepšíš. Zachovaj obsah/predmet z môjho obrázka, ale aplikuj štýl, farebnú paletu a osvetlenie z referenčných obrázkov.\n\n${prompt}` })
    } else {
      parts.push({ text: prompt })
    }

    // Use Nano Banana 2 with reference image input
    const result = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [{ parts }],
      config: {
        responseModalities: ['Image'],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        aspectRatio,
      } as any,
    })

    // Extract enhanced image from response
    if (result.candidates?.[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageBase64 = part.inlineData.data
          const mime = part.inlineData.mimeType || 'image/png'
          if (imageBase64) {
            const buffer = Buffer.from(imageBase64, 'base64')
            const ext = mime.includes('png') ? 'png' : 'jpg'
            const filename = `${user.id}/${projectId || 'enhanced'}/${Date.now()}_enhanced.${ext}`
            const { data: uploadData } = await supabase.storage
              .from('post-images')
              .upload(filename, buffer, { contentType: mime, upsert: true })

            if (uploadData) {
              const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(filename)
              return NextResponse.json({ imageUrl: urlData.publicUrl })
            }
          }
        }
      }
    }

    return NextResponse.json({ error: 'Nepodarilo sa vylepšiť obrázok' }, { status: 500 })

  } catch (err) {
    console.error('Enhance error:', err)
    return NextResponse.json({ error: 'Chyba pri vylepšovaní obrázku' }, { status: 500 })
  }
}

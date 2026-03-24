import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GoogleGenAI } from '@google/genai'

/* ─── Project type context mapping ─────────────────────────────────── */
const PROJECT_TYPE_CONTEXT: Record<string, {
  label: string; textContext: string; imageSubjects: string
}> = {
  restaurant: {
    label: 'Reštaurácia / Kaváreň',
    textContext: 'Typ podniku: reštaurácia alebo kaváreň. Píš o jedle, nápojoch, atmosfére, seznónnych menu, šef-kuchárovi. Tón: poháňajúci, čerstvý, gastronomický.',
    imageSubjects: 'gourmet food, dishes, coffee, restaurant interior, chef, fresh ingredients, table setting',
  },
  hotel: {
    label: 'Hotel / Ubytovanie',
    textContext: 'Typ podniku: hotel alebo ubytovanie. Píš o izbách, službách, lokalite, relaxácii a zažitku hostí. Tón: elegantný, pohostinný, inpiratívny.',
    imageSubjects: 'luxury hotel room, lobby, pool, spa, hotel exterior, scenic view, amenities',
  },
  influencer: {
    label: 'Osoba / Influencer',
    textContext: 'Typ účtu: osoba alebo influencer. Píš o životný štýl, osobný rozvoj, každodenný život, módu, cestovanie alebo hobby. Tón: osobný, autentický, inpiratívny.',
    imageSubjects: 'lifestyle photography, portrait, fashion, travel, personal moments, aesthetic flat lay',
  },
  shop: {
    label: 'Obchod / E-shop',
    textContext: 'Typ podniku: obchod alebo e-shop. Píš o produktoch, kolékciách, zlúvach, nové kolékcie, výpredaj. Tón: účielný, poháňajúci ku kúpe, enerġetický.',
    imageSubjects: 'product photography, merchandise display, store interior, shopping bags, product detail',
  },
  company: {
    label: 'Firma / Agentúra',
    textContext: 'Typ podniku: firma alebo agentúra. Píš o službách, tíme, úspechu, projektoch a odborných vedomostiach. Tón: profesionálny, dôveryhodný, expertský.',
    imageSubjects: 'modern office, professional team meeting, corporate branding, work environment, business success',
  },
  custom: {
    label: 'Vlastný typ',
    textContext: 'Vlastný typ projektu – riaď sa popisom projektu a nastaveniami.',
    imageSubjects: 'professional marketing photography, custom brand visual context',
  },
}

/* ─── Image style → prompt fragment mapping ────────────────────────── */
const TEMPLATE_PROMPTS: Record<string, string> = {
  'modern-minimal': 'Clean, minimalist composition with plenty of negative space. Sharp focus, geometric elements.',
  'bold-vibrant': 'Bold, vibrant and energetic composition. High contrast, strong colors, dynamic angles.',
  'elegant-luxury': 'Luxurious, elegant presentation. Dark moody tones, gold accents, sophisticated styling.',
  'playful-casual': 'Playful, casual and friendly aesthetic. Bright colors, organic shapes, warm feel.',
  'rustic-natural': 'Rustic, natural and organic aesthetic. Earthy tones, wooden textures, natural lighting.',
}

const MOOD_PROMPTS: Record<string, string> = {
  warm: 'Warm color temperature, golden hour lighting, inviting atmosphere.',
  cool: 'Cool tones, blue-white lighting, fresh and clean atmosphere.',
  dark: 'Dark and moody atmosphere, dramatic shadows, rich deep colors.',
  bright: 'Bright and airy, high-key lighting, cheerful and optimistic mood.',
}

const BG_PROMPTS: Record<string, string> = {
  gradient: 'Smooth gradient background that complements the subject.',
  solid: 'Clean solid-color background for maximum focus on the subject.',
  contextual: 'Contextual lifestyle background showing the product in use.',
  blurred: 'Shallow depth of field with beautifully blurred bokeh background.',
}

const PHOTO_STYLE_PROMPTS: Record<string, string> = {
  'studio-lighting': 'Professional studio lighting, three-point setup, no harsh shadows.',
  'natural-light': 'Beautiful natural window light, soft shadows, organic feel.',
  'dramatic': 'Dramatic chiaroscuro lighting, deep shadows, single light source.',
  'flat-lay': 'Overhead flat-lay composition, evenly lit, organized arrangement.',
}

function buildImagePrompt(
  projectName: string,
  topic: string,
  brandPrompt: string,
  brandColors: { primary?: string; secondary?: string } | null,
  imageStyle: Record<string, string> | null,
  projectType?: string,
): string {
  const template = imageStyle?.template || 'modern-minimal'
  const mood = imageStyle?.mood || 'warm'
  const background = imageStyle?.background || 'gradient'
  const photoStyle = imageStyle?.photoStyle || 'studio-lighting'
  const primaryColor = brandColors?.primary || '#F59E0B'
  const secondaryColor = brandColors?.secondary || '#FFFFFF'
  const typeCtx = projectType ? PROJECT_TYPE_CONTEXT[projectType] : null
  const subjects = typeCtx?.imageSubjects || 'professional marketing subject'

  return `Generate a professional marketing image for "${projectName}".
Subject/Theme: ${topic}.
Business type visual subjects: ${subjects}.
Brand identity: ${brandPrompt}

VISUAL STYLE:
${TEMPLATE_PROMPTS[template] || TEMPLATE_PROMPTS['modern-minimal']}
${MOOD_PROMPTS[mood] || MOOD_PROMPTS['warm']}
${BG_PROMPTS[background] || BG_PROMPTS['gradient']}
${PHOTO_STYLE_PROMPTS[photoStyle] || PHOTO_STYLE_PROMPTS['studio-lighting']}

COLOR PALETTE: Primary brand color ${primaryColor}, secondary ${secondaryColor}. The image should subtly incorporate these colors.

REQUIREMENTS:
- Ultra high quality, sharp and detailed
- Professional commercial photography level
- Square 1:1 format optimized for Instagram/Facebook
- NO text, NO watermarks, NO logos overlaid on the image
- Magazine-quality composition and styling`
}

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

  const body = await req.json()
  const { topic, platform, projectId, mode = 'post', imageData, imageMime } = body
  if (!topic && !imageData) return NextResponse.json({ error: 'Téma alebo obrázok je povinný' }, { status: 400 })

  // Load project brand settings
  let projectName = 'Projekt'
  let projectDescription = ''
  let brandStylePrompt = ''
  let brandColors: { primary?: string; secondary?: string } | null = null
  let imageStyle: Record<string, string> | null = null
  let projectType = 'restaurant'
  let referenceImageData: string | null = null
  let referenceImageMime = 'image/jpeg'

  if (projectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('name, brand_style_prompt, brand_colors, description, image_style, project_type, image_prompt, image_reference_url')
      .eq('id', projectId)
      .single()

    if (project) {
      projectName = project.name
      projectDescription = project.description || ''
      brandStylePrompt = project.brand_style_prompt || ''
      brandColors = project.brand_colors as { primary?: string; secondary?: string } | null
      imageStyle = project.image_style as Record<string, string> | null
      projectType = project.project_type || 'restaurant'
      if (project.image_prompt) brandStylePrompt = brandStylePrompt
        ? `${brandStylePrompt}\n\nStály vizuálny kontext: ${project.image_prompt}`
        : project.image_prompt
      // Fetch reference image if URL is set
      if (project.image_reference_url) {
        try {
          const refRes = await fetch(project.image_reference_url)
          if (refRes.ok) {
            const buf = await refRes.arrayBuffer()
            referenceImageData = Buffer.from(buf).toString('base64')
            referenceImageMime = refRes.headers.get('content-type') || 'image/jpeg'
          }
        } catch { /* ignore */ }
      }
    }
  }

  // Build the combined brand context for image generation (legacy compat)
  const brandPrompt = brandStylePrompt || `${projectName}. ${projectDescription}`.trim()

  const apiKey = process.env.GEMINI_API_KEY
  let imageUrl: string | null = null
  let caption = ''

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    caption = mode === 'image-only' ? '' : generateDemoCaption(projectName, topic || 'príspevok', platform)
  } else {
    try {
      const ai = new GoogleGenAI({ apiKey })

      // 1. Generate caption (skip for image-only mode)
      if (mode !== 'image-only') {
        const typeCtx = PROJECT_TYPE_CONTEXT[projectType]
        const textPrompt = `Si expert na marketing pre ${typeCtx?.label || 'podnik'}. Napíš príspevok na sociálne siete.

INFO O PROJEKTE:
- Názov: ${projectName}
${projectDescription ? `- Popis: ${projectDescription}` : ''}
- Typ podniku: ${typeCtx?.label || projectType}
${typeCtx?.textContext ? `- Kontext: ${typeCtx.textContext}` : ''}
${brandStylePrompt ? `- Brand hlas / štýl: ${brandStylePrompt}` : ''}

PRÍSPEVOK:
- Téma: ${topic || 'Priložená fotka'}
- Platforma: ${platform === 'both' ? 'Facebook aj Instagram' : platform === 'facebook' ? 'Facebook' : 'Instagram'}
${imageData ? '- Priložená fotka: áno – napíš príspevok ktorý presne opíše čo je na fotke a prepáj to s témou' : ''}

Napíš:
1. Hlavný text príspevku v slovenčine (max 150 slóv, pútavý, autentický pre tento typ podniku, s emojis)
2. Relevantné hashtags (5-8) – musia byť späté konkrétne s témou a typom podniku, nie genérické

Dôležité: Použij správny tón pre tento typ podniku. Formát: Len text príspevku s hashtagmi na konci. Žiadne vysvetlenia.Žiadne uvod. Iba text.`

        // Build contents – with image if provided
        const contents = imageData
          ? [{ parts: [{ inlineData: { data: imageData, mimeType: imageMime || 'image/jpeg' } }, { text: textPrompt }] }]
          : textPrompt

        const textResult = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
        })
        caption = textResult.text ?? ''
      }

      // 2. Generate image
      try {
        const baseImagePrompt = buildImagePrompt(projectName, topic, brandPrompt, brandColors, imageStyle, projectType)

        // Build contents: if reference image exists, prepend it as style guide
        const imageContents = referenceImageData
          ? [{
            parts: [
              { inlineData: { data: referenceImageData, mimeType: referenceImageMime } },
              { text: `Použi tento referenčný obrázok ako vizuálny inšpirátor – zachovaj rovnaký štýl, farebnosť, osvetlenie a kompozíciu.\n\n${baseImagePrompt}` },
            ]
          }]
          : baseImagePrompt

        const imageResult = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: imageContents,
          config: {
            responseModalities: ['Image'],
          },
        })

        // Extract image from response parts
        if (imageResult.candidates?.[0]?.content?.parts) {
          for (const part of imageResult.candidates[0].content.parts) {
            if (part.inlineData) {
              const base64 = part.inlineData.data
              const mime = part.inlineData.mimeType || 'image/png'
              if (base64) {
                const buffer = Buffer.from(base64, 'base64')
                const ext = mime.includes('png') ? 'png' : 'jpg'
                const filename = `${user.id}/${projectId || 'general'}/${Date.now()}.${ext}`
                const { data: uploadData } = await supabase.storage
                  .from('post-images')
                  .upload(filename, buffer, { contentType: mime, upsert: true })

                if (uploadData) {
                  const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(filename)
                  imageUrl = urlData.publicUrl
                }
                break
              }
            }
          }
        }
      } catch (imgErr) {
        console.error('Image generation error:', imgErr)
      }
    } catch (err) {
      console.error('Generation error:', err)
      caption = mode === 'image-only' ? '' : generateDemoCaption(projectName, topic, platform)
    }
  }

  // For image-only mode, return without saving to posts
  if (mode === 'image-only') {
    return NextResponse.json({ imageUrl, caption: '' })
  }

  // Save post to DB
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      client_id: user.id,
      project_id: projectId || null,
      caption,
      image_url: imageUrl,
      platform,
      topic,
      status: 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post })
}

function generateDemoCaption(name: string, topic: string, platform: string): string {
  const p = platform === 'instagram' ? 'Instagram' : platform === 'facebook' ? 'Facebook' : 'Facebook & Instagram'
  // Generate a topic-aware demo so it's at least contextually relevant
  return `✨ ${name}

${topic}. Sme tu pre vás až sú prvé výsledky. Zostaňte s nami a neprávde ani jednu novinku!

Sledujte nás na ${p} 🚀

#${name.replace(/\s+/g, '')} #${topic.split(' ').slice(0, 2).join('').replace(/[^a-zA-Z0-9à-ž]/g, '')} #marketing #slovensko #socialmedia`
}

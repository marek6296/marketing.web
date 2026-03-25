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
  const scaleLevel = formData.get('scaleLevel') as string || '2k'

  if (!file) return NextResponse.json({ error: 'Obrázok je povinný' }, { status: 400 })

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

    const scalePrompts: Record<string, string> = {
      '2k': 'Upscale this image to 2K resolution. Enhance details, sharpen edges, reduce noise, and improve overall clarity while preserving the original composition, colors, and content exactly. Do not alter any elements, do not add or remove objects. Simply increase the quality and resolution.',
      '4k': 'Upscale this image to 4K ultra-high resolution. Maximize detail sharpness, eliminate all compression artifacts and noise. Preserve the exact original composition, colors, lighting, and content. Do not alter, add, or remove any elements. Produce the highest possible quality output.',
    }

    const resolutionConfig: Record<string, string> = {
      '2k': '2K',
      '4k': '4K',
    }

    const prompt = scalePrompts[scaleLevel] || scalePrompts['2k']

    const result = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: prompt },
        ],
      }],
      config: {
        responseModalities: ['Image'],
        outputResolution: resolutionConfig[scaleLevel] || '2K',
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    })

    // Extract upscaled image
    if (result.candidates?.[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageBase64 = part.inlineData.data
          const mime = part.inlineData.mimeType || 'image/png'
          if (imageBase64) {
            const buffer = Buffer.from(imageBase64, 'base64')
            const ext = mime.includes('png') ? 'png' : 'jpg'
            const filename = `${user.id}/${projectId || 'upscaled'}/${Date.now()}_upscaled_${scaleLevel}.${ext}`
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

    return NextResponse.json({ error: 'Nepodarilo sa upscalovať obrázok' }, { status: 500 })

  } catch (err) {
    console.error('Upscale error:', err)
    return NextResponse.json({ error: 'Chyba pri upscalovaní obrázku' }, { status: 500 })
  }
}

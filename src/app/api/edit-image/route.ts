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

  const { imageUrl, prompt, projectId } = await req.json()
  if (!imageUrl || !prompt) return NextResponse.json({ error: 'imageUrl and prompt required' }, { status: 400 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return NextResponse.json({ error: 'API kľúč nie je nakonfigurovaný' }, { status: 500 })
  }

  try {
    // Fetch the source image and convert to base64
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) return NextResponse.json({ error: 'Nepodarilo sa načítať obrázok' }, { status: 400 })
    const imgBuf = await imgRes.arrayBuffer()
    const base64 = Buffer.from(imgBuf).toString('base64')
    const mimeType = imgRes.headers.get('content-type') || 'image/jpeg'

    const ai = new GoogleGenAI({ apiKey })

    const editPrompt = `Uprav tento marketingový obrázok podľa nasledujúcej inštrukcie:

${prompt}

Dôležité:
- Zachovaj celkovú kompozíciu a subjekt obrázka
- Aplikuj požadované zmeny čo najpresnejšie
- Výsledok musí byť profesionálna marketingová fotografia
- Štvorec 1:1 formát
- Bez textu, loga ani watermarku`

    const result = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: editPrompt },
          ]
        }
      ],
      config: { responseModalities: ['Image'] },
    })

    if (result.candidates?.[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageBase64 = part.inlineData.data
          const mime = part.inlineData.mimeType || 'image/png'
          if (imageBase64) {
            const buffer = Buffer.from(imageBase64, 'base64')
            const ext = mime.includes('png') ? 'png' : 'jpg'
            const filename = `${user.id}/${projectId || 'edited'}/${Date.now()}_edited.${ext}`
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

    return NextResponse.json({ error: 'Nepodarilo sa upraviť obrázok' }, { status: 500 })
  } catch (err) {
    console.error('Edit image error:', err)
    return NextResponse.json({ error: 'Chyba pri úprave obrázku' }, { status: 500 })
  }
}

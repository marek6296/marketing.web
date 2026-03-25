import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, userText, fieldType } = await req.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Žiadny obrázok' }, { status: 400 })
    }

    // Download image and convert to base64
    const imgRes = await fetch(imageUrl)
    const imgBuf = await imgRes.arrayBuffer()
    const base64 = Buffer.from(imgBuf).toString('base64')
    const mimeType = imgRes.headers.get('content-type') || 'image/jpeg'

    const contextMap: Record<string, string> = {
      brand: 'Analyzuj tento obrázok a vytvor z neho profesionálny brand prompt pre AI generovanie obsahu na sociálne siete. Prompt má zachytiť vizuálny štýl, farby, náladu, tón a charakter značky viditeľný na obrázku.',
      image: 'Analyzuj tento obrázok a vytvor z neho profesionálny prompt pre AI generovanie podobných obrázkov. Prompt má detailne popisovať kompozíciu, osvetlenie, farby, štýl, atmosféru a kľúčové vizuálne prvky.',
      general: 'Analyzuj tento obrázok a vytvor z neho profesionálny AI prompt. Zachyť hlavné vizuálne prvky, štýl, náladu a kompozíciu.',
    }

    const context = contextMap[fieldType || 'image']

    const additionalText = userText?.trim()
      ? `\n\nPoužívateľ ešte pridal tento kontext: "${userText}"`
      : ''

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: `${context}${additionalText}\n\nVráť IBA samotný prompt text v slovenčine, nič iné. Prompt by mal byť 2-5 viet, max 300 slov. Použi konkrétne, deskriptívne výrazy.` },
          ],
        },
      ],
    })

    const text = response?.text?.trim()
    if (!text) {
      return NextResponse.json({ error: 'AI nevygenerovala odpoveď' }, { status: 500 })
    }

    return NextResponse.json({ prompt: text })
  } catch (err) {
    console.error('Image-to-prompt error:', err)
    return NextResponse.json({ error: 'Nepodarilo sa analyzovať obrázok' }, { status: 500 })
  }
}

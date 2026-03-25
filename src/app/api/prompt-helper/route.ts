import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const { userInput, fieldType } = await req.json()

    if (!userInput?.trim()) {
      return NextResponse.json({ error: 'Prázdny vstup' }, { status: 400 })
    }

    const contextMap: Record<string, string> = {
      brand: 'Vytvor profesionálny AI brand prompt pre sociálne siete. Prompt má popisovať štýl komunikácie, tón hlasu, cieľovú skupinu a charakter značky. Bude použitý ako inštrukcia pre AI pri generovaní textov a príspevkov.',
      image: 'Vytvor profesionálny prompt pre AI generovanie obrázkov. Prompt má popisovať vizuálny štýl, kompozíciu, osvetlenie, farby a atmosféru. Bude použitý pri každom generovaní obrázku.',
      general: 'Vytvor profesionálny AI prompt. Preformuluj vstup používateľa na jasnú, štruktúrovanú inštrukciu pre AI.',
    }

    const context = contextMap[fieldType] || contextMap.general

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${context}

Používateľ napísal toto svojimi slovami:
"${userInput}"

Preformuluj to na profesionálny, dobre štruktúrovaný prompt v slovenčine. Nevysvetľuj, nekomentuj — vráť IBA samotný prompt text, nič iné. Prompt by mal byť 2-5 viet, max 300 slov. Použi konkrétne, deskriptívne výrazy.`,
    })

    const text = response?.text?.trim()
    if (!text) {
      return NextResponse.json({ error: 'AI nevygenerovala odpoveď' }, { status: 500 })
    }

    return NextResponse.json({ prompt: text })
  } catch (err) {
    console.error('Prompt helper error:', err)
    return NextResponse.json({ error: 'Nepodarilo sa vygenerovať prompt' }, { status: 500 })
  }
}

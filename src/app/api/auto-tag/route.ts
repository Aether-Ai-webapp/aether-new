import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// POST /api/auto-tag - AI-powered auto-tagging using Gemini 2.0 Flash
export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ tags: [] }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ tags: [] })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `Analyze this user's thought. Return a JSON object with ONE field: 'tags'. 'tags' must be an array of 1-2 relevant, lowercase tags (e.g., ['work', 'idea', 'personal', 'study', 'link']). Return ONLY the raw JSON, no markdown formatting, no extra text.

User's thought:
${content.slice(0, 1000)}`

    // Race the Gemini call with a 10s timeout to prevent server hangs
    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 100 },
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
    ])

    if (!result) {
      return NextResponse.json({ tags: [] })
    }

    const text = (result as Awaited<ReturnType<typeof model.generateContent>>).response.text().trim()

    // Strip markdown code fences if present
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    // Parse the JSON response
    let parsed: { tags: string[] }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        return NextResponse.json({ tags: [] })
      }
    }

    const tags = Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((t: unknown) => typeof t === 'string')
          .map((t: string) => t.toLowerCase().trim())
          .filter(Boolean)
          .slice(0, 2)
      : []

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Auto-tag error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ tags: [] })
  }
}

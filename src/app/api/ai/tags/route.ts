import { NextRequest, NextResponse } from 'next/server'
import { generateTags } from '@/lib/gemini'

// POST /api/ai/tags - Auto-generate tags for content
export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ tags: [] }, { status: 400 })
    }

    const tags = await generateTags(content)
    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Tag generation error:', error)
    return NextResponse.json({ tags: [] })
  }
}

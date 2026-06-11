import { NextRequest, NextResponse } from 'next/server'
import { generateSummary } from '@/lib/gemini'

// POST /api/ai/summary - Auto-generate summary for content
export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ summary: '' }, { status: 400 })
    }

    const summary = await generateSummary(content)
    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Summary generation error:', error)
    return NextResponse.json({ summary: '' })
  }
}

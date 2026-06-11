import { NextRequest, NextResponse } from 'next/server'

// POST /api/memories/fetch-title - Fetch the title of a URL
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url } = body

    if (!url?.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const response = await fetch(url.trim(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; AetherBot/1.0; +https://aether.app)',
      },
      signal: AbortSignal.timeout(5000),
    })

    const html = await response.text()
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch?.[1]?.trim() || null

    return NextResponse.json({ title })
  } catch {
    return NextResponse.json({ title: null })
  }
}

import { NextRequest, NextResponse } from 'next/server'

// POST /api/ai/read-link - Read and extract content from a URL
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url?.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let title = ''
    let content = ''
    let description = ''

    // ── Attempt 1: z-ai-web-dev-sdk web reader ────────────────────────
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const result = await zai.webReader.read(url)

      if (result) {
        title = result.title || ''
        content = (result.html || result.text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000)
        description = result.text?.slice(0, 300) || ''
      }
    } catch (sdkError) {
      console.warn('z-ai web reader failed:', sdkError instanceof Error ? sdkError.message : 'Unknown')
    }

    // ── Attempt 2: Simple fetch + extract title if SDK failed ──────────
    if (!title && !content) {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AetherBot/1.0)' },
          signal: AbortSignal.timeout(10000),
        })

        if (response.ok) {
          const html = await response.text()

          // Extract title
          const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
          title = titleMatch ? titleMatch[1].trim() : ''

          // Extract meta description
          const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i)
          description = descMatch ? descMatch[1].trim() : ''

          // Strip HTML tags for content
          content = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 3000)
        }
      } catch (fetchError) {
        console.warn('URL fetch failed:', fetchError instanceof Error ? fetchError.message : 'Unknown')
      }
    }

    // If we still got nothing, return the URL itself as a fallback
    if (!title && !content) {
      return NextResponse.json({
        title: new URL(url).hostname,
        content: url,
        description: 'Could not read content from this URL.',
      })
    }

    return NextResponse.json({ title, content, description })
  } catch (error) {
    console.error('Read link error:', error)
    return NextResponse.json({ error: 'Failed to read link' }, { status: 500 })
  }
}

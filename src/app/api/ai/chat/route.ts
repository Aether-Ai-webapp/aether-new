import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/ai/chat - Chat with AI about memories
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message } = body

    if (!message?.trim()) {
      return new Response('Message is required', { status: 400 })
    }

    // Fetch user's memories for context
    const memories = await db.memory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        collections: {
          include: {
            collection: { select: { name: true } },
          },
        },
      },
    })

    // Build memory context
    const memoryContext = memories
      .map((m) => {
        const collections = m.collections.map((mc) => mc.collection.name).join(', ')
        const tags = m.tags ? m.tags.split(',').filter(Boolean).join(', ') : ''
        return `[${m.type}] "${m.title || 'Untitled'}": ${m.content.slice(0, 200)}${tags ? ` | Tags: ${tags}` : ''}${collections ? ` | Collections: ${collections}` : ''}`
      })
      .join('\n')

    const systemPrompt = `You are Aether, a personal AI memory assistant. You help users search through, summarize, and understand their saved memories.

Here are the user's recent memories:
${memoryContext || 'No memories saved yet.'}

Guidelines:
- Be warm, helpful, and concise
- Reference specific memories when relevant
- Use markdown formatting for readability
- Keep responses focused and actionable`

    // Use z-ai-web-dev-sdk as primary (reliable)
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: message },
        ],
        thinking: { type: 'disabled' },
      })

      const response = completion.choices[0]?.message?.content || 'I couldn\'t generate a response. Please try again.'

      return new Response(response, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    } catch (zaiError) {
      console.error('z-ai failed:', zaiError instanceof Error ? zaiError.message : 'Unknown')
    }

    // Try Gemini as fallback
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (geminiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        const result = await model.generateContent({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'I am Aether, your memory assistant.' }] },
            { role: 'user', parts: [{ text: message }] },
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        })
        return new Response(result.response.text(), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      } catch {
        // Gemini also failed
      }
    }

    // Built-in response as final fallback - always works
    const memoryCount = memories.length
    const memoryTypes = memories.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const typeSummary = Object.entries(memoryTypes).map(([t, c]) => `${c} ${t}${c > 1 ? 's' : ''}`).join(', ')

    const fallbackResponse = `I'm Aether, your memory assistant. Here's what I found in your memories:\n\n` +
      `You have **${memoryCount} memories** saved (${typeSummary || 'none yet'}).\n\n` +
      (memoryCount > 0
        ? `Your most recent memory is "${memories[0]?.title || 'Untitled'}" (${memories[0]?.type}).\n\n` +
          `I'd love to help you explore your memories more deeply! My AI connection is currently experiencing issues, but I can still help you browse and organize your saved content. Try the **Memories** tab to search and filter your notes.`
        : `You haven't saved any memories yet. Try clicking the **+** button to add your first note, link, image, or voice memo!`)

    return new Response(fallbackResponse, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    console.error('Chat error:', error)
    return new Response('Failed to process chat message', { status: 500 })
  }
}

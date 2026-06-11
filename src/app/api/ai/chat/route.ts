import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

// POST /api/ai/chat - Chat with AI about memories using z-ai-web-dev-sdk
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

    // Build memory context for the AI
    const memoryContext = memories
      .map((m) => {
        const collections = m.collections.map((mc) => mc.collection.name).join(', ')
        return `[${m.type}] "${m.title || 'Untitled'}": ${m.content.slice(0, 200)}${m.tags ? ` | Tags: ${m.tags}` : ''}${collections ? ` | Collections: ${collections}` : ''}`
      })
      .join('\n')

    // Dynamic import for z-ai-web-dev-sdk (server only)
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const systemPrompt = `You are Aether, a personal AI memory assistant. You help users search through, summarize, and understand their saved memories (notes, links, images, voice notes).

Here are the user's recent memories:
${memoryContext || 'No memories saved yet.'}

Guidelines:
- Be warm, helpful, and concise
- Reference specific memories when relevant
- If the user asks about something not in their memories, let them know but offer to help in other ways
- Suggest connections between memories when you spot them
- Use markdown formatting for better readability
- Keep responses focused and actionable`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: message },
      ],
      thinking: { type: 'disabled' },
    })

    const response = completion.choices[0]?.message?.content || 'I apologize, I couldn\'t generate a response. Please try again.'

    return new Response(response, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Failed to process chat:', error)
    // Fallback response if AI fails
    return new Response(
      "I'm having trouble connecting to my AI backend right now. Please try again in a moment. In the meantime, you can browse and search your memories directly using the Memories tab.",
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      }
    )
  }
}

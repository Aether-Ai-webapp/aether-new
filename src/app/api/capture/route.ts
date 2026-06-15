import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

// ═══════════════════════════════════════════════════════════════════════
// ─── SUPABASE AVAILABILITY CHECK ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && url !== 'your_supabase_url_here' && key !== 'your_supabase_anon_key_here')
}

// ═══════════════════════════════════════════════════════════════════════
// ─── SUPABASE SERVER CLIENT (cookie-aware for Route Handlers) ────────
// ═══════════════════════════════════════════════════════════════════════

async function getSupabaseRouteClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const cookieStore = await cookies()

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  })

  return supabase
}

// ═══════════════════════════════════════════════════════════════════════
// ─── KEYWORD-BASED AUTO-TAGGING (free, instant, always runs) ─────────
// ═══════════════════════════════════════════════════════════════════════

function autoGenerateTags(content: string, title: string): string[] {
  const text = `${title} ${content}`.toLowerCase()
  const tagMap: Record<string, string[]> = {
    work: ['meeting', 'project', 'deadline', 'client', 'office', 'team', 'q1', 'q2', 'q3', 'q4', 'quarterly', 'strategy', 'standup', 'sprint', 'agile'],
    personal: ['routine', 'morning', 'exercise', 'meditation', 'journal', 'habit', 'family', 'gratitude', 'wellness'],
    travel: ['trip', 'itinerary', 'flight', 'hotel', 'visit', 'tokyo', 'paris', 'destination', 'vacation', 'passport'],
    learning: ['learn', 'study', 'course', 'tutorial', 'book', 'read', 'article', 'university', 'lecture', 'research'],
    code: ['code', 'programming', 'react', 'javascript', 'typescript', 'api', 'bug', 'feature', 'css', 'html', 'framework', 'debug', 'deploy', 'git', 'docker', 'kubernetes'],
    design: ['design', 'ui', 'ux', 'layout', 'color', 'font', 'figma', 'wireframe', 'gradient', 'typography', 'prototype'],
    ai: ['ai', 'machine learning', 'neural', 'model', 'gpt', 'gemini', 'llm', 'chatbot', 'prompt', 'embedding', 'transformer'],
    recipe: ['recipe', 'cook', 'bake', 'ingredient', 'food', 'meal', 'breakfast', 'dinner', 'lunch'],
    finance: ['budget', 'invest', 'stock', 'savings', 'expense', 'income', 'tax', 'mortgage', 'crypto'],
    health: ['doctor', 'symptom', 'medication', 'workout', 'diet', 'sleep', 'mental health', 'therapy'],
    idea: ['idea', 'concept', 'brainstorm', 'innovative', 'startup', 'prototype', 'vision'],
    task: ['todo', 'remind', 'need to', 'must', 'buy', 'deadline', 'urgent'],
  }

  const tags: string[] = []
  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some(kw => text.includes(kw))) {
      tags.push(tag)
    }
  }
  return tags.slice(0, 5)
}

// ═══════════════════════════════════════════════════════════════════════
// ─── AUDIO TRANSCRIPTION (z-ai-web-dev-sdk ASR or Groq Whisper) ──────
// ═══════════════════════════════════════════════════════════════════════

async function transcribeAudio(audioFile: File): Promise<string> {
  // Try z-ai-web-dev-sdk first (always available in this environment)
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const sdk = await ZAI.create()
    const arrayBuffer = await audioFile.arrayBuffer()
    const base64Audio = Buffer.from(arrayBuffer).toString('base64')
    const result = await sdk.audio.asr.create({
      file_base64: base64Audio,
    })
    if (result && typeof result === 'object' && 'text' in result) {
      const text = (result as { text: string }).text
      if (text?.trim()) return text
    }
    if (typeof result === 'string' && result.trim()) return result
  } catch (err) {
    console.warn('z-ai-web-dev-sdk ASR failed:', err instanceof Error ? err.message : 'Unknown')
  }

  // Try Groq Whisper as fallback
  const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY
  if (groqKey && groqKey !== 'placeholder_groq_key') {
    try {
      const formData = new FormData()
      formData.append('file', audioFile)
      formData.append('model', 'whisper-large-v3-turbo')
      formData.append('response_format', 'json')

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.text?.trim()) return data.text
      }
    } catch (err) {
      console.warn('Groq Whisper failed:', err instanceof Error ? err.message : 'Unknown')
    }
  }

  return ''
}

// ═══════════════════════════════════════════════════════════════════════
// ─── IMAGE UPLOAD TO SUPABASE STORAGE (when configured) ──────────────
// ═══════════════════════════════════════════════════════════════════════

async function uploadImageToStorage(
  imageFile: File,
  userId: string,
  supabase: Awaited<ReturnType<typeof getSupabaseRouteClient>>
): Promise<string | null> {
  try {
    const ext = imageFile.name.split('.').pop() || 'png'
    const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('memories')
      .upload(filename, buffer, {
        contentType: imageFile.type || 'image/png',
        upsert: false,
      })

    if (uploadError) {
      console.warn('Supabase Storage upload failed:', uploadError.message)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('memories')
      .getPublicUrl(filename)

    return urlData?.publicUrl || null
  } catch (err) {
    console.warn('Image upload error:', err instanceof Error ? err.message : 'Unknown')
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ─── GEMINI COGNITIVE SYNTHESIS (optional, when key is set) ──────────
// ═══════════════════════════════════════════════════════════════════════

interface GeminiSynthesis {
  suggested_title: string
  summary: string
  deep_insight: string
  tags: string[]
}

async function synthesizeWithGemini(rawContent: string): Promise<GeminiSynthesis | null> {
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!geminiKey) return null

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(geminiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const systemPrompt = `You are the sovereign intelligence core of Aether. Analyze this data input. Synthesize an exquisite, natural, human-like 2-sentence summary, a clean suggested title, a deep professional insight, and an array of 3 specific tags. Do not return markdown headers or labels. Return strictly a single, valid JSON object formatted exactly like this:
{
  "suggested_title": "The optimized title string.",
  "summary": "The 2-sentence summary string.",
  "deep_insight": "The deep professional analysis string.",
  "tags": ["keyword1", "keyword2", "keyword3"]
}`

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I will return strictly a JSON object with suggested_title, summary, deep_insight, and tags fields.' }] },
        { role: 'user', parts: [{ text: rawContent.slice(0, 4000) }] },
      ],
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
    })

    const responseText = result.response.text()

    // Extract JSON from the response (handle potential markdown wrapping)
    let jsonStr = responseText.trim()
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    const parsed = JSON.parse(jsonStr)

    if (
      typeof parsed.suggested_title === 'string' &&
      typeof parsed.summary === 'string' &&
      typeof parsed.deep_insight === 'string' &&
      Array.isArray(parsed.tags)
    ) {
      return {
        suggested_title: parsed.suggested_title,
        summary: parsed.summary,
        deep_insight: parsed.deep_insight,
        tags: parsed.tags.filter((t: unknown) => typeof t === 'string').slice(0, 5),
      }
    }

    return null
  } catch (err) {
    console.warn('Gemini synthesis failed:', err instanceof Error ? err.message : 'Unknown')
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ─── COLLECTION TAG MATCHING (Supabase only) ─────────────────────────
// ═══════════════════════════════════════════════════════════════════════

async function matchOrCreateCollections(
  supabase: Awaited<ReturnType<typeof getSupabaseRouteClient>>,
  userId: string,
  memoryId: string,
  tags: string[]
): Promise<void> {
  if (tags.length === 0) return

  try {
    const { data: existingCollections } = await supabase
      .from('collections')
      .select('id, name')
      .eq('user_id', userId)

    if (existingCollections && existingCollections.length > 0) {
      for (const tag of tags) {
        const tagLower = tag.toLowerCase()
        const matched = existingCollections.find((c: { id: string; name: string }) =>
          c.name.toLowerCase().includes(tagLower) || tagLower.includes(c.name.toLowerCase())
        )

        if (matched) {
          await supabase
            .from('memory_collections')
            .insert({
              memory_id: memoryId,
              collection_id: matched.id,
            })
          break
        }
      }
    }
  } catch (err) {
    console.warn('Collection matching failed:', err instanceof Error ? err.message : 'Unknown')
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ─── 10-NOTE AUTO-SWEEP RULE (Supabase only) ─────────────────────────
// ═══════════════════════════════════════════════════════════════════════

async function autoSweepCollections(
  supabase: Awaited<ReturnType<typeof getSupabaseRouteClient>>,
  userId: string
): Promise<void> {
  try {
    const { data: uncollectedMemories } = await supabase
      .from('memories')
      .select('id, tags, type')
      .eq('user_id', userId)

    if (!uncollectedMemories || uncollectedMemories.length < 10) return

    const tagGroups: Record<string, string[]> = {}
    for (const mem of uncollectedMemories) {
      if (!mem.tags) continue
      const memTags = (mem.tags as string).split(',').filter(Boolean)
      for (const tag of memTags) {
        if (!tagGroups[tag]) tagGroups[tag] = []
        tagGroups[tag].push(mem.id as string)
      }
    }

    for (const [tag, memoryIds] of Object.entries(tagGroups)) {
      if (memoryIds.length >= 10) {
        const { data: existingCol } = await supabase
          .from('collections')
          .select('id')
          .eq('user_id', userId)
          .ilike('name', `%${tag}%`)
          .limit(1)

        if (existingCol && existingCol.length > 0) continue

        const displayName = tag.charAt(0).toUpperCase() + tag.slice(1)
        const { data: newCol } = await supabase
          .from('collections')
          .insert({
            user_id: userId,
            name: displayName,
            color: '#6D597A',
            icon: '📁',
          })
          .select('id')
          .single()

        if (newCol) {
          const junctionRows = memoryIds.slice(0, 50).map(mid => ({
            memory_id: mid,
            collection_id: (newCol as { id: string }).id,
          }))

          await supabase
            .from('memory_collections')
            .insert(junctionRows)
        }
      }
    }
  } catch (err) {
    console.warn('Auto-sweep failed:', err instanceof Error ? err.message : 'Unknown')
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ─── SAVE TO PRISMA (Local Fallback — always works) ─────────────────
// ═══════════════════════════════════════════════════════════════════════

async function saveToPrisma(data: {
  type: string
  title: string
  content: string
  summary: string | null
  deepInsight: string | null
  tags: string[]
  sourceUrl: string | null
  imageUrl: string | null
}) {
  const memory = await db.memory.create({
    data: {
      type: data.type || 'text',
      title: data.title || '',
      content: data.content || '',
      summary: data.summary,
      deepInsight: data.deepInsight,
      tags: data.tags.join(','),
      sourceUrl: data.sourceUrl,
      imageUrl: data.imageUrl,
    },
    include: {
      collections: {
        include: {
          collection: {
            select: { id: true, name: true, color: true, icon: true },
          },
        },
      },
    },
  })

  return {
    id: memory.id,
    type: memory.type,
    title: memory.title,
    content: memory.content,
    summary: memory.summary,
    deepInsight: memory.deepInsight || null,
    tags: memory.tags ? memory.tags.split(',').filter(Boolean) : [],
    sourceUrl: memory.sourceUrl,
    fileUrl: memory.fileUrl || null,
    imagePreview: memory.imagePreview || null,
    imageUrl: memory.imageUrl || null,
    recap: memory.recap || null,
    isFavorite: memory.isFavorite,
    createdAt: memory.createdAt.toISOString(),
    updatedAt: memory.updatedAt.toISOString(),
    collections: memory.collections.map(mc => ({
      id: mc.collection.id,
      name: mc.collection.name,
      color: mc.collection.color,
      icon: mc.collection.icon,
    })),
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ─── MAIN POST HANDLER ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    // ── STEP 1: Parse FormData ──────────────────────────────────────
    const formData = await req.formData()
    const text = (formData.get('text') as string) || ''
    const url = (formData.get('url') as string) || ''
    const imageFile = formData.get('image') as File | null
    const audioFile = formData.get('audio') as File | null

    // Validate: at least one content source
    const hasText = text.trim().length > 0
    const hasUrl = url.trim().length > 0
    const hasImage = imageFile && imageFile.size > 0
    const hasAudio = audioFile && audioFile.size > 0

    if (!hasText && !hasUrl && !hasImage && !hasAudio) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    }

    // ── STEP 2: Process Audio → Transcript ──────────────────────────
    let audioTranscript = ''
    let memoryType: string = 'text'

    if (hasAudio) {
      memoryType = 'voice'
      audioTranscript = await transcribeAudio(audioFile)
    }

    // ── STEP 3: Process Image → Upload to Storage (if Supabase available) ──
    let imageUrl: string | null = null

    if (hasImage) {
      memoryType = 'image'
      // Image upload will be attempted inside the Supabase block below
    }

    // ── STEP 4: Assemble Raw Content ────────────────────────────────
    let rawContent = ''
    if (hasText) rawContent += text.trim()
    if (hasUrl) rawContent += (rawContent ? '\n\n' : '') + `URL: ${url.trim()}`
    if (audioTranscript) rawContent += (rawContent ? '\n\n' : '') + `Voice Transcript:\n${audioTranscript}`
    if (hasImage && !rawContent) rawContent = 'Image capture'
    if (!rawContent) rawContent = 'Captured content'

    if (hasUrl) memoryType = 'link'
    if (hasAudio && hasImage) memoryType = 'voice'
    if (!hasAudio && !hasImage && !hasUrl) memoryType = 'text'

    // ── STEP 5: AI Cognitive Synthesis (Gemini Flash, optional) ─────
    let aiTitle = hasText ? text.slice(0, 80) : hasUrl ? 'Saved Link' : hasAudio ? 'Voice Note' : 'Image Capture'
    let aiSummary: string | null = null
    let aiDeepInsight: string | null = null
    let aiTags = autoGenerateTags(rawContent, aiTitle)

    if (rawContent.trim() && rawContent.trim() !== 'Image capture' && rawContent.trim() !== 'Captured content') {
      const synthesis = await synthesizeWithGemini(rawContent)
      if (synthesis) {
        aiTitle = synthesis.suggested_title || aiTitle
        aiSummary = synthesis.summary
        aiDeepInsight = synthesis.deep_insight
        if (synthesis.tags.length > 0) {
          aiTags = synthesis.tags
        }
      }
    }

    // ── STEP 6: Try Supabase first (cookie-aware route handler client) ──
    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabaseRouteClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (!authError && user) {
          // Authenticated Supabase path
          // Upload image if present
          if (hasImage) {
            imageUrl = await uploadImageToStorage(imageFile, user.id, supabase)
          }

          const { data: memoryRow, error: insertError } = await supabase
            .from('memories')
            .insert({
              user_id: user.id,
              type: memoryType,
              title: aiTitle,
              content: rawContent,
              summary: aiSummary,
              deep_insight: aiDeepInsight,
              tags: aiTags.join(','),
              source_url: hasUrl ? url.trim() : null,
              image_url: imageUrl,
              is_favorite: false,
            })
            .select('*, memory_collections(collection_id, collections(id, name, color, icon))')
            .single()

          if (!insertError && memoryRow) {
            // Collection Tag Matching
            await matchOrCreateCollections(supabase, user.id, (memoryRow as { id: string }).id, aiTags)

            // 10-Note Auto-Sweep (non-blocking)
            autoSweepCollections(supabase, user.id).catch(() => {})

            // Return memory object in the format the frontend expects
            const row = memoryRow as Record<string, unknown>
            const memoryCollections = (row.memory_collections as Array<{ collection_id: string; collections: { id: string; name: string; color: string; icon: string } }>) || []

            const memory = {
              id: row.id as string,
              type: (row.type as string) || 'text',
              title: (row.title as string) || '',
              content: (row.content as string) || '',
              summary: (row.summary as string) || null,
              deepInsight: (row.deep_insight as string) || null,
              tags: row.tags ? (row.tags as string).split(',').filter(Boolean) : [],
              sourceUrl: (row.source_url as string) || null,
              fileUrl: (row.file_url as string) || null,
              imagePreview: (row.image_preview as string) || null,
              imageUrl: (row.image_url as string) || null,
              recap: (row.recap as string) || null,
              isFavorite: (row.is_favorite as boolean) || false,
              createdAt: (row.created_at as string) || new Date().toISOString(),
              updatedAt: (row.updated_at as string) || new Date().toISOString(),
              collections: memoryCollections.map(mc => ({
                id: mc.collections.id,
                name: mc.collections.name,
                color: mc.collections.color,
                icon: mc.collections.icon,
              })),
            }

            return NextResponse.json({ success: true, memory })
          }

          // If Supabase insert failed, fall through to Prisma
          console.warn('Supabase insert failed, falling back to Prisma:', insertError?.message)
        }
      } catch (err) {
        // Supabase not working, fall through to Prisma
        console.warn('Supabase capture failed, falling back to Prisma:', err instanceof Error ? err.message : 'Unknown')
      }
    }

    // ── STEP 7: Prisma Fallback (always works) ─────────────────────
    const memory = await saveToPrisma({
      type: memoryType,
      title: aiTitle,
      content: rawContent,
      summary: aiSummary,
      deepInsight: aiDeepInsight,
      tags: aiTags,
      sourceUrl: hasUrl ? url.trim() : null,
      imageUrl: imageUrl,
    })

    return NextResponse.json({ success: true, memory })
  } catch (error) {
    console.error('Capture route error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

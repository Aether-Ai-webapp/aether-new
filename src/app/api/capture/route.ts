import { NextRequest, NextResponse } from 'next/server'

// ═══════════════════════════════════════════════════════════════════════
// ─── SUPABASE SERVER CLIENT ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

async function getSupabaseServer() {
  const { createClient } = await import('@/lib/supabase/server')
  return createClient()
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
// ─── AUDIO TRANSCRIPTION (Groq Whisper or z-ai-web-dev-sdk) ──────────
// ═══════════════════════════════════════════════════════════════════════

async function transcribeAudio(audioFile: File): Promise<string> {
  // Try z-ai-web-dev-sdk first (always available)
  try {
    const { createTranscription } = await import('@/lib/aether-asr')
    const transcript = await createTranscription(audioFile)
    if (transcript?.trim()) return transcript
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
// ─── IMAGE UPLOAD TO SUPABASE STORAGE ────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

async function uploadImageToStorage(imageFile: File, userId: string): Promise<string | null> {
  try {
    const supabase = await getSupabaseServer()

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
// ─── GEMINI COGNITIVE SYNTHESIS ──────────────────────────────────────
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
// ─── COLLECTION TAG MATCHING ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

async function matchOrCreateCollections(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  userId: string,
  memoryId: string,
  tags: string[]
): Promise<void> {
  if (tags.length === 0) return

  try {
    // Fetch existing collections for this user
    const { data: existingCollections } = await supabase
      .from('collections')
      .select('id, name')
      .eq('user_id', userId)

    if (existingCollections && existingCollections.length > 0) {
      // Try to match tags to existing collection names
      for (const tag of tags) {
        const tagLower = tag.toLowerCase()
        const matched = existingCollections.find((c: { id: string; name: string }) =>
          c.name.toLowerCase().includes(tagLower) || tagLower.includes(c.name.toLowerCase())
        )

        if (matched) {
          // Link memory to this collection
          await supabase
            .from('memory_collections')
            .insert({
              memory_id: memoryId,
              collection_id: matched.id,
            })
          break // Only match to one collection per capture
        }
      }
    }
  } catch (err) {
    console.warn('Collection matching failed:', err instanceof Error ? err.message : 'Unknown')
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ─── 10-NOTE AUTO-SWEEP RULE ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

async function autoSweepCollections(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  userId: string
): Promise<void> {
  try {
    // Find memories without any collection that share matching tags
    const { data: uncollectedMemories } = await supabase
      .from('memories')
      .select('id, tags, type')
      .eq('user_id', userId)

    if (!uncollectedMemories || uncollectedMemories.length < 10) return

    // Group uncollected memories by tag
    const tagGroups: Record<string, string[]> = {}
    for (const mem of uncollectedMemories) {
      if (!mem.tags) continue
      const memTags = (mem.tags as string).split(',').filter(Boolean)
      for (const tag of memTags) {
        if (!tagGroups[tag]) tagGroups[tag] = []
        tagGroups[tag].push(mem.id as string)
      }
    }

    // Check for any tag group with 10+ memories
    for (const [tag, memoryIds] of Object.entries(tagGroups)) {
      if (memoryIds.length >= 10) {
        // Check if a collection for this tag already exists
        const { data: existingCol } = await supabase
          .from('collections')
          .select('id')
          .eq('user_id', userId)
          .ilike('name', `%${tag}%`)
          .limit(1)

        if (existingCol && existingCol.length > 0) continue

        // Create a new collection
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
          // Batch link memories to this new collection
          const junctionRows = memoryIds.slice(0, 50).map(mid => ({
            memory_id: mid,
            collection_id: (newCol as { id: string }).id,
          }))

          await supabase
            .from('memory_collections')
            .insert(junctionRows)

          console.log(`Auto-created collection "${displayName}" with ${memoryIds.length} memories`)
        }
      }
    }
  } catch (err) {
    console.warn('Auto-sweep failed:', err instanceof Error ? err.message : 'Unknown')
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ─── MAIN POST HANDLER ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    // ── STEP 1: Authenticate ────────────────────────────────────────
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // ── STEP 2: Parse FormData ──────────────────────────────────────
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

    // ── STEP 3: Process Audio → Transcript ──────────────────────────
    let audioTranscript = ''
    let memoryType: string = 'text'

    if (hasAudio) {
      memoryType = 'voice'
      audioTranscript = await transcribeAudio(audioFile)
    }

    // ── STEP 4: Process Image → Upload to Storage ───────────────────
    let imageUrl: string | null = null
    let imageDescription = ''

    if (hasImage) {
      memoryType = 'image'
      imageUrl = await uploadImageToStorage(imageFile, user.id)
    }

    // ── STEP 5: Assemble Raw Content ────────────────────────────────
    let rawContent = ''
    if (hasText) rawContent += text.trim()
    if (hasUrl) rawContent += (rawContent ? '\n\n' : '') + `URL: ${url.trim()}`
    if (audioTranscript) rawContent += (rawContent ? '\n\n' : '') + `Voice Transcript:\n${audioTranscript}`
    if (imageDescription) rawContent += (rawContent ? '\n\n' : '') + `Image: ${imageDescription}`
    if (imageUrl && !rawContent) rawContent = 'Captured image'

    if (hasUrl) memoryType = 'link'
    if (hasAudio && hasImage) memoryType = 'voice' // Voice takes priority
    if (!hasAudio && !hasImage && !hasUrl) memoryType = 'text'

    // ── STEP 6: AI Cognitive Synthesis (Gemini Flash) ───────────────
    let aiTitle = hasText ? text.slice(0, 80) : hasUrl ? 'Saved Link' : hasAudio ? 'Voice Note' : 'Image Capture'
    let aiSummary: string | null = null
    let aiDeepInsight: string | null = null
    let aiTags = autoGenerateTags(rawContent, aiTitle)

    if (rawContent.trim()) {
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

    // ── STEP 7: Insert into Supabase ────────────────────────────────
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

    if (insertError) {
      console.error('Supabase insert error:', insertError.message)
      return NextResponse.json({ error: 'Failed to save memory' }, { status: 500 })
    }

    // ── STEP 8: Collection Tag Matching ─────────────────────────────
    await matchOrCreateCollections(supabase, user.id, (memoryRow as { id: string }).id, aiTags)

    // ── STEP 9: 10-Note Auto-Sweep ──────────────────────────────────
    // Run asynchronously — don't block the response
    autoSweepCollections(supabase, user.id).catch(() => {
      // Silent fail — non-blocking
    })

    // ── STEP 10: Return Memory Object ───────────────────────────────
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
  } catch (error) {
    console.error('Capture route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

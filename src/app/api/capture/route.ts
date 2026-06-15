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
    recipe: ['recipe', 'cook', 'bake', 'ingredient', 'food', 'meal', 'breakfast', 'dinner', 'groceries', 'lunch'],
    idea: ['idea', 'concept', 'brainstorm', 'innovative', 'startup', 'prototype', 'vision', 'hypothesis'],
    finance: ['budget', 'expense', 'invest', 'savings', 'money', 'cost', 'salary', 'revenue', 'profit'],
    link: ['http', 'https', 'www', '.com', '.io', '.org', '.dev', '.app'],
    task: ['todo', 'remind', 'need to', 'must', 'buy', 'deadline', 'urgent', 'action item'],
    health: ['health', 'doctor', 'exercise', 'workout', 'gym', 'diet', 'sleep', 'mental', 'therapy'],
    music: ['music', 'song', 'album', 'playlist', 'spotify', 'concert', 'band', 'genre'],
    car: ['car', 'engine', 'vehicle', 'corvette', 'mustang', 'specs', 'horsepower', 'racing'],
  }

  const tags: string[] = []
  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some((kw) => text.includes(kw))) {
      tags.push(tag)
    }
  }
  return tags.slice(0, 5)
}

// ═══════════════════════════════════════════════════════════════════════
// ─── AUDIO TRANSCRIPTION — z-ai-web-dev-sdk ASR → Groq Whisper ──────
// ═══════════════════════════════════════════════════════════════════════
async function transcribeAudio(audioFile: File): Promise<string> {
  // TIER 1: z-ai-web-dev-sdk ASR (always available, no API key needed)
  try {
    const { createTranscription } = await import('@/lib/aether-asr')
    const transcript = await createTranscription(audioFile)
    if (transcript?.trim()) {
      console.log('[capture] Audio transcription: z-ai-web-dev-sdk ASR (Tier 1) succeeded')
      return transcript.trim()
    }
  } catch (err) {
    console.error('[capture] z-ai ASR failed:', err instanceof Error ? err.message : 'Unknown')
  }

  // TIER 2: Groq Whisper via REST API
  try {
    const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY
    if (!groqKey || groqKey === 'placeholder_groq_key') return ''

    const arrayBuffer = await audioFile.arrayBuffer()
    const blob = new Blob([arrayBuffer], { type: audioFile.type || 'audio/webm' })
    const formData = new FormData()
    formData.append('file', blob, audioFile.name || 'recording.webm')
    formData.append('model', 'whisper-large-v3-turbo')
    formData.append('response_format', 'json')

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body: formData,
    })

    if (response.ok) {
      const data = await response.json()
      if (data.text?.trim()) {
        console.log('[capture] Audio transcription: Groq Whisper (Tier 2) succeeded')
        return data.text.trim()
      }
    }
  } catch (err) {
    console.error('[capture] Groq Whisper fallback failed:', err instanceof Error ? err.message : 'Unknown')
  }

  return ''
}

// ═══════════════════════════════════════════════════════════════════════
// ─── IMAGE UPLOAD TO SUPABASE STORAGE ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
async function uploadImageToStorage(imageFile: File, userId: string): Promise<string | null> {
  try {
    const supabase = await getSupabaseServer()
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const ext = imageFile.name.split('.').pop() || 'png'
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).slice(2, 8)
    const filePath = `${userId}/${timestamp}-${randomSuffix}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('memories')
      .upload(filePath, buffer, {
        contentType: imageFile.type || 'image/png',
        upsert: false,
      })

    if (uploadError) {
      console.error('[capture] Storage upload failed:', uploadError.message)
      return null
    }

    const { data: urlData } = supabase.storage.from('memories').getPublicUrl(filePath)
    return urlData?.publicUrl || null
  } catch (err) {
    console.error('[capture] Image upload failed:', err instanceof Error ? err.message : 'Unknown')
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ─── COGNITIVE SYNTHESIS ENGINE — 3-TIER AI PIPELINE ─────────────────
// Tier 1: z-ai-web-dev-sdk (always available, no API key needed)
// Tier 2: Gemini 1.5 Flash (if API key configured)
// Tier 3: Keyword-based fallback (always available)
// ═══════════════════════════════════════════════════════════════════════
interface CognitiveResult {
  summary: string
  deepInsight: string
  tags: string[]
}

const COGNITIVE_SYSTEM_PROMPT = `You are Aether — an elite, high-fidelity cognitive organizer and second-brain intelligence engine. Your purpose is to transform raw human thought into crystallized insight with the depth and precision of a world-class analytical thinker.

You receive raw sensory input — text fragments, voice transcripts, image descriptions, or web links. You must produce a strictly formatted JSON response with exactly three fields:

1. "summary": A pristine, completely natural 2-sentence synthesis of the core thought. Write as if you are a brilliant editor distilling an essay into its essential truth. No robotic phrasing, no filler, no labels like "Summary:" or "This content is about". Just pure, human-readable insight that captures the essence in exactly two sentences.

2. "deep_insight": A deeply analytical, professionally insightful cognitive expansion of this thought. Write 3-4 sentences that reveal hidden connections, implications, or patterns the thinker may not have consciously noticed. Adopt the voice of a wise mentor who sees what lies beneath the surface. Be specific and intellectually rigorous — no platitudes or generic observations. Draw from philosophy, science, business strategy, psychology, or any relevant domain to provide genuine cognitive value.

3. "tags": An array of exactly 3 concise, lowercase keyword strings that conceptually represent the memory's domain. Choose tags that would help cluster this thought with similar ones in a knowledge graph (e.g., ["design", "psychology", "creativity"]). Be specific — prefer "behavioral-economics" over "economics", "distributed-systems" over "code".

Return ONLY the raw JSON object. No markdown formatting, no code blocks, no explanation, no extra text before or after the JSON.`

async function generateCognitiveSynthesis(rawText: string): Promise<CognitiveResult> {
  const empty: CognitiveResult = { summary: '', deepInsight: '', tags: [] }
  if (!rawText.trim()) return empty

  // ── TIER 1: z-ai-web-dev-sdk (primary, no API key needed) ──────────
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: COGNITIVE_SYSTEM_PROMPT },
        { role: 'user', content: `Raw input:\n${rawText.slice(0, 2000)}` },
      ],
      thinking: { type: 'disabled' },
    })

    const responseText = completion.choices[0]?.message?.content?.trim() || ''
    const parsed = parseCognitiveJSON(responseText)
    if (parsed.summary || parsed.deepInsight || parsed.tags.length > 0) {
      console.log('[capture] Cognitive synthesis: z-ai-web-dev-sdk (Tier 1) succeeded')
      return parsed
    }
  } catch (err) {
    console.error('[capture] z-ai synthesis failed:', err instanceof Error ? err.message : 'Unknown')
  }

  // ── TIER 2: Gemini 1.5 Flash (if API key available) ───────────────
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) throw new Error('No Gemini key')

    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${COGNITIVE_SYSTEM_PROMPT}\n\nRaw input:\n${rawText.slice(0, 2000)}` }],
        },
      ],
      generationConfig: { temperature: 0.5, maxOutputTokens: 600 },
    })

    const responseText = result.response.text().trim()
    const parsed = parseCognitiveJSON(responseText)
    if (parsed.summary || parsed.deepInsight || parsed.tags.length > 0) {
      console.log('[capture] Cognitive synthesis: Gemini Flash (Tier 2) succeeded')
      return parsed
    }
  } catch (err) {
    console.error('[capture] Gemini synthesis failed:', err instanceof Error ? err.message : 'Unknown')
  }

  // ── TIER 3: Keyword fallback (always works) ───────────────────────
  console.log('[capture] All AI tiers failed — using keyword fallback')
  return empty
}

function parseCognitiveJSON(responseText: string): CognitiveResult {
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
        deepInsight: typeof parsed.deep_insight === 'string' ? parsed.deep_insight.trim() : '',
        tags: Array.isArray(parsed.tags)
          ? parsed.tags
              .filter((t: unknown) => typeof t === 'string')
              .map((t: string) => t.toLowerCase().trim())
              .filter(Boolean)
              .slice(0, 5)
          : [],
      }
    } catch {
      // JSON parse failed — continue to regex extraction
    }
  }

  // Fallback: try to extract individual fields via regex
  const summaryMatch = responseText.match(/"summary"\s*:\s*"([^"]*)"/)
  const insightMatch = responseText.match(/"deep_insight"\s*:\s*"([^"]*)"/)

  return {
    summary: summaryMatch?.[1]?.trim() || '',
    deepInsight: insightMatch?.[1]?.trim() || '',
    tags: [],
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ─── AUTONOMOUS COLLECTIONS ENGINE ───────────────────────────────────
// Rule 1: If a new memory's tags match an existing collection name,
//         auto-assign the memory to that collection.
// Rule 2: If 10+ uncollected memories share a conceptual tag grouping,
//         auto-create a new collection and batch-assign those memories.
// ═══════════════════════════════════════════════════════════════════════

async function runAutonomousCollections(
  memoryId: string,
  memoryTags: string[],
  userId: string
): Promise<void> {
  try {
    await matchToExistingCollections(memoryId, memoryTags, userId)
    await checkAutoCollectionRule(userId)
  } catch (err) {
    console.error('[capture] Autonomous collections error:', err instanceof Error ? err.message : 'Unknown')
  }
}

async function matchToExistingCollections(
  memoryId: string,
  memoryTags: string[],
  userId: string
): Promise<void> {
  try {
    const supabase = await getSupabaseServer()

    // Fetch all user's collections
    const { data: userCollections, error: collError } = await supabase
      .from('collections')
      .select('id, name')
      .eq('user_id', userId)

    if (collError || !userCollections) return

    for (const collection of userCollections) {
      const collNameLower = collection.name.toLowerCase()

      // Check if any of the memory's tags match this collection's name
      const tagMatches = memoryTags.some(
        (tag) =>
          collNameLower.includes(tag) ||
          tag.includes(collNameLower) ||
          levenshteinSimilarity(collNameLower, tag) > 0.6
      )

      if (tagMatches) {
        // Check if this junction already exists
        const { data: existingJunction } = await supabase
          .from('memory_collections')
          .select('id')
          .eq('memory_id', memoryId)
          .eq('collection_id', collection.id)
          .limit(1)

        if (!existingJunction || existingJunction.length === 0) {
          await supabase.from('memory_collections').insert({
            memory_id: memoryId,
            collection_id: collection.id,
          })
          console.log(`[capture] Auto-assigned memory ${memoryId} to collection "${collection.name}"`)
        }
      }
    }
  } catch (err) {
    console.error('[capture] Collection matching error:', err instanceof Error ? err.message : 'Unknown')
  }
}

async function checkAutoCollectionRule(userId: string): Promise<void> {
  try {
    const supabase = await getSupabaseServer()

    // Fetch all user's memories that have tags
    const { data: allMemories, error: memError } = await supabase
      .from('memories')
      .select('id, tags')
      .eq('user_id', userId)
      .neq('tags', '')

    if (memError || !allMemories || allMemories.length < 10) return

    // Fetch all existing junction rows to determine which memories are collected
    const { data: junctions } = await supabase
      .from('memory_collections')
      .select('memory_id')

    const collectedMemoryIds = new Set((junctions || []).map((j) => j.memory_id))

    // Filter to uncollected memories only
    const uncollectedMemories = allMemories.filter((m) => !collectedMemoryIds.has(m.id))

    if (uncollectedMemories.length < 10) return

    // Build tag frequency map from uncollected memories
    const tagFrequency: Record<string, string[]> = {}
    for (const mem of uncollectedMemories) {
      const memTags = (mem.tags as string)
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
      for (const tag of memTags) {
        if (!tagFrequency[tag]) tagFrequency[tag] = []
        tagFrequency[tag].push(mem.id)
      }
    }

    // Fetch existing collection names to avoid duplicates
    const { data: existingCollections } = await supabase
      .from('collections')
      .select('name')
      .eq('user_id', userId)

    const existingNames = new Set(
      (existingCollections || []).map((c) => c.name.toLowerCase())
    )

    const clusterColors = [
      '#6D597A', '#B56576', '#355070', '#EA526F',
      '#23B5D3', '#7B2D8E', '#F18F01', '#C73E1D',
      '#2D936C', '#566E3D', '#8B5CF6', '#EC4899',
    ]
    const { count: collectionCount } = await supabase
      .from('collections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    let colorIdx = collectionCount || 0

    // Find tag clusters that hit 10+ memories
    for (const [tag, memoryIds] of Object.entries(tagFrequency)) {
      if (memoryIds.length >= 10) {
        const collectionName = tag.charAt(0).toUpperCase() + tag.slice(1)

        // Skip if a collection with this name already exists
        if (existingNames.has(collectionName.toLowerCase())) continue

        const color = clusterColors[colorIdx % clusterColors.length]
        colorIdx++

        // Create the new collection
        const { data: newCollection, error: createError } = await supabase
          .from('collections')
          .insert({
            user_id: userId,
            name: collectionName,
            icon: getTagIcon(tag),
            color,
          })
          .select('id')
          .single()

        if (createError || !newCollection) {
          console.error('[capture] Auto-collection creation failed:', createError?.message)
          continue
        }

        // Batch-assign all matching memories to this new collection
        const junctionInserts = memoryIds.slice(0, 100).map((memId) => ({
          memory_id: memId,
          collection_id: newCollection.id,
        }))

        const { error: junctionError } = await supabase
          .from('memory_collections')
          .insert(junctionInserts)

        if (junctionError) {
          console.error('[capture] Junction insert failed:', junctionError.message)
        } else {
          console.log(`[capture] Auto-created collection "${collectionName}" with ${memoryIds.length} memories`)
          existingNames.add(collectionName.toLowerCase())
        }
      }
    }
  } catch (err) {
    console.error('[capture] Auto-collection rule error:', err instanceof Error ? err.message : 'Unknown')
  }
}

// ─── Tag-to-icon mapping for auto-created collections ──────────────
function getTagIcon(tag: string): string {
  const iconMap: Record<string, string> = {
    work: '💼',
    personal: '🧘',
    travel: '✈️',
    learning: '📚',
    code: '⚡',
    design: '🎨',
    ai: '🤖',
    recipe: '🍳',
    idea: '💡',
    finance: '💰',
    link: '🔗',
    task: '✅',
    health: '❤️',
    music: '🎵',
    car: '🏎️',
  }
  return iconMap[tag] || '📁'
}

// ─── Levenshtein similarity for fuzzy tag matching ─────────────────
function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (!a.length || !b.length) return 0

  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  const maxLen = Math.max(a.length, b.length)
  return 1 - matrix[b.length][a.length] / maxLen
}

// ═══════════════════════════════════════════════════════════════════════
// ─── BUILD MEMORY SHAPE FROM SUPABASE ROW ────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
function buildMemoryResponse(
  row: Record<string, unknown>,
  collections: { id: string; name: string; color: string; icon: string }[] = []
) {
  return {
    id: row.id as string,
    type: (row.type as string) || 'text',
    title: (row.title as string) || '',
    content: (row.content as string) || '',
    summary: (row.summary as string) || null,
    deepInsight: (row.deep_insight as string) || (row.deepInsight as string) || null,
    tags: row.tags ? (row.tags as string).split(',').filter(Boolean) : [],
    sourceUrl: row.source_url ?? row.sourceUrl ?? null,
    fileUrl: row.file_url ?? row.fileUrl ?? null,
    imagePreview: row.image_preview ?? row.imagePreview ?? null,
    imageUrl: row.image_url ?? row.imageUrl ?? null,
    recap: row.recap ?? null,
    isFavorite: (row.is_favorite ?? row.isFavorite ?? false) as boolean,
    createdAt: (row.created_at ?? row.createdAt ?? new Date().toISOString()) as string,
    updatedAt: (row.updated_at ?? row.updatedAt ?? new Date().toISOString()) as string,
    collections,
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ─── POST /api/capture — THE UNIVERSAL CAPTURE ENGINE ────────────────
// ═══════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // ── STEP 1: UNIVERSAL PAYLOAD SCANNER ─────────────────────────────
    const formData = await req.formData()

    const textInput = (formData.get('text') as string) || ''
    const urlInput = (formData.get('url') as string) || ''
    const typeOverride = (formData.get('type') as string) || ''
    const audioFile = formData.get('audio') as File | null
    const imageFile = formData.get('image') as File | null

    const hasText = textInput.trim().length > 0
    const hasUrl = urlInput.trim().length > 0
    const hasAudio = audioFile !== null && audioFile.size > 0
    const hasImage = imageFile !== null && imageFile.size > 0

    if (!hasText && !hasUrl && !hasAudio && !hasImage) {
      return NextResponse.json(
        { success: false, error: 'No content provided. Send text, audio, image, or url.' },
        { status: 400 }
      )
    }

    // ── STEP 2: AUTHENTICATE USER VIA SUPABASE ───────────────────────
    let supabaseUserId: string | null = null
    let useSupabase = false

    try {
      const supabase = await getSupabaseServer()
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (!authError && authUser) {
        supabaseUserId = authUser.id
        useSupabase = true
      }
    } catch {
      // Supabase not configured — fall back to Prisma
      useSupabase = false
    }

    // ── STEP 3: DYNAMIC INPUT DISPATCHING ────────────────────────────

    // 3a: Transcribe audio if present (z-ai ASR → Groq Whisper)
    let audioTranscript = ''
    if (hasAudio && audioFile) {
      audioTranscript = await transcribeAudio(audioFile)
    }

    // 3b: Upload image to Supabase Storage if present
    let imageUrl: string | null = null
    let imagePreviewUrl: string | null = null
    if (hasImage && imageFile) {
      if (useSupabase && supabaseUserId) {
        imageUrl = await uploadImageToStorage(imageFile, supabaseUserId)
      }
      if (!imageUrl) {
        // Fallback: base64 preview if storage upload fails or no Supabase
        try {
          const arrayBuffer = await imageFile.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          const mimeType = imageFile.type || 'image/png'
          imagePreviewUrl = `data:${mimeType};base64,${base64}`
        } catch {
          imagePreviewUrl = null
        }
      }
    }

    // 3c: Determine content type
    let memoryType = 'text'
    if (typeOverride && ['text', 'voice', 'link', 'image'].includes(typeOverride)) {
      memoryType = typeOverride
    } else if (hasImage) {
      memoryType = 'image'
    } else if (hasAudio && !hasText && !hasUrl) {
      memoryType = 'voice'
    } else if (hasUrl || (hasText && /https?:\/\//.test(textInput.toLowerCase()))) {
      memoryType = 'link'
    }

    // 3d: Compose the raw content string
    let rawContent = ''
    if (audioTranscript.trim()) {
      rawContent = audioTranscript.trim()
      if (hasText && textInput.trim()) {
        rawContent = `${textInput.trim()}\n\n${audioTranscript.trim()}`
      }
    } else if (hasText) {
      rawContent = textInput.trim()
    }

    const sourceUrl = hasUrl ? urlInput.trim() : memoryType === 'link' ? textInput.trim() : null

    if (hasImage && !rawContent.trim()) {
      rawContent = imageFile ? `Image: ${imageFile.name}` : 'Image'
    }

    // Compose the title
    let title = rawContent.length > 80 ? rawContent.slice(0, 80) + '...' : rawContent
    if (hasImage && !textInput.trim()) {
      title = imageFile ? `Image: ${imageFile.name}` : 'Image'
    }

    // ── STEP 4: COGNITIVE SYNTHESIS — 3-TIER AI PIPELINE ───────────
    const textForSynthesis = rawContent || (hasUrl ? urlInput : '')
    let cleanedSummary: string | null = null
    let deepInsight: string | null = null
    let aiTags: string[] = []

    // Always run keyword tags first (instant, free, reliable)
    const keywordTags = autoGenerateTags(rawContent, title)

    // Run AI synthesis if we have content (with 10-second timeout)
    if (textForSynthesis.trim()) {
      try {
        const synthesisPromise = generateCognitiveSynthesis(textForSynthesis)
        const timeoutPromise = new Promise<CognitiveResult>((resolve) =>
          setTimeout(() => resolve({ summary: '', deepInsight: '', tags: [] }), 10000)
        )

        const cognitive = await Promise.race([synthesisPromise, timeoutPromise])
        if (cognitive.summary) cleanedSummary = cognitive.summary
        if (cognitive.deepInsight) deepInsight = cognitive.deepInsight
        if (cognitive.tags.length > 0) aiTags = cognitive.tags
      } catch (err) {
        console.error('[capture] Synthesis error:', err instanceof Error ? err.message : 'Unknown')
      }
    }

    // Merge: AI tags take priority, keyword tags fill gaps
    const finalTags = aiTags.length > 0
      ? [...new Set([...aiTags, ...keywordTags])].slice(0, 5)
      : keywordTags

    // ── STEP 5: DATABASE INGESTION ───────────────────────────────────
    let memory: Record<string, unknown>

    // 5a: Supabase-first insertion (authenticated users with RLS)
    if (useSupabase && supabaseUserId) {
      try {
        const supabase = await getSupabaseServer()
        const insertData: Record<string, unknown> = {
          user_id: supabaseUserId,
          type: memoryType,
          title,
          content: rawContent,
          source_url: sourceUrl || null,
          tags: finalTags.join(','),
        }

        if (cleanedSummary) insertData.summary = cleanedSummary
        if (deepInsight) insertData.deep_insight = deepInsight
        if (imageUrl) insertData.image_url = imageUrl
        if (imagePreviewUrl && !imageUrl) insertData.image_preview = imagePreviewUrl

        const { data: memoryRow, error: insertError } = await supabase
          .from('memories')
          .insert(insertData)
          .select('*, memory_collections(collection_id, collections(id, name, color, icon))')
          .single()

        if (insertError) throw insertError

        const row = memoryRow as Record<string, unknown>
        const collectionsFromRow = (
          (row.memory_collections as Record<string, Record<string, unknown>>[]) || []
        ).map((mc) => ({
          id: (mc.collections as Record<string, unknown>)?.id as string,
          name: (mc.collections as Record<string, unknown>)?.name as string,
          color: (mc.collections as Record<string, unknown>)?.color as string,
          icon: (mc.collections as Record<string, unknown>)?.icon as string,
        }))

        memory = buildMemoryResponse(row, collectionsFromRow)

        // Background: embedding + link reading + auto-collections
        if (rawContent.trim()) {
          const baseUrl = new URL(req.url).origin
          fetch(`${baseUrl}/api/generate-embedding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memoryId: memory.id, content: rawContent.slice(0, 2000) }),
          }).catch(() => {})
        }

        if (sourceUrl?.trim()) {
          const baseUrl = new URL(req.url).origin
          fetch(`${baseUrl}/api/ai/read-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: sourceUrl }),
          }).catch(() => {})
        }

        runAutonomousCollections(memory.id as string, finalTags, supabaseUserId).catch(() => {})

        return NextResponse.json({ success: true, memory })
      } catch (err) {
        console.error('[capture] Supabase insertion failed, falling back to Prisma:', err instanceof Error ? err.message : 'Unknown')
      }
    }

    // 5b: Fallback — Prisma SQLite insertion (local / no Supabase)
    try {
      const { db } = await import('@/lib/db')

      const prismaMemory = await db.memory.create({
        data: {
          type: memoryType,
          title,
          content: rawContent,
          summary: cleanedSummary,
          deepInsight,
          sourceUrl: sourceUrl || null,
          tags: finalTags.join(','),
          imageUrl: imageUrl || null,
          imagePreview: imagePreviewUrl && !imageUrl ? imagePreviewUrl : null,
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

      memory = buildMemoryResponse(
        {
          id: prismaMemory.id,
          type: prismaMemory.type,
          title: prismaMemory.title,
          content: prismaMemory.content,
          summary: prismaMemory.summary,
          deepInsight: prismaMemory.deepInsight,
          tags: prismaMemory.tags,
          sourceUrl: prismaMemory.sourceUrl,
          fileUrl: prismaMemory.fileUrl,
          imagePreview: prismaMemory.imagePreview,
          imageUrl: prismaMemory.imageUrl,
          isFavorite: prismaMemory.isFavorite,
          created_at: prismaMemory.createdAt.toISOString(),
          updated_at: prismaMemory.updatedAt.toISOString(),
        },
        prismaMemory.collections.map((mc) => ({
          id: mc.collection.id,
          name: mc.collection.name,
          color: mc.collection.color,
          icon: mc.collection.icon,
        }))
      )

      // Background: embedding + link reading
      if (rawContent.trim()) {
        const baseUrl = new URL(req.url).origin
        fetch(`${baseUrl}/api/generate-embedding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memoryId: prismaMemory.id, content: rawContent.slice(0, 2000) }),
        }).catch(() => {})
      }

      if (sourceUrl?.trim()) {
        const baseUrl = new URL(req.url).origin
        fetch(`${baseUrl}/api/ai/read-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: sourceUrl }),
        }).catch(() => {})
      }

      return NextResponse.json({ success: true, memory })
    } catch (err) {
      console.error('[capture] Prisma insertion failed:', err instanceof Error ? err.message : 'Unknown')
      return NextResponse.json(
        { success: false, error: 'Failed to save memory to database' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[capture] Unhandled error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { success: false, error: 'Internal server error during capture' },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ─── DELETE /api/capture — PURGE MEMORY FROM SUPABASE ────────────────
// ═══════════════════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const memoryId = searchParams.get('id')

    if (!memoryId) {
      return NextResponse.json(
        { success: false, error: 'Memory ID is required' },
        { status: 400 }
      )
    }

    // Try Supabase deletion first
    let supabaseDeleted = false
    try {
      const supabase = await getSupabaseServer()
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (!authError && authUser) {
        // Delete junction rows first (foreign key constraint)
        const { error: junctionError } = await supabase
          .from('memory_collections')
          .delete()
          .eq('memory_id', memoryId)

        if (junctionError) {
          console.error('[capture] Junction delete error:', junctionError.message)
        }

        // Delete the memory itself
        const { error: deleteError } = await supabase
          .from('memories')
          .delete()
          .eq('id', memoryId)
          .eq('user_id', authUser.id)

        if (!deleteError) {
          supabaseDeleted = true
        } else {
          console.error('[capture] Supabase delete failed:', deleteError.message)
        }
      }
    } catch {
      // Supabase not available — fall through to Prisma
    }

    // Fallback: Prisma deletion (always attempt if Supabase didn't succeed)
    if (!supabaseDeleted) {
      try {
        const { db } = await import('@/lib/db')
        await db.memory.delete({ where: { id: memoryId } })
      } catch (prismaErr) {
        console.error('[capture] Prisma delete failed:', prismaErr instanceof Error ? prismaErr.message : 'Unknown')
        // If both failed, return error
        if (!supabaseDeleted) {
          return NextResponse.json(
            { success: false, error: 'Failed to delete memory' },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[capture] Delete error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { success: false, error: 'Internal server error during deletion' },
      { status: 500 }
    )
  }
}

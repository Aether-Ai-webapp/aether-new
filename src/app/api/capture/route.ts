import { NextRequest, NextResponse } from 'next/server'

// ─── Supabase server client ─────────────────────────────────────────
async function getSupabaseServer() {
  const { createClient } = await import('@/lib/supabase/server')
  return createClient()
}

// ─── Prisma client ──────────────────────────────────────────────────
async function getPrisma() {
  const { db } = await import('@/lib/db')
  return db
}

// ─── Keyword-based auto-tagging (free, instant, no API) ────────────
function autoGenerateTags(content: string, title: string): string[] {
  const text = `${title} ${content}`.toLowerCase()
  const tagMap: Record<string, string[]> = {
    work: ['meeting', 'project', 'deadline', 'client', 'office', 'team', 'q1', 'q2', 'q3', 'q4', 'quarterly', 'strategy'],
    personal: ['routine', 'morning', 'exercise', 'meditation', 'journal', 'habit', 'family'],
    travel: ['trip', 'itinerary', 'flight', 'hotel', 'visit', 'tokyo', 'paris', 'destination', 'vacation'],
    learning: ['learn', 'study', 'course', 'tutorial', 'book', 'read', 'article', 'university'],
    code: ['code', 'programming', 'react', 'javascript', 'typescript', 'api', 'bug', 'feature', 'css', 'html', 'framework', 'debug', 'deploy'],
    design: ['design', 'ui', 'ux', 'layout', 'color', 'font', 'figma', 'wireframe', 'gradient', 'typography'],
    ai: ['ai', 'machine learning', 'neural', 'model', 'gpt', 'gemini', 'llm', 'chatbot', 'prompt'],
    recipe: ['recipe', 'cook', 'bake', 'ingredient', 'food', 'meal', 'breakfast', 'dinner', 'groceries'],
    idea: ['idea', 'concept', 'brainstorm', 'innovative', 'startup', 'prototype', 'vision'],
    finance: ['budget', 'expense', 'invest', 'savings', 'money', 'cost', 'salary', 'revenue'],
    link: ['http', 'https', 'www', '.com', '.io', '.org', '.dev'],
    task: ['todo', 'remind', 'need to', 'must', 'buy', 'deadline', 'urgent'],
    health: ['health', 'doctor', 'exercise', 'workout', 'gym', 'diet', 'sleep', 'mental'],
    music: ['music', 'song', 'album', 'playlist', 'spotify', 'concert', 'band'],
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

// ─── Transcribe audio via z-ai-web-dev-sdk ASR ─────────────────────
async function transcribeAudio(audioFile: File): Promise<string> {
  try {
    const { createTranscription } = await import('@/lib/aether-asr')
    const transcript = await createTranscription(audioFile)
    if (transcript?.trim()) return transcript.trim()
  } catch (err) {
    console.error('[capture] ASR transcription failed:', err instanceof Error ? err.message : 'Unknown error')
  }

  // Fallback: try Groq Whisper via REST API
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
      if (data.text?.trim()) return data.text.trim()
    }
  } catch (err) {
    console.error('[capture] Groq Whisper fallback failed:', err instanceof Error ? err.message : 'Unknown error')
  }

  return ''
}

// ─── Upload image to Supabase storage ──────────────────────────────
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
    console.error('[capture] Image upload failed:', err instanceof Error ? err.message : 'Unknown error')
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ─── COGNITIVE SYNTHESIS ENGINE — Gemini 1.5 Flash ───────────────────
// Upgraded: produces summary + deep_insight + tags in one call
// ═══════════════════════════════════════════════════════════════════════
interface CognitiveResult {
  summary: string
  deepInsight: string
  tags: string[]
}

const COGNITIVE_SYSTEM_PROMPT = `You are Aether — a premium cognitive sanctuary and second-brain intelligence engine. Your purpose is to transform raw human thought into crystallized insight with the depth and elegance of a world-class thinker.

You receive raw sensory input — text fragments, voice transcripts, image descriptions, or web links. You must produce a strictly formatted JSON response with three fields:

1. "summary": A pristine, completely natural 2-sentence synthesis of the core thought. Write as if you are a brilliant editor distilling an essay into its essential truth. No robotic phrasing, no filler, no labels. Just pure, human-readable insight that captures the essence.

2. "deep_insight": A deeply analytical, professionally insightful cognitive expansion of this thought. Write 3-4 sentences that reveal hidden connections, implications, or patterns the thinker may not have consciously noticed. Adopt the voice of a wise mentor who sees what lies beneath the surface. Be specific and intellectually rigorous — no platitudes.

3. "tags": An array of exactly 3 concise, lowercase keyword strings that conceptually represent the memory's domain. Choose tags that would help cluster this thought with similar ones in a knowledge graph (e.g., ["design", "psychology", "creativity"]).

Return ONLY the raw JSON object. No markdown formatting, no code blocks, no extra text.`

async function generateCognitiveSynthesis(rawText: string): Promise<CognitiveResult> {
  const empty: CognitiveResult = { summary: '', deepInsight: '', tags: [] }
  if (!rawText.trim()) return empty

  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) return empty

    const synthesisPromise = (async (): Promise<CognitiveResult> => {
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
        generationConfig: { temperature: 0.5, maxOutputTokens: 500 },
      })

      const responseText = result.response.text().trim()

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          return {
            summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
            deepInsight: typeof parsed.deep_insight === 'string' ? parsed.deep_insight.trim() : '',
            tags: Array.isArray(parsed.tags)
              ? parsed.tags.filter((t: unknown) => typeof t === 'string').map((t: string) => t.toLowerCase().trim()).filter(Boolean).slice(0, 5)
              : [],
          }
        } catch {
          // JSON parse failed
        }
      }

      // Fallback: try to extract individual fields
      const summaryMatch = responseText.match(/"summary"\s*:\s*"([^"]*)"/)
      const insightMatch = responseText.match(/"deep_insight"\s*:\s*"([^"]*)"/)

      return {
        summary: summaryMatch?.[1]?.trim() || '',
        deepInsight: insightMatch?.[1]?.trim() || '',
        tags: [],
      }
    })()

    const timeoutPromise = new Promise<CognitiveResult>((resolve) => {
      setTimeout(() => resolve(empty), 8000)
    })

    return await Promise.race([synthesisPromise, timeoutPromise])
  } catch (err) {
    console.error('[capture] Cognitive synthesis failed:', err instanceof Error ? err.message : 'Unknown error')
    return empty
  }
}

// ─── AUTONOMOUS COLLECTIONS ENGINE ─────────────────────────────────
// Two rules:
// 1. MANUAL MATCH: If a new memory's tags match an existing collection name,
//    auto-assign the memory to that collection.
// 2. AUTO-10 RULE: If 10+ uncollected memories share similar tags,
//    automatically create a new collection and sweep them in.

async function runAutonomousCollections(
  memoryId: string,
  memoryTags: string[],
  baseUrl: string
): Promise<void> {
  try {
    // Rule 1: Match against existing collections
    await matchToExistingCollections(memoryId, memoryTags)

    // Rule 2: Check for tag clusters that hit the 10-memory threshold
    await checkAutoCollectionRule(baseUrl)
  } catch (err) {
    console.error('[capture] Autonomous collections error:', err instanceof Error ? err.message : 'Unknown error')
  }
}

async function matchToExistingCollections(memoryId: string, memoryTags: string[]): Promise<void> {
  try {
    const db = await getPrisma()

    // Get all collections
    const collections = await db.collection.findMany()

    for (const collection of collections) {
      const collNameLower = collection.name.toLowerCase()

      // Check if any memory tag matches or relates to the collection name
      const tagMatches = memoryTags.some(
        (tag) =>
          collNameLower.includes(tag) ||
          tag.includes(collNameLower) ||
          levenshteinSimilarity(collNameLower, tag) > 0.6
      )

      if (tagMatches) {
        // Check if the junction already exists
        const existing = await db.memoryCollection.findFirst({
          where: {
            memoryId,
            collectionId: collection.id,
          },
        })

        if (!existing) {
          await db.memoryCollection.create({
            data: {
              memoryId,
              collectionId: collection.id,
            },
          })
        }
      }
    }

    // Also try Supabase path
    try {
      const supabase = await getSupabaseServer()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: supabaseCollections } = await supabase
          .from('collections')
          .select('id, name')
          .eq('user_id', user.id)

        if (supabaseCollections) {
          for (const col of supabaseCollections) {
            const colNameLower = col.name.toLowerCase()
            const tagMatches = memoryTags.some(
              (tag) =>
                colNameLower.includes(tag) ||
                tag.includes(colNameLower) ||
                levenshteinSimilarity(colNameLower, tag) > 0.6
            )
            if (tagMatches) {
              await supabase.from('memory_collections').upsert({
                memory_id: memoryId,
                collection_id: col.id,
              }, { onConflict: 'memory_id,collection_id' })
            }
          }
        }
      }
    } catch {
      // Supabase path optional
    }
  } catch (err) {
    console.error('[capture] Collection matching error:', err instanceof Error ? err.message : 'Unknown error')
  }
}

async function checkAutoCollectionRule(baseUrl: string): Promise<void> {
  try {
    const db = await getPrisma()

    // Find memories that have NO collection assignments
    const uncollectedMemories = await db.memory.findMany({
      where: {
        collections: { none: {} },
        tags: { not: '' },
      },
      select: { id: true, tags: true },
    })

    if (uncollectedMemories.length < 10) return

    // Build tag frequency map
    const tagFrequency: Record<string, string[]> = {} // tag -> array of memory IDs
    for (const mem of uncollectedMemories) {
      const memTags = mem.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
      for (const tag of memTags) {
        if (!tagFrequency[tag]) tagFrequency[tag] = []
        tagFrequency[tag].push(mem.id)
      }
    }

    // Find tag clusters that hit 10+ memories
    const clusterColors = ['#6D597A', '#B56576', '#355070', '#EA526F', '#23B5D3', '#7B2D8E', '#F18F01', '#C73E1D']
    let colorIdx = await db.collection.count()

    for (const [tag, memoryIds] of Object.entries(tagFrequency)) {
      if (memoryIds.length >= 10) {
        // Check if a collection for this tag already exists
        const existingCollection = await db.collection.findFirst({
          where: { name: { equals: tag.charAt(0).toUpperCase() + tag.slice(1), mode: 'insensitive' } },
        })

        if (!existingCollection) {
          // Create a new collection with an intelligent name
          const collectionName = tag.charAt(0).toUpperCase() + tag.slice(1)
          const color = clusterColors[colorIdx % clusterColors.length]
          colorIdx++

          const newCollection = await db.collection.create({
            data: {
              name: collectionName,
              icon: getTagIcon(tag),
              color,
            },
          })

          // Assign the clustered memories to this new collection
          for (const memId of memoryIds) {
            await db.memoryCollection.upsert({
              where: {
                memoryId_collectionId: { memoryId: memId, collectionId: newCollection.id },
              },
              create: {
                memoryId: memId,
                collectionId: newCollection.id,
              },
              update: {},
            })
          }

          console.log(`[capture] Auto-created collection "${collectionName}" with ${memoryIds.length} memories`)

          // Also create in Supabase if available
          try {
            const supabase = await getSupabaseServer()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const { data: supaCol } = await supabase
                .from('collections')
                .insert({
                  user_id: user.id,
                  name: collectionName,
                  icon: getTagIcon(tag),
                  color,
                })
                .select('id')
                .single()

              if (supaCol) {
                for (const memId of memoryIds.slice(0, 50)) {
                  await supabase.from('memory_collections').upsert({
                    memory_id: memId,
                    collection_id: supaCol.id,
                  }, { onConflict: 'memory_id,collection_id' })
                }
              }
            }
          } catch {
            // Supabase path optional
          }
        }
      }
    }
  } catch (err) {
    console.error('[capture] Auto-collection rule error:', err instanceof Error ? err.message : 'Unknown error')
  }
}

// ─── Tag-to-icon mapping for auto-created collections ──────────────
function getTagIcon(tag: string): string {
  const iconMap: Record<string, string> = {
    work: '💼', personal: '🧘', travel: '✈️', learning: '📚',
    code: '⚡', design: '🎨', ai: '🤖', recipe: '🍳',
    idea: '💡', finance: '💰', link: '🔗', task: '✅',
    health: '❤️', music: '🎵', car: '🏎️',
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

// ─── Build memory shape from DB row ─────────────────────────────────
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
    deepInsight: (row.deepInsight as string) || (row.deep_insight as string) || null,
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
    // Parse the incoming FormData and classify each field by type.
    const formData = await req.formData()

    const textInput = (formData.get('text') as string) || ''
    const urlInput = (formData.get('url') as string) || ''
    const typeOverride = (formData.get('type') as string) || ''
    const audioFile = formData.get('audio') as File | null
    const imageFile = formData.get('image') as File | null

    const baseUrl = new URL(req.url).origin

    // Classify: is it text? a link? an audio blob? an image file?
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

    // ── STEP 2: Determine the user (Supabase session or local) ─────
    let supabaseSession: { user: { id: string } } | null = null
    let useSupabase = false

    try {
      const supabase = await getSupabaseServer()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!authError && user) {
        supabaseSession = { user }
        const { error: tableCheck } = await supabase
          .from('memories')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
        useSupabase = !tableCheck
      }
    } catch {
      // No Supabase session
    }

    // ── STEP 3: DYNAMIC INPUT DISPATCHING ────────────────────────────

    // 3a: Transcribe audio if present
    let audioTranscript = ''
    if (hasAudio && audioFile) {
      audioTranscript = await transcribeAudio(audioFile)
    }

    // 3b: Upload image if present
    let imageUrl: string | null = null
    let imagePreviewUrl: string | null = null
    if (hasImage && imageFile) {
      if (useSupabase && supabaseSession) {
        imageUrl = await uploadImageToStorage(imageFile, supabaseSession.user.id)
      }
      if (!imageUrl) {
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

    // 3c: Determine the content type
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
    let title = ''
    if (rawContent.length > 80) {
      title = rawContent.slice(0, 80) + '...'
    } else {
      title = rawContent
    }
    if (hasImage && !textInput.trim()) {
      title = imageFile ? `Image: ${imageFile.name}` : 'Image'
    }

    // ── STEP 4: COGNITIVE SYNTHESIS — Gemini Flash ─────────────────
    const textForSynthesis = rawContent || (hasUrl ? urlInput : '')
    let cleanedSummary: string | null = null
    let deepInsight: string | null = null
    let aiTags: string[] = []

    // Start with keyword tags (instant, free)
    const keywordTags = autoGenerateTags(rawContent, title)

    if (textForSynthesis.trim()) {
      const cognitive = await generateCognitiveSynthesis(textForSynthesis)
      if (cognitive.summary) cleanedSummary = cognitive.summary
      if (cognitive.deepInsight) deepInsight = cognitive.deepInsight
      if (cognitive.tags.length > 0) aiTags = cognitive.tags
    }

    // Merge: AI tags take priority, keyword tags fill gaps
    const finalTags = aiTags.length > 0
      ? [...new Set([...aiTags, ...keywordTags])].slice(0, 5)
      : keywordTags

    // ── STEP 5: Database ingestion ───────────────────────────────────
    let memory: Record<string, unknown>

    // 5a: Try Supabase insertion
    if (useSupabase && supabaseSession) {
      try {
        const supabase = await getSupabaseServer()
        const insertData: Record<string, unknown> = {
          user_id: supabaseSession.user.id,
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

        // ── Background: embedding + link reading + auto-collections ────
        if (rawContent.trim()) {
          fetch(`${baseUrl}/api/generate-embedding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memoryId: memory.id, content: rawContent.slice(0, 2000) }),
          }).catch(() => {})
        }

        if (sourceUrl?.trim()) {
          fetch(`${baseUrl}/api/ai/read-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: sourceUrl }),
          }).catch(() => {})
        }

        // Autonomous collections (fire-and-forget)
        runAutonomousCollections(memory.id as string, finalTags, baseUrl).catch(() => {})

        return NextResponse.json({ success: true, memory })
      } catch (err) {
        console.error('[capture] Supabase insertion failed, falling back to Prisma:', err instanceof Error ? err.message : 'Unknown error')
      }
    }

    // 5b: Fallback — Prisma SQLite insertion
    try {
      const db = await getPrisma()

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

      // ── Background: embedding + link reading + auto-collections ────
      if (rawContent.trim()) {
        fetch(`${baseUrl}/api/generate-embedding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memoryId: prismaMemory.id, content: rawContent.slice(0, 2000) }),
        }).catch(() => {})
      }

      if (sourceUrl?.trim()) {
        fetch(`${baseUrl}/api/ai/read-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: sourceUrl }),
        }).catch(() => {})
      }

      // Autonomous collections (fire-and-forget)
      runAutonomousCollections(prismaMemory.id, finalTags, baseUrl).catch(() => {})

      return NextResponse.json({ success: true, memory })
    } catch (err) {
      console.error('[capture] Prisma insertion failed:', err instanceof Error ? err.message : 'Unknown error')
      return NextResponse.json(
        { success: false, error: 'Failed to save memory to database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[capture] Unhandled error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { success: false, error: 'Internal server error during capture' },
      { status: 500 }
    )
  }
}

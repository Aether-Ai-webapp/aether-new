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
    personal: ['routine', 'morning', 'exercise', 'meditation', 'journal', 'habit'],
    travel: ['trip', 'itinerary', 'flight', 'hotel', 'visit', 'tokyo', 'paris', 'destination'],
    learning: ['learn', 'study', 'course', 'tutorial', 'book', 'read', 'article'],
    code: ['code', 'programming', 'react', 'javascript', 'typescript', 'api', 'bug', 'feature', 'css', 'html', 'framework'],
    design: ['design', 'ui', 'ux', 'layout', 'color', 'font', 'figma', 'wireframe'],
    ai: ['ai', 'machine learning', 'neural', 'model', 'gpt', 'gemini', 'llm', 'chatbot'],
    recipe: ['recipe', 'cook', 'bake', 'ingredient', 'food', 'meal', 'breakfast', 'dinner'],
    idea: ['idea', 'concept', 'brainstorm', 'innovative', 'startup', 'prototype'],
    finance: ['budget', 'expense', 'invest', 'savings', 'money', 'cost'],
    link: ['http', 'https', 'www', '.com', '.io', '.org'],
    task: ['todo', 'remind', 'need to', 'must', 'buy', 'deadline'],
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

    // Generate a unique file path
    const ext = imageFile.name.split('.').pop() || 'png'
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).slice(2, 8)
    const filePath = `${userId}/${timestamp}-${randomSuffix}.${ext}`

    // Try to upload to 'memories' bucket
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

    // Get the public URL
    const { data: urlData } = supabase.storage.from('memories').getPublicUrl(filePath)
    return urlData?.publicUrl || null
  } catch (err) {
    console.error('[capture] Image upload failed:', err instanceof Error ? err.message : 'Unknown error')
    return null
  }
}

// ─── Generate AI summary via Gemini Flash (with timeout) ────────────
async function generateCognitiveSummary(rawText: string): Promise<string> {
  if (!rawText.trim()) return ''

  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) return ''

    // Race the Gemini call with a 5-second timeout to prevent blocking
    const summaryPromise = (async () => {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are Aether's core cognitive engine. Synthesize a beautiful, completely natural 2-sentence summary of this raw input. Do not include titles, labels, or formatting text. Return your output strictly as a valid JSON object with a single key: {"summary": "..."}

Raw input:
${rawText.slice(0, 1500)}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.4, maxOutputTokens: 200 },
      })

      const responseText = result.response.text().trim()

      // Try to parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*"summary"[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.summary?.trim()) return parsed.summary.trim()
        } catch {
          // JSON parse failed, try the whole response
        }
      }

      // If JSON parsing fails, try to use the raw response as the summary
      const cleaned = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^\s*\{/, '')
        .replace(/"summary"\s*:\s*"/, '')
        .replace(/"\s*\}\s*$/, '')
        .trim()

      return cleaned.slice(0, 300) || ''
    })()

    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve(''), 5000)
    })

    return await Promise.race([summaryPromise, timeoutPromise])
  } catch (err) {
    console.error('[capture] Gemini summary failed:', err instanceof Error ? err.message : 'Unknown error')
    return ''
  }
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

// ─── POST /api/capture ──────────────────────────────────────────────
// The universal data-packaging and ingestion pipeline.
// Accepts multipart FormData with any combination of:
//   - text: string (raw text note)
//   - audio: File (voice recording blob)
//   - image: File (image file)
//   - url: string (web URL)
//   - type: string (optional override: 'text'|'voice'|'link'|'image')
export async function POST(req: NextRequest) {
  try {
    // ── STEP 1: Parse the incoming FormData ──────────────────────────
    const formData = await req.formData()

    const textInput = (formData.get('text') as string) || ''
    const urlInput = (formData.get('url') as string) || ''
    const typeOverride = (formData.get('type') as string) || ''
    const audioFile = formData.get('audio') as File | null
    const imageFile = formData.get('image') as File | null

    // Build base URL for server-side fetch calls
    const baseUrl = new URL(req.url).origin

    // Validate: at least one payload must exist
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
    let userId = 'local'
    let supabaseSession: { user: { id: string } } | null = null
    let useSupabase = false

    try {
      const supabase = await getSupabaseServer()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!authError && user) {
        userId = user.id
        supabaseSession = { user }
        // Verify that the memories table exists and is accessible
        const { error: tableCheck } = await supabase
          .from('memories')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
        useSupabase = !tableCheck
      }
    } catch {
      // No Supabase session — use local/Prisma path
    }

    // ── STEP 3: Dynamic input dispatching ────────────────────────────

    // 3a: Transcribe audio if present
    let audioTranscript = ''
    if (hasAudio && audioFile) {
      audioTranscript = await transcribeAudio(audioFile)
    }

    // 3b: Upload image if present
    let imageUrl: string | null = null
    let imagePreviewUrl: string | null = null
    if (hasImage && imageFile) {
      // Try Supabase storage first
      if (useSupabase && supabaseSession) {
        imageUrl = await uploadImageToStorage(imageFile, supabaseSession.user.id)
      }

      // If no Supabase storage URL, create a data URL preview
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
      // If there's also text input, append it
      if (hasText && textInput.trim()) {
        rawContent = `${textInput.trim()}\n\n${audioTranscript.trim()}`
      }
    } else if (hasText) {
      rawContent = textInput.trim()
    }

    // If it's a URL type, set the source URL
    const sourceUrl = hasUrl ? urlInput.trim() : memoryType === 'link' ? textInput.trim() : null

    // If it's an image with no text, create a placeholder
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

    // ── STEP 4: Cognitive synthesis — Gemini Flash summary ──────────
    const textForSummary = rawContent || (hasUrl ? urlInput : '')
    let cleanedSummary: string | null = null

    if (textForSummary.trim()) {
      const summary = await generateCognitiveSummary(textForSummary)
      if (summary) cleanedSummary = summary
    }

    // ── STEP 5: Auto-generate tags ───────────────────────────────────
    const tags = autoGenerateTags(rawContent, title)

    // ── STEP 6: Database ingestion ───────────────────────────────────
    let memory: Record<string, unknown>

    // 6a: Try Supabase insertion (authenticated user with tables)
    if (useSupabase && supabaseSession) {
      try {
        const supabase = await getSupabaseServer()
        const insertData: Record<string, unknown> = {
          user_id: supabaseSession.user.id,
          type: memoryType,
          title,
          content: rawContent,
          source_url: sourceUrl || null,
          tags: tags.join(','),
        }

        if (cleanedSummary) insertData.summary = cleanedSummary
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

        // ── Fire-and-forget background AI processing ──────────────────
        // Tags already generated locally, but trigger AI tagging for richer results
        if (rawContent.trim() && rawContent.split(/\s+/).length >= 20) {
          fetch(`${baseUrl}/api/auto-tag`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: `${title} ${rawContent}`.slice(0, 1000) }),
          })
            .then(async (res) => {
              if (!res.ok) return
              const { tags: aiTags } = await res.json()
              if (aiTags?.length) {
                const mergedTags = [...new Set([...tags, ...aiTags])].slice(0, 5)
                const supabase2 = await getSupabaseServer()
                await supabase2.from('memories').update({ tags: mergedTags.join(',') }).eq('id', memory.id)
              }
            })
            .catch(() => {})
        }

        // Generate embedding for semantic search
        if (rawContent.trim()) {
          fetch(`${baseUrl}/api/generate-embedding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memoryId: memory.id, content: rawContent.slice(0, 2000) }),
          }).catch(() => {})
        }

        // Read link content if it's a URL
        if (sourceUrl?.trim()) {
          fetch(`${baseUrl}/api/ai/read-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: sourceUrl }),
          }).catch(() => {})
        }

        // ── RETURN SUCCESS ─────────────────────────────────────────────
        return NextResponse.json({ success: true, memory })
      } catch (err) {
        console.error('[capture] Supabase insertion failed, falling back to Prisma:', err instanceof Error ? err.message : 'Unknown error')
        // Fall through to Prisma
      }
    }

    // 6b: Fallback — Prisma SQLite insertion
    try {
      const db = await getPrisma()

      const prismaMemory = await db.memory.create({
        data: {
          type: memoryType,
          title,
          content: rawContent,
          summary: cleanedSummary,
          sourceUrl: sourceUrl || null,
          tags: tags.join(','),
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

      // ── Fire-and-forget background AI processing (Prisma path) ─────
      if (rawContent.trim() && rawContent.split(/\s+/).length >= 20) {
        fetch(`${baseUrl}/api/auto-tag`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `${title} ${rawContent}`.slice(0, 1000) }),
        })
          .then(async (res) => {
            if (!res.ok) return
            const { tags: aiTags } = await res.json()
            if (aiTags?.length) {
              const mergedTags = [...new Set([...tags, ...aiTags])].slice(0, 5)
              await db.memory.update({
                where: { id: prismaMemory.id },
                data: { tags: mergedTags.join(',') },
              })
            }
          })
          .catch(() => {})
      }

      // Generate embedding for semantic search
      if (rawContent.trim()) {
        fetch(`${baseUrl}/api/generate-embedding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memoryId: prismaMemory.id, content: rawContent.slice(0, 2000) }),
        }).catch(() => {})
      }

      // Read link content if it's a URL
      if (sourceUrl?.trim()) {
        fetch(`${baseUrl}/api/ai/read-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: sourceUrl }),
        }).catch(() => {})
      }

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

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/memories - List all memories
export async function GET() {
  try {
    const memories = await db.memory.findMany({
      orderBy: { createdAt: 'desc' },
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

    const result = memories.map((m) => ({
      id: m.id,
      type: m.type,
      title: m.title,
      content: m.content,
      summary: m.summary,
      tags: m.tags ? m.tags.split(',').filter(Boolean) : [],
      sourceUrl: m.sourceUrl,
      fileUrl: m.fileUrl,
      imagePreview: m.imagePreview,
      isFavorite: m.isFavorite,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      collections: m.collections.map((mc) => ({
        id: mc.collection.id,
        name: mc.collection.name,
        color: mc.collection.color,
        icon: mc.collection.icon,
      })),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch memories:', error)
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 })
  }
}

// POST /api/memories - Create a new memory
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, title, content, sourceUrl, tags, collectionIds } = body

    if (!content?.trim() && !sourceUrl?.trim()) {
      return NextResponse.json({ error: 'Content or URL is required' }, { status: 400 })
    }

    const memory = await db.memory.create({
      data: {
        type: type || 'text',
        title: title || '',
        content: content || '',
        sourceUrl: sourceUrl || null,
        tags: tags ? tags.join(',') : '',
        collections: collectionIds?.length
          ? {
              create: collectionIds.map((cid: string) => ({
                collectionId: cid,
              })),
            }
          : undefined,
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

    return NextResponse.json(
      {
        id: memory.id,
        type: memory.type,
        title: memory.title,
        content: memory.content,
        summary: memory.summary,
        tags: memory.tags ? memory.tags.split(',').filter(Boolean) : [],
        sourceUrl: memory.sourceUrl,
        fileUrl: memory.fileUrl,
        imagePreview: memory.imagePreview,
        isFavorite: memory.isFavorite,
        createdAt: memory.createdAt.toISOString(),
        updatedAt: memory.updatedAt.toISOString(),
        collections: memory.collections.map((mc) => ({
          id: mc.collection.id,
          name: mc.collection.name,
          color: mc.collection.color,
          icon: mc.collection.icon,
        })),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create memory:', error)
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 })
  }
}

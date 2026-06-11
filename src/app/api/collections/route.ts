import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/collections - List all collections
export async function GET() {
  try {
    const collections = await db.collection.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { memories: true } },
      },
    })

    const result = collections.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      createdAt: c.createdAt.toISOString(),
      memoryCount: c._count.memories,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch collections:', error)
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
  }
}

// POST /api/collections - Create a new collection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, color, icon } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const collection = await db.collection.create({
      data: {
        name: name.trim(),
        color: color || '#6D597A',
        icon: icon || '📁',
      },
    })

    return NextResponse.json({
      id: collection.id,
      name: collection.name,
      icon: collection.icon,
      color: collection.color,
      createdAt: collection.createdAt.toISOString(),
      memoryCount: 0,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create collection:', error)
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
  }
}

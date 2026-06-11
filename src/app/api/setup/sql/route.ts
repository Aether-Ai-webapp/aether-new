import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// GET /api/setup/sql - Return the Supabase setup SQL
export async function GET() {
  try {
    const sqlPath = join(process.cwd(), 'supabase-schema.sql')
    const sql = readFileSync(sqlPath, 'utf-8')
    return NextResponse.json({ sql })
  } catch {
    return NextResponse.json({ error: 'SQL file not found' }, { status: 404 })
  }
}

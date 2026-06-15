import { NextResponse } from 'next/server'

// POST /api/auth/logout - Sign out
export async function POST() {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
      // Supabase not configured — just return success
      return NextResponse.json({ success: true })
    }

    // Supabase is configured — sign out from Supabase
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ success: true })
  }
}

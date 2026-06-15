import { NextResponse } from 'next/server'

// GET /api/auth/session - Get current auth session
export async function GET() {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
      // Supabase not configured — return local user session
      return NextResponse.json({
        user: {
          id: 'local',
          email: '',
          name: 'Aether User',
          avatarUrl: null,
        },
        authenticated: true,
      })
    }

    // Supabase is configured — check real session
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ user: null, authenticated: false })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || '',
        avatarUrl: user.user_metadata?.avatar_url || null,
      },
      authenticated: true,
    })
  } catch (error) {
    console.error('Session error:', error)
    // Even on error, return local user so the app doesn't break
    return NextResponse.json({
      user: {
        id: 'local',
        email: '',
        name: 'Aether User',
        avatarUrl: null,
      },
      authenticated: true,
    })
  }
}

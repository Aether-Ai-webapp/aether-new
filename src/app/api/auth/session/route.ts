import { NextResponse } from 'next/server'

// GET /api/auth/session - Get current auth session
export async function GET() {
  try {
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
    return NextResponse.json({ user: null, authenticated: false })
  }
}

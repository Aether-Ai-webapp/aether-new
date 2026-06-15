import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/login - Sign in with email and password
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
      // Supabase not configured — return a local user for development
      return NextResponse.json({
        user: {
          id: 'local',
          email: email,
          user_metadata: { name: email.split('@')[0] },
        },
        session: { access_token: 'local-dev-token' },
      })
    }

    // Supabase is configured — use real auth
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 })
  }
}

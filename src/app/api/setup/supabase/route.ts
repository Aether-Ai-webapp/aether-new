import { NextRequest, NextResponse } from 'next/server'

// ═══════════════════════════════════════════════════════════════════════
// ─── SUPABASE RLS UNLOCK — The Permission Slip Generator ────────────
// This route provides the exact SQL commands to unlock Supabase RLS
// and applies them automatically if the service role key is available.
// ═══════════════════════════════════════════════════════════════════════

const RLS_UNLOCK_SQL = `
-- ═══════════════════════════════════════════════════════════════════
-- AETHER: SUPABASE RLS UNLOCK — THE PERMISSION SLIP
-- Run this in your Supabase SQL Editor to allow authenticated users
-- to SELECT, INSERT, UPDATE, and DELETE their own data.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Enable RLS on all tables (safety net)
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW Level SECURITY;
ALTER TABLE memory_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. MEMORIES TABLE — Full CRUD for authenticated users (own data only)
CREATE POLICY "Users can view own memories" ON memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" ON memories
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" ON memories
  FOR DELETE USING (auth.uid() = user_id);

-- 3. COLLECTIONS TABLE — Full CRUD for authenticated users (own data only)
CREATE POLICY "Users can view own collections" ON collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON collections
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- 4. MEMORY_COLLECTIONS — Junction table policies
CREATE POLICY "Users can view own memory_collections" ON memory_collections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memories WHERE memories.id = memory_collections.memory_id AND memories.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own memory_collections" ON memory_collections
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memories WHERE memories.id = memory_collections.memory_id AND memories.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own memory_collections" ON memory_collections
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memories WHERE memories.id = memory_collections.memory_id AND memories.user_id = auth.uid())
  );

-- 5. PROFILES TABLE — Users can view/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. STORAGE BUCKET — Allow authenticated users to upload images
INSERT INTO storage.buckets (id, name, public) VALUES ('memories', 'memories', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'memories');

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);
`

// GET /api/setup/supabase — Check if Supabase tables exist and RLS is configured
export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({
        connected: false,
        authenticated: false,
        tablesExist: false,
        error: 'Not authenticated',
      })
    }

    const { error: memoriesError } = await supabase
      .from('memories')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    const { error: collectionsError } = await supabase
      .from('collections')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    const tablesExist = !memoriesError && !collectionsError

    return NextResponse.json({
      connected: true,
      authenticated: true,
      tablesExist,
      userId: user.id,
      errors: {
        memories: memoriesError?.message || null,
        collections: collectionsError?.message || null,
      },
    })
  } catch (error) {
    console.error('Supabase setup check failed:', error)
    return NextResponse.json({
      connected: false,
      authenticated: false,
      tablesExist: false,
      error: 'Failed to check Supabase setup',
    })
  }
}

// POST /api/setup/supabase — Apply RLS policies using admin/service role
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const mode = body.mode || 'get-sql'

    // If mode is 'get-sql', just return the SQL for the user to run manually
    if (mode === 'get-sql') {
      return NextResponse.json({
        success: true,
        message: 'Copy the SQL below and run it in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)',
        sql: RLS_UNLOCK_SQL.trim(),
        steps: [
          '1. Go to https://supabase.com/dashboard',
          '2. Select your project',
          '3. Click "SQL Editor" in the left sidebar',
          '4. Click "New Query"',
          '5. Paste the SQL from the response',
          '6. Click "Run"',
          '7. Your vault is now unlocked — saves will work!',
        ],
      })
    }

    // If mode is 'auto-apply', try to apply using the admin client
    if (mode === 'auto-apply') {
      try {
        const { createClient } = await import('@/lib/supabase/admin')
        const supabaseAdmin = await createClient()

        if (!supabaseAdmin) {
          return NextResponse.json({
            success: false,
            error: 'Admin client not available. Use get-sql mode and run the SQL manually.',
            sql: RLS_UNLOCK_SQL.trim(),
          })
        }

        // Split SQL into individual statements and execute
        const statements = RLS_UNLOCK_SQL
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith('--'))

        const results: { statement: string; success: boolean; error?: string }[] = []

        for (const statement of statements) {
          try {
            const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement })
            results.push({ statement: statement.slice(0, 60) + '...', success: !error, error: error?.message })
          } catch (err) {
            results.push({
              statement: statement.slice(0, 60) + '...',
              success: false,
              error: err instanceof Error ? err.message : 'Unknown error',
            })
          }
        }

        const allSucceeded = results.every((r) => r.success)

        return NextResponse.json({
          success: allSucceeded,
          message: allSucceeded
            ? 'RLS policies applied successfully! Your vault is unlocked.'
            : 'Some policies failed. Run the SQL manually in Supabase Dashboard.',
          results,
          sql: RLS_UNLOCK_SQL.trim(),
        })
      } catch (err) {
        return NextResponse.json({
          success: false,
          error: 'Admin client unavailable. Use get-sql mode.',
          sql: RLS_UNLOCK_SQL.trim(),
        })
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid mode. Use "get-sql" or "auto-apply".' })
  } catch (error) {
    console.error('Supabase setup failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process Supabase setup',
      sql: RLS_UNLOCK_SQL.trim(),
    })
  }
}

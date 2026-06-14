import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client that uses the service_role key.
 * Bypasses Row Level Security — use ONLY in trusted server-side API routes.
 * Never expose this client or the service_role key to the browser.
 */
let adminClient: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey || serviceRoleKey === 'your_supabase_service_role_key_here') {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local and re-run the Supabase schema SQL.'
    )
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}

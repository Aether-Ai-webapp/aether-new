---
Task ID: 1-7
Agent: Main Agent
Task: Phase 2 - Wiring the Supabase Backend to the Beautiful UI

Work Log:
- Read all existing project files to understand the current codebase state
- Created `supabase-schema.sql` with SQL for memories, collections, memory_collections, and profiles tables + RLS policies + auto-profile-creation trigger
- Created `/api/setup/supabase` API route to check if Supabase tables exist
- Created `/api/setup/sql` API route to return setup SQL for clipboard copy
- Updated `src/lib/aether-store.ts` with complete Supabase integration:
  - Added `supabaseReady` state to track if Supabase tables are available
  - Added `checkSupabaseTables()` to verify Supabase connectivity
  - Updated `fetchMemories()` and `fetchCollections()` to use Supabase browser client when authenticated + tables exist, falling back to Prisma API
  - Added `saveMemory()` method that inserts to Supabase directly when authenticated, falls back to Prisma API
  - Added `saveCollection()` method with same dual-path logic
  - Updated `login()`, `signup()`, `logout()`, `checkSession()` to trigger Supabase table check and re-fetch data
  - Added Supabase row mappers (`mapSupabaseMemory`, `mapSupabaseCollection`)
- Updated `/api/memories/route.ts` to try Supabase server client first when authenticated, fall back to Prisma
- Updated `/api/collections/route.ts` with same dual-path logic
- Updated `/api/ai/chat/route.ts` to fetch memories from Supabase when authenticated, falling back to Prisma
- Updated `src/components/aether/Dashboard.tsx`:
  - Added capture bar (Input + Send button) for quick text capture
  - Wired capture bar to `saveMemory()` store method
  - Auth gate: unauthenticated users see auth modal, pending action saves after auth
  - Enter key triggers save, Shift+Enter for new line
- Updated `src/components/aether/AddMemorySheet.tsx`:
  - Uses `saveMemory()` store method instead of direct API calls
  - Auth gate for unauthenticated users triggers modal + pending save
- Updated `src/components/aether/Settings.tsx`:
  - Added "Cloud Sync" section showing Supabase connection status
  - Shows "Connected to Supabase" when tables exist
  - Shows "Database tables not found" with Copy SQL + Open SQL Editor + Re-check buttons when tables don't exist
  - Added "Cloud Sync" status in About section
- Updated `src/app/page.tsx` to simplified DataLoader (fire-and-forget data fetching)
- Fixed ESLint errors (setState in effect)

Stage Summary:
- All API routes verified working: GET/POST memories, GET/POST collections, auth session, setup check, setup SQL
- Auto-tagging working: "Machine Learning Notes" got tags ["learning", "ai", "idea"]
- 6 memories exist in the local database from testing
- App renders immediately (no loading spinner), data fetches in background
- Auth modal triggers when unauthenticated users try to save
- Pending actions execute after successful auth
- Supabase SQL schema ready for user to run in dashboard
- Agent Browser crashes the dev server (sandbox resource limitation), verified via curl instead

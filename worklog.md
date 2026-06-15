---
Task ID: 1
Agent: Main Agent
Task: Build bulletproof data pipeline for Aether capture system

Work Log:
- Read all critical project files (Dashboard.tsx, aether-store.ts, api routes, Prisma schema, etc.)
- Identified root cause: image uploads sent FormData to JSON-only endpoint, causing silent failures
- Created new unified `/api/capture/route.ts` endpoint that handles all media types via multipart FormData
- Added audio transcription via z-ai-web-dev-sdk ASR with Groq Whisper fallback
- Added image storage (Supabase storage or base64 data URL fallback)
- Added Gemini Flash cognitive synthesis with 5-second timeout
- Added keyword-based auto-tagging (work, personal, task, link, recipe, etc.)
- Added Prisma database insertion as fallback when Supabase unavailable
- Added fire-and-forget background AI processing (tagging, embedding, link reading)
- Rewrote Dashboard.tsx event handlers to use new `/api/capture` endpoint
- Implemented `executeCapture()` as the core pipeline function
- Added optimistic UI state mutation: `addMemory(newMemory)` on success
- Removed auth gate from capture flow — unauthenticated users can save locally via Prisma
- Added `imageUrl` field to Prisma schema and pushed to database
- Updated `/api/memories` route to include `imageUrl` in responses
- Fixed background fetch URLs to use absolute paths with `baseUrl`

Stage Summary:
- All 4 pipeline tests PASSED:
  1. Text capture saves with auto-tags (e.g., "recipe", "task")
  2. URL capture saves as type "link" with correct tags
  3. New memories appear immediately in the feed
  4. Auto-tagging engine works correctly
- Desktop landing page renders correctly with heading, pricing, features, login form
- Backend API returns proper `{ success: true, memory: {...} }` format
- Prisma SQLite fallback works for unauthenticated users

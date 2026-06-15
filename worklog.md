---
Task ID: 1
Agent: Lead Engineer
Task: Complete rewrite of capture route and Dashboard component

Work Log:
- Read all existing files: capture route (772 lines), Dashboard (866 lines), aether-store, supabase clients, gemini lib, ASR lib
- Identified key issues: Supabase-first insertion with RLS, Prisma fallback for non-Supabase environments, enhanced cognitive prompt, autonomous collection clustering via Supabase queries
- Completely rewrote src/app/api/capture/route.ts (~865 lines):
  - Supabase-first authentication with graceful Prisma fallback
  - 3-tier cognitive synthesis (z-ai → Gemini Flash → keyword fallback)
  - Elite system prompt producing JSON {summary, deep_insight, tags}
  - Supabase-native autonomous collection clustering (match + 10-memory sweep rule)
  - Image upload to Supabase Storage with base64 fallback
  - Audio transcription via z-ai ASR + Groq Whisper fallback
  - Added DELETE endpoint with Supabase + Prisma dual-path deletion
  - Junction table cleanup before memory deletion
- Completely rewrote src/components/aether/Dashboard.tsx (~450 lines):
  - Instant optimistic UI: addMemory(data.memory) on capture success
  - Full inspection drawer (Framer Motion slide from right):
    1. AI Summary (2-sentence, purple accent)
    2. Raw original content / image display
    3. Deep cognitive insight (amber accent)
    4. Tags and collections display
    5. Export .md download button
    6. Purge Memory button with confirmation dialog
  - Purge calls DELETE /api/capture?id=X then removes from UI array
  - Voice recording with z-ai ASR pipeline
  - Image upload with preview pill
  - Glass capsule capture bar with purple focus glow
- Verified: Lint passes clean
- Verified: POST /api/capture returns {success: true, memory: {...}} with full cognitive synthesis
- Verified: DELETE /api/capture?id=X returns {success: true}
- Verified: Landing page renders with all 3 sections

Stage Summary:
- Both files fully rewritten with production-ready code
- Backend supports Supabase (with RLS) and Prisma (local fallback)
- Cognitive synthesis generates summary + deep_insight + tags via 3-tier AI pipeline
- Autonomous collection clustering uses Supabase queries exclusively
- Dashboard has full inspection drawer with download, purge, and confirmation
- All API endpoints tested and working

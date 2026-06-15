---
Task ID: 2
Agent: Main Agent
Task: Build Universal Capture Engine + AI Synthesis + Auto-Collections + Inspection Drawer

Work Log:
- Added `deepInsight` field to Prisma schema and pushed to database
- Updated Memory interface in aether-store.ts with `deepInsight` field
- Updated SupabaseMemoryRow interface and mapSupabaseMemory mapper with `deep_insight` / `deepInsight`
- Updated /api/memories route GET and POST responses to include `deepInsight`
- Rewrote /api/capture/route.ts with:
  - Universal Payload Scanner: classifies text/URL/audio/image from FormData
  - Cognitive Synthesis Engine: Gemini 1.5 Flash with premium prompt producing {summary, deep_insight, tags}
  - Autonomous Collections Engine:
    - Rule 1 (Manual Match): matches memory tags to existing collection names via Levenshtein similarity
    - Rule 2 (Auto-10): counts uncollected memories by tag, auto-creates collection when 10+ share same tag
  - Expanded keyword tag map (added health, music, car categories)
  - 8-second timeout on Gemini synthesis to prevent blocking
- Rewrote Dashboard.tsx with:
  - Optimistic UI re-render on capture (addMemory)
  - Full Inspection Drawer with Framer Motion slide-out:
    1. AI Summary section (purple Sparkles icon)
    2. Original content / image / URL display
    3. Deep Cognitive Insight section (amber Eye icon)
    4. Tags and collections display
    5. Download button (exports as markdown file)
    6. Purge button (DELETE + UI removal)
  - Voice recording sends audio blob directly to /api/capture
  - Summary preview in memory feed cards

Stage Summary:
- All 5 pipeline tests PASSED:
  1. Text capture with auto-tags (work, design, ai)
  2. URL capture as link type
  3. deepInsight field present in API responses
  4. Corvette/car auto-tagging (car, task)
  5. Memories feed shows latest captures
- Desktop landing page renders correctly with "Your mind, entirely unified." heading
- Auto-collections engine fires in background after each capture
- Download exports clean markdown with title, summary, insight, content
- Purge deletes from DB and removes from UI state

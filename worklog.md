---
Task ID: 2
Agent: Main Agent
Task: Make AI perfect — auto-tag, AI summary, link reader, related memories, friendly chat, PDF export, memory detail modal

Work Log:
- Enhanced auto-tag API: changed from 1-2 tags to 3-5 tags
- Created `/api/memories/related/[id]` — semantic similarity search via pgvector, falls back to keyword matching
- Created `/api/ai/read-link` — reads URL content using z-ai-web-dev-sdk, falls back to fetch + HTML extraction
- Added `backgroundAutoSummary` to store — calls `/api/ai/summary` after save, persists summary to Supabase/Prisma
- Added `backgroundReadLink` to store — when URL saved, reads link content, enriches the memory, then tags + summarizes + embeds it
- Wired both new actions into the `saveMemory` flow (both Supabase and Prisma paths)
- Enhanced chat system prompt — warmer, friendlier personality with excitement for connections
- Rewrote MemoryDetailModal — now shows: AI Summary (with Generate button), Tags, Related Memories (fetched from API), Original Content, Source URL, PDF export, Delete
- Added PDF export to Settings — "Export PDF" button generates a clean, professional print-ready document
- Lint: clean
- Browser verification: modal renders correctly, AI summary Generate works, PDF button present, no errors

Stage Summary:
- Full AI pipeline: save → auto-tag (3-5 tags) → AI summary → link reader (if URL) → embedding for semantic search
- Memory detail modal: AI Summary + Tags + Related Memories + Original + Source + PDF export
- Related memories: semantic search via pgvector, keyword fallback
- Link reader: reads URL content, enriches memory, auto-tags and summarizes
- PDF export: clean professional document with purple accents
- Chat: warm, friendly, enthusiastic personality

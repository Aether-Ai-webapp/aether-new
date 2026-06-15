---
Task ID: 1
Agent: Main Agent
Task: Fix auto-tagging, AI insights, image understanding, and AI Brain connections

Work Log:
- Read and analyzed the full capture API route, page.tsx, store, and Prisma schema
- Identified root cause: Gemini API key not configured, so synthesizeWithGemini() always returned null → no AI tags, no AI summary, no deep insight for ANY capture type
- Identified that images weren't analyzed by VLM → no image understanding, no tags from image content
- Identified no mechanism for finding connections between memories

- Rewrote /api/capture/route.ts:
  - Replaced synthesizeWithGemini with synthesizeWithLLM using z-ai-web-dev-sdk (always available)
  - Added analyzeImageWithVLM using z-ai-web-dev-sdk VLM for image understanding
  - Image captures now get: VLM description, extracted text (OCR), detected objects, auto-tags
  - All captures now get: AI-generated title, 2-sentence summary, deep insight, 3-6 tags, connected themes
  - Added findConnectedMemories() function for tag-based + content-based connection finding
  - API response now includes connectedMemories and connectedThemes fields
  - Gemini fallback still works if API key is configured

- Created /api/brain/route.ts:
  - GET endpoint that computes connections between all memories
  - Tag-based connection engine (instant, no LLM needed)
  - Content word-overlap connection engine
  - Cluster detection based on shared tags
  - LLM-powered deep cluster analysis (finds non-obvious thematic connections)
  - Short ID to full ID mapping for LLM responses
  - Returns connections, clusters, and relatedMemories for a specific memory

- Updated /app/page.tsx:
  - Added AI Brain button in header (amber-colored, with loading state)
  - Added AI Brain panel showing connection clusters with clickable memories
  - Added Connected Memories section in the inspection drawer
  - Connected memories show connection reason (shared tags, related concepts)
  - Enhanced AI Synthesis suggestion box: shows summary, tags (with Hash icons), and deep insight preview
  - Tags on memory cards now show up to 4 with Hash icons and +N indicator
  - Toast messages updated to indicate AI processing
  - Empty clusters are filtered out in the AI Brain panel

Stage Summary:
- Auto-tagging now works for ALL capture types (text, voice, URL, image) via z-ai-web-dev-sdk LLM
- AI insights (summary + deep insight) now generated for all captures
- Images are analyzed by VLM: description, OCR text, objects detected, auto-tags generated
- AI Brain finds connections between memories based on shared tags and content similarity
- AI Brain clusters memories thematically using both tag analysis and LLM deep analysis
- Browser verified: text capture, URL capture, AI Brain, drawer with connected memories all work
- Lint passes, dev server runs without errors

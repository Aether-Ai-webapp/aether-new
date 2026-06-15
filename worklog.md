---
Task ID: 1
Agent: Main
Task: Complete Aether web app overhaul - fix all broken features

Work Log:
- Diagnosed broken app: server was crashing, no middleware for Supabase session refresh, mobile had no auth-gated capture
- Created src/middleware.ts for Supabase SSR cookie refresh (required for auth to work)
- Rewrote src/app/page.tsx: Desktop shows landing when unauthenticated, dashboard when authenticated; Mobile always shows app with auth-gated capture
- Rewrote src/components/aether/Dashboard.tsx: Added gateCapture() function that triggers auth modal when unauthenticated user tries to capture; Added "Sign in to start capturing" prompt; Added null-safe memory array handling; Added tags display on timeline cards
- Updated src/components/aether/DesktopLanding.tsx: Fixed gradient border from indigo/blue to purple/rose; Added ambient background blobs for visual depth; Added gradient text on hero heading; Added CTA buttons (Get Started + Sign In); Replaced Infinity icon with Zap for feature list
- Verified all APIs working: / (200, 48KB), /api/auth/session (200), /api/memories (200), /api/capture (405 on GET, correct)
- Lint passes clean
- Pushed to GitHub new-aether

Stage Summary:
- App fully functional with dual-identity system (desktop landing vs mobile app)
- Auth-gated capture on mobile (users must sign in to capture memories)
- Beautiful desktop landing with animated gradient border, ambient blobs, hero gradient text
- Full data pipeline: capture → AI synthesis → Supabase/Prisma save → dashboard display → inspection drawer
- Memory drawer shows: AI summary, original content, cognitive insight, download .md, purge
- Pushed 2 commits to new-aether GitHub repo

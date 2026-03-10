# LOUIS_BUILD_LOG.md
_Built by Louis — IB Resume Coach, 2026-03-08 (second pass)_

---

## Project Location
```
/Users/landonprojects/louis-ib-coach/ib-recruiting-os/
```
This is a fork of `IB_recruiting_os`, renamed and iterated to a production-ready public website.

---

## How to Run Locally
```bash
cd /Users/landonprojects/louis-ib-coach/ib-recruiting-os
export PATH="/opt/homebrew/Cellar/node@22/22.22.0_1/bin:$PATH"
npm run dev
```
Open http://localhost:3000 — lands on the marketing page.
Upload a resume → parses → redirects to `/app` with full coaching session.

**Environment:** `ANTHROPIC_API_KEY` already set in `.env.local`

**Build verified:** `npm run build` passes, 0 errors, 0 type errors.

---

## Route Map

| Route | Type | What it does |
|-------|------|-------------|
| `/` | Static | Public landing page — marketing, drag-and-drop upload |
| `/app` | Client | Full coaching app — chat, resume panel, scoring, sidebar |
| `/api/chat` | Dynamic (SSE) | Streaming Anthropic chat with IB system prompt |
| `/api/parse-resume` | Dynamic | PDF/DOCX text + HTML extraction |
| `/api/suggest` | Dynamic (SSE) | Per-bullet rewrite suggestions (2-phase: question + generate) |

---

## What Was Built (Second Pass)

### Architecture fixes
- **Layout separation**: Root layout is now scrollable-friendly. `/app` has its own `layout.tsx` that locks to `fixed inset-0 overflow-hidden` — landing page scrolls freely, app is fixed viewport. Previously `globals.css` forced `overflow: hidden` on all routes.
- **`scheduleSave` rewrite**: The original nested-setState approach for session persistence was broken. Replaced with a clean `useEffect` that watches all relevant state values with a 500ms debounce — the correct pattern.
- **UploadOverlay branding**: Updated from "IB Recruiting OS" to "IB Resume Coach — Brutally honest. Built for banking."

### System prompt additions
Two new structured output blocks added (with properly escaped backticks inside the template literal):
- **`story-output`**: `{ whyIB, thread, crystallizingMoment }` — emitted when story is genuinely developed
- **`networking-actions`**: `{ actions[], template }` — emitted when concrete networking steps are surfaced

### New file: `src/lib/sessionLog.ts`
Lightweight event logger to sessionStorage. Tracks: `session_start`, `session_restored`, `mode_shift`, `profile_updated`, `score_updated`, `bullets_applied`, `bullet_applied_manual`, `stream_error`, `intake_submitted`, `session_reset`. Cap at 500 events. `summarizeSession()` produces a structured summary for the export JSON.

### ActionSidebar — full rebuild
Previous version had a flat list of buttons. New version:
- **Score gauge** with label (Strong / Solid / Developing / Needs Work)
- **Guided Outcomes panel**: top 3 issues from score with checkbox tracking (persisted to localStorage). Clicking an unchecked issue triggers "Let's work on improving: X" in chat. Completed issues show struck-through with green dot.
- **Session Progress panel**: 3 readiness items (Resume scored / Story developed / Networking plan) with live detection. Shows overall readiness label.
- **Tools section**: Score Resume, Weak Verb Scan, Develop Story, Cover Letter, Networking Plan, Share Score (with toast), Export Pack, New Session.
- All buttons extracted into a `ToolButton` sub-component. `ReadinessItem` sub-component for the progress tracker.

### ExportModal — rebuilt
Previous version used heuristic keyword-search over raw message content. New version:
- Uses the typed protocol parsers (`parseBlock`, `parseAllBlocks` from protocolParser)
- Story export uses `story-output` structured blocks — only available once Claude actually emits one
- Networking export uses `networking-actions` structured blocks — merges all action lists across the session
- Session JSON export includes `summarizeSession()` data (mode shifts, score history, bullets applied, duration)
- All four items show proper "Not ready" state with helpful hints explaining what to do to unlock them

### `src/lib/protocolParser.ts` — additions
Added `parseStoryOutput()` and `parseNetworkingActions()` typed convenience wrappers.

---

## What the App Does End-to-End

1. **Landing (`/`)**: Candidate drops resume (PDF/DOCX). Parsed client-side via `/api/parse-resume`. Text + file stashed to sessionStorage. Redirected to `/app`.

2. **Intake (`/app`, showIntakeForm=true)**: 3-question form — stage, bank tier, group. Submitted profile seeds the first Claude call with `isFirstMessage: true`.

3. **Coaching loop**: Claude reads resume + profile, opens in Diagnostic mode. Drives the conversation with one question at a time. Emits `profile-update`, `resume-score`, `resume-update`, `story-output`, `networking-actions`, `cover-letter`, and `feasibility-score` protocol blocks as the session progresses.

4. **Resume panel**: Appears when editing mode activates or any bullet edit is applied. Shows live-edited resume text with clickable bullets (opens BulletModal for 2-phase rewrites via `/api/suggest`).

5. **Sidebar**: Shows live score gauge, guided outcomes with completion tracking, session progress readiness, and tool shortcuts.

6. **Session persistence**: All state auto-saved to localStorage every 500ms. Survives refresh. "New Session" wipes it.

7. **Export**: Export Pack modal downloads resume, story, networking plan, and full session JSON when those artifacts exist.

---

## Decisions Made

- **sessionStorage for landing→app hand-off, localStorage for persistence**: Clean separation. sessionStorage clears when tab closes; localStorage survives indefinitely.
- **Protocol-block-first extraction in ExportModal**: Heuristic keyword search is unreliable. Structured blocks from Claude are the ground truth. Story and networking exports now only appear when Claude has actually emitted the relevant protocol block.
- **Guided outcomes via checkbox, not auto-detection**: Simpler, more reliable, gives candidate agency. Clicking an issue triggers the chat action automatically.
- **Readiness signal is detection-based, not score-based**: Tracks what's actually been done (scored, story developed, networking plan generated) rather than just the score number, which is more meaningful.
- **`story-output` and `networking-actions` prompt additions**: Without structured output from the model, the export modal can't reliably extract content. The system prompt now explicitly tells Claude when and how to emit these blocks.

---

## Recommended Next Steps (v2)

1. **Vercel deploy**: Project is Vercel-ready. Set `ANTHROPIC_API_KEY` in Vercel dashboard, deploy from `ib-recruiting-os/` subdirectory.

2. **Bank culture section**: Landon fills in domain knowledge on GS/JPM/Evercore/Centerview/etc. in the system prompt. This is the actual moat — nobody can replicate firsthand knowledge of what each bank looks for.

3. **Auth + Supabase**: Save sessions server-side so users can return across devices. Add a "Save my progress" CTA that prompts email signup.

4. **Score history chart**: Show score progression over time within a session (score at start vs. current). Needs score history from the event log.

5. **Mobile layout for `/app`**: Currently desktop-only split pane. Mobile needs tab-based navigation between Resume, Chat, and Score views.

6. **OG image for share**: Vercel `/api/og` route to generate a real score card image for social sharing instead of clipboard text.

7. **Bullet safety validator**: Backend check before returning bullet suggestions — flag implausible claims for stated role/level.

8. **Feasibility Score UI**: The `feasibility-score` protocol block is emitted but has no dedicated display component. Add a `FeasibilityCard` similar to `ScoreCard`.

9. **Segment-specific onboarding**: Pre-fill intake form and open with different first messages for non-target vs career-switcher vs target-school junior. Currently all candidates get the same opener.

---

_Build verified: `npm run build` passes 0 errors, 0 type errors._  
_9 pages/routes generated, all healthy._

---

## Third Pass — Beta Gate + Three UI Themes (2026-03-08, Codex)

### Beta Gate
- `src/middleware.ts` — intercepts `/app/*` and `/api/chat|parse-resume|suggest`. If `BETA_PASSWORD` env var is set, requires a matching cookie. API calls without token get 401. Page requests redirect to `/?gate=1`.
- `src/app/api/beta-auth/route.ts` — lightweight password verify endpoint. Returns `{ok: true/false}`. No-ops if `BETA_PASSWORD` not configured (gate disabled by default).
- Landing page shows a modal when `?gate=1` is in the URL. Sets `ib_coach_beta` cookie (30 days) on success.
- To enable: add `BETA_PASSWORD=yourcode` to `.env.local` or Vercel dashboard.

### Shared Session Hook
- `src/hooks/useCoachSession.ts` — all coaching state and logic extracted from the app page into a reusable hook. All three themes consume this. Zero logic duplication. Includes restore, save, stream, upload, intake, action, bullet apply, score/profile/update parsing, and event logging.

### UI Version Config
- `src/lib/uiConfig.ts` — `getUIVersion()` reads `NEXT_PUBLIC_UI_VERSION` env var, falls back to `?ui=` URL param, defaults to `"a"`.
- Switch themes without rebuild: append `?ui=b` or `?ui=c` to `/app`.
- Set permanently: `NEXT_PUBLIC_UI_VERSION=b` in `.env.local`.
- Dev switcher: floating A/B/C pill visible in development at bottom of screen.

### Theme A — "The Operator" (`src/themes/ThemeA.tsx`)
The refined baseline. Dark stone-950, amber accent. Chat-first — resume panel slides in when edits activate. Sidebar holds score, guided outcomes, readiness tracker, tool buttons. The most "product" feeling of the three.

### Theme B — "The Platform" (`src/themes/ThemeB.tsx`)
Three-column layout: resume always left, chat center, score panel always right. Light slate/white background. Resume displayed in a white card with shadow (feels like a real document). Score panel shows gauge + category breakdown + issues + strengths always. Inspired by what works in ResumeWorded — the score is always visible so candidates can see it change in real time. Light mode appeals to candidates who find dark UIs "hacker-y" and want something that feels like a real professional tool.

### Theme C — "The Terminal" (`src/themes/ThemeC.tsx`)
Near-black (#0c0c0c), monospace throughout, green (#00ff9d) accent. Sharp edges, no border-radius. Score as raw metrics table (not a gauge). Chat styled as terminal output with prompt characters. Resume as preformatted text with hover-to-green bullet interaction. Commands listed as `:score`, `:verbs`, `:story`, `:cover`, `:network`. Resume toggles with `:show-resume`/`:hide-resume`. Targets quant-forward candidates and CS crossovers who find polished SaaS aesthetics performative.

### Route Map (Updated)
| Route | What it does |
|-------|-------------|
| `/` | Landing page — marketing + upload |
| `/app?ui=a` | Theme A (default) |
| `/app?ui=b` | Theme B — Platform |
| `/app?ui=c` | Theme C — Terminal |
| `/api/beta-auth` | Password verify for gate |
| `/api/chat` | Streaming chat |
| `/api/parse-resume` | PDF/DOCX parsing |
| `/api/suggest` | Bullet rewrites |

All runs on Codex model (OpenAI) — zero Anthropic API calls during build.

# IB Recruiting OS — Current State

_Last updated: 2026-03-21 (post lint/smoke hardening + repo tidy)_

## Product Status
**✅ Functional and stable for active beta iteration**

Core loop works end-to-end:
1. Upload resume (PDF/DOC/DOCX)
2. Parse resume text/html
3. Intake capture
4. Streaming coaching chat
5. Click-to-rewrite bullets with confidence/risk metadata
6. Apply rewrite to resume state
7. Re-score resume
8. Export pack

---

## What is currently implemented

### Frontend experience
- Landing page with upload flow and beta gate support
- `/app` coaching workspace with 3 UI themes:
  - Theme A (operator/dark)
  - Theme B (platform/dashboard default)
  - Theme C (terminal)
- App loading state for first route load (`src/app/app/loading.tsx`)
- Chat panel quick prompts, streaming indicator, and cleaner error handling
- Resume panel with clickable bullets and rewrite modal
- Score display + history tracking

### Backend/API routes
- `POST /api/parse-resume`
  - Parses PDF + Word docs
  - Returns normalized text (+ html for docx path)
  - Handles invalid file types safely
- `POST /api/chat`
  - Streams coach responses
  - Handles disconnect/abort more gracefully
- `POST /api/suggest`
  - Question phase + rewrite generation phase
  - Structured rewrite output format (`BULLET`, `CONFIDENCE`, `RISK`)
- `POST /api/beta-auth`
  - Invite code gate logic

### State and protocol
- Session engine: `src/hooks/useCoachSession.ts`
- Protocol parsing: `src/lib/protocolParser.ts`
  - stricter resume-score + profile enum validation added
- Structured output parsing for:
  - `resume-update`
  - `resume-score`
  - `profile-update`
  - `story-output`
  - `networking-actions`

### Recent architecture cleanup completed
- Shared SSE parser added: `src/lib/sse.ts`
- Shared resume structure parser added: `src/lib/resumeStructure.ts`
- Shared coach actions/prompts config added: `src/lib/coachActions.ts`
- Theme/config warning fixed in Next config (`turbopack.root`)
- README replaced from boilerplate with project-specific doc

---

## Validation snapshot

### Build + quality gates
- `npm run build` passes cleanly.
- Lint command path has been updated for current Next.js/ESLint flow and now runs as a usable gate.
- Local smoke checks were added and verified against core routes.

### QA checks completed (latest pass)
- Chat stream checks: **5/5 pass**
- Suggest structured output checks: **5/5 pass**
- Parse invalid type check: **pass** (`400`)
- Parse non-multipart request now safely returns **`400`** (hardening patch)
- Theme routes:
  - `/app?ui=a` → `200`
  - `/app?ui=b` → `200`
  - `/app?ui=c` → `200`
- Chat first-token latency (sample):
  - min/avg/max ≈ **1.38s / 1.47s / 1.54s**

---

## Known limitations / remaining work

### P0 (before broad public rollout)
- Run full manual UX matrix across all themes:
  - bullet click/apply consistency
  - rewrite modal behavior under errors
  - export pack content completeness
- Add explicit UI surfacing for feasibility protocol block (card/component)

### P1 (quality hardening)
- Expand IB exemplar set significantly (current set remains limited)
- Add plausibility/fabrication guardrail before applying rewrites
- Improve scoring consistency/stability across repeated runs

### P2 (productization)
- Mobile tabbed layout polish for sub-768 viewport
- Better session rail/progress UX consistency across themes
- Analytics/event instrumentation for drop-off and usage insights

---

## Operational note
Current branch is on `main` and suitable for continued testing iteration. Next best step is targeted functional hardening + UX consistency pass, not a full rebuild.

Project docs were also intentionally tidied in this pass (legacy planning/changelog docs removed), with `current_state.md` retained as the canonical status snapshot.

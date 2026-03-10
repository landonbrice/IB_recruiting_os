# IB Recruiting OS — Current State

> **Status note (2026-03-10):** This file is historical context from early build stage. Current implementation state is tracked in `../LOUIS_BUILD_LOG.md` and `CHANGELOG-2026-03-10-ux-pass.md`.

_Last updated: 2026-03-04 19:06 CST_

## Project goal (assimilated)
Build an AI-powered IB recruiting coach that does more than generic resume editing:
1. Diagnoses candidate profile + recruiting context
2. Rewrites resume bullets for IB signal strength (without fabrication)
3. Develops personal story / "Why IB" narrative
4. Gives realistic feasibility + leverage guidance (networking-first)
5. Feels like an operator/co-pilot, not a passive chatbot

This can be monetized as a recruiting copilot for undergrads and career switchers targeting IB internships/full-time roles.

---

## What exists now (strong foundation)
- **Solid frontend workflow** (Next.js):
  - Upload resume → intake form → streamed coaching chat
  - Action sidebar for score + focused actions
  - Resume panel with inline bullet-click editing UX
- **State model is good**:
  - Structured `CandidateProfile`
  - Chat mode transitions (`diagnostic`, `editing`, `story`, `targeting`, `feasibility`)
  - Structured hidden protocol blocks (`resume-update`, `resume-score`, `profile-update`)
- **Prompt quality is strong** (`src/lib/systemPrompt.ts`):
  - Clear voice/stance
  - Explicit behavioral constraints
  - Explicit scoring schema
  - Networking truth baked in

Net: product direction is clear and differentiated already.

---

## Critical gaps discovered

### 1) Missing backend API routes (blocking runtime)
Frontend calls:
- `POST /api/parse-resume`
- `POST /api/chat`

But in current tree there is no `src/app/api/...` implementation present. That means app UX can render, but core functionality won’t work end-to-end without those routes.

### 2) Reliability risk from regex-only protocol parsing
Current extraction of `resume-update`, `resume-score`, `profile-update` is regex over freeform model output. This is fine for prototyping, but brittle in production (single malformed block can silently degrade behavior).

### 3) No explicit persistence/session strategy
Current state appears in-memory on client session. For a paid coaching product, you’ll likely want:
- user session identity
- saved resumes/iterations
- progress timeline (score deltas, top recurring weaknesses)

### 4) Trust & safety/product integrity not yet hardened
Prompt says “no fabrication,” but there is no explicit backend validator that checks edited bullets for plausibility/risk patterns before displaying as “approved.”

### 5) Positioning/packaging layer not yet represented in code
Product can be sold, but current app reads more as tool than program. Missing package anchors (e.g., “7-day interview-ready sprint”, “weekly checkpoint”, etc.) that convert better.

---

## Product reasoning (where this wins)
Your wedge is not just “resume scoring.” It’s:
- **Brutally honest but useful coaching**
- **Resume + narrative + targeting + feasibility in one loop**
- **Networking leverage orientation** (rare in resume tools)

If reliability is tightened and onboarding value is made obvious in first 5 minutes, this can be a paid niche product quickly.

---

## Recommended next steps (priority order)

### P0 — Make it actually production-usable
1. Implement `src/app/api/chat/route.ts` with streaming Anthropic responses.
2. Implement `src/app/api/parse-resume/route.ts` for PDF/DOCX extraction.
3. Add hard error surfacing in UI for backend failures (instead of generic fallback).

### P1 — Hardening + data integrity
4. Add protocol block validation utility:
   - strict JSON parse + schema checks
   - tolerate malformed model output gracefully
5. Add bullet safety checks (basic plausibility guardrails).
6. Add simple event logging (mode shifts, score changes, applied edits).

### P2 — Monetization readiness
7. Create a “guided outcomes” layer:
   - session objective
   - top 3 fixes
   - done criteria before mock interviews
8. Add export pack:
   - final resume
   - why-IB story draft
   - networking action list (next 7 days)

### P3 — Growth loop
9. Add before/after score delta snapshot share card.
10. Add candidate segment-specific onboarding templates (non-target, career switcher, etc.).

---

## Immediate tactical plan (next work session)
- Build missing API routes first (chat + parse-resume)
- Run one end-to-end pass with a real resume file
- Fix parser edge cases found in that pass
- Then tune onboarding copy for clearer paid value proposition

---

## Definition of "ready for paid beta"
- End-to-end flow works without manual intervention
- Resume scoring + bullet updates are stable across 10+ test resumes
- Output quality feels materially better than generic ChatGPT prompting
- User leaves with concrete artifacts: improved resume + story + next networking actions

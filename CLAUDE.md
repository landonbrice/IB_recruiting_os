# CLAUDE.md — IB Recruiting OS

> Source of truth for any AI agent working on this codebase.
> Audit date: 2026-03-26. Previous version: 2026-03-21.

---

## What This Product Is

A candidate-building OS for investment banking recruiting. NOT a resume checker.
The user uploads a resume, the system reverse-engineers a Decision Arc (visual map of their life decisions), then through coaching conversation develops behavioral stories, cover letters, and bank-specific interview prep — all derived from one data model.

**The three-layer hierarchy:**
```
Decision Arc (identity)    → "who am I, how did I get here, what are my threads"
Story Bank (behavioral)    → "7-10 IMPACT stories, structured, interview-ready"
Resume (compression)       → "each bullet = answer-first headline + metrics"
```

Cover letter = narrative rendering of Arc threads + target bank lens.
"Tell me about yourself" = narrative rendering of Arc threads + crystallizing moment.

---

## Current State (Honest Assessment)

**Two parallel architectures exist in the codebase:**

1. **The Working MVP** (chat-first coaching loop): Upload → Parse → Intake → Streaming Chat → Protocol Blocks → Resume Updates → Scoring → Export. This flow is fully functional but lives in components (ChatPanel, ResumePanel, ActionSidebar, useCoachSession) that are **no longer rendered** by the current app shell.

2. **The New Smoke+Cream Shell** (AppShell with 5 tabs): Beautiful UI shell with DecisionArc (React Flow) and StoryBank components rendered from demo data. CoachPanel and BottomBar are stubs. Resume/Cover/Targets tabs show "Coming soon." **No integration with the working coaching flow or storyState persistence.**

**The #1 architectural task is bridging these two systems.** The working chat/coaching logic needs to flow through the new shell, and the new visual components need to read/write storyState instead of demo data.

### Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| Landing page (`/`) | ✅ Working | Upload, beta gate, drag-drop, session handoff |
| `/api/parse-resume` | ✅ Working | PDF + DOCX extraction |
| `/api/chat` | ✅ Working | Streaming SSE, system prompt, bank context |
| `/api/suggest` | ✅ Working | 2-phase bullet rewrites with confidence/risk |
| `/api/beta-auth` | ✅ Working | Password gate |
| `useCoachSession` hook | ✅ Working | Full session state, localStorage persist, protocol parsing |
| `ChatPanel` | ✅ Working | Streaming, markdown, quick prompts — **not rendered in AppShell** |
| `ResumePanel` | ✅ Working | PDF/HTML/text display, click-to-edit — **not rendered in AppShell** |
| `BulletModal` | ✅ Working | 2-phase rewrite with plausibility checks |
| `ActionSidebar` | ✅ Working | Score gauge, readiness, tools — **not rendered in AppShell** |
| `ScoreCard` | ✅ Working | Category breakdown, gauge, working/hurting |
| `IntakeForm` | ✅ Working | Stage, bank tier, target group chips |
| `ExportModal` | ✅ Working | Resume, story, networking, session JSON export |
| `AppShell` | 🚧 Shell only | 5 tabs, NavBar, cream canvas. No data flow |
| `NavBar` | ✅ Working | Logo, tabs, beta indicator |
| `CoachPanel` | ❌ Stub | Placeholder UI, input disabled, no integration |
| `BottomBar` | ❌ Stub | Buttons render, no onClick handlers |
| DecisionArc (React Flow) | 🚧 Demo only | Full UI works but hardcoded demo data |
| StoryBank | 🚧 Demo only | Cards, stepping stones, coverage — all demo data |
| `TMAYBuilder` | 🚧 UI only | Renders but Edit/Refine buttons do nothing |
| Cover Letter tab | 💡 Not started | "Coming soon" placeholder |
| Targets tab | 💡 Not started | "Coming soon" placeholder |
| Resume tab (in AppShell) | 💡 Not started | "Coming soon" — old ResumePanel exists but isn't wired |
| `storyState.ts` | ✅ Working | Types + Supabase CRUD. **No component consumes it** |
| `llm.ts` | ✅ Working | DeepSeek + Anthropic provider abstraction |
| `protocolParser.ts` | ✅ Working | Parses existing block types (resume-update, score, profile, etc.) |
| `bankProfiles.ts` | 🚧 ~80% TODO | 15 banks scaffolded, qualitative fields are `[LANDON TODO]` |
| `ibExemplars.ts` | ✅ Working | 62 curated IB bullets with relevance scoring |
| `systemPrompt.ts` | ✅ Working | Full coach prompt + bank context injection |
| Supabase clients | ✅ Working | Browser + server wrappers. **Not used by any page yet** |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4.1 |
| AI (dev) | DeepSeek Reasoning via OpenAI-compatible client | openai 6.27 |
| AI (prod) | Anthropic Claude Sonnet | @anthropic-ai/sdk 0.78 |
| Auth + DB | Supabase (Postgres + Auth + RLS) | @supabase/supabase-js 2.99 |
| File parsing | pdf-parse (PDF) + mammoth (DOCX) | 1.1.1 / 1.11 |
| Decision Arc UI | React Flow | @xyflow/react 12.10 |
| Chat rendering | react-markdown + remark-gfm | 10.1 / 4.0 |
| Deployment | Vercel (target) | — |

**Not installed but may be needed:** Zustand (state management), testing library, UUID library.

---

## Project Structure

```
IB_recruiting_os/
├── CLAUDE.md                    ← This file (source of truth)
├── LOUIS_BUILD_LOG.md           ← Build history (2nd + 3rd passes)
├── .env.local                   ← ANTHROPIC_API_KEY, DEEPSEEK_API_KEY
├── .gitignore
│
└── ib-recruiting-os/            ← Next.js application root
    ├── .env.local               ← Same API keys (duplicated)
    ├── .env.example             ← Incomplete — only shows DEEPSEEK_API_KEY
    ├── package.json
    ├── tailwind.config.ts       ← Smoke+Cream color tokens
    ├── tsconfig.json
    ├── next.config.mjs          ← pdf-parse as serverExternalPackage
    ├── postcss.config.mjs
    ├── eslint.config.mjs
    ├── current_state.md         ← Status snapshot (2026-03-21, partially stale)
    ├── README.md                ← Quick-start guide
    │
    ├── context/
    │   └── competitive/
    │       └── resume-worded-model.md   ← Competitive analysis
    │
    ├── scripts/
    │   ├── fill-bank-profiles.md        ← Instructions for Landon
    │   └── smoke.sh                     ← QA smoke test (6 checks)
    │
    └── src/
        ├── proxy.ts                     ← Beta gate middleware
        │
        ├── app/
        │   ├── layout.tsx               ← Root layout (Space Grotesk font)
        │   ├── page.tsx                 ← Landing page (upload + beta gate)
        │   ├── globals.css              ← Tailwind directives + custom styles
        │   └── app/
        │       ├── layout.tsx           ← App layout (Smoke bg, fixed viewport)
        │       ├── page.tsx             ← Renders AppShell
        │       └── loading.tsx          ← Suspense fallback
        │
        ├── app/api/
        │   ├── chat/route.ts            ← Streaming coach conversation
        │   ├── suggest/route.ts         ← 2-phase bullet rewrites
        │   ├── parse-resume/route.ts    ← PDF/DOCX text extraction
        │   └── beta-auth/route.ts       ← Invite code verification
        │
        ├── hooks/
        │   └── useCoachSession.ts       ← Session state (localStorage persist)
        │
        ├── lib/
        │   ├── llm.ts                   ← Provider abstraction (DeepSeek/Anthropic)
        │   ├── storyState.ts            ← StoryState types + Supabase CRUD
        │   ├── types.ts                 ← Chat/resume types (overlaps storyState.ts)
        │   ├── systemPrompt.ts          ← Coach system prompt + bank context
        │   ├── protocolParser.ts        ← Structured block extraction
        │   ├── resumeStructure.ts       ← Resume line enrichment
        │   ├── coachActions.ts          ← Predefined coach action prompts
        │   ├── sse.ts                   ← SSE stream consumer
        │   ├── bankProfiles.ts          ← 15 bank profiles (~80% TODO)
        │   ├── ibExemplars.ts           ← 62 IB bullet exemplars
        │   ├── plausibilityCheck.ts     ← Rewrite safety validator
        │   ├── sessionLog.ts            ← In-session event logger
        │   └── supabase/
        │       ├── client.ts            ← Browser Supabase client
        │       └── server.ts            ← Server Supabase client (service role)
        │
        └── components/
            ├── AppShell.tsx             ← Smoke+Cream shell (5 tabs)
            ├── NavBar.tsx               ← Tab switcher + logo
            ├── CoachPanel.tsx           ← Right sidebar (STUB)
            ├── BottomBar.tsx            ← Context action buttons (STUB)
            ├── ChatPanel.tsx            ← Streaming chat UI
            ├── ResumePanel.tsx          ← Resume display + editing
            ├── BulletModal.tsx          ← Bullet rewrite modal
            ├── IntakeForm.tsx           ← Candidate profiling
            ├── ActionSidebar.tsx        ← Score + readiness + tools
            ├── ScoreCard.tsx            ← Score category breakdown
            ├── FeasibilityCard.tsx      ← Feasibility gauge
            ├── ExportModal.tsx          ← Session artifact download
            ├── UploadOverlay.tsx        ← Drag-drop resume upload
            │
            ├── DecisionArc/
            │   ├── index.tsx            ← React Flow canvas + legend
            │   ├── ArcNode.tsx          ← Node component
            │   ├── NodeDetailOverlay.tsx ← Click-to-zoom detail
            │   ├── ThreadEdge.tsx       ← Colored bezier edges
            │   ├── ThreadLegend.tsx     ← Thread color legend
            │   ├── ThreadBadge.tsx      ← Inline thread pill
            │   ├── ImpactBadge.tsx      ← IMPACT type badge
            │   ├── StatusBadge.tsx      ← Draft/Ready indicator
            │   ├── SteppingStoneBar.tsx ← 4-stage progress bar
            │   ├── SteppingStoneExpanded.tsx ← Full stepping stone view
            │   └── demoData.ts          ← Hardcoded demo arc + threads
            │
            └── StoryBank/
                ├── index.tsx            ← Story bank main view
                ├── StoryCard.tsx        ← Individual story card
                ├── StoryDetail.tsx      ← Detail panel
                ├── SteppingStoneVisual.tsx ← Vertical flow visual
                ├── CoverageTracker.tsx  ← IMPACT coverage chart
                ├── QuickReference.tsx   ← Answer framework reference
                └── TMAYBuilder.tsx      ← "Tell me about yourself" card
```

---

## Design System — "Smoke + Cream"

### Surfaces
| Surface | Hex | Tailwind Token | Role |
|---------|-----|----------------|------|
| Smoke | `#2a2826` | `smoke` | App shell, nav, coach panel, bottom bar |
| Smoke+1 | `#353230` | `smoke-1` | Elevated dark (coach cards, chat bubbles) |
| Smoke+2 | `#46423f` | `smoke-2` | Hover on dark surfaces |
| Cream | `#F5F1EA` | `cream` | Workspace canvas (10px inset) |
| Cream-1 | `#e8e4dc` | `cream-1` | Borders on cream, dividers |
| White | `#ffffff` | — | Cards, documents, modals |

**⚠️ Known issue:** Tailwind cream is `#F5F1EA` but the DIRECTION doc specifies `#f0ece4`. Pick one and update the other.

### Accent Colors
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Terracotta | `#d4845a` | `terracotta` | Primary accent — CTAs, active tabs, thread lines |
| Amber | `#d97706` | `amber-500` (default) | Warnings, "needs attention" |
| Green | `#22c55e` | `green-500` (default) | Success, strong bullets |
| Red | `#ef4444` | `red-500` (default) | Errors, weak bullets |

Amber, green, and red use Tailwind's default palette — not in tailwind.config.ts.

### Typography
- Font: Space Grotesk (loaded via `next/font/local` as `--font-space-grotesk`)
- Headings: 600 weight, 16-20px
- Body: 400-500, 13-15px
- Labels: 400, 10-12px
- Letter-spacing: -0.2 to -0.5px on headlines

---

## Core Data Model — storyState

Everything derives from this object. Defined in `src/lib/storyState.ts`. Persisted in Supabase as JSONB.
**Currently no component reads from or writes to storyState.** DecisionArc and StoryBank consume hardcoded demo data.

Key interfaces: `StoryState`, `ArcNode`, `ImpactStory`, `Thread`, `CandidateProfile`, `Target`, `PreparedAnswers`, `StoryRef`, `ResumeState`, `CoverLetterState`.

The older `src/lib/types.ts` has overlapping types (`CandidateProfile`, `ResumeState`, `Message`, `ChatMode`, etc.) used by the chat flow. These need consolidation.

### Critical: +/- Annotations Extract QUALITIES

Wrong: `"Sourced 30+ mandates"` (bullet restate)
Right: `"Learned trust matters more than logic in deal origination"` (quality)

### Non-Resume Nodes

The Decision Arc supports experiences NOT on the resume. Coach should proactively ask: "Is there anything important that ISN'T on this resume?"

---

## Protocol Blocks

### Implemented (parsed + applied in useCoachSession):
```
resume-update        // { section, company, bulletIndex, newText }
resume-score         // { total, categories[], working[], hurting[], nextStep }
profile-update       // { schoolTier?, stage?, background?, ... }
story-output         // { whyIB, thread, crystallizingMoment }
networking-actions   // { actions[], template }
feasibility-score    // { score, assessment, biggestLeverage, ... }
cover-letter         // { opening, middle, close } — parsed but not displayed
```

### Defined but not yet implemented:
```
decision-arc-update  // { nodeId, field, value }
impact-story         // { nodeId, story: ImpactStory }
stepping-stone       // { storyId, stage, content }
thread-update        // { threadId, label?, nodeIds?, color? }
story-bank-update    // { storyId, status?, nickname? }
cover-letter-update  // { section, content }
target-update        // { bank, group, whyThisBank?, relevantThreads? }
tmay-update          // { narrative?, userRefinements? }
readiness-score      // { score, assessment, biggestGap, strengths }
template-check       // { compliance: "pass"|"revise"|"reject", flags[] }
```

---

## LLM Provider Abstraction

`src/lib/llm.ts` — fully implemented.

```typescript
export async function streamChatCompletion(opts) → AsyncIterable<string>
export async function complete(opts) → string
export function getProviderInfo() → { provider: string; model: string }
```

- `LLM_PROVIDER=deepseek` → DeepSeek via OpenAI SDK
- `LLM_PROVIDER=anthropic` → Anthropic via @anthropic-ai/sdk

---

## Environment Variables

**Required (LLM):**
```
DEEPSEEK_API_KEY=       # Dev provider
ANTHROPIC_API_KEY=      # Prod provider
```

**Required for Supabase (not yet used):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

**Optional:**
```
BETA_PASSWORD=          # Enables invite-code gate if set
LLM_PROVIDER=           # "deepseek" (default) or "anthropic"
```

---

## Route Map

| Route | Type | Status | Purpose |
|-------|------|--------|---------|
| `/` | Page | ✅ | Landing page + resume upload + beta gate |
| `/app` | Page | 🚧 | Main workspace (AppShell shell only) |
| `/api/chat` | SSE | ✅ | Streaming coach conversation |
| `/api/parse-resume` | POST | ✅ | PDF/DOCX text extraction |
| `/api/suggest` | SSE | ✅ | 2-phase bullet rewrite suggestions |
| `/api/beta-auth` | POST | ✅ | Invite code verification |
| `/api/generate-arc` | POST | 💡 | Planned — reverse-engineer Arc from resume |

---

## How to Run

```bash
cd ib-recruiting-os
npm install
cp .env.example .env.local
# Fill in DEEPSEEK_API_KEY (minimum) or ANTHROPIC_API_KEY
npm run dev
```

Smoke test: `npm run smoke` (requires dev server on :3000)

---

## Known Issues & Gotchas

1. **Dual architecture:** Old chat flow (useCoachSession) and new AppShell are disconnected. This is THE critical integration task.
2. **Type duplication:** `types.ts` and `storyState.ts` both define `CandidateProfile`. Consolidate.
3. **Cream color mismatch:** Tailwind `#F5F1EA` vs DIRECTION doc `#f0ece4`.
4. **bankProfiles.ts:** ~80% `[LANDON TODO]` placeholders.
5. **No tests.** No testing framework installed.
6. **No Supabase in pages.** Clients exist, CRUD exists, everything uses localStorage.
7. **Demo data baked in.** DecisionArc/StoryBank import from demoData.ts, not props/context.
8. **CoachPanel is dead.** Input disabled, no integration.
9. **patchStoryState() is shallow** — deep nested updates clobber subtrees.
10. **No UUID library** for generating node/story/thread IDs.
11. **.env.example incomplete** — missing most required vars.

---

## Build Priority

0. **Bridge the gap:** Wire useCoachSession into AppShell. Chat flows through CoachPanel. Resume tab renders ResumePanel.
1. **StoryState integration:** Replace demo data with storyState. Protocol blocks patch storyState. Add Supabase persistence.
2. **Decision Arc live:** `/api/generate-arc` endpoint. Protocol blocks create arc nodes. React Flow reads storyState.
3. **Story Bank live:** Stories flow from arc nodes into bank. Coach interactions update via protocol blocks.
4. **Cover Letter + Targeting:** Cover letter tab, target management, per-target arc lens.
5. **Resume Templates:** Rules-based compliance checker, export templates.
6. **Readiness Score:** Scoring model from storyState completeness.
7. **Paywall + Landing:** Stripe, paywall gates, landing redesign.

---

## What Must NOT Be Removed

- `src/hooks/useCoachSession.ts` — extend, don't rewrite
- `src/lib/protocolParser.ts` — add new block types
- `src/lib/llm.ts` — complete
- `src/lib/sse.ts` — complete
- `src/lib/resumeStructure.ts` — complete
- `src/lib/storyState.ts` — complete (needs consumers)
- `src/lib/systemPrompt.ts` — complete
- `src/lib/ibExemplars.ts` — complete
- `src/lib/plausibilityCheck.ts` — complete
- `src/components/ChatPanel.tsx` — needs integration, not rewrite
- `src/components/ResumePanel.tsx` — needs integration, not rewrite
- `src/components/DecisionArc/*` — needs data binding, not rewrite
- `src/components/StoryBank/*` — needs data binding, not rewrite

---

## Coaching Methodology

| Framework | Used For | Structure |
|-----------|----------|-----------|
| IMPACT | Categorizing stories | I(ndividual) M(anage) P(ersuasion) A(nalytics) C(hallenge) T(eamwork) |
| Stepping Stone | Structuring stories | Answer First → Actions → Tension → Resolution |
| HERO | "Tell me about yourself" | Setup → Challenge → Turning Point → Resolution → Future Path |
| CREI | "Why banking/firm/you" | Claim → Reason → Evidence → Impact |
| STAR PUNCH | "Tell me about a time" | Situation → Task → Action → Result → Punchline |
| ABCD | Weaknesses | Acknowledge → Bridge → Cover → Dangle |
| TECH4 | Technical walkthroughs | Define → Components → Mechanics → Application |

Coach persona: Sharp 2nd-year analyst friend. Direct, honest, not sycophantic.

---

## Interaction Patterns

### Click-to-zoom (Decision Arc)
Click node → arc blurs → node detail takes over cream canvas. Click blurred background to return.

### Everything is editable
Every displayed piece of data is a view into storyState. Clicking any annotation invokes coach or inline-edit.

### Coach prompt composer
"Develop with coach" buttons construct scoped prompts with relevant storyState context + methodology. Never dumps full storyState.

### Protocol block flow
Coach response → protocolParser → patch storyState → UI re-renders → Supabase write-back (debounced)

---

## Supabase Schema

Three tables with RLS: `profiles`, `story_states` (JSONB per user), `sessions` (event log).
Auto-creates profile on signup via trigger. Full migration SQL in DIRECTION doc.
**Not yet connected to any page.**

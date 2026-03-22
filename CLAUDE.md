# CLAUDE.md — IB Recruiting OS

> This file is the source of truth for any AI agent working on this codebase.
> Read this FIRST before touching any file. Last updated: 2026-03-21.

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

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS (Smoke + Cream design system — see below)
- **AI (dev):** DeepSeek Reasoning via OpenAI-compatible client
- **AI (prod):** Anthropic Claude Sonnet via provider abstraction layer
- **Auth + DB:** Supabase (Postgres + Auth + RLS)
- **File parsing:** pdf-parse (PDF) + mammoth (DOCX)
- **State:** React state + Supabase persistence. Zustand if complexity demands.
- **Decision Arc UI:** React Flow (draggable nodes, edge connections)
- **Deployment:** Vercel

---

## Design System — "Smoke + Cream"

### Surfaces (three-layer depth)
| Surface | Hex | Role |
|---------|-----|------|
| Smoke | `#2a2826` | App shell, nav bar, coach panel, bottom bar |
| Cream | `#f0ece4` | Workspace canvas (center stage). 10px inset with border-radius inside dark shell. |
| White | `#ffffff` | Cards, documents, modals, node interiors |

Supporting:
- Smoke+1: `#353230` (elevated dark — coach cards, chat bubbles)
- Smoke+2: `#46423f` (hover on dark surfaces)
- Cream-1: `#e8e4dc` (borders on cream, dividers)

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Terracotta | `#d4845a` | Primary accent — CTAs, active tabs, thread lines, logo |
| Amber | `#d97706` | Warnings, score highlights, "needs attention" |
| Green | `#22c55e` | Success, strong bullets, story completeness |
| Red | `#ef4444` | Errors, weak bullets, issues |

Thread colors: terracotta (primary) + muted blue `#6366f1` + muted red `#dc2626` + muted green `#059669`

### Typography
- UI headlines: Space Grotesk or Geist, 600 weight, 16-20px
- Body: Space Grotesk or Geist, 400-500 weight, 13-15px
- Labels: same family, 400, 10-12px
- Letter-spacing: -0.2 to -0.5px on headlines

### Layout
- Border radius: 10-12px cards, 5-6px buttons, 50% avatars
- Cream canvas: 10px margin inside dark shell, 10px border-radius
- Nav bar: Smoke background, tabs centered
- Coach panel: right column, 160-220px, dark background, always visible
- Bottom bar: Smoke, thin top border, contextual action buttons per tab

### OLD THEMES — REMOVED
Theme A ("Operator"), Theme B ("Platform"), Theme C ("Terminal") are all deprecated.
All files in `src/themes/` should be deleted. The unified Smoke + Cream design replaces them.
`src/lib/uiConfig.ts` theme switching logic should be removed.

---

## App Shell Layout

```
┌──────────────────────────────────────────────────────┐
│  [Logo]  [Resume] [Arc] [Stories] [CL] [Targets]  [User]  │  ← Nav (Smoke)
├─────────────────────────────────────────┬────────────┤
│                                         │            │
│         Cream Canvas (10px inset)       │   Coach    │
│                                         │   Panel    │
│   ┌──────────────────────────┐          │  (Smoke+1) │
│   │  White card / document   │          │            │
│   │  (varies by active tab)  │          │            │
│   └──────────────────────────┘          │            │
│                                         │            │
├─────────────────────────────────────────┴────────────┤
│  [Contextual action buttons per tab]                  │  ← Bottom bar (Smoke)
└──────────────────────────────────────────────────────┘
```

Five tabs: Resume, Decision Arc, Story Bank, Cover Letter, Targets.

---

## Core Data Model — storyState

Everything in the product derives from this object. Persisted in Supabase as JSONB.

```typescript
interface StoryState {
  decisionArc: {
    nodes: ArcNode[];
    threads: Thread[];
    crystallizingMoment: string;
    whyIB: string;
    futureVision: string;
  };
  storyBank: {
    stories: StoryRef[];
    tellMeAboutYourself: { narrative: string; userRefinements: string; lastUpdated: string };
  };
  candidateProfile: CandidateProfile;
  targets: Target[];
  resumeState: ResumeState;
  coverLetterState: CoverLetterState;
  preparedAnswers: PreparedAnswers;
}

interface ArcNode {
  id: string;
  label: string;           // "King's Ransom Group"
  sub: string;             // "M&A Healthcare Intern"
  timeframe: string;
  type: "experience" | "education" | "non-resume" | "upcoming" | "goal";
  positives: string[];     // QUALITIES gained, NOT bullet restates
  negatives: string[];     // What pushed them onward
  impactStories: ImpactStory[];
  setMetGoals: { set: string; met: string; metric: string }[];
}

interface ImpactStory {
  id: string;
  type: "I" | "M" | "P" | "A" | "C" | "T";
  status: "draft" | "ready";
  nickname: string;
  steppingStone: {
    answerFirst: string;
    actions: string[];
    tension: string;
    resolution: string;
  };
  ibConnection: string;
  valueAdd: { category: string; past: string; future: string };
}

interface Thread {
  id: string;
  label: string;           // "Ownership & Execution"
  nodeIds: string[];
  color: string;
  desc: string;
}

interface CandidateProfile {
  schoolTier: "target" | "semi-target" | "non-target";
  stage: "freshman" | "sophomore" | "junior" | "senior" | "mba" | "career-switcher";
  background: string;
  experienceLevel: string;
  targetBankTier: "bulge-bracket" | "elite-boutique" | "middle-market" | "regional";
  targetGroup: string;
}

interface Target {
  bank: string;
  group: string;
  whyThisBank: string;
  relevantThreads: string[];
  relevantNodes: string[];
  coverLetterAngle: string;
  notes: string;
}

interface PreparedAnswers {
  whyBanking: { claim: string; reason: string; evidence: string; impact: string };
  weakness: { acknowledge: string; bridge: string; cover: string; dangle: string };
  recentDeals: { name: string; dates: string; value: string; consideration: string; rationale: string; risks: string }[];
  industryTrends: { headline: string; hook: string; drivers: string; tailwinds: string; headwinds: string; deals: string }[];
}
```

### Critical: +/- Annotations Extract QUALITIES

When the LLM reverse-engineers a Decision Arc from a resume, the positives/negatives must describe **traits and insights**, not restate bullets.

Wrong: `"Sourced 30+ mandates"` (that's a bullet)
Right: `"Learned trust matters more than logic in deal origination"` (that's a quality)

Wrong: `"Real M&A exposure"` (vague restatement)
Right: `"Earned responsibility through incessant drive — asked for more when there was nothing"` (that's character)

### Non-Resume Nodes

The Decision Arc supports experiences NOT on the resume. Some of a candidate's strongest stories come from academic moments, personal projects, or life events. The coach should proactively ask: "Is there anything important that ISN'T on this resume?"

---

## Protocol Blocks

The coach emits structured JSON blocks in its responses. The client parses these to update storyState.

### Existing (keep):
```
resume-update        // { section, company, bulletIndex, newText }
resume-score         // { total, categories[], working[], hurting[], nextStep }
profile-update       // { schoolTier?, stage?, background?, ... }
story-output         // { whyIB, thread, crystallizingMoment }
networking-actions   // { actions[], template }
```

### New (to build):
```
decision-arc-update  // { nodeId, field, value } — patch a node's annotations/stories
impact-story         // { nodeId, story: ImpactStory } — add/update a story on a node
stepping-stone       // { storyId, stage, content } — update one stage of a stepping stone
thread-update        // { threadId, label?, nodeIds?, color? } — create/update thread
story-bank-update    // { storyId, status?, nickname? } — promote/update story in bank
cover-letter-update  // { section, content } — update opening/middle/close
target-update        // { bank, group, whyThisBank?, relevantThreads?, coverLetterAngle? }
tmay-update          // { narrative?, userRefinements? }
readiness-score      // { score, assessment, biggestGap, strengths }
template-check       // { compliance: "pass"|"revise"|"reject", flags[] }
```

---

## LLM Provider Abstraction

All LLM calls go through `src/lib/llm.ts` (TO BE BUILT). This module reads `LLM_PROVIDER` env var and routes accordingly.

```typescript
// src/lib/llm.ts
export async function streamChat(messages, systemPrompt, options?) → ReadableStream
export async function complete(prompt, options?) → string
```

- `LLM_PROVIDER=deepseek` → calls api.deepseek.com (dev)
- `LLM_PROVIDER=anthropic` → calls Anthropic API (prod)

API routes (`/api/chat`, `/api/suggest`) import from `src/lib/llm.ts`, never from OpenAI or Anthropic directly.

---

## Supabase Schema

```sql
-- Run this migration after Supabase project is created

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  created_at timestamp with time zone default now(),
  last_active timestamp with time zone default now()
);

-- Story states (one per user, JSONB blob)
create table public.story_states (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade unique not null,
  state jsonb not null default '{}',
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Sessions (coaching session tracking)
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  started_at timestamp with time zone default now(),
  ended_at timestamp with time zone,
  events jsonb default '[]'
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.story_states enable row level security;
alter table public.sessions enable row level security;

create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users read own state" on public.story_states for select using (auth.uid() = user_id);
create policy "Users write own state" on public.story_states for insert with check (auth.uid() = user_id);
create policy "Users update own state" on public.story_states for update using (auth.uid() = user_id);

create policy "Users read own sessions" on public.sessions for select using (auth.uid() = user_id);
create policy "Users write own sessions" on public.sessions for insert with check (auth.uid() = user_id);
create policy "Users update own sessions" on public.sessions for update using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## Route Map

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Static | Landing page (light palette, scroll marketing) |
| `/app` | Client | Main workspace (Smoke + Cream, tab-based) |
| `/api/chat` | SSE | Streaming coach conversation |
| `/api/parse-resume` | POST | PDF/DOCX text extraction |
| `/api/suggest` | SSE | Per-bullet rewrite suggestions |
| `/api/beta-auth` | POST | Invite code verification |
| `/api/generate-arc` | POST | NEW — reverse-engineer Decision Arc from resume text |

---

## Build Priority

0. **Foundation:** Supabase integration, provider abstraction (`src/lib/llm.ts`), Smoke + Cream design tokens, strip old themes, storyState TypeScript types
1. **Decision Arc:** React Flow graph, draft-from-resume LLM prompt, click-to-zoom node detail, editable +/- annotations, thread visualization
2. **Story Bank:** Story cards, Stepping Stone visual (circle/arrow flow), IMPACT coverage tracker, TMAY builder, Quick Reference panel, practice mode
3. **Resume Templates:** Rules-based compliance checker, export to Classic/Modern-Clean templates
4. **Cover Letter + Targeting:** Cover letter tab, target management, per-target arc lens, comparison view
5. **Readiness Score:** Scoring model, UI, storyState completeness integration
6. **Paywall + Landing:** Stripe, paywall gates, landing page redesign, analytics

---

## What Exists (Reusable)

These modules are solid and should be preserved/adapted:
- `src/hooks/useCoachSession.ts` — session state management (needs extension for storyState)
- `src/lib/protocolParser.ts` — structured block extraction (needs new block types added)
- `src/lib/sse.ts` — shared SSE stream parser
- `src/lib/resumeStructure.ts` — resume line enrichment
- `src/lib/coachActions.ts` — coach action/prompt configurations
- `src/components/BulletModal.tsx` — bullet rewrite UI
- `src/components/IntakeForm.tsx` — initial intake capture
- `src/app/api/parse-resume/route.ts` — resume parsing
- `src/app/api/chat/route.ts` — streaming chat (refactor to use llm.ts)
- `src/app/api/suggest/route.ts` — bullet suggestions (refactor to use llm.ts)
- `src/middleware.ts` — beta gate logic

## What Must Be Removed

- `src/themes/ThemeA.tsx` — deleted
- `src/themes/ThemeB.tsx` — deleted
- `src/themes/ThemeC.tsx` — deleted
- `src/lib/uiConfig.ts` — theme switching logic deleted
- All references to `NEXT_PUBLIC_UI_VERSION` — removed
- Dev theme switcher UI — removed

## What Must Be Built

- `src/lib/llm.ts` — provider abstraction layer
- `src/lib/supabase.ts` — Supabase client (browser + server)
- `src/lib/storyState.ts` — storyState types, read/write/patch utilities
- `src/components/AppShell.tsx` — Smoke + Cream shell with tabs, cream canvas, coach panel, bottom bar
- `src/components/DecisionArc/` — React Flow graph, ArcNode, NodeDetail, ThreadEdge
- `src/components/StoryBank/` — StoryCard, SteppingStone visual, CoverageTracker, TMAY builder, QuickReference
- `src/components/CoachPanel.tsx` — contextual coach interface with prompt composer
- `src/components/ResumePanel.tsx` — resume display with template compliance badge (adapt from existing)
- `src/components/CoverLetter.tsx` — cover letter tab with target selector
- `src/components/Targets.tsx` — target management and comparison
- `src/app/api/generate-arc/route.ts` — draft Decision Arc from resume

---

## Interaction Patterns

### Click-to-zoom (Decision Arc)
Clicking a node on the arc: the arc blurs/recedes, the node's full detail view takes over the cream canvas. Stepping Stone, +/- annotations, stories — all rendered large and breathable. Click blurred background or back button to return to arc view.

### Everything is editable
Every displayed piece of data is a view into storyState. Clicking any annotation, thread, or story stage can either inline-edit or invoke the coach with scoped context.

### Coach prompt composer
Every "develop with coach" or "ask about this" button constructs a scoped prompt:
- Includes relevant storyState context (the specific node, story, or thread)
- Includes relevant coaching methodology (Stepping Stone, IMPACT, CREI, etc.)
- Does NOT dump the full storyState — only what's relevant to the interaction
- The coach panel knows which tab is active and adjusts accordingly

### Protocol block flow
Coach response → client parses protocol blocks → patches storyState → UI re-renders from storyState → Supabase write-back (debounced)

---

## Coaching Methodology (for system prompt reference)

The coach internalizes these frameworks without naming them to the user:

| Framework | Used For | Structure |
|-----------|----------|-----------|
| IMPACT | Categorizing behavioral stories | I(ndividual) M(anage) P(ersuasion) A(nalytics) C(hallenge) T(eamwork) |
| Stepping Stone | Structuring individual stories | Answer First → Actions → Tension → Resolution |
| HERO | "Tell me about yourself" | Setup → Challenge → Turning Point → Resolution → Future Path |
| CREI | "Why banking/firm/you" | Claim → Reason → Evidence → Impact |
| STAR PUNCH | "Tell me about a time..." | Situation → Task → Action → Result → Punchline |
| ABCD | Weaknesses | Acknowledge → Bridge → Cover → Dangle |
| TECH4 | Technical walkthroughs | Define → Components → Mechanics → Application |

The coach's persona: sharp 2nd-year analyst friend. Direct, honest, not sycophantic. Drives the conversation with an agenda. The resume is a filter, not a decision — networking is the decision. Be honest about this.

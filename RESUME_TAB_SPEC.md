# Resume Tab — Implementation Spec

_Created: 2026-03-26_
_Status: Ready for build. This is the first feature to implement._
_Parent doc: IB_RECRUITING_OS_DIRECTION.md_

---

## Why This Is Priority 1

The Resume tab is the **entry point** for every user. Upload resume → see it rendered → click bullets → improve them → discover the story system. It's also the conversion funnel: free users get instant rewrites, paid users get coach-developed rewrites that simultaneously build their Decision Arc. Build this first.

---

## The Core Interaction Model

The resume is not a standalone document editor. It's a **portal into the story layer**. Each bullet on the resume links to an experience node on the Decision Arc and (eventually) to an IMPACT story in the Story Bank. The user thinks they're improving their resume. The system is building their narrative infrastructure.

### The Key Innovation vs. Resume Worded

Resume Worded treats bullets as isolated text: "here's your line, here are 3 rewrites, pick one." That's useful but shallow. Our model: **the bullet is a portal into the story, and the rewrite is a byproduct of understanding the story better.** The coach asks what actually happened, infers qualities and stories, and produces a rewrite that's specific to the candidate — not a generic template fill.

---

## Layout Architecture

The Resume tab has **two layout modes** controlled by a single state variable (`workshopBulletId: string | null`).

### Mode 1: Default View (`workshopBulletId === null`)

```
┌──────────────────────────────────────────┬──────────┐
│                                          │          │
│         Cream Canvas                     │  Coach   │
│         ┌──────────────────┐             │  Panel   │
│         │  White Resume    │             │  (220px) │
│         │  (paper on desk) │             │          │
│         │                  │             │          │
│         │  ▸ section       │             │          │
│         │  ▸ bullets       │             │          │
│         │  ▸ bullets       │             │          │
│         │                  │             │          │
│         └──────────────────┘             │          │
│                                          │          │
├──────────────────────────────────────────┴──────────┤
│  [Score] [Check Verbs] [Template Check] [Export]    │
└─────────────────────────────────────────────────────┘
```

- The resume renders as a **white document centered on the cream canvas** — paper-on-desk metaphor
- Each bullet is **hoverable** — subtle left-border tint appears on hover (cream-1 or very light amber)
- Each bullet is **clickable** — click transitions to Workshop mode
- Experience entries show their org name, title, location, dates exactly as the original resume
- The Coach Panel is visible in its standard position (right column, 220px, Smoke+1 background)
- The coach panel in default mode shows contextual prompts: "Click any bullet to start improving it" or resume-level observations
- Template compliance badge and quality score summary visible in the top-right area of the cream canvas (or as a floating card)

### Mode 2: Bullet Workshop (`workshopBulletId !== null`)

```
┌──────────────────────┬─────────────────────────────┐
│                      │                             │
│  Resume (compressed) │   Bullet Workshop           │
│  ~40% width          │   ~60% width                │
│                      │                             │
│  ▸ bullet            │   ┌───────────────────────┐ │
│  ▸ bullet            │   │ Experience Header     │ │
│  █ ACTIVE BULLET █   │   │ Current Bullet + Flags│ │
│  ▸ bullet            │   ├───────────────────────┤ │
│  ▸ bullet            │   │ Instant Rewrites      │ │
│                      │   ├───────────────────────┤ │
│                      │   │ Coach Conversation    │ │
│                      │   │ (scrollable thread)   │ │
│                      │   │                       │ │
│                      │   │ [chat input]          │ │
│                      │   ├───────────────────────┤ │
│                      │   │ Linked Story (if any) │ │
│                      │   └───────────────────────┘ │
│                      │                             │
├──────────────────────┴─────────────────────────────┤
│  [Score] [Check Verbs] [Template Check] [Export]    │
└─────────────────────────────────────────────────────┘
```

**Critical layout rules:**
- The Coach Panel **collapses/hides entirely** when the workshop opens. The workshop IS the coaching interface for this tab.
- The resume compresses to ~40% width on the left. It remains scrollable. The active bullet is highlighted with a terracotta left-border and a subtle tinted background.
- The resume auto-scrolls so the active bullet is vertically centered when the workshop opens.
- The workshop panel takes ~60% width on the right, with its own internal scroll.
- Clicking a different bullet on the compressed resume switches the workshop context (no close/reopen needed).
- Clicking the "← Back to Resume" link at the top of the workshop (or pressing Escape) closes the workshop and returns to Default mode.

### Transition Animation

When a bullet is clicked:
1. Resume slides left and compresses (200-300ms ease, the document scales down slightly)
2. Coach panel fades out simultaneously (150ms)
3. Workshop panel slides in from the right (200-300ms ease)
4. Active bullet gets terracotta left-border highlight + resume auto-scrolls to center it
5. Workshop header populates with experience context

Reverse animation on close. Keep it snappy — total transition should feel instant, not theatrical.

---

## Component Tree

```
ResumeTab
├── ResumeDocument
│   ├── ResumeHeader (name, contact info)
│   ├── ResumeSection (education)
│   │   └── EducationEntry
│   ├── ResumeSection (experience)
│   │   └── ExperienceEntry
│   │       └── BulletPoint (clickable → opens workshop)
│   ├── ResumeSection (leadership & activities)
│   │   └── ExperienceEntry
│   │       └── BulletPoint
│   ├── ResumeSection (skills & interests)
│   ├── ComplianceBadge (floating, top-right)
│   └── ScoreSummary (floating or inline)
│
├── BulletWorkshop (conditionally rendered when workshopBulletId is set)
│   ├── WorkshopHeader
│   │   ├── BackButton ("← Back to Resume")
│   │   ├── ExperienceContext (org, title, dates)
│   │   └── BulletNavigation (prev/next bullet arrows)
│   ├── CurrentBullet
│   │   ├── BulletText (the current text, editable)
│   │   └── IssueFlags (weak verb, no quant, too long, etc.)
│   ├── InstantRewrites
│   │   ├── RewriteOption (× 3, radio-selectable)
│   │   ├── ApplyButton
│   │   └── RegenerateButton
│   ├── CoachThread
│   │   ├── MessageList (scrollable, coach + user messages)
│   │   ├── CoachRewrite (special message type — shows proposed rewrite with Apply)
│   │   └── ChatInput
│   └── LinkedStory (appears after coach develops a story)
│       ├── ImpactPill
│       ├── StoneBar (stepping stone progress)
│       └── ViewInStoryBankLink
│
└── (CoachPanel — HIDDEN when workshop is open)
```

---

## Data Model

### Extended `resumeState` Schema

The current schema (`{ templateCompliance, qualityScore, sections[], activeTemplate }`) is too thin. Replace with:

```typescript
interface ResumeState {
  // Document-level
  templateCompliance: 'pass' | 'revise' | 'reject' | null;
  qualityScore: number | null; // 0-100
  activeTemplate: 'classic' | 'modern-clean';
  uploadedAt: string | null; // ISO timestamp

  // Parsed sections
  sections: ResumeSection[];
}

interface ResumeSection {
  id: string;
  type: 'header' | 'education' | 'experience' | 'leadership' | 'skills';
  entries: ResumeEntry[];
}

interface ResumeEntry {
  id: string;
  org: string;
  title: string;
  location: string;
  dates: string;
  nodeId: string | null; // ← link to Decision Arc node
  subEntries?: ResumeSubEntry[]; // for IDP-style nested companies
  bullets: ResumeBullet[];
}

interface ResumeSubEntry {
  id: string;
  org: string; // e.g., "Brand Properties", "Geodis (Americas Division)"
  bullets: ResumeBullet[];
}

interface ResumeBullet {
  id: string;
  text: string; // current live text
  originalText: string; // what was uploaded, never changes
  score: BulletScore | null;
  linkedStoryId: string | null; // ← link to IMPACT story
  rewrites: BulletRewrite[];
  coachThread: CoachMessage[]; // conversation history for this bullet
  status: 'untouched' | 'reviewed' | 'rewritten';
}

interface BulletScore {
  verb: 'strong' | 'moderate' | 'weak';
  quantification: boolean; // has numbers/metrics
  specificity: 'high' | 'medium' | 'low';
  length: 'good' | 'too-long' | 'too-short';
  overall: 'strong' | 'needs-work' | 'weak';
}

interface BulletRewrite {
  id: string;
  text: string;
  source: 'instant' | 'coach';
  appliedAt: string | null; // ISO timestamp, null if not applied
  createdAt: string;
}

interface CoachMessage {
  id: string;
  role: 'coach' | 'user';
  content: string;
  timestamp: string;
  // Coach messages can include structured actions
  rewriteSuggestion?: string; // proposed bullet text
  arcUpdate?: {
    nodeId: string;
    field: 'positives' | 'negatives' | 'impactStories';
    action: 'add' | 'update';
    value: any;
  };
}
```

### Bullet → Node → Story Linking

Every experience entry on the resume maps to a Decision Arc node via `nodeId`. When the resume is first parsed, nodes are auto-created (or matched to existing ones). The mapping:

```
Resume Entry: "King's Ransom Group, M&A Healthcare Intern"
    → nodeId: "krg"
    → DecisionArc node: { id: "krg", label: "King's Ransom Group", ... }

Resume Bullet: "Sourced and qualified 30+ sell-side dental mandates..."
    → linkedStoryId: "krg-2" (the Cold Outreach → 2 EOI story)
    → Story: { id: "krg-2", type: "P", status: "draft", ... }
```

Not every bullet will have a linked story initially. Stories develop through coach conversations. The `linkedStoryId` gets set when the coach identifies or creates a story from a bullet conversation.

---

## Bullet Workshop — Detailed Behavior

### Section 1: Workshop Header

```
┌─────────────────────────────────────────────┐
│ ← Back to Resume              [◄] [►]       │
│                                              │
│ KING'S RANSOM GROUP                          │
│ M&A Healthcare Intern · Los Angeles, CA      │
│ Summer 2025                                  │
│                                              │
│ Bullet 2 of 3                                │
└──────────────────────────────────────────────┘
```

- **Back button**: closes workshop, returns to default layout
- **Prev/Next arrows** (`[◄] [►]`): navigate between bullets within the same experience entry. When reaching the last bullet in an entry, the next arrow goes to the first bullet of the next experience entry. This lets the user work through their entire resume without leaving the workshop.
- **Experience context**: org name (bold, 14px), title + location (regular, 12px), dates (12px, muted)
- **Bullet counter**: "Bullet 2 of 3" — orientation within the entry

### Section 2: Current Bullet + Diagnostics

```
┌─────────────────────────────────────────────┐
│ "Sourced and qualified 30+ sell-side dental │
│  mandates targeting high potential family    │
│  practices (impending retirement, single-    │
│  site operations) using NPI registry data,   │
│  dental brokering networks, and sale         │
│  surfing websites"                           │
│                                              │
│  ⚠ Verb is weak ("Sourced and qualified")   │
│  ⚠ No outcome metric — what happened next?  │
│  ⚠ 2+ lines — consider tightening           │
└──────────────────────────────────────────────┘
```

- The bullet text is displayed in a card with a subtle border
- Below the text: **issue flags** as small amber-colored tags/pills
- Issue detection is **rules-based first pass** (check the Resume_Template_Checker.md spec):
  - **Verb check**: Is the first word a strong action verb? Weak = "Sourced", "Assisted", "Helped". Strong = "Built", "Led", "Drove", "Negotiated"
  - **Quantification check**: Does the bullet contain numbers ($, %, #)? Flag if missing.
  - **Length check**: Is it over ~150 characters or wrapping to 2+ lines on a standard resume? Flag if too long.
  - **Specificity check**: Does it contain vague phrases ("various", "several", "multiple tasks")? Flag if present.
  - **Outcome check**: Does the bullet describe what happened as a result? Flag if it ends with activities but no outcome.
- If the bullet has no issues: show a green "✓ Strong bullet" indicator instead

### Section 3: Instant Rewrites

```
┌─────────────────────────────────────────────┐
│ INSTANT REWRITE                              │
│                                              │
│ ○ "Identified and qualified 30+ dental      │
│    acquisition targets via NPI registry and  │
│    broker networks, generating 2 EOI         │
│    engagements"                              │
│                                              │
│ ○ "Built a pipeline of 30+ sell-side dental │
│    mandates, converting cold outreach into   │
│    2 active client engagements"              │
│                                              │
│ ○ "Sourced 30+ high-potential dental         │
│    practices for M&A advisory, leveraging    │
│    NPI data and broker networks to close 2   │
│    Expression-of-Interest clients"           │
│                                              │
│         [Apply Selected]  [Regenerate]       │
└──────────────────────────────────────────────┘
```

- **3 rewrite options** generated from the bullet text + issue flags + experience context
- Each option is radio-selectable (only one can be selected)
- **Apply Selected**: replaces the bullet text. The resume on the left shows a **live preview** of the selected rewrite (highlighted in a slightly different background, italic or terracotta-tinted) BEFORE the user clicks Apply. Clicking Apply commits the change, updates `bullet.text`, adds to `bullet.rewrites[]`, updates the score, and changes `bullet.status` to `'rewritten'`.
- **Regenerate**: generates 3 new options
- The instant rewrites are generated by the LLM using ONLY the bullet text + experience context (org, title, dates) + issue flags. No additional user input needed. This is the "quick win" — Resume Worded-level quality.

**Live Preview Behavior:**
When the user selects (radio-clicks) a rewrite option, the resume document on the left immediately shows that text in place of the original bullet. The preview is visually distinct — use a light terracotta background tint (`#d4845a08`) on the bullet area so the user can see how it reads in context. The preview is non-destructive; clicking a different option switches the preview, and deselecting removes it. Only "Apply Selected" commits the change.

**Score Update on Apply:**
When a rewrite is applied, the bullet's score recalculates immediately. If the overall resume quality score changes, that updates too. This gives the user a real-time feedback loop — apply rewrite → see score go up → dopamine → do another one.

### Section 4: Coach Conversation (Develop with Coach)

```
┌─────────────────────────────────────────────┐
│ ── Develop with Coach ──────────────────── │
│                                              │
│ 🤖 This bullet has the bones but I can     │
│    write something much better if I          │
│    understand the full story. A few          │
│    questions:                                │
│                                              │
│    What actually happened with the mandates │
│    you sourced — did any convert to active   │
│    engagements?                              │
│                                              │
│ 👤 Yeah, 2 of them became Expression-of-   │
│    Interest clients. One was a local         │
│    dentist I actually visited in person      │
│    and convinced to come listen to our       │
│    pitch.                                    │
│                                              │
│ 🤖 That's the real story — cold outreach    │
│    plus in-person persuasion converting to   │
│    real engagements. Here's a rewrite:       │
│                                              │
│    ┌──────────────────────────────────┐      │
│    │ "Sourced 30+ dental M&A targets  │      │
│    │  via NPI data and cold outreach, │      │
│    │  personally converting 2 to      │      │
│    │  Expression-of-Interest clients  │      │
│    │  through in-person practice      │      │
│    │  visits"                         │      │
│    │        [Apply] [Refine Further]  │      │
│    └──────────────────────────────────┘      │
│                                              │
│ 🤖 Also — that in-person visit is a great  │
│    Persuasion story for interviews. Want    │
│    me to develop it?                        │
│                                              │
│ ┌──────────────────────────────────────┐    │
│ │ [chat input.........................] │    │
│ └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

**Coach behavior on this panel:**

The coach conversation is **scoped to this bullet**. When the section first renders (or when the user first scrolls to it), the coach auto-generates an opening message based on the bullet text + issue flags + any existing node data. The opening message should:

1. Acknowledge what the bullet already communicates
2. Identify the specific gap ("I need to know the outcome" or "What was the hardest part?" or "What did you learn from this?")
3. Ask ONE focused question — not a list of 5 questions

**Coach rewrite suggestions** appear as special message blocks with their own Apply/Refine buttons (styled differently from instant rewrites — use the terracotta-tinted card style from the design system).

**Bidirectional data flow — THE CRITICAL PART:**

Every coach conversation on a bullet triggers updates across the storyState. The coach's system prompt should instruct it to emit structured update signals alongside its conversational response. When the coach processes a user's reply about a bullet, it should:

1. **Rewrite the bullet** if enough new information was provided → update `resumeState.sections[].entries[].bullets[].text`
2. **Infer qualities** from the conversation → update `decisionArc.nodes[nodeId].positives[]` or `.negatives[]`
3. **Identify or develop a story** → create or update an entry in `decisionArc.nodes[nodeId].impactStories[]`
4. **Tag the IMPACT type** → assign I/M/P/A/C/T to the developing story
5. **Update the Stepping Stone** → fill in answerFirst, actions, tension, resolution as they emerge from conversation

The user never explicitly says "update my Decision Arc." The system does structural work in the background. This is the core philosophy: **the chatbot coaches, it doesn't fill templates.**

**Implementation approach for bidirectional updates:**

The coach's response should include a structured JSON block (hidden from the user, parsed by the client) alongside the conversational text. Example:

```json
{
  "message": "That's the real story — cold outreach plus in-person persuasion...",
  "rewriteSuggestion": "Sourced 30+ dental M&A targets via NPI data and cold outreach, personally converting 2 to Expression-of-Interest clients through in-person practice visits",
  "stateUpdates": [
    {
      "target": "decisionArc.nodes.krg.positives",
      "action": "add",
      "value": "Learned that trust and rapport matter more than data in deal origination"
    },
    {
      "target": "decisionArc.nodes.krg.impactStories.krg-2",
      "action": "update",
      "value": {
        "type": "P",
        "status": "draft",
        "nickname": "Cold Outreach → 2 EOI Clients",
        "steppingStone": {
          "answerFirst": "Brought 2 Expression-of-Interest clients to the table through cold outreach and in-person persuasion",
          "actions": ["Built market map in Atlanta", "Cold emailed using dental broker networks", "Visited local dentist in person"],
          "tension": "",
          "resolution": ""
        },
        "ibConnection": "Persuasion with data backing — exactly how you pitch in IB"
      }
    }
  ]
}
```

The client parses this, applies the state updates to `storyState`, and persists to Supabase. The user sees only the conversational message and the rewrite suggestion.

### Section 5: Linked Story Card

```
┌─────────────────────────────────────────────┐
│ LINKED STORY                                 │
│                                              │
│ P  Persuasion    Cold Outreach → 2 EOI       │
│    ████████░░░░  Stepping Stone 3/4           │
│                                              │
│    [View in Story Bank →]  [Develop Further] │
└──────────────────────────────────────────────┘
```

- This card appears **after the coach conversation develops a story** (i.e., when `bullet.linkedStoryId` is set and the linked story has at least an answerFirst filled in)
- Shows: IMPACT pill, story nickname, Stepping Stone progress bar, and links to the Story Bank tab or to continue developing the story
- This is the "aha moment" where the user realizes their resume work is building interview prep

---

## Resume Document Rendering

### Visual Design

The resume should look as close as possible to a real IB resume rendered on a white page. This is NOT a rich text editor — it's a **read-only display with clickable bullets**.

```
┌─ White card (#fff), subtle shadow, on cream canvas ──┐
│                                                       │
│              LANDON CHASE BRICE                        │
│  3018 Cayon Links Dr | Park City, UT | (404) 345-4915│
│  landonbrice@uchicago.edu                             │
│                                                       │
│  ─────────────────────────────────────────────────    │
│  EDUCATION                                            │
│  The University of Chicago          Chicago, IL       │
│  Bachelor of Arts in Economics...   Expected Spr 2028 │
│  ▪ Cumulative GPA: 3.74/4.00 | Academic All-UAA...  │
│  ▪ Relevant Coursework: Financial Accounting...      │
│                                                       │
│  ─────────────────────────────────────────────────    │
│  EXPERIENCE                                           │
│  Cimarron Healthcare Capital    Salt Lake City, UT    │
│  Incoming PE Summer Analyst          Summer 2026      │
│                                                       │
│  King's Ransom Group              Los Angeles, CA     │
│  M&A Healthcare Intern               Summer 2025     │
│  ▪ [clickable bullet with hover state]               │
│  ▪ [clickable bullet with hover state]               │
│  ▪ [clickable bullet with hover state]               │
│                                                       │
│  ...                                                  │
└───────────────────────────────────────────────────────┘
```

**Bullet hover states:**
- Default: no visible indicator (looks like regular resume text)
- Hover: left-border appears (2px, color depends on status):
  - Untouched: `#e8e4dc` (cream-1, subtle)
  - Reviewed: `#d97706` (amber — needs work)
  - Rewritten: `#22c55e` (green — strong)
- The hover state also shows a subtle background tint matching the border color at ~5% opacity
- Cursor changes to pointer on bullet hover

**Bullet status indicators (always visible, small):**
- A tiny colored dot (4px) on the left edge of each bullet, visible at all times:
  - Untouched: no dot
  - Reviewed (coach looked at it but no rewrite applied): amber dot
  - Rewritten: green dot

### Compressed Resume (Workshop Mode)

When the workshop opens, the resume compresses to ~40% width. At this size:
- Font sizes scale down proportionally (maybe 85-90% of default)
- The document is still readable but clearly secondary to the workshop
- The active bullet is highlighted with a **terracotta left-border (3px)** and a terracotta background tint
- All other bullets remain clickable (clicking switches the workshop to that bullet)
- Scrolling the compressed resume is independent of scrolling the workshop

---

## Resume Upload & Parse Flow

### Step 1: Upload

User uploads a PDF or DOCX file. The UI shows a drop zone on the cream canvas:

```
┌─────────────────────────────────────┐
│                                     │
│     Drop your resume here           │
│     or click to upload              │
│                                     │
│     PDF or DOCX · 1 page            │
│                                     │
└─────────────────────────────────────┘
```

### Step 2: Parse

The uploaded file is parsed to extract:
- Raw text content (preserving section structure)
- Section boundaries (Education, Experience, Leadership, Skills)
- Entry structure (org, title, location, dates per experience)
- Individual bullet texts
- Basic formatting metadata (fonts detected, approximate margins, page count)

This parsing populates `resumeState.sections[]` with the full entry/bullet structure.

### Step 3: Render + Score

The parsed resume renders as the white document on cream canvas. Simultaneously:
- **Template compliance check** runs (rules-based, per Resume_Template_Checker.md)
- **Bullet scoring** runs on each bullet (verb strength, quantification, length, specificity)
- **Overall quality score** calculates (weighted across all dimensions)
- Results display as the compliance badge + score summary

### Step 4: Draft Decision Arc (Background)

While the user is looking at their rendered resume, the system also generates a **draft Decision Arc** in the background. This is the Phase 0 inference from the direction doc — the LLM reverse-engineers nodes, tentative +/- qualities, and threads from the resume content.

The draft arc populates `storyState.decisionArc` with:
- A node for each experience entry (KRG, AMD, Baseball, IDP, etc.)
- Tentative positives/negatives (qualities inferred, NOT bullet restates — see direction doc for the critical correction on this)
- Tentative threads connecting nodes
- Empty IMPACT story shells where the coach can infer story potential

This happens asynchronously. The user doesn't see the arc until they visit the Decision Arc tab — but when they do, it's already populated. The "magic moment."

---

## Template Compliance & Scoring Display

### Compliance Badge

A small badge in the top-right area of the resume document (or floating above it):

```
┌────────────────────┐
│  ✓ PASS            │    ← green badge
│  Template: Classic │
└────────────────────┘

┌────────────────────┐
│  ⚠ REVISE          │    ← amber badge
│  3 issues found    │
└────────────────────┘

┌────────────────────┐
│  ✕ REJECT          │    ← red badge
│  Structure issues  │
└────────────────────┘
```

Clicking the badge opens an expandable panel showing the full compliance details (section order, font, margins, prohibited elements, etc.).

### Quality Score

A circular score indicator (like Resume Worded's 79/100 ring) in the top-left area or below the compliance badge:

```
  ┌───┐
  │ 72│  ← number inside a circular progress ring
  └───┘
  OVERALL
```

Below it, a mini breakdown (expandable):
- Structure: 85/100
- Formatting: 90/100
- Content Quality: 65/100
- Quantification: 60/100
- Consistency: 80/100

The score updates in real time as bullets are rewritten. This is the "score goes up" dopamine loop.

---

## Bottom Bar Actions

The bottom bar shows actions relevant to the Resume tab:

```
┌──────────────────────────────────────────────────────┐
│ [Score Resume] [Check Verbs] [Template Check] [Export]│
└──────────────────────────────────────────────────────┘
```

- **Score Resume**: Triggers a full re-score of the resume (compliance + quality). Updates the badge and score display. Useful after manual edits.
- **Check Verbs**: Highlights all bullet verbs on the resume with color coding (green = strong, amber = moderate, red = weak). A quick visual scan.
- **Template Check**: Opens an overlay/panel showing the full compliance report from Resume_Template_Checker.md.
- **Export**: Generates a downloadable resume file. Two template options: Classic (Times New Roman) and Modern-Clean (Calibri/Arial). Opens a small selector modal. Export uses the current bullet texts (including any rewrites applied).

---

## Coach System Prompt Context (Resume Tab)

When the coach is operating within a bullet workshop, its system prompt should include:

```
You are coaching a candidate on their investment banking resume. You are currently focused on a specific bullet point.

CONTEXT:
- Experience: {entry.org}, {entry.title}, {entry.dates}
- Current bullet text: "{bullet.text}"
- Issue flags: {bullet.score issues}
- Decision Arc node data (if exists): {node.positives, node.negatives, existing stories}
- Candidate profile: {candidateProfile}

YOUR GOALS:
1. Ask focused questions to understand the STORY behind this bullet
2. Produce a rewrite that is specific, quantified, and answer-first
3. Infer qualities the candidate gained from this experience (for the Decision Arc)
4. Identify if a story is forming (for the Story Bank / IMPACT categorization)

RULES:
- Ask ONE question at a time, not a list
- Each question should seek: specific actions, measurable outcomes, tensions/challenges, or lessons learned
- When you have enough context, propose a rewrite
- The rewrite should start with a strong action verb and include specific outcomes
- After the rewrite, flag if you've identified a potential IMPACT story and ask if the user wants to develop it
- Emit structured stateUpdates alongside your message (see schema)

DO NOT:
- Restate the bullet back to the user as a question
- Ask generic questions ("tell me more")
- Produce rewrites that are less specific than the original
- Add information the candidate hasn't provided
```

---

## State Management Notes

### Where state lives

- `resumeState` lives inside `storyState` (the single source of truth), persisted to Supabase
- The `workshopBulletId` is local UI state (not persisted — the workshop is a transient view)
- Coach thread messages per bullet ARE persisted (`bullet.coachThread[]`) so conversations survive session breaks
- Bullet rewrites are persisted with timestamps and sources

### State update flow

```
User clicks bullet
  → set workshopBulletId (local state)
  → workshop renders with bullet data from resumeState

User applies instant rewrite
  → update bullet.text in resumeState
  → add to bullet.rewrites[] with source: 'instant'
  → recalculate bullet.score
  → recalculate overall qualityScore
  → persist to Supabase

Coach suggests rewrite (user applies)
  → update bullet.text in resumeState
  → add to bullet.rewrites[] with source: 'coach'
  → apply any stateUpdates from coach response:
    → update decisionArc.nodes[].positives/negatives
    → create/update impactStories
    → link bullet to story (set linkedStoryId)
  → recalculate scores
  → persist to Supabase
```

---

## Implementation Priority Order

### Priority 1: Wire `useCoachSession` into AppShell
The existing hook manages resume state (text, file, html, score, profile, updates) and chat logic. AppShell needs to consume it so data flows to both the Resume tab and Coach Panel.

- Call `useCoachSession()` at the AppShell level
- Pass resume state down to the Resume tab
- Pass chat state to CoachPanel

### Priority 2: Build `ResumeTab` Container with Layout Modes
Build the `ResumeTab` component with both layout modes (default + workshop). The state variable `workshopBulletId` controls which mode is active. Get the transitions working.

- `ResumeTab` manages `workshopBulletId` state
- Default mode: full resume + coach panel visible
- Workshop mode: compressed resume (40%) + BulletWorkshop (60%), coach panel hidden
- Transition animations between modes

### Priority 2.5: Extend Bullet Data Model
Before the workshop can work, the bullet data model in `resumeState` needs to match the schema above. Each bullet needs: `id`, `originalText`, `score`, `linkedStoryId`, `rewrites[]`, `coachThread[]`, `status`.

- Update the resume parser to output this structure
- Ensure Supabase schema accommodates the new fields

### Priority 3: Build `ResumeDocument` Component
Render the parsed resume as a styled white document on cream canvas. Bullets are clickable.

- Restyle from old dark theme to Smoke+Cream (white card on cream canvas, terracotta accents)
- Bullet hover states and status indicators
- Compressed mode rendering (40% width, scaled fonts)
- Active bullet highlighting in workshop mode

### Priority 4: Build `BulletWorkshop` Component
The main interaction surface. Has internal sections: header, current bullet + diagnostics, instant rewrites, coach thread, linked story.

- WorkshopHeader with experience context and bullet navigation
- CurrentBullet with issue flags (rules-based scoring)
- InstantRewrites panel with live preview on the compressed resume
- Apply/Regenerate flow with score updates

### Priority 5: Integrate Coach Thread into Workshop
Replace the generic CoachPanel chat with a bullet-scoped coach conversation embedded in the workshop.

- Coach conversation powered by `useCoachSession` but scoped to the active bullet
- System prompt includes bullet context, experience data, and Decision Arc node data
- Coach responses parsed for both conversational text AND structured stateUpdates
- Bidirectional data flow: conversation updates resumeState + decisionArc simultaneously

### Priority 6: Wire Bottom Bar Actions
Connect Score Resume, Check Verbs, Template Check, and Export to their respective flows.

### Priority 7: Linked Story Card
The story card that appears in the workshop after a coach conversation develops an IMPACT story. Links to the Story Bank tab.

---

## Design Tokens (Quick Reference)

All tokens from the design system in `IB_RECRUITING_OS_DIRECTION.md`:

```
Smoke:    #2a2826    (app shell, nav, bottom bar)
Smoke+1:  #353230    (coach panel bg, elevated dark cards)
Smoke+2:  #46423f    (hover on dark surfaces)
Cream:    #f0ece4    (workspace canvas)
Cream-1:  #e8e4dc    (borders on cream, dividers)
White:    #ffffff    (cards, documents, modals)
Terracotta: #d4845a  (primary accent — CTAs, active states, links)
Amber:    #d97706    (warnings, needs-attention indicators)
Green:    #22c55e    (success, strong bullets, positive states)
Red:      #ef4444    (error, weak bullets, negative states)

Font: Space Grotesk / Geist, -apple-system, sans-serif
Border radius: 10-12px cards, 5-6px buttons
Cream canvas inset: 10px margin inside dark shell, 10px border-radius
```

---

## What This Spec Does NOT Cover (Intentionally Deferred)

- **Pricing / free tier gating**: Build the full experience first. Gate later.
- **Landing page**: Separate workstream.
- **Cover Letter / Targets tabs**: Depend on Story Bank being populated, which this drives.
- **Mobile view**: Desktop-first per direction doc.
- **Export template files**: Brice to provide polished template files separately.
- **Resume upload from URL / LinkedIn import**: Future enhancement. PDF/DOCX upload only for v1.

---

## Reconciliation with Claude Code's Current Plan

Claude Code identified 4 priorities. Here's how they map to this spec:

| Claude Code Priority | This Spec | Status |
|---------------------|-----------|--------|
| P1: Wire useCoachSession into AppShell | Priority 1 (same) | Keep as-is |
| P2: Render ResumePanel in Resume tab | Priority 2 + 3 (split into container + document) | **Modified** — don't drop existing ResumePanel as-is. Build ResumeTab with dual layout modes from the start. Restyle ResumeDocument to Smoke+Cream. |
| P3: Activate CoachPanel | Priority 5 (coach lives IN the workshop, not the sidebar) | **Changed** — the generic CoachPanel sidebar is NOT the coaching surface for the Resume tab. Build the coach thread inside BulletWorkshop instead. CoachPanel sidebar hides when workshop is open. |
| P4: Wire BottomBar actions | Priority 6 (same) | Keep as-is |
| (new) Extend bullet data model | Priority 2.5 | **Added** |
| (new) Build BulletWorkshop | Priority 4 | **Added** |
| (new) Linked Story Card | Priority 7 | **Added** |

**Key correction for Claude Code:** Do NOT build the Resume tab with the coach as a persistent right-side panel. The coach conversation for bullet work lives INSIDE the BulletWorkshop. The generic CoachPanel collapses/hides when the workshop is open. This is a different interaction model than the other tabs — the Resume tab subsumes the coach into the workspace.

---

## End of Spec

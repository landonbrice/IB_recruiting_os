# UX Pass — 2026-03-10

## Goal
Make the product feel like a polished IB coaching web app (not a generic “upload to LLM” flow), while keeping existing scoring metrics unchanged.

## Product Decisions
1. **Default experience set to Theme B (“The Platform”)**
   - Rationale: three-column SaaS layout (resume + coaching chat + score panel) feels more sellable/professional for IB students.
   - Constraint respected: no scoring metric logic changed.

2. **Upload flow upgraded to feel like onboarding, not raw file parsing**
   - Added visible parse/loading state.
   - Added explicit “What happens next” panel to communicate value quickly.
   - Added clean error fallback messaging for parse failures.

3. **Chat UI elevated to professional coach style**
   - Assistant messages now render in clear coach cards/bubbles with stronger visual hierarchy.
   - User messages remain distinct but cleaner.
   - Added quick prompt chips for high-value actions (score, rewrite, networking).

## Files Edited

### 1) `src/lib/uiConfig.ts`
- Changed default UI fallback from `"a"` to `"b"`.
- Updated inline comment to match new default.

### 2) `src/themes/ThemeB.tsx`
- **Upload state improvements**
  - Added `isUploading` and `uploadError` state.
  - Added spinner/loading copy while resume parsing runs.
  - Added user-friendly upload error message.
  - Added right-side onboarding card: 3-step “What happens next” flow.

- **Chat professionalism upgrades**
  - Assistant responses now in bordered card-style bubbles with a `Coach` label.
  - User bubbles kept clean and distinct.
  - Empty state rewritten to “Coach is ready” framing.
  - Streaming state now labeled (“Coach is typing”).
  - Added quick-prompt chips above input:
    - Score my resume in plain English
    - Rewrite my weakest bullet
    - Give me 3 concrete networking actions
  - Input placeholder updated to “Message your coach...”.

## Validation
- Ran production build successfully:
  - `npm run build` ✅
  - Build + TypeScript + route generation all passed.

## Explicitly Not Changed
- Scoring schema/weights/categories logic.
- API scoring behavior.
- Core bullet-apply mechanics.

## Suggested Next Iteration
1. Add direct inline “Apply” confirmation toast inside resume panel.
2. Add “before vs after” mini diff view when rewriting bullets.
3. Add session progress rail (Upload → Intake → Score → Edit → Export) for stronger funnel clarity.

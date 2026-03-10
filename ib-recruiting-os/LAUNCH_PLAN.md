# IB Resume Coach — Launch Plan (Web App, not "just an LLM upload")

## Product Positioning
Build a coaching product that feels like a guided system:
- Outcome-first onboarding
- Structured coaching workflow
- Visible progress toward interview-readiness
- Exportable artifacts and action plan

## Current Baseline (shipped in this pass)
- Theme B default (3-column product layout)
- Upgraded upload/onboarding flow
- Coach-style chat UX and quick prompt chips
- Guided outcomes + readiness tracking
- Session persistence and export pack
- Beta gate support

## Launch Version Scope (v1.0)
1. **Perceived Product Quality**
   - Keep score panel always visible
   - Add inline apply feedback + confidence cues
   - Ensure empty/loading/error states look intentional
2. **Outcome Clarity**
   - Session rail: Upload → Intake → Score → Edit → Export
   - Explicit “what you leave with” panel
3. **Trust + Integrity**
   - No-fabrication checks in suggestion flow
   - Better backend error handling and recoverability
4. **Monetization Readiness**
   - Beta gate + invite access
   - Guided outcomes completion as conversion moment

## Immediate Next Build Sprint
- Add inline "Apply" toast in resume edit flow
- Add before/after bullet diff component
- Add mobile tab layout for `/app`
- Add feasibility card UI from `feasibility-score` block
- Add score delta mini-chart in sidebar

## Definition of Ready to Push Public Beta
- End-to-end works reliably across 10+ resume tests
- Candidate can reach a clear readiness state in one session
- Export pack reliably includes resume + story + networking actions
- UX feels like a coaching platform, not a raw prompt wrapper

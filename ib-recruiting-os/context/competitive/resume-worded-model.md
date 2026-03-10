# Competitive Context — Resume Worded Model (Reference)

Purpose: keep a compact, persistent model of what Resume Worded does well so product decisions can reference this without reloading chat history.

## What it does well (product patterns)
1. Immediate value proposition ("score my resume" clarity).
2. Persistent score visibility and progress psychology.
3. Actionable fix lists, not abstract feedback.
4. Fast click-to-improvement loop.
5. Structured examples that show what "good" looks like.
6. Productized UX (modules/rails) rather than open-ended chat.

## How Louis IB Coach should translate this
- Keep resume visible while coaching actions run.
- Prioritize one-click rewrite actions at experience level.
- Show before/after evidence and confidence/risk metadata.
- Maintain score trend history to show measurable progress.
- Use exemplar-guided generation for bullet style quality.

## Guardrails
- Do not copy proprietary UI/assets/code.
- Borrow interaction patterns and product mechanics only.
- Keep anti-fabrication stance explicit in prompts and UX.

## Current implementation status (2026-03-10)
- [x] Rewrite bubbles above resume
- [x] Before/after inline diff card
- [x] Experience-level action bar
- [x] Score trend mini-chart
- [x] Exemplar-guided bullet generation scaffold
- [ ] Expand exemplar bank to 60+ vetted bullets
- [ ] Add hard plausibility validator before apply

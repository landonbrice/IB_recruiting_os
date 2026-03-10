# Goal — Inline IB Bullet Rewrite Experience

## Product Goal (MVP)
User can view their parsed resume, click into experience bullets, and get context-aware IB-specific rewrites directly in app.

## UX Goal
- Resume is always visible.
- Clicking a bullet opens targeted rewrite flow.
- Suggested rewrites feel like coaching output, not generic LLM text.
- Rewrite feedback appears as lightweight bubbles above the resume (confidence/risk + source context).
- User sees score progression over time (not just current score).

## Build Split

### UI Build
1. Bubble row above resume showing recent applied rewrites.
2. Per-variant labels in bullet modal (confidence + risk).
3. Score trend mini-chart in side score panel.
4. Keep click-to-rewrite loop fast (few taps from bullet to apply).

### Backend Build
1. Suggest endpoint emits structured variant metadata:
   - BULLET
   - CONFIDENCE
   - RISK
2. Session engine stores:
   - rewrite history (before/after + metadata)
   - score history (time series)
3. Preserve context from role/company/section/profile in rewrite generation.

## Future Enhancements
- Inline before/after diff preview chip for each applied rewrite.
- Retrieval layer from vetted high-quality IB bullet exemplars.
- Validator for fabricated or inflated claims before apply.

## Compact Context Pointers
- Competitive model reference: `context/competitive/resume-worded-model.md`
- Build execution log: `LOUIS_BUILD_LOG.md`
- UX pass snapshot: `CHANGELOG-2026-03-10-ux-pass.md`

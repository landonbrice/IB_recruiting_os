# How to Fill In Bank Culture Profiles

The file `src/lib/bankProfiles.ts` has 15 banks scaffolded with placeholder fields marked `[LANDON TODO: ...]`. Once you fill these in, the coaching system prompt will automatically inject bank-specific context when a candidate names a target bank.

## Steps

1. Open `src/lib/bankProfiles.ts`
2. Search for `[LANDON TODO:`
3. For each bank, write 2-3 sentences per field based on your firsthand experience:
   - **culture** — What's the vibe? How intense is it? How does it compare to peers?
   - **whatTheyLookFor** — Beyond GPA, what makes a candidate stand out here?
   - **interviewStyle** — Technical depth, behavioral emphasis, superday structure, curveballs
   - **resumeEmphasis** — What should a resume targeting this bank highlight?
   - **networkingTips** — How does networking actually work at this firm? Alumni culture, who to reach out to, what works
4. `tier` and `knownFor` are already filled in factually — don't change unless wrong
5. Run `npm run build` to verify no syntax errors
6. The system prompt picks up filled data automatically (skips anything still marked TODO)

## What this enables

When a candidate says "I'm targeting Evercore" and the profile update sets `targetBank: "Evercore"`, the chat system prompt will include:

```
## Target Bank Context: Evercore
Tier: elite-boutique
Known for: M&A, Restructuring, Shareholder Advisory
Culture: [your notes]
What they look for: [your notes]
...
```

This is the product's moat — no AI tool can replicate firsthand knowledge of what each bank actually values.

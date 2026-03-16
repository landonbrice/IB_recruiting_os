# IB Recruiting OS (IB Resume Coach)

AI coaching app for investment-banking recruiting.

## What it does
- Resume upload + parsing (`PDF`, `DOC`, `DOCX`)
- Interactive coaching chat (streaming)
- Click-to-rewrite bullets with confidence/risk metadata
- Resume scoring across 5 IB-specific categories
- Session persistence (local storage) + export pack
- Multiple UI themes (`a`, `b`, `c`) with Theme B default

## Stack
- Next.js App Router
- React + TypeScript
- Tailwind CSS
- DeepSeek Chat API via OpenAI SDK-compatible client

## Key routes
- `GET /` landing + upload
- `GET /app` coaching surface
- `POST /api/parse-resume`
- `POST /api/chat`
- `POST /api/suggest`
- `POST /api/beta-auth`

## Setup
```bash
npm install
cp .env.example .env.local
# set DEEPSEEK_API_KEY in .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment
Required:
- `DEEPSEEK_API_KEY`

Optional:
- `NEXT_PUBLIC_UI_VERSION` (`a` | `b` | `c`, default `b`)

## Theme switching
- Runtime (dev): `/app?ui=a|b|c`
- Env default: `NEXT_PUBLIC_UI_VERSION=b`

## Architecture notes
- Session state lives in `src/hooks/useCoachSession.ts`
- Shared SSE stream parser: `src/lib/sse.ts`
- Shared resume structure parser: `src/lib/resumeStructure.ts`
- Protocol parsing: `src/lib/protocolParser.ts`

## Quality gates
- `npm run build` must pass
- Manual smoke test:
  1. Upload resume
  2. Complete intake
  3. Send chat prompt
  4. Rewrite + apply one bullet
  5. Re-score
  6. Export pack

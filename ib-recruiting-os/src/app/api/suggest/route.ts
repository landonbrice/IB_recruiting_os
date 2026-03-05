import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import type { CandidateProfile } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface SuggestRequest {
  bullet: string;
  roleTitle: string;
  company: string;
  section: string;
  candidateProfile: CandidateProfile;
  resumeText: string;
  phase: "question" | "generate";
  question?: string;
  answer?: string;
}

const QUESTION_SYSTEM = `You are a sharp IB recruiting coach. Given a resume bullet and role context, ask ONE targeted question that would unlock a stronger rewrite. Focus on: quantification (deal size, dollar amounts, percentages), strategic framing (what was your specific role vs team), or outcome impact (what was the result). Be concise — one sentence, direct, no fluff. Do not number it or add a prefix.`;

const GENERATE_SYSTEM = `You are an elite IB resume writer. Rewrite the given bullet using the IB bullet formula: [Strong action verb] + [specific action/role] + [deal/dollar size or scope] + [quantified outcome].

Rules:
- Use hard IB keywords: modeled, structured, executed, diligenced, synthesized, underwrote, pitched
- Start each bullet with a different strong verb
- Include specific numbers wherever possible
- Keep each bullet to one tight sentence, max 2 lines
- Return EXACTLY 3 variants
- Each variant must start on its own line beginning with exactly "BULLET: " (capital BULLET, colon, space)
- Do not number them, add explanations, or include any other text`;

export async function POST(req: NextRequest) {
  const body: SuggestRequest = await req.json();
  const { bullet, roleTitle, company, section, candidateProfile, phase, question, answer } = body;

  const profileSummary = Object.keys(candidateProfile).length > 0
    ? `Candidate: ${candidateProfile.stage ?? "unknown stage"}, ${candidateProfile.schoolTier ?? "unknown school tier"}, targeting ${candidateProfile.targetBankTier ?? "IB"}.`
    : "";

  let system: string;
  let userMessage: string;
  let maxTokens: number;

  if (phase === "question") {
    system = QUESTION_SYSTEM;
    userMessage = `${profileSummary}\n\nRole: ${roleTitle} at ${company} (${section})\nCurrent bullet: "${bullet}"\n\nAsk one targeted question:`;
    maxTokens = 512;
  } else {
    system = GENERATE_SYSTEM;
    const answerContext = question && answer
      ? `\n\nClarifying Q: ${question}\nCandidate's answer: ${answer}`
      : "";
    userMessage = `${profileSummary}\n\nRole: ${roleTitle} at ${company} (${section})\nCurrent bullet: "${bullet}"${answerContext}\n\nProvide 3 rewritten variants:`;
    maxTokens = 1024;
  }

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          const data = JSON.stringify({ delta: { text: event.delta.text } });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

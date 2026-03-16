import OpenAI from "openai";
import { NextRequest } from "next/server";
import type { CandidateProfile } from "@/lib/types";
import { getExemplarContext } from "@/lib/ibExemplars";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

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
- For EACH variant output this exact 3-line block format:
  BULLET: <rewritten bullet>
  CONFIDENCE: <High|Medium|Low>
  RISK: <Low|Medium|High>
- Confidence should reflect how well the bullet is specific and quantifiable.
- Risk should reflect likelihood the claim sounds inflated/unsupported.
- Do not number variants or add any other text outside these blocks.`;

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
    const exemplarContext = getExemplarContext(roleTitle, section, 3);
    userMessage = `${profileSummary}\n\nRole: ${roleTitle} at ${company} (${section})\nCurrent bullet: "${bullet}"${answerContext}\n\nReference style examples (for structure/tone only, never copy):\n${exemplarContext}\n\nProvide 3 rewritten variants:`;
    maxTokens = 1024;
  }

  try {
    const stream = await client.chat.completions.create({
      model: "deepseek-chat",
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
      stream: true,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              const data = JSON.stringify({ delta: { text } });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          // Most common: client disconnected mid-stream; avoid noisy failures.
          const msg = err instanceof Error ? err.message : String(err);
          if (!/aborted|closed|cancel/i.test(msg)) {
            console.error("/api/suggest stream error:", err);
          }
          try {
            controller.close();
          } catch {
            // noop
          }
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("/api/suggest error:", err);
    return new Response(JSON.stringify({ error: "Suggest request failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

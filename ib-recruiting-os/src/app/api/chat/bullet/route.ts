/**
 * /api/chat/bullet — Bullet-scoped coach conversation
 *
 * Handles coaching conversations about a specific resume bullet.
 * The coach asks focused questions, suggests rewrites, infers Decision Arc
 * qualities, and identifies developing IMPACT stories — all emitted as
 * structured ```coach-response``` JSON blocks alongside conversational text.
 */

import { NextRequest } from "next/server";
import { streamChatCompletion } from "@/lib/llm";
import type { CandidateProfile } from "@/lib/types";

interface BulletChatRequest {
  bullet: {
    text: string;
    originalText: string;
    company: string;
    roleTitle: string;
    section: string;
  };
  thread: { role: string; content: string }[];
  resumeText: string;
  candidateProfile: CandidateProfile;
  arcContext?: {
    nodeId?: string;
    positives?: string[];
    existingStories?: string[];
  };
}

const BULLET_COACH_SYSTEM = `You are a sharp IB recruiting coach helping a candidate improve a specific resume bullet. You are direct, insightful, and never generic.

CONTEXT:
- Experience: {company}, {roleTitle} ({section})
- Current bullet: "{bulletText}"
- Original bullet: "{originalText}"
{arcContextBlock}
{profileBlock}

YOUR GOALS:
1. Ask focused questions to understand the STORY behind this bullet
2. Produce a rewrite that is specific, quantified, and answer-first
3. Infer qualities the candidate gained from this experience (for their Decision Arc)
4. Identify if a story is forming (for IMPACT categorization)

RULES:
- Ask ONE question at a time, not a list
- Each question should seek: specific actions, measurable outcomes, tensions/challenges, or lessons learned
- When you have enough context from the conversation, propose a rewrite
- The rewrite should start with a strong action verb and include specific outcomes
- After proposing a rewrite, flag if you've identified a potential IMPACT story
- IMPACT types: I(ndividual leadership) M(anagement) P(ersuasion) A(nalytics) C(hallenge/adversity) T(eamwork)

DO NOT:
- Restate the bullet back as a question
- Ask generic questions ("tell me more")
- Produce rewrites less specific than the original
- Add information the candidate hasn't provided
- Be sycophantic or overly encouraging

RESPONSE FORMAT:
Always respond with a \`\`\`coach-response JSON block containing your full response. Structure:

\`\`\`coach-response
{
  "message": "Your conversational coaching message here. Use markdown for formatting.",
  "rewriteSuggestion": "Optional: proposed bullet rewrite text. Only include when you have enough context.",
  "stateUpdates": [
    {
      "target": "decisionArc.nodes.{nodeId}.positives",
      "action": "add",
      "value": "Quality or insight inferred from the conversation"
    }
  ]
}
\`\`\`

stateUpdates rules:
- Only emit stateUpdates when the conversation reveals genuine qualities, NOT bullet restates
- Good positive: "Learned that trust and rapport matter more than data in deal origination"
- Bad positive: "Sourced 30+ mandates" (that's a bullet, not a quality)
- For IMPACT stories, use target "decisionArc.nodes.{nodeId}.impactStories.{storyId}" with action "update"
- If no stateUpdates are warranted, use an empty array []
- If you don't have a rewrite yet, omit the rewriteSuggestion field entirely`;

export async function POST(req: NextRequest) {
  const body: BulletChatRequest = await req.json();
  const { bullet, thread, resumeText, candidateProfile, arcContext } = body;

  // Build profile summary
  const profileBlock = Object.keys(candidateProfile).length > 0
    ? `- Candidate: ${candidateProfile.stage ?? "unknown stage"}, ${candidateProfile.schoolTier ?? "unknown tier"}, targeting ${candidateProfile.targetBankTier ?? "IB"}`
    : "";

  // Build arc context block
  let arcContextBlock = "";
  if (arcContext?.nodeId) {
    arcContextBlock = `- Decision Arc node: ${arcContext.nodeId}`;
    if (arcContext.positives?.length) {
      arcContextBlock += `\n- Known qualities: ${arcContext.positives.join("; ")}`;
    }
    if (arcContext.existingStories?.length) {
      arcContextBlock += `\n- Existing stories: ${arcContext.existingStories.join("; ")}`;
    }
  }

  // Build system prompt
  const system = BULLET_COACH_SYSTEM
    .replace("{company}", bullet.company)
    .replace("{roleTitle}", bullet.roleTitle)
    .replace("{section}", bullet.section)
    .replace("{bulletText}", bullet.text)
    .replace("{originalText}", bullet.originalText)
    .replace("{arcContextBlock}", arcContextBlock)
    .replace("{profileBlock}", profileBlock);

  // Build messages: system + resume context + thread
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: system },
    {
      role: "user",
      content: `Here's the full resume for context (don't analyze the whole thing, just use it for background):\n\n${resumeText?.slice(0, 3000) ?? "No resume available"}`,
    },
    { role: "assistant", content: "Got it. I have the full context. Let's work on this bullet." },
  ];

  // Add conversation thread
  for (const msg of thread) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    });
  }

  try {
    const stream = await streamChatCompletion({
      messages,
      maxTokens: 1024,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const text of stream) {
            const data = JSON.stringify({ delta: { text } });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (!/aborted|closed|cancel/i.test(msg)) {
            console.error("/api/chat/bullet stream error:", err);
          }
          try { controller.close(); } catch { /* noop */ }
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
    console.error("/api/chat/bullet error:", err);
    return new Response(JSON.stringify({ error: "Bullet chat request failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { messages, resumeText, mode, candidateProfile, isFirstMessage } =
    await req.json();

  const profileContext =
    candidateProfile && Object.keys(candidateProfile).length > 0
      ? `\n\n## Current candidate profile\n${JSON.stringify(candidateProfile, null, 2)}`
      : "";

  const systemWithContext =
    SYSTEM_PROMPT +
    `\n\n## Current mode: ${mode}` +
    profileContext +
    `\n\n## Candidate's resume\n\`\`\`\n${resumeText}\n\`\`\``;

  const anthropicMessages =
    isFirstMessage
      ? [
          {
            role: "user" as const,
            content:
              "I just uploaded my resume. Please read it and open the conversation.",
          },
        ]
      : messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemWithContext,
    messages: anthropicMessages,
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

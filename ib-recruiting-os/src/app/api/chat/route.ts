import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing ANTHROPIC_API_KEY" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });
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

    const anthropicMessages = isFirstMessage
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
        try {
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
        } catch (streamErr) {
          console.error("Stream error:", streamErr);
          const errData = JSON.stringify({ error: "Stream failed" });
          controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
          controller.close();
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
    console.error("/api/chat error:", err);
    return NextResponse.json({ error: "Chat request failed" }, { status: 500 });
  }
}

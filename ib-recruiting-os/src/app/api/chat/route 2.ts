import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT, getBankContext } from "@/lib/systemPrompt";
import { streamChatCompletion, getProviderInfo } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const { provider } = getProviderInfo();
    const keyVar = provider === "anthropic" ? "ANTHROPIC_API_KEY" : "DEEPSEEK_API_KEY";
    if (!process.env[keyVar]) {
      return NextResponse.json(
        { error: `Missing ${keyVar}` },
        { status: 500 }
      );
    }

    const { messages, resumeText, mode, candidateProfile, isFirstMessage } =
      await req.json();

    const profileContext =
      candidateProfile && Object.keys(candidateProfile).length > 0
        ? `\n\n## Current candidate profile\n${JSON.stringify(candidateProfile, null, 2)}`
        : "";

    const bankContext = getBankContext(candidateProfile?.targetBank);

    const systemWithContext =
      SYSTEM_PROMPT +
      `\n\n## Current mode: ${mode}` +
      profileContext +
      bankContext +
      `\n\n## Candidate's resume\n\`\`\`\n${resumeText}\n\`\`\``;

    const chatMessages = isFirstMessage
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

    const stream = await streamChatCompletion({
      messages: [
        { role: "system", content: systemWithContext },
        ...chatMessages,
      ],
      maxTokens: 1024,
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
        } catch (streamErr) {
          const msg = streamErr instanceof Error ? streamErr.message : String(streamErr);
          if (!/aborted|closed|cancel/i.test(msg)) {
            console.error("/api/chat stream error:", streamErr);
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
    console.error("/api/chat error:", err);
    return NextResponse.json({ error: "Chat request failed" }, { status: 500 });
  }
}
